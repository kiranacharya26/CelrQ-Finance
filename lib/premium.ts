import { supabaseAdmin } from './supabase';

export async function checkPremiumStatus(email: string) {
    try {
        // 1. Check for active payment
        const { data: payment } = await supabaseAdmin
            .from('payments')
            .select('status, created_at, amount')
            .eq('email', email)
            .eq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (payment) {
            const paymentDate = new Date(payment.created_at);
            const now = new Date();
            // Determine validity period based on amount (e.g., > 149 is yearly)
            const validityDays = Number(payment.amount) > 149 ? 365 : 30;
            const expiryDate = new Date(paymentDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

            if (now < expiryDate) {
                return { isPremium: true, isTrial: false };
            }
        }

        // 2. Check for active trial
        // We look for a 'TRIAL_STARTED' record
        const { data: trial } = await supabaseAdmin
            .from('payments')
            .select('created_at')
            .eq('email', email)
            .eq('status', 'TRIAL_STARTED')
            .single();

        if (trial) {
            const trialStart = new Date(trial.created_at);
            const now = new Date();
            const trialDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
            const trialEnd = new Date(trialStart.getTime() + trialDuration);

            if (now < trialEnd) {
                return { isPremium: true, isTrial: true };
            }
        }

        return { isPremium: false, isTrial: false };

    } catch (error) {
        console.error('Error checking premium status:', error);
        return { isPremium: false, isTrial: false };
    }
}
