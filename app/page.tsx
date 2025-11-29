'use client';

import { FileUpload } from '@/components/FileUpload';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { parseDate } from '@/lib/parser';
import { useSession, signIn } from 'next-auth/react';
import { UserStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleUpload = async (file: File, bankAccount: string) => {
    if (!session?.user?.email) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bankAccount', bankAccount);

    // Get learned keywords from user storage (keep this local for now or move to DB later)
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

      // Prepare transactions for Supabase
      // We need to map the dynamic CSV/PDF fields to our strict schema
      const supabaseTransactions = newTransactions.map((t: any) => {
        // Helper to parse amount
        const parseAmount = (val: any) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          return parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0;
        };

        // Detect fields
        const dateKey = Object.keys(t).find(k => /date/i.test(k));
        const descKey = Object.keys(t).find(k => /description|narration|particulars/i.test(k));

        const deposit = parseAmount(t['Deposit Amt.'] || t.deposit || t.credit || 0);
        const withdrawal = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
        const amount = parseAmount(t.amount || 0);

        let finalAmount = 0;
        let type = 'expense';

        if (deposit > 0) {
          finalAmount = deposit;
          type = 'income';
        } else if (withdrawal > 0) {
          finalAmount = withdrawal;
          type = 'expense';
        } else {
          finalAmount = Math.abs(amount);
          type = amount >= 0 ? 'income' : 'expense';
        }

        return {
          user_email: session.user?.email,
          date: dateKey ? (parseDate(t[dateKey])?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
          description: descKey ? t[descKey] : 'Unknown Transaction',
          amount: finalAmount,
          type: type,
          category: t.category || 'Uncategorized',
          merchant_name: t.merchantName || null,
          bank_name: bankAccount,
          // merchant_icon: t.merchantIcon // if available
        };
      });

      // Insert into Supabase
      const { error } = await supabase
        .from('transactions')
        .insert(supabaseTransactions);

      if (error) {
        console.error('Error saving to Supabase:', JSON.stringify(error, null, 2));
        alert(`Error saving to database: ${error.message || JSON.stringify(error)}`);
        throw error;
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  if (!session) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 md:p-24 bg-gradient-to-b from-background to-muted/20">
        <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              ClerQ
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Financial clarity in seconds. Sign in to get started.
            </p>
          </div>
          <div className="w-full max-w-md mt-8 flex justify-center">
            <Button onClick={() => signIn('google')} size="lg" className="gap-2">
              <LogIn className="h-5 w-5" />
              Sign in with Google
            </Button>
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
