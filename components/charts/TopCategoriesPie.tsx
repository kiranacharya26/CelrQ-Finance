import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { CHART_COLORS, formatCurrency } from '@/lib/chartUtils';

interface TopCategoriesPieProps {
    categoryData: Record<string, number>;
}

export function TopCategoriesPie({ categoryData }: TopCategoriesPieProps) {
    const sorted = Object.entries(categoryData)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 6);

    const pieData = sorted.map(([name, value]) => ({ name, value }));
    const total = pieData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Card className="lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden">
            <CardHeader className="px-4 py-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">Top Categories</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-6 pt-0 w-full">
                <div className="h-[300px] w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="85%"
                                paddingAngle={5}
                                dataKey="value"
                                animationDuration={1500}
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</span>
                        <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                </div>
                {/* Legend */}
                <div className="mt-4 space-y-2">
                    {pieData.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                />
                                <span className="truncate text-gray-600 font-medium">{entry.name}</span>
                            </div>
                            <span className="text-gray-900 font-bold ml-2">
                                {((entry.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
