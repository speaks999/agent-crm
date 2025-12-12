import { createClient } from '@supabase/supabase-js'

// We don't ship generated DB types in this repo; keep Supabase typed as `any`
// so `.from('table')` doesn't collapse to `never` during typechecking.
type SupabaseClient = ReturnType<typeof createClient<any>>

let _supabase: SupabaseClient | null = null

export function getSupabaseServerClient(): SupabaseClient {
  if (_supabase) return _supabase

  // Prefer server-only env vars, but fall back to public ones for client-safe usage.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

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

  _supabase = createClient<any>(supabaseUrl, supabaseKey)
  return _supabase
}

/**
 * Back-compat export used across the codebase.
 *
 * IMPORTANT: this is lazily initialized so builds don't fail in environments
 * where Supabase env vars are not present (e.g. CI typechecking).
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseServerClient() as unknown as Record<PropertyKey, unknown>
    return client[prop]
  },
})

// Client-side Supabase client for browser usage (uses anon key for auth)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Avoid failing builds/SSR when NEXT_PUBLIC env vars aren't present.
    // The real client will be created at runtime when env vars exist.
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        )
      },
    })
  }

  return createClient<any>(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}
