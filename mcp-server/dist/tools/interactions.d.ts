import { SupabaseClient } from '@supabase/supabase-js';
export declare function registerInteractionTools(server: any, supabase: SupabaseClient): void;
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
            contact_id?: undefined;
            deal_id?: undefined;
            summary?: undefined;
            transcript?: undefined;
            audio_url?: undefined;
            sentiment?: undefined;
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
            summary?: undefined;
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
        };
        required: string[];
    };
})[];
//# sourceMappingURL=interactions.d.ts.map