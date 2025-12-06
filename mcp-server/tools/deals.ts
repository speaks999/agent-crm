import { SupabaseClient } from '@supabase/supabase-js';
import { CreateDealSchema, UpdateDealSchema } from '../types.js';
import { checkDuplicateDeal } from '../utils/deduplication.js';

export async function handleDealTool(request: any, supabase: SupabaseClient) {
    // Create Deal
    if (request.params.name === 'create_deal') {
        const args = CreateDealSchema.parse(request.params.arguments);

        // Check for duplicates before creating
        const duplicateCheck = await checkDuplicateDeal(supabase, {
            name: args.name,
            account_id: args.account_id || null,
            stage: args.stage,
        });

        // If strong duplicate detected, return warning but allow override
        if (duplicateCheck.isDuplicate && duplicateCheck.suggestedAction === 'merge') {
            const duplicateInfo = duplicateCheck.duplicateMatches[0];
            return {
                content: [
                    {
                        type: 'text',
                        text: `⚠️ ${duplicateCheck.message}\n\nExisting deal: "${duplicateInfo.data.name}" (ID: ${duplicateInfo.id}, Stage: ${duplicateInfo.data.stage})\n\nTo proceed anyway, use the update_deal tool with the existing deal ID, or create with a different name.`,
                    },
                ],
                isError: true,
                structuredContent: {
                    duplicateMatches: duplicateCheck.duplicateMatches,
                    suggestedAction: duplicateCheck.suggestedAction,
                },
            };
        }

        // If moderate duplicate, warn but proceed
        if (duplicateCheck.isDuplicate && duplicateCheck.suggestedAction === 'update') {
            const duplicateInfo = duplicateCheck.duplicateMatches[0];
            const insertData: any = {
                name: args.name,
                account_id: args.account_id || null,
                pipeline_id: args.pipeline_id || null,
                amount: args.amount || null,
                stage: args.stage,
                close_date: args.close_date || null,
                status: args.status || 'open',
            };
            // Only include tags if explicitly provided (tags column may not exist if migration not applied)
            if ('tags' in args && args.tags !== undefined) {
                insertData.tags = args.tags || [];
            }
            const { data, error } = await supabase
                .from('deals')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                // Check if error is about tags column not existing
                if (error.message?.includes('tags') && (error.message?.includes('does not exist') || error.message?.includes('column'))) {
                    // Retry without tags
                    delete insertData.tags;
                    const { data: retryData, error: retryError } = await supabase
                        .from('deals')
                        .insert(insertData)
                        .select()
                        .single();
                    
                    if (retryError) {
                        // If unique constraint violation, return duplicate info
                        if (retryError.code === '23505' || retryError.message.includes('duplicate') || retryError.message.includes('unique')) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: `⚠️ ${duplicateCheck.message}\n\nExisting deal: "${duplicateInfo.data.name}" (ID: ${duplicateInfo.id})\n\nError: ${retryError.message}`,
                                    },
                                ],
                                isError: true,
                                structuredContent: {
                                    duplicateMatches: duplicateCheck.duplicateMatches,
                                    suggestedAction: duplicateCheck.suggestedAction,
                                },
                            };
                        }
                        return {
                            content: [{ type: 'text', text: `Error: ${retryError.message}` }],
                            isError: true,
                        };
                    }
                    
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `⚠️ ${duplicateCheck.message}\n\nDeal "${retryData.name}" created successfully (tags feature not available - tags column does not exist)`,
                            },
                        ],
                        structuredContent: { deals: [retryData] },
                    };
                }
                // If unique constraint violation, return duplicate info
                if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `⚠️ ${duplicateCheck.message}\n\nExisting deal: "${duplicateInfo.data.name}" (ID: ${duplicateInfo.id})\n\nError: ${error.message}`,
                            },
                        ],
                        isError: true,
                        structuredContent: {
                            duplicateMatches: duplicateCheck.duplicateMatches,
                            suggestedAction: duplicateCheck.suggestedAction,
                        },
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
                        text: `⚠️ ${duplicateCheck.message}\n\nDeal "${data.name}" created successfully (potential duplicate exists: "${duplicateInfo.data.name}")`,
                    },
                ],
                structuredContent: { deals: [data] },
            };
        }

        // No duplicates or weak match - proceed normally
        const insertData: any = {
            name: args.name,
            account_id: args.account_id || null,
            pipeline_id: args.pipeline_id || null,
            amount: args.amount || null,
            stage: args.stage,
            close_date: args.close_date || null,
            status: args.status || 'open',
        };
        // Only include tags if explicitly provided (tags column may not exist if migration not applied)
        if ('tags' in args && args.tags !== undefined) {
            insertData.tags = args.tags || [];
        }
        const { data, error } = await supabase
            .from('deals')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            // Check if error is about tags column not existing
            if (error.message?.includes('tags') && (error.message?.includes('does not exist') || error.message?.includes('column'))) {
                // Retry without tags
                delete insertData.tags;
                const { data: retryData, error: retryError } = await supabase
                    .from('deals')
                    .insert(insertData)
                    .select()
                    .single();
                
                if (retryError) {
                    // If unique constraint violation, check for duplicates again
                    if (retryError.code === '23505' || retryError.message.includes('duplicate') || retryError.message.includes('unique')) {
                        const recheck = await checkDuplicateDeal(supabase, {
                            name: args.name,
                            account_id: args.account_id || null,
                            stage: args.stage,
                        });
                        if (recheck.isDuplicate && recheck.duplicateMatches.length > 0) {
                            const duplicateInfo = recheck.duplicateMatches[0];
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: `⚠️ Duplicate detected: ${recheck.message}\n\nExisting deal: "${duplicateInfo.data.name}" (ID: ${duplicateInfo.id})\n\nError: ${retryError.message}`,
                                    },
                                ],
                                isError: true,
                                structuredContent: {
                                    duplicateMatches: recheck.duplicateMatches,
                                    suggestedAction: recheck.suggestedAction,
                                },
                            };
                        }
                    }
                    return {
                        content: [{ type: 'text', text: `Error: ${retryError.message}` }],
                        isError: true,
                    };
                }
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Deal "${retryData.name}" created successfully (tags feature not available - tags column does not exist)`,
                        },
                    ],
                    structuredContent: { deals: [retryData] },
                };
            }
            // If unique constraint violation, check for duplicates again
            if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
                const recheck = await checkDuplicateDeal(supabase, {
                    name: args.name,
                    account_id: args.account_id || null,
                    stage: args.stage,
                });
                if (recheck.isDuplicate && recheck.duplicateMatches.length > 0) {
                    const duplicateInfo = recheck.duplicateMatches[0];
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `⚠️ Duplicate detected: ${recheck.message}\n\nExisting deal: "${duplicateInfo.data.name}" (ID: ${duplicateInfo.id})\n\nError: ${error.message}`,
                            },
                        ],
                        isError: true,
                        structuredContent: {
                            duplicateMatches: recheck.duplicateMatches,
                            suggestedAction: recheck.suggestedAction,
                        },
                    };
                }
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
                    text: `Deal "${data.name}" created successfully`,
                },
            ],
            structuredContent: { deals: [data] },
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
            content: [
                {
                    type: 'text',
                    text: `Retrieved deal: ${data.name}`,
                },
            ],
            structuredContent: { deals: [data] },
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
            content: [
                {
                    type: 'text',
                    text: `Found ${data?.length || 0} deal(s)`,
                },
            ],
            structuredContent: { deals: data || [] },
        };
    }

    // Update Deal
    if (request.params.name === 'update_deal') {
        const args = UpdateDealSchema.parse(request.params.arguments);
        const { id, ...updates } = args;

        const updateData: any = { ...updates, updated_at: new Date().toISOString() };
        // Only include tags if explicitly provided (tags column may not exist if migration not applied)
        const hasTags = 'tags' in updates && updates.tags !== undefined;
        if (hasTags) {
            updateData.tags = updates.tags;
        } else {
            // Remove tags from updateData if not provided to avoid schema errors
            delete updateData.tags;
        }

        const { data, error } = await supabase
            .from('deals')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            // Check if error is about tags column not existing
            if (error.message?.includes('tags') && (error.message?.includes('does not exist') || error.message?.includes('column'))) {
                // Retry without tags
                delete updateData.tags;
                const { data: retryData, error: retryError } = await supabase
                    .from('deals')
                    .update(updateData)
                    .eq('id', id)
                    .select()
                    .single();
                
                if (retryError) {
                    return {
                        content: [{ type: 'text', text: `Error: ${retryError.message}` }],
                        isError: true,
                    };
                }
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Deal updated successfully (tags feature not available - tags column does not exist)`,
                        },
                    ],
                    structuredContent: { deals: [retryData] },
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
                    text: `Deal "${data.name}" updated successfully`,
                },
            ],
            structuredContent: { deals: [data] },
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
            content: [
                {
                    type: 'text',
                    text: `Deal "${data.name}" moved to stage "${stage}"`,
                },
            ],
            structuredContent: { deals: [data] },
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
            content: [
                {
                    type: 'text',
                    text: `Deal "${data.name}" closed as ${status}`,
                },
            ],
            structuredContent: { deals: [data] },
        };
    }

    // Delete Deal
    if (request.params.name === 'delete_deal') {
        const id = request.params.arguments.id;

        // Get interactions for this deal
        const { data: interactions } = await supabase
            .from('interactions')
            .select('id')
            .eq('deal_id', id);

        const interactionIds = interactions?.map(i => i.id) || [];

        // Delete embeddings for interactions
        if (interactionIds.length > 0) {
            await supabase
                .from('embeddings')
                .delete()
                .eq('source_table', 'interactions')
                .in('source_id', interactionIds);
        }

        // Delete interactions
        if (interactionIds.length > 0) {
            await supabase
                .from('interactions')
                .delete()
                .eq('deal_id', id);
        }

        // Delete embeddings for deal
        await supabase
            .from('embeddings')
            .delete()
            .eq('source_table', 'deals')
            .eq('source_id', id);

        // Delete deal
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

        // Fetch remaining deals to return in structuredContent
        const { data: allDeals } = await supabase.from('deals').select('*');

        return {
            content: [
                {
                    type: 'text',
                    text: `Deal deleted successfully`,
                },
            ],
            structuredContent: { deals: allDeals || [] },
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
