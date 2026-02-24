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
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }
        const user = await getUserFromRequest(req);
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all teams the user is a member of
        let { data: memberships, error: membershipError } = await supabaseAdmin
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

        if (membershipError) {
            console.warn('Error fetching team memberships:', membershipError.message);
            return NextResponse.json({ teams: [], currentTeamId: null });
        }

        // Auto-create a default team if user has none (fallback for failed signup callbacks)
        if (!memberships || memberships.length === 0) {
            console.log(`[teams/GET] No teams found for user ${user.email}, auto-creating...`);
            const metadata = user.user_metadata || {};
            const companyName = metadata.company_name;
            const firstName = metadata.first_name;
            const lastName = metadata.last_name;

            let teamName: string;
            if (companyName) {
                teamName = companyName;
            } else if (firstName && lastName) {
                teamName = `${firstName} ${lastName}'s Team`;
            } else {
                const localPart = (user.email || 'User').split('@')[0];
                const capitalized = localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase();
                teamName = `${capitalized}'s Team`;
            }

            const { data: team, error: teamError } = await supabaseAdmin
                .from('teams')
                .insert({ name: teamName, owner_id: user.id })
                .select()
                .single();

            if (teamError) {
                console.error('[teams/GET] Failed to create team:', teamError.message);
            }

            if (!teamError && team) {
                const { error: memErr } = await supabaseAdmin
                    .from('team_memberships')
                    .insert({ team_id: team.id, user_id: user.id, role: 'owner' });
                if (memErr) console.error('[teams/GET] team_memberships insert failed:', memErr.message);

                await upsertTeamMember(supabaseAdmin, {
                    team_id: team.id,
                    user_id: user.id,
                    first_name: firstName || '',
                    last_name: lastName || '',
                    email: user.email || '',
                    role: 'admin',
                    active: true,
                });

                const { error: prefErr } = await supabaseAdmin
                    .from('user_team_preferences')
                    .upsert({ user_id: user.id, current_team_id: team.id }, { onConflict: 'user_id' });
                if (prefErr) console.error('[teams/GET] user_team_preferences upsert failed:', prefErr.message);

                console.log(`[teams/GET] Auto-created team "${teamName}" for user ${user.email}`);

                // Re-fetch memberships so the response includes the new team
                const { data: refreshed } = await supabaseAdmin
                    .from('team_memberships')
                    .select(`
                        role,
                        team_id,
                        teams (
                            id, name, slug, logo_url, owner_id, created_at
                        )
                    `)
                    .eq('user_id', user.id);

                memberships = refreshed || [];
            }
        }

        // Get current team preference
        const { data: prefs } = await supabaseAdmin
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .maybeSingle();

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

        // Validate data types
        if (name !== undefined && name !== null && typeof name !== 'string') {
            return NextResponse.json({ error: 'Team name must be a string' }, { status: 400 });
        }

        if (!name || (typeof name === 'string' && name.trim().length === 0)) {
            return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
        }

        // Create the team
        const { data: team, error: teamError } = await supabaseAdmin
            .from('teams')
            .insert({
                name: String(name).trim(), // Ensure it's a string
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

/**
 * PUT /api/teams
 * Update team details (owner only)
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
        const { team_id, name } = body;

        if (!team_id || typeof team_id !== 'string') {
            return NextResponse.json({ error: 'team_id is required' }, { status: 400 });
        }

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
        }

        // Only owners can rename a team
        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .select('role')
            .eq('team_id', team_id)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership || membership.role !== 'owner') {
            return NextResponse.json({ error: 'Only team owners can update team settings' }, { status: 403 });
        }

        const { data: team, error: updateError } = await supabaseAdmin
            .from('teams')
            .update({ name: name.trim() })
            .eq('id', team_id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ team, message: 'Team updated successfully' });
    } catch (error: any) {
        console.error('Error updating team:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Safely insert or update a team_members row, handling the legacy
 * UNIQUE(email) constraint that conflicts with multi-team support.
 */
async function upsertTeamMember(
    admin: NonNullable<typeof supabaseAdmin>,
    payload: {
        team_id: string;
        user_id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
        active: boolean;
    },
) {
    const { data: existing } = await admin
        .from('team_members')
        .select('id')
        .eq('team_id', payload.team_id)
        .eq('user_id', payload.user_id)
        .maybeSingle();

    if (existing) {
        await admin
            .from('team_members')
            .update({
                first_name: payload.first_name,
                last_name: payload.last_name,
                email: payload.email,
                role: payload.role,
                active: payload.active,
            })
            .eq('id', existing.id);
        return;
    }

    const { error: insertErr } = await admin
        .from('team_members')
        .insert(payload);

    if (!insertErr) return;

    console.warn('[upsertTeamMember] insert failed, trying fallback:', insertErr.message);

    const { data: byUser } = await admin
        .from('team_members')
        .select('id')
        .eq('user_id', payload.user_id)
        .maybeSingle();

    if (byUser) {
        await admin
            .from('team_members')
            .update({
                team_id: payload.team_id,
                first_name: payload.first_name,
                last_name: payload.last_name,
                email: payload.email,
                role: payload.role,
                active: payload.active,
            })
            .eq('id', byUser.id);
        return;
    }

    const { data: byEmail } = await admin
        .from('team_members')
        .select('id')
        .eq('email', payload.email)
        .maybeSingle();

    if (byEmail) {
        await admin
            .from('team_members')
            .update({
                team_id: payload.team_id,
                user_id: payload.user_id,
                first_name: payload.first_name,
                last_name: payload.last_name,
                role: payload.role,
                active: payload.active,
            })
            .eq('id', byEmail.id);
    }
}

