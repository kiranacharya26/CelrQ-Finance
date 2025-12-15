'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { BankConnections } from '@/components/BankConnections';
import { Crown, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { useTransactions } from '@/hooks/useTransactions';
import { SubscriptionTracker } from '@/components/SubscriptionTracker';

function SettingsContent() {
    const { userEmail, isAuthenticated } = useAuth();
    const { transactions } = useTransactions({ userEmail, selectedBank: 'all' });
    const router = useRouter();
    const [isPremium, setIsPremium] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isTrial, setIsTrial] = useState(false);
    const [trialDays, setTrialDays] = useState(0);

    // Delete Account State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;

        setIsDeleting(true);
        try {
            // 1. Delete from Backend
            const res = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: userEmail })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete account data');
            }

            // 2. Clear Local Storage
            if (userEmail) {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(userEmail)) {
                        localStorage.removeItem(key);
                    }
                });
            }

            // 3. Sign Out
            await signOut({ callbackUrl: '/' });
        } catch (error: any) {
            console.error(error);
            alert(`Failed to delete account: ${error.message}`);
            setIsDeleting(false);
        }
    };

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

    // Calculate subscription status
    const subscriptionDaysRemaining = paymentDetails
        ? Math.ceil((new Date(new Date(paymentDetails.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const isExpiringSoon = isPremium && !isTrial && subscriptionDaysRemaining <= 3 && subscriptionDaysRemaining >= 0;

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-muted-foreground">
                    Manage your subscription, view billing history, and update payment settings
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Current Plan - Spans full width on mobile, 2 cols on large screens */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className={`p-6 text-white ${isExpiringSoon
                        ? 'bg-gradient-to-r from-orange-500 to-red-600'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">
                                    {isTrial ? 'Free Trial Active' : (isPremium ? 'ClerQ Premium' : 'ClerQ')}
                                </h2>
                                <p className={isExpiringSoon ? 'text-white font-medium' : 'text-indigo-100'}>
                                    {isTrial
                                        ? `You have ${trialDays} days remaining in your trial`
                                        : (isExpiringSoon
                                            ? `⚠️ Your subscription expires in ${subscriptionDaysRemaining} days!`
                                            : (isPremium ? 'Full access to all features' : 'Start your 7-day free trial')
                                        )
                                    }
                                </p>
                            </div>
                            {isPremium && !isTrial && !isExpiringSoon && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur">
                                    <Crown className="h-6 w-6" />
                                    <span className="font-semibold text-lg">Active</span>
                                </div>
                            )}
                            {isExpiringSoon && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur animate-pulse">
                                    <AlertTriangle className="h-6 w-6" />
                                    <span className="font-semibold text-lg">Expiring Soon</span>
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Plan Price</p>
                                <p className="text-2xl font-bold">₹149</p>
                                <p className="text-xs text-muted-foreground">per month</p>
                            </div>
                            {isPremium && !isTrial && paymentDetails && (
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
                                </>
                            )}
                        </div>

                        {(!isPremium || isTrial || isExpiringSoon) && (
                            <div className="pt-4 border-t">
                                <button
                                    onClick={() => router.push('/?upgrade=true')}
                                    className={`w-full sm:w-auto px-6 py-3 text-white font-semibold rounded-lg transition-all transform hover:scale-105 ${isExpiringSoon
                                        ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-red-500/20"
                                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                        }`}
                                >
                                    {isExpiringSoon
                                        ? `Renew Now (₹149/mo)`
                                        : (isTrial ? 'Continue After Trial (₹149/mo)' : 'Start Free Trial')
                                    }
                                </button>
                            </div>
                        )}
                        {isPremium && !isTrial && (
                            <div className="pt-4 border-t flex flex-wrap gap-4">
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

                {/* Account Information - Compact card */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-fit">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Account</h2>
                        <div className="space-y-4">
                            <div className="pb-3 border-b">
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-sm truncate max-w-[180px]" title={userEmail || ''}>{userEmail}</p>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Verified</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <p className="text-base mt-1 font-medium">{isPremium ? 'Premium Member' : 'Free Plan'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment History - Only for Paid Users */}
                {isPremium && !isTrial && paymentDetails && (
                    <div className="col-span-1 md:col-span-1 lg:col-span-1 rounded-lg border bg-card text-card-foreground shadow-sm h-fit">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Last Payment</h2>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Amount</span>
                                    <span className="text-lg font-bold">₹{paymentDetails.amount}</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Date</span>
                                    <span className="text-sm">{formatDate(paymentDetails.created_at)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Method</span>
                                    <span className="text-sm">{paymentDetails.payment_method || 'Online'}</span>
                                </div>
                                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground font-mono">{paymentDetails.order_id}</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                                        PAID
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Features Included - Spans 2 cols on large */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {isPremium ? 'Your Premium Features' : 'Premium Features'}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Bank Connections - Spans full width */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded"></div>}>
                        <BankConnections />
                    </Suspense>
                </div>

                {/* Subscription Tracker - Spans full width */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <SubscriptionTracker transactions={transactions} />
                </div>

                {/* Danger Zone - Spans full width */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900/50">
                    <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-1 text-red-600 dark:text-red-400">Danger Zone</h2>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all associated data.
                            </p>
                        </div>

                        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 shrink-0">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-red-600 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Delete Account Permanently?
                                    </DialogTitle>
                                    <DialogDescription className="pt-2">
                                        This action is <strong>irreversible</strong>. It will permanently delete:
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="py-4">
                                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                                        <li>All your uploaded bank statements</li>
                                        <li>All transaction history and categorization</li>
                                        <li>All learned AI rules and merchant patterns</li>
                                        <li>All financial goals and budgets</li>
                                        <li>Your subscription and payment history</li>
                                        <li>Your account login credentials</li>
                                    </ul>

                                    <div className="mt-6 space-y-2">
                                        <Label htmlFor="confirm-delete" className="text-xs font-semibold uppercase text-muted-foreground">
                                            Type "DELETE" to confirm
                                        </Label>
                                        <Input
                                            id="confirm-delete"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            placeholder="DELETE"
                                            className="border-red-200 focus-visible:ring-red-500"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
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
