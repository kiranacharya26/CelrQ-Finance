'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Transaction } from '@/types';
import { detectRecurringTransactions } from '@/lib/recurring';
import { CalendarDays, ArrowUpRight, Check } from 'lucide-react';

interface SubscriptionTrackerProps {
    transactions: Transaction[];
}

export function SubscriptionTracker({ transactions }: SubscriptionTrackerProps) {
    const recurringData = useMemo(() => {
        const indices = detectRecurringTransactions(transactions);
        const recurring = transactions.filter((_, i) => indices.has(i));

        // Group by description to find unique subscriptions
        const subs = new Map<string, {
            name: string;
            amount: number;
            frequency: string;
            lastDate: string;
            totalYearly: number;
        }>();

        recurring.forEach(t => {
            if (t.type !== 'expense') return;

            // Normalize name
            let name = t.description || t.narration || 'Unknown';
            if (name.includes('UPI-')) name = name.split('-')[1];
            name = name.trim();

            if (!subs.has(name)) {
                subs.set(name, {
                    name,
                    amount: Number(t.amount || 0),
                    frequency: 'Monthly', // Simplified detection
                    lastDate: String(t.date || new Date().toISOString()),
                    totalYearly: Number(t.amount || 0) * 12
                });
            } else {
                // Update last date if newer
                const existing = subs.get(name)!;
                const currentDate = new Date(t.date || '');
                const existingDate = new Date(existing.lastDate);

                if (!isNaN(currentDate.getTime()) && currentDate > existingDate) {
                    existing.lastDate = String(t.date);
                    existing.amount = Number(t.amount || 0); // Update to latest amount
                }
            }
        });

        return Array.from(subs.values());
    }, [transactions]);

    const totalMonthly = recurringData.reduce((sum, sub) => sum + sub.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Subscriptions & Recurring</h2>
                <p className="text-muted-foreground">
                    Detected {recurringData.length} recurring payments totaling <span className="font-bold text-foreground">₹{totalMonthly.toLocaleString('en-IN')}</span> per month.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recurringData.map((sub, i) => (
                    <Card key={i} className="overflow-hidden border-l-4 border-l-primary/50">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold truncate max-w-[150px]" title={sub.name}>
                                    {sub.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Last paid: {new Date(sub.lastDate).toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <div className="bg-primary/10 p-2 rounded-full">
                                <CalendarDays className="h-4 w-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between mt-2">
                                <div className="text-2xl font-bold">₹{sub.amount.toLocaleString('en-IN')}</div>
                                <div className="text-xs font-medium text-muted-foreground uppercase">{sub.frequency}</div>
                            </div>
                            <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                <span>~₹{sub.totalYearly.toLocaleString('en-IN')} / year</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {recurringData.length === 0 && (
                    <div className="col-span-full text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                        No recurring subscriptions detected yet. Upload more history to help identify patterns.
                    </div>
                )}
            </div>
        </div>
    );
}
