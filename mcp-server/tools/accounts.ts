import { SupabaseClient } from '@supabase/supabase-js';
import {
    CreateAccountSchema,
    UpdateAccountSchema,
    Account,
} from '../types.js';

export async function handleAccountTool(request: any, supabase: SupabaseClient) {
    // Create Account
    if (request.params.name === 'create_account') {
        const args = CreateAccountSchema.parse(request.params.arguments);

        const insertData: any = {
            name: args.name,
            industry: args.industry || null,
            website: args.website || null,
        };
        // Only include tags if explicitly provided (tags column may not exist if migration not applied)
        const hasTags = 'tags' in args && args.tags !== undefined;
        if (hasTags) {
            insertData.tags = args.tags || [];
        }
        
        const { data, error } = await supabase
            .from('accounts')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            // Check if error is about tags column not existing
            if (error.message?.includes('tags') && (error.message?.includes('does not exist') || error.message?.includes('column'))) {
                // Retry without tags
                delete insertData.tags;
                const { data: retryData, error: retryError } = await supabase
                    .from('accounts')
                    .insert(insertData)
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
                            text: `Account "${retryData.name}" created successfully (tags feature not available - tags column does not exist)`,
                        },
                    ],
                    structuredContent: { accounts: [retryData] },
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
                    text: `Account "${data.name}" created successfully`,
                },
            ],
            structuredContent: { accounts: [data] },
        };
    }

    // Get Account
    if (request.params.name === 'get_account') {
        const id = request.params.arguments.id;

        const { data, error } = await supabase
            .from('accounts')
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
                    text: `Retrieved account: ${data.name}`,
                },
            ],
            structuredContent: { accounts: [data] },
        };
    }

    // List Accounts
    if (request.params.name === 'list_accounts') {
        const { industry } = request.params.arguments || {};

        let query = supabase.from('accounts').select('*');

        if (industry) {
            query = query.eq('industry', industry);
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
                    text: `Found ${data?.length || 0} account(s)`,
                },
            ],
            structuredContent: { accounts: data || [] },
        };
    }

    // Update Account
    if (request.params.name === 'update_account') {
        const args = UpdateAccountSchema.parse(request.params.arguments);
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
            .from('accounts')
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
                    .from('accounts')
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
                            text: `Account updated successfully (tags feature not available - tags column does not exist)`,
                        },
                    ],
                    structuredContent: { accounts: [retryData] },
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
                    text: `Account "${data.name}" updated successfully`,
                },
            ],
            structuredContent: { accounts: [data] },
        };
    }

    // Delete Account
    if (request.params.name === 'delete_account') {
        const id = request.params.arguments.id;

        // First, get all contacts and deals for this account
        const { data: contacts } = await supabase
            .from('contacts')
            .select('id')
            .eq('account_id', id);

        const { data: deals } = await supabase
            .from('deals')
            .select('id')
            .eq('account_id', id);

        const contactIds = contacts?.map(c => c.id) || [];
        const dealIds = deals?.map(d => d.id) || [];

        // Get all interactions associated with these contacts and deals
        const allInteractionIds: string[] = [];
        
        if (contactIds.length > 0) {
            const { data: contactInteractions } = await supabase
                .from('interactions')
                .select('id')
                .in('contact_id', contactIds);
            if (contactInteractions) {
                allInteractionIds.push(...contactInteractions.map(i => i.id));
            }
        }

        if (dealIds.length > 0) {
            const { data: dealInteractions } = await supabase
                .from('interactions')
                .select('id')
                .in('deal_id', dealIds);
            if (dealInteractions) {
                allInteractionIds.push(...dealInteractions.map(i => i.id));
            }
        }

        // Remove duplicates
        const uniqueInteractionIds = [...new Set(allInteractionIds)];

        // Delete embeddings for interactions
        if (uniqueInteractionIds.length > 0) {
            await supabase
                .from('embeddings')
                .delete()
                .eq('source_table', 'interactions')
                .in('source_id', uniqueInteractionIds);
        }

        // Delete interactions
        if (contactIds.length > 0) {
            await supabase
                .from('interactions')
                .delete()
                .in('contact_id', contactIds);
        }

        if (dealIds.length > 0) {
            await supabase
                .from('interactions')
                .delete()
                .in('deal_id', dealIds);
        }

        // Delete embeddings for contacts
        if (contactIds.length > 0) {
            await supabase
                .from('embeddings')
                .delete()
                .eq('source_table', 'contacts')
                .in('source_id', contactIds);
        }

        // Delete embeddings for deals
        if (dealIds.length > 0) {
            await supabase
                .from('embeddings')
                .delete()
                .eq('source_table', 'deals')
                .in('source_id', dealIds);
        }

        // Delete contacts associated with this account
        if (contactIds.length > 0) {
            const { error: contactsError } = await supabase
                .from('contacts')
                .delete()
                .eq('account_id', id);

            if (contactsError) {
                return {
                    content: [{ type: 'text', text: `Error deleting contacts: ${contactsError.message}` }],
                    isError: true,
                };
            }
        }

        // Delete deals associated with this account
        if (dealIds.length > 0) {
            const { error: dealsError } = await supabase
                .from('deals')
                .delete()
                .eq('account_id', id);

            if (dealsError) {
                return {
                    content: [{ type: 'text', text: `Error deleting deals: ${dealsError.message}` }],
                    isError: true,
                };
            }
        }

        // Finally, delete the account
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id);

        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }

        // Fetch remaining accounts to return in structuredContent
        const { data: allAccounts } = await supabase.from('accounts').select('*');

        return {
            content: [
                {
                    type: 'text',
                    text: `Account deleted successfully`,
                },
            ],
            structuredContent: { accounts: allAccounts || [] },
        };
    }

    return null;
}

export const accountToolDefinitions = [
    {
        name: 'create_account',
        description: 'Create a new company/account in the CRM',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Company name' },
                industry: { type: 'string', description: 'Industry sector' },
                website: { type: 'string', description: 'Company website URL' },
            },
            required: ['name'],
        },
    },
    {
        name: 'get_account',
        description: 'Retrieve a specific account by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Account UUID' },
            },
            required: ['id'],
        },
    },
    {
        name: 'list_accounts',
        description: 'List all accounts with optional filters',
        inputSchema: {
            type: 'object',
            properties: {
                industry: { type: 'string', description: 'Filter by industry' },
            },
        },
    },
    {
        name: 'update_account',
        description: 'Update an existing account',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Account UUID' },
                name: { type: 'string', description: 'Company name' },
                industry: { type: 'string', description: 'Industry sector' },
                website: { type: 'string', description: 'Company website URL' },
            },
            required: ['id'],
        },
    },
    {
        name: 'delete_account',
        description: 'Delete an account from the CRM',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Account UUID' },
            },
            required: ['id'],
        },
    },
];
