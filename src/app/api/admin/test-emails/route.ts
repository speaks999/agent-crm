import { NextRequest, NextResponse } from 'next/server';
import { 
    testTeamInviteEmail, 
    testWelcomeEmail, 
    testPasswordResetEmail, 
    testTeamUpdateEmail,
    sendAllTestEmails 
} from '@/lib/email/testEmails';

/**
 * Admin endpoint to send test emails
 * GET /api/admin/test-emails?to=email@example.com&type=all
 */
export async function GET(req: NextRequest) {
    try {
        const to = req.nextUrl.searchParams.get('to') || 'test@example.com';
        const type = req.nextUrl.searchParams.get('type') || 'all';

        let result;

        switch (type) {
            case 'invite':
                result = await testTeamInviteEmail(to);
                break;
            case 'welcome':
                result = await testWelcomeEmail(to);
                break;
            case 'reset':
                result = await testPasswordResetEmail(to);
                break;
            case 'update':
                result = await testTeamUpdateEmail(to);
                break;
            case 'all':
                result = await sendAllTestEmails(to);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid type. Use: invite, welcome, reset, update, or all' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            type,
            to,
            result
        });
    } catch (error: any) {
        console.error('Error sending test email:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
