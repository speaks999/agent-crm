import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function GET() {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
        }

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
