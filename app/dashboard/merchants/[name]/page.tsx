'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { MerchantDeepDive } from '@/components/MerchantDeepDive';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function MerchantPageContent() {
    const params = useParams();
    const router = useRouter();
    const { userEmail, isAuthenticated } = useAuth();
    const merchantName = decodeURIComponent(params.name as string);

    const { transactions, loading } = useTransactions({
        userEmail,
        selectedBank: 'all',
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-400 animate-pulse">Analyzing merchant data...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <div className="p-8 text-center">Please sign in to view this analysis.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-slate-400 hover:text-white mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Transactions
            </Button>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <MerchantDeepDive
                    transactions={transactions}
                    merchantName={merchantName}
                />
            </div>
        </div>
    );
}

export default function MerchantDeepDivePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MerchantPageContent />
        </Suspense>
    );
}
