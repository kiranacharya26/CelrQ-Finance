-- ============================================
-- DIAGNOSTIC & FIX SCRIPT FOR UPLOADS TABLE
-- ============================================
-- Run this in Supabase SQL Editor to diagnose and fix upload history issues

-- 1. Check if uploads table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'uploads'
) as uploads_table_exists;

-- 2. If table exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'uploads'
ORDER BY ordinal_position;

-- 3. Check if there are any uploads in the table
SELECT COUNT(*) as total_uploads FROM uploads;

-- 4. View all uploads (if any exist)
SELECT * FROM uploads ORDER BY upload_date DESC LIMIT 10;

-- 5. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'uploads';

-- ============================================
-- FIX: Create uploads table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_hash TEXT,
    bank_name TEXT NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'completed'
);

-- Disable RLS (API handles authorization)
ALTER TABLE uploads DISABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_uploads_user_email ON uploads(user_email);
CREATE INDEX IF NOT EXISTS idx_uploads_file_hash ON uploads(file_hash);

-- ============================================
-- FIX: Add upload_id column to transactions if missing
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'upload_id'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_transactions_upload_id ON transactions(upload_id);
    END IF;
END $$;

-- ============================================
-- VERIFICATION: Check everything is set up
-- ============================================
SELECT 
    'uploads table' as item,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'uploads') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

SELECT 
    'upload_id column in transactions' as item,
    CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'upload_id') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;
