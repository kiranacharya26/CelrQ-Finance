import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { CHART_COLORS } from '@/lib/chartUtils';

interface TopCategoriesPieProps {
    categoryData: Record<string, number>;
}

export function TopCategoriesPie({ categoryData }: TopCategoriesPieProps) {
    const sorted = Object.entries(categoryData)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10);

    const pieData = sorted.map(([name, value]) => ({ name, value }));

    return (
        <Card className="lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden">
            <CardHeader className="px-3 py-3">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">Top Categories</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0 w-full">
                <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius="70%"
                                fill="#8884d8"
                                dataKey="value"
                                animationDuration={1500}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {pieData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className="truncate text-muted-foreground">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
