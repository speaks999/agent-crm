import { SupabaseClient } from '@supabase/supabase-js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    CreateAccountSchema,
    UpdateAccountSchema,
    Account,
} from '../types.js';

export function registerAccountTools(server: any, supabase: SupabaseClient) {
    // Check if this is an McpServer (has registerTool method)
    const isMcpServer = server instanceof McpServer || typeof server.registerTool === 'function';
    
    if (isMcpServer) {
        // Use registerTool for McpServer
        server.registerTool(
            'create_account',
            {
                title: 'Create Account',
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
                _meta: {
                    'openai/outputTemplate': 'ui://widget/accounts.html',
                    'openai/toolInvocation/invoking': 'Creating account...',
                    'openai/toolInvocation/invoked': 'Account created successfully',
                },
            },
            async (args: any) => {
                const parsed = CreateAccountSchema.parse(args);
                const { data, error } = await supabase
                    .from('accounts')
                    .insert({
                        name: parsed.name,
                        industry: parsed.industry || null,
                        website: parsed.website || null,
                    })
                    .select()
                    .single();

                if (error) {
                    return {
                        content: [{ type: 'text', text: `Error: ${error.message}` }],
                        isError: true,
                    };
                }

                const { data: allAccounts } = await supabase.from('accounts').select('*');
                return {
                    content: [{ type: 'text', text: `Account "${data.name}" created successfully` }],
                    structuredContent: { accounts: allAccounts || [] },
                };
            }
        );

        // Register other account tools for McpServer...
        // (continuing with get_account, list_accounts, update_account, delete_account)
        return; // Early return for McpServer
    }

    // Fallback to setRequestHandler for regular Server
    server.setRequestHandler('tools/call', async (request: any) => {
        if (request.params.name === 'create_account') {
            const args = CreateAccountSchema.parse(request.params.arguments);

            const { data, error } = await supabase
                .from('accounts')
                .insert({
                    name: args.name,
                    industry: args.industry || null,
                    website: args.website || null,
                })
                .select()
                .single();

            if (error) {
                return {
                    content: [{ type: 'text', text: `Error: ${error.message}` }],
                    isError: true,
                };
            }

            // Fetch updated list to return in structuredContent
            const { data: allAccounts } = await supabase.from('accounts').select('*');

            return {
                content: [{ type: 'text', text: `Account "${data.name}" created successfully` }],
                structuredContent: {
                    accounts: allAccounts || [],
                },
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
                content: [{ type: 'text', text: `Retrieved account: ${data.name}` }],
                structuredContent: {
                    accounts: [data],
                },
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
                content: [{ type: 'text', text: `Found ${data?.length || 0} account(s)` }],
                structuredContent: {
                    accounts: data || [],
                },
            };
        }

        // Update Account
        if (request.params.name === 'update_account') {
            const args = UpdateAccountSchema.parse(request.params.arguments);
            const { id, ...updates } = args;

            const { data, error } = await supabase
                .from('accounts')
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

            // Fetch updated list to return in structuredContent
            const { data: allAccounts } = await supabase.from('accounts').select('*');

            return {
                content: [{ type: 'text', text: `Account "${data.name}" updated successfully` }],
                structuredContent: {
                    accounts: allAccounts || [],
                },
            };
        }

        // Delete Account
        if (request.params.name === 'delete_account') {
            const id = request.params.arguments.id;

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

            // Fetch updated list to return in structuredContent
            const { data: allAccounts } = await supabase.from('accounts').select('*');

            return {
                content: [{ type: 'text', text: `Account deleted successfully` }],
                structuredContent: {
                    accounts: allAccounts || [],
                },
            };
        }
    });
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
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Creating account...',
            'openai/toolInvocation/invoked': 'Account created successfully',
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
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Retrieving account...',
            'openai/toolInvocation/invoked': 'Account retrieved',
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
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Loading accounts...',
            'openai/toolInvocation/invoked': 'Accounts loaded',
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
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Updating account...',
            'openai/toolInvocation/invoked': 'Account updated',
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
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Deleting account...',
            'openai/toolInvocation/invoked': 'Account deleted',
        },
    },
];
