import { CreatePipelineSchema, UpdatePipelineSchema } from '../types.js';
export async function handlePipelineTool(request, supabase) {
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
            content: [
                {
                    type: 'text',
                    text: `Pipeline "${data.name}" created successfully`,
                },
            ],
            structuredContent: { pipelines: [data] },
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
            content: [
                {
                    type: 'text',
                    text: `Retrieved pipeline: ${data.name}`,
                },
            ],
            structuredContent: { pipelines: [data] },
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
            content: [
                {
                    type: 'text',
                    text: `Found ${data?.length || 0} pipeline(s)`,
                },
            ],
            structuredContent: { pipelines: data || [] },
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
            content: [
                {
                    type: 'text',
                    text: `Pipeline "${data.name}" updated successfully`,
                },
            ],
            structuredContent: { pipelines: [data] },
        };
    }
    // Delete Pipeline
    if (request.params.name === 'delete_pipeline') {
        const id = request.params.arguments.id;
        // Get deals for this pipeline
        const { data: deals } = await supabase
            .from('deals')
            .select('id')
            .eq('pipeline_id', id);
        const dealIds = deals?.map(d => d.id) || [];
        // Get interactions for these deals
        const allInteractionIds = [];
        if (dealIds.length > 0) {
            const { data: interactions } = await supabase
                .from('interactions')
                .select('id')
                .in('deal_id', dealIds);
            if (interactions) {
                allInteractionIds.push(...interactions.map(i => i.id));
            }
        }
        // Delete embeddings for interactions
        const uniqueInteractionIds = [...new Set(allInteractionIds)];
        if (uniqueInteractionIds.length > 0) {
            await supabase
                .from('embeddings')
                .delete()
                .eq('source_table', 'interactions')
                .in('source_id', uniqueInteractionIds);
        }
        // Delete interactions for deals
        if (dealIds.length > 0) {
            await supabase
                .from('interactions')
                .delete()
                .in('deal_id', dealIds);
        }
        // Delete embeddings for deals
        if (dealIds.length > 0) {
            await supabase
                .from('embeddings')
                .delete()
                .eq('source_table', 'deals')
                .in('source_id', dealIds);
        }
        // Delete deals
        if (dealIds.length > 0) {
            const { error: dealsError } = await supabase
                .from('deals')
                .delete()
                .eq('pipeline_id', id);
            if (dealsError) {
                return {
                    content: [{ type: 'text', text: `Error deleting deals: ${dealsError.message}` }],
                    isError: true,
                };
            }
        }
        // Delete pipeline
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
        // Fetch remaining pipelines to return in structuredContent
        const { data: allPipelines } = await supabase.from('pipelines').select('*');
        return {
            content: [
                {
                    type: 'text',
                    text: `Pipeline deleted successfully`,
                },
            ],
            structuredContent: { pipelines: allPipelines || [] },
        };
    }
    return null;
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
    },
    {
        name: 'list_pipelines',
        description: 'List all pipelines',
        inputSchema: {
            type: 'object',
            properties: {},
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
    },
];
//# sourceMappingURL=pipelines.js.map