import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Check database state for team setup (no auth required for debugging)
 * GET /api/admin/check-db?email=evanspeaker10@gmail.com
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

        const email = request.nextUrl.searchParams.get('email') || 'evanspeaker10@gmail.com';

        // Get user by email
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === email);

        if (!user) {
            return NextResponse.json({ error: 'User not found', email });
        }

        // Get user's team preferences
        const { data: prefs } = await supabaseAdmin
            .from('user_team_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Get user's team memberships
        const { data: memberships } = await supabaseAdmin
            .from('team_memberships')
            .select('*')
            .eq('user_id', user.id);

        // Get teams owned by user
        const { data: ownedTeams } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('owner_id', user.id);

        // Get team_members records for this user
        const { data: teamMemberRecords } = await supabaseAdmin
            .from('team_members')
            .select('*')
            .eq('email', email);

        // If user has a current team, get all members of that team
        let currentTeamMembers = [];
        if (prefs?.current_team_id) {
            const { data, error } = await supabaseAdmin
                .from('team_members')
                .select('*')
                .eq('team_id', prefs.current_team_id)
                .eq('active', true);
            
            if (error) {
                console.error('Error fetching team members:', error);
            }
            currentTeamMembers = data || [];
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at
            },
            teamPreferences: prefs,
            teamMemberships: memberships,
            ownedTeams: ownedTeams,
            teamMemberRecords: teamMemberRecords,
            currentTeamMembers: currentTeamMembers,
            summary: {
                hasTeamPreference: !!prefs,
                currentTeamId: prefs?.current_team_id || null,
                membershipCount: memberships?.length || 0,
                ownedTeamCount: ownedTeams?.length || 0,
                teamMemberRecordCount: teamMemberRecords?.length || 0,
                currentTeamMemberCount: currentTeamMembers?.length || 0
            }
        });

    } catch (error: any) {
        console.error('Error in check-db endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
