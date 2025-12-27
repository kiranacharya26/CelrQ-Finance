import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CardContent } from '@/components/ui/card';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { formatCurrencyShort } from '@/lib/chartUtils';
import { getCurrentFinancialYear } from '@/lib/financialYear';

interface MonthlyExpensesProps {
    monthlyData: Record<string, number>;
}

export function MonthlyExpenses({ monthlyData }: MonthlyExpensesProps) {
    const data = Object.entries(monthlyData)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
        .filter(item => {
            const date = new Date(item.name);
            const { startDate, endDate } = getCurrentFinancialYear();
            return date >= startDate && date <= endDate;
        });

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#6b7280', fontWeight: 500 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        dy={10}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatCurrencyShort}
                        tick={{ fill: '#6b7280', fontWeight: 500 }}
                        width={45}
                    />
                    <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ fill: '#f3f4f6', radius: 6 }}
                    />
                    <Bar
                        dataKey="value"
                        fill="url(#barGradient)"
                        radius={[6, 6, 0, 0]}
                        animationDuration={1500}
                        barSize={32}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
