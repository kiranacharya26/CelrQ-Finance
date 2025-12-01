import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CardContent } from '@/components/ui/card';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { formatCurrencyShort } from '@/lib/chartUtils';

interface MonthlyExpensesProps {
    monthlyData: Record<string, number>;
}

export function MonthlyExpenses({ monthlyData }: MonthlyExpensesProps) {
    const data = Object.entries(monthlyData)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

    return (
        <div className="h-[300px] w-full">
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
                    <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} animationDuration={1500} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
