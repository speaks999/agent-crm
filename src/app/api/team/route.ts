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

async function getUserFromAuth(authHeader: string | null): Promise<any> {
    try {
        // Only accept Bearer token for API calls
        if (!authHeader?.startsWith('Bearer ') || !supabaseServiceKey) {
            return null;
        }
        
        const token = authHeader.slice(7);
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !data.user) {
            return null;
        }
        
        return data.user;
    } catch {
        return null;
    }
}

// Email validation helper
function isValidEmail(email: string): boolean {
    // RFC 5322 simplified email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Basic validation
    if (!emailRegex.test(email)) {
        return false;
    }
    
    // Additional checks
    if (email.includes('..')) return false; // No consecutive dots
    if (email.startsWith('.')) return false; // Can't start with dot
    if (email.endsWith('.')) return false; // Can't end with dot
    if (email.includes(' ')) return false; // No spaces
    
    // Check for valid TLD (at least 2 chars after last dot)
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const domain = parts[1];
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    
    if (!tld || tld.length < 2) return false;
    
    return true;
}

// UUID validation helper
function isValidUUID(uuid: string): boolean {
    if (typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        
        // Try Bearer token first
        let user = await getUserFromAuth(authHeader);
        
        // Fallback to cookie-based auth if no Bearer token
        if (!user) {
            console.log('[Team API] No Bearer token, trying cookie auth...');
            const cookieStore = await cookies();
            const allCookies = cookieStore.getAll();
            console.log('[Team API] Found cookies:', allCookies.map(c => c.name).join(', '));
            
            const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                    getAll() {
                        return allCookies;
                    },
                    setAll(cookiesToSet) {
                        // No-op for GET requests
                    },
                },
            });
            const { data, error: authError } = await supabaseAuth.auth.getUser();
            console.log('[Team API] getUser result:', { hasUser: !!data?.user, error: authError?.message });
            if (!authError && data.user) {
                user = data.user;
                console.log('[Team API] User authenticated via cookies:', user.email);
            }
        }
        
        // Require authentication
        if (!user) {
            console.log('[Team API] No authenticated user found');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Get team ID - need to use service key for this
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: prefs } = await supabaseAdmin
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .single();
        
        const teamId = prefs?.current_team_id;
        
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

        if (error) {
            console.error('[Team API] Error fetching team_members:', error);
            throw error;
        }

        console.log(`[Team API] Found ${data?.length || 0} team members`);
        return Response.json(data || []);
    } catch (error: any) {
        console.error('Error fetching team members:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        
        // Require authentication
        const user = await getUserFromAuth(authHeader);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
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
        
        // Validate data types
        if (typeof first_name !== 'string' || typeof last_name !== 'string' || typeof email !== 'string') {
            return Response.json(
                { error: 'Invalid data types - first_name, last_name, and email must be strings' },
                { status: 400 }
            );
        }
        
        // Validate email format
        if (!isValidEmail(email)) {
            return Response.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }
        
        // Validate role if provided
        const validRoles = ['owner', 'admin', 'member', 'viewer'];
        if (role && !validRoles.includes(role)) {
            return Response.json(
                { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
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
        const authHeader = req.headers.get('authorization');
        
        // Require authentication
        const user = await getUserFromAuth(authHeader);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return Response.json({ error: 'Missing member ID' }, { status: 400 });
        }
        
        // Validate UUID format
        if (!isValidUUID(id)) {
            return Response.json({ error: 'Invalid member ID format' }, { status: 400 });
        }
        
        // Validate update fields if present
        if (updates.email && typeof updates.email === 'string' && !isValidEmail(updates.email)) {
            return Response.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            // Check for specific error codes
            if (error.code === '22P02') {
                // Invalid UUID format
                return Response.json({ error: 'Invalid ID format' }, { status: 400 });
            }
            if (error.code === 'PGRST116') {
                // No rows found
                return Response.json({ error: 'Team member not found' }, { status: 404 });
            }
            throw error;
        }

        return Response.json(data);
    } catch (error: any) {
        console.error('Error updating team member:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        
        // Require authentication
        const user = await getUserFromAuth(authHeader);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return Response.json({ error: 'Missing member ID' }, { status: 400 });
        }
        
        // Validate UUID format
        if (!isValidUUID(id)) {
            return Response.json({ error: 'Invalid member ID format' }, { status: 400 });
        }

        // Soft delete by setting active to false
        const { error } = await supabase
            .from('team_members')
            .update({ active: false })
            .eq('id', id);

        if (error) {
            if (error.code === '22P02') {
                return Response.json({ error: 'Invalid ID format' }, { status: 400 });
            }
            throw error;
        }

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting team member:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
