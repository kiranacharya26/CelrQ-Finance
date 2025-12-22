'use client';

import { useState, useEffect } from 'react';
import { predictCashFlow, CashFlowPoint } from '@/lib/cashflow';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import {
    Calendar as CalendarIcon,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export default function CashFlowPage() {
    const { userEmail, isAuthenticated } = useAuth();
    const { transactions, loading } = useTransactions({
        userEmail,
        selectedBank: 'all',
    });

    const [predictions, setPredictions] = useState<CashFlowPoint[]>([]);

    useEffect(() => {
        if (transactions && transactions.length > 0) {
            const flow = predictCashFlow(transactions, 50000); // Assuming 50k start balance
            setPredictions(flow);
        }
    }, [transactions]);

    if (loading) return <div className="flex items-center justify-center h-screen">Projecting your cash flow...</div>;
    if (!isAuthenticated) return <div className="flex items-center justify-center h-screen">Please sign in to view cash flow.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cash Flow Calendar</h1>
                <p className="text-muted-foreground mt-2">
                    Predicting your bank balance for the next 30 days based on recurring bills and income.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-blue-500" />
                            30-Day Projection
                        </h3>
                        <div className="space-y-4">
                            {predictions.map((point: CashFlowPoint, i: number) => (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${point.expectedTransactions.length > 0 ? 'bg-muted/50 border-border' : 'border-transparent'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center min-w-[50px]">
                                            <p className="text-xs text-muted-foreground uppercase">{new Date(point.date).toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                                            <p className="text-lg font-bold">{new Date(point.date).getDate()}</p>
                                        </div>
                                        <div>
                                            {point.expectedTransactions.length > 0 ? (
                                                <div className="space-y-1">
                                                    {point.expectedTransactions.map((tx: any, j: number) => (
                                                        <div key={j} className="flex items-center gap-2 text-sm">
                                                            {tx.type === 'income' ? (
                                                                <ArrowUpRight className="w-3 h-3 text-green-400" />
                                                            ) : (
                                                                <ArrowDownRight className="w-3 h-3 text-red-400" />
                                                            )}
                                                            <span className="font-medium">{tx.name}</span>
                                                            <span className={tx.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                                                                {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">No scheduled events</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Predicted Balance</p>
                                        <p className={`text-lg font-bold ${point.predictedBalance < 10000 ? 'text-orange-500' : ''}`}>
                                            ₹{Math.round(point.predictedBalance).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Cash Flow Insights</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    <h4 className="font-medium text-green-500">Positive Runway</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Your balance is projected to stay above ₹10,000 for the entire month.
                                </p>
                            </div>

                            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <ArrowUpRight className="w-5 h-5 text-blue-500" />
                                    <h4 className="font-medium text-blue-500">Upcoming Income</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    We expect a salary credit in approximately 8 days.
                                </p>
                            </div>

                            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                    <h4 className="font-medium text-orange-500">Bill Cluster</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    You have 4 bills due between the 5th and 8th. Ensure your account is funded.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
