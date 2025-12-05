import { SupabaseClient } from '@supabase/supabase-js';
import { CreateInteractionSchema, UpdateInteractionSchema } from '../types.js';

export async function handleInteractionTool(request: any, supabase: SupabaseClient) {
    // Create Interaction
    if (request.params.name === 'create_interaction') {
        const args = CreateInteractionSchema.parse(request.params.arguments);

        const { data, error } = await supabase
            .from('interactions')
            .insert({
                type: args.type,
                contact_id: args.contact_id || null,
                deal_id: args.deal_id || null,
                summary: args.summary || null,
                transcript: args.transcript || null,
                audio_url: args.audio_url || null,
                sentiment: args.sentiment || null,
            })
            .select()
            .single();

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
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
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
    }

    // List Interactions
    if (request.params.name === 'list_interactions') {
        const { contact_id, deal_id, type } = request.params.arguments || {};

        let query = supabase.from('interactions').select('*');

        if (contact_id) query = query.eq('contact_id', contact_id);
        if (deal_id) query = query.eq('deal_id', deal_id);
        if (type) query = query.eq('type', type);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
    }

    // Update Interaction
    if (request.params.name === 'update_interaction') {
        const args = UpdateInteractionSchema.parse(request.params.arguments);
        const { id, ...updates } = args;

        const { data, error } = await supabase
            .from('interactions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
    }

    // Delete Interaction
    if (request.params.name === 'delete_interaction') {
        const id = request.params.arguments.id;

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

        return {
            content: [{ type: 'text', text: `Interaction ${id} deleted successfully` }],
        };
    }

    return null;
}

export const interactionToolDefinitions = [
    {
        name: 'create_interaction',
        description: 'Log a new interaction (call, meeting, email, or note)',
        inputSchema: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: ['call', 'meeting', 'email', 'note'], description: 'Interaction type' },
                contact_id: { type: 'string', description: 'Associated contact UUID' },
                deal_id: { type: 'string', description: 'Associated deal UUID' },
                summary: { type: 'string', description: 'Brief summary' },
                transcript: { type: 'string', description: 'Full transcript or notes' },
                audio_url: { type: 'string', description: 'URL to audio recording' },
                sentiment: { type: 'string', description: 'Sentiment analysis result' },
            },
            required: ['type'],
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
