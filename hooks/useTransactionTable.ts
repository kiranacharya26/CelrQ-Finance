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
    handleCategoryChange: (globalIndex: number, newCategory: string) => Promise<void>;
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

    const handleCategoryChange = async (globalIndex: number, newCategory: string) => {
        if (!session?.user?.email) return;
        const transactionToUpdate = localTransactions[globalIndex];
        const isBulk = selectedIds.has(transactionToUpdate.id) && selectedIds.size > 1;
        const idsToUpdate = isBulk ? Array.from(selectedIds) : [transactionToUpdate.id];

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
        } catch (e) {
            console.error('Error updating category:', e);
            setLocalTransactions(localTransactions); // revert
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
