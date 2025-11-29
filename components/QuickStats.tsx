import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Calendar, TrendingUp, Percent } from "lucide-react";
import { useMemo } from "react";

interface QuickStatsProps {
    transactions: any[];
}

export function QuickStats({ transactions }: QuickStatsProps) {
    const stats = useMemo(() => {
        if (!transactions.length) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Helper to get date from transaction
        const getDate = (t: any) => {
            const dateKey = Object.keys(t).find(k => /^date$/i.test(k));
            return dateKey ? new Date(t[dateKey]) : null;
        };

        // Helper to get amount from transaction
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
                // Simple heuristic: negative amount or no deposit key usually means expense if mixed
                // But usually parser separates them. If single column, we need logic.
                // Assuming standard parser output where we have Credit/Debit columns or Amount with sign.
                // If amount is negative, it's expense? Or depends on bank.
                // For now, assume positive in Withdrawal column is expense.
            }

            return { amount: isNaN(amount) ? 0 : amount, type };
        };

        // 1. Average Daily Spend (This Month)
        const thisMonthTransactions = transactions.filter(t => {
            const d = getDate(t);
            return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const totalExpenseThisMonth = thisMonthTransactions.reduce((sum, t) => {
            const { amount, type } = getAmount(t);
            return type === 'expense' ? sum + amount : sum;
        }, 0);

        const totalIncomeThisMonth = thisMonthTransactions.reduce((sum, t) => {
            const { amount, type } = getAmount(t);
            return type === 'income' ? sum + amount : sum;
        }, 0);

        const daysPassed = now.getDate();
        const avgDailySpend = daysPassed > 0 ? totalExpenseThisMonth / daysPassed : 0;

        // 2. Most Expensive Day (This Month)
        const dailyExpenses: Record<string, number> = {};
        thisMonthTransactions.forEach(t => {
            const { amount, type } = getAmount(t);
            if (type === 'expense') {
                const d = getDate(t);
                if (d) {
                    const dayStr = d.toLocaleDateString();
                    dailyExpenses[dayStr] = (dailyExpenses[dayStr] || 0) + amount;
                }
            }
        });

        let maxDay = '';
        let maxAmount = 0;
        Object.entries(dailyExpenses).forEach(([day, amount]) => {
            if (amount > maxAmount) {
                maxAmount = amount;
                maxDay = day;
            }
        });

        // 3. Savings Rate
        const savingsRate = totalIncomeThisMonth > 0
            ? ((totalIncomeThisMonth - totalExpenseThisMonth) / totalIncomeThisMonth) * 100
            : 0;

        // 4. Month over Month Comparison
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthTransactions = transactions.filter(t => {
            const d = getDate(t);
            return d && d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
        });

        const totalExpenseLastMonth = lastMonthTransactions.reduce((sum, t) => {
            const { amount, type } = getAmount(t);
            return type === 'expense' ? sum + amount : sum;
        }, 0);

        const expenseChange = totalExpenseLastMonth > 0
            ? ((totalExpenseThisMonth - totalExpenseLastMonth) / totalExpenseLastMonth) * 100
            : 0;

        return {
            avgDailySpend,
            maxDay,
            maxDayAmount: maxAmount,
            savingsRate,
            expenseChange,
            totalExpenseThisMonth,
            totalExpenseLastMonth
        };
    }, [transactions]);

    if (!stats) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Avg. Daily Spend
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{stats.avgDailySpend.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground">
                        this month
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Most Expensive Day
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{stats.maxDayAmount.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground">
                        on {stats.maxDay}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Savings Rate
                    </CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats.savingsRate >= 20 ? 'text-green-600' : stats.savingsRate > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {stats.savingsRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        of income saved
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Vs Last Month
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-2xl font-bold">
                        {stats.expenseChange > 0 ? (
                            <ArrowUpIcon className="mr-1 h-4 w-4 text-red-500" />
                        ) : (
                            <ArrowDownIcon className="mr-1 h-4 w-4 text-green-500" />
                        )}
                        {Math.abs(stats.expenseChange).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.expenseChange > 0 ? 'more' : 'less'} spending
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
