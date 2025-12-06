import { SupabaseClient } from '@supabase/supabase-js';
export interface DuplicateMatch {
    id: string;
    similarity: number;
    matchReason: string;
    data: any;
}
export interface DeduplicationResult {
    isDuplicate: boolean;
    duplicateMatches: DuplicateMatch[];
    suggestedAction: 'create' | 'merge' | 'update' | 'skip';
    message: string;
}
/**
 * Check for duplicate contacts based on email, phone, or name combination
 */
export declare function checkDuplicateContact(supabase: SupabaseClient, data: {
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    account_id?: string | null;
}): Promise<DeduplicationResult>;
/**
 * Check for duplicate deals based on name + account combination
 */
export declare function checkDuplicateDeal(supabase: SupabaseClient, data: {
    name: string;
    account_id?: string | null;
    stage?: string;
}): Promise<DeduplicationResult>;
//# sourceMappingURL=deduplication.d.ts.map