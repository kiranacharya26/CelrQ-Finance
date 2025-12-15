'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, ArrowUp, ArrowDown, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '@/types';
import { generateInsights } from '@/lib/insights';

interface AIInsightsProps {
    transactions: Transaction[];
}

export function AIInsights({ transactions }: AIInsightsProps) {
    const [activeTab, setActiveTab] = useState('trends');
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);

    const insights = useMemo(() => {
        if (transactions.length === 0) return null;
        return generateInsights(transactions);
    }, [transactions]);

    // Fetch AI summary when insights are available
    useEffect(() => {
        if (insights && insights.trends.currentTotal > 0) {
            // Create a unique cache key based on spending totals
            // This ensures we get fresh insights if the data changes
            const cacheKey = `ai-summary-${Math.round(insights.trends.currentTotal)}-${Math.round(insights.trends.previousTotal)}`;

            // Check if we have a cached summary
            const cachedSummary = localStorage.getItem(cacheKey);
            if (cachedSummary) {
                setAiSummary(cachedSummary);
                return;
            }

            // No cache hit - fetch from API
            setLoadingAI(true);
            fetch('/api/insights/ai-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ insights }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.summary) {
                        setAiSummary(data.summary);
                        // Cache the summary
                        localStorage.setItem(cacheKey, data.summary);

                        // Clean up old cache entries (keep only last 10)
                        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('ai-summary-'));
                        if (allKeys.length > 10) {
                            allKeys.slice(0, allKeys.length - 10).forEach(k => localStorage.removeItem(k));
                        }
                    }
                })
                .catch(err => console.error('Failed to fetch AI summary:', err))
                .finally(() => setLoadingAI(false));
        }
    }, [insights]);

    if (!insights || transactions.length === 0) {
        return (
            <Card className="w-full overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                        <span className="truncate text-base sm:text-lg">Smart Insights</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <p className="text-sm text-muted-foreground">
                        Upload transactions to see AI-powered insights
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { trends, alerts, predictions, recommendations } = insights;

    return (
        <Card className="w-full overflow-hidden min-w-0">
            <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                    <span className="truncate text-base sm:text-lg">Smart Insights</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                {/* AI Summary Section */}
                {(aiSummary || loadingAI) && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">AI Summary</h4>
                                {loadingAI ? (
                                    <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Analyzing your spending patterns...</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                                        {aiSummary}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                        <TabsTrigger value="alerts">
                            Alerts
                            {alerts.length > 0 && (
                                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] text-white">
                                    {alerts.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="tips">Tips</TabsTrigger>
                    </TabsList>

                    {/* Trends Tab */}
                    <TabsContent value="trends" className="space-y-4 mt-4">
                        {/* Spending Comparison */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                {trends.percentageChange >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-red-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-green-500" />
                                )}
                                <h4 className="text-sm font-semibold">
                                    {predictions.daysRemaining > 0 ? 'Spending This Month' : 'Total Spending'}
                                </h4>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold">
                                        ₹{trends.currentTotal.toLocaleString('en-IN')}
                                    </span>
                                    {trends.previousTotal > 0 && (
                                        <span className={`text-sm font-medium ${trends.percentageChange >= 0 ? 'text-red-500' : 'text-green-500'
                                            }`}>
                                            {trends.percentageChange >= 0 ? '+' : ''}
                                            {trends.percentageChange.toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                                {trends.previousTotal > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        vs ₹{trends.previousTotal.toLocaleString('en-IN')} previous month
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Top Categories */}
                        {trends.topCategories.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Top Spending</h4>
                                <div className="space-y-2">
                                    {trends.topCategories.map((cat, idx) => (
                                        <div key={cat.category} className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-muted-foreground">{cat.category}</span>
                                            </span>
                                            <span className="font-medium">₹{cat.amount.toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Biggest Changes */}
                        {(trends.biggestIncrease || trends.biggestDecrease) && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Notable Changes</h4>
                                <div className="space-y-2">
                                    {trends.biggestIncrease && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <ArrowUp className="h-4 w-4 text-red-500" />
                                            <span className="text-muted-foreground">{trends.biggestIncrease.category}</span>
                                            <span className="ml-auto font-medium text-red-500">
                                                +{trends.biggestIncrease.change.toFixed(0)}%
                                            </span>
                                        </div>
                                    )}
                                    {trends.biggestDecrease && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <ArrowDown className="h-4 w-4 text-green-500" />
                                            <span className="text-muted-foreground">{trends.biggestDecrease.category}</span>
                                            <span className="ml-auto font-medium text-green-500">
                                                {trends.biggestDecrease.change.toFixed(0)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Prediction - Only show for current/future months */}
                        {predictions.daysRemaining > 0 && (
                            <div className="space-y-2 border-t pt-3">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-blue-500" />
                                    <h4 className="text-sm font-semibold">End of Month Forecast</h4>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold">
                                            ₹{predictions.projectedTotal.toLocaleString('en-IN')}
                                        </span>
                                        <span className={`text-xs font-medium ${predictions.onTrack ? 'text-green-500' : 'text-yellow-500'
                                            }`}>
                                            {predictions.onTrack ? 'On track' : 'Off track'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {predictions.daysRemaining} days remaining • {predictions.projectedChange >= 0 ? '+' : ''}
                                        {predictions.projectedChange.toFixed(1)}% vs last month
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Alerts Tab */}
                    <TabsContent value="alerts" className="space-y-3 mt-4">
                        {alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">No unusual activity detected</p>
                                <p className="text-xs text-muted-foreground">Your spending looks normal</p>
                            </div>
                        ) : (
                            alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 rounded-lg border p-3 ${alert.type === 'warning'
                                        ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950'
                                        : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
                                        }`}
                                >
                                    <AlertTriangle
                                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                                            }`}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium">{alert.message}</p>
                                        {alert.category && (
                                            <p className="text-xs text-muted-foreground">Category: {alert.category}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    {/* Tips Tab */}
                    <TabsContent value="tips" className="space-y-3 mt-4">
                        {recommendations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Lightbulb className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">No recommendations yet</p>
                                <p className="text-xs text-muted-foreground">Keep tracking to get personalized tips</p>
                            </div>
                        ) : (
                            recommendations.map((rec, idx) => (
                                <div
                                    key={idx}
                                    className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950"
                                >
                                    <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium">{rec.message}</p>
                                        {rec.potentialSavings && (
                                            <p className="text-xs font-semibold text-green-600">
                                                Potential savings: ₹{rec.potentialSavings.toLocaleString('en-IN')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
