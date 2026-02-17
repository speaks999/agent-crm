import type { WelcomeEmailData } from '../emailService';

/**
 * Welcome Email Template
 * Sent to new users after signup
 */
export function welcomeTemplate(data: WelcomeEmailData): string {
    const { firstName, teamName } = data;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Whitespace CRM</title>
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
                                Welcome to ${escapeHtml(teamName)}! 🎉
                            </h2>
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                Hi ${escapeHtml(firstName)},
                            </p>
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                Thanks for signing up! Your account has been created and you're ready to start managing your customer relationships.
                            </p>
                            
                            <h3 style="margin: 30px 0 15px; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                                Getting Started
                            </h3>
                            
                            <!-- Feature List -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top;">
                                        <span style="font-size: 20px; margin-right: 10px;">📊</span>
                                        <strong style="color: #1a1a1a;">Dashboard:</strong>
                                        <span style="color: #4a4a4a;"> Get a bird's-eye view of your pipeline and activities</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top;">
                                        <span style="font-size: 20px; margin-right: 10px;">👥</span>
                                        <strong style="color: #1a1a1a;">Contacts:</strong>
                                        <span style="color: #4a4a4a;"> Manage your relationships and track interactions</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top;">
                                        <span style="font-size: 20px; margin-right: 10px;">💼</span>
                                        <strong style="color: #1a1a1a;">Opportunities:</strong>
                                        <span style="color: #4a4a4a;"> Track deals through your sales pipeline</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top;">
                                        <span style="font-size: 20px; margin-right: 10px;">🤝</span>
                                        <strong style="color: #1a1a1a;">Team:</strong>
                                        <span style="color: #4a4a4a;"> Invite team members and collaborate together</span>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #84cc16; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            Go to Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                If you have any questions or need help getting started, we're here to support you!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                Happy selling! 🚀
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
