'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Plus, Trash2 } from 'lucide-react';

const DEFAULT_CATEGORIES = [
    'Healthcare',
    'Food & Dining',
    'Transportation',
    'Utilities',
    'Shopping',
    'Entertainment',
    'Housing',
    'Education',
    'Insurance',
    'Investments',
    'Personal Care'
];

interface Budget {
    category: string;
    amount: number;
}

export function BudgetManager() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [budgetAmount, setBudgetAmount] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Load budgets from localStorage
        const saved = localStorage.getItem('budgets');
        if (saved) {
            setBudgets(JSON.parse(saved));
        }
    }, []);

    const saveBudgets = (newBudgets: Budget[]) => {
        setBudgets(newBudgets);
        localStorage.setItem('budgets', JSON.stringify(newBudgets));
    };

    const handleAddBudget = () => {
        if (!selectedCategory || !budgetAmount || parseFloat(budgetAmount) <= 0) return;

        const existingIndex = budgets.findIndex(b => b.category === selectedCategory);
        let newBudgets: Budget[];

        if (existingIndex >= 0) {
            // Update existing budget
            newBudgets = [...budgets];
            newBudgets[existingIndex].amount = parseFloat(budgetAmount);
        } else {
            // Add new budget
            newBudgets = [...budgets, { category: selectedCategory, amount: parseFloat(budgetAmount) }];
        }

        saveBudgets(newBudgets);
        setSelectedCategory('');
        setBudgetAmount('');
    };

    const handleDeleteBudget = (category: string) => {
        const newBudgets = budgets.filter(b => b.category !== category);
        saveBudgets(newBudgets);
    };

    const availableCategories = DEFAULT_CATEGORIES.filter(
        cat => !budgets.find(b => b.category === cat)
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Budgets
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Budget Management</DialogTitle>
                    <DialogDescription>
                        Set monthly budgets for different spending categories
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Add/Update Budget */}
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                    {budgets.map(b => (
                                        <SelectItem key={b.category} value={b.category}>
                                            {b.category} (Update)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                placeholder="Amount"
                                value={budgetAmount}
                                onChange={(e) => setBudgetAmount(e.target.value)}
                                className="w-32"
                            />
                            <Button onClick={handleAddBudget} disabled={!selectedCategory || !budgetAmount}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Budget List */}
                    <div className="space-y-2">
                        {budgets.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No budgets set. Add one above to get started.
                            </p>
                        ) : (
                            budgets.map(budget => (
                                <div key={budget.category} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{budget.category}</p>
                                        <p className="text-sm text-muted-foreground">
                                            ₹{budget.amount.toLocaleString()} / month
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteBudget(budget.category)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
