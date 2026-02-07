import { z, ZodError } from 'zod';
import { InsightlyApiError } from '../utils/insightly-client.js';
const listContactsSchema = z.object({
    top: z.number().int().min(1).max(500).optional(),
    skip: z.number().int().min(0).optional(),
    brief: z.boolean().optional(),
    count_total: z.boolean().optional(),
    tag: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    updated_after_utc: z.string().datetime().optional(),
});
const contactAddressSchema = z.object({
    address_type: z.string().optional(),
    street_address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional(),
});
const customFieldSchema = z.object({
    custom_field_id: z.string().min(1),
    field_value: z.union([z.string(), z.number(), z.boolean()]),
});
const createInsightlyContactSchema = z.object({
    salutation: z.string().optional(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    fax: z.string().optional(),
    assistant_name: z.string().optional(),
    assistant_phone: z.string().optional(),
    owner_user_id: z.number().int().positive().optional(),
    background: z.string().optional(),
    tags: z.array(z.string()).optional(),
    addresses: z.array(contactAddressSchema).max(3).optional(),
    custom_fields: z.array(customFieldSchema).optional(),
});
const updateInsightlyContactSchema = createInsightlyContactSchema.partial().extend({
    contact_id: z.number().int().positive(),
}).superRefine((value, ctx) => {
    const keys = Object.keys(value).filter((key) => key !== 'contact_id' && value[key] !== undefined);
    if (keys.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Provide at least one field to update.',
            path: ['contact_id'],
        });
    }
});
const getOrDeleteSchema = z.object({
    contact_id: z.number().int().positive(),
});
const searchContactsSchema = z.object({
    field_name: z.enum(['FIRST_NAME', 'LAST_NAME', 'EMAIL_ADDRESS', 'PHONE', 'MOBILE', 'TITLE', 'TAG_NAME']),
    field_value: z.string().min(1),
});
export async function handleInsightlyContactTool(request, client) {
    const toolName = request.params?.name;
    const args = request.params?.arguments ?? {};
    try {
        switch (toolName) {
            case 'insightly_list_contacts': {
                const parsed = listContactsSchema.parse(args);
                const contacts = await client.listContacts(parsed);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${contacts.length} Insightly contact(s).`,
                        },
                    ],
                    structuredContent: { contacts },
                };
            }
            case 'insightly_get_contact': {
                const parsed = getOrDeleteSchema.parse(args);
                const contact = await client.getContact(parsed.contact_id);
                return respondWithContact(`Insightly contact #${contact.CONTACT_ID}`, contact);
            }
            case 'insightly_create_contact': {
                const parsed = createInsightlyContactSchema.parse(args);
                const payload = buildContactPayload(parsed);
                const contact = await client.createContact(payload);
                return respondWithContact(`Created Insightly contact "${formatContactName(contact)}" (ID ${contact.CONTACT_ID}).`, contact);
            }
            case 'insightly_update_contact': {
                const parsed = updateInsightlyContactSchema.parse(args);
                const { contact_id, ...updates } = parsed;
                const payload = buildContactPayload(updates);
                payload.CONTACT_ID = contact_id;
                const contact = await client.updateContact(payload);
                return respondWithContact(`Updated Insightly contact "${formatContactName(contact)}" (ID ${contact.CONTACT_ID}).`, contact);
            }
            case 'insightly_delete_contact': {
                const parsed = getOrDeleteSchema.parse(args);
                await client.deleteContact(parsed.contact_id);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Deleted Insightly contact #${parsed.contact_id}.`,
                        },
                    ],
                    structuredContent: { deleted_contact_id: parsed.contact_id },
                };
            }
            case 'insightly_search_contacts': {
                const parsed = searchContactsSchema.parse(args);
                const contacts = await client.searchContacts({
                    field_name: parsed.field_name,
                    field_value: parsed.field_value,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${contacts.length} contact(s) matching ${parsed.field_name}="${parsed.field_value}".`,
                        },
                    ],
                    structuredContent: { contacts },
                };
            }
            default:
                return null;
        }
    }
    catch (error) {
        return formatErrorResponse(error);
    }
}
export const insightlyContactToolDefinitions = [
    {
        name: 'insightly_list_contacts',
        description: 'List Insightly contacts with optional pagination and filters.',
        inputSchema: {
            type: 'object',
            properties: {
                top: { type: 'number', description: 'Page size (max 500).' },
                skip: { type: 'number', description: 'Number of contacts to skip.' },
                brief: { type: 'boolean', description: 'Return only brief fields when true.' },
                count_total: { type: 'boolean', description: 'Include total count header when true.' },
                tag: { type: 'string', description: 'Return contacts that have a specific tag.' },
                email: { type: 'string', description: 'Filter contacts by exact email address.' },
                phone: { type: 'string', description: 'Filter contacts by exact phone number.' },
                updated_after_utc: { type: 'string', description: 'Return contacts updated after ISO date.' },
            },
        },
    },
    {
        name: 'insightly_get_contact',
        description: 'Retrieve a single Insightly contact by ID.',
        inputSchema: {
            type: 'object',
            properties: {
                contact_id: { type: 'number', description: 'Numeric Insightly contact ID.' },
            },
            required: ['contact_id'],
        },
    },
    {
        name: 'insightly_create_contact',
        description: 'Create a new contact in Insightly.',
        inputSchema: {
            type: 'object',
            properties: {
                salutation: { type: 'string', description: 'Optional salutation (Mr, Mrs, etc.).' },
                first_name: { type: 'string', description: 'Contact first name.' },
                last_name: { type: 'string', description: 'Contact last name.' },
                title: { type: 'string', description: 'Job title or role.' },
                email: { type: 'string', description: 'Primary email address.' },
                phone: { type: 'string', description: 'Primary phone number.' },
                mobile: { type: 'string', description: 'Mobile phone number.' },
                fax: { type: 'string', description: 'Fax number.' },
                assistant_name: { type: 'string', description: 'Assistant name.' },
                assistant_phone: { type: 'string', description: 'Assistant phone.' },
                owner_user_id: { type: 'number', description: 'Numeric Insightly user ID for ownership.' },
                background: { type: 'string', description: 'Background or notes field.' },
                tags: { type: 'array', items: { type: 'string' }, description: 'List of tag names.' },
                addresses: {
                    type: 'array',
                    description: 'Up to 3 address blocks.',
                    items: {
                        type: 'object',
                        properties: {
                            address_type: { type: 'string' },
                            street_address: { type: 'string' },
                            city: { type: 'string' },
                            state: { type: 'string' },
                            postcode: { type: 'string' },
                            country: { type: 'string' },
                        },
                    },
                },
                custom_fields: {
                    type: 'array',
                    description: 'Custom fields using Insightly custom field IDs.',
                    items: {
                        type: 'object',
                        properties: {
                            custom_field_id: { type: 'string' },
                            field_value: { type: ['string', 'number', 'boolean'] },
                        },
                        required: ['custom_field_id', 'field_value'],
                    },
                },
            },
            required: ['first_name', 'last_name'],
        },
    },
    {
        name: 'insightly_update_contact',
        description: 'Update an existing Insightly contact.',
        inputSchema: {
            type: 'object',
            properties: {
                contact_id: { type: 'number', description: 'Numeric Insightly contact ID.' },
                salutation: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                title: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                mobile: { type: 'string' },
                fax: { type: 'string' },
                assistant_name: { type: 'string' },
                assistant_phone: { type: 'string' },
                owner_user_id: { type: 'number' },
                background: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                addresses: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            address_type: { type: 'string' },
                            street_address: { type: 'string' },
                            city: { type: 'string' },
                            state: { type: 'string' },
                            postcode: { type: 'string' },
                            country: { type: 'string' },
                        },
                    },
                },
                custom_fields: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            custom_field_id: { type: 'string' },
                            field_value: { type: ['string', 'number', 'boolean'] },
                        },
                    },
                },
            },
            required: ['contact_id'],
        },
    },
    {
        name: 'insightly_delete_contact',
        description: 'Delete an Insightly contact.',
        inputSchema: {
            type: 'object',
            properties: {
                contact_id: { type: 'number', description: 'Numeric Insightly contact ID.' },
            },
            required: ['contact_id'],
        },
    },
    {
        name: 'insightly_search_contacts',
        description: 'Search Insightly contacts by a specific field.',
        inputSchema: {
            type: 'object',
            properties: {
                field_name: {
                    type: 'string',
                    enum: ['FIRST_NAME', 'LAST_NAME', 'EMAIL_ADDRESS', 'PHONE', 'MOBILE', 'TITLE', 'TAG_NAME'],
                    description: 'Insightly field to search.',
                },
                field_value: { type: 'string', description: 'Value to search for.' },
            },
            required: ['field_name', 'field_value'],
        },
    },
];
function buildContactPayload(input) {
    const payload = {};
    const directMap = {
        salutation: 'SALUTATION',
        first_name: 'FIRST_NAME',
        last_name: 'LAST_NAME',
        title: 'TITLE',
        email: 'EMAIL_ADDRESS',
        phone: 'PHONE',
        mobile: 'MOBILE',
        fax: 'FAX',
        assistant_name: 'ASSISTANT_NAME',
        assistant_phone: 'ASSISTANT_PHONE',
        owner_user_id: 'OWNER_USER_ID',
        background: 'BACKGROUND',
    };
    Object.entries(directMap).forEach(([inputKey, insightlyKey]) => {
        const value = input[inputKey];
        if (value !== undefined) {
            payload[insightlyKey] = value;
        }
    });
    if (input.tags) {
        payload.TAGS = input.tags.map((tag) => ({ TAG_NAME: tag }));
    }
    if (input.custom_fields) {
        payload.CUSTOMFIELDS = input.custom_fields.map((field) => ({
            CUSTOM_FIELD_ID: field.custom_field_id,
            FIELD_VALUE: typeof field.field_value === 'string' ? field.field_value : String(field.field_value),
        }));
    }
    if (input.addresses) {
        payload.ADDRESSES = input.addresses.map((address) => ({
            ADDRESS_TYPE: address.address_type,
            STREET_ADDRESS: address.street_address,
            CITY: address.city,
            STATE: address.state,
            POSTCODE: address.postcode,
            COUNTRY: address.country,
        }));
    }
    return payload;
}
function respondWithContact(message, contact) {
    return {
        content: [
            {
                type: 'text',
                text: message,
            },
        ],
        structuredContent: { contacts: [contact] },
    };
}
function formatContactName(contact) {
    return `${contact.FIRST_NAME ?? ''} ${contact.LAST_NAME ?? ''}`.trim() || `#${contact.CONTACT_ID}`;
}
function formatErrorResponse(error) {
    if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`).join('; ');
        return {
            content: [{ type: 'text', text: `Invalid arguments: ${issues}` }],
            isError: true,
        };
    }
    if (error instanceof InsightlyApiError) {
        const detail = typeof error.body === 'string' ? error.body : JSON.stringify(error.body, null, 2);
        return {
            content: [
                {
                    type: 'text',
                    text: `Insightly API error (${error.status}): ${detail}`,
                },
            ],
            isError: true,
        };
    }
    const fallbackMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
        content: [{ type: 'text', text: fallbackMessage }],
        isError: true,
    };
}
//# sourceMappingURL=insightly-contacts.js.map