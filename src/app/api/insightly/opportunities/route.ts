import { supabase } from '@/lib/supabaseClient';

export const GET = async () => {
    try {
        const { data, error } = await supabase
            .from('opportunities')
            .select('*')
            .order('opportunity_name', { ascending: true });

        if (error) throw error;
        return Response.json(data || []);
    } catch (error: any) {
        console.error('Error fetching opportunities:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
};
