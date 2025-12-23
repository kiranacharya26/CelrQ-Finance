-- Create usage_logs table for tracking AI costs and token usage
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    feature TEXT NOT NULL, -- 'categorization', 'chat', etc.
    model TEXT NOT NULL, -- 'gpt-4o-mini', 'gpt-4o', etc.
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    estimated_cost_usd DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_email ON usage_logs(user_email);

-- Disable RLS for admin logging (handled by server-side admin client)
ALTER TABLE usage_logs DISABLE ROW LEVEL SECURITY;
