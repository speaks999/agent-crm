import { Resend } from 'resend';
import { teamInviteTemplate } from './templates/teamInvite';
import { welcomeTemplate } from './templates/welcome';
import { passwordResetTemplate } from './templates/passwordReset';
import { teamUpdateTemplate } from './templates/teamUpdate';
import { logEmail } from './emailLogger';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Whitespace CRM <noreply@whitespace.company>';

let resend: Resend | null = null;

// Initialize Resend client
function getResendClient(): Resend | null {
    if (!resendApiKey) {
        console.warn('[Email] RESEND_API_KEY not configured. Emails will not be sent.');
        return null;
    }
    
    if (!resend) {
        resend = new Resend(resendApiKey);
    }
    
    return resend;
}

export interface TeamInviteEmailData {
    to: string;
    teamName: string;
    inviterName: string;
    inviteLink: string;
    role: string;
    expiresInDays?: number;
}

export interface WelcomeEmailData {
    to: string;
    firstName: string;
    teamName: string;
}

export interface PasswordResetEmailData {
    to: string;
    resetLink?: string;
}

export interface TeamUpdateEmailData {
    to: string;
    teamName: string;
    updateType: 'member_added' | 'member_removed' | 'role_changed' | 'team_renamed';
    details: string;
}

/**
 * Send a team invitation email
 */
export async function sendTeamInvite(data: TeamInviteEmailData): Promise<{ success: boolean; error?: string }> {
    const client = getResendClient();
    
    if (!client) {
        console.warn('[Email] Skipping team invite email - Resend not configured');
        return { success: false, error: 'Email service not configured' };
    }
    
    try {
        const html = teamInviteTemplate(data);
        
        const result = await client.emails.send({
            from: fromEmail,
            to: data.to,
            subject: `You're invited to join ${data.teamName}`,
            html,
        });
        
        await logEmail({
            type: 'team_invite',
            to: data.to,
            subject: `You're invited to join ${data.teamName}`,
            status: 'sent',
            emailId: result.data?.id,
        });
        
        console.log('[Email] Team invite sent to:', data.to);
        return { success: true };
    } catch (error: any) {
        console.error('[Email] Failed to send team invite:', error);
        
        await logEmail({
            type: 'team_invite',
            to: data.to,
            subject: `You're invited to join ${data.teamName}`,
            status: 'failed',
            error: error.message,
        });
        
        return { success: false, error: error.message };
    }
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    const client = getResendClient();
    
    if (!client) {
        console.warn('[Email] Skipping welcome email - Resend not configured');
        return { success: false, error: 'Email service not configured' };
    }
    
    try {
        const html = welcomeTemplate(data);
        
        const result = await client.emails.send({
            from: fromEmail,
            to: data.to,
            subject: `Welcome to ${data.teamName}!`,
            html,
        });
        
        await logEmail({
            type: 'welcome',
            to: data.to,
            subject: `Welcome to ${data.teamName}!`,
            status: 'sent',
            emailId: result.data?.id,
        });
        
        console.log('[Email] Welcome email sent to:', data.to);
        return { success: true };
    } catch (error: any) {
        console.error('[Email] Failed to send welcome email:', error);
        
        await logEmail({
            type: 'welcome',
            to: data.to,
            subject: `Welcome to ${data.teamName}!`,
            status: 'failed',
            error: error.message,
        });
        
        return { success: false, error: error.message };
    }
}

/**
 * Send a password reset notification
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
    const client = getResendClient();
    
    if (!client) {
        console.warn('[Email] Skipping password reset email - Resend not configured');
        return { success: false, error: 'Email service not configured' };
    }
    
    try {
        const html = passwordResetTemplate(data);
        
        const result = await client.emails.send({
            from: fromEmail,
            to: data.to,
            subject: 'Password Reset Requested',
            html,
        });
        
        await logEmail({
            type: 'password_reset',
            to: data.to,
            subject: 'Password Reset Requested',
            status: 'sent',
            emailId: result.data?.id,
        });
        
        console.log('[Email] Password reset email sent to:', data.to);
        return { success: true };
    } catch (error: any) {
        console.error('[Email] Failed to send password reset email:', error);
        
        await logEmail({
            type: 'password_reset',
            to: data.to,
            subject: 'Password Reset Requested',
            status: 'failed',
            error: error.message,
        });
        
        return { success: false, error: error.message };
    }
}

/**
 * Send a team update notification
 */
export async function sendTeamUpdate(data: TeamUpdateEmailData): Promise<{ success: boolean; error?: string }> {
    const client = getResendClient();
    
    if (!client) {
        console.warn('[Email] Skipping team update email - Resend not configured');
        return { success: false, error: 'Email service not configured' };
    }
    
    try {
        const html = teamUpdateTemplate(data);
        
        const subject = `Update from ${data.teamName}`;
        
        const result = await client.emails.send({
            from: fromEmail,
            to: data.to,
            subject,
            html,
        });
        
        await logEmail({
            type: 'team_update',
            to: data.to,
            subject,
            status: 'sent',
            emailId: result.data?.id,
        });
        
        console.log('[Email] Team update email sent to:', data.to);
        return { success: true };
    } catch (error: any) {
        console.error('[Email] Failed to send team update email:', error);
        
        await logEmail({
            type: 'team_update',
            to: data.to,
            subject: `Update from ${data.teamName}`,
            status: 'failed',
            error: error.message,
        });
        
        return { success: false, error: error.message };
    }
}
