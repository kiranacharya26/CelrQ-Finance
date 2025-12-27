'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, TrendingUp, TrendingDown, ArrowRight, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/chartUtils';

interface UploadSummaryProps {
    data: {
        transactions: any[];
        message: string;
    };
    onClose: () => void;
}

export function UploadSummary({ data, onClose }: UploadSummaryProps) {
    const transactions = data.transactions || [];

    const stats = React.useMemo(() => {
        let income = 0;
        let expenses = 0;
        const categories: Record<string, number> = {};

        transactions.forEach((t: any) => {
            const amt = parseFloat(String(t.amount || t['Withdrawal Amt.'] || t['Deposit Amt.'] || 0).replace(/[^0-9.-]+/g, ''));
            const type = t.type || (t['Deposit Amt.'] ? 'income' : 'expense');

            if (type === 'income') {
                income += Math.abs(amt);
            } else {
                expenses += Math.abs(amt);
                const cat = t.category || 'Other';
                categories[cat] = (categories[cat] || 0) + Math.abs(amt);
            }
        });

        const topCategory = Object.entries(categories).sort(([, a], [, b]) => b - a)[0];

        return {
            count: transactions.length,
            income,
            expenses,
            topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null
        };
    }, [transactions]);

    return (
        <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analysis Complete</h3>
                <p className="text-sm text-muted-foreground">
                    We've successfully processed <span className="font-bold text-foreground">{stats.count}</span> transactions from your statement.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Income</span>
                        </div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(stats.income)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-1">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Expenses</span>
                        </div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(stats.expenses)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {stats.topCategory && (
                <Card className="bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                <PieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Top Spending</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.topCategory.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(stats.topCategory.amount)}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    <strong>Narrative Insight:</strong> Your spending this period was primarily driven by <strong>{stats.topCategory?.name || 'various categories'}</strong>.
                    {stats.income > stats.expenses
                        ? " You've managed to maintain a positive cash flow, which is a great sign of financial health."
                        : " Your expenses exceeded your income this period. We recommend reviewing your top spending categories to identify potential savings."}
                </p>
            </div>

            <Button onClick={onClose} className="w-full group">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
        </div>
    );
}
