import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserStorage } from '@/lib/storage';

export interface Budget {
    id?: string;
    category: string;
    amount: number;
}

// Save budget
export async function saveBudget(userEmail: string, budget: Omit<Budget, 'id'>): Promise<Budget | null> {
    try {
        const response = await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budget)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error saving budget:', error);
            return null;
        }

        const { budget: savedBudget } = await response.json();
        return savedBudget;
    } catch (error) {
        console.error('Error saving budget:', error);
        return null;
    }
}

// Get all budgets
export async function getBudgets(userEmail: string): Promise<Budget[]> {
    if (!userEmail) return [];

    try {
        const response = await fetch('/api/budgets');

        if (!response.ok) {
            console.error('Error fetching budgets');
            return [];
        }

        const { budgets } = await response.json();
        return budgets || [];
    } catch (error) {
        console.error('Error fetching budgets:', error);
        return [];
    }
}

// Delete budget
export async function deleteBudget(userEmail: string, category: string): Promise<void> {
    try {
        const response = await fetch(`/api/budgets?category=${encodeURIComponent(category)}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            console.error('Error deleting budget');
        }
    } catch (error) {
        console.error('Error deleting budget:', error);
    }
}

// Hook to manage budgets
export function useBudgets() {
    const { data: session } = useSession();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBudgets = useCallback(async () => {
        if (!session?.user?.email) {
            setLoading(false);
            return;
        }

        const userEmail = session.user.email;

        // 1. Check if we need to migrate from LocalStorage
        const localBudgets = UserStorage.getData(userEmail, 'budgets', [] as Budget[]);

        // 2. Fetch from DB
        const dbBudgets = await getBudgets(userEmail);

        // 3. Migration logic: If DB is empty but LocalStorage has data, migrate it
        if (dbBudgets.length === 0 && localBudgets.length > 0) {
            console.log('🚚 Migrating budgets from LocalStorage to Supabase...');
            for (const budget of localBudgets) {
                await saveBudget(userEmail, {
                    category: budget.category,
                    amount: budget.amount
                });
            }
            // Fetch again after migration
            const migratedBudgets = await getBudgets(userEmail);
            setBudgets(migratedBudgets);

            // Optional: Clear local storage after migration? 
            // Better to keep it for a while as backup or just leave it.
            // UserStorage.removeData(userEmail, 'budgets');
        } else {
            setBudgets(dbBudgets);
        }

        setLoading(false);
    }, [session?.user?.email]);

    useEffect(() => {
        loadBudgets();
    }, [loadBudgets]);

    const refreshBudgets = () => {
        loadBudgets();
    };

    return { budgets, loading, refreshBudgets };
}
