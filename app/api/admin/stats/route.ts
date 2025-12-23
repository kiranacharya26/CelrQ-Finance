import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // Basic Admin Check (You can expand this to a list in .env)
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['acharya.kiran26ka@gmail.com'];
        if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Total Revenue (Paid Payments)
        const { data: payments, error: payError } = await supabaseAdmin
            .from('payments')
            .select('amount')
            .eq('status', 'PAID');

        const totalRevenue = payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

        // 2. Fetch AI Usage & Costs
        const { data: usage, error: usageError } = await supabaseAdmin
            .from('usage_logs')
            .select('estimated_cost_usd, total_tokens');

        const totalAICostUSD = usage?.reduce((sum: number, u: any) => sum + Number(u.estimated_cost_usd), 0) || 0;
        const totalTokens = usage?.reduce((sum: number, u: any) => sum + u.total_tokens, 0) || 0;

        // 3. Fetch User Count
        // Since we don't have a dedicated users table (using NextAuth/Supabase Auth), 
        // we can estimate from unique emails in transactions or uploads
        const { data: uniqueUsers, error: userError } = await supabaseAdmin
            .from('transactions')
            .select('user_email');

        const userCount = new Set(uniqueUsers?.map((u: any) => u.user_email)).size;

        // 4. Fetch Upload Stats
        const { data: uploads, error: uploadError } = await supabaseAdmin
            .from('uploads')
            .select('id, transaction_count');

        const totalUploads = uploads?.length || 0;
        const totalTransactions = uploads?.reduce((sum: number, u: any) => sum + u.transaction_count, 0) || 0;

        // 5. Recent Activity (Last 10 payments)
        const { data: recentPayments } = await supabaseAdmin
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        // 6. AI Accuracy Monitor
        const { data: corrections } = await supabaseAdmin
            .from('transactions')
            .select('description, merchant_name, ai_category, category')
            .eq('is_manual_category', true)
            .not('ai_category', 'is', null);

        const totalCorrections = corrections?.length || 0;
        const accuracyRate = totalTransactions > 0
            ? ((totalTransactions - totalCorrections) / totalTransactions) * 100
            : 100;

        // Top Missed Merchants
        const missedMerchants: Record<string, { count: number, from: string, to: string }> = {};
        corrections?.forEach((c: any) => {
            if (c.ai_category !== c.category) {
                const key = c.merchant_name || c.description;
                if (!missedMerchants[key]) {
                    missedMerchants[key] = { count: 0, from: c.ai_category, to: c.category };
                }
                missedMerchants[key].count++;
            }
        });

        const topMisses = Object.entries(missedMerchants)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .map(([merchant, data]) => ({ merchant, ...data }));

        return NextResponse.json({
            stats: {
                totalRevenue,
                totalAICostUSD,
                totalTokens,
                userCount,
                totalUploads,
                totalTransactions,
                profitMargin: totalRevenue > 0 ? ((totalRevenue - (totalAICostUSD * 83)) / totalRevenue) * 100 : 0,
                accuracyRate,
                totalCorrections
            },
            recentPayments,
            topMisses
        });

    } catch (error: any) {
        console.error('Admin Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
