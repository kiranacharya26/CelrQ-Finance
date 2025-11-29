'use client';

import { useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Download, Filter, Trash2 } from 'lucide-react';
import { parseDate } from '@/lib/parser';
import { DateRange } from '@/types';

// Lazy load heavy components
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts').then(mod => ({ default: mod.DashboardCharts })), {
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded"></div>,
    ssr: false,
});

const BudgetProgress = dynamic(() => import('@/components/BudgetProgress').then(mod => ({ default: mod.BudgetProgress })), {
    loading: () => <div className="h-[200px] bg-muted animate-pulse rounded"></div>,
});

const SpendingInsights = dynamic(() => import('@/components/SpendingInsights').then(mod => ({ default: mod.SpendingInsights })), {
    loading: () => <div className="h-[200px] bg-muted animate-pulse rounded"></div>,
});

const AIInsights = dynamic(() => import('@/components/AIInsights').then(mod => ({ default: mod.AIInsights })), {
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded"></div>,
    ssr: false,
});

const GoalTracker = dynamic(() => import('@/components/GoalTracker').then(mod => ({ default: mod.GoalTracker })), {
    loading: () => <div className="h-[250px] bg-muted animate-pulse rounded"></div>,
    ssr: false,
});



import { BudgetManager } from '@/components/BudgetManager';
import { DashboardHero } from '@/components/DashboardHero';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { exportToCSV, exportToPDF } from '@/lib/export';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function DashboardPage() {
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
            console.log('⚠️ No date key found in transactions');
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
                const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
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

        console.log(`📅 Month extraction: ${parsedCount} dates parsed, ${failedCount} failed`);
        console.log(`📅 Found ${uniqueMonths.size} unique months`);
        console.log('📅 Sample parsed dates:', parsedSamples);
        if (failedSamples.length > 0) {
            console.log('❌ Sample failed dates:', failedSamples);
        }
        console.log('📅 All unique months found:', Array.from(uniqueMonths.keys()).sort());

        // Sort chronologically using the actual Date objects
        return Array.from(uniqueMonths.entries())
            .sort(([, dateA], [, dateB]) => dateA.getTime() - dateB.getTime())
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
                    return date.toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth;
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

    const handleDeleteBankData = async () => {
        if (!confirm(`Are you sure you want to delete all data for "${selectedBank === 'all' ? 'ALL BANKS' : selectedBank}"? This cannot be undone.`)) {
            return;
        }
        await deleteBank(selectedBank);
        setSelectedBank('all');
        // Force a hard refresh to ensure all components and caches are cleared
        window.location.reload();
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen" role="status" aria-live="polite">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div className="flex items-center justify-center h-screen">Please sign in to view your dashboard.</div>;
    }

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6 max-w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-50 w-full bg-background p-2 sm:p-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Primary Controls */}
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger className="w-full sm:w-[180px]" aria-label="Select bank account">
                            <SelectValue placeholder="Select Bank" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Banks</SelectItem>
                            {availableBanks.map(bank => (
                                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[180px]" aria-label="Select month">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Months">All Months</SelectItem>
                            {months.map(month => (
                                <SelectItem key={month} value={month}>{month}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DateRangePicker onRangeChange={setDateRange} />

                    {/* Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto min-w-[44px]"
                                aria-label="Filter options"
                            >
                                <Filter className="h-4 w-4" />
                                <span className="ml-2 sm:hidden">Options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <div className="p-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Actions</p>
                                <div className="space-y-2">
                                    <BudgetManager />
                                    {availableBanks.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDeleteBankData}
                                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                            aria-label="Delete bank data"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Data
                                        </Button>
                                    )}
                                </div>

                                <div className="my-3 border-t" />

                                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Export</p>
                                <div className="space-y-1">
                                    <DropdownMenuItem onClick={() => exportToCSV(filteredTransactions)} className="cursor-pointer">
                                        <Download className="mr-2 h-4 w-4" />
                                        <span>Export as CSV</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportToPDF(filteredTransactions)} className="cursor-pointer">
                                        <Download className="mr-2 h-4 w-4" />
                                        <span>Export as PDF</span>
                                    </DropdownMenuItem>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Hero Stats */}
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-muted-foreground">
                    Viewing Data for <span className="text-foreground">{selectedMonth}</span>
                </h2>
            </div>

            <DashboardHero
                transactions={filteredTransactions}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                netSavings={netSavings}
            />

            {/* Main Content Grid */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-7 max-w-full">
                {/* Charts Area - Takes up 4 columns on desktop, full width on mobile */}
                <div className="lg:col-span-4 space-y-4 sm:space-y-6 min-w-0">
                    <Suspense fallback={<div className="h-[300px] bg-muted animate-pulse rounded"></div>}>
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

                {/* Sidebar Area - Takes up 3 columns on desktop, full width on mobile */}
                <div className="lg:col-span-3 space-y-4 sm:space-y-6 min-w-0">
                    <Suspense fallback={<div className="h-[300px] bg-muted animate-pulse rounded"></div>}>
                        <AIInsights transactions={filteredTransactions} />
                    </Suspense>
                    <Suspense fallback={<div className="h-[250px] bg-muted animate-pulse rounded"></div>}>
                        <GoalTracker transactions={filteredTransactions} />
                    </Suspense>
                    <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded"></div>}>
                        <BudgetProgress transactions={filteredTransactions} selectedMonth={selectedMonth} />
                    </Suspense>
                    <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded"></div>}>
                        <SpendingInsights transactions={filteredTransactions} selectedMonth={selectedMonth} />
                    </Suspense>
                </div>
            </div>

            {/* Transaction Table Section Removed */}

        </div>
    );
}
