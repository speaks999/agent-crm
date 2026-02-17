import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email/emailService';

/**
 * POST /api/notifications/password-reset
 * Send password reset notification email
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, resetLink } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Send password reset notification
        const result = await sendPasswordResetEmail({
            to: email,
            resetLink, // Optional - Supabase sends the actual reset link
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to send email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password reset notification sent'
        });
    } catch (error: any) {
        console.error('Error sending password reset notification:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
