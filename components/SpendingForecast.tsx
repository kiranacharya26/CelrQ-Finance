'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Transaction } from '@/types';
import { generateForecast, ForecastAlert } from '@/lib/forecasting';
import { ChartTooltip } from '@/components/charts/ChartTooltip';

interface SpendingForecastProps {
    transactions: Transaction[];
}

export function SpendingForecast({ transactions }: SpendingForecastProps) {
    const forecast = useMemo(() => generateForecast(transactions), [transactions]);

    if (forecast.categoryForecasts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>📊 Spending Forecast</CardTitle>
                    <CardDescription>Not enough data yet. Upload more statements to see predictions.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const getAlertIcon = (type: ForecastAlert['type']) => {
        switch (type) {
            case 'overspend': return <AlertTriangle className="h-4 w-4" />;
            case 'warning': return <Info className="h-4 w-4" />;
            case 'savings': return <CheckCircle className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };



    const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
        switch (trend) {
            case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
            case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
            case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Alerts Section */}
            {forecast.alerts.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Smart Alerts
                        </CardTitle>
                        <CardDescription>AI-powered insights about your spending</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 space-y-3">
                        {forecast.alerts.slice(0, 5).map((alert, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 p-3 rounded-xl border transition-all ${alert.severity === 'high'
                                        ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200/50 dark:border-red-900/50'
                                        : alert.severity === 'medium'
                                            ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/50'
                                            : 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/50'
                                    }`}
                            >
                                <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${alert.severity === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                        alert.severity === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                            'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    }`}>
                                    {getAlertIcon(alert.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-sm font-semibold leading-tight">{alert.category}</p>
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wider ${alert.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                                                alert.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                            }`}>
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        {alert.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}





            {/* Monthly Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>6-Month Trend</CardTitle>
                    <CardDescription>Your spending over time</CardDescription>
                </CardHeader>
                <CardContent>
                    {forecast.monthlyTrend.length > 0 ? (
                        <div className="h-48 sm:h-64 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecast.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#9ca3af"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => val.split(' ')[0]}
                                        tick={{ fill: '#6b7280', fontWeight: 500 }}
                                    />
                                    <YAxis
                                        hide
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="spending"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#trendGradient)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">Not enough historical data</p>
                            <p className="text-xs text-muted-foreground mt-1">Upload more transaction history to see your spending trend</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
