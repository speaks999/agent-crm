import { InsightlyClient, InsightlyContact } from '../utils/insightly-client.js';
export declare function handleInsightlyContactTool(request: any, client: InsightlyClient): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        contacts: InsightlyContact[];
        deleted_contact_id?: undefined;
    };
} | {
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        deleted_contact_id: number;
        contacts?: undefined;
    };
} | null>;
export declare const insightlyContactToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            top: {
                type: string;
                description: string;
            };
            skip: {
                type: string;
                description: string;
            };
            brief: {
                type: string;
                description: string;
            };
            count_total: {
                type: string;
                description: string;
            };
            tag: {
                type: string;
                description: string;
            };
            email: {
                type: string;
                description: string;
            };
            phone: {
                type: string;
                description: string;
            };
            updated_after_utc: {
                type: string;
                description: string;
            };
            contact_id?: undefined;
            salutation?: undefined;
            first_name?: undefined;
            last_name?: undefined;
            title?: undefined;
            mobile?: undefined;
            fax?: undefined;
            assistant_name?: undefined;
            assistant_phone?: undefined;
            owner_user_id?: undefined;
            background?: undefined;
            tags?: undefined;
            addresses?: undefined;
            custom_fields?: undefined;
            field_name?: undefined;
            field_value?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            contact_id: {
                type: string;
                description: string;
            };
            top?: undefined;
            skip?: undefined;
            brief?: undefined;
            count_total?: undefined;
            tag?: undefined;
            email?: undefined;
            phone?: undefined;
            updated_after_utc?: undefined;
            salutation?: undefined;
            first_name?: undefined;
            last_name?: undefined;
            title?: undefined;
            mobile?: undefined;
            fax?: undefined;
            assistant_name?: undefined;
            assistant_phone?: undefined;
            owner_user_id?: undefined;
            background?: undefined;
            tags?: undefined;
            addresses?: undefined;
            custom_fields?: undefined;
            field_name?: undefined;
            field_value?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            salutation: {
                type: string;
                description: string;
            };
            first_name: {
                type: string;
                description: string;
            };
            last_name: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            email: {
                type: string;
                description: string;
            };
            phone: {
                type: string;
                description: string;
            };
            mobile: {
                type: string;
                description: string;
            };
            fax: {
                type: string;
                description: string;
            };
            assistant_name: {
                type: string;
                description: string;
            };
            assistant_phone: {
                type: string;
                description: string;
            };
            owner_user_id: {
                type: string;
                description: string;
            };
            background: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            addresses: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        address_type: {
                            type: string;
                        };
                        street_address: {
                            type: string;
                        };
                        city: {
                            type: string;
                        };
                        state: {
                            type: string;
                        };
                        postcode: {
                            type: string;
                        };
                        country: {
                            type: string;
                        };
                    };
                };
            };
            custom_fields: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        custom_field_id: {
                            type: string;
                        };
                        field_value: {
                            type: string[];
                        };
                    };
                    required: string[];
                };
            };
            top?: undefined;
            skip?: undefined;
            brief?: undefined;
            count_total?: undefined;
            tag?: undefined;
            updated_after_utc?: undefined;
            contact_id?: undefined;
            field_name?: undefined;
            field_value?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            contact_id: {
                type: string;
                description: string;
            };
            salutation: {
                type: string;
                description?: undefined;
            };
            first_name: {
                type: string;
                description?: undefined;
            };
            last_name: {
                type: string;
                description?: undefined;
            };
            title: {
                type: string;
                description?: undefined;
            };
            email: {
                type: string;
                description?: undefined;
            };
            phone: {
                type: string;
                description?: undefined;
            };
            mobile: {
                type: string;
                description?: undefined;
            };
            fax: {
                type: string;
                description?: undefined;
            };
            assistant_name: {
                type: string;
                description?: undefined;
            };
            assistant_phone: {
                type: string;
                description?: undefined;
            };
            owner_user_id: {
                type: string;
                description?: undefined;
            };
            background: {
                type: string;
                description?: undefined;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description?: undefined;
            };
            addresses: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        address_type: {
                            type: string;
                        };
                        street_address: {
                            type: string;
                        };
                        city: {
                            type: string;
                        };
                        state: {
                            type: string;
                        };
                        postcode: {
                            type: string;
                        };
                        country: {
                            type: string;
                        };
                    };
                };
                description?: undefined;
            };
            custom_fields: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        custom_field_id: {
                            type: string;
                        };
                        field_value: {
                            type: string[];
                        };
                    };
                    required?: undefined;
                };
                description?: undefined;
            };
            top?: undefined;
            skip?: undefined;
            brief?: undefined;
            count_total?: undefined;
            tag?: undefined;
            updated_after_utc?: undefined;
            field_name?: undefined;
            field_value?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            field_name: {
                type: string;
                enum: string[];
                description: string;
            };
            field_value: {
                type: string;
                description: string;
            };
            top?: undefined;
            skip?: undefined;
            brief?: undefined;
            count_total?: undefined;
            tag?: undefined;
            email?: undefined;
            phone?: undefined;
            updated_after_utc?: undefined;
            contact_id?: undefined;
            salutation?: undefined;
            first_name?: undefined;
            last_name?: undefined;
            title?: undefined;
            mobile?: undefined;
            fax?: undefined;
            assistant_name?: undefined;
            assistant_phone?: undefined;
            owner_user_id?: undefined;
            background?: undefined;
            tags?: undefined;
            addresses?: undefined;
            custom_fields?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=insightly-contacts.d.ts.map