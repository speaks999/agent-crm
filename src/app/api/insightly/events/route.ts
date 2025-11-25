import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('start_date_utc', { ascending: true });

        if (error) throw error;

        return Response.json(data || []);
    } catch (error: any) {
        console.error('Error fetching events:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
