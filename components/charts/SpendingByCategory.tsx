import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
        .slice(0, 10);

    return (
        <Card className="lg:col-span-4 shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden min-w-0">
            <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 flex-shrink-0" />
                    <span className="truncate">Spending by Category</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-2 md:px-6 w-full">
                <div className="h-[280px] sm:h-[320px] md:h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <XAxis
                                dataKey="name"
                                stroke="#9ca3af"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6b7280' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatCurrencyShort}
                                tick={{ fill: '#6b7280' }}
                                width={45}
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f3f4f6' }} />
                            <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} animationDuration={1500} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
