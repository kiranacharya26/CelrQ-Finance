import { supabaseAdmin } from './supabase';

export async function checkRateLimit(email: string, feature: string, limit: number = 20, windowHours: number = 1) {
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabaseAdmin
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', email)
        .eq('feature', feature)
        .gte('created_at', windowStart);

    if (error) {
        console.error('🚨 Rate limit check failed (Security Fail-Safe Triggered):', error);
        // Fail Closed: If we can't verify the rate limit, we assume the worst to protect the system.
        return { allowed: false, error: 'System busy, please try again.' };
    }

    return {
        allowed: (count || 0) < limit,
        count: count || 0,
        limit
    };
}
