import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return Response.json(data || []);
    } catch (error: any) {
        console.error('Error fetching team members:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { first_name, last_name, email, role = 'member' } = body;

        if (!first_name || !last_name || !email) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('team_members')
            .insert([
                {
                    first_name,
                    last_name,
                    email,
                    role,
                    active: true,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        return Response.json(data);
    } catch (error: any) {
        console.error('Error creating team member:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return Response.json({ error: 'Missing member ID' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return Response.json(data);
    } catch (error: any) {
        console.error('Error updating team member:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return Response.json({ error: 'Missing member ID' }, { status: 400 });
        }

        // Soft delete by setting active to false
        const { error } = await supabase
            .from('team_members')
            .update({ active: false })
            .eq('id', id);

        if (error) throw error;

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting team member:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
