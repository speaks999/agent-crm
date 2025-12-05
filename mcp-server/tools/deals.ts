import { SupabaseClient } from '@supabase/supabase-js';
import { CreateDealSchema, UpdateDealSchema } from '../types.js';

export async function handleDealTool(request: any, supabase: SupabaseClient) {
    // Create Deal
    if (request.params.name === 'create_deal') {
        const args = CreateDealSchema.parse(request.params.arguments);

        const { data, error } = await supabase
            .from('deals')
            .insert({
                name: args.name,
                account_id: args.account_id || null,
                pipeline_id: args.pipeline_id || null,
                amount: args.amount || null,
                stage: args.stage,
                close_date: args.close_date || null,
                status: args.status || 'open',
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

    // Get Deal
    if (request.params.name === 'get_deal') {
        const id = request.params.arguments.id;

        const { data, error } = await supabase
            .from('deals')
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

    // List Deals
    if (request.params.name === 'list_deals') {
        const { account_id, pipeline_id, status, stage } = request.params.arguments || {};

        let query = supabase.from('deals').select('*');

        if (account_id) query = query.eq('account_id', account_id);
        if (pipeline_id) query = query.eq('pipeline_id', pipeline_id);
        if (status) query = query.eq('status', status);
        if (stage) query = query.eq('stage', stage);

        const { data, error } = await query;

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

    // Update Deal
    if (request.params.name === 'update_deal') {
        const args = UpdateDealSchema.parse(request.params.arguments);
        const { id, ...updates } = args;

        const { data, error } = await supabase
            .from('deals')
            .update({ ...updates, updated_at: new Date().toISOString() })
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

    // Move Deal Stage
    if (request.params.name === 'move_deal_stage') {
        const { id, stage } = request.params.arguments;

        const { data, error } = await supabase
            .from('deals')
            .update({ stage, updated_at: new Date().toISOString() })
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

    // Close Deal
    if (request.params.name === 'close_deal') {
        const { id, status } = request.params.arguments;

        if (status !== 'won' && status !== 'lost') {
            return {
                content: [{ type: 'text', text: 'Error: Status must be "won" or "lost"' }],
                isError: true,
            };
        }

        const { data, error } = await supabase
            .from('deals')
            .update({ status, updated_at: new Date().toISOString() })
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

    // Delete Deal
    if (request.params.name === 'delete_deal') {
        const id = request.params.arguments.id;

        const { error } = await supabase
            .from('deals')
            .delete()
            .eq('id', id);

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        return {
            content: [{ type: 'text', text: `Deal ${id} deleted successfully` }],
        };
    }

    return null;
}

export const dealToolDefinitions = [
    {
        name: 'create_deal',
        description: 'Create a new deal/opportunity in the CRM',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Deal name' },
                account_id: { type: 'string', description: 'Associated account UUID' },
                pipeline_id: { type: 'string', description: 'Pipeline UUID' },
                amount: { type: 'number', description: 'Deal value' },
                stage: { type: 'string', description: 'Current stage' },
                close_date: { type: 'string', description: 'Expected close date (YYYY-MM-DD)' },
                status: { type: 'string', enum: ['open', 'won', 'lost'], description: 'Deal status' },
            },
            required: ['name', 'stage'],
        },
    },
    {
        name: 'get_deal',
        description: 'Retrieve a specific deal by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Deal UUID' },
            },
            required: ['id'],
        },
    },
    {
        name: 'list_deals',
        description: 'List deals with optional filters',
        inputSchema: {
            type: 'object',
            properties: {
                account_id: { type: 'string', description: 'Filter by account UUID' },
                pipeline_id: { type: 'string', description: 'Filter by pipeline UUID' },
                status: { type: 'string', enum: ['open', 'won', 'lost'], description: 'Filter by status' },
                stage: { type: 'string', description: 'Filter by stage' },
            },
        },
    },
    {
        name: 'update_deal',
        description: 'Update an existing deal',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Deal UUID' },
                name: { type: 'string', description: 'Deal name' },
                account_id: { type: 'string', description: 'Associated account UUID' },
                pipeline_id: { type: 'string', description: 'Pipeline UUID' },
                amount: { type: 'number', description: 'Deal value' },
                stage: { type: 'string', description: 'Current stage' },
                close_date: { type: 'string', description: 'Expected close date (YYYY-MM-DD)' },
                status: { type: 'string', enum: ['open', 'won', 'lost'], description: 'Deal status' },
            },
            required: ['id'],
        },
    },
    {
        name: 'move_deal_stage',
        description: 'Move a deal to a different pipeline stage',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Deal UUID' },
                stage: { type: 'string', description: 'New stage name' },
            },
            required: ['id', 'stage'],
        },
    },
    {
        name: 'close_deal',
        description: 'Close a deal as won or lost',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Deal UUID' },
                status: { type: 'string', enum: ['won', 'lost'], description: 'Closing status' },
            },
            required: ['id', 'status'],
        },
    },
    {
        name: 'delete_deal',
        description: 'Delete a deal from the CRM',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Deal UUID' },
            },
            required: ['id'],
        },
    },
];
