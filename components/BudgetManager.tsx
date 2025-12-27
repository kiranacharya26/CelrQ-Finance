'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Transaction } from '@/types';
import { Plus, AlertCircle, TrendingUp, CheckCircle2, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBudgets, saveBudget, deleteBudget, Budget } from '@/lib/budgets';
import { useSession } from 'next-auth/react';
import { BudgetStories } from './BudgetStories';

interface BudgetManagerProps {
    transactions: Transaction[];
    currentMonth: string; // "November 2025"
}

export function BudgetManager({ transactions, currentMonth }: BudgetManagerProps) {
    const { data: session } = useSession();
    const { budgets, loading, refreshBudgets } = useBudgets();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newBudget, setNewBudget] = useState<Omit<Budget, 'id'>>({ category: '', amount: 0 });
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
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

    const handleAddBudget = async () => {
        if (session?.user?.email && newBudget.category && newBudget.amount > 0) {
            await saveBudget(session.user.email, newBudget);
            refreshBudgets();
            setIsDialogOpen(false);
            setNewBudget({ category: '', amount: 0 });
            setEditingBudget(null);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; category: string | null }>({
        isOpen: false,
        category: null
    });

    const handleDeleteBudget = async (category: string) => {
        if (session?.user?.email) {
            await deleteBudget(session.user.email, category);
            refreshBudgets();
            setDeleteConfirmation({ isOpen: false, category: null });
        }
    };

    const confirmDelete = (category: string) => {
        setDeleteConfirmation({ isOpen: true, category });
    };

    const handleEditBudget = (budget: Budget) => {
        setNewBudget(budget);
        setEditingBudget(budget);
        setIsDialogOpen(true);
    };

    // Calculate spending per category for the current month
    const categorySpending = useMemo(() => {
        const spending: Record<string, number> = {};

        transactions.forEach(t => {
            if (!t.date) return;

            const tDate = new Date(t.date);
            if (isNaN(tDate.getTime())) return;

            const tMonth = tDate.toLocaleString('default', { month: 'long', year: 'numeric' });

            if (tMonth === currentMonth && t.type === 'expense') {
                const cat = t.category || 'Other';
                const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0);
                spending[cat] = (spending[cat] || 0) + amount;
            }
        });
        return spending;
    }, [transactions, currentMonth]);

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = Object.entries(categorySpending)
        .filter(([cat]) => budgets.some(b => b.category === cat))
        .reduce((sum, [, amt]) => sum + amt, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Spending Baselines</h2>
                    <p className="text-muted-foreground">Understand and notice your spending patterns for {currentMonth}</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setNewBudget({ category: '', amount: 0 });
                        setEditingBudget(null);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Baseline
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingBudget ? 'Edit Baseline' : 'Set Category Baseline'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={newBudget.category}
                                    onValueChange={(val) => setNewBudget({ ...newBudget, category: val })}
                                    disabled={!!editingBudget}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from(new Set(transactions.map(t => t.category).filter((c): c is string => !!c))).sort().map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Expected Monthly Range (₹)</Label>
                                <Input
                                    type="number"
                                    value={newBudget.amount || ''}
                                    onChange={(e) => setNewBudget({ ...newBudget, amount: Number(e.target.value) })}
                                />
                            </div>
                            <Button onClick={handleAddBudget} className="w-full">
                                {editingBudget ? 'Update Baseline' : 'Save Baseline'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteConfirmation.isOpen} onOpenChange={(open) => setDeleteConfirmation({ ...deleteConfirmation, isOpen: open })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Baseline</DialogTitle>
                            <CardDescription>
                                Are you sure you want to delete the baseline for {deleteConfirmation.category}? This action cannot be undone.
                            </CardDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={() => setDeleteConfirmation({ isOpen: false, category: null })}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={() => deleteConfirmation.category && handleDeleteBudget(deleteConfirmation.category)}>
                                Delete
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Overall Progress - Only show if budgets exist */}
            {budgets.length > 0 && (
                <Card className="border-none shadow-none sm:border sm:shadow-sm">
                    <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                            <span>Overall Pattern Progress</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <div className="flex items-baseline justify-between gap-2 mb-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold">₹{totalSpent.toLocaleString('en-IN')}</span>
                                <span className="text-sm text-muted-foreground">spent</span>
                            </div>
                            <span className="text-sm text-muted-foreground">of ₹{totalBudget.toLocaleString('en-IN')}</span>
                        </div>
                        <Progress value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0} className="h-2" />
                        <div className="mt-2 text-xs text-muted-foreground text-right">
                            {totalBudget > 0 && `${Math.round((totalSpent / totalBudget) * 100)}% of total baseline used`}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mobile Stories View */}
            <div className="block md:hidden -mx-4 px-4 mb-2">
                <BudgetStories
                    budgets={budgets}
                    categorySpending={categorySpending}
                    onAddBudget={() => setIsDialogOpen(true)}
                    onEditBudget={handleEditBudget}
                    onDeleteBudget={confirmDelete}
                />
            </div>

            {/* Desktop Carousel View */}
            <div className="hidden md:block relative group px-4">
                {/* Scroll Buttons */}
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                    onClick={() => scroll('left')}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                    onClick={() => scroll('right')}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <div
                    ref={scrollContainerRef}
                    id="budget-carousel"
                    className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide px-1"
                >
                    {budgets.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <TrendingUp className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">No spending baselines set</p>
                            <p className="text-xs text-muted-foreground mb-4">
                                Set a baseline for categories to notice your spending patterns
                            </p>
                            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Set First Baseline
                            </Button>
                        </div>
                    ) : (
                        budgets.map(budget => {
                            const spent = categorySpending[budget.category] || 0;
                            const percentage = Math.min((spent / budget.amount) * 100, 100);
                            const isOverBudget = spent > budget.amount;
                            const isNearLimit = percentage > 85;

                            return (
                                <Card key={budget.category} className={`min-w-[300px] max-w-[350px] snap-center flex-shrink-0 ${isOverBudget ? "border-red-500/50 bg-red-500/5" : ""}`}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-base font-semibold truncate max-w-[150px]">{budget.category}</CardTitle>
                                                {isOverBudget ? (
                                                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                ) : (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500/50 flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleEditBudget(budget)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => confirmDelete(budget.category)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription>
                                            ₹{spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Progress
                                            value={percentage}
                                            className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`}
                                        />
                                        <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                                            <span>{percentage.toFixed(0)}% used</span>
                                            <span>₹{Math.max(budget.amount - spent, 0).toLocaleString('en-IN')} remaining</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
