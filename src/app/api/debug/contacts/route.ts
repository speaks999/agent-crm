import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get recent contacts
        const { data: contacts, error } = await supabaseAdmin
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return NextResponse.json({
            total: contacts?.length || 0,
            contacts: contacts || [],
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
