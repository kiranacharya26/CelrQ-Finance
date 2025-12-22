'use client';

import { identifySubscriptions, Subscription } from '@/lib/recurring';
import { getCategoryIcon } from '@/lib/merchants';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    CreditCard,
    Calendar,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    ArrowRight,
    Search
} from 'lucide-react';
import { useState, useEffect } from 'react'; // Added useState and useEffect imports

export default function SubscriptionsPage() {
    const { userEmail, isAuthenticated } = useAuth();
    const { transactions, loading } = useTransactions({
        userEmail,
        selectedBank: 'all',
    });

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [stats, setStats] = useState({
        totalMonthly: 0,
        activeCount: 0,
        potentialSavings: 0
    });

    useEffect(() => {
        if (transactions && transactions.length > 0) {
            const subs = identifySubscriptions(transactions);
            setSubscriptions(subs);

            const monthly = subs.reduce((sum, s) => {
                if (s.frequency === 'monthly') return sum + s.amount;
                if (s.frequency === 'yearly') return sum + (s.amount / 12);
                if (s.frequency === 'weekly') return sum + (s.amount * 4);
                return sum;
            }, 0);

            setStats({
                totalMonthly: monthly,
                activeCount: subs.length,
                potentialSavings: monthly * 0.15
            });
        }
    }, [transactions]);

    if (loading) return <div className="flex items-center justify-center h-screen">Analyzing your subscriptions...</div>;
    if (!isAuthenticated) return <div className="flex items-center justify-center h-screen">Please sign in to view subscriptions.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Detective</h1>
                    <p className="text-muted-foreground mt-2">
                        We've identified {subscriptions.length} recurring services in your accounts.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Card className="p-4 bg-primary/10 border-primary/20">
                        <p className="text-xs font-medium text-primary uppercase tracking-wider">Monthly Burn</p>
                        <p className="text-2xl font-bold">₹{Math.round(stats.totalMonthly).toLocaleString('en-IN')}</p>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 space-y-4 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <CreditCard className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="font-semibold">Active Services</h3>
                    </div>
                    <p className="text-3xl font-bold">{stats.activeCount}</p>
                    <p className="text-sm text-muted-foreground">Across all your bank accounts</p>
                </Card>

                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <h3 className="font-semibold">Potential Savings</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-500">₹{Math.round(stats.potentialSavings).toLocaleString('en-IN')}</p>
                    <p className="text-sm text-muted-foreground">By switching to annual plans</p>
                </Card>

                <Card className="p-6 bg-orange-500/10 border-orange-500/20 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                        </div>
                        <h3 className="font-semibold">Expiring Soon</h3>
                    </div>
                    <p className="text-3xl font-bold">
                        {subscriptions.filter(s => s.status === 'expiring').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Renewals due in the next 7 days</p>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Detected Subscriptions</h2>
                <div className="grid grid-cols-1 gap-4">
                    {subscriptions.map((sub, i) => {
                        const iconInfo = getCategoryIcon(sub.category);
                        return (
                            <Card key={i} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                            style={{ backgroundColor: `${iconInfo.color}15`, color: iconInfo.color }}
                                        >
                                            {iconInfo.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{sub.name}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className="capitalize">{sub.frequency}</span>
                                                <span>•</span>
                                                <span>Last paid {new Date(sub.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-xl font-bold">₹{sub.amount.toLocaleString('en-IN')}</p>
                                            <p className="text-xs text-muted-foreground">Next: {new Date(sub.nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
