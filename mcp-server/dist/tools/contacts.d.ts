import { SupabaseClient } from '@supabase/supabase-js';
export declare function registerContactTools(server: any, supabase: SupabaseClient): void;
export declare const contactToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            first_name: {
                type: string;
                description: string;
            };
            last_name: {
                type: string;
                description: string;
            };
            account_id: {
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
            role: {
                type: string;
                description: string;
            };
            id?: undefined;
        };
        required: string[];
    };
    _meta: {
        'openai/outputTemplate': string;
        'openai/toolInvocation/invoking': string;
        'openai/toolInvocation/invoked': string;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            first_name?: undefined;
            last_name?: undefined;
            account_id?: undefined;
            email?: undefined;
            phone?: undefined;
            role?: undefined;
        };
        required: string[];
    };
    _meta: {
        'openai/outputTemplate': string;
        'openai/toolInvocation/invoking': string;
        'openai/toolInvocation/invoked': string;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            account_id: {
                type: string;
                description: string;
            };
            first_name?: undefined;
            last_name?: undefined;
            email?: undefined;
            phone?: undefined;
            role?: undefined;
            id?: undefined;
        };
        required?: undefined;
    };
    _meta: {
        'openai/outputTemplate': string;
        'openai/toolInvocation/invoking': string;
        'openai/toolInvocation/invoked': string;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
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
            account_id: {
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
            role: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    _meta: {
        'openai/outputTemplate': string;
        'openai/toolInvocation/invoking': string;
        'openai/toolInvocation/invoked': string;
    };
})[];
//# sourceMappingURL=contacts.d.ts.map