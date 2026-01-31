import { SupabaseClient } from '@supabase/supabase-js';
export declare function handlePipelineTool(request: any, supabase: SupabaseClient): Promise<{
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
        pipelines: any[];
    };
    isError?: undefined;
} | null>;
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
            team_id: {
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
            stages?: undefined;
            team_id?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            team_id: {
                type: string;
                description: string;
            };
            name?: undefined;
            stages?: undefined;
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
            stages: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            team_id?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=pipelines.d.ts.map