'use client';

import { useState, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, CheckCircle2, Target, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { GoalStories } from '@/components/GoalStories';

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

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 350; // Approximate card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!session) {
        return null;
    }

    return (
        <>
            <Card className="w-full overflow-hidden min-w-0 border-none shadow-none sm:border sm:shadow-sm">
                <CardHeader className="px-4 sm:px-6 flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 min-w-0">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 flex-shrink-0" />
                        <span className="truncate text-base sm:text-lg">Financial Goals</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1 mr-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('left')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('right')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button size="sm" onClick={handleAddGoal} className="flex-shrink-0 hidden sm:flex">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Goal
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                    {goalsWithProgress.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
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
                        <>
                            {/* Mobile View: Stories */}
                            <div className="block sm:hidden mb-2">
                                <GoalStories
                                    goals={goalsWithProgress}
                                    onAddGoal={handleAddGoal}
                                    onEditGoal={handleEditGoal}
                                    onDeleteGoal={handleDeleteGoal}
                                />
                            </div>

                            {/* Desktop View: Carousel / Grid */}
                            <div
                                ref={scrollContainerRef}
                                className="hidden sm:flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide"
                            >
                                {goalsWithProgress.map((progress) => (
                                    <div
                                        key={progress.goal.id}
                                        className="space-y-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 min-w-[300px] max-w-[350px] snap-center flex-shrink-0 bg-card"
                                    >
                                        {/* Goal Header */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <span className="text-2xl flex-shrink-0">{progress.goal.icon || '🎯'}</span>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-semibold text-base truncate">{progress.goal.name}</h4>
                                                    <p className="text-sm text-muted-foreground truncate">
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
                                            <div className="flex items-baseline gap-2 min-w-0 flex-1">
                                                <span className="text-lg font-bold truncate">
                                                    ₹{Math.round(progress.goal.currentAmount).toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-sm text-muted-foreground truncate">
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
                                        <p className="text-xs text-muted-foreground h-4 truncate">{progress.statusMessage}</p>

                                        {/* Recommendations */}
                                        {progress.recommendations && progress.recommendations.length > 0 && (
                                            <div className="space-y-1 border-t pt-2 mt-2">
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    💡 {progress.recommendations[0]}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {/* Add New Card for Desktop Carousel */}
                                <button
                                    onClick={handleAddGoal}
                                    className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-4 transition-colors hover:bg-muted/50 min-w-[150px] snap-center flex-shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <span className="font-medium">Add New Goal</span>
                                </button>
                            </div>
                        </>
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
