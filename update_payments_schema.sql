-- Add missing columns to payments table to support verification logic
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Ensure order_id is unique for upsert to work
ALTER TABLE payments ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);
