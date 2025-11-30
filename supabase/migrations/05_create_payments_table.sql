-- Create payments table for tracking Cashfree payment status
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    payment_id TEXT,
    user_id TEXT NOT NULL,
    email TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL, -- PAID, PENDING, FAILED, etc.
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- Store additional Cashfree webhook data
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own payments
CREATE POLICY "Users can view their own payments"
    ON payments
    FOR SELECT
    USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = email);

-- Create policy to allow service role to insert/update payments (for webhooks)
CREATE POLICY "Service role can manage all payments"
    ON payments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON payments TO service_role;
GRANT SELECT ON payments TO authenticated;
