import { supabase } from '@/lib/supabaseClient';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { data, error } = await supabase
            .from('contacts')
            .select('*, accounts(id, name)')
            .eq('id', id)
            .single();

        if (error) throw error;

        return Response.json(data);
    } catch (error: any) {
        console.error('Error fetching contact:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

