'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ArrowRight, CreditCard } from 'lucide-react';

interface SpendingInsightsProps {
    transactions: any[];
    selectedMonth: string;
}

export function SpendingInsights({ transactions, selectedMonth }: SpendingInsightsProps) {
    const insights = useMemo(() => {
        if (transactions.length === 0) return null;

        // Find keys
        const categoryKey = Object.keys(transactions[0]).find(k => /category/i.test(k));
        const dateKey = Object.keys(transactions[0]).find(k => /^date$/i.test(k));
        const withdrawalKey = Object.keys(transactions[0]).find(k => /withdrawal|debit/i.test(k));
        const amountKey = Object.keys(transactions[0]).find(k => /^amount$/i.test(k));
        const descKey = Object.keys(transactions[0]).find(k => /description|narration|particulars/i.test(k));

        if (!categoryKey || !dateKey) return null;

        // Get top 5 expenses
        const expenseTransactions = transactions
            .map((t, index) => {
                let amount = 0;
                if (withdrawalKey && t[withdrawalKey]) {
                    amount = parseFloat(String(t[withdrawalKey]).replace(/[^0-9.-]+/g, '')) || 0;
                } else if (amountKey && t[amountKey]) {
                    const val = parseFloat(String(t[amountKey]).replace(/[^0-9.-]+/g, '')) || 0;
                    if (t.type) {
                        amount = t.type === 'expense' ? val : 0;
                    } else {
                        amount = val < 0 ? Math.abs(val) : 0;
                    }
                }
                return { ...t, amount, index };
            })
            .filter(t => t.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        // Calculate spending by category
        const categorySpending: Record<string, number> = {};
        transactions.forEach(t => {
            const category = t[categoryKey] || 'Other';
            let amount = 0;

            if (withdrawalKey && t[withdrawalKey]) {
                amount = parseFloat(String(t[withdrawalKey]).replace(/[^0-9.-]+/g, '')) || 0;
            } else if (amountKey && t[amountKey]) {
                const val = parseFloat(String(t[amountKey]).replace(/[^0-9.-]+/g, '')) || 0;
                amount = val < 0 ? Math.abs(val) : 0;
            }

            categorySpending[category] = (categorySpending[category] || 0) + amount;
        });

        // Find biggest category
        const biggestCategory = Object.entries(categorySpending)
            .sort(([, a], [, b]) => b - a)[0];

        // Calculate month-over-month change (if applicable)
        let monthChange = null;
        if (selectedMonth !== 'All Months') {
            const currentMonthTotal = transactions.reduce((sum, t) => {
                let amount = 0;
                if (withdrawalKey && t[withdrawalKey]) {
                    amount = parseFloat(String(t[withdrawalKey]).replace(/[^0-9.-]+/g, '')) || 0;
                } else if (amountKey && t[amountKey]) {
                    const val = parseFloat(String(t[amountKey]).replace(/[^0-9.-]+/g, '')) || 0;
                    amount = val < 0 ? Math.abs(val) : 0;
                }
                return sum + amount;
            }, 0);

            // This is simplified - in a real app, you'd compare with previous month's data
            monthChange = { current: currentMonthTotal, percentage: 0 };
        }

        return {
            topExpenses: expenseTransactions.map(t => ({
                description: descKey ? t[descKey] : 'Unknown',
                amount: t.amount,
                category: t[categoryKey] || 'Other'
            })),
            biggestCategory: biggestCategory ? {
                name: biggestCategory[0],
                amount: biggestCategory[1]
            } : null,
            monthChange
        };
    }, [transactions, selectedMonth]);

    if (!insights || insights.topExpenses.length === 0) return null;

    return (
        <Card className="w-full overflow-hidden min-w-0">
            <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500 flex-shrink-0" />
                    <span className="truncate">Top Expenses</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                <div className="space-y-2">
                    {insights.topExpenses.map((expense, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm font-medium truncate">{expense.description}</p>
                                <p className="text-xs text-muted-foreground">{expense.category}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-red-600">
                                    ₹{expense.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
