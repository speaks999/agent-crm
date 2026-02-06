# Authentication System

This document describes the authentication system implemented in the Whitespace CRM application.

## Overview

The authentication system uses Supabase Auth for secure user management with email and password authentication. **Email confirmations are enabled** - users must verify their email address before they can sign in to the application.

## Features

### Current Implementation

- ✅ **Email/Password Signup**: Users can create accounts with email and password
- ✅ **Email Confirmations**: Users must confirm their email before signing in
- ✅ **Resend Confirmation Email**: Users can request a new confirmation email
- ✅ **Secure Password Requirements**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- ✅ **Login/Logout**: Secure authentication with session management
- ✅ **Password Reset**: Forgot password flow with email reset links
- ✅ **Route Protection**: Protected routes require authentication
- ✅ **Session Management**: Automatic session refresh and persistence

### Foundation for Future Features

- 🔄 **2FA**: Placeholder in settings page for future implementation

## File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Auth state management and hooks
├── components/
│   ├── ProtectedRoute.tsx       # Route protection wrapper
│   └── Header.tsx                # Updated with user info and sign out
├── app/
│   ├── (auth)/                   # Auth pages (no sidebar/header)
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── signup/
│   │       └── page.tsx          # Signup page
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── layout.tsx           # Dashboard layout with protection
│   │   └── [all dashboard pages]
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts         # Email confirmation callback handler
│   │   ├── forgot-password/
│   │   │   └── page.tsx          # Forgot password page
│   │   └── reset-password/
│   │       └── page.tsx          # Reset password page
│   └── layout.tsx                # Root layout with AuthProvider
└── lib/
    └── supabaseClient.ts         # Supabase client configuration
```

## Usage

### Signing Up

1. Navigate to `/signup`
2. Enter email and password
3. Confirm password
4. Click "Create Account"
5. User is automatically signed in and redirected to dashboard

### Logging In

1. Navigate to `/login`
2. Enter email and password
3. Click "Sign In"
4. User is redirected to dashboard

### Password Reset

1. Navigate to `/login`
2. Click "Forgot password?"
3. Enter email address
4. Check email for reset link
5. Click link to reset password

### Using Auth in Components

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signOut, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protecting Routes

Routes in the `(dashboard)` route group are automatically protected. The `ProtectedRoute` component checks authentication and redirects to `/login` if not authenticated.

## Email Confirmations

Email confirmations are **enabled** by default. Users must confirm their email address before they can sign in.

### How It Works

1. **User Signs Up**: User creates an account with email and password
2. **Confirmation Email Sent**: Supabase sends a confirmation email with a verification link
3. **User Clicks Link**: Link redirects to `/auth/callback` which verifies the token
4. **Account Confirmed**: User is automatically signed in and redirected to dashboard

### Supabase Dashboard Configuration

To ensure email confirmations are working:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, verify:
   - ✅ **Enable email confirmations** is checked
   - Configure email templates if needed

### Email Template Configuration

The callback URL is already configured:
- **Redirect URL**: `https://yourdomain.com/auth/callback`

To ensure confirmation and reset emails always use your public domain (not localhost),
set `NEXT_PUBLIC_SITE_URL` in your environment.

### Resending Confirmation Emails

If a user doesn't receive the confirmation email, they can:
1. Click "Resend confirmation email" on the signup page
2. The system will send a new confirmation email

### Testing Email Confirmations

1. Create a new account at `/signup`
2. Check email inbox for confirmation link
3. Click the link in the email
4. Should redirect to `/auth/callback` which verifies the token
5. User is automatically signed in and redirected to dashboard

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Public base URL for auth emails
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For server-side operations
```

## Security Features

- **Password Hashing**: Handled by Supabase (bcrypt)
- **Session Management**: Secure HTTP-only cookies
- **CSRF Protection**: Built into Supabase Auth
- **Rate Limiting**: Configured in Supabase dashboard
- **Password Strength**: Enforced client-side and server-side

## Future Enhancements

- [ ] Email confirmation flow (infrastructure ready)
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, GitHub, etc.)
- [ ] Magic link authentication
- [ ] Account deletion with data export
- [ ] Session management UI (view active sessions)

## Troubleshooting

### "Missing Supabase environment variables"

Ensure `.env.local` contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Users can't sign up

1. Check Supabase dashboard → Authentication → Settings
2. Ensure email auth is enabled
3. Check for rate limiting
4. Verify environment variables are set

### Email confirmations not working

1. Verify email confirmations are enabled in Supabase dashboard
2. Check email template configuration
3. Verify callback URL is whitelisted in Supabase
4. Check browser console for errors

### Session not persisting

1. Check browser cookies are enabled
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
3. Check Supabase Auth settings for session duration

