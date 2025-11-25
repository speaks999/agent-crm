import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('title', { ascending: true });

        if (error) throw error;

        return Response.json(data || []);
    } catch (error: any) {
        console.error('Error fetching tasks:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
