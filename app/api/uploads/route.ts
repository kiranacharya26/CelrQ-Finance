import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
        return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
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
        // 1. Delete the upload record
        // Note: If you set up ON DELETE CASCADE in SQL, this will automatically delete transactions.
        // If not, you need to delete transactions first.
        // Assuming CASCADE is set up as per migration plan.
        const { error } = await supabase
            .from('uploads')
            .delete()
            .eq('id', id)
            .eq('user_email', userEmail);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting upload:', error);
        return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
    }
}
