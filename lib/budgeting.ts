import { Transaction } from '@/types';

export interface BudgetSuggestion {
    category: string;
    suggestedAmount: number;
    currentAverage: number;
    reasoning: string;
}

/**
 * Generates budget suggestions based on historical spending.
 */
export function generateBudgetSuggestions(transactions: Transaction[]): BudgetSuggestion[] {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number[]> = {};

    // Group by month and category
    expenses.forEach(t => {
        if (!t.date) return;
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const category = t.category || 'Other';

        if (!categoryTotals[category]) categoryTotals[category] = [];

        // We need to sum per month first, but for simplicity let's just average the last 3 months
    });

    // Improved grouping
    const monthlyCategorySpending: Record<string, Record<string, number>> = {};
    expenses.forEach(t => {
        if (!t.date) return;
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const category = t.category || 'Other';

        if (!monthlyCategorySpending[monthKey]) monthlyCategorySpending[monthKey] = {};
        monthlyCategorySpending[monthKey][category] = (monthlyCategorySpending[monthKey][category] || 0) + (Number(t.amount) || 0);
    });

    const categories = Array.from(new Set(expenses.map(e => e.category || 'Other')));
    const suggestions: BudgetSuggestion[] = [];

    categories.forEach(category => {
        const monthlyAmounts = Object.values(monthlyCategorySpending)
            .map(m => m[category] || 0)
            .filter(amt => amt > 0);

        if (monthlyAmounts.length === 0) return;

        const avg = monthlyAmounts.reduce((a, b) => a + b, 0) / monthlyAmounts.length;

        // Logic for suggestion:
        // 1. If it's a "fixed" cost (Utilities, Housing), suggest the average.
        // 2. If it's "variable" (Dining, Shopping), suggest 90% of average to encourage savings.

        let suggested = avg;
        let reasoning = `Based on your average monthly spend of ₹${Math.round(avg).toLocaleString('en-IN')}.`;

        if (['Restaurants & Dining', 'Online Shopping', 'Retail & Stores', 'Events & Recreation'].includes(category)) {
            suggested = avg * 0.9;
            reasoning = `You usually spend ₹${Math.round(avg).toLocaleString('en-IN')}. Setting this 10% lower to help you save.`;
        }

        suggestions.push({
            category,
            suggestedAmount: Math.round(suggested),
            currentAverage: Math.round(avg),
            reasoning
        });
    });

    return suggestions.sort((a, b) => b.suggestedAmount - a.suggestedAmount);
}
