import { supabase } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getCurrentUserTeamId(authHeader: string | null): Promise<string | null> {
    try {
        let user = null;
        
        // First try Authorization header
        if (authHeader?.startsWith('Bearer ') && supabaseServiceKey) {
            const token = authHeader.slice(7);
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
            const { data, error } = await supabaseAdmin.auth.getUser(token);
            if (!error && data.user) {
                user = data.user;
            }
        }
        
        // Fallback to cookie-based auth
        if (!user) {
            const cookieStore = await cookies();
            const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                },
            });
            const { data, error: authError } = await supabaseAuth.auth.getUser();
            if (!authError && data.user) {
                user = data.user;
            }
        }
        
        if (!user) return null;
        if (!supabaseServiceKey) return null;
        
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: prefs } = await supabaseAdmin
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .single();
            
        return prefs?.current_team_id || null;
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        const teamId = await getCurrentUserTeamId(authHeader);
        
        // If no team, return empty array
        if (!teamId) {
            console.log('[Team API] No team found for user, returning empty');
            return Response.json([]);
        }
        
        console.log(`[Team API] Fetching team members for team: ${teamId}`);
        
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('team_id', teamId)
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return Response.json(data || []);
    } catch (error: any) {
        console.error('Error fetching team members:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        const teamId = await getCurrentUserTeamId(authHeader);
        
        if (!teamId) {
            return Response.json(
                { error: 'No team found. Please set up your team first.' },
                { status: 400 }
            );
        }
        
        const body = await req.json();
        const { first_name, last_name, email, role = 'member' } = body;

        if (!first_name || !last_name || !email) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if a team member with this email already exists in this team (including inactive)
        const { data: existing } = await supabase
            .from('team_members')
            .select('*')
            .eq('email', email)
            .eq('team_id', teamId)
            .single();

        if (existing) {
            // Reactivate and update the existing member
            const { data, error } = await supabase
                .from('team_members')
                .update({
                    first_name,
                    last_name,
                    role,
                    active: true,
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return Response.json(data);
        }

        // Create new team member with team_id
        const { data, error } = await supabase
            .from('team_members')
            .insert([
                {
                    first_name,
                    last_name,
                    email,
                    role,
                    team_id: teamId,
                    active: true,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        return Response.json(data);
    } catch (error: any) {
        console.error('Error creating team member:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return Response.json({ error: 'Missing member ID' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return Response.json(data);
    } catch (error: any) {
        console.error('Error updating team member:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return Response.json({ error: 'Missing member ID' }, { status: 400 });
        }

        // Soft delete by setting active to false
        const { error } = await supabase
            .from('team_members')
            .update({ active: false })
            .eq('id', id);

        if (error) throw error;

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting team member:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
