import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Admin endpoint to sync team_memberships to team_members
 * This ensures all authenticated users show up on their team page
 * POST /api/admin/sync-team-members
 */
export async function POST(request: NextRequest) {
    try {
        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Supabase configuration missing' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Get all team memberships
        const { data: memberships, error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .select('*');

        if (membershipError) {
            return NextResponse.json(
                { error: 'Failed to fetch memberships', details: membershipError.message },
                { status: 500 }
            );
        }

        const results = {
            processed: 0,
            created: 0,
            skipped: 0,
            errors: [] as string[]
        };

        // For each membership, check if team_member exists, if not create it
        for (const membership of memberships || []) {
            results.processed++;

            try {
                // Check if team_member already exists
                const { data: existing } = await supabaseAdmin
                    .from('team_members')
                    .select('id')
                    .eq('team_id', membership.team_id)
                    .eq('user_id', membership.user_id)
                    .single();

                if (existing) {
                    results.skipped++;
                    continue;
                }

                // Get user details from auth.users
                const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(membership.user_id);

                if (userError || !userData?.user) {
                    results.errors.push(`Failed to get user ${membership.user_id}: ${userError?.message || 'User not found'}`);
                    continue;
                }

                const user = userData.user;

                // Create team_member record
                const { error: insertError } = await supabaseAdmin
                    .from('team_members')
                    .insert({
                        team_id: membership.team_id,
                        user_id: membership.user_id,
                        first_name: user.user_metadata?.first_name || '',
                        last_name: user.user_metadata?.last_name || '',
                        email: user.email || '',
                        role: membership.role === 'owner' ? 'admin' : membership.role,
                        active: true,
                        avatar_url: user.user_metadata?.avatar_url || null
                    });

                if (insertError) {
                    results.errors.push(`Failed to insert team member for user ${membership.user_id}: ${insertError.message}`);
                    continue;
                }

                results.created++;
            } catch (err: any) {
                results.errors.push(`Error processing membership ${membership.id}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Sync completed',
            results
        });

    } catch (error: any) {
        console.error('Error in sync-team-members endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
