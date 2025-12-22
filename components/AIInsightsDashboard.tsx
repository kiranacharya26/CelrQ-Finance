'use client';

import { useState, useEffect } from 'react';
import { generateInsights, Insights, Alert } from '@/lib/insights';
import { generateBudgetSuggestions, BudgetSuggestion } from '@/lib/budgeting';
import { Transaction } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    AlertCircle,
    Info,
    TrendingUp,
    TrendingDown,
    Zap,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface AIInsightsDashboardProps {
    transactions: Transaction[];
}

export function AIInsightsDashboard({ transactions }: AIInsightsDashboardProps) {
    const [insights, setInsights] = useState<Insights | null>(null);
    const [budgetSuggestions, setBudgetSuggestions] = useState<BudgetSuggestion[]>([]);

    useEffect(() => {
        if (transactions.length > 0) {
            setInsights(generateInsights(transactions));
            setBudgetSuggestions(generateBudgetSuggestions(transactions));
        }
    }, [transactions]);

    if (!insights) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                    AI Smart Insights
                </h2>
                <Link href="/dashboard/chat">
                    <Button variant="outline" size="sm" className="gap-2">
                        Ask AI Assistant <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Alerts & Anomalies */}
                <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Spending Alerts
                    </h3>
                    <div className="space-y-3">
                        {insights.alerts.length > 0 ? (
                            insights.alerts.map((alert, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                    {alert.type === 'warning' ? (
                                        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                                    ) : (
                                        <Info className="w-5 h-5 text-blue-400 shrink-0" />
                                    )}
                                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                <p className="text-sm text-green-400">No unusual spending patterns detected this month.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Auto-Pilot Budgeting */}
                <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Smart Budget Suggestions
                    </h3>
                    <div className="space-y-3">
                        {budgetSuggestions.slice(0, 3).map((suggestion, i) => (
                            <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{suggestion.category}</span>
                                    <span className="text-sm font-bold text-yellow-500">₹{suggestion.suggestedAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                                <Button variant="ghost" size="sm" className="w-full text-xs h-7 hover:bg-yellow-500/10 hover:text-yellow-500">
                                    Apply Suggested Budget
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Projected Month End</p>
                        <p className="text-xl font-bold">₹{Math.round(insights.predictions.projectedTotal).toLocaleString('en-IN')}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${insights.predictions.onTrack ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                        {insights.predictions.onTrack ? (
                            <TrendingDown className="w-5 h-5 text-green-400" />
                        ) : (
                            <TrendingUp className="w-5 h-5 text-orange-400" />
                        )}
                    </div>
                </Card>

                <Card className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Subscription Burn</p>
                        <p className="text-xl font-bold">₹1,240</p>
                    </div>
                    <Link href="/dashboard/subscriptions">
                        <Button variant="ghost" size="icon">
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </Card>

                <Card className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Cash Flow Health</p>
                        <p className="text-xl font-bold text-green-400">Stable</p>
                    </div>
                    <Link href="/dashboard/cashflow">
                        <Button variant="ghost" size="icon">
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
