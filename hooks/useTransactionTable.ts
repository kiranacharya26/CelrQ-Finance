import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { UserStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { detectRecurringTransactions } from '@/lib/recurring';
import { Transaction } from '@/types';

export interface UseTransactionTableParams {
    transactions: Transaction[];
    onCategoryChange?: (index: number, newCategory: string) => void;
    uniqueCategories?: string[];
}

export interface UseTransactionTableReturn {
    session: any;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    localTransactions: Transaction[];
    setLocalTransactions: (txs: Transaction[]) => void;
    customCategories: string[];
    allCategories: string[];
    selectedIds: Set<string>;
    toggleSelectAll: () => void;
    toggleSelectRow: (id: string) => void;
    handleCategoryChange: (globalIndex: number, newCategory: string, updateSimilar?: boolean) => Promise<{ updated: number } | undefined>;
    findSimilarTransactions: (transaction: Transaction) => Transaction[];
    itemsPerPage: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    currentTransactions: Transaction[];
    recurringIndices: Set<number>;
    isAddingCategory: boolean;
    setIsAddingCategory: (v: boolean) => void;
    newCategoryName: string;
    setNewCategoryName: (v: string) => void;
    handleAddCustomCategory: () => void;
}

export function useTransactionTable({
    transactions,
    onCategoryChange,
    uniqueCategories = [],
}: UseTransactionTableParams): UseTransactionTableReturn {
    const { data: session } = useSession();
    const [currentPage, setCurrentPage] = useState(1);
    const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const itemsPerPage = 10;

    // Sync when prop changes
    useEffect(() => {
        setLocalTransactions(transactions);
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [transactions]);

    // Load custom categories from storage
    useEffect(() => {
        if (session?.user?.email) {
            const saved = UserStorage.getData(session.user.email, 'customCategories', []);
            setCustomCategories(saved);
        }
    }, [session]);

    const allCategories = useMemo(() => {
        const DEFAULT_CATEGORIES = [
            'Healthcare',
            'Groceries',
            'Restaurants & Dining',
            'Fuel',
            'Ride Services',
            'Public Transport',
            'Bills',
            'Telecom',
            'Online Shopping',
            'Retail & Stores',
            'Streaming Services',
            'Events & Recreation',
            'Housing',
            'Education',
            'Income',
            'Insurance',
            'Investments',
            'Personal Care',
            'Other',
        ];
        return [...DEFAULT_CATEGORIES, ...customCategories].sort();
    }, [customCategories]);

    // Recurring detection
    const recurringIndices = useMemo(() => detectRecurringTransactions(transactions), [transactions]);

    // Pagination helpers
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = localTransactions.slice(startIndex, endIndex);

    const toggleSelectAll = () => {
        if (selectedIds.size === currentTransactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(currentTransactions.map(t => t.id)));
        }
    };

    const toggleSelectRow = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleAddCustomCategory = () => {
        if (newCategoryName.trim() && !allCategories.includes(newCategoryName.trim()) && session?.user?.email) {
            const updated = [...customCategories, newCategoryName.trim()];
            setCustomCategories(updated);
            UserStorage.saveData(session.user.email, 'customCategories', updated);
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    // Helper to extract merchant identifier from transaction description
    const extractMerchantPattern = (description: string): string | null => {
        if (!description) return null;

        const desc = description.toLowerCase();

        // For UPI transactions, extract the merchant name
        if (desc.includes('upi')) {
            // Pattern: UPI-MERCHANT-xxx or UPI/MERCHANT/xxx
            const parts = description.split(/[-/]/);
            if (parts.length >= 2) {
                // Get the second part (usually merchant name)
                const merchant = parts[1].trim();
                // Remove common suffixes and numbers
                return merchant
                    .replace(/\d+/g, '') // Remove numbers
                    .replace(/@.*/g, '') // Remove everything after @
                    .replace(/\s+/g, '') // Remove spaces
                    .toLowerCase()
                    .slice(0, 15); // Limit length
            }
        }

        // For other transactions, try to extract key words (first 2-3 meaningful words)
        const words = desc
            .replace(/[^a-z0-9\s]/g, ' ') // Remove special chars
            .split(/\s+/)
            .filter(w => w.length > 3); // Only meaningful words

        if (words.length > 0) {
            return words.slice(0, 2).join(' ');
        }

        return null;
    };

    // Find similar transactions based on merchant pattern
    const findSimilarTransactions = (transaction: Transaction): Transaction[] => {
        const pattern = extractMerchantPattern(transaction.description || '');
        if (!pattern) return [];

        return localTransactions.filter(t => {
            if (t.id === transaction.id) return false; // Exclude the current transaction
            const tPattern = extractMerchantPattern(t.description || '');
            return tPattern === pattern;
        });
    };

    const handleCategoryChange = async (
        globalIndex: number,
        newCategory: string,
        updateSimilar: boolean = false
    ) => {
        if (!session?.user?.email) return;
        const transactionToUpdate = localTransactions[globalIndex];
        const isBulk = selectedIds.has(transactionToUpdate.id) && selectedIds.size > 1;

        let idsToUpdate: string[];

        if (updateSimilar) {
            // Find all similar transactions
            const similar = findSimilarTransactions(transactionToUpdate);
            idsToUpdate = [transactionToUpdate.id, ...similar.map(t => t.id)];
        } else if (isBulk) {
            idsToUpdate = Array.from(selectedIds);
        } else {
            idsToUpdate = [transactionToUpdate.id];
        }

        // Optimistic UI
        const updatedLocal = [...localTransactions];
        idsToUpdate.forEach(id => {
            const idx = updatedLocal.findIndex(t => t.id === id);
            if (idx !== -1) updatedLocal[idx] = { ...updatedLocal[idx], category: newCategory };
        });
        setLocalTransactions(updatedLocal);

        try {
            const { error } = await supabase.from('transactions').update({ category: newCategory }).in('id', idsToUpdate);
            if (error) throw error;
            if (onCategoryChange) onCategoryChange(globalIndex, newCategory);

            // Return count for UI feedback
            return { updated: idsToUpdate.length };
        } catch (e) {
            console.error('Error updating category:', e);
            setLocalTransactions(localTransactions); // revert
            throw e;
        }
    };

    return {
        session,
        currentPage,
        setCurrentPage,
        localTransactions,
        setLocalTransactions,
        customCategories,
        allCategories,
        selectedIds,
        toggleSelectAll,
        toggleSelectRow,
        handleCategoryChange,
        findSimilarTransactions,
        itemsPerPage,
        totalPages,
        startIndex,
        endIndex,
        currentTransactions,
        recurringIndices,
        isAddingCategory,
        setIsAddingCategory,
        newCategoryName,
        setNewCategoryName,
        handleAddCustomCategory,
    };
}
