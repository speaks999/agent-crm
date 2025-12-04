import { SupabaseClient } from '@supabase/supabase-js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
    CreateContactSchema,
    UpdateContactSchema,
} from '../types.js';

export function registerContactTools(server: McpServer, supabase: SupabaseClient) {
    // Create Contact
    server.registerTool(
        'create_contact',
        {
            title: 'Create Contact',
            description: 'Create a new contact person in the CRM',
            inputSchema: CreateContactSchema as any,
            _meta: {
                'openai/outputTemplate': 'ui://widget/contacts.html',
                'openai/toolInvocation/invoking': 'Creating contact...',
                'openai/toolInvocation/invoked': 'Contact created successfully',
            },
        },
        async (args: any) => {
            const parsed = CreateContactSchema.parse(args);
            const { data, error } = await supabase
                .from('contacts')
                .insert({
                    first_name: parsed.first_name,
                    last_name: parsed.last_name,
                    account_id: parsed.account_id || null,
                    email: parsed.email || null,
                    phone: parsed.phone || null,
                    role: parsed.role || null,
                })
                .select()
                .single();

            if (error) {
                return {
                    content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                    isError: true,
                };
            }

            const { data: allContacts } = await supabase.from('contacts').select('*');

            return {
                content: [{ type: 'text' as const, text: `Contact "${data.first_name} ${data.last_name}" created successfully` }],
                structuredContent: {
                    contacts: allContacts || [],
                },
            };
        }
    );

    // Get Contact
    server.registerTool(
        'get_contact',
        {
            title: 'Get Contact',
            description: 'Retrieve a specific contact by ID',
            inputSchema: z.object({
                id: z.string().uuid().describe('Contact UUID'),
            }) as any,
            _meta: {
                'openai/outputTemplate': 'ui://widget/contacts.html',
                'openai/toolInvocation/invoking': 'Retrieving contact...',
                'openai/toolInvocation/invoked': 'Contact retrieved',
            },
        },
        async (args: any) => {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', args.id)
                .single();

            if (error) {
                return {
                    content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                    isError: true,
                };
            }

            return {
                content: [{ type: 'text' as const, text: `Retrieved contact: ${data.first_name} ${data.last_name}` }],
                structuredContent: {
                    contacts: [data],
                },
            };
        }
    );

    // List Contacts
    server.registerTool(
        'list_contacts',
        {
            title: 'List Contacts',
            description: 'List contacts with optional filters',
            inputSchema: z.object({
                account_id: z.string().uuid().optional().describe('Filter by account UUID'),
            }) as any,
            _meta: {
                'openai/outputTemplate': 'ui://widget/contacts.html',
                'openai/toolInvocation/invoking': 'Loading contacts...',
                'openai/toolInvocation/invoked': 'Contacts loaded',
            },
        },
        async (args: any) => {
            let query = supabase.from('contacts').select('*');
            if (args?.account_id) {
                query = query.eq('account_id', args.account_id);
            }

            const { data, error } = await query;

            if (error) {
                return {
                    content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                    isError: true,
                };
            }

            return {
                content: [{ type: 'text' as const, text: `Found ${data?.length || 0} contact(s)` }],
                structuredContent: {
                    contacts: data || [],
                },
            };
        }
    );

    // Update Contact
    server.registerTool(
        'update_contact',
        {
            title: 'Update Contact',
            description: 'Update an existing contact',
            inputSchema: UpdateContactSchema as any,
            _meta: {
                'openai/outputTemplate': 'ui://widget/contacts.html',
                'openai/toolInvocation/invoking': 'Updating contact...',
                'openai/toolInvocation/invoked': 'Contact updated',
            },
        },
        async (args: any) => {
            const parsed = UpdateContactSchema.parse(args);
            const { id, ...updates } = parsed;

            const { data, error } = await supabase
                .from('contacts')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return {
                    content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                    isError: true,
                };
            }

            const { data: allContacts } = await supabase.from('contacts').select('*');

            return {
                content: [{ type: 'text' as const, text: `Contact "${data.first_name} ${data.last_name}" updated successfully` }],
                structuredContent: {
                    contacts: allContacts || [],
                },
            };
        }
    );

    // Delete Contact
    server.registerTool(
        'delete_contact',
        {
            title: 'Delete Contact',
            description: 'Delete a contact from the CRM',
            inputSchema: z.object({
                id: z.string().uuid().describe('Contact UUID'),
            }) as any,
            _meta: {
                'openai/outputTemplate': 'ui://widget/contacts.html',
                'openai/toolInvocation/invoking': 'Deleting contact...',
                'openai/toolInvocation/invoked': 'Contact deleted',
            },
        },
        async (args: any) => {
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', args.id);

            if (error) {
                return {
                    content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                    isError: true,
                };
            }

            const { data: allContacts } = await supabase.from('contacts').select('*');

            return {
                content: [{ type: 'text' as const, text: `Contact deleted successfully` }],
                structuredContent: {
                    contacts: allContacts || [],
                },
            };
        }
    );
}

