'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Transaction } from '@/types';
import { generateForecast, ForecastAlert } from '@/lib/forecasting';

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

    const getAlertColor = (severity: ForecastAlert['severity']) => {
        switch (severity) {
            case 'high': return 'bg-red-50 border-red-200 text-red-800';
            case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'low': return 'bg-green-50 border-green-200 text-green-800';
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Smart Alerts
                        </CardTitle>
                        <CardDescription>AI-powered insights about your spending</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {forecast.alerts.slice(0, 5).map((alert, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
                            >
                                {getAlertIcon(alert.type)}
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{alert.message}</p>
                                    <p className="text-xs mt-1 opacity-75">{alert.category}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Next Month Prediction */}
            <Card>
                <CardHeader>
                    <CardTitle>📈 Spending Overview</CardTitle>
                    <CardDescription>Based on your spending patterns</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total Spending</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">
                                ₹{forecast.totalCurrent.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">Historical average</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Predicted Next Month</p>
                            <p className="text-3xl font-bold text-purple-900 mt-1">
                                ₹{forecast.totalPredicted.toLocaleString('en-IN')}
                            </p>
                            {forecast.totalPredicted > forecast.totalCurrent && forecast.totalCurrent > 0 && (
                                <p className="text-xs text-purple-600 mt-1">
                                    ↑ {Math.round(((forecast.totalPredicted - forecast.totalCurrent) / forecast.totalCurrent) * 100)}% higher
                                </p>
                            )}
                            {forecast.totalPredicted < forecast.totalCurrent && forecast.totalCurrent > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                    ↓ {Math.round(((forecast.totalCurrent - forecast.totalPredicted) / forecast.totalCurrent) * 100)}% lower
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Category Forecasts</CardTitle>
                    <CardDescription>Predicted spending by category</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {forecast.categoryForecasts.slice(0, 8).map((cat) => (
                            <div key={cat.category} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{cat.category}</span>
                                        {getTrendIcon(cat.trend)}
                                        {cat.trend !== 'stable' && (
                                            <span className={`text-xs ${cat.trend === 'increasing' ? 'text-red-600' : 'text-green-600'}`}>
                                                {cat.trendPercentage}%
                                            </span>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                            {cat.confidence}
                                        </Badge>
                                    </div>
                                    <span className="text-sm font-bold">
                                        ₹{cat.predictedNextMonth.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span>Current: ₹{cat.currentMonthSpending.toLocaleString('en-IN')}</span>
                                    <span>•</span>
                                    <span>Avg: ₹{cat.averageMonthly.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    {(() => {
                                        const maxPredicted = Math.max(...forecast.categoryForecasts.map(c => c.predictedNextMonth));
                                        const widthPercent = Math.max((cat.predictedNextMonth / maxPredicted) * 100, 2);
                                        return (
                                            <div
                                                className={`h-full transition-all ${cat.trend === 'increasing' ? 'bg-red-500' : cat.trend === 'decreasing' ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${widthPercent}%` }}
                                            />
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>6-Month Trend</CardTitle>
                    <CardDescription>Your spending over time</CardDescription>
                </CardHeader>
                <CardContent>
                    {forecast.monthlyTrend.length > 0 ? (
                        <div className="flex items-end justify-between gap-2 h-48 w-full">
                            {forecast.monthlyTrend.map((month, i) => {
                                const maxSpending = Math.max(...forecast.monthlyTrend.map(m => m.spending));
                                const heightPercent = (month.spending / maxSpending) * 100;
                                const heightPx = Math.max((heightPercent / 100) * 192, 20); // 192px = h-48, min 20px

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                                        <div
                                            className="w-full bg-primary rounded-t-lg relative group transition-all hover:bg-primary/80"
                                            style={{ height: `${heightPx}px` }}
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                                ₹{month.spending.toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate w-full text-center">{month.month.split(' ')[0]}</span>
                                    </div>
                                );
                            })}
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
