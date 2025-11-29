import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types';
import { supabase } from '@/lib/supabase';

interface UseTransactionsOptions {
    userEmail: string;
    selectedBank: string;
}

/**
 * Custom hook for managing transaction data
 * Fetches from Supabase
 */
export function useTransactions({ userEmail, selectedBank }: UseTransactionsOptions) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [availableBanks, setAvailableBanks] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const loadTransactions = useCallback(async () => {
        if (!userEmail) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let allData: any[] = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            // Fetch all pages
            while (hasMore) {
                let query = supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_email', userEmail)
                    .order('date', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (selectedBank !== 'all') {
                    query = query.eq('bank_name', selectedBank);
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Error fetching transactions page:', page, error);
                    break;
                }

                if (data) {
                    allData = [...allData, ...data];
                    if (data.length < pageSize) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }
            }

            console.log(`📊 Loaded total ${allData.length} transactions from Supabase (across ${page + 1} pages)`);

            // Debug: Show date range
            if (allData.length > 0) {
                const dates = allData.map(r => r.date).filter(Boolean).sort();
                console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
            }

            // Map Supabase rows to Transaction type
            const mappedTransactions: Transaction[] = allData.map(row => ({
                date: row.date,
                description: row.description,
                narration: row.description,
                amount: row.amount,
                'Withdrawal Amt.': row.type === 'expense' ? row.amount : 0,
                'Deposit Amt.': row.type === 'income' ? row.amount : 0,
                type: row.type,
                category: row.category,
                merchantName: row.merchant_name,
                bankName: row.bank_name,
                id: row.id
            }));

            setTransactions(mappedTransactions);

            // Extract available banks
            const { data: bankData } = await supabase
                .from('transactions')
                .select('bank_name')
                .eq('user_email', userEmail);

            if (bankData) {
                const banks = Array.from(new Set(bankData.map(b => b.bank_name).filter(Boolean))) as string[];
                setAvailableBanks(banks);
            }

        } catch (err) {
            console.error('Unexpected error loading transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedBank, userEmail, refreshTrigger]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const deleteBank = async (bankToDelete: string) => {
        // We need userEmail to delete safely
        if (!userEmail) {
            console.error("Cannot delete: No user email provided");
            return;
        }

        try {
            console.log(`Attempting to delete transactions for user: ${userEmail}, bank: ${bankToDelete}`);

            let query = supabase.from('transactions').delete();

            // ALWAYS filter by user_email first for safety
            query = query.eq('user_email', userEmail);

            // If deleting a specific bank, add that filter
            if (bankToDelete !== 'all') {
                query = query.eq('bank_name', bankToDelete);
            }

            const { error, count } = await query;

            if (error) {
                console.error('Error deleting bank transactions:', error);
                throw error;
            } else {
                console.log(`Successfully deleted transactions. Count: ${count}`);
                // Clear local state immediately to reflect change in UI
                setTransactions([]);
                setAvailableBanks([]);
                refresh();
            }
        } catch (err) {
            console.error('Error in deleteBank:', err);
            alert('Failed to delete data. Please check console for details.');
        }
    };

    const refresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return {
        transactions,
        availableBanks,
        loading,
        deleteBank,
        refresh,
    };
}
