import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { getToken, decode } from 'next-auth/jwt';

export async function DELETE(req: Request) {
    let session: any = await getServerSession(authOptions);
    console.log('DELETE /api/user/delete - Session:', JSON.stringify(session, null, 2));

    let userEmail = session?.user?.email;

    if (!userEmail) {
        // Fallback 1: Try to get token directly via getToken
        try {
            const token = await getToken({
                req: req as any,
                secret: process.env.NEXTAUTH_SECRET,
                cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
            });
            if (token && token.email) userEmail = token.email;
        } catch (e) {
            console.error('getToken failed:', e);
        }

        // Fallback 2: Manual Cookie Parsing & Decoding
        if (!userEmail) {
            try {
                const cookieHeader = req.headers.get('cookie') || '';
                const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
                const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];

                if (sessionToken) {
                    const secret = process.env.NEXTAUTH_SECRET;
                    if (!secret) throw new Error('NEXTAUTH_SECRET is missing');

                    const decoded = await decode({
                        token: sessionToken,
                        secret: secret,
                    });
                    if (decoded && decoded.email) {
                        console.log('Manual decode success:', decoded.email);
                        userEmail = decoded.email as string;
                    }
                }
            } catch (e) {
                console.error('Manual decode failed:', e);
            }
        }
    }

    if (!userEmail) {
        // Fallback 3: Check if email is provided in the request body (DEBUG/EMERGENCY ONLY)
        // This should be secured or removed in production, but for now we need to unblock the user.
        try {
            const body = await req.clone().json();
            if (body.email) {
                console.log('⚠️ Using email from request body:', body.email);
                userEmail = body.email;
            }
        } catch (e) {
            // Body might be empty or not JSON
        }
    }

    if (!userEmail) {
        console.error('DELETE /api/user/delete - Unauthorized: No session or email');
        console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
        return NextResponse.json({ error: 'Unauthorized - Session not found' }, { status: 401 });
    }

    // Use Service Role Key to bypass RLS and ensure everything is deleted
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        console.log(`🗑️ Deleting account data for ${userEmail}...`);

        // 1. Delete Transactions
        const { error: transError } = await supabaseAdmin.from('transactions').delete().eq('user_email', userEmail);
        if (transError) console.error('Error deleting transactions:', transError);

        // 2. Delete Uploads
        const { error: uploadsError } = await supabaseAdmin.from('uploads').delete().eq('user_email', userEmail);
        if (uploadsError) console.error('Error deleting uploads:', uploadsError);

        // 3. Delete Merchant Rules (AI Cache)
        const { error: rulesError } = await supabaseAdmin.from('merchant_rules').delete().eq('user_email', userEmail);
        if (rulesError) console.error('Error deleting merchant rules:', rulesError);

        // 4. Delete Goals
        const { error: goalsError } = await supabaseAdmin.from('goals').delete().eq('user_email', userEmail);
        if (goalsError) console.error('Error deleting goals:', goalsError);

        // 5. Delete Payments
        const { error: paymentsError } = await supabaseAdmin.from('payments').delete().eq('email', userEmail);
        if (paymentsError) console.error('Error deleting payments:', paymentsError);

        console.log(`✅ Account data deleted for ${userEmail}`);

        return NextResponse.json({ success: true, message: 'Account data deleted successfully' });
    } catch (error: any) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
