'use client';

import { useState, useEffect } from 'react';
import { analyzeMerchant, MerchantAnalysis } from '@/lib/merchants-deepdive';
import { Transaction } from '@/types';
import { Card } from '@/components/ui/card';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    ShoppingBag,
    ArrowRight,
    PieChart,
    X
} from 'lucide-react';

interface MerchantDeepDiveProps {
    transactions: Transaction[];
    merchantName: string;
}

export function MerchantDeepDive({ transactions, merchantName }: MerchantDeepDiveProps) {
    const [analysis, setAnalysis] = useState<MerchantAnalysis | null>(null);

    useEffect(() => {
        if (transactions.length > 0 && merchantName) {
            setAnalysis(analyzeMerchant(transactions, merchantName));
        }
    }, [transactions, merchantName]);

    if (!analysis) return null;

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-950">
            <div className="flex justify-between items-start border-b border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            <ShoppingBag className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">{analysis.name}</h2>
                            <p className="text-slate-400 text-sm">Merchant Intelligence Report</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-white">₹{analysis.totalSpent.toLocaleString('en-IN')}</p>
                </Card>
                <Card className="p-4 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Transactions</p>
                    <p className="text-2xl font-bold text-white">{analysis.transactionCount}</p>
                </Card>
                <Card className="p-4 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Avg. Ticket</p>
                    <p className="text-2xl font-bold text-white">₹{Math.round(analysis.averageTransaction).toLocaleString('en-IN')}</p>
                </Card>
                <Card className="p-4 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Frequency</p>
                    <p className="text-2xl font-bold text-blue-400">{analysis.frequency}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-slate-900/50 border-slate-800 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Spending Trend
                    </h3>
                    <div className="space-y-5">
                        {analysis.monthlyTrend.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-medium">{item.month}</span>
                                    <span className="text-white font-bold">₹{item.amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
                                        style={{ width: `${(item.amount / Math.max(...analysis.monthlyTrend.map(m => m.amount))) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 bg-slate-900/50 border-slate-800 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all" />
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {analysis.recentTransactions.map((tx, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-500 font-medium mb-0.5">
                                        {tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </p>
                                    <p className="text-sm text-white font-medium truncate pr-4">{tx.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">₹{tx.amount?.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
