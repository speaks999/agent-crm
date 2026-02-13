import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Helper to get user from request
async function getUserFromRequest(req: NextRequest) {
    if (!supabaseAdmin) {
        return null;
    }
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
        return null;
    }
    
    return user;
}

export async function GET(req: NextRequest) {
    try {
        // Check authentication
        const user = await getUserFromRequest(req);
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        if (!supabaseAdmin) {
            return Response.json({ error: 'Database not configured' }, { status: 500 });
        }
        
        const { data, error } = await supabaseAdmin
            .from('contacts')
            .select('*, accounts(name)')
            .order('created_at', { ascending: false });

        if (error) {
            // If table doesn't exist, return empty array
            if (error.code === '42P01') {
                return Response.json([]);
            }
            throw error;
        }

        return Response.json(data);
    } catch (error: any) {
        console.error('Error fetching contacts:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

