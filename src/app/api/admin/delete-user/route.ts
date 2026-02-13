import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Admin endpoint to delete a user and all their data
 * POST /api/admin/delete-user
 * Body: { email: string, confirm: boolean }
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

        const body = await request.json();
        const { email, confirm } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Find the user
        const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (findError) {
            return NextResponse.json(
                { error: 'Failed to list users', details: findError.message },
                { status: 500 }
            );
        }

        const user = users.users.find(u => u.email === email);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found', email },
                { status: 404 }
            );
        }

        // If confirm is false, just return what would be deleted
        if (!confirm) {
            // Get counts of what will be deleted
            const [
                { count: teamsOwned },
                { count: memberships },
                { count: invites },
                { count: preferences },
                { count: teamPreferences }
            ] = await Promise.all([
                supabaseAdmin.from('teams').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
                supabaseAdmin.from('team_memberships').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                supabaseAdmin.from('team_invites').select('*', { count: 'exact', head: true }).eq('invited_by', user.id),
                supabaseAdmin.from('user_preferences').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                supabaseAdmin.from('user_team_preferences').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
            ]);

            // Get team details
            const { data: teams } = await supabaseAdmin
                .from('teams')
                .select('id, name')
                .eq('owner_id', user.id);

            return NextResponse.json({
                preview: true,
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at
                },
                willDelete: {
                    teamsOwned: teamsOwned || 0,
                    teamsList: teams || [],
                    memberships: memberships || 0,
                    invitesSent: invites || 0,
                    userPreferences: preferences || 0,
                    teamPreferences: teamPreferences || 0
                },
                warning: 'Deleting teams will CASCADE delete all accounts, contacts, deals, interactions, pipelines, tags, and team members in those teams.',
                instruction: 'To proceed with deletion, send the same request with "confirm": true'
            });
        }

        // Proceed with actual deletion
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            return NextResponse.json(
                { error: 'Failed to delete user', details: deleteError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `User ${email} and all related data has been permanently deleted`,
            deletedUserId: user.id
        });

    } catch (error: any) {
        console.error('Error in delete-user endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
