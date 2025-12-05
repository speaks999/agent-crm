import { createClient } from '@supabase/supabase-js'

// Prefer server-only env vars, but fall back to public ones for client-safe usage.
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL

// On the server we can use the service role key; otherwise fall back to anon.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
