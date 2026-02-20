import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function getUserFromRequest(req: NextRequest) {
    // Try to get from Authorization header first
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) {
            return user.id;
        }
    }

    // Fallback: try to get from cookie
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
        // Parse cookies manually
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        const authCookie = cookies['sb-agent-crm-auth-token'];
        if (authCookie) {
            try {
                const session = JSON.parse(decodeURIComponent(authCookie));
                return session.user?.id;
            } catch (e) {
                // Ignore parse errors
            }
        }
    }

    return null;
}

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserFromRequest(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check team_memberships
        const { data: memberships, error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .select('*')
            .eq('user_id', userId);

        // Check team_members
        const { data: teamMembers, error: teamMemberError } = await supabaseAdmin
            .from('team_members')
            .select('*')
            .eq('user_id', userId);

        // Check user_team_preferences
        const { data: preferences, error: prefError } = await supabaseAdmin
            .from('user_team_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Get user details
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);

        return NextResponse.json({
            userId,
            userEmail: user?.user?.email,
            userMetadata: user?.user?.user_metadata,
            memberships: memberships || [],
            teamMembers: teamMembers || [],
            preferences,
            errors: {
                membershipError: membershipError?.message,
                teamMemberError: teamMemberError?.message,
                prefError: prefError?.message,
            }
        });
    } catch (error: any) {
        console.error('Error checking team membership:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserFromRequest(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user details
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        const user = userData?.user;
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const metadata = user.user_metadata || {};
        const firstName = metadata.first_name || '';
        const lastName = metadata.last_name || '';
        const email = user.email || '';

        // Check if user already has a team
        const { data: existingMemberships } = await supabaseAdmin
            .from('team_memberships')
            .select('team_id')
            .eq('user_id', userId)
            .limit(1);

        let teamId: string;

        if (existingMemberships && existingMemberships.length > 0) {
            // User has a team, ensure they're in team_members
            teamId = existingMemberships[0].team_id;

            // Check if already in team_members
            const { data: existingTeamMember } = await supabaseAdmin
                .from('team_members')
                .select('id')
                .eq('team_id', teamId)
                .eq('user_id', userId)
                .single();

            if (!existingTeamMember) {
                // Add to team_members
                await supabaseAdmin
                    .from('team_members')
                    .insert({
                        team_id: teamId,
                        user_id: userId,
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        role: 'admin',
                        active: true,
                    });

                return NextResponse.json({ 
                    message: 'Added to team_members table',
                    teamId 
                });
            }

            return NextResponse.json({ 
                message: 'Already a member of the team',
                teamId 
            });
        } else {
            // Create a new team
            const teamName = firstName && lastName 
                ? `${firstName} ${lastName}'s Team`
                : `${email.split('@')[0]}'s Team`;

            const { data: team, error: teamError } = await supabaseAdmin
                .from('teams')
                .insert({
                    name: teamName,
                    owner_id: userId,
                })
                .select()
                .single();

            if (teamError || !team) {
                return NextResponse.json({ error: 'Failed to create team', details: teamError }, { status: 500 });
            }

            teamId = team.id;

            // Add to team_memberships
            await supabaseAdmin
                .from('team_memberships')
                .insert({
                    team_id: teamId,
                    user_id: userId,
                    role: 'owner',
                });

            // Add to team_members
            await supabaseAdmin
                .from('team_members')
                .insert({
                    team_id: teamId,
                    user_id: userId,
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    role: 'admin',
                    active: true,
                });

            // Set as current team
            await supabaseAdmin
                .from('user_team_preferences')
                .upsert({
                    user_id: userId,
                    current_team_id: teamId,
                }, {
                    onConflict: 'user_id'
                });

            return NextResponse.json({ 
                message: 'Created new team and added as owner',
                teamId,
                teamName 
            });
        }
    } catch (error: any) {
        console.error('Error fixing team membership:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
