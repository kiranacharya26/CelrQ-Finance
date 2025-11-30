'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useRouter, useSearchParams } from 'next/navigation';

// Lazy load components
const AIInsights = dynamic(() => import('@/components/AIInsights').then(mod => ({ default: mod.AIInsights })), {
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded"></div>,
    ssr: false,
});

const SpendingForecast = dynamic(() => import('@/components/SpendingForecast').then(mod => ({ default: mod.SpendingForecast })), {
    loading: () => <div className="h-[400px] bg-muted animate-pulse rounded"></div>,
    ssr: false,
});

const SubscriptionTracker = dynamic(() => import('@/components/SubscriptionTracker').then(mod => ({ default: mod.SubscriptionTracker })), {
    loading: () => <div className="h-[200px] bg-muted animate-pulse rounded"></div>,
});

const BudgetProgress = dynamic(() => import('@/components/BudgetProgress').then(mod => ({ default: mod.BudgetProgress })), {
    loading: () => <div className="h-[200px] bg-muted animate-pulse rounded"></div>,
});

const SpendingInsights = dynamic(() => import('@/components/SpendingInsights').then(mod => ({ default: mod.SpendingInsights })), {
    loading: () => <div className="h-[200px] bg-muted animate-pulse rounded"></div>,
});

function InsightsContent() {
    const { userEmail, isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedMonth = searchParams.get('month') || "All Months";

    const { transactions, loading } = useTransactions({
        userEmail,
        selectedBank: 'all',
    });

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div className="flex items-center justify-center h-screen">Please sign in to view insights.</div>;
    }

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6 max-w-full overflow-x-hidden">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Advanced Insights</h1>
                <p className="text-muted-foreground">
                    Deep dive into your spending patterns, forecasts, and AI-powered recommendations
                </p>
            </div>

            {/* Main Grid */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 max-w-full">
                {/* AI Insights - Full width on mobile, half on desktop */}
                <div className="lg:col-span-2">
                    <Suspense fallback={<div className="h-[300px] bg-muted animate-pulse rounded"></div>}>
                        <AIInsights transactions={transactions} />
                    </Suspense>
                </div>

                {/* Spending Forecast */}
                <div className="lg:col-span-2">
                    <Suspense fallback={<div className="h-[400px] bg-muted animate-pulse rounded"></div>}>
                        <SpendingForecast transactions={transactions} />
                    </Suspense>
                </div>

                {/* Subscription Tracker */}
                <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded"></div>}>
                    <SubscriptionTracker transactions={transactions} />
                </Suspense>

                {/* Budget Progress */}
                <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded"></div>}>
                    <BudgetProgress transactions={transactions} selectedMonth={selectedMonth} />
                </Suspense>

                {/* Spending Insights */}
                <div className="lg:col-span-2">
                    <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded"></div>}>
                        <SpendingInsights transactions={transactions} selectedMonth={selectedMonth} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

export default function InsightsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading insights...</div>}>
            <InsightsContent />
        </Suspense>
    );
}
