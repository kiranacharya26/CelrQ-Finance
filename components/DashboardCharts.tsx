'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useMonthRangeFilter } from '@/hooks/useMonthRangeFilter';
import { useChartData } from '@/hooks/useChartData';
import { SpendingByCategory } from '@/components/charts/SpendingByCategory';
import { TopCategoriesPie } from '@/components/charts/TopCategoriesPie';
import { MonthlyExpenses } from '@/components/charts/MonthlyExpenses';
import { MonthRangeFilter } from '@/components/charts/MonthRangeFilter';

interface DashboardChartsProps {
    transactions: any[];
    amountKey?: string;
    depositKey?: string;
    withdrawalKey?: string;
    categoryKey?: string;
    dateKey?: string;
}

export function DashboardCharts({
    transactions,
    amountKey,
    depositKey,
    withdrawalKey,
    categoryKey,
    dateKey,
}: DashboardChartsProps) {
    // Month range filter state via custom hook
    const { monthRange, setFromMonth, setToMonth, clearRange, isDateInRange } = useMonthRangeFilter();

    // Process chart data with optional date filter
    const { categoryData, monthlyData } = useChartData(
        transactions,
        { amountKey, depositKey, withdrawalKey, categoryKey, dateKey },
        isDateInRange
    );

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full">
            {/* Spending by Category */}
            <SpendingByCategory categoryData={categoryData} />

            {/* Top Categories Pie */}
            <TopCategoriesPie categoryData={categoryData} />

            {/* Monthly Expenses with filter */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                            <span className="truncate">Monthly Expenses</span>
                        </CardTitle>
                        <MonthRangeFilter
                            monthRange={monthRange}
                            onFromChange={setFromMonth}
                            onToChange={setToMonth}
                            onClear={clearRange}
                        />
                    </div>
                </CardHeader>
                <CardContent className="px-0 sm:px-2 md:px-6 w-full">
                    <MonthlyExpenses monthlyData={monthlyData} />
                </CardContent>
            </Card>
        </div>
    );
}
