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
    let query = supabase.from('contacts').select('*');

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

/**
 * Merge two contacts, keeping the most complete data
 */
export async function mergeContacts(
    supabase: SupabaseClient,
    sourceId: string,
    targetId: string
): Promise<{ success: boolean; error?: string; mergedContact?: any }> {
    try {
        // Get both contacts
        const { data: source, error: sourceError } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', sourceId)
            .single();

        const { data: target, error: targetError } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', targetId)
            .single();

        if (sourceError || !source) {
            return { success: false, error: 'Source contact not found' };
        }

        if (targetError || !target) {
            return { success: false, error: 'Target contact not found' };
        }

        // Merge data (prefer non-null values, prefer target for conflicts)
        const merged: any = {
            id: targetId, // Keep target ID
            first_name: target.first_name || source.first_name,
            last_name: target.last_name || source.last_name,
            email: target.email || source.email,
            phone: target.phone || source.phone,
            role: target.role || source.role,
            account_id: target.account_id || source.account_id,
            // Merge tags
            tags: Array.from(new Set([...(target.tags || []), ...(source.tags || [])])),
            updated_at: new Date().toISOString(),
        };

        // Update target with merged data
        const { data: updated, error: updateError } = await supabase
            .from('contacts')
            .update(merged)
            .eq('id', targetId)
            .select()
            .single();

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        // Update all related records to point to target
        // Update interactions
        await supabase.from('interactions').update({ contact_id: targetId }).eq('contact_id', sourceId);

        // Delete source contact
        const { error: deleteError } = await supabase.from('contacts').delete().eq('id', sourceId);

        if (deleteError) {
            console.warn('Failed to delete source contact after merge:', deleteError);
            // Continue anyway as merge was successful
        }

        return { success: true, mergedContact: updated };
    } catch (error: any) {
        return { success: false, error: error.message || 'Unknown error during merge' };
    }
}

/**
 * Merge two deals, keeping the most complete data
 */
export async function mergeDeals(
    supabase: SupabaseClient,
    sourceId: string,
    targetId: string
): Promise<{ success: boolean; error?: string; mergedDeal?: any }> {
    try {
        // Get both deals
        const { data: source, error: sourceError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', sourceId)
            .single();

        const { data: target, error: targetError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', targetId)
            .single();

        if (sourceError || !source) {
            return { success: false, error: 'Source deal not found' };
        }

        if (targetError || !target) {
            return { success: false, error: 'Target deal not found' };
        }

        // Merge data (prefer non-null values, prefer target for conflicts)
        // For amount, sum them if both exist
        const mergedAmount =
            target.amount && source.amount
                ? parseFloat(String(target.amount)) + parseFloat(String(source.amount))
                : target.amount || source.amount;

        const merged: any = {
            id: targetId, // Keep target ID
            name: target.name || source.name,
            account_id: target.account_id || source.account_id,
            pipeline_id: target.pipeline_id || source.pipeline_id,
            amount: mergedAmount,
            stage: target.stage || source.stage,
            status: target.status || source.status,
            close_date: target.close_date || source.close_date,
            // Merge tags
            tags: Array.from(new Set([...(target.tags || []), ...(source.tags || [])])),
            updated_at: new Date().toISOString(),
        };

        // Update target with merged data
        const { data: updated, error: updateError } = await supabase
            .from('deals')
            .update(merged)
            .eq('id', targetId)
            .select()
            .single();

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        // Update all related records to point to target
        // Update interactions
        await supabase.from('interactions').update({ deal_id: targetId }).eq('deal_id', sourceId);

        // Delete source deal
        const { error: deleteError } = await supabase.from('deals').delete().eq('id', sourceId);

        if (deleteError) {
            console.warn('Failed to delete source deal after merge:', deleteError);
            // Continue anyway as merge was successful
        }

        return { success: true, mergedDeal: updated };
    } catch (error: any) {
        return { success: false, error: error.message || 'Unknown error during merge' };
    }
}

