'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Budget {
    category: string;
    amount: number;
}

interface BudgetStoriesProps {
    budgets: Budget[];
    categorySpending: Record<string, number>;
    onAddBudget: () => void;
    onEditBudget: (budget: Budget) => void;
    onDeleteBudget: (category: string) => void;
}

export function BudgetStories({ budgets, categorySpending, onAddBudget, onEditBudget, onDeleteBudget }: BudgetStoriesProps) {
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

    const getStatusColor = (percentage: number) => {
        if (percentage >= 100) return '#ef4444'; // Red-500
        if (percentage >= 85) return '#f97316'; // Orange-500
        return '#22c55e'; // Green-500
    };

    return (
        <div className="w-full overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-start gap-4">
                {/* Add New Button */}
                <div className="flex flex-col items-center gap-2 min-w-[70px]">
                    <button
                        onClick={onAddBudget}
                        className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
                    >
                        <Plus className="h-6 w-6 text-muted-foreground" />
                    </button>
                    <span className="text-xs font-medium text-muted-foreground text-center w-full truncate">
                        Add New
                    </span>
                </div>

                {/* Budget Rings */}
                {budgets.map((budget) => {
                    const spent = categorySpending[budget.category] || 0;
                    const percentage = Math.min((spent / budget.amount) * 100, 100);
                    const color = getStatusColor(percentage);
                    const radius = 32;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (percentage / 100) * circumference;

                    return (
                        <div key={budget.category} className="flex flex-col items-center gap-2 min-w-[70px]">
                            <button
                                onClick={() => setSelectedBudget(budget)}
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

                                {/* Icon / Initial */}
                                <div className="w-[60px] h-[60px] rounded-full bg-background border flex items-center justify-center shadow-sm z-10">
                                    <span className="text-lg font-bold text-foreground/80">
                                        {budget.category.charAt(0)}
                                    </span>
                                </div>

                                {/* Alert Icon if over budget */}
                                {percentage >= 100 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-background z-20">
                                        <AlertCircle className="h-3 w-3" />
                                    </div>
                                )}
                            </button>
                            <span className="text-xs font-medium text-center w-full truncate max-w-[80px]">
                                {budget.category}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Details Dialog */}
            <Dialog open={!!selectedBudget} onOpenChange={(open) => !open && setSelectedBudget(null)}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedBudget?.category} Budget
                        </DialogTitle>
                    </DialogHeader>
                    {selectedBudget && (
                        <div className="space-y-6 py-4">
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className="text-4xl font-bold mb-1">
                                    {Math.round((categorySpending[selectedBudget.category] || 0) / selectedBudget.amount * 100)}%
                                </div>
                                <p className="text-muted-foreground text-sm">used of monthly limit</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Spent: <strong>₹{(categorySpending[selectedBudget.category] || 0).toLocaleString()}</strong></span>
                                    <span>Limit: <strong>₹{selectedBudget.amount.toLocaleString()}</strong></span>
                                </div>
                                <Progress
                                    value={Math.min(((categorySpending[selectedBudget.category] || 0) / selectedBudget.amount) * 100, 100)}
                                    className={`h-3 ${(categorySpending[selectedBudget.category] || 0) > selectedBudget.amount ? "bg-red-100" : ""
                                        }`}
                                />
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Remaining</span>
                                    <span className="font-semibold">
                                        ₹{Math.max(selectedBudget.amount - (categorySpending[selectedBudget.category] || 0), 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={`font-medium ${(categorySpending[selectedBudget.category] || 0) > selectedBudget.amount ? "text-red-600" : "text-green-600"
                                        }`}>
                                        {(categorySpending[selectedBudget.category] || 0) > selectedBudget.amount ? "Over Budget" : "On Track"}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 pt-2 border-t">
                                <h4 className="text-sm font-medium text-muted-foreground">Manage Budget</h4>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            onEditBudget(selectedBudget);
                                            setSelectedBudget(null);
                                        }}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => {
                                            onDeleteBudget(selectedBudget.category);
                                            setSelectedBudget(null);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
