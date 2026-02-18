import { callTool } from '@/lib/mcp-client';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Tools that REQUIRE team_id for data isolation
const TEAM_REQUIRED_TOOLS = [
    'list_accounts', 'list_contacts', 'list_deals', 
    'list_interactions', 'list_pipelines', 'list_tags',
];

// Tools that should have team_id injected when creating
const TEAM_SCOPED_TOOLS = [
    'create_account', 'list_accounts', 'update_account',
    'create_contact', 'list_contacts', 'update_contact',
    'create_deal', 'list_deals', 'update_deal',
    'create_interaction', 'list_interactions', 'update_interaction',
    'create_pipeline', 'list_pipelines', 'update_pipeline',
    'create_tag', 'list_tags',
];

async function getCurrentUserAndTeam(authHeader: string | null): Promise<{ userId: string | null; teamId: string | null; email: string | null }> {
    try {
        let user = null;
        
        // First try Authorization header (Bearer token from frontend)
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            console.log(`[MCP Auth] Trying Bearer token auth (token length: ${token.length})`);
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
            const { data, error } = await supabaseAdmin.auth.getUser(token);
            if (error) {
                console.log(`[MCP Auth] Bearer token error: ${error.message}`);
            }
            if (!error && data.user) {
                user = data.user;
                console.log(`[MCP Auth] User from Bearer token: ${user.email}`);
            }
        } else {
            console.log(`[MCP Auth] No Bearer token provided (authHeader: ${authHeader ? 'present but not Bearer' : 'null'})`);
        }
        
        // Fallback to cookie-based auth
        if (!user) {
            const cookieStore = await cookies();
            const allCookies = cookieStore.getAll();
            console.log(`[MCP Auth] Cookies received: ${allCookies.length} cookies, names: ${allCookies.map(c => c.name).join(', ') || 'none'}`);
            
            const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                    getAll() {
                        return allCookies;
                    },
                },
            });
            const { data, error: authError } = await supabase.auth.getUser();
            if (authError) {
                console.log(`[MCP Auth] Cookie auth error: ${authError.message}`);
            }
            if (!authError && data.user) {
                user = data.user;
                console.log(`[MCP Auth] User from cookies: ${user.email}`);
            }
        }
        
        if (!user) {
            console.log('[MCP Auth] No authenticated user found');
            return { userId: null, teamId: null, email: null };
        }
        
        console.log(`[MCP Auth] User authenticated: ${user.email} (${user.id})`);
        
        // Try to get team preference - use service role if available, otherwise use user's token
        let supabaseForQuery;
        if (supabaseServiceKey) {
            supabaseForQuery = createClient(supabaseUrl, supabaseServiceKey);
        } else if (authHeader?.startsWith('Bearer ')) {
            // Use the user's own token to query (relies on RLS)
            const token = authHeader.slice(7);
            supabaseForQuery = createClient(supabaseUrl, supabaseAnonKey, {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });
            console.log('[MCP Auth] Using user token to query team preferences');
        } else {
            console.warn('[MCP Auth] No service role key and no auth token - cannot fetch team');
            return { userId: user.id, teamId: null, email: user.email || null };
        }
        
        // Get user's current team preference
        const { data: prefs, error: prefsError } = await supabaseForQuery
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .single();
        
        if (prefsError || !prefs?.current_team_id) {
            console.log(`[MCP Auth] No team preference found for user ${user.email}, looking for team memberships...`);
            
            // Try to find an existing team membership
            const { data: memberships, error: membershipError } = await supabaseForQuery
                .from('team_memberships')
                .select('team_id')
                .eq('user_id', user.id)
                .limit(1);
            
            if (!membershipError && memberships && memberships.length > 0) {
                const teamId = memberships[0].team_id;
                console.log(`[MCP Auth] Found team membership: ${teamId}`);
                
                // Try to set this as the current team preference
                await supabaseForQuery
                    .from('user_team_preferences')
                    .upsert({ user_id: user.id, current_team_id: teamId }, { onConflict: 'user_id' })
                    .select();
                
                return { userId: user.id, teamId, email: user.email || null };
            }
            
            // No team found - if we have service role, try to create one
            if (supabaseServiceKey) {
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
                const teamId = await autoSetupUserTeam(supabaseAdmin, user.id, user.email || 'User');
                return { userId: user.id, teamId, email: user.email || null };
            }
            
            console.warn(`[MCP Auth] User ${user.email} has no team and cannot auto-create without service role key`);
            return { userId: user.id, teamId: null, email: user.email || null };
        }
        
        console.log(`[MCP Auth] User ${user.email} has team_id: ${prefs.current_team_id}`);
        return { userId: user.id, teamId: prefs.current_team_id, email: user.email || null };
    } catch (error) {
        console.error('[MCP Auth] Error getting current user/team:', error);
        return { userId: null, teamId: null, email: null };
    }
}

// Auto-setup team for users who don't have one
async function autoSetupUserTeam(supabaseAdmin: any, userId: string, email: string): Promise<string | null> {
    try {
        // Check if user already has any team memberships
        const { data: existingMemberships } = await supabaseAdmin
            .from('team_memberships')
            .select('team_id')
            .eq('user_id', userId)
            .limit(1);
        
        let teamId: string | null = null;
        
        if (existingMemberships && existingMemberships.length > 0) {
            // User has a team, just missing preference - set it
            teamId = existingMemberships[0].team_id;
            console.log(`[MCP Auth] Found existing team ${teamId} for user, setting as current`);
        } else {
            // Create a new team for the user
            const firstName = email.split('@')[0].split(/[._-]/)[0];
            const teamName = `${firstName.charAt(0).toUpperCase() + firstName.slice(1)}'s Team`;
            
            const { data: newTeam, error: teamError } = await supabaseAdmin
                .from('teams')
                .insert({ name: teamName, owner_id: userId })
                .select()
                .single();
            
            if (teamError || !newTeam) {
                console.error('[MCP Auth] Failed to create team:', teamError);
                return null;
            }
            
            teamId = newTeam.id;
            console.log(`[MCP Auth] Created new team "${teamName}" (${teamId}) for user`);
            
            // Add user as owner
            await supabaseAdmin
                .from('team_memberships')
                .insert({ team_id: teamId, user_id: userId, role: 'owner' });
        }
        
        // Set/update the current team preference
        await supabaseAdmin
            .from('user_team_preferences')
            .upsert({ user_id: userId, current_team_id: teamId }, { onConflict: 'user_id' });
        
        console.log(`[MCP Auth] Set current_team_id to ${teamId} for user`);
        return teamId;
    } catch (error) {
        console.error('[MCP Auth] Error in autoSetupUserTeam:', error);
        return null;
    }
}

// Force recompile: 2026-01-28T18:15
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, arguments: args, _accessToken } = body;
        console.log(`[MCP Route] Received request for ${name}, token: ${_accessToken ? 'present' : 'absent'}`);
        
        if (!name) {
            return Response.json({ error: 'Tool name is required' }, { status: 400 });
        }

        // Try to get user's current team and inject it for team-scoped tools
        let finalArgs = args || {};
        
        if (TEAM_SCOPED_TOOLS.includes(name) && !finalArgs.team_id) {
            // First try access token from body, then fall back to header
            const authHeader = _accessToken 
                ? `Bearer ${_accessToken}` 
                : req.headers.get('authorization');
            const { teamId, email } = await getCurrentUserAndTeam(authHeader);
            
            if (teamId) {
                finalArgs = { ...finalArgs, team_id: teamId };
                console.log(`[MCP] Injecting team_id=${teamId} for ${name} (user: ${email})`);
            } else {
                // For list operations with no team, still allow but log warning
                // This allows backwards compatibility with contacts that don't have team_id
                if (TEAM_REQUIRED_TOOLS.includes(name)) {
                    console.warn(`[MCP] No team_id for ${name} - will show unassigned data`);
                    // Don't return empty - let the MCP server handle it
                    // It will return contacts with null team_id
                }
                console.warn(`[MCP] No team_id available for ${name}`);
            }
        }

        const result = await callTool(name, finalArgs);
        
        return Response.json({ result });
    } catch (error: any) {
        console.error('MCP call-tool error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

