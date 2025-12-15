'use client';

import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DashboardHero } from '@/components/DashboardHero';

// Lazy load components
import { InsightSkeleton, ChartSkeleton, StatsSkeleton } from '@/components/LoadingSkeletons';

// ... (keep existing lazy loads)

const AIInsights = dynamic(() => import('@/components/AIInsights').then(mod => ({ default: mod.AIInsights })), {
    loading: () => <InsightSkeleton />,
    ssr: false,
});

const SpendingForecast = dynamic(() => import('@/components/SpendingForecast').then(mod => ({ default: mod.SpendingForecast })), {
    loading: () => <ChartSkeleton />,
    ssr: false,
});

const SubscriptionTracker = dynamic(() => import('@/components/SubscriptionTracker').then(mod => ({ default: mod.SubscriptionTracker })), {
    loading: () => <StatsSkeleton />,
    ssr: false,
});

const BudgetProgress = dynamic(() => import('@/components/BudgetProgress').then(mod => ({ default: mod.BudgetProgress })), {
    loading: () => <ChartSkeleton />,
});

const SpendingInsights = dynamic(() => import('@/components/SpendingInsights').then(mod => ({ default: mod.SpendingInsights })), {
    loading: () => <ChartSkeleton />,
});

function InsightsContent() {
    const { userEmail, isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const selectedMonth = searchParams.get('month') || "All Months";

    const { transactions, loading } = useTransactions({
        userEmail,
        selectedBank: 'all',
    });

    // Helper to safely parse float from string or number
    const parseAmount = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    // Detect keys for dynamic data
    const allKeys = new Set<string>();
    transactions.slice(0, 50).forEach(t => {
        Object.keys(t).forEach(k => allKeys.add(k));
    });
    const keys = Array.from(allKeys);

    const depositKey = keys.find(k => k.toLowerCase().includes('deposit') || k.toLowerCase().includes('credit') || k.toLowerCase().includes('income'));
    const withdrawalKey = keys.find(k => k.toLowerCase().includes('withdrawal') || k.toLowerCase().includes('debit') || k.toLowerCase().includes('expense'));
    const amountKey = keys.find(k => k.toLowerCase().includes('amount') || k.toLowerCase().includes('cost') || k.toLowerCase().includes('price'));
    const dateKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time'));

    // Extract unique months
    const months = useMemo(() => {
        if (!dateKey) return [];

        const uniqueMonths = new Map<string, Date>();
        transactions.forEach((t) => {
            const rawDate = t[dateKey];
            const date = new Date(rawDate);

            if (date && !isNaN(date.getTime())) {
                const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!uniqueMonths.has(monthStr)) {
                    uniqueMonths.set(monthStr, date);
                }
            }
        });

        return Array.from(uniqueMonths.entries())
            .sort(([, dateA], [, dateB]) => dateB.getTime() - dateA.getTime())
            .map(([monthStr]) => monthStr);
    }, [transactions, dateKey]);

    // Filter transactions by selected month
    const filteredTransactions = useMemo(() => {
        if (selectedMonth === "All Months" || !dateKey) return transactions;

        return transactions.filter(t => {
            const date = new Date(t[dateKey]);
            if (!date || isNaN(date.getTime())) return false;
            return date.toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth;
        });
    }, [transactions, selectedMonth, dateKey]);

    const setSelectedMonth = (month: string) => {
        const params = new URLSearchParams(searchParams);
        if (month && month !== "All Months") {
            params.set('month', month);
        } else {
            params.delete('month');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    // Calculate totals using filtered transactions
    const { totalIncome, totalExpenses } = useMemo(() => {
        let income = 0;
        let expenses = 0;

        if (filteredTransactions.length > 0) {
            if (depositKey || withdrawalKey) {
                filteredTransactions.forEach(t => {
                    if (depositKey) income += parseAmount(t[depositKey]);
                    if (withdrawalKey) expenses += parseAmount(t[withdrawalKey]);
                });
            } else if (amountKey) {
                filteredTransactions.forEach(t => {
                    const amt = parseAmount(t[amountKey]);
                    // Check for type field first (Supabase schema)
                    if (t.type) {
                        if (t.type === 'income') income += amt;
                        else if (t.type === 'expense') expenses += amt;
                    } else {
                        // Fallback for CSVs without explicit type
                        if (amt > 0) income += amt;
                        else expenses += Math.abs(amt);
                    }
                });
            }
        }

        return { totalIncome: income, totalExpenses: expenses };
    }, [filteredTransactions, depositKey, withdrawalKey, amountKey]);

    const netSavings = totalIncome - totalExpenses;

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div className="flex items-center justify-center h-screen">Please sign in to view insights.</div>;
    }

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6 max-w-7xl mx-auto w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Advanced Insights</h1>
                    <p className="text-muted-foreground">
                        Deep dive into your spending patterns, forecasts, and AI-powered recommendations
                    </p>
                </div>

                {/* Month Selector */}
                {months.length > 0 && (
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="All Months">All Months</option>
                            {months.map((month) => (
                                <option key={month} value={month}>
                                    {month}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Hero Stats Cards */}
            <DashboardHero
                transactions={filteredTransactions}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                netSavings={netSavings}
            />

            {/* Main Content - Masonry-like Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* Left Column */}
                <div className="space-y-6 w-full">
                    {/* AI Insights */}
                    <div className="w-full">
                        <Suspense fallback={<InsightSkeleton />}>
                            <AIInsights transactions={filteredTransactions} />
                        </Suspense>
                    </div>

                    {/* Subscription Tracker */}
                    <div className="w-full">
                        <Suspense fallback={<StatsSkeleton />}>
                            <SubscriptionTracker transactions={filteredTransactions} />
                        </Suspense>
                    </div>

                    {/* Budget Progress */}
                    <div className="w-full">
                        <Suspense fallback={<ChartSkeleton />}>
                            <BudgetProgress transactions={filteredTransactions} selectedMonth={selectedMonth} />
                        </Suspense>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6 w-full">
                    {/* Spending Forecast */}
                    <div className="w-full">
                        <Suspense fallback={<ChartSkeleton />}>
                            <SpendingForecast transactions={filteredTransactions} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function InsightsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading insights...</div>}>
            <InsightsContent />
        </Suspense>
    );
}
