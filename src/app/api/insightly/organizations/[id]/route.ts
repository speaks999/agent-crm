import { supabase } from '@/lib/supabaseClient';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) throw error;

        return Response.json(data);
    } catch (error: any) {
        console.error('Error fetching organization:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
