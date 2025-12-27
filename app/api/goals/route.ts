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

        const goal = await request.json();
        const userEmail = session.user.email;

        const { data, error } = await supabaseAdmin
            .from('goals')
            .insert({
                user_email: userEmail,
                name: goal.name,
                type: goal.type,
                target_amount: goal.targetAmount,
                current_amount: goal.currentAmount || 0,
                deadline: goal.targetDate || null,
                category: goal.category || null,
                icon: goal.icon || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving goal:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ goal: data });
    } catch (error) {
        console.error('Goals API error:', error);
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
            .from('goals')
            .select('*')
            .eq('user_email', userEmail)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching goals:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ goals: data || [] });
    } catch (error) {
        console.error('Goals API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, ...updates } = await request.json();
        const userEmail = session.user.email;

        const { data, error } = await supabaseAdmin
            .from('goals')
            .update({
                current_amount: updates.currentAmount,
                target_amount: updates.targetAmount,
                name: updates.name,
                deadline: updates.targetDate,
                category: updates.category,
                icon: updates.icon,
            })
            .eq('id', id)
            .eq('user_email', userEmail)
            .select()
            .single();

        if (error) {
            console.error('Error updating goal:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ goal: data });
    } catch (error) {
        console.error('Goals API error:', error);
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
        const id = searchParams.get('id');
        const userEmail = session.user.email;

        if (!id) {
            return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('goals')
            .delete()
            .eq('id', id)
            .eq('user_email', userEmail);

        if (error) {
            console.error('Error deleting goal:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Goals API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
