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
        
        // Get user from session
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return allCookies;
                },
            },
        });
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Get user's current team
        const { data: prefs } = await supabaseAdmin
            .from('user_team_preferences')
            .select('current_team_id')
            .eq('user_id', user.id)
            .single();
        
        if (!prefs?.current_team_id) {
            return NextResponse.json({ error: 'No team found' }, { status: 400 });
        }
        
        const teamId = prefs.current_team_id;
        
        // Update all contacts with null team_id to use this team_id
        const { data: updated, error } = await supabaseAdmin
            .from('contacts')
            .update({ team_id: teamId })
            .is('team_id', null)
            .select('id, first_name, last_name');
        
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return NextResponse.json({
            success: true,
            updated: updated?.length || 0,
            teamId,
            contacts: updated,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
