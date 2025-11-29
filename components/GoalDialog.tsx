'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Goal, GoalType } from '@/lib/goals';

interface GoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
    existingGoal?: Goal;
}

const GOAL_ICONS = ['🎯', '💰', '🏖️', '🏠', '🎮', '📱', '💍', '🚗', '✈️', '🎓', '💳', '🏥'];

const GOAL_TYPES: { value: GoalType; label: string }[] = [
    { value: 'savings', label: 'Savings Goal' },
    { value: 'spending-limit', label: 'Spending Limit' },
    { value: 'debt-payoff', label: 'Debt Payoff' },
    { value: 'custom', label: 'Custom Goal' },
];

const DEFAULT_CATEGORIES = [
    'Healthcare', 'Groceries', 'Restaurants & Dining', 'Fuel', 'Ride Services',
    'Public Transport', 'Bills', 'Telecom', 'Online Shopping', 'Retail & Stores',
    'Streaming Services', 'Events & Recreation', 'Housing', 'Education',
    'Insurance', 'Investments', 'Personal Care', 'Other'
];

export function GoalDialog({ open, onOpenChange, onSave, existingGoal }: GoalDialogProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<GoalType>('savings');
    const [category, setCategory] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('0');
    const [targetDate, setTargetDate] = useState('');
    const [icon, setIcon] = useState('🎯');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sync form state with existingGoal when it changes
    useEffect(() => {
        if (existingGoal) {
            setName(existingGoal.name);
            setType(existingGoal.type);
            setTargetAmount(existingGoal.targetAmount.toString());
            setCurrentAmount(existingGoal.currentAmount.toString());
            setTargetDate(existingGoal.targetDate || '');
            setCategory(existingGoal.category || '');
            setIcon(existingGoal.icon || '🎯');
        } else {
            // Reset to defaults when creating new goal
            setName('');
            setType('savings');
            setCategory('');
            setTargetAmount('');
            setCurrentAmount('0');
            setTargetDate('');
            setIcon('🎯');
        }
        setErrors({});
    }, [existingGoal, open]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'Goal name is required';
        }

        if (type === 'spending-limit' && !category) {
            newErrors.category = 'Category is required for spending limits';
        }

        const target = parseFloat(targetAmount);
        if (isNaN(target) || target <= 0) {
            newErrors.targetAmount = 'Target amount must be greater than 0';
        }

        const current = parseFloat(currentAmount);
        if (isNaN(current) || current < 0) {
            newErrors.currentAmount = 'Current amount must be 0 or greater';
        }

        if (current > target) {
            newErrors.currentAmount = 'Current amount cannot exceed target amount';
        }

        if (targetDate) {
            const date = new Date(targetDate);
            if (date < new Date()) {
                newErrors.targetDate = 'Target date must be in the future';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        const goal: Omit<Goal, 'id' | 'createdAt'> = {
            name: name.trim(),
            type,
            category: type === 'spending-limit' ? category : undefined,
            targetAmount: parseFloat(targetAmount),
            currentAmount: parseFloat(currentAmount),
            targetDate: targetDate || undefined,
            icon,
            completedAt: existingGoal?.completedAt,
        };

        onSave(goal);
        handleClose();
    };

    const handleClose = () => {
        setName('');
        setType('savings');
        setCategory('');
        setTargetAmount('');
        setCurrentAmount('0');
        setTargetDate('');
        setIcon('🎯');
        setErrors({});
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{existingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Goal Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Goal Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Vacation to Goa"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Goal Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">Goal Type *</Label>
                        <Select value={type} onValueChange={(value) => setType(value as GoalType)}>
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {GOAL_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category (for Spending Limit) */}
                    {type === 'spending-limit' && (
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEFAULT_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                        </div>
                    )}

                    {/* Target Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="targetAmount">Target Amount *</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input
                                id="targetAmount"
                                type="number"
                                placeholder="50000"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                className={`pl-7 ${errors.targetAmount ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {errors.targetAmount && <p className="text-xs text-red-500">{errors.targetAmount}</p>}
                    </div>

                    {/* Current Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="currentAmount">Current Amount (Optional)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input
                                id="currentAmount"
                                type="number"
                                placeholder="0"
                                value={currentAmount}
                                onChange={(e) => setCurrentAmount(e.target.value)}
                                className={`pl-7 ${errors.currentAmount ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {errors.currentAmount && <p className="text-xs text-red-500">{errors.currentAmount}</p>}
                    </div>

                    {/* Target Date */}
                    <div className="space-y-2">
                        <Label htmlFor="targetDate">Target Date (Optional)</Label>
                        <Input
                            id="targetDate"
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className={errors.targetDate ? 'border-red-500' : ''}
                        />
                        {errors.targetDate && <p className="text-xs text-red-500">{errors.targetDate}</p>}
                    </div>

                    {/* Icon Selector */}
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <div className="flex flex-wrap gap-2">
                            {GOAL_ICONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setIcon(emoji)}
                                    className={`flex h-10 w-10 items-center justify-center rounded-md border-2 text-xl transition-colors ${icon === emoji
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        {existingGoal ? 'Update Goal' : 'Create Goal'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
