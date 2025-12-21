import { SupabaseClient } from '@supabase/supabase-js';
export declare function handleContactTool(request: any, supabase: SupabaseClient): Promise<{
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
        contacts: any[];
        duplicateMatches?: undefined;
        suggestedAction?: undefined;
        duplicateGroups?: undefined;
        toRemove?: undefined;
        toKeep?: undefined;
        removed?: undefined;
        kept?: undefined;
    };
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
    structuredContent: {
        duplicateMatches: import("../utils/deduplication.js").DuplicateMatch[];
        suggestedAction: "create" | "merge" | "update" | "skip";
        contacts?: undefined;
        duplicateGroups?: undefined;
        toRemove?: undefined;
        toKeep?: undefined;
        removed?: undefined;
        kept?: undefined;
    };
} | {
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        duplicateGroups: {
            name: string;
            count: number;
            contacts: any[];
        }[];
        contacts?: undefined;
        duplicateMatches?: undefined;
        suggestedAction?: undefined;
        toRemove?: undefined;
        toKeep?: undefined;
        removed?: undefined;
        kept?: undefined;
    };
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        toRemove: any[];
        toKeep: any[];
        contacts?: undefined;
        duplicateMatches?: undefined;
        suggestedAction?: undefined;
        duplicateGroups?: undefined;
        removed?: undefined;
        kept?: undefined;
    };
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        removed: any[];
        kept: any[];
        contacts?: undefined;
        duplicateMatches?: undefined;
        suggestedAction?: undefined;
        duplicateGroups?: undefined;
        toRemove?: undefined;
        toKeep?: undefined;
    };
    isError?: undefined;
} | null>;
export declare const contactToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            first_name: {
                type: string;
                description: string;
            };
            last_name: {
                type: string;
                description: string;
            };
            account_id: {
                type: string;
                description: string;
            };
            email: {
                type: string;
                description: string;
            };
            phone: {
                type: string;
                description: string;
            };
            role: {
                type: string;
                description: string;
            };
            id?: undefined;
            dry_run?: undefined;
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
            first_name?: undefined;
            last_name?: undefined;
            account_id?: undefined;
            email?: undefined;
            phone?: undefined;
            role?: undefined;
            dry_run?: undefined;
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
            first_name?: undefined;
            last_name?: undefined;
            email?: undefined;
            phone?: undefined;
            role?: undefined;
            id?: undefined;
            dry_run?: undefined;
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
            first_name: {
                type: string;
                description: string;
            };
            last_name: {
                type: string;
                description: string;
            };
            account_id: {
                type: string;
                description: string;
            };
            email: {
                type: string;
                description: string;
            };
            phone: {
                type: string;
                description: string;
            };
            role: {
                type: string;
                description: string;
            };
            dry_run?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            first_name?: undefined;
            last_name?: undefined;
            account_id?: undefined;
            email?: undefined;
            phone?: undefined;
            role?: undefined;
            id?: undefined;
            dry_run?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            dry_run: {
                type: string;
                description: string;
                default: boolean;
            };
            first_name?: undefined;
            last_name?: undefined;
            account_id?: undefined;
            email?: undefined;
            phone?: undefined;
            role?: undefined;
            id?: undefined;
        };
        required?: undefined;
    };
})[];
//# sourceMappingURL=contacts.d.ts.map