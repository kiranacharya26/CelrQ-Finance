'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { BankConnections } from '@/components/BankConnections';
import { Crown } from 'lucide-react';
import { useState, useEffect } from 'react';

function SettingsContent() {
    const { userEmail, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isPremium, setIsPremium] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isTrial, setIsTrial] = useState(false);
    const [trialDays, setTrialDays] = useState(0);

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (userEmail) {
                try {
                    const res = await fetch(`/api/payment/status?email=${userEmail}`);
                    const data = await res.json();
                    setIsPremium(data.hasPaid || false);
                    setIsTrial(data.isTrial || false);
                    setTrialDays(data.trialDaysRemaining || 0);

                    // Fetch full payment details from payments table
                    if (data.hasPaid && !data.isTrial) {
                        const detailsRes = await fetch(`/api/payment/details?email=${userEmail}`);
                        if (detailsRes.ok) {
                            const details = await detailsRes.json();
                            setPaymentDetails(details);
                        }
                    }
                } catch (error) {
                    console.error('Failed to check payment details:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchPaymentDetails();
    }, [userEmail]);

    if (!isAuthenticated) {
        return <div className="flex items-center justify-center h-screen">Please sign in to view settings.</div>;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-muted-foreground">
                    Manage your subscription, view billing history, and update payment settings
                </p>
            </div>

            {/* Current Plan */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">
                                {isTrial ? 'Free Trial Active' : (isPremium ? 'ClerQ Premium' : 'ClerQ')}
                            </h2>
                            <p className="text-indigo-100">
                                {isTrial
                                    ? `You have ${trialDays} days remaining in your trial`
                                    : (isPremium ? 'Full access to all features' : 'Start your 7-day free trial')
                                }
                            </p>
                        </div>
                        {isPremium && !isTrial && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur">
                                <Crown className="h-6 w-6" />
                                <span className="font-semibold text-lg">Active</span>
                            </div>
                        )}
                        {isTrial && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur">
                                <span className="text-2xl">⏳</span>
                                <span className="font-semibold text-lg">{trialDays} Days Left</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Plan Price</p>
                            <p className="text-2xl font-bold">₹129</p>
                            <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                        {isPremium && paymentDetails && (
                            <>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Subscribed On</p>
                                    <p className="text-lg font-semibold">
                                        {formatDate(paymentDetails.created_at)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Subscription Ends</p>
                                    <p className="text-lg font-semibold">
                                        {formatDate(new Date(new Date(paymentDetails.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Payment Method</p>
                                    <p className="text-lg font-semibold">
                                        {paymentDetails.payment_method || 'Online Payment'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {(!isPremium || isTrial) && (
                        <div className="pt-4 border-t">
                            <button
                                onClick={() => router.push('/')}
                                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                            >
                                {isTrial ? 'Continue After Trial (₹129/mo)' : 'Start Free Trial'}
                            </button>
                        </div>
                    )}
                    {isPremium && (
                        <div className="pt-4 border-t flex space-x-4">
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch('/api/payment/cancel', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: userEmail })
                                        });
                                        if (res.ok) {
                                            setIsPremium(false);
                                            setPaymentDetails(null);
                                            alert('Subscription cancelled successfully');
                                            router.refresh();
                                        } else {
                                            const err = await res.json();
                                            alert('Failed to cancel: ' + (err.error || 'unknown error'));
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        alert('Error cancelling subscription');
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Cancel Subscription
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment History */}
            {isPremium && paymentDetails && (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <p className="font-medium">ClerQ Premium Subscription</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Order ID: {paymentDetails.order_id}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDate(paymentDetails.created_at)} • {paymentDetails.payment_method}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₹{paymentDetails.amount}</p>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        Paid
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Features Included */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {isPremium ? 'Your Premium Features' : 'Premium Features'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            'Unlimited transaction uploads',
                            'AI-powered categorization',
                            'Advanced spending forecasts',
                            'Goal tracking & budgets',
                            'Bank account connections',
                            'Detailed insights & analytics',
                            'Subscription tracker',
                            'Export & reporting tools',
                        ].map((feature, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center ${isPremium ? 'bg-green-100' : 'bg-muted'
                                    }`}>
                                    <svg
                                        className={`h-3 w-3 ${isPremium ? 'text-green-600' : 'text-muted-foreground'}`}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span className={isPremium ? 'text-foreground' : 'text-muted-foreground'}>
                                    {feature}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Account Information */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                <p className="text-base mt-1">{userEmail}</p>
                            </div>
                            <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">Verified</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                                <p className="text-base mt-1">{isPremium ? 'Premium Member' : 'Free Plan'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bank Connections */}
            <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded"></div>}>
                <BankConnections />
            </Suspense>

        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading settings...</div>}>
            <SettingsContent />
        </Suspense>
    );
}
