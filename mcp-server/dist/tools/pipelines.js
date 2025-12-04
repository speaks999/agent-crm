import { CreatePipelineSchema, UpdatePipelineSchema, } from '../types.js';
export function registerPipelineTools(server, supabase) {
    server.setRequestHandler('tools/call', async (request) => {
        // Create Pipeline
        if (request.params.name === 'create_pipeline') {
            const args = CreatePipelineSchema.parse(request.params.arguments);
            const { data, error } = await supabase
                .from('pipelines')
                .insert({
                name: args.name,
                stages: args.stages,
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
        // Get Pipeline
        if (request.params.name === 'get_pipeline') {
            const id = request.params.arguments.id;
            const { data, error } = await supabase
                .from('pipelines')
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
        // List Pipelines
        if (request.params.name === 'list_pipelines') {
            const { data, error } = await supabase
                .from('pipelines')
                .select('*');
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
        // Update Pipeline
        if (request.params.name === 'update_pipeline') {
            const args = UpdatePipelineSchema.parse(request.params.arguments);
            const { id, ...updates } = args;
            const { data, error } = await supabase
                .from('pipelines')
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
        // Delete Pipeline
        if (request.params.name === 'delete_pipeline') {
            const id = request.params.arguments.id;
            const { error } = await supabase
                .from('pipelines')
                .delete()
                .eq('id', id);
            if (error) {
                return {
                    content: [{ type: 'text', text: `Error: ${error.message}` }],
                    isError: true,
                };
            }
            return {
                content: [{ type: 'text', text: `Pipeline ${id} deleted successfully` }],
            };
        }
    });
}
export const pipelineToolDefinitions = [
    {
        name: 'create_pipeline',
        description: 'Create a new sales pipeline with stages',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Pipeline name' },
                stages: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of pipeline stages (e.g., ["Lead", "Discovery", "Proposal", "Closed"])'
                },
            },
            required: ['name', 'stages'],
        },
        _meta: {
            'openai/toolInvocation/invoking': 'Creating pipeline...',
            'openai/toolInvocation/invoked': 'Pipeline created successfully',
        },
    },
    {
        name: 'get_pipeline',
        description: 'Retrieve a specific pipeline by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Pipeline UUID' },
            },
            required: ['id'],
        },
        _meta: {
            'openai/toolInvocation/invoking': 'Retrieving pipeline...',
            'openai/toolInvocation/invoked': 'Pipeline retrieved',
        },
    },
    {
        name: 'list_pipelines',
        description: 'List all pipelines',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        _meta: {
            'openai/toolInvocation/invoking': 'Loading pipelines...',
            'openai/toolInvocation/invoked': 'Pipelines loaded',
        },
    },
    {
        name: 'update_pipeline',
        description: 'Update an existing pipeline',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Pipeline UUID' },
                name: { type: 'string', description: 'Pipeline name' },
                stages: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of pipeline stages'
                },
            },
            required: ['id'],
        },
        _meta: {
            'openai/toolInvocation/invoking': 'Updating pipeline...',
            'openai/toolInvocation/invoked': 'Pipeline updated',
        },
    },
    {
        name: 'delete_pipeline',
        description: 'Delete a pipeline from the CRM',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Pipeline UUID' },
            },
            required: ['id'],
        },
        _meta: {
            'openai/toolInvocation/invoking': 'Deleting pipeline...',
            'openai/toolInvocation/invoked': 'Pipeline deleted',
        },
    },
];
//# sourceMappingURL=pipelines.js.map