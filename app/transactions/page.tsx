'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { exportToCSV, exportToPDF } from '@/lib/export';
import { getAllTags } from '@/lib/transactionNotes';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { TransactionsHeader } from '@/components/transactions/TransactionsHeader';
import { TransactionStats } from '@/components/transactions/TransactionStats';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { DateRange } from '@/types';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

import { TransactionsSkeleton, TableSkeleton, StatsSkeleton } from '@/components/LoadingSkeletons';

// Lazy load TransactionTable for better performance
const TransactionTable = dynamic(() => import('@/components/TransactionTable').then(mod => ({ default: mod.TransactionTable })), {
    loading: () => <TableSkeleton />,
    ssr: false,
});

function TransactionsContent() {
    const { userEmail, isAuthenticated } = useAuth();
    const [selectedBank, setSelectedBank] = useState<string>('all');
    const [activeUpload, setActiveUpload] = useState<any>(null);

    // Poll for active uploads
    useEffect(() => {
        if (!userEmail) return;

        const checkUploads = async () => {
            const { data, error } = await supabase
                .from('uploads')
                .select('*')
                .eq('user_email', userEmail)
                .eq('status', 'processing')
                .order('upload_date', { ascending: false })
                .limit(1);

            if (data && data.length > 0) {
                setActiveUpload(data[0]);
            } else {
                if (activeUpload) {
                    // If it was processing and now it's done, refresh transactions
                    refresh();
                }
                setActiveUpload(null);
            }
        };

        checkUploads();
        const interval = setInterval(checkUploads, 3000);
        return () => clearInterval(interval);
    }, [userEmail, activeUpload]);

    const { transactions, availableBanks, loading, refresh } = useTransactions({
        userEmail,
        selectedBank,
    });

    const {
        filteredTransactions,
        filters,
        setSearchQuery,
        setCategoryFilter,
        setTagFilter,
        setTypeFilter,
        setSortBy,
        setMonthFilter,
        clearFilters,
    } = useTransactionFilters(transactions);

    // Sync with URL params
    const searchParams = useSearchParams();
    const monthParam = searchParams.get('month');

    useEffect(() => {
        if (monthParam) {
            setMonthFilter(monthParam);
        } else {
            setMonthFilter('All Months');
        }
    }, [monthParam]);

    // Handler for category changes - refresh data but keep filters
    const handleCategoryChange = () => {
        refresh();
    };

    const availableTags = useMemo(() => {
        return userEmail ? getAllTags(userEmail) : [];
    }, [userEmail, transactions]);

    const uniqueCategories = useMemo(() => {
        const cats = new Set<string>();
        transactions.forEach(t => {
            if (t.category) cats.add(t.category);
        });
        return Array.from(cats).sort();
    }, [transactions]);

    // Calculate totals
    const { totalIncome, totalExpenses, transactionCount } = useMemo(() => {
        let income = 0;
        let expenses = 0;

        // Helper to safely parse amount
        const parseAmount = (val: any): number => {
            if (typeof val === 'number') return val;
            if (!val || val === '') return 0;
            const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
            return isNaN(parsed) ? 0 : parsed;
        };

        filteredTransactions.forEach(t => {
            // Try different field names for deposits/income (including variations with spaces and periods)
            const deposit = parseAmount(
                t['Deposit Amt.'] || t['Deposit Amt'] || t.deposit || t.credit ||
                t.Deposit || t.Credit || t['Credit Amt.'] || 0
            );

            const withdrawal = parseAmount(
                t['Withdrawal Amt.'] || t['Withdrawal Amt'] || t.withdrawal || t.debit ||
                t.Withdrawal || t.Debit || t['Debit Amt.'] || 0
            );

            const amount = parseAmount(t.amount || t.Amount || 0);

            // Add to income/expenses based on what fields are present
            if (deposit > 0) {
                income += deposit;
            }
            if (withdrawal > 0) {
                expenses += withdrawal;
            }
            // If no deposit/withdrawal fields, use amount field
            if (deposit === 0 && withdrawal === 0 && amount !== 0) {
                if (amount > 0) {
                    income += amount;
                } else {
                    expenses += Math.abs(amount);
                }
            }
        });

        return {
            totalIncome: income,
            totalExpenses: expenses,
            transactionCount: filteredTransactions.length,
        };
    }, [filteredTransactions]);

    const averageTransaction = transactionCount > 0 ? totalExpenses / transactionCount : 0;

    const hasActiveFilters =
        filters.searchQuery !== '' ||
        filters.categoryFilter !== 'all' ||
        filters.tagFilter !== 'all' ||
        filters.dateRange.from !== null ||
        filters.dateRange.to !== null;

    const router = useRouter();

    // Calculate unique months
    const months = useMemo(() => {
        const uniqueMonths = new Set<string>();
        transactions.forEach(t => {
            const dateKey = Object.keys(t).find(k => /^date$/i.test(k));
            if (dateKey && t[dateKey]) {
                const date = new Date(t[dateKey]);
                if (!isNaN(date.getTime())) {
                    const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    uniqueMonths.add(monthStr);
                }
            }
        });
        return Array.from(uniqueMonths).sort((a, b) => {
            return new Date(b).getTime() - new Date(a).getTime();
        });
    }, [transactions]);

    const handleMonthChange = (month: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (month === 'All Months') {
            params.delete('month');
        } else {
            params.set('month', month);
        }
        router.push(`?${params.toString()}`);
    };

    if (loading) {
        return <TransactionsSkeleton />;
    }

    if (!isAuthenticated) {
        return <div className="flex items-center justify-center h-screen">Please sign in to view transactions.</div>;
    }

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6 max-w-7xl mx-auto w-full">
            {activeUpload && (
                <Card className="p-4 bg-blue-500/10 border-blue-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        <div>
                            <p className="text-sm font-medium text-blue-500">
                                AI Forensic Analysis in Progress...
                            </p>
                            <p className="text-xs text-blue-500/70">
                                Scanning {activeUpload.processed_count} / {activeUpload.transaction_count} rows. Your dashboard will update automatically.
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-bold text-blue-500">
                            {Math.round((activeUpload.processed_count / activeUpload.transaction_count) * 100)}%
                        </span>
                    </div>
                </Card>
            )}

            <TransactionsHeader
                selectedBank={selectedBank}
                onBankChange={setSelectedBank}
                availableBanks={availableBanks}
                monthParam={monthParam}
                onExportCSV={() => exportToCSV(filteredTransactions)}
                onExportPDF={() => exportToPDF(filteredTransactions)}
                months={months}
                selectedMonth={monthParam || 'All Months'}
                onMonthChange={handleMonthChange}
            />

            {/* Stats Cards */}
            <TransactionStats
                totalExpenses={totalExpenses}
                totalIncome={totalIncome}
                transactionCount={transactionCount}
                averageTransaction={averageTransaction}
            />

            {/* Filters */}
            <TransactionFilters
                searchQuery={filters.searchQuery}
                onSearchChange={setSearchQuery}
                categoryFilter={filters.categoryFilter}
                onCategoryChange={setCategoryFilter}
                tagFilter={filters.tagFilter}
                onTagChange={setTagFilter}
                sortBy={filters.sortBy}
                onSortChange={setSortBy}
                uniqueCategories={uniqueCategories}
                availableTags={availableTags}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
            />

            {/* Transaction Table */}
            <Suspense fallback={<TableSkeleton />}>
                <TransactionTable
                    transactions={filteredTransactions}
                    onCategoryChange={handleCategoryChange}
                />
            </Suspense>
        </div>
    );
}

export default function TransactionsPage() {
    return (
        <Suspense fallback={<TransactionsSkeleton />}>
            <TransactionsContent />
        </Suspense>
    );
}
