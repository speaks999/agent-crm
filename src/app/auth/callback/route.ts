import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/emailService';

/**
 * Auth Callback Route
 *
 * Handles email confirmation callbacks from Supabase via both:
 *   - PKCE flow (?code=...) — default in Supabase v2 browser clients
 *   - Legacy flow (?token_hash=...&type=signup)
 *
 * After verifying the user, creates a default team for new signups
 * and redirects to the dashboard with session cookies set.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[auth/callback] Missing SUPABASE_URL or ANON_KEY');
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Server configuration error')}`, request.url),
    );
  }

  const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  // Create a cookie-aware Supabase client so the session persists after redirect
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll can throw when called from a Server Component; safe to ignore
          // in Route Handlers this won't happen
        }
      },
    },
  });

  let verifiedUser: { id: string; email?: string; user_metadata?: Record<string, any> } | null = null;

  // --- PKCE flow: ?code=... ---
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] Code exchange failed:', error.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }
    verifiedUser = data.user;
  }

  // --- Legacy token_hash flow: ?token_hash=...&type=signup ---
  if (!verifiedUser && token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (error || !data.session || !data.user) {
      const msg = error?.message || 'Invalid or expired verification link';
      console.error('[auth/callback] verifyOtp failed:', msg);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(msg)}`, request.url),
      );
    }
    verifiedUser = data.user;
  }

  // If neither flow produced a user, redirect with error
  if (!verifiedUser) {
    console.error('[auth/callback] No code or token_hash provided');
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Invalid or expired verification link')}`, request.url),
    );
  }

  // Ensure the user has a team (creates one for new signups, no-ops otherwise)
  if (supabaseAdmin) {
    try {
      await ensureUserHasTeam(supabaseAdmin, verifiedUser);
    } catch (teamErr) {
      console.error('[auth/callback] Error ensuring user has team:', teamErr);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}

/**
 * Ensure the user has at least one team. Creates one if they don't.
 */
async function ensureUserHasTeam(
  supabaseAdmin: ReturnType<typeof createClient>,
  user: { id: string; email?: string; user_metadata?: Record<string, any> },
) {
  const { data: existingMemberships, error: memErr } = await supabaseAdmin
    .from('team_memberships')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (memErr) {
    console.error('[auth/callback] Error checking memberships:', memErr.message);
  }

  if (existingMemberships && existingMemberships.length > 0) {
    console.log(`[auth/callback] User ${user.email} already has a team, skipping creation`);
    return;
  }

  const metadata = user.user_metadata || {};
  const companyName = metadata.company_name;
  const firstName = metadata.first_name;
  const lastName = metadata.last_name;

  let teamName: string;
  if (companyName) {
    teamName = companyName;
  } else if (firstName && lastName) {
    teamName = `${firstName} ${lastName}'s Team`;
  } else {
    teamName = getTeamNameFromEmail(user.email || 'User');
  }

  const { data: team, error: teamError } = await supabaseAdmin
    .from('teams')
    .insert({ name: teamName, owner_id: user.id })
    .select()
    .single();

  if (teamError || !team) {
    console.error('[auth/callback] Failed to create team:', teamError?.message);
    return;
  }

  // Add to team_memberships
  const { error: membershipErr } = await supabaseAdmin
    .from('team_memberships')
    .insert({ team_id: team.id, user_id: user.id, role: 'owner' });

  if (membershipErr) {
    console.error('[auth/callback] Failed to insert team_memberships:', membershipErr.message);
  }

  // Add to team_members so they appear on the team page.
  // Uses upsert helper to handle the legacy UNIQUE(email) constraint.
  await upsertTeamMember(supabaseAdmin, {
    team_id: team.id,
    user_id: user.id,
    first_name: firstName || '',
    last_name: lastName || '',
    email: user.email || '',
    role: 'admin',
    active: true,
  });

  // Set as current team
  const { error: prefErr } = await supabaseAdmin
    .from('user_team_preferences')
    .upsert(
      { user_id: user.id, current_team_id: team.id },
      { onConflict: 'user_id' },
    );

  if (prefErr) {
    console.error('[auth/callback] Failed to set user_team_preferences:', prefErr.message);
  }

  console.log(`[auth/callback] Created team "${teamName}" for user ${user.email}`);

  // Send welcome email (fire-and-forget)
  sendWelcomeEmail({
    to: user.email || '',
    firstName: firstName || user.email?.split('@')[0] || 'User',
    teamName,
  }).catch((err) => console.error('[auth/callback] Welcome email failed:', err));
}

function getTeamNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  const firstName = localPart.split(/[._-]/)[0];
  const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  return `${capitalized}'s Team`;
}

/**
 * Safely insert or update a team_members row, handling the legacy
 * UNIQUE(email) constraint that conflicts with multi-team support.
 */
async function upsertTeamMember(
  admin: ReturnType<typeof createClient>,
  payload: {
    team_id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    active: boolean;
  },
) {
  const { data: existing } = await admin
    .from('team_members')
    .select('id')
    .eq('team_id', payload.team_id)
    .eq('user_id', payload.user_id)
    .maybeSingle();

  if (existing) {
    await admin
      .from('team_members')
      .update({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        role: payload.role,
        active: payload.active,
      })
      .eq('id', existing.id);
    return;
  }

  const { error: insertErr } = await admin
    .from('team_members')
    .insert(payload);

  if (!insertErr) return;

  console.warn('[upsertTeamMember] insert failed, trying fallback:', insertErr.message);

  const { data: byUser } = await admin
    .from('team_members')
    .select('id')
    .eq('user_id', payload.user_id)
    .maybeSingle();

  if (byUser) {
    await admin
      .from('team_members')
      .update({
        team_id: payload.team_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        role: payload.role,
        active: payload.active,
      })
      .eq('id', byUser.id);
    return;
  }

  const { data: byEmail } = await admin
    .from('team_members')
    .select('id')
    .eq('email', payload.email)
    .maybeSingle();

  if (byEmail) {
    await admin
      .from('team_members')
      .update({
        team_id: payload.team_id,
        user_id: payload.user_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role: payload.role,
        active: payload.active,
      })
      .eq('id', byEmail.id);
  }
}
