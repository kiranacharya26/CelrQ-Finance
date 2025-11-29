import { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionFilters, DateRange } from '@/types';
import { parseDate } from '@/lib/parser';

/**
 * Custom hook for filtering and searching transactions
 * Handles all filter logic in one place
 */
export function useTransactionFilters(transactions: Transaction[]) {
    const [filters, setFilters] = useState<TransactionFilters & { monthFilter: string }>({
        searchQuery: '',
        categoryFilter: 'all',
        tagFilter: 'all',
        sortBy: 'date-desc',
        dateRange: { from: null, to: null },
        monthFilter: 'All Months',
    });

    // Find date key dynamically
    const dateKey = useMemo(() => {
        if (transactions.length === 0) return null;
        const keys = Object.keys(transactions[0]);
        return keys.find((k) => /date|time/i.test(k)) || null;
    }, [transactions]);

    // Apply all filters
    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter((t) =>
                Object.values(t).some((val) =>
                    String(val).toLowerCase().includes(query)
                )
            );
        }

        // Category filter
        if (filters.categoryFilter !== 'all') {
            result = result.filter((t) => t.category === filters.categoryFilter);
        }

        // Month filter
        if (filters.monthFilter !== 'All Months' && dateKey) {
            result = result.filter((t) => {
                const date = parseDate(t[dateKey]);
                if (!date) return false;
                return date.toLocaleString('default', { month: 'long', year: 'numeric' }) === filters.monthFilter;
            });
        }

        // Date range filter
        if (dateKey && (filters.dateRange.from || filters.dateRange.to)) {
            result = result.filter((t) => {
                const transDate = parseDate(t[dateKey]);
                if (!transDate) return false;
                if (filters.dateRange.from && transDate < filters.dateRange.from) return false;
                if (filters.dateRange.to && transDate > filters.dateRange.to) return false;
                return true;
            });
        }

        // Sort
        if (filters.sortBy && dateKey) {
            result.sort((a, b) => {
                const dateA = parseDate(a[dateKey]);
                const dateB = parseDate(b[dateKey]);
                if (!dateA || !dateB) return 0;
                return filters.sortBy === 'date-desc'
                    ? dateB.getTime() - dateA.getTime()
                    : dateA.getTime() - dateB.getTime();
            });
        }

        return result;
    }, [transactions, filters, dateKey]);

    const setSearchQuery = (query: string) => {
        setFilters((prev) => ({ ...prev, searchQuery: query }));
    };

    const setCategoryFilter = (category: string) => {
        setFilters((prev) => ({ ...prev, categoryFilter: category }));
    };

    const setTagFilter = (tag: string) => {
        setFilters((prev) => ({ ...prev, tagFilter: tag }));
    };

    const setSortBy = (sort: string) => {
        setFilters((prev) => ({ ...prev, sortBy: sort }));
    };

    const setDateRange = (range: DateRange) => {
        setFilters((prev) => ({ ...prev, dateRange: range }));
    };

    const setMonthFilter = (month: string) => {
        setFilters((prev) => ({ ...prev, monthFilter: month }));
    };

    const clearFilters = () => {
        setFilters({
            searchQuery: '',
            categoryFilter: 'all',
            tagFilter: 'all',
            sortBy: 'date-desc',
            dateRange: { from: null, to: null },
            monthFilter: 'All Months',
        });
    };

    return {
        filteredTransactions,
        filters,
        setSearchQuery,
        setCategoryFilter,
        setTagFilter,
        setSortBy,
        setDateRange,
        setMonthFilter,
        clearFilters,
    };
}
