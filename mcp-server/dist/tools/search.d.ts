import { SupabaseClient } from '@supabase/supabase-js';
export declare function handleSearchTool(request: any, supabase: SupabaseClient): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        accounts: any[];
        contacts: any[];
        deals: any[];
        interactions?: undefined;
        stageStats?: undefined;
    };
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
    structuredContent?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        accounts: any[];
        contacts: any[];
        deals: any[];
        interactions: any[];
        stageStats?: undefined;
    };
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        deals: any[];
        stageStats: {
            stage: string;
            count: number;
            totalValue: any;
            deals: any[];
        }[];
        accounts?: undefined;
        contacts?: undefined;
        interactions?: undefined;
    };
    isError?: undefined;
} | null>;
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
            tags_filter: {
                type: string;
                items: {
                    type: string;
                };
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
            tags_filter?: undefined;
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
            tags_filter?: undefined;
            id?: undefined;
        };
        required?: undefined;
    };
})[];
//# sourceMappingURL=search.d.ts.map