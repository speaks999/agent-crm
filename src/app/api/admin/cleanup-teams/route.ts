import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function getUserFromRequest(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) {
            return user.id;
        }
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserFromRequest(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all teams the user owns
        const { data: memberships } = await supabaseAdmin
            .from('team_memberships')
            .select('team_id')
            .eq('user_id', userId)
            .eq('role', 'owner');

        if (!memberships || memberships.length === 0) {
            return NextResponse.json({ error: 'No teams found' }, { status: 404 });
        }

        const teamIds = memberships.map(m => m.team_id);

        // Check each team for other members
        const teamsWithMembers: Array<{ teamId: string; memberCount: number }> = [];
        
        for (const teamId of teamIds) {
            const { data: members, count } = await supabaseAdmin
                .from('team_memberships')
                .select('user_id', { count: 'exact' })
                .eq('team_id', teamId);

            if (count && count > 0) {
                teamsWithMembers.push({ teamId, memberCount: count });
            }
        }

        // Determine which team to keep
        let teamToKeep: string;
        
        // If any team has more than 1 member (i.e., other members besides the user), keep that one
        const teamWithOthers = teamsWithMembers.find(t => t.memberCount > 1);
        
        if (teamWithOthers) {
            teamToKeep = teamWithOthers.teamId;
        } else {
            // Keep the current team preference
            const { data: pref } = await supabaseAdmin
                .from('user_team_preferences')
                .select('current_team_id')
                .eq('user_id', userId)
                .single();

            teamToKeep = pref?.current_team_id || teamIds[0];
        }

        // Teams to delete
        const teamsToDelete = teamIds.filter(id => id !== teamToKeep);

        // Delete in order to avoid foreign key issues:
        // 1. team_members
        // 2. team_memberships
        // 3. contacts with team_id
        // 4. accounts with team_id
        // 5. deals with team_id
        // 6. interactions with team_id
        // 7. teams

        let deletedCounts = {
            teamMembers: 0,
            teamMemberships: 0,
            contacts: 0,
            accounts: 0,
            deals: 0,
            interactions: 0,
            teams: 0,
        };

        for (const teamId of teamsToDelete) {
            // Delete team_members
            const { count: tmCount } = await supabaseAdmin
                .from('team_members')
                .delete({ count: 'exact' })
                .eq('team_id', teamId);
            deletedCounts.teamMembers += tmCount || 0;

            // Delete team_memberships
            const { count: membCount } = await supabaseAdmin
                .from('team_memberships')
                .delete({ count: 'exact' })
                .eq('team_id', teamId);
            deletedCounts.teamMemberships += membCount || 0;

            // Update contacts to remove team_id (or delete if you prefer)
            const { count: contactCount } = await supabaseAdmin
                .from('contacts')
                .update({ team_id: teamToKeep })
                .eq('team_id', teamId);
            deletedCounts.contacts += contactCount || 0;

            // Update accounts
            const { count: accountCount } = await supabaseAdmin
                .from('accounts')
                .update({ team_id: teamToKeep })
                .eq('team_id', teamId);
            deletedCounts.accounts += accountCount || 0;

            // Update deals
            const { count: dealCount } = await supabaseAdmin
                .from('deals')
                .update({ team_id: teamToKeep })
                .eq('team_id', teamId);
            deletedCounts.deals += dealCount || 0;

            // Update interactions
            const { count: interactionCount } = await supabaseAdmin
                .from('interactions')
                .update({ team_id: teamToKeep })
                .eq('team_id', teamId);
            deletedCounts.interactions += interactionCount || 0;

            // Finally, delete the team
            const { error: teamError } = await supabaseAdmin
                .from('teams')
                .delete()
                .eq('id', teamId);

            if (!teamError) {
                deletedCounts.teams += 1;
            }
        }

        // Ensure user is in team_members for the kept team
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        const user = userData?.user;
        const metadata = user?.user_metadata || {};

        // Check if already in team_members
        const { data: existingTeamMember } = await supabaseAdmin
            .from('team_members')
            .select('id')
            .eq('team_id', teamToKeep)
            .eq('user_id', userId)
            .single();

        if (!existingTeamMember) {
            await supabaseAdmin
                .from('team_members')
                .insert({
                    team_id: teamToKeep,
                    user_id: userId,
                    first_name: metadata.first_name || '',
                    last_name: metadata.last_name || '',
                    email: user?.email || '',
                    role: 'admin',
                    active: true,
                });
        }

        // Set as current team
        await supabaseAdmin
            .from('user_team_preferences')
            .upsert({
                user_id: userId,
                current_team_id: teamToKeep,
            }, {
                onConflict: 'user_id'
            });

        return NextResponse.json({
            message: 'Teams cleaned up successfully',
            keptTeam: teamToKeep,
            deletedTeams: teamsToDelete.length,
            deletedCounts,
            movedData: {
                contacts: deletedCounts.contacts,
                accounts: deletedCounts.accounts,
                deals: deletedCounts.deals,
                interactions: deletedCounts.interactions,
            }
        });
    } catch (error: any) {
        console.error('Error cleaning up teams:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
