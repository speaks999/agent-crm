import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Response.json(data || []);
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

