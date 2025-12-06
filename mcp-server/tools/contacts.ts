import { SupabaseClient } from '@supabase/supabase-js';
import {
    CreateContactSchema,
    UpdateContactSchema,
} from '../types.js';
import { checkDuplicateContact } from '../utils/deduplication.js';

export async function handleContactTool(request: any, supabase: SupabaseClient) {
    // Create Contact
    if (request.params.name === 'create_contact') {
        const args = CreateContactSchema.parse(request.params.arguments);

        // Check for duplicates before creating
        const duplicateCheck = await checkDuplicateContact(supabase, {
            first_name: args.first_name,
            last_name: args.last_name,
            email: args.email || null,
            phone: args.phone || null,
            account_id: args.account_id || null,
        });

        // If strong duplicate detected, return warning but allow override
        if (duplicateCheck.isDuplicate && duplicateCheck.suggestedAction === 'merge') {
            const duplicateInfo = duplicateCheck.duplicateMatches[0];
            return {
                content: [
                    {
                        type: 'text',
                        text: `⚠️ ${duplicateCheck.message}\n\nExisting contact: ${duplicateInfo.data.first_name} ${duplicateInfo.data.last_name} (ID: ${duplicateInfo.id})\n\nTo proceed anyway, use the update_contact tool with the existing contact ID, or create with a different email/phone.`,
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
                first_name: args.first_name,
                last_name: args.last_name,
                account_id: args.account_id || null,
                email: args.email || null,
                phone: args.phone || null,
                role: args.role || null,
            };
            // Only include tags if explicitly provided (tags column may not exist if migration not applied)
            const hasTags = 'tags' in args && args.tags !== undefined;
            if (hasTags) {
                insertData.tags = args.tags || [];
            }
            const { data, error } = await supabase
                .from('contacts')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                // Check if error is about tags column not existing
                if (error.message?.includes('tags') && (error.message?.includes('does not exist') || error.message?.includes('column'))) {
                    // Retry without tags
                    delete insertData.tags;
                    const { data: retryData, error: retryError } = await supabase
                        .from('contacts')
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
                                        text: `⚠️ ${duplicateCheck.message}\n\nExisting contact: ${duplicateInfo.data.first_name} ${duplicateInfo.data.last_name} (ID: ${duplicateInfo.id})\n\nError: ${retryError.message}`,
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
                                text: `⚠️ ${duplicateCheck.message}\n\nContact "${retryData.first_name} ${retryData.last_name}" created successfully (tags feature not available - tags column does not exist)`,
                            },
                        ],
                        structuredContent: { contacts: [retryData] },
                    };
                }
                // If unique constraint violation, return duplicate info
                if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `⚠️ ${duplicateCheck.message}\n\nExisting contact: ${duplicateInfo.data.first_name} ${duplicateInfo.data.last_name} (ID: ${duplicateInfo.id})\n\nError: ${error.message}`,
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
                        text: `⚠️ ${duplicateCheck.message}\n\nContact "${data.first_name} ${data.last_name}" created successfully (potential duplicate exists: ${duplicateInfo.data.first_name} ${duplicateInfo.data.last_name})`,
                    },
                ],
                structuredContent: { contacts: [data] },
            };
        }

        // No duplicates or weak match - proceed normally
        const insertData: any = {
            first_name: args.first_name,
            last_name: args.last_name,
            account_id: args.account_id || null,
            email: args.email || null,
            phone: args.phone || null,
            role: args.role || null,
        };
        // Only include tags if explicitly provided (tags column may not exist if migration not applied)
        // Check if tags exists in args and is not undefined
        if ('tags' in args && args.tags !== undefined) {
            insertData.tags = args.tags || [];
        }
        const { data, error } = await supabase
            .from('contacts')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            // Check if error is about tags column not existing
            if (error.message?.includes('tags') && (error.message?.includes('does not exist') || error.message?.includes('column'))) {
                // Retry without tags
                delete insertData.tags;
                const { data: retryData, error: retryError } = await supabase
                    .from('contacts')
                    .insert(insertData)
                    .select()
                    .single();
                
                if (retryError) {
                    // If unique constraint violation, check for duplicates again
                    if (retryError.code === '23505' || retryError.message.includes('duplicate') || retryError.message.includes('unique')) {
                        const recheck = await checkDuplicateContact(supabase, {
                            first_name: args.first_name,
                            last_name: args.last_name,
                            email: args.email || null,
                            phone: args.phone || null,
                            account_id: args.account_id || null,
                        });
                        if (recheck.isDuplicate && recheck.duplicateMatches.length > 0) {
                            const duplicateInfo = recheck.duplicateMatches[0];
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: `⚠️ Duplicate detected: ${recheck.message}\n\nExisting contact: ${duplicateInfo.data.first_name} ${duplicateInfo.data.last_name} (ID: ${duplicateInfo.id})\n\nError: ${retryError.message}`,
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
                            text: `Contact "${retryData.first_name} ${retryData.last_name}" created successfully (tags feature not available - tags column does not exist)`,
                        },
                    ],
                    structuredContent: { contacts: [retryData] },
                };
            }
            // If unique constraint violation, check for duplicates again
            if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
                const recheck = await checkDuplicateContact(supabase, {
                    first_name: args.first_name,
                    last_name: args.last_name,
                    email: args.email || null,
                    phone: args.phone || null,
                    account_id: args.account_id || null,
                });
                if (recheck.isDuplicate && recheck.duplicateMatches.length > 0) {
                    const duplicateInfo = recheck.duplicateMatches[0];
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `⚠️ Duplicate detected: ${recheck.message}\n\nExisting contact: ${duplicateInfo.data.first_name} ${duplicateInfo.data.last_name} (ID: ${duplicateInfo.id})\n\nError: ${error.message}`,
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
                    text: `Contact "${data.first_name} ${data.last_name}" created successfully`,
                },
            ],
            structuredContent: { contacts: [data] },
        };
    }

    // Get Contact
    if (request.params.name === 'get_contact') {
        const id = request.params.arguments.id;

        const { data, error } = await supabase
            .from('contacts')
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
                    text: `Retrieved contact: ${data.first_name} ${data.last_name}`,
                },
            ],
            structuredContent: { contacts: [data] },
        };
    }

    // List Contacts
    if (request.params.name === 'list_contacts') {
        const { account_id, tags } = request.params.arguments || {};

        let query = supabase.from('contacts').select('*');

        if (account_id) {
            query = query.eq('account_id', account_id);
        }

        // Apply tags filter if provided (will fail gracefully if tags column doesn't exist)
        if (tags && Array.isArray(tags) && tags.length > 0) {
            query = query.overlaps('tags', tags);
        }

        const { data, error } = await query;

        if (error) {
            // Check if error is about tags column not existing
            if (error.message?.includes('tags') && (error.message?.includes('does not exist') || error.message?.includes('column'))) {
                // If tags filter was requested but column doesn't exist, return helpful message
                if (tags && Array.isArray(tags) && tags.length > 0) {
                    return {
                        content: [{ 
                            type: 'text', 
                            text: `Error: Tags feature is not available. The tags column does not exist on the contacts table. Please apply the tags migration (20250124000000_tags_system.sql) to enable tag filtering.` 
                        }],
                        isError: true,
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
                    text: `Found ${data?.length || 0} contact(s)`,
                },
            ],
            structuredContent: { contacts: data || [] },
        };
    }

    // Update Contact
    if (request.params.name === 'update_contact') {
        const args = UpdateContactSchema.parse(request.params.arguments);
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
            .from('contacts')
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
                    .from('contacts')
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
                            text: `Contact updated successfully (tags feature not available - tags column does not exist)`,
                        },
                    ],
                    structuredContent: { contacts: [retryData] },
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
                    text: `Contact "${data.first_name} ${data.last_name}" updated successfully`,
                },
            ],
            structuredContent: { contacts: [data] },
        };
    }

    // Delete Contact
    if (request.params.name === 'delete_contact') {
        const id = request.params.arguments.id;

        // Get interactions for this contact
        const { data: interactions } = await supabase
            .from('interactions')
            .select('id')
            .eq('contact_id', id);

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
                .eq('contact_id', id);
        }

        // Delete embeddings for contact
        await supabase
            .from('embeddings')
            .delete()
            .eq('source_table', 'contacts')
            .eq('source_id', id);

        // Delete contact
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        // Fetch remaining contacts to return in structuredContent
        const { data: allContacts } = await supabase.from('contacts').select('*');

        return {
            content: [
                {
                    type: 'text',
                    text: `Contact deleted successfully`,
                },
            ],
            structuredContent: { contacts: allContacts || [] },
        };
    }

    // Search Contacts by name/email
    if (request.params.name === 'search_contacts') {
        const { query } = request.params.arguments || {};

        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);

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
                    text: `Found ${data?.length || 0} contact(s) matching "${query}"`,
                },
            ],
            structuredContent: { contacts: data || [] },
        };
    }

    return null;
}

export const contactToolDefinitions = [
    {
        name: 'create_contact',
        description: 'Create a new contact person in the CRM',
        inputSchema: {
            type: 'object',
            properties: {
                first_name: { type: 'string', description: 'First name' },
                last_name: { type: 'string', description: 'Last name' },
                account_id: { type: 'string', description: 'Associated account UUID' },
                email: { type: 'string', description: 'Email address' },
                phone: { type: 'string', description: 'Phone number' },
                role: { type: 'string', description: 'Job title or role' },
            },
            required: ['first_name', 'last_name'],
        },
    },
    {
        name: 'get_contact',
        description: 'Retrieve a specific contact by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Contact UUID' },
            },
            required: ['id'],
        },
    },
    {
        name: 'list_contacts',
        description: 'List contacts with optional filters',
        inputSchema: {
            type: 'object',
            properties: {
                account_id: { type: 'string', description: 'Filter by account UUID' },
            },
        },
    },
    {
        name: 'update_contact',
        description: 'Update an existing contact',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Contact UUID' },
                first_name: { type: 'string', description: 'First name' },
                last_name: { type: 'string', description: 'Last name' },
                account_id: { type: 'string', description: 'Associated account UUID' },
                email: { type: 'string', description: 'Email address' },
                phone: { type: 'string', description: 'Phone number' },
                role: { type: 'string', description: 'Job title or role' },
            },
            required: ['id'],
        },
    },
    {
        name: 'delete_contact',
        description: 'Delete a contact from the CRM',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Contact UUID' },
            },
            required: ['id'],
        },
    },
];
