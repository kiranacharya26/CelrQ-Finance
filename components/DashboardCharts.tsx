'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import { BarChart3, PieChart as PieChartIcon, Calendar } from "lucide-react";

interface DashboardChartsProps {
    transactions: any[];
    amountKey?: string;
    depositKey?: string;
    withdrawalKey?: string;
    categoryKey?: string;
    dateKey?: string;
}

export function DashboardCharts({ transactions, amountKey, depositKey, withdrawalKey, categoryKey, dateKey }: DashboardChartsProps) {
    // Helper to safely parse float
    const parseAmount = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    // Helper to parse date
    const parseDate = (val: any): Date | null => {
        if (!val) return null;
        if (val instanceof Date) return val;

        // Handle Excel serial dates (numbers)
        if (typeof val === 'number') {
            // Excel base date is Dec 30, 1899
            return new Date(Math.round((val - 25569) * 86400 * 1000));
        }

        const strVal = String(val).trim();

        // Try common formats
        // DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = strVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmyMatch) {
            return new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
        }

        // DD/MM/YY or DD-MM-YY
        const dmyShortMatch = strVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
        if (dmyShortMatch) {
            return new Date(2000 + parseInt(dmyShortMatch[3]), parseInt(dmyShortMatch[2]) - 1, parseInt(dmyShortMatch[1]));
        }

        // Try standard Date.parse
        const parsed = Date.parse(strVal);
        if (!isNaN(parsed)) {
            return new Date(parsed);
        }

        return null;
    };

    // Process data for charts
    const data = transactions.map(t => {
        let amount = 0;
        let type = t.type || 'expense'; // Default to expense if not specified

        if (withdrawalKey && t[withdrawalKey]) {
            amount = parseAmount(t[withdrawalKey]);
            type = 'expense';
        } else if (depositKey && t[depositKey]) {
            amount = parseAmount(t[depositKey]);
            type = 'income';
        } else if (amountKey && t[amountKey]) {
            const val = parseAmount(t[amountKey]);
            if (t.type) { // If 'type' is explicitly provided in the transaction
                amount = val;
                type = t.type;
            } else { // Infer type based on amount sign
                amount = Math.abs(val);
                type = val >= 0 ? 'income' : 'expense';
            }
        }

        let category = 'Uncategorized';
        if (categoryKey && t[categoryKey]) {
            category = t[categoryKey];
        } else {
            // Fallback to description/narration if no category column
            const descKey = Object.keys(t).find(k => k.toLowerCase().includes('description') || k.toLowerCase().includes('narration') || k.toLowerCase().includes('particulars'));
            if (descKey && t[descKey]) {
                // Use first word or two as pseudo-category if it's a description
                // This is a rough heuristic for display purposes
                category = String(t[descKey]).split(' ').slice(0, 2).join(' ');
            }
        }

        return {
            ...t,
            amount,
            type,
            category,
            date: parseDate(t[dateKey || 'date'])
        };
    }).filter(t => t.date !== null);

    const { categoryData, monthlyData } = data.reduce((acc, t) => {
        // Only count expenses for category breakdown
        if (t.type === 'expense') {
            const category = t.category;
            acc.categoryData[category] = (acc.categoryData[category] || 0) + t.amount;
        }

        // Count all spending (expenses) for monthly trend
        // Or should this be net? Usually monthly expenses chart shows expenses.
        if (t.type === 'expense' && t.date) {
            const monthYear = t.date.toLocaleString('default', { month: 'short', year: 'numeric' });
            acc.monthlyData[monthYear] = (acc.monthlyData[monthYear] || 0) + t.amount;
        }
        return acc;
    }, { categoryData: {} as Record<string, number>, monthlyData: {} as Record<string, number> });

    // Sort categories
    const sortedCategories = Object.entries(categoryData)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10);
    const pieData = sortedCategories.map(([name, value]) => ({ name, value }));

    // Sort months chronologically
    const sortedMonths = Object.entries(monthlyData)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([name, value]) => ({ name, value }));

    // Modern, harmonious color palette
    const COLORS = [
        '#6366f1', // Indigo
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#f43f5e', // Rose
        '#8b5cf6', // Violet
        '#06b6d4', // Cyan
        '#ec4899', // Pink
        '#84cc16', // Lime
        '#14b8a6', // Teal
        '#d946ef'  // Fuchsia
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900">{label || payload[0].name}</p>
                    <p className="text-sm text-gray-600">
                        ₹{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-7 w-full">
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
                                <BarChart data={pieData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
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
                                        tickFormatter={(value) => `₹${value}`}
                                        tick={{ fill: '#6b7280' }}
                                        width={45}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} animationDuration={1500} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden">
                    <CardHeader className="px-4 sm:px-6">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                            <span className="truncate">Distribution</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 sm:px-2 md:px-6 w-full">
                        <div className="h-[280px] sm:h-[320px] md:h-[350px] w-full flex justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                        animationDuration={1500}
                                        animationBegin={200}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {sortedMonths.length > 0 && (
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden">
                    <CardHeader className="px-4 sm:px-6">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                            <span className="truncate">Monthly Expenses</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 sm:px-2 md:px-6 w-full">
                        <div className="h-[280px] sm:h-[320px] md:h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sortedMonths} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
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
                                        tickFormatter={(value) => `₹${value}`}
                                        tick={{ fill: '#6b7280' }}
                                        width={50}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} animationDuration={1500} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
