import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Try multiple auth methods
        let user = null;
        
        // First try Authorization header
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const { data } = await supabaseAdmin.auth.getUser(token);
            user = data.user;
        }
        
        // Fallback to cookies
        if (!user) {
            const cookieStore = await cookies();
            const allCookies = cookieStore.getAll();
            const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                    getAll() {
                        return allCookies;
                    },
                },
            });
            
            const { data } = await supabase.auth.getUser();
            user = data.user;
        }
        
        if (!user) {
            console.log('[Fix Contacts] No user found');
            return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
        }
        
        console.log(`[Fix Contacts] User authenticated: ${user.email}`);
        
        // Get user's current team
        const { data: prefs, error: prefsError } = await supabaseAdmin
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .single();
        
        if (prefsError || !prefs?.current_team_id) {
            console.log('[Fix Contacts] No team preference found');
            return NextResponse.json({ error: 'No team found. Please set up your team first.' }, { status: 400 });
        }
        
        const teamId = prefs.current_team_id;
        console.log(`[Fix Contacts] Using team_id: ${teamId}`);
        
        // Update all contacts with null team_id to use this team_id
        const { data: updated, error } = await supabaseAdmin
            .from('contacts')
            .update({ team_id: teamId })
            .is('team_id', null)
            .select('id, first_name, last_name');
        
        if (error) {
            console.error('[Fix Contacts] Update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        console.log(`[Fix Contacts] Updated ${updated?.length || 0} contacts`);
        
        return NextResponse.json({
            success: true,
            updated: updated?.length || 0,
            teamId,
            contacts: updated,
        });
    } catch (error: any) {
        console.error('[Fix Contacts] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
