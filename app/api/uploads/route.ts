import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
        return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('uploads')
            .select('*')
            .eq('user_email', userEmail)
            .order('upload_date', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ uploads: data });
    } catch (error) {
        console.error('Error fetching uploads:', error);
        return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('email');

    if (!id || !userEmail) {
        return NextResponse.json({ error: 'Upload ID and user email are required' }, { status: 400 });
    }

    try {
        // 1. Delete all transactions associated with this upload
        const { error: transError } = await supabaseAdmin
            .from('transactions')
            .delete()
            .eq('upload_id', id)
            .eq('user_email', userEmail);

        if (transError) {
            console.error('Error deleting transactions:', transError);
            // We continue anyway to try and delete the upload record
        }

        // 2. Delete the upload record
        const { error: uploadError } = await supabaseAdmin
            .from('uploads')
            .delete()
            .eq('id', id)
            .eq('user_email', userEmail);

        if (uploadError) throw uploadError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting upload:', error);
        return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
    }
}
