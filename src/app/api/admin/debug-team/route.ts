import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Debug endpoint to check team setup
 * GET /api/admin/debug-team
 */
export async function GET(request: NextRequest) {
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

        // Get current user from cookies
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                error: 'Not authenticated',
                authError: authError?.message
            }, { status: 401 });
        }

        // Get user's team preferences
        const { data: prefs } = await supabaseAdmin
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .single();

        // Get user's team memberships
        const { data: memberships } = await supabaseAdmin
            .from('team_memberships')
            .select('*')
            .eq('user_id', user.id);

        // Get team_members for user's current team
        const teamId = prefs?.current_team_id;
        let teamMembers = [];
        if (teamId) {
            const { data } = await supabaseAdmin
                .from('team_members')
                .select('*')
                .eq('team_id', teamId);
            teamMembers = data || [];
        }

        // Get all teams user owns
        const { data: ownedTeams } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('owner_id', user.id);

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                metadata: user.user_metadata
            },
            currentTeamId: teamId,
            teamPreferences: prefs,
            teamMemberships: memberships,
            teamMembers: teamMembers,
            ownedTeams: ownedTeams,
            teamMembersCount: teamMembers.length
        });

    } catch (error: any) {
        console.error('Error in debug-team endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
