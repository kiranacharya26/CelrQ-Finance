'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { parseDate } from '@/lib/parser';
import { DateRange } from '@/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';

import { DashboardSkeleton, ChartSkeleton } from '@/components/LoadingSkeletons';

// Lazy load heavy components
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts').then(mod => ({ default: mod.DashboardCharts })), {
    loading: () => <ChartSkeleton />,
    ssr: false,
});

const BudgetProgress = dynamic(() => import('@/components/BudgetProgress').then(mod => ({ default: mod.BudgetProgress })), {
    loading: () => <div className="h-[200px] bg-muted animate-pulse rounded"></div>,
});

const SpendingInsights = dynamic(() => import('@/components/SpendingInsights').then(mod => ({ default: mod.SpendingInsights })), {
    loading: () => <div className="h-[200px] bg-muted animate-pulse rounded"></div>,
});

const GoalTracker = dynamic(() => import('@/components/GoalTracker').then(mod => ({ default: mod.GoalTracker })), {
    loading: () => <div className="h-[250px] bg-muted animate-pulse rounded"></div>,
    ssr: false,
});

import { BudgetManager } from '@/components/BudgetManager';

import { BankConnections } from '@/components/BankConnections';
import { DashboardHero } from '@/components/DashboardHero';
import { InvestmentPortfolio } from '@/components/InvestmentPortfolio';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToCSV, exportToPDF } from '@/lib/export';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

function DashboardContent() {
    const { userEmail, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize from URL or default
    const selectedMonth = searchParams.get('month') || "All Months";

    const setSelectedMonth = (month: string) => {
        const params = new URLSearchParams(searchParams);
        if (month && month !== "All Months") {
            params.set('month', month);
        } else {
            params.delete('month');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const [selectedBank, setSelectedBank] = useState<string>("all");
    const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

    const { transactions, availableBanks, loading, deleteBank } = useTransactions({
        userEmail,
        selectedBank,
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
    const categoryKey = keys.find(k => k.toLowerCase() === 'category') || keys.find(k => k.toLowerCase().includes('category'));
    const dateKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time'));

    // Extract unique months
    const months = useMemo(() => {
        if (!dateKey) {
            return [];
        }

        const uniqueMonths = new Map<string, Date>(); // Map month string to its Date object for sorting
        let parsedCount = 0;
        let failedCount = 0;
        const failedSamples: any[] = [];
        const parsedSamples: { raw: any; parsed: Date; month: string }[] = [];

        transactions.forEach((t, index) => {
            const rawDate = t[dateKey];
            const date = parseDate(rawDate);

            if (date && !isNaN(date.getTime())) {
                const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                if (!uniqueMonths.has(monthStr)) {
                    uniqueMonths.set(monthStr, date);
                }
                parsedCount++;

                // Collect samples for debugging
                if (parsedSamples.length < 10) {
                    parsedSamples.push({ raw: rawDate, parsed: date, month: monthStr });
                }
            } else {
                failedCount++;
                // Collect failed samples for debugging
                if (failedSamples.length < 10) {
                    failedSamples.push(rawDate);
                }
            }
        });

        // Sort chronologically using the actual Date objects (Descending: Newest First)
        return Array.from(uniqueMonths.entries())
            .sort(([, dateA], [, dateB]) => dateB.getTime() - dateA.getTime())
            .map(([monthStr]) => monthStr);
    }, [transactions, dateKey]);

    // Filter transactions based on selected month and date range
    const filteredTransactions = useMemo(() => {
        let currentFiltered = transactions;

        if (dateRange.from || dateRange.to) {
            if (dateKey) {
                currentFiltered = currentFiltered.filter(t => {
                    const transDate = parseDate(t[dateKey]);
                    if (!transDate) return false;
                    if (dateRange.from && transDate < dateRange.from) return false;
                    if (dateRange.to && transDate > dateRange.to) return false;
                    return true;
                });
            }
        } else if (selectedMonth !== "All Months") {
            if (dateKey) {
                currentFiltered = currentFiltered.filter(t => {
                    const date = parseDate(t[dateKey]);
                    if (!date) return false;
                    return date.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' }) === selectedMonth;
                });
            }
        }
        return currentFiltered;
    }, [transactions, selectedMonth, dateRange, dateKey]);

    // Calculate totals
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

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const [trialInfo, setTrialInfo] = useState<{ isTrial: boolean; daysRemaining: number } | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            if (userEmail) {
                const res = await fetch(`/api/payment/status?email=${userEmail}`);
                const data = await res.json();
                if (data.isTrial) {
                    setTrialInfo({ isTrial: true, daysRemaining: data.trialDaysRemaining });
                }
            }
        };
        checkStatus();
    }, [userEmail]);

    const handleDeleteBankData = async () => {
        // This function will now be called by the ConfirmDialog
        await deleteBank(selectedBank);
        setSelectedBank('all');
        window.location.reload();
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (!isAuthenticated) {
        return <div className="flex items-center justify-center h-screen">Please sign in to view your dashboard.</div>;
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
            <ConfirmDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                title="Delete Bank Data"
                description={`Are you sure you want to delete all data for "${selectedBank === 'all' ? 'ALL BANKS' : selectedBank}"? This cannot be undone.`}
                onConfirm={handleDeleteBankData}
                confirmText="Delete Data"
                variant="destructive"
            />
            {trialInfo && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg mb-6 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <span className="text-2xl">⏳</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Free Trial Active</h3>
                                <p className="text-indigo-100">
                                    You have <span className="font-bold text-white">{trialInfo.daysRemaining} days</span> remaining in your premium trial.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="hidden md:block w-32 h-2 bg-black/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white/90 rounded-full transition-all duration-500"
                                    style={{ width: `${(trialInfo.daysRemaining / 7) * 100}%` }}
                                />
                            </div>
                            <button
                                onClick={() => router.push('/?upgrade=true')}
                                className="w-full md:w-auto bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="space-y-4">
                <DashboardHeader
                    selectedBank={selectedBank}
                    onBankChange={setSelectedBank}
                    availableBanks={availableBanks}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    months={months}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onDeleteBankData={() => setConfirmDeleteOpen(true)}
                    onExportCSV={() => exportToCSV(filteredTransactions)}
                    onExportPDF={() => exportToPDF(filteredTransactions)}
                />
            </div>

            {/* Viewing Context */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-muted-foreground">
                    Viewing Data for <span className="text-foreground">{selectedMonth}</span>
                </h2>
            </div>

            {/* Hero Stats Cards */}
            <DashboardHero
                transactions={filteredTransactions}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                netSavings={netSavings}
            />

            {/* Investment Portfolio */}
            <div className="w-full">
                <InvestmentPortfolio transactions={filteredTransactions} />
            </div>

            {/* Mobile Only: Budget Stories */}
            <div className="md:hidden w-full">
                <BudgetManager
                    transactions={filteredTransactions}
                    currentMonth={selectedMonth === 'All Months' ? new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) : selectedMonth}
                />
            </div>

            {/* Main Content - Column-based Layout for Tight Stacking */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Left Column (Main Content) - Spans 2 cols */}
                <div className="lg:col-span-2 space-y-6 w-full">

                    {/* Charts */}
                    <div className="w-full">
                        <Suspense fallback={<ChartSkeleton />}>
                            <DashboardCharts
                                transactions={filteredTransactions}
                                amountKey={amountKey}
                                depositKey={depositKey}
                                withdrawalKey={withdrawalKey}
                                categoryKey={categoryKey}
                                dateKey={dateKey}
                            />
                        </Suspense>
                    </div>
                </div>

                {/* Right Column (Sidebar Content) - Spans 1 col */}
                <div className="space-y-6 w-full">
                    {/* Goals */}
                    <div className="w-full">
                        <Suspense fallback={<div className="h-[250px] bg-muted animate-pulse rounded-xl"></div>}>
                            <GoalTracker transactions={filteredTransactions} />
                        </Suspense>
                    </div>

                    {/* Insights (Top Expenses) */}
                    <div className="w-full">
                        <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded-xl"></div>}>
                            <SpendingInsights
                                transactions={filteredTransactions}
                                selectedMonth={selectedMonth}
                            />
                        </Suspense>
                    </div>

                    {/* Budget Manager - Desktop Only (Sidebar) */}
                    <div className="hidden md:block w-full">
                        <BudgetManager
                            transactions={filteredTransactions}
                            currentMonth={selectedMonth === 'All Months' ? new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) : selectedMonth}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}
