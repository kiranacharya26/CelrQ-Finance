import { Transaction } from '@/types';

export interface MerchantAnalysis {
    name: string;
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    frequency: string;
    categoryBreakdown: Record<string, number>;
    monthlyTrend: { month: string; amount: number }[];
    recentTransactions: Transaction[];
}

/**
 * Analyzes spending for a specific merchant.
 */
export function analyzeMerchant(transactions: Transaction[], merchantName: string): MerchantAnalysis {
    const merchantTxs = transactions.filter(t =>
        (t.merchant_name?.toLowerCase() === merchantName.toLowerCase()) ||
        (t.description?.toLowerCase().includes(merchantName.toLowerCase()))
    );

    const totalSpent = merchantTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const count = merchantTxs.length;

    const categoryBreakdown: Record<string, number> = {};
    merchantTxs.forEach(t => {
        const cat = t.category || 'Other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (Number(t.amount) || 0);
    });

    // Monthly trend
    const monthlyData: Record<string, number> = {};
    merchantTxs.forEach(t => {
        if (!t.date) return;
        const date = new Date(t.date);
        const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (Number(t.amount) || 0);
    });

    const monthlyTrend = Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount
    }));

    // Frequency calculation
    let frequency = 'Occasional';
    if (count > 1) {
        const dates = merchantTxs
            .map(t => t.date ? new Date(t.date).getTime() : 0)
            .filter(d => d > 0)
            .sort();

        if (dates.length > 1) {
            const totalDays = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
            const avgDaysBetween = totalDays / (count - 1);

            if (avgDaysBetween < 3) frequency = 'Daily';
            else if (avgDaysBetween < 10) frequency = 'Weekly';
            else if (avgDaysBetween < 40) frequency = 'Monthly';
        }
    }

    return {
        name: merchantName,
        totalSpent,
        transactionCount: count,
        averageTransaction: count > 0 ? totalSpent / count : 0,
        frequency,
        categoryBreakdown,
        monthlyTrend,
        recentTransactions: merchantTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
}
