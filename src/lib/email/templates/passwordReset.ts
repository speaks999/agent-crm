import type { PasswordResetEmailData } from '../emailService';

/**
 * Password Reset Email Template
 * Notification that a password reset was requested
 */
export function passwordResetTemplate(data: PasswordResetEmailData): string {
    const { resetLink } = data;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Requested</title>
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
                                Password Reset Requested
                            </h2>
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                We received a request to reset your password for your Whitespace CRM account.
                            </p>
                            
                            ${resetLink ? `
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                Click the button below to reset your password:
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="${escapeHtml(resetLink)}" style="display: inline-block; padding: 14px 32px; background-color: #84cc16; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #84cc16; word-break: break-all;">
                                ${escapeHtml(resetLink)}
                            </p>
                            ` : `
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                You should receive a password reset link shortly. Please check your email inbox.
                            </p>
                            `}
                            
                            <!-- Security Notice -->
                            <div style="padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 20px;">
                                <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #991b1b; font-weight: 600;">
                                    🔒 Security Notice
                                </p>
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991b1b;">
                                    If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account's security.
                                </p>
                            </div>
                            
                            ${resetLink ? `
                            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                This link will expire in 1 hour for security reasons.
                            </p>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb;">
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
