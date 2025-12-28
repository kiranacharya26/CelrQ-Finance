import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { formatCurrencyShort } from '@/lib/chartUtils';

interface SpendingByCategoryProps {
    categoryData: Record<string, number>;
}

export function SpendingByCategory({ categoryData }: SpendingByCategoryProps) {
    const data = Object.entries(categoryData)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    return (
        <Card className="lg:col-span-4 shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden min-w-0">
            <CardHeader className="px-4 py-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 flex-shrink-0" />
                    <span className="truncate">Spending by Category</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 pb-6 pt-0 w-full">
                <div className="h-[350px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient id="categoryGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#818cf8" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                            <XAxis
                                type="number"
                                hide
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                stroke="#9ca3af"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#4b5563', fontWeight: 500 }}
                                width={90}
                            />
                            <Tooltip
                                content={<ChartTooltip />}
                                cursor={{ fill: '#f8fafc', radius: 4 }}
                            />
                            <Bar
                                dataKey="value"
                                fill="url(#categoryGradient)"
                                radius={[0, 4, 4, 0]}
                                animationDuration={1500}
                                barSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
