import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { category, amount } = await request.json();
        const userEmail = session.user.email;

        const { data, error } = await supabaseAdmin
            .from('budgets')
            .upsert({
                user_email: userEmail,
                category,
                amount
            }, { onConflict: 'user_email, category' })
            .select()
            .single();

        if (error) {
            console.error('Error saving budget:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ budget: data });
    } catch (error) {
        console.error('Budgets API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = session.user.email;

        const { data, error } = await supabaseAdmin
            .from('budgets')
            .select('*')
            .eq('user_email', userEmail)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching budgets:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ budgets: data || [] });
    } catch (error) {
        console.error('Budgets API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const userEmail = session.user.email;

        if (!category) {
            return NextResponse.json({ error: 'Category required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('budgets')
            .delete()
            .eq('category', category)
            .eq('user_email', userEmail);

        if (error) {
            console.error('Error deleting budget:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Budgets API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
