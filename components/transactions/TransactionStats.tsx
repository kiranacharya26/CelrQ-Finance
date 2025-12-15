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
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <CreditCard className="h-4 w-4 text-red-500 flex-shrink-0" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-red-600 break-words">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground mt-1">{transactionCount} transactions</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-green-600 break-words">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground mt-1">From deposits</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                    <Calculator className="h-4 w-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 break-words">₹{averageTransaction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
                </CardContent>
            </Card>
        </div>
    );
}
