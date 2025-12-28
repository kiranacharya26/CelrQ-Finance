import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Transaction } from '@/types';
import { parseDate } from '@/lib/dateParser';

export function useTransactionFilters(transactions: Transaction[]) {
    const searchParams = useSearchParams();

    const filters = useMemo(() => ({
        searchQuery: searchParams.get('q') || '',
        categoryFilter: searchParams.get('category') || 'all',
        tagFilter: searchParams.get('tag') || 'all',
        typeFilter: searchParams.get('type') || 'all',
        sortBy: searchParams.get('sort') || 'date-desc',
        dateRange: {
            from: searchParams.get('from') ? new Date(searchParams.get('from') + '-01') : null,
            to: searchParams.get('to') ? new Date(searchParams.get('to') + '-01') : null,
        },
        monthFilter: searchParams.get('month') || 'All Months',
    }), [searchParams]);

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

        // Type filter
        if (filters.typeFilter !== 'all') {
            result = result.filter((t) => t.type === filters.typeFilter);
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

                if (filters.dateRange.from) {
                    const fromDate = new Date(filters.dateRange.from.getFullYear(), filters.dateRange.from.getMonth(), 1);
                    if (transDate < fromDate) return false;
                }
                if (filters.dateRange.to) {
                    const toDate = new Date(filters.dateRange.to.getFullYear(), filters.dateRange.to.getMonth() + 1, 0, 23, 59, 59);
                    if (transDate > toDate) return false;
                }
                return true;
            });
        }

        // Sort
        if (filters.sortBy && dateKey) {
            result.sort((a, b) => {
                const dateA = parseDate(a[dateKey]);
                const dateB = parseDate(b[dateKey]);
                if (!dateA || !dateB) return 0;

                if (filters.sortBy === 'date-desc') return dateB.getTime() - dateA.getTime();
                if (filters.sortBy === 'date-asc') return dateA.getTime() - dateB.getTime();

                const amountA = parseFloat(String(a.amount).replace(/[^0-9.-]+/g, '')) || 0;
                const amountB = parseFloat(String(b.amount).replace(/[^0-9.-]+/g, '')) || 0;

                if (filters.sortBy === 'amount-desc') return amountB - amountA;
                if (filters.sortBy === 'amount-asc') return amountA - amountB;

                return 0;
            });
        }

        return result;
    }, [transactions, filters, dateKey]);

    return {
        filteredTransactions,
        filters,
    };
}

