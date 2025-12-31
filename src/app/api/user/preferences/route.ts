import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Create a Supabase client with the service role for server-side operations
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, key);
}

// Create a Supabase client that respects RLS using the user's token
function getSupabaseWithAuth(authHeader: string | null) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, anonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const supabase = getSupabaseWithAuth(authHeader);
    
    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch user preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .select('widget_layout, settings')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      // PGRST116 = no rows returned (user has no preferences yet)
      if (error.code === 'PGRST116') {
        return Response.json({
          widget_layout: null,
          settings: {},
        });
      }
      
      // 42P01 = table doesn't exist (migration not run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('user_preferences table does not exist. Please run the migration.');
        return Response.json({
          widget_layout: null,
          settings: {},
          _warning: 'Database table not found - using local storage only',
        });
      }
      
      console.error('Error fetching preferences:', error);
      return Response.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }
    
    // Return preferences or defaults
    return Response.json({
      widget_layout: data?.widget_layout || null,
      settings: data?.settings || {},
    });
  } catch (error: any) {
    console.error('Preferences GET error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const supabase = getSupabaseWithAuth(authHeader);
    
    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { widget_layout, settings } = body;
    
    // Upsert preferences (insert or update)
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          widget_layout: widget_layout ?? undefined,
          settings: settings ?? undefined,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select('widget_layout, settings')
      .single();
    
    if (error) {
      // 42P01 = table doesn't exist (migration not run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('user_preferences table does not exist. Please run the migration.');
        return Response.json({
          widget_layout: widget_layout || null,
          settings: settings || {},
          _warning: 'Database table not found - preferences saved locally only',
        });
      }
      
      console.error('Error saving preferences:', error);
      return Response.json({ error: 'Failed to save preferences' }, { status: 500 });
    }
    
    return Response.json({
      widget_layout: data?.widget_layout || null,
      settings: data?.settings || {},
    });
  } catch (error: any) {
    console.error('Preferences POST error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

