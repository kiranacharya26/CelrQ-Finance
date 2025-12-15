'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Transaction } from '@/types';
import { Plus, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { UserStorage } from '@/lib/storage';
import { useSession } from 'next-auth/react';

interface Budget {
    category: string;
    amount: number;
}

interface BudgetManagerProps {
    transactions: Transaction[];
    currentMonth: string; // "November 2025"
}

export function BudgetManager({ transactions, currentMonth }: BudgetManagerProps) {
    const { data: session } = useSession();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newBudget, setNewBudget] = useState<Budget>({ category: '', amount: 0 });

    // Load budgets from storage
    useEffect(() => {
        if (session?.user?.email) {
            const savedBudgets = UserStorage.getData(session.user.email, 'budgets', []);
            setBudgets(savedBudgets);
        }
    }, [session]);

    // Save budgets
    const saveBudgets = (updatedBudgets: Budget[]) => {
        if (session?.user?.email) {
            UserStorage.saveData(session.user.email, 'budgets', updatedBudgets);
            setBudgets(updatedBudgets);
        }
    };

    const handleAddBudget = () => {
        if (newBudget.category && newBudget.amount > 0) {
            const existingIndex = budgets.findIndex(b => b.category === newBudget.category);
            let updated;
            if (existingIndex >= 0) {
                updated = [...budgets];
                updated[existingIndex] = newBudget;
            } else {
                updated = [...budgets, newBudget];
            }
            saveBudgets(updated);
            setIsDialogOpen(false);
            setNewBudget({ category: '', amount: 0 });
        }
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
                const cat = t.category || 'Uncategorized';
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
                    <h2 className="text-2xl font-bold tracking-tight">Monthly Budgets</h2>
                    <p className="text-muted-foreground">Plan and track your spending for {currentMonth}</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Set Budget
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Set Category Budget</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={newBudget.category}
                                    onValueChange={(val) => setNewBudget({ ...newBudget, category: val })}
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
                                <Label>Monthly Limit (₹)</Label>
                                <Input
                                    type="number"
                                    value={newBudget.amount || ''}
                                    onChange={(e) => setNewBudget({ ...newBudget, amount: Number(e.target.value) })}
                                />
                            </div>
                            <Button onClick={handleAddBudget} className="w-full">Save Budget</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Overall Progress */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Budget Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between mb-2 text-sm">
                        <span>₹{totalSpent.toLocaleString('en-IN')} spent</span>
                        <span className="text-muted-foreground">of ₹{totalBudget.toLocaleString('en-IN')} limit</span>
                    </div>
                    <Progress value={Math.min((totalSpent / totalBudget) * 100, 100)} className="h-2" />
                </CardContent>
            </Card>

            {/* Category Cards Grid */}
            <div className="grid gap-4 grid-cols-1">
                {budgets.map(budget => {
                    const spent = categorySpending[budget.category] || 0;
                    const percentage = Math.min((spent / budget.amount) * 100, 100);
                    const isOverBudget = spent > budget.amount;
                    const isNearLimit = percentage > 85;

                    return (
                        <Card key={budget.category} className={isOverBudget ? "border-red-500/50 bg-red-500/5" : ""}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base font-semibold">{budget.category}</CardTitle>
                                    {isOverBudget ? (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <CheckCircle2 className="h-5 w-5 text-green-500/50" />
                                    )}
                                </div>
                                <CardDescription>
                                    ₹{spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Progress
                                    value={percentage}
                                    className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`}
                                // Custom color logic would go here if Progress component supported it directly, 
                                // otherwise we rely on the indicator class
                                />
                                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                                    <span>{percentage.toFixed(0)}% used</span>
                                    <span>₹{(budget.amount - spent).toLocaleString('en-IN')} remaining</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
