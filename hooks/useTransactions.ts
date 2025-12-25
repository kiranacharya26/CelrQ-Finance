import { useMemo, useEffect } from 'react';
import { Transaction } from '@/types';
import { useTransactionsContext } from '@/context/TransactionsContext';

interface UseTransactionsOptions {
    userEmail: string;
    selectedBank: string;
}

/**
 * Custom hook for managing transaction data
 * Fetches from Supabase
 */
export function useTransactions({ userEmail, selectedBank }: UseTransactionsOptions) {
    const { transactions: allTransactions, availableBanks, loading, refresh, deleteBank } = useTransactionsContext();

    // Filter transactions based on selected bank
    const transactions = useMemo(() => {
        console.log(`🔍 [useTransactions] Filtering ${allTransactions.length} transactions for bank: "${selectedBank}"`);

        if (selectedBank === 'all') {
            console.log(`✅ [useTransactions] Returning all ${allTransactions.length} transactions`);
            return allTransactions;
        }

        const filtered = allTransactions.filter(t => t.bankName === selectedBank);
        console.log(`✅ [useTransactions] Filtered to ${filtered.length} transactions for bank "${selectedBank}"`);
        return filtered;
    }, [allTransactions, selectedBank]);

    useEffect(() => {
        console.log(`📊 [useTransactions] Current state:`, {
            totalTransactions: allTransactions.length,
            filteredTransactions: transactions.length,
            selectedBank,
            availableBanks,
            loading
        });
    }, [transactions, allTransactions, selectedBank, availableBanks, loading]);

    return {
        transactions,
        availableBanks,
        loading,
        deleteBank,
        refresh,
    };
}
