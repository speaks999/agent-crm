import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Fix team member - add to current team
 * POST /api/admin/fix-team-member?email=evanspeaker10@gmail.com
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

        // Check if team_member already exists for this team
        const { data: existing } = await supabaseAdmin
            .from('team_members')
            .select('id')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            return NextResponse.json({
                message: 'Team member already exists',
                teamMemberId: existing.id
            });
        }

        // Create team_member record
        const { data: newMember, error: insertError } = await supabaseAdmin
            .from('team_members')
            .insert({
                team_id: teamId,
                user_id: user.id,
                first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
                last_name: user.user_metadata?.last_name || '',
                email: user.email || '',
                role: 'admin',
                active: true,
                avatar_url: user.user_metadata?.avatar_url || null
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json(
                { error: 'Failed to create team member', details: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Team member created successfully',
            teamMember: newMember,
            teamId: teamId
        });

    } catch (error: any) {
        console.error('Error in fix-team-member endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
