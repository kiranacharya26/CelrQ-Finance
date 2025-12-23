-- MASTER SCHEMA FOR CELRQ-FINANCE
-- This file contains the complete schema for the application.
-- Use this to set up a fresh Supabase database.

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT,
    merchant_name TEXT,
    merchant_icon TEXT,
    bank_name TEXT,
    upload_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC DEFAULT 0,
    deadline DATE,
    icon TEXT,
    color TEXT,
    type TEXT DEFAULT 'savings',
    category TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    file_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    transaction_count INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    payment_id TEXT,
    user_id TEXT NOT NULL,
    email TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

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

-- 3. Optimized RLS Policies (using subqueries for performance)

-- Transactions
CREATE POLICY "Users can manage their own transactions" ON public.transactions
    FOR ALL USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- Goals
CREATE POLICY "Users can manage their own goals" ON public.goals
    FOR ALL USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- Uploads
CREATE POLICY "Users can manage their own uploads" ON public.uploads
    FOR ALL USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- Payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        email = (SELECT auth.jwt() ->> 'email') OR 
        user_id = (SELECT auth.uid()::text)
    );

CREATE POLICY "Service role can manage all payments" ON public.payments
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Usage Logs
CREATE POLICY "Users can view their own usage logs" ON public.usage_logs
    FOR SELECT USING (user_email = (SELECT auth.jwt() ->> 'email'));

CREATE POLICY "Service role can insert usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Merchant Rules
CREATE POLICY "Users can manage their own merchant rules" ON public.merchant_rules
    FOR ALL USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- Bank Connections
CREATE POLICY "Users can manage their own bank connections" ON public.bank_connections
    FOR ALL USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_email ON public.transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_goals_user_email ON public.goals(user_email);
CREATE INDEX IF NOT EXISTS idx_uploads_user_email ON public.uploads(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_email ON public.payments(email);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_email ON public.usage_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_user_email ON public.merchant_rules(user_email);
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_email ON public.bank_connections(user_email);
