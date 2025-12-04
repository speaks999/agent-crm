import { SupabaseClient } from '@supabase/supabase-js';
export declare function registerSearchTools(server: any, supabase: SupabaseClient): void;
export declare const searchToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            id?: undefined;
            pipeline_id?: undefined;
        };
        required: string[];
    };
    _meta: {
        'openai/toolInvocation/invoking': string;
        'openai/toolInvocation/invoked': string;
        'openai/outputTemplate'?: undefined;
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
            query?: undefined;
            pipeline_id?: undefined;
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
            pipeline_id: {
                type: string;
                description: string;
            };
            query?: undefined;
            id?: undefined;
        };
        required?: undefined;
    };
    _meta: {
        'openai/outputTemplate': string;
        'openai/toolInvocation/invoking': string;
        'openai/toolInvocation/invoked': string;
    };
})[];
//# sourceMappingURL=search.d.ts.map