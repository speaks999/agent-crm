import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Update existing team member to current team
 * POST /api/admin/update-team-member?email=evanspeaker10@gmail.com
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

        const email = request.nextUrl.searchParams.get('email') || 'evanspeaker10@gmail.com';

        // Get user by email
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === email);

        if (!user) {
            return NextResponse.json({ error: 'User not found', email });
        }

        // Get user's current team
        const { data: prefs } = await supabaseAdmin
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .single();

        if (!prefs?.current_team_id) {
            return NextResponse.json({ error: 'No current team found' });
        }

        const teamId = prefs.current_team_id;

        // Update existing team_member record to point to current team
        const { data: updated, error: updateError } = await supabaseAdmin
            .from('team_members')
            .update({
                team_id: teamId,
                user_id: user.id,
                active: true,
                updated_at: new Date().toISOString()
            })
            .eq('email', email)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to update team member', details: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Team member updated to current team',
            teamMember: updated,
            teamId: teamId
        });

    } catch (error: any) {
        console.error('Error in update-team-member endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
