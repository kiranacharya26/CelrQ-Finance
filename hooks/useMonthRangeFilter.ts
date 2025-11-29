import { useState, useCallback } from 'react';

export interface MonthRange {
    from: string | null;
    to: string | null;
}

export function useMonthRangeFilter(initialRange: MonthRange = { from: null, to: null }) {
    const [monthRange, setMonthRange] = useState<MonthRange>(initialRange);

    const setFromMonth = useCallback((from: string | null) => {
        setMonthRange(prev => ({ ...prev, from }));
    }, []);

    const setToMonth = useCallback((to: string | null) => {
        setMonthRange(prev => ({ ...prev, to }));
    }, []);

    const clearRange = useCallback(() => {
        setMonthRange({ from: null, to: null });
    }, []);

    const isDateInRange = useCallback((date: Date): boolean => {
        if (!monthRange.from && !monthRange.to) return true;

        const transactionDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const fromDate = monthRange.from ? new Date(monthRange.from + '-01') : null;
        const toDate = monthRange.to ? new Date(monthRange.to + '-01') : null;

        if (fromDate && transactionDate < fromDate) return false;
        if (toDate && transactionDate > toDate) return false;

        return true;
    }, [monthRange]);

    const hasActiveFilter = monthRange.from !== null || monthRange.to !== null;

    return {
        monthRange,
        setMonthRange,
        setFromMonth,
        setToMonth,
        clearRange,
        isDateInRange,
        hasActiveFilter
    };
}
