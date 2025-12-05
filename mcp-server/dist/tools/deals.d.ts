import { SupabaseClient } from '@supabase/supabase-js';
export declare function handleDealTool(request: any, supabase: SupabaseClient): Promise<{
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
    isError?: undefined;
} | null>;
export declare const dealToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
            };
            account_id: {
                type: string;
                description: string;
            };
            pipeline_id: {
                type: string;
                description: string;
            };
            amount: {
                type: string;
                description: string;
            };
            stage: {
                type: string;
                description: string;
            };
            close_date: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
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
            account_id?: undefined;
            pipeline_id?: undefined;
            amount?: undefined;
            stage?: undefined;
            close_date?: undefined;
            status?: undefined;
        };
        required: string[];
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
            pipeline_id: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            stage: {
                type: string;
                description: string;
            };
            name?: undefined;
            amount?: undefined;
            close_date?: undefined;
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
            account_id: {
                type: string;
                description: string;
            };
            pipeline_id: {
                type: string;
                description: string;
            };
            amount: {
                type: string;
                description: string;
            };
            stage: {
                type: string;
                description: string;
            };
            close_date: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
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
            stage: {
                type: string;
                description: string;
            };
            name?: undefined;
            account_id?: undefined;
            pipeline_id?: undefined;
            amount?: undefined;
            close_date?: undefined;
            status?: undefined;
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
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            name?: undefined;
            account_id?: undefined;
            pipeline_id?: undefined;
            amount?: undefined;
            stage?: undefined;
            close_date?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=deals.d.ts.map