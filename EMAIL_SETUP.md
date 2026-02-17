# Email Notifications Setup

This document explains how to configure and use the email notification system.

## Email Service Provider

The system uses **Resend** (https://resend.com) for sending transactional emails.

## Configuration

### 1. Sign Up for Resend

1. Go to https://resend.com and create an account
2. Verify your domain (or use `onboarding@resend.dev` for testing)
3. Generate an API key from the dashboard

### 2. Add Environment Variables

Add these to your `.env.local` file:

```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="Whitespace CRM <noreply@yourdomain.com>"

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, replace `http://localhost:3000` with your actual domain.

### 3. Restart the Server

After adding environment variables:

```bash
npm run dev
```

## Email Types

### 1. Team Invitations
**Triggered:** When an admin/owner invites someone to join a team

**Contains:**
- Team name
- Inviter's name
- Role being offered
- Link to view invitations
- 7-day expiration notice

**API:** `POST /api/teams/invites`

### 2. Welcome Email
**Triggered:** When a new user signs up

**Contains:**
- Welcome message
- Getting started guide
- Links to key features
- Direct link to dashboard

**API:** Auth callback during signup

### 3. Password Reset Notification
**Triggered:** When a user requests a password reset

**Contains:**
- Confirmation that reset was requested
- Security notice
- (Optional) Reset link if provided by Supabase

**API:** `POST /api/notifications/password-reset`

### 4. Team Updates
**Triggered:** When team changes occur

**Types:**
- Member added to team
- Member removed from team
- Role changed
- Team renamed (future)

**Contains:**
- Update details
- Link to team settings

**API:** Various team management endpoints

## Testing Emails

### Send Test Emails

Use the admin test endpoint to send sample emails:

```bash
# Send all test emails
curl "http://localhost:3000/api/admin/test-emails?to=your@email.com&type=all"

# Send specific email type
curl "http://localhost:3000/api/admin/test-emails?to=your@email.com&type=invite"
curl "http://localhost:3000/api/admin/test-emails?to=your@email.com&type=welcome"
curl "http://localhost:3000/api/admin/test-emails?to=your@email.com&type=reset"
curl "http://localhost:3000/api/admin/test-emails?to=your@email.com&type=update"
```

### Preview Email Templates

To preview email HTML in development, you can import and render templates:

```typescript
import { previewEmailHtml } from '@/lib/email/testEmails';

const html = previewEmailHtml('invite'); // 'invite', 'welcome', 'reset', 'update'
```

## Email Deliverability

### Development
- Use `onboarding@resend.dev` as sender (no domain verification needed)
- Resend free tier: 100 emails/day

### Production
1. **Verify your domain** in Resend dashboard
2. Add DNS records (SPF, DKIM)
3. Test deliverability with mail-tester.com
4. Monitor bounce rates in Resend dashboard

## Rate Limits

**Resend Free Tier:**
- 100 emails/day
- 3,000 emails/month
- All features included

**Upgrade if needed:**
- Pro: $20/month for 50,000 emails
- Business: Custom pricing

## Troubleshooting

### Emails Not Sending

1. **Check environment variables:**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Check server logs:**
   Look for `[Email]` prefixed logs

3. **Verify Resend API key:**
   - Log into Resend dashboard
   - Check API key is active
   - Check monthly limit not exceeded

### Emails Going to Spam

1. Verify your domain in Resend
2. Add SPF/DKIM DNS records
3. Avoid spam trigger words
4. Keep content professional

### Missing Variables

If `RESEND_API_KEY` is not set:
- Emails will be logged but not sent
- Warning message in console: `[Email] RESEND_API_KEY not configured`
- Application continues to work (graceful degradation)

## Email Logs

All email attempts are logged to the console with:
- Email type
- Recipient
- Status (sent/failed)
- Timestamp
- Error details (if failed)

Format: `[Email Log] { type, to, subject, status, ... }`

## File Structure

```
src/lib/email/
├── emailService.ts       # Core email service with Resend
├── emailLogger.ts        # Logging utilities
├── testEmails.ts         # Testing helpers
└── templates/
    ├── teamInvite.ts     # Team invitation template
    ├── welcome.ts        # Welcome email template
    ├── passwordReset.ts  # Password reset template
    └── teamUpdate.ts     # Team update template
```

## API Endpoints

- `POST /api/teams/invites` - Sends team invite email
- `POST /api/notifications/password-reset` - Sends reset notification
- `POST /api/team` - Sends member added notification
- `PUT /api/team` - Sends role changed notification
- `DELETE /api/team` - Sends member removed notification
- `GET /api/admin/test-emails` - Send test emails (development)

## Security

- All emails use HTML escaping to prevent XSS
- Email addresses validated before sending
- Rate limiting via Resend
- Graceful failure (app works even if emails fail)
- No sensitive data in email bodies
