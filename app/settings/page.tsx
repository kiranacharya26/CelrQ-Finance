'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { BankConnections } from '@/components/BankConnections';
import { UploadHistory } from '@/components/UploadHistory';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';


function SettingsContent() {
    const { userEmail, isAuthenticated, session } = useAuth();
    const { transactions } = useTransactions({ userEmail, selectedBank: 'all' });
    const router = useRouter();

    // State
    const [isPremium, setIsPremium] = useState(false);
    const [wasPremium, setWasPremium] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isTrial, setIsTrial] = useState(false);
    const [trialDays, setTrialDays] = useState(0);

    // Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handlers
    const handleCancelSubscription = async () => {
        const toastId = toast.loading('Cancelling subscription...');
        try {
            const res = await fetch('/api/payment/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });
            if (res.ok) {
                setIsPremium(false);
                setPaymentDetails(null);
                toast.success('Subscription cancelled successfully', { id: toastId });
                setCancelModalOpen(false);
                router.refresh();
            } else {
                const err = await res.json();
                toast.error('Failed to cancel: ' + (err.error || 'unknown error'), { id: toastId });
            }
        } catch (e) {
            console.error(e);
            toast.error('Error cancelling subscription', { id: toastId });
        }
    };

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Effects
    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (userEmail) {
                try {
                    const userId = (session?.user as any)?.id || '';
                    const res = await fetch(`/api/payment/status?email=${userEmail}&userId=${userId}`);
                    const data = await res.json();

                    // hasPaid in API means "has access" (either trial or paid)
                    // We want to know if they actually paid
                    const actuallyPaid = data.hasPaid && !data.isTrial;

                    setIsPremium(actuallyPaid);
                    setIsTrial(data.isTrial || false);
                    setTrialDays(data.trialDaysRemaining || 0);
                    setWasPremium(data.wasPremium || false);

                    // Fetch full payment details from payments table
                    if (actuallyPaid) {
                        const detailsRes = await fetch(`/api/payment/details?email=${userEmail}&userId=${userId}`);
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

    // Calculations
    const subscriptionDaysRemaining = paymentDetails
        ? Math.ceil((new Date(new Date(paymentDetails.created_at).getTime() + (Number(paymentDetails.amount) > 149 ? 365 : 30) * 24 * 60 * 60 * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const isExpiringSoon = isPremium && !isTrial && subscriptionDaysRemaining <= 3 && subscriptionDaysRemaining >= 0;

    if (loading) {
        return (
            <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 h-64 bg-muted animate-pulse rounded-lg"></div>
                    <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your account, subscription, and data preferences.
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px] h-12 p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger
                        value="overview"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="data"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                    >
                        Data & Banks
                    </TabsTrigger>
                    <TabsTrigger
                        value="account"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                    >
                        Account
                    </TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Subscription Card */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <div className={`p-6 sm:p-8 text-white ${isExpiringSoon
                            ? 'bg-gradient-to-br from-orange-500 to-red-600'
                            : 'bg-gradient-to-br from-indigo-600 to-purple-700'
                            }`}>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl sm:text-2xl font-bold">
                                            {isPremium ? 'ClerQ Premium' : (isTrial ? 'Free Trial' : 'Free Plan')}
                                        </h2>
                                        {isPremium && !isExpiringSoon && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur text-white">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm max-w-md ${isExpiringSoon ? 'text-white font-medium' : 'text-indigo-100'}`}>
                                        {isPremium
                                            ? (isExpiringSoon
                                                ? `⚠️ Expires in ${subscriptionDaysRemaining} days!`
                                                : 'Full access active.')
                                            : (isTrial
                                                ? `${trialDays} days left in trial.`
                                                : 'Upgrade for AI insights & more.')
                                        }
                                    </p>
                                </div>

                                {(!isPremium || isTrial || isExpiringSoon) && (
                                    <button
                                        onClick={() => router.push('/?upgrade=true')}
                                        className="mt-2 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg shadow-sm hover:bg-indigo-50 transition-colors text-sm"
                                    >
                                        {isExpiringSoon ? 'Renew' : 'Upgrade'}
                                    </button>
                                )}
                            </div>

                            {/* Compact Plan Details */}
                            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                                <div>
                                    <p className="text-[10px] text-indigo-100/80 uppercase tracking-wider font-medium">Price</p>
                                    <p className="text-base font-bold mt-0.5">
                                        {paymentDetails && Number(paymentDetails.amount) > 149 ? '₹1499' : '₹149'}
                                        <span className="text-[10px] font-normal text-indigo-100/70 ml-1">
                                            /{paymentDetails && Number(paymentDetails.amount) > 149 ? 'yr' : 'mo'}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-indigo-100/80 uppercase tracking-wider font-medium">Status</p>
                                    <p className="text-base font-bold mt-0.5">
                                        {isPremium ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Manage Subscription Actions */}
                        {isPremium && !isTrial && (
                            <div className="bg-muted/30 p-3 flex flex-wrap gap-2 items-center justify-end border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={async () => {
                                        const toastId = toast.loading('Refreshing...');
                                        try {
                                            const res = await fetch(`/api/payment/status?email=${userEmail}`);
                                            const data = await res.json();
                                            setIsPremium(data.hasPaid || false);
                                            setIsTrial(data.isTrial || false);
                                            setTrialDays(data.trialDaysRemaining || 0);
                                            setWasPremium(data.wasPremium || false);
                                            toast.success('Updated', { id: toastId });
                                            router.refresh();
                                        } catch (e) {
                                            toast.error('Failed', { id: toastId });
                                        }
                                    }}
                                >
                                    Refresh
                                </Button>
                                <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                                            Cancel Plan
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Cancel Subscription?</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to cancel? You will lose access to premium features at the end of your billing cycle.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>Keep It</Button>
                                            <Button variant="destructive" onClick={handleCancelSubscription}>Yes, Cancel</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>

                    {/* Features List (Collapsible or just list) */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="p-6">
                            <h3 className="text-base font-semibold mb-3">Plan Features</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {[
                                    'Unlimited uploads',
                                    'AI categorization',
                                    'Spending forecasts',
                                    'Goal tracking',
                                    'Bank connections',
                                    'Analytics',
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <div className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${isPremium ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className={isPremium ? 'text-foreground' : 'text-muted-foreground'}>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </TabsContent>

                {/* DATA TAB */}
                <TabsContent value="data" className="space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-muted/20">
                            <h3 className="font-semibold">Bank Connections</h3>
                        </div>
                        <div className="p-0">
                            <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading banks...</div>}>
                                <BankConnections />
                            </Suspense>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-muted/20">
                            <h3 className="font-semibold">Upload History</h3>
                        </div>
                        <div className="p-0">
                            <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading history...</div>}>
                                <UploadHistory />
                            </Suspense>
                        </div>
                    </div>
                </TabsContent>

                {/* ACCOUNT TAB */}
                <TabsContent value="account" className="space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Profile</h3>
                            <div className="space-y-4">
                                <div className="grid gap-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <span className="text-sm font-medium truncate">{userEmail}</span>
                                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
                                            Verified
                                        </span>
                                    </div>
                                </div>
                                <div className="grid gap-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Member Since</label>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <span className="text-sm font-medium">
                                            {paymentDetails ? formatDate(paymentDetails.created_at) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900/50 overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-base font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4" />
                                Danger Zone
                            </h3>
                            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                                Permanently delete your account and all data.
                            </p>

                            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700">
                                        Delete Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="text-destructive">Delete Account Permanently?</DialogTitle>
                                        <DialogDescription>
                                            This will permanently delete all your data, including transactions, budgets, and account settings.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-delete">Type "DELETE" to confirm</Label>
                                            <Input
                                                id="confirm-delete"
                                                value={deleteConfirmText}
                                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                placeholder="DELETE"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                        >
                                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
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
