import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

const CreateTagSchema = z.object({
    tag_name: z.string().min(1),
    color: z.string().optional(),
    entity_type: z.string().optional(),
});

const CreateTagsSchema = z.object({
    tags: z.array(z.object({
        tag_name: z.string().min(1),
        color: z.string().optional(),
        entity_type: z.string().optional(),
    })),
});

const DeleteTagSchema = z.object({
    id: z.string().optional(),
    tag_name: z.string().optional(),
});

export async function handleTagTool(request: any, supabase: SupabaseClient) {
    // Create Tag
    if (request.params.name === 'create_tag') {
        const args = CreateTagSchema.parse(request.params.arguments);

        const { data, error } = await supabase
            .from('tags')
            .insert({
                tag_name: args.tag_name,
                color: args.color || '#A2B758',
                entity_type: args.entity_type || 'all',
            })
            .select()
            .single();

        if (error) {
            // Handle duplicate tag gracefully
            if (error.code === '23505') {
                return {
                    content: [{ type: 'text', text: `Tag "${args.tag_name}" already exists` }],
                    structuredContent: { tags: [], alreadyExists: true },
                };
            }
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `Tag "${data.tag_name}" created successfully`,
                },
            ],
            structuredContent: { tags: [data] },
        };
    }

    // Create Multiple Tags (bulk)
    if (request.params.name === 'create_tags') {
        const args = CreateTagsSchema.parse(request.params.arguments);

        const tagsToInsert = args.tags.map(tag => ({
            tag_name: tag.tag_name,
            color: tag.color || '#A2B758',
            entity_type: tag.entity_type || 'all',
        }));

        // Use upsert to handle duplicates gracefully
        const { data, error } = await supabase
            .from('tags')
            .upsert(tagsToInsert, { 
                onConflict: 'tag_name',
                ignoreDuplicates: true 
            })
            .select();

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
                    text: `Created ${data?.length || 0} tags successfully`,
                },
            ],
            structuredContent: { tags: data || [] },
        };
    }

    // List Tags
    if (request.params.name === 'list_tags') {
        const entity_type = request.params.arguments?.entity_type;

        let query = supabase
            .from('tags')
            .select('*')
            .order('tag_name', { ascending: true });

        if (entity_type) {
            query = query.or(`entity_type.eq.${entity_type},entity_type.eq.all`);
        }

        const { data, error } = await query;

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
                    text: `Found ${data?.length || 0} tag(s)`,
                },
            ],
            structuredContent: { tags: data || [] },
        };
    }

    // Delete Tag
    if (request.params.name === 'delete_tag') {
        const args = DeleteTagSchema.parse(request.params.arguments);

        if (!args.id && !args.tag_name) {
            return {
                content: [{ type: 'text', text: 'Error: Either id or tag_name is required' }],
                isError: true,
            };
        }

        let query = supabase.from('tags').delete();
        
        if (args.id) {
            query = query.eq('id', args.id);
        } else if (args.tag_name) {
            query = query.eq('tag_name', args.tag_name);
        }

        const { error } = await query;

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
                    text: `Tag deleted successfully`,
                },
            ],
            structuredContent: { success: true },
        };
    }

    // Delete Tags by Prefix (for cleaning up pipeline tags)
    if (request.params.name === 'delete_tags_by_prefix') {
        const prefix = request.params.arguments?.prefix;

        if (!prefix) {
            return {
                content: [{ type: 'text', text: 'Error: prefix is required' }],
                isError: true,
            };
        }

        const { error } = await supabase
            .from('tags')
            .delete()
            .like('tag_name', `${prefix}%`);

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
                    text: `Tags with prefix "${prefix}" deleted successfully`,
                },
            ],
            structuredContent: { success: true },
        };
    }

    return null;
}

export const tagToolDefinitions = [
    {
        name: 'create_tag',
        description: 'Create a new tag',
        inputSchema: {
            type: 'object',
            properties: {
                tag_name: { type: 'string', description: 'Tag name' },
                color: { type: 'string', description: 'Tag color (hex code)' },
                entity_type: { type: 'string', description: 'Entity type (all, account, contact, deal, pipeline)' },
            },
            required: ['tag_name'],
        },
    },
    {
        name: 'create_tags',
        description: 'Create multiple tags at once (bulk operation)',
        inputSchema: {
            type: 'object',
            properties: {
                tags: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            tag_name: { type: 'string' },
                            color: { type: 'string' },
                            entity_type: { type: 'string' },
                        },
                        required: ['tag_name'],
                    },
                    description: 'Array of tags to create',
                },
            },
            required: ['tags'],
        },
    },
    {
        name: 'list_tags',
        description: 'List all available tags',
        inputSchema: {
            type: 'object',
            properties: {
                entity_type: { type: 'string', description: 'Filter by entity type (optional)' },
            },
        },
    },
    {
        name: 'delete_tag',
        description: 'Delete a tag by ID or name',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Tag UUID' },
                tag_name: { type: 'string', description: 'Tag name' },
            },
        },
    },
    {
        name: 'delete_tags_by_prefix',
        description: 'Delete all tags with a specific prefix (e.g., for cleaning up pipeline tags)',
        inputSchema: {
            type: 'object',
            properties: {
                prefix: { type: 'string', description: 'Tag name prefix to match' },
            },
            required: ['prefix'],
        },
    },
];

