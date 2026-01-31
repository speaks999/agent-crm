import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Fixes corrupted user metadata by clearing the oversized avatar_url field
 * This is needed because a base64 image was stored instead of a URL,
 * causing the JWT to be 234KB instead of ~1KB
 */
export async function POST(req: Request) {
    try {
        const { access_token } = await req.json();
        
        if (!access_token) {
            return NextResponse.json({ error: 'No access token provided' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
        }

        // Extract user ID from the token payload (even if token is oversized)
        let userId: string | null = null;
        try {
            const parts = access_token.split('.');
            if (parts.length >= 2) {
                const payload = JSON.parse(atob(parts[1]));
                userId = payload.sub;
            }
        } catch (e) {
            return NextResponse.json({ error: 'Could not parse token to get user ID' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'No user ID found in token' }, { status: 400 });
        }

        // If we have service role key, use admin API
        if (supabaseServiceKey) {
            const adminClient = createClient(supabaseUrl, supabaseServiceKey);
            const { error: updateError } = await adminClient.auth.admin.updateUserById(
                userId,
                { 
                    user_metadata: { 
                        avatar_url: '',  // Clear the corrupted avatar
                    }
                }
            );

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            return NextResponse.json({ 
                success: true, 
                message: 'Avatar URL cleared. Please sign out and sign back in.',
                userId 
            });
        }

        // Without service role key, try using user's own session to update
        // Create a client and set the session manually
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            }
        });

        // Try to update user's own metadata
        const { error: updateError } = await userClient.auth.updateUser({
            data: { 
                avatar_url: '',  // Clear the corrupted avatar
            }
        });

        if (updateError) {
            return NextResponse.json({ 
                error: updateError.message,
                hint: 'You may need to set SUPABASE_SERVICE_ROLE_KEY in your .env file'
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Avatar URL cleared. Please sign out and sign back in.',
            userId 
        });

    } catch (error: any) {
        console.error('Fix avatar error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
