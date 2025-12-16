import { supabase } from '@/lib/supabaseClient';

export const GET = async () => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('project_name', { ascending: true });

        if (error) throw error;
        return Response.json(data || []);
    } catch (error: any) {
        console.error('Error fetching projects:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
};
