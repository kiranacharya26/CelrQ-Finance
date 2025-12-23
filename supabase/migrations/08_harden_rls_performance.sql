-- Migration: Harden RLS Performance and Security (Final Optimized Version)
-- This migration addresses all Supabase Linter warnings:
-- 1. auth_rls_initplan: Wraps auth calls in (SELECT ...) for performance.
-- 2. multiple_permissive_policies: Consolidates redundant policies and restricts roles.

-- 1. Ensure Tables Exist
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    feature TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    estimated_cost_usd DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merchant_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    keyword TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_email, keyword)
);

CREATE TABLE IF NOT EXISTS public.bank_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number_masked TEXT,
    account_type TEXT,
    connection_status TEXT DEFAULT 'pending',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    provider TEXT DEFAULT 'manual',
    provider_account_id TEXT,
    UNIQUE(user_email, bank_name, account_number_masked)
);

-- 2. Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

-- 3. DROP ALL OLD POLICIES (to resolve multiple_permissive_policies)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4. CREATE OPTIMIZED POLICIES (addressing auth_rls_initplan)

-- Transactions
CREATE POLICY "Users can manage their own transactions" ON public.transactions
    FOR ALL 
    TO authenticated
    USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- Goals
CREATE POLICY "Users can manage their own goals" ON public.goals
    FOR ALL 
    TO authenticated
    USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- Uploads
CREATE POLICY "Users can manage their own uploads" ON public.uploads
    FOR ALL 
    TO authenticated
    USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- Payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT 
    TO authenticated
    USING (
        email = (SELECT auth.jwt() ->> 'email') OR 
        user_id = (SELECT auth.uid()::text)
    );

CREATE POLICY "Service role can manage all payments" ON public.payments
    FOR ALL 
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Usage Logs
CREATE POLICY "Users can view their own usage logs" ON public.usage_logs
    FOR SELECT 
    TO authenticated
    USING (user_email = (SELECT auth.jwt() ->> 'email'));

CREATE POLICY "Service role can insert usage logs" ON public.usage_logs
    FOR INSERT 
    TO service_role
    WITH CHECK (TRUE);

-- Merchant Rules
CREATE POLICY "Users can manage their own merchant rules" ON public.merchant_rules
    FOR ALL 
    TO authenticated
    USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- Bank Connections
CREATE POLICY "Users can manage their own bank connections" ON public.bank_connections
    FOR ALL 
    TO authenticated
    USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));
