import { useMemo } from 'react';
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
        if (selectedBank === 'all') return allTransactions;
        return allTransactions.filter(t => t.bankName === selectedBank);
    }, [allTransactions, selectedBank]);

    return {
        transactions,
        availableBanks,
        loading,
        deleteBank,
        refresh,
    };
}
