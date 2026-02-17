import type { TeamInviteEmailData } from '../emailService';

/**
 * Team Invitation Email Template
 * Responsive HTML email for team invitations
 */
export function teamInviteTemplate(data: TeamInviteEmailData): string {
    const { teamName, inviterName, inviteLink, role, expiresInDays = 7 } = data;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #1a1a1a;">
                                Whitespace CRM
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                                You're invited to join ${escapeHtml(teamName)}
                            </h2>
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                <strong>${escapeHtml(inviterName)}</strong> has invited you to join their team as a <strong>${escapeHtml(role)}</strong>.
                            </p>
                            
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                Click the button below to accept the invitation and start collaborating with your team.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="${escapeHtml(inviteLink)}" style="display: inline-block; padding: 14px 32px; background-color: #84cc16; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            View Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #84cc16; word-break: break-all;">
                                ${escapeHtml(inviteLink)}
                            </p>
                            
                            <!-- Expiration Notice -->
                            <div style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e;">
                                    ⏰ This invitation expires in ${expiresInDays} days
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                If you didn't expect this invitation, you can safely ignore this email.
                            </p>
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                © ${new Date().getFullYear()} Whitespace CRM. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
