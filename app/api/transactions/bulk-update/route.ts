import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { userEmail, description, newCategory, action } = await req.json();

        if (!userEmail || !description || !newCategory) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. PREVIEW: Find matching transactions
        if (action === 'preview') {
            const { data: matches, error } = await supabaseAdmin
                .from('transactions')
                .select('id, date, description, amount, category')
                .eq('user_email', userEmail)
                .ilike('description', description) // Case-insensitive match
                .neq('category', newCategory); // Only find ones that need updating

            if (error) throw error;

            return NextResponse.json({
                count: matches?.length || 0,
                matches: matches || []
            });
        }

        // 2. EXECUTE: Update all matching transactions
        if (action === 'execute') {
            // A. Update Transactions
            const { error: updateError } = await supabaseAdmin
                .from('transactions')
                .update({ category: newCategory })
                .eq('user_email', userEmail)
                .ilike('description', description);

            if (updateError) throw updateError;

            // B. Learn for Future (Update Memory Bank)
            // We extract a keyword from the description to save as a rule
            // Simple logic: use the description as the keyword for now
            const { error: ruleError } = await supabaseAdmin
                .from('merchant_rules')
                .upsert({
                    user_email: userEmail,
                    keyword: description.toLowerCase(),
                    category: newCategory
                }, { onConflict: 'user_email, keyword' });

            if (ruleError) console.warn("Failed to save rule:", ruleError);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Bulk update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
