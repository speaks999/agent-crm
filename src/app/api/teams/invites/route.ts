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
            // Return empty invites for unauthenticated users
            return NextResponse.json({ invites: [] });
        }

        // Get invites for user's email
        const { data: invites, error } = await supabaseAdmin
            .from('team_invites')
            .select(`
                id,
                role,
                status,
                created_at,
                expires_at,
                teams (
                    id,
                    name,
                    logo_url
                ),
                invited_by_user:invited_by (
                    email
                )
            `)
            .eq('email', user.email)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString());

        if (error) {
            // Table might not exist yet, return empty
            console.warn('Error fetching invites:', error.message);
            return NextResponse.json({ invites: [] });
        }

        return NextResponse.json({ invites: invites || [] });
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
            .eq('email', user.email)
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
        // Add user to team
        const { error: membershipError } = await supabaseAdmin
            .from('team_memberships')
            .insert({
                team_id: invite.team_id,
                user_id: user.id,
                role: invite.role,
            });

        if (membershipError) {
            throw membershipError;
        }

        // Update invite status
        await supabaseAdmin
            .from('team_invites')
            .update({ status: 'accepted' })
            .eq('id', invite_id);

        // Fetch team details
        const { data: team } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('id', invite.team_id)
            .single();

        return NextResponse.json({ 
            message: 'Successfully joined the team',
            team
        });
    } catch (error: any) {
        console.error('Error processing invite:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

