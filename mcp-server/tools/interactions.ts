import { SupabaseClient } from '@supabase/supabase-js';
import { CreateInteractionSchema, UpdateInteractionSchema } from '../types.js';

export async function handleInteractionTool(request: any, supabase: SupabaseClient) {
    // Create Interaction
    if (request.params.name === 'create_interaction') {
        const args = CreateInteractionSchema.parse(request.params.arguments);

        // Use title as fallback for summary, description as fallback for transcript
        const summary = args.summary || args.title || null;
        const transcript = args.transcript || args.description || null;

        // Build insert object, only including fields that have values
        // This avoids errors if optional columns like due_date don't exist yet
        const insertData: Record<string, any> = {
            type: args.type,
            summary: summary,
        };
        
        if (args.contact_id) insertData.contact_id = args.contact_id;
        if (args.deal_id) insertData.deal_id = args.deal_id;
        if (transcript) insertData.transcript = transcript;
        if (args.audio_url) insertData.audio_url = args.audio_url;
        if (args.sentiment) insertData.sentiment = args.sentiment;
        if (args.due_date) insertData.due_date = args.due_date;
        if (args.assigned_to) insertData.assigned_to = args.assigned_to;
        if (args.team_id) insertData.team_id = args.team_id;

        const { data, error } = await supabase
            .from('interactions')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} interaction created successfully`,
                },
            ],
            structuredContent: { interactions: [data] },
        };
    }

    // Get Interaction
    if (request.params.name === 'get_interaction') {
        const id = request.params.arguments.id;

        const { data, error } = await supabase
            .from('interactions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `Retrieved ${data.type} interaction`,
                },
            ],
            structuredContent: { interactions: [data] },
        };
    }

    // List Interactions
    if (request.params.name === 'list_interactions') {
        const { contact_id, deal_id, type, assigned_to, team_id } = request.params.arguments || {};

        let query = supabase.from('interactions').select('*');

        if (team_id) query = query.eq('team_id', team_id);
        if (contact_id) query = query.eq('contact_id', contact_id);
        if (deal_id) query = query.eq('deal_id', deal_id);
        if (type) query = query.eq('type', type);
        if (assigned_to) query = query.eq('assigned_to', assigned_to);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${data?.length || 0} interaction(s)`,
                },
            ],
            structuredContent: { interactions: data || [] },
        };
    }

    // Update Interaction
    if (request.params.name === 'update_interaction') {
        const args = UpdateInteractionSchema.parse(request.params.arguments);
        const { id, ...updates } = args;

        // Handle assigned_to - allow null to unassign
        const updateData: any = { ...updates };
        const hasAssignedTo = 'assigned_to' in updates;
        if (!hasAssignedTo) {
            delete updateData.assigned_to;
        }

        // First check if the interaction exists
        const { data: existing, error: fetchError } = await supabase
            .from('interactions')
            .select('id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            return {
                content: [{ type: 'text', text: `Error: ${fetchError.message}` }],
                isError: true,
            };
        }

        if (!existing) {
            return {
                content: [{ type: 'text', text: `Error: Interaction with ID ${id} not found` }],
                isError: true,
            };
        }

        // Perform the update
        const { data, error } = await supabase
            .from('interactions')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        const updatedInteraction = data && data.length > 0 ? data[0] : null;

        if (!updatedInteraction) {
            return {
                content: [{ type: 'text', text: `Error: Failed to update interaction` }],
                isError: true,
            };
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `Interaction updated successfully`,
                },
            ],
            structuredContent: { interactions: [updatedInteraction] },
        };
    }

    // Delete Interaction
    if (request.params.name === 'delete_interaction') {
        const id = request.params.arguments.id;

        // Delete embeddings for this interaction
        await supabase
            .from('embeddings')
            .delete()
            .eq('source_table', 'interactions')
            .eq('source_id', id);

        // Delete interaction
        const { error } = await supabase
            .from('interactions')
            .delete()
            .eq('id', id);

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        // Fetch remaining interactions to return in structuredContent
        const { data: allInteractions } = await supabase.from('interactions').select('*');

        return {
            content: [
                {
                    type: 'text',
                    text: `Interaction deleted successfully`,
                },
            ],
            structuredContent: { interactions: allInteractions || [] },
        };
    }

    return null;
}

export const interactionToolDefinitions = [
    {
        name: 'create_interaction',
        description: 'Create a task or log an interaction. Use this to create tasks like "call someone", "schedule meeting", "send email", or "add note". Always provide a title/summary with the task details. If a date/time is mentioned, include it as due_date.',
        inputSchema: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: ['call', 'meeting', 'email', 'note'], description: 'Type: "call" for phone tasks, "meeting" for meetings, "email" for email tasks, "note" for general notes/reminders' },
                title: { type: 'string', description: 'REQUIRED: Task title - e.g. "Call Kale Smith" or "Follow up with client about proposal"' },
                due_date: { type: 'string', description: 'Due date/time in ISO format (YYYY-MM-DDTHH:mm:ss). Convert relative dates like "tomorrow at 5pm" to actual ISO dates.' },
                summary: { type: 'string', description: 'Brief summary (alternative to title)' },
                description: { type: 'string', description: 'Detailed notes or description of the task' },
                transcript: { type: 'string', description: 'Full transcript or detailed notes (alternative to description)' },
                contact_id: { type: 'string', description: 'Associated contact UUID (if known)' },
                deal_id: { type: 'string', description: 'Associated deal UUID (if known)' },
                audio_url: { type: 'string', description: 'URL to audio recording' },
                sentiment: { type: 'string', description: 'Sentiment analysis result' },
                assigned_to: { type: 'string', description: 'Team member UUID to assign this task to' },
                team_id: { type: 'string', description: 'Team ID this interaction belongs to' },
            },
            required: ['type', 'title'],
        },
    },
    {
        name: 'get_interaction',
        description: 'Retrieve a specific interaction by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Interaction UUID' },
            },
            required: ['id'],
        },
    },
    {
        name: 'list_interactions',
        description: 'List interactions with optional filters',
        inputSchema: {
            type: 'object',
            properties: {
                contact_id: { type: 'string', description: 'Filter by contact UUID' },
                deal_id: { type: 'string', description: 'Filter by deal UUID' },
                type: { type: 'string', enum: ['call', 'meeting', 'email', 'note'], description: 'Filter by type' },
                assigned_to: { type: 'string', description: 'Filter by assigned team member UUID' },
                team_id: { type: 'string', description: 'Filter by team ID' },
            },
        },
    },
    {
        name: 'update_interaction',
        description: 'Update an existing interaction',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Interaction UUID' },
                type: { type: 'string', enum: ['call', 'meeting', 'email', 'note'], description: 'Interaction type' },
                contact_id: { type: 'string', description: 'Associated contact UUID' },
                deal_id: { type: 'string', description: 'Associated deal UUID' },
                summary: { type: 'string', description: 'Brief summary' },
                transcript: { type: 'string', description: 'Full transcript or notes' },
                audio_url: { type: 'string', description: 'URL to audio recording' },
                sentiment: { type: 'string', description: 'Sentiment analysis result' },
                assigned_to: { type: ['string', 'null'], description: 'Team member UUID to assign this task to (null to unassign)' },
                team_id: { type: 'string', description: 'Team ID this interaction belongs to' },
            },
            required: ['id'],
        },
    },
    {
        name: 'delete_interaction',
        description: 'Delete an interaction from the CRM',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Interaction UUID' },
            },
            required: ['id'],
        },
    },
];
