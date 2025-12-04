import { SupabaseClient } from '@supabase/supabase-js';
export declare function registerPipelineTools(server: any, supabase: SupabaseClient): void;
export declare const pipelineToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
            };
            stages: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            id?: undefined;
        };
        required: string[];
    };
    _meta: {
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
            stages?: undefined;
        };
        required: string[];
    };
    _meta: {
        'openai/toolInvocation/invoking': string;
        'openai/toolInvocation/invoked': string;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            name?: undefined;
            stages?: undefined;
            id?: undefined;
        };
        required?: undefined;
    };
    _meta: {
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
            stages: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
    _meta: {
        'openai/toolInvocation/invoking': string;
        'openai/toolInvocation/invoked': string;
    };
})[];
//# sourceMappingURL=pipelines.d.ts.map