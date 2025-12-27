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
import { getCurrentFinancialYear } from '@/lib/financialYear';

interface DashboardChartsProps {
    transactions: any[];
    amountKey?: string;
    depositKey?: string;
    withdrawalKey?: string;
    categoryKey?: string;
    dateKey?: string;
    showOnly?: 'monthly' | 'category' | 'pie';
}

export function DashboardCharts({
    transactions,
    amountKey,
    depositKey,
    withdrawalKey,
    categoryKey,
    dateKey,
    showOnly
}: DashboardChartsProps) {
    // Month range filter state via custom hook
    const { monthRange, setFromMonth, setToMonth, clearRange, isDateInRange } = useMonthRangeFilter();

    // Process chart data with optional date filter
    const { categoryData, monthlyData } = useChartData(
        transactions,
        { amountKey, depositKey, withdrawalKey, categoryKey, dateKey },
        isDateInRange
    );

    if (showOnly === 'category') {
        return <SpendingByCategory categoryData={categoryData} />;
    }

    if (showOnly === 'pie') {
        return <TopCategoriesPie categoryData={categoryData} />;
    }

    if (showOnly === 'monthly') {
        return (
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden flex flex-col">
                <CardHeader className="px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                            <span className="truncate">Monthly Expenses</span>
                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {getCurrentFinancialYear().label}
                            </span>
                        </CardTitle>
                        <MonthRangeFilter
                            monthRange={monthRange}
                            onFromChange={setFromMonth}
                            onToChange={setToMonth}
                            onClear={clearRange}
                        />
                    </div>
                </CardHeader>
                <CardContent className="px-0 sm:px-2 md:px-6 w-full flex-1">
                    <MonthlyExpenses monthlyData={monthlyData} />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Spending by Category - Full Width */}
            <div className="w-full">
                <SpendingByCategory categoryData={categoryData} />
            </div>

            {/* Top Categories Pie - Full Width */}
            <div className="w-full">
                <TopCategoriesPie categoryData={categoryData} />
            </div>

            {/* Monthly Expenses with filter - Full Width */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden flex flex-col">
                <CardHeader className="px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                            <span className="truncate">Monthly Expenses</span>
                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {getCurrentFinancialYear().label}
                            </span>
                        </CardTitle>
                        <MonthRangeFilter
                            monthRange={monthRange}
                            onFromChange={setFromMonth}
                            onToChange={setToMonth}
                            onClear={clearRange}
                        />
                    </div>
                </CardHeader>
                <CardContent className="px-0 sm:px-2 md:px-6 w-full flex-1">
                    <MonthlyExpenses monthlyData={monthlyData} />
                </CardContent>
            </Card>
        </div>
    );
}
