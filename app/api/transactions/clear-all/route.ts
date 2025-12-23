import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Delete all transactions for this user
        const { error: transError } = await supabaseAdmin
            .from('transactions')
            .delete()
            .eq('user_email', userEmail);

        if (transError) throw transError;

        // 2. Delete all upload records for this user
        const { error: uploadError } = await supabaseAdmin
            .from('uploads')
            .delete()
            .eq('user_email', userEmail);

        if (uploadError) throw uploadError;

        return NextResponse.json({ success: true, message: 'All transaction data cleared' });
    } catch (error: any) {
        console.error('Error clearing transactions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
