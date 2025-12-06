import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth Callback Route
 * 
 * This route handles email confirmation callbacks from Supabase.
 * When users click the confirmation link in their email, they are redirected
 * to this route with a token that verifies their email address.
 * 
 * Flow:
 * 1. User signs up and receives confirmation email
 * 2. User clicks link in email → redirects to /auth/callback?token_hash=...&type=signup
 * 3. This route verifies the token and creates a session
 * 4. User is redirected to dashboard (or login if verification fails)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const errorMessage = encodeURIComponent('Server configuration error');
    return NextResponse.redirect(new URL(`/login?error=${errorMessage}`, request.url));
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (token_hash && type) {
    // Exchange the token for a session
    // This is used for email confirmations and password resets
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any, // 'email' | 'recovery' | 'magiclink' | etc.
    });

    if (!error && data.session) {
      // Success - user is confirmed and has a session
      // Supabase handles session cookies automatically via the client
      // Redirect to dashboard
      return NextResponse.redirect(new URL(next, request.url));
    } else if (error) {
      // Error verifying token
      const errorMessage = encodeURIComponent(error.message || 'Invalid or expired verification link');
      return NextResponse.redirect(new URL(`/login?error=${errorMessage}`, request.url));
    }
  }

  // If there's an error or no token, redirect to login with error message
  const errorMessage = encodeURIComponent('Invalid or expired verification link');
  return NextResponse.redirect(new URL(`/login?error=${errorMessage}`, request.url));
}
