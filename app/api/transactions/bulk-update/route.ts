import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userEmail, description, newCategory, action, ids } = body;

        if (!userEmail || !description || !newCategory) {
            console.error('❌ Bulk update missing fields:', { userEmail, description, newCategory });
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

            let updateQuery = supabaseAdmin
                .from('transactions')
                .update({ category: newCategory })
                .ilike('user_email', userEmail);

            if (ids && Array.isArray(ids) && ids.length > 0) {
                updateQuery = updateQuery.in('id', ids);
            } else {
                updateQuery = updateQuery.ilike('description', `%${description}%`);
            }

            const { data, error: updateError, count } = await updateQuery.select('id');
            if (updateError) {
                console.error('❌ Database update error:', updateError);
                throw updateError;
            }


            // B. Learn for Future (Update Memory Bank)
            // We extract a keyword from the description to save as a rule
            const { error: ruleError } = await supabaseAdmin
                .from('merchant_rules')
                .upsert({
                    user_email: userEmail,
                    keyword: description.toLowerCase(),
                    category: newCategory
                }, { onConflict: 'user_email, keyword' });

            if (ruleError) console.warn("Failed to save rule:", ruleError);

            return NextResponse.json({
                success: true,
                updatedCount: data?.length || 0
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Bulk update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
