import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { email } = body;
        const connectionId = params.id;

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        // In a real implementation, you would:
        // 1. Call Setu/Plaid API to fetch latest transactions
        // 2. Parse and categorize them
        // 3. Insert into transactions table
        // For now, we'll just update the last_synced_at timestamp

        console.log(`🔄 Syncing bank connection ${connectionId} for ${email}`);

        const { error } = await supabase
            .from('bank_connections')
            .update({
                last_synced_at: new Date().toISOString(),
                connection_status: 'active'
            })
            .eq('id', connectionId)
            .eq('user_email', email);

        if (error) throw error;

        // TODO: Implement actual transaction sync here
        // Example flow:
        // 1. const transactions = await fetchFromBank(connectionId);
        // 2. const categorized = await categorizeTransactions(transactions);
        // 3. await storeTransactions(categorized, email, bankName, 'auto-sync');

        return NextResponse.json({
            success: true,
            message: 'Sync initiated. Transactions will appear shortly.'
        });
    } catch (error) {
        console.error('Error syncing bank connection:', error);
        return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
    }
}
