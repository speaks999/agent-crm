import { SupabaseClient } from '@supabase/supabase-js';
export declare function registerAccountTools(server: any, supabase: SupabaseClient): void;
export declare const accountToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
            };
            industry: {
                type: string;
                description: string;
            };
            website: {
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
            name?: undefined;
            industry?: undefined;
            website?: undefined;
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
            industry: {
                type: string;
                description: string;
            };
            name?: undefined;
            website?: undefined;
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
            name: {
                type: string;
                description: string;
            };
            industry: {
                type: string;
                description: string;
            };
            website: {
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
//# sourceMappingURL=accounts.d.ts.map