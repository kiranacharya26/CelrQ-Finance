'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { parseDate } from '@/lib/parser';
import { useSession, signIn } from 'next-auth/react';
import { UserStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import CashfreePaymentButton from '@/components/CashfreePaymentButton';

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Check payment status when session is available
  useEffect(() => {
    const checkPayment = async () => {
      if (session?.user?.email) {
        setCheckingPayment(true);
        try {
          // Check if we just returned from a successful payment
          // Check if we have an order_id (Cashfree return URL)
          const params = new URLSearchParams(window.location.search);
          const status = params.get('payment_status');
          const orderId = params.get('order_id');
          const isUpgrade = params.get('upgrade') === 'true';

          // If we have an orderId, we should verify it with the server
          // regardless of what the URL param says (it might be unreplaced placeholders)
          if (orderId) {
            // Verify payment with server to ensure DB is updated
            try {
              console.log("Verifying payment for order:", orderId);
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId,
                  customerEmail: session.user.email
                })
              });

              console.log("Verification response status:", verifyRes.status);

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                console.log("Verification data:", verifyData);

                if (verifyData.success) {
                  console.log("Payment verified! Redirecting to dashboard...");
                  // Payment verified, redirect immediately
                  router.push('/dashboard');
                  return;
                }
              }
            } catch (e) {
              console.error("Verification failed with exception", e);
            }
          }

          // Use user.id if available (from session), else fallback to email check if supported
          // Note: session.user.id might not be populated depending on next-auth config.
          // If using Supabase adapter, it should be there.
          // If not, we rely on email, but our API prefers userId.
          // Let's pass both.
          const userId = (session.user as any).id || '';
          const res = await fetch(`/api/payment/status?userId=${userId}&email=${session.user.email}`);
          const data = await res.json();
          setHasPaid(data.hasPaid);

          // Check if trial expired (was in trial but now hasPaid is false)
          if (!data.hasPaid && data.isTrial === false && data.trialDaysRemaining === 0) {
            setTrialExpired(true);
          }

          // If user has paid, redirect to dashboard
          // BUT skip redirect if user explicitly wants to upgrade/pay
          if (data.hasPaid && !isUpgrade) {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error("Failed to check payment status", error);
        } finally {
          setCheckingPayment(false);
        }
      }
    };

    checkPayment();
  }, [session, router]);

  const handleUpload = async (file: File, bankAccount: string) => {
    if (!session?.user?.email) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bankAccount', bankAccount);
    if (session?.user?.email) {
      formData.append('email', session.user.email);
    }

    // Get learned keywords from user storage
    const learnedKeywords = UserStorage.getData<Record<string, string[]>>(session.user.email, 'learnedKeywords', {});
    if (learnedKeywords) {
      formData.append('learnedKeywords', JSON.stringify(learnedKeywords));
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, response.statusText, errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const newTransactions = data.transactions;
      const newlyLearnedKeywords = data.newlyLearnedKeywords;

      // Update learned keywords in user storage
      if (newlyLearnedKeywords && Object.keys(newlyLearnedKeywords).length > 0) {
        const currentKeywords = learnedKeywords || {};
        Object.entries(newlyLearnedKeywords).forEach(([category, keywords]) => {
          if (!currentKeywords[category]) {
            currentKeywords[category] = [];
          }
          (keywords as string[]).forEach(k => {
            if (!currentKeywords[category].includes(k)) {
              currentKeywords[category].push(k);
            }
          });
        });
        UserStorage.saveData(session.user.email, 'learnedKeywords', currentKeywords);
      }

      console.log('✅ Transactions processed by API. Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  if (!session) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 md:p-12 bg-gradient-to-b from-background to-muted/20">
        <div className="z-10 max-w-6xl w-full flex flex-col gap-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-indigo-100 dark:bg-indigo-950 rounded-full mb-4">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                🎉 7-Day Free Trial • No Credit Card Required
              </p>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              ClerQ
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              AI-powered finance tracking that learns from your spending habits.
              Your data stays private and secure.
            </p>
          </div>

          {/* Sign In Button */}
          <div className="w-full max-w-md mx-auto flex justify-center">
            <Button onClick={() => signIn('google')} size="lg" className="gap-2 px-8 py-6 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
              <LogIn className="h-5 w-5" />
              Start 7-Day Free Trial with Google
            </Button>
          </div>

          {/* Security & Privacy Section */}
          <div className="max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-center mb-8">Your Security & Privacy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Secure Authentication */}
              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Secure Google Login</h3>
                    <p className="text-sm text-muted-foreground">
                      Sign in with Google OAuth 2.0. We never see or store your password. Your Google account's 2FA protection applies automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* No Data Selling */}
              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950">
                    <span className="text-2xl">🚫</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Your Data is Private</h3>
                    <p className="text-sm text-muted-foreground">
                      We never share, sell, or monetize your financial data. Your information is used solely to provide you with insights.
                    </p>
                  </div>
                </div>
              </div>

              {/* Encrypted Storage */}
              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-950">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Encrypted Storage</h3>
                    <p className="text-sm text-muted-foreground">
                      Your data is stored securely with Supabase, using industry-standard encryption in transit (TLS) and at rest.
                    </p>
                  </div>
                </div>
              </div>

              {/* User-Only Access */}
              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-950">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Your Eyes Only</h3>
                    <p className="text-sm text-muted-foreground">
                      Row-level security ensures only you can access your transactions and financial data. No one else can view your information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges - Only Truthful Ones */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>OAuth 2.0 Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>TLS/SSL Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Row-Level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>No Third-Party Data Sharing</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (checkingPayment) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-xl">Checking subscription status...</div>
      </main>
    );
  }

  if (hasPaid === false || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('upgrade') === 'true')) {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const paymentRequired = params?.get('payment_required') === 'true';
    const isUpgrade = params?.get('upgrade') === 'true';
    const errorType = params?.get('error');

    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 md:p-12 bg-gradient-to-b from-background to-muted/20">
        <div className="z-10 max-w-6xl w-full flex flex-col gap-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-indigo-100 dark:bg-indigo-950 rounded-full mb-4">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                🎉 7-Day Free Trial • No Credit Card Required
              </p>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              ClerQ
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              {trialExpired
                ? "Your 7-day free trial has ended. Continue using ClerQ for just ₹149/month!"
                : (paymentRequired
                  ? "Payment required to access your dashboard and data."
                  : "AI-powered finance tracking that learns from your spending habits.")
              }
            </p>
            {trialExpired && (
              <div className="mx-auto max-w-[700px] p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⏰ <strong>Trial Ended</strong> - You experienced the power of AI-driven finance tracking.
                  Continue for just ₹149/month to keep your data and insights!
                </p>
              </div>
            )}
            {paymentRequired && !trialExpired && (
              <p className="mx-auto max-w-[700px] text-sm text-amber-600 dark:text-amber-400">
                ⚠️ You need an active subscription to access your dashboard
              </p>
            )}
            {errorType === 'verification_failed' && (
              <p className="mx-auto max-w-[700px] text-sm text-red-600 dark:text-red-400">
                ⚠️ Payment verification failed. Please complete payment to continue.
              </p>
            )}
            {errorType === 'verification_error' && (
              <p className="mx-auto max-w-[700px] text-sm text-red-600 dark:text-red-400">
                ⚠️ Unable to verify payment status. Please try again or contact support.
              </p>
            )}
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto w-full">
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-muted/50 p-1 rounded-full flex items-center relative">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === 'yearly'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Yearly
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                    SAVE 16%
                  </span>
                </button>
              </div>
            </div>

            <div className="relative border-2 border-indigo-500 rounded-2xl p-8 bg-card shadow-2xl transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-sm font-bold rounded-full">
                {billingCycle === 'monthly' ? '7 DAYS FREE' : 'BEST VALUE'}
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">
                  {billingCycle === 'monthly' ? 'Monthly Plan' : 'Yearly Plan'}
                </h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">
                    ₹{billingCycle === 'monthly' ? '149' : '1499'}
                  </span>
                  <span className="text-muted-foreground">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    That's just ₹125/month!
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Start with 7 days free • Cancel anytime
                </p>
              </div>

              <div className="w-full mb-6">
                <CashfreePaymentButton
                  amount={billingCycle === 'monthly' ? 149 : 1499}
                  planType={billingCycle}
                  receiptId={`sub_${session.user?.email}_${Date.now()}`}
                  customer={{
                    id: (session.user as any).id || (session.user?.email ? `cust_${session.user.email.replace(/[^a-zA-Z0-9]/g, '')}` : 'cust_temp'),
                    email: session.user?.email || '',
                    phone: '9999999999'
                  }}
                />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>AI Bank Statement Upload</strong> - Instant categorization</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Smart Money Assistant</strong> - Chat with AI about your finances</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Advanced Analytics</strong> - Spending insights & forecasts</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Goal Tracking</strong> - Set and monitor financial goals</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Budget Manager</strong> - Stay on top of your spending</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Unlimited History</strong> - Access all your data anytime</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Export Reports</strong> - PDF & CSV downloads</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🚫</span>
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-gradient-to-b from-background to-muted/20">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-6 sm:gap-8">
        <div className="text-center space-y-2 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            ClerQ
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-xl px-4">
            Upload your bank statement (PDF or CSV) to get instant financial clarity.
          </p>
        </div>

        <div className="w-full max-w-xl px-2 sm:px-0">
          <FileUpload onUpload={handleUpload} />
        </div>
      </div>
    </main>
  );
}
