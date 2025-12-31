import { CreatePipelineSchema, UpdatePipelineSchema } from '../types.js';
// Stage colors for pipeline tags
const STAGE_COLORS = [
    '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981',
    '#F59E0B', '#F97316', '#F43F5E', '#EC4899',
    '#6366F1', '#14B8A6'
];
function getStageColor(index) {
    return STAGE_COLORS[index % STAGE_COLORS.length];
}
// Helper function to create stage tags for a pipeline
async function createPipelineStageTags(supabase, pipelineName, stages) {
    const tagsToCreate = stages.map((stage, index) => ({
        tag_name: `${pipelineName} - ${stage}`,
        color: getStageColor(index),
        entity_type: 'pipeline',
    }));
    // Use upsert to handle duplicates gracefully
    await supabase
        .from('tags')
        .upsert(tagsToCreate, {
        onConflict: 'tag_name',
        ignoreDuplicates: false // Update color if tag exists
    });
}
// Helper function to delete old pipeline stage tags
async function deletePipelineStageTags(supabase, pipelineName) {
    await supabase
        .from('tags')
        .delete()
        .like('tag_name', `${pipelineName} - %`);
}
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
        // Create stage tags for the new pipeline
        await createPipelineStageTags(supabase, args.name, args.stages);
        return {
            content: [
                {
                    type: 'text',
                    text: `Pipeline "${data.name}" created successfully with ${args.stages.length} stage tags`,
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
        // Get the old pipeline data to check for name changes
        const { data: oldPipeline } = await supabase
            .from('pipelines')
            .select('*')
            .eq('id', id)
            .single();
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
        // Update stage tags if name or stages changed
        if (oldPipeline && (updates.name || updates.stages)) {
            // Delete old tags if pipeline name changed
            if (updates.name && oldPipeline.name !== updates.name) {
                await deletePipelineStageTags(supabase, oldPipeline.name);
            }
            else if (!updates.name && updates.stages) {
                // If only stages changed, delete old tags with current name
                await deletePipelineStageTags(supabase, oldPipeline.name);
            }
            // Create new tags
            const pipelineName = updates.name || oldPipeline.name;
            const stages = updates.stages || oldPipeline.stages;
            await createPipelineStageTags(supabase, pipelineName, stages);
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
        // Get the pipeline to delete its tags
        const { data: pipelineToDelete } = await supabase
            .from('pipelines')
            .select('name')
            .eq('id', id)
            .single();
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
        // Delete associated stage tags
        if (pipelineToDelete?.name) {
            await deletePipelineStageTags(supabase, pipelineToDelete.name);
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