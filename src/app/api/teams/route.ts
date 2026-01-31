import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role for admin operations (guard for build-time env)
const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Helper to get user from request
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
 * GET /api/teams
 * List all teams the user is a member of
 */
export async function GET(req: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ teams: [], currentTeamId: null });
        }
        const user = await getUserFromRequest(req);
        
        if (!user) {
            // Return empty teams for unauthenticated users instead of error
            return NextResponse.json({ teams: [], currentTeamId: null });
        }

        // Get all teams the user is a member of
        const { data: memberships, error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .select(`
                role,
                team_id,
                teams (
                    id,
                    name,
                    slug,
                    logo_url,
                    owner_id,
                    created_at
                )
            `)
            .eq('user_id', user.id);

        // If table doesn't exist or other error, return empty teams
        if (membershipError) {
            console.warn('Error fetching team memberships:', membershipError.message);
            return NextResponse.json({ teams: [], currentTeamId: null });
        }

        // Get current team preference
        const { data: prefs } = await supabaseAdmin
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle to avoid error when no row exists

        const teams = memberships?.map(m => ({
            ...m.teams,
            role: m.role,
            isCurrent: prefs?.current_team_id === (m.teams as any)?.id
        })) || [];

        return NextResponse.json({ teams, currentTeamId: prefs?.current_team_id || null });
    } catch (error: any) {
        console.error('Error fetching teams:', error);
        // Return empty teams on error instead of failing
        return NextResponse.json({ teams: [], currentTeamId: null });
    }
}

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(req: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
        }
        const user = await getUserFromRequest(req);
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, logo_url } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
        }

        // Create the team
        const { data: team, error: teamError } = await supabaseAdmin
            .from('teams')
            .insert({
                name: name.trim(),
                owner_id: user.id,
                logo_url: logo_url || null,
            })
            .select()
            .single();

        if (teamError) {
            throw teamError;
        }

        // Add the creator as owner in memberships
        const { error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .insert({
                team_id: team.id,
                user_id: user.id,
                role: 'owner',
            });

        if (membershipError) {
            // Rollback team creation
            await supabaseAdmin.from('teams').delete().eq('id', team.id);
            throw membershipError;
        }

        return NextResponse.json({ team });
    } catch (error: any) {
        console.error('Error creating team:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

