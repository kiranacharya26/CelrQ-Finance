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
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:pb-0 sm:mx-0 sm:px-0 scrollbar-hide">
            {/* Savings Pattern */}
            <Card className="min-w-[85vw] sm:min-w-0 snap-center w-full overflow-hidden shadow-sm border-0 sm:border bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        <span>Savings Pattern</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className={`text-3xl sm:text-2xl font-bold truncate ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                        ₹{netSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        {stats ? `${stats.savingsRate.toFixed(1)}% retention rate` : 'of inflow'}
                    </p>
                </CardContent>
            </Card>

            {/* Money Inflow */}
            <Card className="min-w-[85vw] sm:min-w-0 snap-center w-full overflow-hidden shadow-sm border-0 sm:border bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                        <DollarSign className="h-4 w-4" />
                        <span>Money Inflow</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="text-3xl sm:text-2xl font-bold text-green-600 dark:text-green-400 truncate">
                        ₹{totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    {stats && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            {stats.incomeChange > 0 ? (
                                <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                            ) : (
                                <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                            )}
                            <span>{Math.abs(stats.incomeChange).toFixed(1)}% shift vs last month</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Spending Drift */}
            <Card className="min-w-[85vw] sm:min-w-0 snap-center w-full overflow-hidden shadow-sm border-0 sm:border bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700 dark:text-red-400">
                        <CreditCard className="h-4 w-4" />
                        <span>Spending Drift</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="text-3xl sm:text-2xl font-bold text-red-600 dark:text-red-400 truncate">
                        ₹{totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        {stats ? `₹${stats.avgDailySpend.toFixed(0)} daily velocity` : 'total spent'}
                    </p>
                </CardContent>
            </Card>

            {/* Major Pattern */}
            <Card className="min-w-[85vw] sm:min-w-0 snap-center w-full overflow-hidden shadow-sm border-0 sm:border bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <Activity className="h-4 w-4" />
                        <span>Major Pattern</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {stats?.topCategory ? (
                        <>
                            <div className="text-3xl sm:text-2xl font-bold truncate text-blue-900 dark:text-blue-100">
                                {stats.topCategory.name}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                ₹{stats.topCategory.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} noticed
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
