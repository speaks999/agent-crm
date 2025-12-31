import { CreateContactSchema, UpdateContactSchema, } from '../types.js';
import { checkDuplicateContact } from '../utils/deduplication.js';
export async function handleContactTool(request, supabase) {
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
            const insertData = {
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
        const insertData = {
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
        // Only include assigned_to if explicitly provided
        if ('assigned_to' in args && args.assigned_to !== undefined) {
            insertData.assigned_to = args.assigned_to;
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
        const { account_id, tags, assigned_to } = request.params.arguments || {};
        let query = supabase.from('contacts').select('*');
        if (account_id) {
            query = query.eq('account_id', account_id);
        }
        if (assigned_to) {
            query = query.eq('assigned_to', assigned_to);
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
        // Check if ID is provided and valid before parsing
        const rawArgs = request.params.arguments || {};
        if (!rawArgs.id) {
            return {
                content: [{
                        type: 'text',
                        text: `Error: Contact ID is required. To update a contact, you need to provide the contact's UUID. You can find the contact ID by using 'list_contacts' or 'search_contacts' first.`,
                    }],
                isError: true,
            };
        }
        // Convert id to string if needed
        if (typeof rawArgs.id !== 'string') {
            rawArgs.id = String(rawArgs.id);
        }
        const args = UpdateContactSchema.parse(rawArgs);
        const { id, ...updates } = args;
        const updateData = { ...updates, updated_at: new Date().toISOString() };
        // Only include tags if explicitly provided (tags column may not exist if migration not applied)
        const hasTags = 'tags' in updates && updates.tags !== undefined;
        if (hasTags) {
            updateData.tags = updates.tags;
        }
        else {
            // Remove tags from updateData if not provided to avoid schema errors
            delete updateData.tags;
        }
        // Handle assigned_to - allow null to unassign
        const hasAssignedTo = 'assigned_to' in updates;
        if (!hasAssignedTo) {
            delete updateData.assigned_to;
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
    // Find Duplicate Contacts
    if (request.params.name === 'find_duplicate_contacts') {
        const { data: contacts, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
        // Group contacts by normalized name (first_name + last_name, lowercase)
        const nameGroups = {};
        (contacts || []).forEach((contact) => {
            const normalizedName = `${(contact.first_name || '').toLowerCase().trim()} ${(contact.last_name || '').toLowerCase().trim()}`;
            if (!nameGroups[normalizedName]) {
                nameGroups[normalizedName] = [];
            }
            nameGroups[normalizedName].push(contact);
        });
        // Find groups with more than one contact (duplicates)
        const duplicateGroups = Object.entries(nameGroups)
            .filter(([_, group]) => group.length > 1)
            .map(([name, group]) => ({
            name,
            count: group.length,
            contacts: group,
        }));
        const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0);
        return {
            content: [
                {
                    type: 'text',
                    text: duplicateGroups.length > 0
                        ? `Found ${duplicateGroups.length} name(s) with duplicates (${totalDuplicates} duplicate contacts total):\n${duplicateGroups.map(g => `• "${g.name}" has ${g.count} contacts`).join('\n')}`
                        : 'No duplicate contacts found.',
                },
            ],
            structuredContent: { duplicateGroups },
        };
    }
    // Remove Duplicate Contacts (keeps the oldest, removes newer duplicates)
    if (request.params.name === 'remove_duplicate_contacts') {
        const { dry_run = true } = request.params.arguments || {};
        const { data: contacts, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
        // Group contacts by normalized name
        const nameGroups = {};
        (contacts || []).forEach((contact) => {
            const normalizedName = `${(contact.first_name || '').toLowerCase().trim()} ${(contact.last_name || '').toLowerCase().trim()}`;
            if (!nameGroups[normalizedName]) {
                nameGroups[normalizedName] = [];
            }
            nameGroups[normalizedName].push(contact);
        });
        // Find duplicates to remove (keep first/oldest, remove rest)
        const toDelete = [];
        const kept = [];
        Object.entries(nameGroups).forEach(([_, group]) => {
            if (group.length > 1) {
                // Keep the first one (oldest by created_at)
                kept.push(group[0]);
                // Mark the rest for deletion
                toDelete.push(...group.slice(1));
            }
        });
        if (toDelete.length === 0) {
            return {
                content: [{ type: 'text', text: 'No duplicate contacts found to remove.' }],
                structuredContent: { removed: [], kept: [] },
            };
        }
        if (dry_run) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `DRY RUN: Would remove ${toDelete.length} duplicate contact(s):\n${toDelete.map(c => `• ${c.first_name} ${c.last_name} (${c.email || 'no email'})`).join('\n')}\n\nTo actually remove them, call this tool with dry_run: false`,
                    },
                ],
                structuredContent: { toRemove: toDelete, toKeep: kept },
            };
        }
        // Actually delete the duplicates
        const deleteIds = toDelete.map(c => c.id);
        // Delete embeddings for these contacts first
        await supabase
            .from('embeddings')
            .delete()
            .eq('source_table', 'contacts')
            .in('source_id', deleteIds);
        // Delete interactions for these contacts
        const { data: interactions } = await supabase
            .from('interactions')
            .select('id')
            .in('contact_id', deleteIds);
        if (interactions && interactions.length > 0) {
            const interactionIds = interactions.map(i => i.id);
            await supabase
                .from('embeddings')
                .delete()
                .eq('source_table', 'interactions')
                .in('source_id', interactionIds);
            await supabase
                .from('interactions')
                .delete()
                .in('contact_id', deleteIds);
        }
        // Delete the duplicate contacts
        const { error: deleteError } = await supabase
            .from('contacts')
            .delete()
            .in('id', deleteIds);
        if (deleteError) {
            return {
                content: [{ type: 'text', text: `Error deleting contacts: ${deleteError.message}` }],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Successfully removed ${toDelete.length} duplicate contact(s). Kept ${kept.length} original contact(s).`,
                },
            ],
            structuredContent: { removed: toDelete, kept },
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
                assigned_to: { type: 'string', description: 'Team member UUID to assign this contact to' },
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
                assigned_to: { type: 'string', description: 'Filter by assigned team member UUID' },
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
                assigned_to: { type: ['string', 'null'], description: 'Team member UUID to assign this contact to (null to unassign)' },
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
    {
        name: 'find_duplicate_contacts',
        description: 'Find duplicate contacts by name. Returns groups of contacts with the same first and last name.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'remove_duplicate_contacts',
        description: 'Remove duplicate contacts by name. Keeps the oldest contact (first created) and removes newer duplicates. Use dry_run: true to preview what will be removed.',
        inputSchema: {
            type: 'object',
            properties: {
                dry_run: {
                    type: 'boolean',
                    description: 'If true (default), only shows what would be removed without actually deleting. Set to false to actually remove duplicates.',
                    default: true,
                },
            },
        },
    },
];
//# sourceMappingURL=contacts.js.map