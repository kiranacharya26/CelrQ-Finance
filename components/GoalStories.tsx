'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, Target, Edit, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Goal } from '@/lib/goals';

interface GoalWithProgress {
    goal: Goal;
    progressPercentage: number;
    amountRemaining: number;
    statusMessage: string;
    recommendations: string[];
}

interface GoalStoriesProps {
    goals: GoalWithProgress[];
    onAddGoal: () => void;
    onEditGoal: (goal: Goal) => void;
    onDeleteGoal: (goalId: string) => void;
}

export function GoalStories({ goals, onAddGoal, onEditGoal, onDeleteGoal }: GoalStoriesProps) {
    const [selectedGoal, setSelectedGoal] = useState<GoalWithProgress | null>(null);

    const getStatusColor = (percentage: number) => {
        if (percentage >= 100) return '#22c55e'; // Green-500
        if (percentage >= 75) return '#3b82f6'; // Blue-500
        if (percentage >= 50) return '#eab308'; // Yellow-500
        if (percentage >= 25) return '#f97316'; // Orange-500
        return '#ef4444'; // Red-500
    };

    return (
        <div className="w-full overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-start gap-4">
                {/* Add New Button */}
                <div className="flex flex-col items-center gap-2 min-w-[70px]">
                    <button
                        onClick={onAddGoal}
                        className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
                    >
                        <Plus className="h-6 w-6 text-muted-foreground" />
                    </button>
                    <span className="text-xs font-medium text-muted-foreground text-center w-full truncate">
                        Add New
                    </span>
                </div>

                {/* Goal Rings */}
                {goals.map((item) => {
                    const percentage = Math.min(item.progressPercentage, 100);
                    const color = getStatusColor(percentage);
                    const radius = 32;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (percentage / 100) * circumference;

                    return (
                        <div key={item.goal.id} className="flex flex-col items-center gap-2 min-w-[70px]">
                            <button
                                onClick={() => setSelectedGoal(item)}
                                className="relative w-[70px] h-[70px] rounded-full flex items-center justify-center transition-transform hover:scale-105"
                            >
                                {/* Background Circle */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle
                                        cx="35"
                                        cy="35"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="transparent"
                                        className="text-muted/20"
                                    />
                                    {/* Progress Circle */}
                                    <circle
                                        cx="35"
                                        cy="35"
                                        r={radius}
                                        stroke={color}
                                        strokeWidth="3"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-500 ease-out"
                                    />
                                </svg>

                                {/* Icon */}
                                <div className="w-[60px] h-[60px] rounded-full bg-background border flex items-center justify-center shadow-sm z-10 overflow-hidden">
                                    <span className="text-2xl">{item.goal.icon || '🎯'}</span>
                                </div>

                                {/* Success Icon if complete */}
                                {percentage >= 100 && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-background z-20">
                                        <CheckCircle2 className="h-3 w-3" />
                                    </div>
                                )}
                            </button>
                            <span className="text-xs font-medium text-center w-full truncate max-w-[80px]">
                                {item.goal.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Details Dialog */}
            <Dialog open={!!selectedGoal} onOpenChange={(open) => !open && setSelectedGoal(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">{selectedGoal?.goal.icon}</span>
                            {selectedGoal?.goal.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedGoal && (
                        <div className="space-y-6 py-4">
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className="text-4xl font-bold mb-1">
                                    {Math.round(selectedGoal.progressPercentage)}%
                                </div>
                                <p className="text-muted-foreground text-sm">completed</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Saved: <strong>₹{Math.round(selectedGoal.goal.currentAmount).toLocaleString('en-IN')}</strong></span>
                                    <span>Target: <strong>₹{selectedGoal.goal.targetAmount.toLocaleString('en-IN')}</strong></span>
                                </div>
                                <Progress
                                    value={Math.min(selectedGoal.progressPercentage, 100)}
                                    className="h-3"
                                // We can't easily set custom color on shadcn Progress without class override or custom style
                                // But we can use the indicator class if we had access to it, or just use default
                                />
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Remaining</span>
                                    <span className="font-semibold">
                                        ₹{Math.max(selectedGoal.goal.targetAmount - selectedGoal.goal.currentAmount, 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className="font-medium text-blue-600">
                                        {selectedGoal.statusMessage}
                                    </span>
                                </div>
                            </div>

                            {/* Recommendations */}
                            {selectedGoal.recommendations && selectedGoal.recommendations.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Recommendations</h4>
                                    <div className="space-y-1">
                                        {selectedGoal.recommendations.map((rec, idx) => (
                                            <p key={idx} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                                💡 {rec}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        onEditGoal(selectedGoal.goal);
                                        setSelectedGoal(null);
                                    }}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Goal
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                        if (confirm('Delete this goal?')) {
                                            onDeleteGoal(selectedGoal.goal.id);
                                            setSelectedGoal(null);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
