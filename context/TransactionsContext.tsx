'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Transaction } from '@/types';
import { supabase } from '@/lib/supabase';
import { useSession } from 'next-auth/react';
import { parseDate } from '@/lib/dateParser';
import { getAllTags } from '@/lib/transactionNotes';

interface TransactionsContextType {
    transactions: Transaction[];
    availableBanks: string[];
    availableMonths: string[];
    uniqueCategories: string[];
    availableTags: string[];
    loading: boolean;
    refresh: () => void;
    deleteBank: (bankName: string) => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const userEmail = session?.user?.email;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [availableBanks, setAvailableBanks] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const loadTransactions = useCallback(async () => {
        if (!userEmail) {
            setTransactions([]);
            setAvailableBanks([]);
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
                console.log(`🔍 [TransactionsContext] Fetching page ${page} for user: ${userEmail}`);

                const { data, error } = await supabase
                    .from('transactions')
                    .select('id, date, description, amount, type, category, merchant_name, bank_name')
                    .eq('user_email', userEmail)
                    .order('date', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) {
                    console.error(`❌ [TransactionsContext] Error fetching transactions page ${page}:`, error);
                    console.error(`❌ [TransactionsContext] Error details:`, {
                        code: error.code,
                        message: error.message,
                        details: error.details,
                        hint: error.hint
                    });
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


            console.log(`🔍 [TransactionsContext] Fetched ${allData.length} transactions from database`);

            // Log a sample to see what we got
            if (allData.length > 0) {
                console.log('📋 [TransactionsContext] Sample raw data:', {
                    id: allData[0].id,
                    date: allData[0].date,
                    description: allData[0].description?.substring(0, 50),
                    amount: allData[0].amount,
                    category: allData[0].category,
                    merchant_name: allData[0].merchant_name
                });
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

            console.log(`✅ [TransactionsContext] Mapped ${mappedTransactions.length} transactions`);
            console.log('📋 [TransactionsContext] Sample mapped transaction:', {
                date: mappedTransactions[0]?.date,
                description: mappedTransactions[0]?.description?.substring(0, 50),
                amount: mappedTransactions[0]?.amount,
                category: mappedTransactions[0]?.category,
                merchantName: mappedTransactions[0]?.merchantName
            });

            setTransactions(mappedTransactions);

            // Extract available banks from the already fetched data
            const banks = Array.from(new Set(allData.map(row => row.bank_name).filter(Boolean))) as string[];
            console.log(`🏦 [TransactionsContext] Available banks:`, banks);
            setAvailableBanks(banks);

        } catch (err) {
            console.error('❌ [TransactionsContext] Unexpected error loading transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [userEmail, refreshTrigger]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const refresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const deleteBank = async (bankToDelete: string) => {
        if (!userEmail) return;

        try {
            let query = supabase.from('transactions').delete().eq('user_email', userEmail);

            if (bankToDelete !== 'all') {
                query = query.eq('bank_name', bankToDelete);
            }

            const { error } = await query;

            if (error) {
                console.error('Error deleting bank transactions:', error);
                throw error;
            } else {
                if (bankToDelete === 'all') {
                    // Also clear uploads table
                    const { error: uploadError } = await supabase.from('uploads').delete().eq('user_email', userEmail);
                    if (uploadError) console.error('Error deleting uploads:', uploadError);
                }
                refresh();
            }
        } catch (err) {
            console.error('Error in deleteBank:', err);
            alert('Failed to delete data. Please check console for details.');
        }
    };

    const availableMonths = useMemo(() => {
        const uniqueMonths = new Map<string, Date>();
        transactions.forEach(t => {
            if (t.date) {
                const date = parseDate(t.date);
                if (date && !isNaN(date.getTime())) {
                    const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                    if (!uniqueMonths.has(monthStr)) {
                        uniqueMonths.set(monthStr, date);
                    }
                }
            }
        });
        return Array.from(uniqueMonths.entries())
            .sort(([, dateA], [, dateB]) => dateB.getTime() - dateA.getTime())
            .map(([monthStr]) => monthStr);
    }, [transactions]);

    const uniqueCategories = useMemo(() => {
        const cats = new Set<string>();
        transactions.forEach(t => {
            if (t.category) cats.add(t.category);
        });
        return Array.from(cats).sort();
    }, [transactions]);

    const availableTags = useMemo(() => {
        return userEmail ? getAllTags(userEmail) : [];
    }, [userEmail, transactions]);

    const value = useMemo(() => ({
        transactions,
        availableBanks,
        availableMonths,
        uniqueCategories,
        availableTags,
        loading,
        refresh,
        deleteBank
    }), [transactions, availableBanks, availableMonths, uniqueCategories, availableTags, loading, refresh]);

    return (
        <TransactionsContext.Provider value={value}>
            {children}
        </TransactionsContext.Provider>
    );
}

export function useTransactionsContext() {
    const context = useContext(TransactionsContext);
    if (context === undefined) {
        throw new Error('useTransactionsContext must be used within a TransactionsProvider');
    }
    return context;
}
