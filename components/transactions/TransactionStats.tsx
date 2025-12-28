'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard, Calculator } from 'lucide-react';

interface TransactionStatsProps {
    totalExpenses: number;
    totalIncome: number;
    transactionCount: number;
    averageTransaction: number;
}

export function TransactionStats({
    totalExpenses,
    totalIncome,
    transactionCount,
    averageTransaction
}: TransactionStatsProps) {
    return (
        <>
            {/* Mobile View: Compact Stat Bar */}
            <div className="md:hidden grid grid-cols-3 divide-x rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="p-3 flex flex-col items-center justify-center text-center bg-red-50/30 dark:bg-red-950/10">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1 mb-0.5">
                        Expenses
                    </span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        ₹{totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <div className="p-3 flex flex-col items-center justify-center text-center bg-emerald-50/30 dark:bg-emerald-950/10">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1 mb-0.5">
                        Income
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <div className="p-3 flex flex-col items-center justify-center text-center bg-blue-50/30 dark:bg-blue-950/10">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1 mb-0.5">
                        Average
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        ₹{averageTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                </div>
            </div>

            {/* Desktop View: Full Cards */}
            <div className="hidden md:grid gap-4 grid-cols-3">
                <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border-red-100 dark:border-red-900/30 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</CardTitle>
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 break-words mt-2">
                            ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {transactionCount} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background border-emerald-100 dark:border-emerald-900/30 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Income</CardTitle>
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 break-words mt-2">
                            ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            From deposits
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900/30 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Average Txn</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 break-words mt-2">
                            ₹{averageTransaction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            Per transaction
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
