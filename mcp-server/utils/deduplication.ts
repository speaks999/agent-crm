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
export async function checkDuplicateContact(
    supabase: SupabaseClient,
    data: {
        first_name: string;
        last_name: string;
        email?: string | null;
        phone?: string | null;
        account_id?: string | null;
    }
): Promise<DeduplicationResult> {
    const matches: DuplicateMatch[] = [];

    // Check by email (strongest match)
    if (data.email) {
        const trimmedEmail = data.email.trim().toLowerCase();
        // Fetch contacts with emails (filter out nulls) and compare in JavaScript
        // This ensures we catch all matches regardless of case
        const { data: emailMatches, error } = await supabase
            .from('contacts')
            .select('*')
            .not('email', 'is', null);

        if (!error && emailMatches) {
            emailMatches.forEach((match) => {
                if (match.email) {
                    const matchEmailNormalized = match.email.trim().toLowerCase();
                    // Compare normalized emails (case-insensitive)
                    if (matchEmailNormalized === trimmedEmail) {
                        // Only add if not already matched
                        if (!matches.find((m) => m.id === match.id)) {
                            matches.push({
                                id: match.id,
                                similarity: 1.0,
                                matchReason: 'Exact email match',
                                data: match,
                            });
                        }
                    }
                }
            });
        }
    }

    // Check by phone (strong match)
    if (data.phone) {
        const normalizedPhone = data.phone.replace(/\D/g, ''); // Remove non-digits
        
        // Only check if phone has at least 10 digits
        if (normalizedPhone.length >= 10) {
            // Fetch contacts with phone numbers (filter out nulls)
            const { data: phoneMatches, error } = await supabase
                .from('contacts')
                .select('*')
                .not('phone', 'is', null);

            if (!error && phoneMatches) {
                phoneMatches.forEach((match) => {
                    if (match.phone) {
                        const matchPhoneNormalized = match.phone.replace(/\D/g, '');
                        // Compare normalized phone numbers
                        if (matchPhoneNormalized === normalizedPhone) {
                            // Check if not already matched by email
                            if (!matches.find((m) => m.id === match.id)) {
                                matches.push({
                                    id: match.id,
                                    similarity: 0.9,
                                    matchReason: 'Exact phone match',
                                    data: match,
                                });
                            }
                        }
                    }
                });
            }
        }
    }

    // Check by name + account (moderate match)
    if (data.first_name && data.last_name) {
        const { data: nameMatches, error } = await supabase
            .from('contacts')
            .select('*')
            .ilike('first_name', data.first_name.trim())
            .ilike('last_name', data.last_name.trim());

        if (!error && nameMatches) {
            nameMatches.forEach((match) => {
                // Only consider it a match if same account or both have no account
                const sameAccount =
                    (data.account_id && match.account_id === data.account_id) ||
                    (!data.account_id && !match.account_id);

                if (sameAccount) {
                    // Check if not already matched
                    if (!matches.find((m) => m.id === match.id)) {
                        matches.push({
                            id: match.id,
                            similarity: 0.7,
                            matchReason: 'Name and account match',
                            data: match,
                        });
                    }
                }
            });
        }
    }

    // Determine action
    if (matches.length === 0) {
        return {
            isDuplicate: false,
            duplicateMatches: [],
            suggestedAction: 'create',
            message: 'No duplicates found',
        };
    }

    // Sort by similarity (highest first)
    matches.sort((a, b) => b.similarity - a.similarity);

    const strongestMatch = matches[0];
    let suggestedAction: 'create' | 'merge' | 'update' | 'skip' = 'skip';
    let message = '';

    if (strongestMatch.similarity >= 0.9) {
        // Very strong match - suggest merge or update
        suggestedAction = 'merge';
        message = `Strong duplicate detected: ${strongestMatch.matchReason}. Consider merging or updating existing contact.`;
    } else if (strongestMatch.similarity >= 0.7) {
        // Moderate match - warn but allow
        suggestedAction = 'update';
        message = `Possible duplicate detected: ${strongestMatch.matchReason}. Please review before creating.`;
    } else {
        // Weak match - allow but warn
        suggestedAction = 'create';
        message = `Potential duplicate detected: ${strongestMatch.matchReason}. Please verify before creating.`;
    }

    return {
        isDuplicate: matches.length > 0,
        duplicateMatches: matches,
        suggestedAction,
        message,
    };
}

/**
 * Check for duplicate deals based on name + account combination
 */
export async function checkDuplicateDeal(
    supabase: SupabaseClient,
    data: {
        name: string;
        account_id?: string | null;
        stage?: string;
    }
): Promise<DeduplicationResult> {
    const matches: DuplicateMatch[] = [];

    // Check by name + account (strongest match for deals)
    if (data.name) {
        const trimmedName = data.name.trim();
        let query = supabase.from('deals').select('*').ilike('name', trimmedName);

        // If account_id is provided, also match by account
        if (data.account_id) {
            query = query.eq('account_id', data.account_id);
        }

        const { data: nameMatches, error } = await query;

        if (!error && nameMatches && nameMatches.length > 0) {
            nameMatches.forEach((match) => {
                // Double-check the name matches (case-insensitive)
                if (match.name && match.name.toLowerCase().trim() === trimmedName.toLowerCase()) {
                    let similarity = 0.8;
                    let matchReason = 'Exact name match';

                    // Higher similarity if same account
                    if (data.account_id && match.account_id === data.account_id) {
                        similarity = 0.95;
                        matchReason = 'Exact name and account match';
                    }

                    // Check if same stage (even stronger match)
                    if (data.stage && match.stage === data.stage) {
                        similarity = Math.min(1.0, similarity + 0.05);
                        matchReason += ' with same stage';
                    }

                    // Only add if not already matched
                    if (!matches.find((m) => m.id === match.id)) {
                        matches.push({
                            id: match.id,
                            similarity,
                            matchReason,
                            data: match,
                        });
                    }
                }
            });
        }
    }

    // Determine action
    if (matches.length === 0) {
        return {
            isDuplicate: false,
            duplicateMatches: [],
            suggestedAction: 'create',
            message: 'No duplicates found',
        };
    }

    // Sort by similarity (highest first)
    matches.sort((a, b) => b.similarity - a.similarity);

    const strongestMatch = matches[0];
    let suggestedAction: 'create' | 'merge' | 'update' | 'skip' = 'skip';
    let message = '';

    if (strongestMatch.similarity >= 0.9) {
        // Very strong match - suggest merge or update
        suggestedAction = 'merge';
        message = `Strong duplicate detected: ${strongestMatch.matchReason}. Consider merging or updating existing deal.`;
    } else if (strongestMatch.similarity >= 0.8) {
        // Moderate match - warn but allow
        suggestedAction = 'update';
        message = `Possible duplicate detected: ${strongestMatch.matchReason}. Please review before creating.`;
    } else {
        // Weak match - allow but warn
        suggestedAction = 'create';
        message = `Potential duplicate detected: ${strongestMatch.matchReason}. Please verify before creating.`;
    }

    return {
        isDuplicate: matches.length > 0,
        duplicateMatches: matches,
        suggestedAction,
        message,
    };
}

