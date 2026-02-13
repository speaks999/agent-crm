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
 * 4. For new signups, automatically creates a default team for the user
 * 5. User is redirected to dashboard (or login if verification fails)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const errorMessage = encodeURIComponent('Server configuration error');
    return NextResponse.redirect(new URL(`/login?error=${errorMessage}`, request.url));
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  // Service role client for admin operations (creating teams)
  const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  if (token_hash && type) {
    // Exchange the token for a session
    // This is used for email confirmations and password resets
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any, // 'email' | 'recovery' | 'magiclink' | etc.
    });

    if (!error && data.session && data.user) {
      // Success - user is confirmed and has a session
      
      // For new signups, create a default team
      if (type === 'signup' && supabaseAdmin) {
        try {
          // Check if user already has a team (in case of re-verification)
          const { data: existingMemberships } = await supabaseAdmin
            .from('team_memberships')
            .select('id')
            .eq('user_id', data.user.id)
            .limit(1);

          if (!existingMemberships || existingMemberships.length === 0) {
            // Get user metadata for team name
            const metadata = data.user.user_metadata || {};
            const companyName = metadata.company_name;
            const firstName = metadata.first_name;
            const lastName = metadata.last_name;
            
            // Use company name if provided, otherwise use user's name
            let teamName: string;
            if (companyName) {
              teamName = companyName;
            } else if (firstName && lastName) {
              teamName = `${firstName} ${lastName}'s Team`;
            } else {
              teamName = getTeamNameFromEmail(data.user.email || 'User');
            }
            
            // Create the team
            const { data: team, error: teamError } = await supabaseAdmin
              .from('teams')
              .insert({
                name: teamName,
                owner_id: data.user.id,
              })
              .select()
              .single();

            if (!teamError && team) {
              // Add user as owner in memberships
              await supabaseAdmin
                .from('team_memberships')
                .insert({
                  team_id: team.id,
                  user_id: data.user.id,
                  role: 'owner',
                });

              // Also add as a team_members record so they show up on the team page
              await supabaseAdmin
                .from('team_members')
                .insert({
                  team_id: team.id,
                  user_id: data.user.id,
                  first_name: firstName || '',
                  last_name: lastName || '',
                  email: data.user.email || '',
                  role: 'admin',
                  active: true,
                });

              // Set as current team
              await supabaseAdmin
                .from('user_team_preferences')
                .upsert({
                  user_id: data.user.id,
                  current_team_id: team.id,
                }, {
                  onConflict: 'user_id'
                });

              console.log(`Created team "${teamName}" for user ${data.user.email}`);
            }
          }
        } catch (teamErr) {
          // Log but don't fail auth - team can be created later
          console.error('Error creating default team:', teamErr);
        }
      }
      
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

/**
 * Generate a team name from email address
 * e.g., "john.doe@company.com" -> "John's Team"
 */
function getTeamNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  // Get first name (before any dots or underscores)
  const firstName = localPart.split(/[._-]/)[0];
  // Capitalize first letter
  const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  return `${capitalized}'s Team`;
}
