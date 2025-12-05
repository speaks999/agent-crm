import { CreateContactSchema, UpdateContactSchema, } from '../types.js';
export async function handleContactTool(request, supabase) {
    // Create Contact
    if (request.params.name === 'create_contact') {
        const args = CreateContactSchema.parse(request.params.arguments);
        const { data, error } = await supabase
            .from('contacts')
            .insert({
            first_name: args.first_name,
            last_name: args.last_name,
            account_id: args.account_id || null,
            email: args.email || null,
            phone: args.phone || null,
            role: args.role || null,
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
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
    }
    // List Contacts
    if (request.params.name === 'list_contacts') {
        const { account_id } = request.params.arguments || {};
        let query = supabase.from('contacts').select('*');
        if (account_id) {
            query = query.eq('account_id', account_id);
        }
        const { data, error } = await query;
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
    // Update Contact
    if (request.params.name === 'update_contact') {
        const args = UpdateContactSchema.parse(request.params.arguments);
        const { id, ...updates } = args;
        const { data, error } = await supabase
            .from('contacts')
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
        return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
    }
    // Delete Contact
    if (request.params.name === 'delete_contact') {
        const id = request.params.arguments.id;
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
        return {
            content: [{ type: 'text', text: `Contact ${id} deleted successfully` }],
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
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
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
//# sourceMappingURL=contacts.js.map