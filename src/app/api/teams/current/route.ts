import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

async function getUserFromRequest(req: NextRequest) {
    if (!supabaseAdmin) {
        return null;
    }
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
        return null;
    }
    
    return user;
}

/**
 * GET /api/teams/current
 * Get the user's current active team
 */
export async function GET(req: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
        }
        const user = await getUserFromRequest(req);
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current team preference
        const { data: prefs } = await supabaseAdmin
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .single();

        if (!prefs?.current_team_id) {
            // No team set - try to find user's first team
            const { data: memberships } = await supabaseAdmin
                .from('team_memberships')
                .select('team_id')
                .eq('user_id', user.id)
                .limit(1);

            if (memberships && memberships.length > 0) {
                // Set this as current team
                await supabaseAdmin
                    .from('user_team_preferences')
                    .upsert({
                        user_id: user.id,
                        current_team_id: memberships[0].team_id,
                    });

                // Fetch team details
                const { data: team } = await supabaseAdmin
                    .from('teams')
                    .select('*')
                    .eq('id', memberships[0].team_id)
                    .single();

                return NextResponse.json({ team });
            }

            return NextResponse.json({ team: null });
        }

        // Fetch current team details
        const { data: team, error } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('id', prefs.current_team_id)
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ team });
    } catch (error: any) {
        console.error('Error fetching current team:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/teams/current
 * Switch to a different team
 */
export async function PUT(req: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
        }
        const user = await getUserFromRequest(req);
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { team_id } = body;

        if (!team_id) {
            return NextResponse.json({ error: 'team_id is required' }, { status: 400 });
        }

        // Verify user is a member of this team
        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .select('id')
            .eq('team_id', team_id)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 });
        }

        // Update current team preference
        const { error: updateError } = await supabaseAdmin
            .from('user_team_preferences')
            .upsert({
                user_id: user.id,
                current_team_id: team_id,
            });

        if (updateError) {
            throw updateError;
        }

        // Fetch team details
        const { data: team, error: teamError } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('id', team_id)
            .single();

        if (teamError) {
            throw teamError;
        }

        return NextResponse.json({ team, message: 'Switched to team successfully' });
    } catch (error: any) {
        console.error('Error switching team:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

