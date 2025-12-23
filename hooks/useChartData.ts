import { useMemo } from 'react';
import { parseAmount, parseDate, parseTransactionType, parseCategory, formatMonthYear } from '@/lib/dataParser';

export interface ProcessedTransaction {
    original: any;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: Date | null;
}

export interface ChartDataKeys {
    amountKey?: string;
    depositKey?: string;
    withdrawalKey?: string;
    categoryKey?: string;
    dateKey?: string;
}

export interface ChartData {
    categoryData: Record<string, number>;
    monthlyData: Record<string, number>;
    processedTransactions: ProcessedTransaction[];
}

export function useChartData(
    transactions: any[],
    keys: ChartDataKeys = {},
    dateFilter?: (date: Date) => boolean
): ChartData {
    return useMemo(() => {
        if (!transactions || transactions.length === 0) {
            return {
                categoryData: {},
                monthlyData: {},
                processedTransactions: []
            };
        }

        const { amountKey, depositKey, withdrawalKey, categoryKey, dateKey } = keys;

        // Process transactions
        const processedTransactions: ProcessedTransaction[] = transactions
            .map(t => {
                let amount = 0;
                // Optimization: Direct property access if keys are known standard keys
                if (t.amount !== undefined && t.type !== undefined) {
                    amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount);
                    return {
                        original: t,
                        amount: Math.abs(amount),
                        type: t.type as 'income' | 'expense',
                        category: t.category || 'Uncategorized',
                        date: t.date ? new Date(t.date) : null
                    };
                }

                const type = parseTransactionType(t, withdrawalKey, depositKey, amountKey);

                if (withdrawalKey && t[withdrawalKey]) {
                    amount = parseAmount(t[withdrawalKey]);
                } else if (depositKey && t[depositKey]) {
                    amount = parseAmount(t[depositKey]);
                } else if (amountKey && t[amountKey]) {
                    amount = Math.abs(parseAmount(t[amountKey]));
                }

                const category = parseCategory(t, categoryKey);
                const date = parseDate(t[dateKey || 'date']);

                return {
                    original: t,
                    amount,
                    type,
                    category,
                    date
                };
            })
            .filter(t => t.date !== null);

        // Calculate category and monthly data
        const categoryData: Record<string, number> = {};
        const monthlyData: Record<string, number> = {};

        // Single pass for aggregation
        for (const t of processedTransactions) {
            if (t.type === 'expense') {
                // Category aggregation
                categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;

                // Monthly aggregation (with filter check)
                if (t.date) {
                    if (!dateFilter || dateFilter(t.date)) {
                        const monthYear = formatMonthYear(t.date);
                        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + t.amount;
                    }
                }
            }
        }

        return {
            categoryData,
            monthlyData,
            processedTransactions
        };
    }, [transactions, keys, dateFilter]);
}
