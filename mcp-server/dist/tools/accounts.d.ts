import { SupabaseClient } from '@supabase/supabase-js';
export declare function handleAccountTool(request: any, supabase: SupabaseClient): Promise<{
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
    };
    isError?: undefined;
} | null>;
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
})[];
//# sourceMappingURL=accounts.d.ts.map