-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,
    email TEXT NOT NULL,
    amount NUMERIC,
    status TEXT NOT NULL, -- 'PENDING', 'PAID', 'SUCCESS', 'FAILED', 'TRIAL_STARTED'
    order_id TEXT,
    payment_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;

-- Re-create Policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT
    USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT
    WITH CHECK (email = auth.jwt() ->> 'email');

-- Create uploads table if it doesn't exist (used for trial logic)
CREATE TABLE IF NOT EXISTS uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    filename TEXT,
    file_url TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for uploads
DROP POLICY IF EXISTS "Users can view their own uploads" ON uploads;

-- Re-create Policy for uploads
CREATE POLICY "Users can view their own uploads" ON uploads
    FOR SELECT
    USING (user_email = auth.jwt() ->> 'email');
