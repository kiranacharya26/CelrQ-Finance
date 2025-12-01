'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { Transaction } from '@/types';
import { generateInsights } from '@/lib/insights';

interface AIInsightsProps {
    transactions: Transaction[];
}

export function AIInsights({ transactions }: AIInsightsProps) {
    const [activeTab, setActiveTab] = useState('trends');

    const insights = useMemo(() => {
        if (transactions.length === 0) return null;
        return generateInsights(transactions);
    }, [transactions]);

    if (!insights || transactions.length === 0) {
        return (
            <Card className="w-full h-full border-dashed shadow-none bg-transparent">
                <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center space-y-2">
                    <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground font-medium">
                        Insights await your data
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { trends, alerts, predictions, recommendations } = insights;

    return (
        <Card className="w-full h-full shadow-sm">
            <CardHeader className="px-3 py-2 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        <span>Insights</span>
                    </CardTitle>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                        <TabsList className="h-7 bg-transparent p-0 gap-4">
                            <TabsTrigger
                                value="trends"
                                className="h-7 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:font-semibold text-muted-foreground border-b-2 border-transparent data-[state=active]:border-indigo-600 rounded-none transition-none"
                            >
                                Trends
                            </TabsTrigger>
                            <TabsTrigger
                                value="alerts"
                                className="h-7 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:font-semibold text-muted-foreground border-b-2 border-transparent data-[state=active]:border-indigo-600 rounded-none transition-none"
                            >
                                Alerts
                                {alerts.length > 0 && (
                                    <span className="ml-1.5 flex h-1.5 w-1.5 rounded-full bg-red-500" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="tips"
                                className="h-7 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:font-semibold text-muted-foreground border-b-2 border-transparent data-[state=active]:border-indigo-600 rounded-none transition-none"
                            >
                                Tips
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-3">
                    {/* Trends Tab */}
                    {activeTab === 'trends' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Spending Overview */}
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Month</p>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-bold tracking-tight">
                                        ₹{trends.currentTotal.toLocaleString('en-IN')}
                                    </span>
                                    {trends.previousTotal > 0 && (
                                        <div className={`flex items-center gap-1 text-sm font-medium ${trends.percentageChange >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {trends.percentageChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            <span>{Math.abs(trends.percentageChange).toFixed(1)}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Categories Compact List */}
                            {trends.topCategories.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Spending</p>
                                    <div className="space-y-2">
                                        {trends.topCategories.slice(0, 3).map((cat, idx) => (
                                            <div key={cat.category} className="group flex items-center justify-between text-sm py-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-500 transition-colors" />
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{cat.category}</span>
                                                </div>
                                                <span className="font-semibold text-slate-900 dark:text-slate-100">₹{cat.amount.toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notable Changes */}
                            {(trends.biggestIncrease || trends.biggestDecrease) && (
                                <div className="space-y-3">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Movers</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {trends.biggestIncrease && (
                                            <div className="bg-red-50/50 dark:bg-red-900/10 rounded-lg p-3 border border-red-100 dark:border-red-900/20">
                                                <div className="flex items-center gap-1.5 text-red-600 mb-1">
                                                    <ArrowUp className="h-3 w-3" />
                                                    <span className="text-xs font-bold">Up</span>
                                                </div>
                                                <p className="text-xs font-medium truncate">{trends.biggestIncrease.category}</p>
                                                <p className="text-xs text-red-600 font-semibold mt-0.5">+{trends.biggestIncrease.change.toFixed(0)}%</p>
                                            </div>
                                        )}
                                        {trends.biggestDecrease && (
                                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/20">
                                                <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                                                    <ArrowDown className="h-3 w-3" />
                                                    <span className="text-xs font-bold">Down</span>
                                                </div>
                                                <p className="text-xs font-medium truncate">{trends.biggestDecrease.category}</p>
                                                <p className="text-xs text-emerald-600 font-semibold mt-0.5">{trends.biggestDecrease.change.toFixed(0)}%</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Forecast Minimal */}
                            <div className="pt-2 border-t border-border/40">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <Target className="h-3 w-3 text-indigo-500" />
                                        <span className="text-xs font-medium text-muted-foreground">Forecast</span>
                                    </div>
                                    <span className={`text-xs font-medium ${predictions.onTrack ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {predictions.onTrack ? 'On Track' : 'Over Budget'}
                                    </span>
                                </div>
                                <p className="text-sm font-bold">₹{predictions.projectedTotal.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    )}

                    {/* Alerts Tab */}
                    {activeTab === 'alerts' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {alerts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center">
                                    <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                                        <Sparkles className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">All clear</p>
                                </div>
                            ) : (
                                alerts.map((alert, idx) => (
                                    <div key={idx} className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${alert.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium leading-tight">{alert.message}</p>
                                            {alert.category && (
                                                <p className="text-xs text-muted-foreground">{alert.category}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tips Tab */}
                    {activeTab === 'tips' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {recommendations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center">
                                    <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
                                        <Lightbulb className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Gathering insights...</p>
                                </div>
                            ) : (
                                recommendations.map((rec, idx) => (
                                    <div key={idx} className="group relative overflow-hidden rounded-lg border border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-slate-900 p-4 transition-all hover:shadow-sm">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                        <div className="space-y-1 pl-2">
                                            <p className="text-sm font-medium leading-snug">{rec.message}</p>
                                            {rec.potentialSavings && (
                                                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                                    <Sparkles className="h-3 w-3" />
                                                    Save ₹{rec.potentialSavings.toLocaleString('en-IN')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
