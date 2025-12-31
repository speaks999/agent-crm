import { SupabaseClient } from '@supabase/supabase-js';
export declare function handleInteractionTool(request: any, supabase: SupabaseClient): Promise<{
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
        interactions: any[];
    };
    isError?: undefined;
} | null>;
export declare const interactionToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            due_date: {
                type: string;
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            transcript: {
                type: string;
                description: string;
            };
            contact_id: {
                type: string;
                description: string;
            };
            deal_id: {
                type: string;
                description: string;
            };
            audio_url: {
                type: string;
                description: string;
            };
            sentiment: {
                type: string;
                description: string;
            };
            assigned_to: {
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
            type?: undefined;
            title?: undefined;
            due_date?: undefined;
            summary?: undefined;
            description?: undefined;
            transcript?: undefined;
            contact_id?: undefined;
            deal_id?: undefined;
            audio_url?: undefined;
            sentiment?: undefined;
            assigned_to?: undefined;
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
            deal_id: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            assigned_to: {
                type: string;
                description: string;
            };
            title?: undefined;
            due_date?: undefined;
            summary?: undefined;
            description?: undefined;
            transcript?: undefined;
            audio_url?: undefined;
            sentiment?: undefined;
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
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            contact_id: {
                type: string;
                description: string;
            };
            deal_id: {
                type: string;
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
            transcript: {
                type: string;
                description: string;
            };
            audio_url: {
                type: string;
                description: string;
            };
            sentiment: {
                type: string;
                description: string;
            };
            assigned_to: {
                type: string[];
                description: string;
            };
            title?: undefined;
            due_date?: undefined;
            description?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=interactions.d.ts.map