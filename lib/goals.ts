import { Transaction } from '@/types';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type GoalType = 'savings' | 'spending-limit' | 'debt-payoff' | 'custom';

export interface Goal {
    id: string;
    name: string;
    type: GoalType;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string;
    category?: string;
    icon?: string;
    createdAt: string;
    completedAt?: string;
}

export interface GoalProgress {
    goal: Goal;
    progressPercentage: number;
    amountRemaining: number;
    daysRemaining?: number;
    weeklyTarget?: number;
    monthlyTarget?: number;
    onTrack: boolean;
    projectedCompletion?: string;
    statusMessage: string;
}

// Helper to parse amount from transaction
const parseAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val || val === '') return 0;
    const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(parsed) ? 0 : parsed;
};

// Calculate current savings from transactions
function calculateCurrentSavings(transactions: Transaction[]): number {
    let income = 0;
    let expenses = 0;

    transactions.forEach(t => {
        const deposit = parseAmount(t['Deposit Amt.'] || t.deposit || t.credit || 0);
        const withdrawal = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);

        income += deposit;
        expenses += withdrawal;
    });

    return income - expenses;
}

// Calculate spending in a category
function calculateCategorySpending(transactions: Transaction[], category: string): number {
    return transactions
        .filter(t => t.category === category)
        .reduce((sum, t) => {
            const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
            return sum + amount;
        }, 0);
}

// Calculate goal progress
export function calculateGoalProgress(
    goal: Goal,
    transactions: Transaction[]
): GoalProgress {
    let currentAmount = goal.currentAmount;

    // Auto-calculate current amount based on goal type
    if (goal.type === 'savings') {
        const savings = calculateCurrentSavings(transactions);
        currentAmount = Math.max(goal.currentAmount, savings);
    } else if (goal.type === 'spending-limit' && goal.category) {
        const categorySpending = calculateCategorySpending(transactions, goal.category);
        currentAmount = categorySpending;
    }

    const progressPercentage = Math.min((currentAmount / goal.targetAmount) * 100, 100);
    const amountRemaining = Math.max(goal.targetAmount - currentAmount, 0);

    let daysRemaining: number | undefined;
    let weeklyTarget: number | undefined;
    let monthlyTarget: number | undefined;
    let onTrack = true;
    let projectedCompletion: string | undefined;
    let statusMessage = '';

    if (goal.targetDate) {
        const today = new Date();
        const target = new Date(goal.targetDate);
        daysRemaining = Math.max(Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);

        if (daysRemaining > 0) {
            // weeklyTarget = amountRemaining / (daysRemaining / 7); // Removed
            monthlyTarget = amountRemaining / (daysRemaining / 30);

            // Determine if on track
            const expectedProgress = ((new Date().getTime() - new Date(goal.createdAt).getTime()) /
                (target.getTime() - new Date(goal.createdAt).getTime())) * 100;
            onTrack = progressPercentage >= expectedProgress * 0.9; // Within 10% is "on track"
        }
    }

    // Generate status message
    if (progressPercentage >= 100) {
        statusMessage = '🎉 Goal achieved!';
    } else if (progressPercentage >= 75) {
        statusMessage = `Almost there! ₹${amountRemaining.toLocaleString('en-IN')} to go`;
    } else if (progressPercentage >= 50) {
        statusMessage = `Halfway there! Keep going`;
    } else if (progressPercentage >= 25) {
        statusMessage = `Making progress`;
    } else {
        statusMessage = `₹${amountRemaining.toLocaleString('en-IN')} remaining`;
    }

    if (daysRemaining !== undefined && daysRemaining > 0 && monthlyTarget) {
        statusMessage += ` • Save ₹${Math.round(monthlyTarget).toLocaleString('en-IN')}/month`;
    }

    return {
        goal,
        progressPercentage,
        amountRemaining,
        daysRemaining,
        weeklyTarget, // Kept for interface compatibility but unused
        monthlyTarget,
        onTrack,
        projectedCompletion,
        statusMessage,
    };
}

// Get goal recommendations
export function getGoalRecommendations(
    goal: Goal,
    progress: GoalProgress,
    transactions: Transaction[]
): string[] {
    const recommendations: string[] = [];

    if (progress.progressPercentage >= 100) {
        recommendations.push('🎉 Congratulations! Consider setting a new goal');
        return recommendations;
    }

    // Savings goal recommendations
    if (goal.type === 'savings' && progress.monthlyTarget) {
        const monthlyTarget = Math.round(progress.monthlyTarget);

        // Suggest reducing high spending categories
        const categorySpending: Record<string, number> = {};
        transactions.forEach(t => {
            if (t.category) {
                const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
                categorySpending[t.category] = (categorySpending[t.category] || 0) + amount;
            }
        });

        const topCategories = Object.entries(categorySpending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (topCategories.length > 0 && topCategories[0][1] > monthlyTarget) {
            const category = topCategories[0][0];
            const reduction = Math.round(monthlyTarget * 0.2);
            recommendations.push(
                `Reduce ${category} by ₹${reduction.toLocaleString('en-IN')}/month to reach goal faster`
            );
        }
    }

    // Spending limit recommendations
    if (goal.type === 'spending-limit') {
        const percentage = progress.progressPercentage;
        if (percentage > 80 && progress.daysRemaining && progress.daysRemaining > 5) {
            recommendations.push(`⚠️ You've used ${Math.round(percentage)}% of your budget with ${progress.daysRemaining} days left`);
        } else if (percentage < 50 && progress.daysRemaining && progress.daysRemaining < 10) {
            recommendations.push(`✅ Great job! You're well under budget`);
        }
    }

    // On track status
    if (!progress.onTrack && progress.monthlyTarget) {
        recommendations.push(
            `You're behind schedule. Increase monthly savings to ₹${Math.round(progress.monthlyTarget * 1.2).toLocaleString('en-IN')}`
        );
    } else if (progress.onTrack && progress.progressPercentage > 50) {
        recommendations.push(`You're on track! Keep up the good work`);
    }

    return recommendations;
}

// --- Supabase Async Functions ---

// Save goal
export async function saveGoal(userEmail: string, goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal | null> {
    try {
        const response = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goal)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error saving goal:', error);
            return null;
        }

        const { goal: savedGoal } = await response.json();
        return mapGoal(savedGoal);
    } catch (error) {
        console.error('Error saving goal:', error);
        return null;
    }
}

// Get all goals
export async function getGoals(userEmail: string, includeCompleted = true): Promise<Goal[]> {
    if (!userEmail) {
        console.warn('getGoals called with empty userEmail');
        return [];
    }

    try {
        const response = await fetch('/api/goals');

        if (!response.ok) {
            console.error('Error fetching goals');
            return [];
        }

        const { goals } = await response.json();
        const mappedGoals = (goals || []).map(mapGoal);

        if (!includeCompleted) {
            return mappedGoals.filter((g: Goal) => !g.completedAt);
        }

        return mappedGoals;
    } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
}

// Update goal
export async function updateGoal(userEmail: string, goalId: string, updates: Partial<Goal>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.targetAmount) dbUpdates.target_amount = updates.targetAmount;
    if (updates.currentAmount) dbUpdates.current_amount = updates.currentAmount;
    if (updates.targetDate) dbUpdates.deadline = updates.targetDate;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.icon) dbUpdates.icon = updates.icon;
    if (updates.completedAt) dbUpdates.completed_at = updates.completedAt;

    const { error } = await supabase
        .from('goals')
        .update(dbUpdates)
        .eq('id', goalId)
        .eq('user_email', userEmail);

    if (error) {
        console.error('Error updating goal:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
    }
}

// Delete goal
export async function deleteGoal(userEmail: string, goalId: string): Promise<void> {
    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_email', userEmail);

    if (error) {
        console.error('Error deleting goal:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
    }
}

// Mark goal as complete
export async function markGoalComplete(userEmail: string, goalId: string): Promise<void> {
    await updateGoal(userEmail, goalId, {
        completedAt: new Date().toISOString(),
    });
}

// Helper to map Supabase row to Goal
function mapGoal(row: any): Goal {
    return {
        id: row.id,
        name: row.name,
        type: row.type || 'savings',
        targetAmount: row.target_amount,
        currentAmount: row.current_amount,
        targetDate: row.deadline,
        category: row.category, // Will be undefined if column missing
        icon: row.icon,
        createdAt: row.created_at,
        completedAt: row.completed_at
    };
}

// Hook to manage goals
export function useGoals() {
    const { data: session } = useSession();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    const loadGoals = useCallback(async () => {
        if (session?.user?.email) {
            const userGoals = await getGoals(session.user.email);
            setGoals(userGoals);
        }
        setLoading(false);
    }, [session?.user?.email]);

    useEffect(() => {
        loadGoals();
    }, [loadGoals]);

    const refreshGoals = () => {
        loadGoals();
    };

    return { goals, loading, refreshGoals };
}
