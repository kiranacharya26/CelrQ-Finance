import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, DollarSign, CreditCard, TrendingUp, Activity } from "lucide-react";
import { useMemo } from "react";

interface DashboardHeroProps {
    transactions: any[];
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
}

export function DashboardHero({ transactions, totalIncome, totalExpenses, netSavings }: DashboardHeroProps) {
    const stats = useMemo(() => {
        if (!transactions.length) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Helper to get date and amount
        const getDate = (t: any) => {
            const dateKey = Object.keys(t).find(k => /^date$/i.test(k));
            return dateKey ? new Date(t[dateKey]) : null;
        };

        const getAmount = (t: any) => {
            const withdrawalKey = Object.keys(t).find(k => /withdrawal|debit/i.test(k));
            const depositKey = Object.keys(t).find(k => /deposit|credit/i.test(k));
            const amountKey = Object.keys(t).find(k => /^amount$/i.test(k));

            let amount = 0;
            let type = 'expense';

            if (withdrawalKey && t[withdrawalKey]) {
                amount = parseFloat(String(t[withdrawalKey]).replace(/[^0-9.-]+/g, ""));
            } else if (depositKey && t[depositKey]) {
                amount = parseFloat(String(t[depositKey]).replace(/[^0-9.-]+/g, ""));
                type = 'income';
            } else if (amountKey && t[amountKey]) {
                amount = parseFloat(String(t[amountKey]).replace(/[^0-9.-]+/g, ""));
            }
            return { amount: isNaN(amount) ? 0 : amount, type };
        };

        // 1. Avg Daily Spend
        const thisMonthTransactions = transactions.filter(t => {
            const d = getDate(t);
            return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const totalExpenseThisMonth = thisMonthTransactions.reduce((sum, t) => {
            const { amount, type } = getAmount(t);
            return type === 'expense' ? sum + amount : sum;
        }, 0);

        const daysPassed = now.getDate();
        const avgDailySpend = daysPassed > 0 ? totalExpenseThisMonth / daysPassed : 0;

        // 2. Savings Rate
        const savingsRate = totalIncome > 0
            ? ((totalIncome - totalExpenses) / totalIncome) * 100
            : 0;

        // 3. Month over Month Income Trend
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthTransactions = transactions.filter(t => {
            const d = getDate(t);
            return d && d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
        });

        const totalIncomeLastMonth = lastMonthTransactions.reduce((sum, t) => {
            const { amount, type } = getAmount(t);
            return type === 'income' ? sum + amount : sum;
        }, 0);

        const incomeChange = totalIncomeLastMonth > 0
            ? ((totalIncome - totalIncomeLastMonth) / totalIncomeLastMonth) * 100
            : 0;

        // 4. Top Category
        const categoryKey = Object.keys(transactions[0] || {}).find(k => /category/i.test(k));
        const categorySpending: Record<string, number> = {};
        if (categoryKey) {
            transactions.forEach(t => {
                const { amount, type } = getAmount(t);
                if (type === 'expense') {
                    const cat = t[categoryKey] || 'Other';
                    categorySpending[cat] = (categorySpending[cat] || 0) + amount;
                }
            });
        }
        const topCategory = Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0];

        return {
            avgDailySpend,
            savingsRate,
            incomeChange,
            topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null
        };
    }, [transactions, totalIncome, totalExpenses]);

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
            {/* Net Savings */}
            <Card className="w-full overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">Net Savings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <div className={`text-xl sm:text-2xl font-bold truncate ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{netSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                        {stats ? `${stats.savingsRate.toFixed(1)}% savings rate` : 'of income'}
                    </p>
                </CardContent>
            </Card>

            {/* Income */}
            <Card className="w-full overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="truncate">Total Income</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <div className="text-xl sm:text-2xl font-bold text-green-600 truncate">
                        ₹{totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    {stats && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            {stats.incomeChange > 0 ? (
                                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500 flex-shrink-0" />
                            ) : (
                                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500 flex-shrink-0" />
                            )}
                            <span className="truncate">{Math.abs(stats.incomeChange).toFixed(1)}% vs last month</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expenses */}
            <Card className="w-full overflow-hidden min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="truncate">Total Expenses</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <div className="text-xl sm:text-2xl font-bold text-red-600 truncate">
                        ₹{totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                        {stats ? `~₹${stats.avgDailySpend.toFixed(0)} daily avg` : 'total spent'}
                    </p>
                </CardContent>
            </Card>

            {/* Top Insight */}
            <Card className="w-full overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">Top Spending</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    {stats?.topCategory ? (
                        <>
                            <div className="text-xl sm:text-2xl font-bold truncate">
                                {stats.topCategory.name}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                ₹{stats.topCategory.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent
                            </p>
                        </>
                    ) : (
                        <div className="text-sm text-muted-foreground">No data available</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
