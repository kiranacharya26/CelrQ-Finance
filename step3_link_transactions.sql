-- ============================================
-- STEP 3: Add upload_id to transactions table
-- ============================================

-- Add upload_id column to transactions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'upload_id'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_transactions_upload_id ON transactions(upload_id);
    END IF;
END $$;

-- Verify
SELECT 
    'upload_id in transactions' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'upload_id'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;
