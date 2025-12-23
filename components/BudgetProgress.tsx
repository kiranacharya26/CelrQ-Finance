'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Wallet } from 'lucide-react';
import { UserStorage } from '@/lib/storage';
import { useSession } from 'next-auth/react';

interface BudgetProgressProps {
    transactions: any[];
    selectedMonth: string;
}

interface Budget {
    category: string;
    amount: number;
}

export function BudgetProgress({ transactions, selectedMonth }: BudgetProgressProps) {
    const { data: session } = useSession();
    const userEmail = session?.user?.email;

    const budgetData = useMemo(() => {
        if (!userEmail) return [];
        // Load budgets from user-scoped storage
        const budgets = UserStorage.getData<Budget[]>(userEmail, 'budgets', []);
        if (budgets.length === 0) return [];

        // Calculate spending per category
        return budgets.map(budget => {
            const categoryKey = Object.keys(transactions[0] || {}).find(k => /category/i.test(k));
            if (!categoryKey) return { ...budget, spent: 0, percentage: 0, isOverBudget: false };

            // Filter transactions by category
            const categoryTransactions = transactions.filter(t => t[categoryKey] === budget.category);

            // Calculate total spent
            let spent = 0;
            categoryTransactions.forEach(t => {
                const withdrawalKey = Object.keys(t).find(k => /withdrawal|debit/i.test(k));
                const amountKey = Object.keys(t).find(k => /^amount$/i.test(k));

                if (withdrawalKey && t[withdrawalKey]) {
                    const val = parseFloat(String(t[withdrawalKey]).replace(/[^0-9.-]+/g, ''));
                    if (!isNaN(val) && val > 0) spent += val;
                } else if (amountKey && t[amountKey]) {
                    const val = parseFloat(String(t[amountKey]).replace(/[^0-9.-]+/g, ''));
                    if (!isNaN(val) && val < 0) spent += Math.abs(val);
                }
            });

            const percentage = (spent / budget.amount) * 100;

            return {
                ...budget,
                spent,
                percentage: Math.min(percentage, 100),
                isOverBudget: spent > budget.amount
            };
        });
    }, [transactions, selectedMonth]);

    if (budgetData.length === 0) return null;

    return (
        <Card className="h-full w-full overflow-hidden min-w-0">
            <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500 flex-shrink-0" />
                    <span className="truncate">Budget Progress</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                <div className="space-y-6">
                    {budgetData.map(({ category, amount, spent, percentage, isOverBudget }) => (
                        <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{category}</span>
                                    {isOverBudget && <AlertCircle className="h-3 w-3 text-destructive" />}
                                </div>
                                <div className="text-muted-foreground">
                                    <span className={isOverBudget ? 'text-destructive font-medium' : ''}>
                                        ₹{spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                    <span className="text-xs ml-1">/ ₹{amount.toLocaleString()}</span>
                                </div>
                            </div>
                            <Progress
                                value={percentage}
                                className={`h-2 ${isOverBudget
                                    ? '[&>div]:bg-destructive'
                                    : percentage > 80
                                        ? '[&>div]:bg-yellow-500'
                                        : '[&>div]:bg-green-500'
                                    }`}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
