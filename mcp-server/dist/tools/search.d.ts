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
})[];
//# sourceMappingURL=search.d.ts.map