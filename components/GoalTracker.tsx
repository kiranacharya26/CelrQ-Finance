'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, CheckCircle2, Target } from 'lucide-react';
import { Transaction } from '@/types';
import {
    Goal,
    getGoals,
    saveGoal,
    deleteGoal,
    updateGoal,
    calculateGoalProgress,
    getGoalRecommendations,
    useGoals,
} from '@/lib/goals';
import { GoalDialog } from '@/components/GoalDialog';

interface GoalTrackerProps {
    transactions: Transaction[];
}

export function GoalTracker({ transactions }: GoalTrackerProps) {
    const { data: session } = useSession();
    const { goals, refreshGoals } = useGoals();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | undefined>();

    const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
        if (!session?.user?.email) return;

        if (editingGoal) {
            // Update existing goal
            await updateGoal(session.user.email, editingGoal.id, goalData);
        } else {
            // Create new goal
            await saveGoal(session.user.email, goalData);
        }

        // Reload goals
        refreshGoals();
        setEditingGoal(undefined);
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (!session?.user?.email) return;
        if (!confirm('Are you sure you want to delete this goal?')) return;

        await deleteGoal(session.user.email, goalId);
        refreshGoals();
    };

    const handleEditGoal = (goal: Goal) => {
        setEditingGoal(goal);
        setDialogOpen(true);
    };

    const handleAddGoal = () => {
        setEditingGoal(undefined);
        setDialogOpen(true);
    };

    // Calculate progress for all goals
    const goalsWithProgress = useMemo(() => {
        return goals.map(goal => {
            const progress = calculateGoalProgress(goal, transactions);
            const recommendations = getGoalRecommendations(goal, progress, transactions);
            return { ...progress, recommendations };
        });
    }, [goals, transactions]);

    // Get progress bar color based on percentage
    const getProgressColor = (percentage: number): string => {
        if (percentage >= 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-yellow-500';
        if (percentage >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    if (!session) {
        return null;
    }

    return (
        <>
            <Card className="w-full overflow-hidden min-w-0">
                <CardHeader className="px-4 sm:px-6">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 min-w-0">
                            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 flex-shrink-0" />
                            <span className="truncate text-base sm:text-lg">Financial Goals</span>
                        </CardTitle>
                        <Button size="sm" onClick={handleAddGoal} className="flex-shrink-0">
                            <Plus className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Add Goal</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    {goalsWithProgress.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Target className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground mb-1">No goals yet</p>
                            <p className="text-xs text-muted-foreground mb-4 px-4">
                                Set a financial goal to start tracking your progress
                            </p>
                            <Button size="sm" onClick={handleAddGoal}>
                                <Plus className="h-4 w-4 mr-1" />
                                Create Your First Goal
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {goalsWithProgress.map((progress) => (
                                <div
                                    key={progress.goal.id}
                                    className="space-y-3 rounded-lg border p-3 sm:p-4 transition-colors hover:bg-muted/50 w-full"
                                >
                                    {/* Goal Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                            <span className="text-xl sm:text-2xl flex-shrink-0">{progress.goal.icon || '🎯'}</span>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-semibold text-sm sm:text-base truncate">{progress.goal.name}</h4>
                                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                    {progress.goal.type === 'savings' && 'Savings Goal'}
                                                    {progress.goal.type === 'spending-limit' && 'Spending Limit'}
                                                    {progress.goal.type === 'debt-payoff' && 'Debt Payoff'}
                                                    {progress.goal.type === 'custom' && 'Custom Goal'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEditGoal(progress.goal)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => handleDeleteGoal(progress.goal.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Amount Display */}
                                    <div className="flex items-baseline justify-between gap-2">
                                        <div className="flex items-baseline gap-1 sm:gap-2 min-w-0 flex-1">
                                            <span className="text-base sm:text-lg font-bold truncate">
                                                ₹{Math.round(progress.goal.currentAmount).toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-xs sm:text-sm text-muted-foreground truncate">
                                                / ₹{progress.goal.targetAmount.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-sm font-semibold">
                                                {Math.round(progress.progressPercentage)}%
                                            </span>
                                            {progress.progressPercentage >= 100 && (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                                            <div
                                                className={`h-full transition-all ${getProgressColor(progress.progressPercentage)}`}
                                                style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Status Message */}
                                    <p className="text-xs text-muted-foreground">{progress.statusMessage}</p>

                                    {/* Recommendations */}
                                    {progress.recommendations && progress.recommendations.length > 0 && (
                                        <div className="space-y-1 border-t pt-2">
                                            {progress.recommendations.map((rec, idx) => (
                                                <p key={idx} className="text-xs text-muted-foreground break-words">
                                                    💡 {rec}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <GoalDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSaveGoal}
                existingGoal={editingGoal}
            />
        </>
    );
}
