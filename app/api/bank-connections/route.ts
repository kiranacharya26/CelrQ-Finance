import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('bank_connections')
            .select('*')
            .eq('user_email', userEmail)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ connections: data || [] });
    } catch (error) {
        console.error('Error fetching bank connections:', error);
        return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, bank_name, account_number, account_type } = body;

        if (!email || !bank_name || !account_number) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Mask account number (store only last 4 digits)
        const masked = account_number.slice(-4);

        // In a real implementation, you would:
        // 1. Initiate OAuth flow with Setu/Plaid
        // 2. Get consent from user
        // 3. Store provider_account_id
        // For now, we'll create a pending connection

        const { data, error } = await supabase
            .from('bank_connections')
            .insert({
                user_email: email,
                bank_name,
                account_number_masked: masked,
                account_type: account_type || 'savings',
                connection_status: 'pending',
                provider: 'manual'
            })
            .select()
            .single();

        if (error) throw error;

        // TODO: Initiate actual bank connection flow here
        // For demo purposes, we'll auto-activate after 2 seconds
        setTimeout(async () => {
            await supabase
                .from('bank_connections')
                .update({ connection_status: 'active', last_synced_at: new Date().toISOString() })
                .eq('id', data.id);
        }, 2000);

        return NextResponse.json({ connection: data });
    } catch (error) {
        console.error('Error creating bank connection:', error);
        return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }
}
