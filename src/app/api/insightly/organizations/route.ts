import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        return Response.json(data || []);
    } catch (error: any) {
        console.error('Error fetching organizations:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
