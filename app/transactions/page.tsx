'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Filter, X, DollarSign, Activity, Calculator } from 'lucide-react';
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
import { Input } from "@/components/ui/input";
import { exportToCSV, exportToPDF } from '@/lib/export';
import { getAllTags } from '@/lib/transactionNotes';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { DateRange } from '@/types';

// Lazy load TransactionTable for better performance
const TransactionTable = dynamic(() => import('@/components/TransactionTable').then(mod => ({ default: mod.TransactionTable })), {
    loading: () => (
        <Card className="p-6">
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
            </div>
        </Card>
    ),
    ssr: false,
});

export default function TransactionsPage() {
    const { userEmail, isAuthenticated } = useAuth();
    const [selectedBank, setSelectedBank] = useState<string>('all');

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
        setSortBy,
        setDateRange,
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
        console.log('Category changed - refreshing data');
        refresh(); // Reload transactions from storage
        // Note: We don't clear filters here - let users manually clear search if needed
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

        // Debug: Log first transaction to see field names
        if (filteredTransactions.length > 0) {
            console.log('Sample transaction:', filteredTransactions[0]);
            console.log('Transaction keys:', Object.keys(filteredTransactions[0]));
        }

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

        console.log('Calculated totals:', { income, expenses, count: filteredTransactions.length });

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

    if (loading) {
        return <div className="flex items-center justify-center h-screen" role="status" aria-live="polite">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div className="flex items-center justify-center h-screen">Please sign in to view transactions.</div>;
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                    {monthParam && monthParam !== 'All Months' && (
                        <p className="text-muted-foreground">Viewing data for {monthParam}</p>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger className="w-[180px]" aria-label="Select bank account">
                            <SelectValue placeholder="Select Bank" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Banks</SelectItem>
                            {availableBanks.map(bank => (
                                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DateRangePicker onRangeChange={setDateRange} />

                    {/* Export Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" aria-label="Export options">
                                <Download className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportToCSV(filteredTransactions)}>
                                Export CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportToPDF(filteredTransactions)}>
                                Export PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">{transactionCount} transactions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">From deposits</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{averageTransaction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Per transaction</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Transaction filters">
                <div className="relative max-w-sm">
                    <Input
                        placeholder="Search transactions..."
                        value={filters.searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search transactions"
                    />
                    {filters.searchQuery && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <Select value={filters.categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]" aria-label="Filter by category">
                        <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {uniqueCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-[180px]" aria-label="Filter by tag">
                        <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                        <SelectValue placeholder="Tags" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tags</SelectItem>
                        {availableTags.map(tag => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]" aria-label="Sort transactions">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                        <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} aria-label="Clear all filters">
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Transaction Table */}
            <Suspense fallback={
                <Card className="p-6">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                        ))}
                    </div>
                </Card>
            }>
                <TransactionTable
                    transactions={filteredTransactions}
                    onCategoryChange={handleCategoryChange}
                    currentCategoryFilter={filters.categoryFilter}
                    onCategoryFilterChange={setCategoryFilter}
                    uniqueCategories={uniqueCategories}
                />
            </Suspense>
        </div>
    );
}
