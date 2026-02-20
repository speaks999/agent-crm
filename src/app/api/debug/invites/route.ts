import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
    try {
        // Get all team invites
        const { data: invites, error } = await supabaseAdmin
            .from('team_invites')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ invites: invites || [] });
    } catch (error: any) {
        console.error('Error fetching invites:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
