import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendTeamInvite } from '@/lib/email/emailService';

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

// Email validation helper
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return false;
    }
    
    if (email.includes('..')) return false;
    if (email.startsWith('.')) return false;
    if (email.endsWith('.')) return false;
    if (email.includes(' ')) return false;
    
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const domain = parts[1];
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    
    if (!tld || tld.length < 2) return false;
    
    return true;
}

/**
 * GET /api/teams/invites
 * Get all pending invites for the current user
 */
export async function GET(req: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ invites: [] });
        }
        const user = await getUserFromRequest(req);
        
        if (!user) {
            return NextResponse.json({ invites: [] });
        }

        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('team_id');

        // If team_id is provided, return pending invites for that team (admin/owner only)
        if (teamId) {
            const { data: membership } = await supabaseAdmin
                .from('team_memberships')
                .select('role')
                .eq('team_id', teamId)
                .eq('user_id', user.id)
                .single();

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const { data: invites, error } = await supabaseAdmin
                .from('team_invites')
                .select('id, email, role, status, created_at, expires_at')
                .eq('team_id', teamId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching team invites:', error.message);
                return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
            }

            return NextResponse.json({ invites: invites || [] });
        }

        // Default: return invites addressed to the current user's email
        const { data: invites, error } = await supabaseAdmin
            .from('team_invites')
            .select(`
                id,
                role,
                status,
                created_at,
                expires_at,
                invited_by,
                teams (
                    id,
                    name,
                    logo_url
                )
            `)
            .eq('email', user.email?.toLowerCase())
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString());

        if (error) {
            console.error('Error fetching invites:', error.message);
            return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
        }

        // Look up inviter emails via the admin API (can't join on auth.users via PostgREST)
        const invitesWithInviters = await Promise.all(
            (invites || []).map(async (invite) => {
                let inviterEmail: string | null = null;
                if (invite.invited_by) {
                    const { data } = await supabaseAdmin.auth.admin.getUserById(invite.invited_by);
                    inviterEmail = data?.user?.email ?? null;
                }
                const { invited_by, ...rest } = invite;
                return { ...rest, invited_by_user: inviterEmail ? { email: inviterEmail } : null };
            })
        );

        return NextResponse.json({ invites: invitesWithInviters });
    } catch (error: any) {
        console.error('Error fetching invites:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/teams/invites
 * Send an invite to join a team
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
        const { team_id, email, role = 'member' } = body;

        if (!team_id || !email) {
            return NextResponse.json({ error: 'team_id and email are required' }, { status: 400 });
        }
        
        // Validate email format
        if (!isValidEmail(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Verify user is admin/owner of the team
        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .select('role')
            .eq('team_id', team_id)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json({ error: 'You do not have permission to invite members to this team' }, { status: 403 });
        }

        // Check if user is already a member
        const { data: existingUser } = await supabaseAdmin
            .from('auth.users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            const { data: existingMembership } = await supabaseAdmin
                .from('team_memberships')
                .select('id')
                .eq('team_id', team_id)
                .eq('user_id', existingUser.id)
                .single();

            if (existingMembership) {
                return NextResponse.json({ error: 'This user is already a member of the team' }, { status: 400 });
            }
        }

        // Check for existing pending invite
        const { data: existingInvite } = await supabaseAdmin
            .from('team_invites')
            .select('id')
            .eq('team_id', team_id)
            .eq('email', email)
            .eq('status', 'pending')
            .single();

        if (existingInvite) {
            return NextResponse.json({ error: 'An invite has already been sent to this email' }, { status: 400 });
        }

        // Create the invite
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('team_invites')
            .insert({
                team_id,
                email: email.toLowerCase(),
                role,
                invited_by: user.id,
            })
            .select(`
                id,
                email,
                role,
                status,
                token,
                expires_at,
                teams (name)
            `)
            .single();

        if (inviteError) {
            throw inviteError;
        }

        // Get team name and inviter name for email
        const teamName = (invite.teams as any)?.name || 'the team';
        const { data: inviterData } = await supabaseAdmin.auth.admin.getUserById(user.id);
        const inviterName = inviterData?.user?.user_metadata?.first_name 
            ? `${inviterData.user.user_metadata.first_name} ${inviterData.user.user_metadata.last_name || ''}`.trim()
            : inviterData?.user?.email || 'A team member';

        // Send email notification to invitee
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await sendTeamInvite({
            to: email,
            teamName,
            inviterName,
            inviteLink: `${appUrl}/team/invites`,
            role,
        });

        return NextResponse.json({ 
            invite,
            message: `Invite sent to ${email}` 
        });
    } catch (error: any) {
        console.error('Error creating invite:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/teams/invites
 * Accept or decline an invite
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
        const { invite_id, action } = body; // action: 'accept' or 'decline'

        if (!invite_id || !['accept', 'decline'].includes(action)) {
            return NextResponse.json({ error: 'invite_id and action (accept/decline) are required' }, { status: 400 });
        }

        // Get the invite
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('team_invites')
            .select('*')
            .eq('id', invite_id)
            .eq('email', user.email?.toLowerCase())
            .eq('status', 'pending')
            .single();

        if (inviteError || !invite) {
            return NextResponse.json({ error: 'Invite not found or already processed' }, { status: 404 });
        }

        // Check if expired
        if (new Date(invite.expires_at) < new Date()) {
            await supabaseAdmin
                .from('team_invites')
                .update({ status: 'expired' })
                .eq('id', invite_id);
            return NextResponse.json({ error: 'This invite has expired' }, { status: 400 });
        }

        if (action === 'decline') {
            // Update invite status
            await supabaseAdmin
                .from('team_invites')
                .update({ status: 'declined' })
                .eq('id', invite_id);

            return NextResponse.json({ message: 'Invite declined' });
        }

        // Accept invite
        console.log(`[invites/PUT] Accepting invite ${invite_id} for user ${user.email} → team ${invite.team_id}`);

        // Add user to team_memberships (ignore duplicate if they're already a member)
        const { error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .upsert({
                team_id: invite.team_id,
                user_id: user.id,
                role: invite.role,
            }, { onConflict: 'team_id,user_id' });

        if (membershipError) {
            console.error('[invites/PUT] team_memberships upsert failed:', membershipError.message);
            throw membershipError;
        }
        console.log('[invites/PUT] team_memberships upsert OK');

        // Add user to team_members so they appear on the team page.
        // The table has a legacy UNIQUE(email) constraint from before multi-team,
        // so we must handle the case where the email already exists for another team.
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user.id);
        const metadata = userData?.user?.user_metadata || {};

        const teamMemberPayload = {
            team_id: invite.team_id,
            user_id: user.id,
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || '',
            email: user.email || '',
            role: invite.role === 'owner' ? 'admin' : invite.role,
            active: true,
        };

        await upsertTeamMember(supabaseAdmin, teamMemberPayload);
        console.log('[invites/PUT] team_members handled');

        // Update invite status
        const { error: statusError } = await supabaseAdmin
            .from('team_invites')
            .update({ status: 'accepted' })
            .eq('id', invite_id);

        if (statusError) {
            console.error('[invites/PUT] invite status update failed:', statusError.message);
        }

        // Switch user's current team to the one they just joined
        const { error: prefError } = await supabaseAdmin
            .from('user_team_preferences')
            .upsert({
                user_id: user.id,
                current_team_id: invite.team_id,
            }, { onConflict: 'user_id' });

        if (prefError) {
            console.error('[invites/PUT] user_team_preferences upsert failed:', prefError.message);
        }

        // Fetch team details
        const { data: team } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('id', invite.team_id)
            .single();

        console.log(`[invites/PUT] User ${user.email} successfully joined team ${team?.name || invite.team_id}`);
        return NextResponse.json({ 
            message: 'Successfully joined the team',
            team
        });
    } catch (error: any) {
        console.error('Error processing invite:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/teams/invites
 * Revoke a pending invite (team admin/owner only)
 */
export async function DELETE(req: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
        }
        const user = await getUserFromRequest(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const inviteId = searchParams.get('id');

        if (!inviteId) {
            return NextResponse.json({ error: 'Invite id is required' }, { status: 400 });
        }

        // Fetch the invite to verify it exists and is still pending
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('team_invites')
            .select('id, team_id, status')
            .eq('id', inviteId)
            .eq('status', 'pending')
            .single();

        if (inviteError || !invite) {
            return NextResponse.json({ error: 'Invite not found or already processed' }, { status: 404 });
        }

        // Verify the requesting user is an admin/owner of the invite's team
        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .select('role')
            .eq('team_id', invite.team_id)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json({ error: 'You do not have permission to revoke invites for this team' }, { status: 403 });
        }

        const { error: deleteError } = await supabaseAdmin
            .from('team_invites')
            .delete()
            .eq('id', inviteId);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ message: 'Invite revoked' });
    } catch (error: any) {
        console.error('Error revoking invite:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Safely insert or update a team_members row.
 *
 * The team_members table has a legacy UNIQUE(email) constraint from before
 * multi-team support, and no UNIQUE(team_id, user_id) index.  A plain insert
 * would fail when the email already exists for a different team.
 *
 * Strategy:
 *  1. Check if a row for this team + user already exists → nothing to do.
 *  2. Try a plain insert.
 *  3. If the insert fails (unique email conflict), UPDATE the existing row
 *     for this user_id so that it points to the new team.
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
    // Already exists for this team?
    const { data: existing } = await admin
        .from('team_members')
        .select('id')
        .eq('team_id', payload.team_id)
        .eq('user_id', payload.user_id)
        .maybeSingle();

    if (existing) {
        // Update metadata in case it changed
        const { error } = await admin
            .from('team_members')
            .update({
                first_name: payload.first_name,
                last_name: payload.last_name,
                email: payload.email,
                role: payload.role,
                active: payload.active,
            })
            .eq('id', existing.id);
        if (error) console.error('[upsertTeamMember] update failed:', error.message);
        return;
    }

    // Try a plain insert first
    const { error: insertErr } = await admin
        .from('team_members')
        .insert(payload);

    if (!insertErr) return; // success

    console.warn('[upsertTeamMember] insert failed, trying fallback:', insertErr.message);

    // Unique email conflict — update the existing row for this user_id
    const { data: byUser } = await admin
        .from('team_members')
        .select('id')
        .eq('user_id', payload.user_id)
        .maybeSingle();

    if (byUser) {
        const { error } = await admin
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
        if (error) console.error('[upsertTeamMember] update-by-user failed:', error.message);
        return;
    }

    // Unique email conflict from a different user (shouldn't normally happen)
    const { data: byEmail } = await admin
        .from('team_members')
        .select('id')
        .eq('email', payload.email)
        .maybeSingle();

    if (byEmail) {
        const { error } = await admin
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
        if (error) console.error('[upsertTeamMember] update-by-email failed:', error.message);
    }
}

