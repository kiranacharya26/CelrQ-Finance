import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { email } = body;
        const { id: connectionId } = await params;

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('bank_connections')
            .delete()
            .eq('id', connectionId)
            .eq('user_email', email);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting bank connection:', error);
        return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }
}
