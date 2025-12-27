-- Create budgets table for Spending Baselines
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_email, category)
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own budgets" ON public.budgets
    FOR ALL USING (user_email = (SELECT auth.jwt() ->> 'email'))
    WITH CHECK (user_email = (SELECT auth.jwt() ->> 'email'));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_email ON public.budgets(user_email);
