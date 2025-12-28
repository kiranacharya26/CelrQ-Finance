'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import { useSession, signIn } from 'next-auth/react';
import { UserStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { LogIn, Brain, ShieldCheck, TrendingUp, Lock, Zap, Database, Shield, CheckCircle } from 'lucide-react';
import CashfreePaymentButton from '@/components/CashfreePaymentButton';
import Image from 'next/image';

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
      // Use window.location to force a full page reload and fetch fresh data
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  if (!session) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
          <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>
        </div>

        <div className="z-10 max-w-6xl w-full flex flex-col gap-16 px-4 md:px-12 py-12 md:py-20">
          {/* Hero Section */}
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex justify-center mb-6">
              <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-4 tracking-tight drop-shadow-sm">
                ClerQ
              </h1>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Master Your Money with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI Precision</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Stop guessing where your money goes. Upload your bank statement and let our AI categorize, analyze, and visualize your financial life in seconds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                onClick={() => signIn('google')}
                size="lg"
                className="h-14 px-8 text-lg rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Start 7-Day Free Trial
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                No credit card required
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
              <div className="mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Brain className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI-Powered Insights</h3>
              <p className="text-muted-foreground">Automatically categorizes your transactions and identifies spending patterns you might miss.</p>
            </div>
            <div className="group p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
              <div className="mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Bank-Grade Security</h3>
              <p className="text-muted-foreground">Your data is encrypted at rest and in transit. We never sell your personal financial information.</p>
            </div>
            <div className="group p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
              <div className="mb-4 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Forecasting</h3>
              <p className="text-muted-foreground">Predict future expenses and visualize your wealth growth with intuitive charts and graphs.</p>
            </div>
          </div>

          {/* Social Proof / Trust */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
            <p className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Trusted by smart money managers</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 font-semibold text-lg"><CheckCircle className="h-5 w-5 text-blue-500" /> Google Auth</div>
              <div className="flex items-center gap-2 font-semibold text-lg"><Lock className="h-5 w-5 text-green-500" /> SSL Secure</div>
              <div className="flex items-center gap-2 font-semibold text-lg"><Database className="h-5 w-5 text-purple-500" /> Supabase</div>
              <div className="flex items-center gap-2 font-semibold text-lg"><Shield className="h-5 w-5 text-indigo-500" /> RLS Protected</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (checkingPayment) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </main>
    );
  }

  const isUpgrade = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('upgrade') === 'true';

  if (hasPaid === false || isUpgrade) {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const paymentRequired = params?.get('payment_required') === 'true';
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
            <div className="flex justify-center mb-8">
              <Image
                src="/clerq.png"
                alt="ClerQ Logo"
                width={800}
                height={260}
                className="h-32 w-auto md:h-48 lg:h-56 drop-shadow-xl"
                quality={100}
              />
            </div>
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
          <div className="flex justify-center mb-8">
            <Image
              src="/clerq.png"
              alt="ClerQ Brand Logo"
              width={800}
              height={260}
              className="h-40 w-auto md:h-64 lg:h-80"
              priority
              quality={100}
            />
          </div>
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
