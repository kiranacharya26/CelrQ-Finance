'use client';

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import { analyzeInvestments, InvestmentSummary } from '@/lib/investments';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    TrendingUp,
    PieChart,
    Plus,
    Wallet,
    ArrowUpRight,
    Calendar,
    Edit2,
    Check,
    X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserStorage } from '@/lib/storage';
import { useSession } from 'next-auth/react';

interface InvestmentPortfolioProps {
    transactions: Transaction[];
}

export function InvestmentPortfolio({ transactions }: InvestmentPortfolioProps) {
    const { data: session } = useSession();
    const userEmail = session?.user?.email;

    const [summaries, setSummaries] = useState<Record<string, InvestmentSummary>>({});
    const [manualAdjustments, setManualAdjustments] = useState<Record<string, number>>({});
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState<string>('');

    useEffect(() => {
        const detected = analyzeInvestments(transactions);
        setSummaries(detected);

        // Load manual adjustments from user-scoped storage
        if (userEmail) {
            const saved = UserStorage.getData(userEmail, 'manual_investments', {});
            setManualAdjustments(saved);
        }
    }, [transactions, userEmail]);

    const handleSaveManual = (category: string) => {
        if (!userEmail) return;
        const newVal = parseFloat(tempValue) || 0;
        const updated = { ...manualAdjustments, [category]: newVal };
        setManualAdjustments(updated);
        UserStorage.saveData(userEmail, 'manual_investments', updated);
        setEditingCategory(null);
    };

    const categories = [
        { id: 'Mutual Funds', icon: <PieChart className="w-5 h-5 text-blue-400" />, color: 'blue' },
        { id: 'Stocks', icon: <TrendingUp className="w-5 h-5 text-green-400" />, color: 'green' },
        { id: 'Fixed Deposits', icon: <Wallet className="w-5 h-5 text-purple-400" />, color: 'purple' },
        { id: 'Recurring Deposits', icon: <Calendar className="w-5 h-5 text-orange-400" />, color: 'orange' },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                        Investment Portfolio
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground">AI-detected and manual wealth tracking</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                    Wealth Mode
                </Badge>
            </div>

            {/* Mobile View: Compact Grid */}
            <div className="md:hidden grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                    const summary = summaries[cat.id];
                    const manual = manualAdjustments[cat.id] || 0;
                    const total = (summary?.totalInvested || 0) + manual;
                    const isEditing = editingCategory === cat.id;

                    return (
                        <div key={cat.id} className="p-3 rounded-lg border bg-card shadow-sm relative overflow-hidden">
                            {/* Background Glow */}
                            <div className={`absolute -right-2 -top-2 w-16 h-16 bg-${cat.color}-500/5 rounded-full blur-xl`} />

                            <div className="relative z-10 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded bg-muted border border-border flex items-center justify-center">
                                            <div className="w-3.5 h-3.5 text-current">
                                                {cat.icon}
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{cat.id}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingCategory(cat.id);
                                            setTempValue(manual.toString());
                                        }}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                </div>

                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="h-6 bg-background border-input text-xs"
                                            autoFocus
                                        />
                                        <button onClick={() => handleSaveManual(cat.id)} className="p-0.5 bg-green-500/20 text-green-400 rounded">
                                            <Check className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => setEditingCategory(null)} className="p-0.5 bg-red-500/20 text-red-400 rounded">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <h3 className="text-lg font-bold">
                                        ₹{total.toLocaleString('en-IN')}
                                    </h3>
                                )}

                                <div className="space-y-0.5">
                                    <div className="flex justify-between text-[8px] uppercase font-bold tracking-tight">
                                        <span className="text-muted-foreground">AI</span>
                                        <span className="text-blue-500">₹{(summary?.totalInvested || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex justify-between text-[8px] uppercase font-bold tracking-tight">
                                        <span className="text-muted-foreground">Manual</span>
                                        <span className="text-orange-500">₹{manual.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>

                                {summary?.recurringAmount > 0 && (
                                    <div className="pt-1.5 border-t border-border flex items-center gap-1 text-[8px] text-muted-foreground">
                                        <Calendar className="w-2 h-2" />
                                        SIP: ₹{Math.round(summary.recurringAmount).toLocaleString('en-IN')}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop View: Full Cards */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((cat) => {
                    const summary = summaries[cat.id];
                    const manual = manualAdjustments[cat.id] || 0;
                    const total = (summary?.totalInvested || 0) + manual;
                    const isEditing = editingCategory === cat.id;

                    return (
                        <Card key={cat.id} className="p-5 hover:border-primary/50 transition-all group relative overflow-hidden">
                            {/* Background Glow */}
                            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${cat.color}-500/5 rounded-full blur-2xl group-hover:bg-${cat.color}-500/10 transition-all`} />

                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className={`p-2 rounded-lg bg-muted border border-border`}>
                                        {cat.icon}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingCategory(cat.id);
                                            setTempValue(manual.toString());
                                        }}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.id}</p>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                type="number"
                                                value={tempValue}
                                                onChange={(e) => setTempValue(e.target.value)}
                                                className="h-8 bg-background border-input"
                                                autoFocus
                                            />
                                            <button onClick={() => handleSaveManual(cat.id)} className="p-1 bg-green-500/20 text-green-400 rounded">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditingCategory(null)} className="p-1 bg-red-500/20 text-red-400 rounded">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 className="text-2xl font-bold mt-1">
                                            ₹{total.toLocaleString('en-IN')}
                                        </h3>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                                        <span className="text-muted-foreground">AI Detected</span>
                                        <span className="text-blue-500">₹{summary?.totalInvested?.toLocaleString('en-IN') || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                                        <span className="text-muted-foreground">Manual/Other</span>
                                        <span className="text-orange-500">₹{manual.toLocaleString('en-IN')}</span>
                                    </div>

                                    {summary?.recurringAmount > 0 && (
                                        <div className="pt-2 border-t border-border flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            Est. Monthly SIP: ₹{Math.round(summary.recurringAmount).toLocaleString('en-IN')}
                                        </div>
                                    )}
                                </div>

                                {summary?.detectedMerchants?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {summary.detectedMerchants.slice(0, 2).map((m, i) => (
                                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
