import { sendTeamInvite, sendWelcomeEmail, sendPasswordResetEmail, sendTeamUpdate } from './emailService';

/**
 * Test email helper functions for development
 */

/**
 * Send a test team invite email
 */
export async function testTeamInviteEmail(to: string = 'test@example.com') {
    console.log('[Email Test] Sending test team invite to:', to);
    
    const result = await sendTeamInvite({
        to,
        teamName: 'Acme Corp Team',
        inviterName: 'John Doe',
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/team/invites`,
        role: 'member',
        expiresInDays: 7,
    });
    
    console.log('[Email Test] Result:', result);
    return result;
}

/**
 * Send a test welcome email
 */
export async function testWelcomeEmail(to: string = 'test@example.com') {
    console.log('[Email Test] Sending test welcome email to:', to);
    
    const result = await sendWelcomeEmail({
        to,
        firstName: 'Test User',
        teamName: 'Acme Corp Team',
    });
    
    console.log('[Email Test] Result:', result);
    return result;
}

/**
 * Send a test password reset email
 */
export async function testPasswordResetEmail(to: string = 'test@example.com') {
    console.log('[Email Test] Sending test password reset email to:', to);
    
    const result = await sendPasswordResetEmail({
        to,
        resetLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=test123`,
    });
    
    console.log('[Email Test] Result:', result);
    return result;
}

/**
 * Send a test team update email
 */
export async function testTeamUpdateEmail(to: string = 'test@example.com') {
    console.log('[Email Test] Sending test team update email to:', to);
    
    const result = await sendTeamUpdate({
        to,
        teamName: 'Acme Corp Team',
        updateType: 'member_added',
        details: 'Jane Smith has joined your team as an admin.',
    });
    
    console.log('[Email Test] Result:', result);
    return result;
}

/**
 * Send all test emails to verify email configuration
 */
export async function sendAllTestEmails(to: string = 'test@example.com') {
    console.log('[Email Test] Sending all test emails to:', to);
    
    const results = await Promise.all([
        testTeamInviteEmail(to),
        testWelcomeEmail(to),
        testPasswordResetEmail(to),
        testTeamUpdateEmail(to),
    ]);
    
    const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
    };
    
    console.log('[Email Test] Summary:', summary);
    return summary;
}

/**
 * Preview email HTML in browser (development only)
 */
export function previewEmailHtml(type: 'invite' | 'welcome' | 'reset' | 'update'): string {
    const { teamInviteTemplate } = require('./templates/teamInvite');
    const { welcomeTemplate } = require('./templates/welcome');
    const { passwordResetTemplate } = require('./templates/passwordReset');
    const { teamUpdateTemplate } = require('./templates/teamUpdate');
    
    switch (type) {
        case 'invite':
            return teamInviteTemplate({
                teamName: 'Acme Corp Team',
                inviterName: 'John Doe',
                inviteLink: 'http://localhost:3000/team/invites',
                role: 'member',
                expiresInDays: 7,
            });
        case 'welcome':
            return welcomeTemplate({
                firstName: 'Test User',
                teamName: 'Acme Corp Team',
            });
        case 'reset':
            return passwordResetTemplate({
                resetLink: 'http://localhost:3000/auth/reset-password?token=test123',
            });
        case 'update':
            return teamUpdateTemplate({
                teamName: 'Acme Corp Team',
                updateType: 'member_added',
                details: 'Jane Smith has joined your team as an admin.',
            });
        default:
            return '<p>Invalid email type</p>';
    }
}
