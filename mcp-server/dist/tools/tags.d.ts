import { SupabaseClient } from '@supabase/supabase-js';
export declare function handleTagTool(request: any, supabase: SupabaseClient): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        tags: never[];
        alreadyExists: boolean;
        success?: undefined;
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
        tags: any[];
        alreadyExists?: undefined;
        success?: undefined;
    };
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        success: boolean;
        tags?: undefined;
        alreadyExists?: undefined;
    };
    isError?: undefined;
} | null>;
export declare const tagToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            tag_name: {
                type: string;
                description: string;
            };
            color: {
                type: string;
                description: string;
            };
            entity_type: {
                type: string;
                description: string;
            };
            tags?: undefined;
            id?: undefined;
            prefix?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            tags: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        tag_name: {
                            type: string;
                        };
                        color: {
                            type: string;
                        };
                        entity_type: {
                            type: string;
                        };
                    };
                    required: string[];
                };
                description: string;
            };
            tag_name?: undefined;
            color?: undefined;
            entity_type?: undefined;
            id?: undefined;
            prefix?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            entity_type: {
                type: string;
                description: string;
            };
            tag_name?: undefined;
            color?: undefined;
            tags?: undefined;
            id?: undefined;
            prefix?: undefined;
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
            tag_name: {
                type: string;
                description: string;
            };
            color?: undefined;
            entity_type?: undefined;
            tags?: undefined;
            prefix?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            prefix: {
                type: string;
                description: string;
            };
            tag_name?: undefined;
            color?: undefined;
            entity_type?: undefined;
            tags?: undefined;
            id?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=tags.d.ts.map