import { z } from 'zod';
import { CreateAccountSchema, UpdateAccountSchema, } from '../types.js';
export function registerAccountTools(server, supabase) {
    // Create Account
    server.registerTool('create_account', {
        title: 'Create Account',
        description: 'Create a new company/account in the CRM',
        inputSchema: CreateAccountSchema,
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Creating account...',
            'openai/toolInvocation/invoked': 'Account created successfully',
        },
    }, async (args) => {
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
            structuredContent: {
                accounts: allAccounts || [],
            },
        };
    });
    // Get Account
    server.registerTool('get_account', {
        title: 'Get Account',
        description: 'Retrieve a specific account by ID',
        inputSchema: z.object({
            id: z.string().uuid().describe('Account UUID'),
        }),
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Retrieving account...',
            'openai/toolInvocation/invoked': 'Account retrieved',
        },
    }, async (args) => {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', args.id)
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
    });
    // List Accounts
    server.registerTool('list_accounts', {
        title: 'List Accounts',
        description: 'List all accounts with optional filters',
        inputSchema: z.object({
            industry: z.string().optional().describe('Filter by industry'),
        }),
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Loading accounts...',
            'openai/toolInvocation/invoked': 'Accounts loaded',
        },
    }, async (args) => {
        let query = supabase.from('accounts').select('*');
        if (args?.industry) {
            query = query.eq('industry', args.industry);
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
    });
    // Update Account
    server.registerTool('update_account', {
        title: 'Update Account',
        description: 'Update an existing account',
        inputSchema: UpdateAccountSchema,
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Updating account...',
            'openai/toolInvocation/invoked': 'Account updated',
        },
    }, async (args) => {
        const parsed = UpdateAccountSchema.parse(args);
        const { id, ...updates } = parsed;
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
        const { data: allAccounts } = await supabase.from('accounts').select('*');
        return {
            content: [{ type: 'text', text: `Account "${data.name}" updated successfully` }],
            structuredContent: {
                accounts: allAccounts || [],
            },
        };
    });
    // Delete Account
    server.registerTool('delete_account', {
        title: 'Delete Account',
        description: 'Delete an account from the CRM',
        inputSchema: z.object({
            id: z.string().uuid().describe('Account UUID'),
        }),
        _meta: {
            'openai/outputTemplate': 'ui://widget/accounts.html',
            'openai/toolInvocation/invoking': 'Deleting account...',
            'openai/toolInvocation/invoked': 'Account deleted',
        },
    }, async (args) => {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', args.id);
        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
        const { data: allAccounts } = await supabase.from('accounts').select('*');
        return {
            content: [{ type: 'text', text: `Account deleted successfully` }],
            structuredContent: {
                accounts: allAccounts || [],
            },
        };
    });
}
//# sourceMappingURL=accounts-mcp.js.map