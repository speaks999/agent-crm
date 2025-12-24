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

// Client-side Supabase client for browser usage (uses anon key for auth)
let browserClient: ReturnType<typeof createClient> | null = null

// Custom fetch with error handling for network issues
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(input, init)
    return response
  } catch (error) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    console.error(`[Supabase] Network error fetching ${url}:`, error)
    
    // If this is an auth-related request that failed, clear stale session
    if (url.includes('/auth/') && typeof window !== 'undefined') {
      console.warn('[Supabase] Auth request failed, clearing potentially stale session')
      localStorage.removeItem('agent-crm-auth')
    }
    
    throw error
  }
}

export function createBrowserClient() {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  // Log initialization for debugging
  if (typeof window !== 'undefined') {
    console.log('[Supabase] Initializing browser client with URL:', url)
  }

  browserClient = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'agent-crm-auth',
    },
    global: {
      fetch: customFetch,
    },
  })

  return browserClient
}
