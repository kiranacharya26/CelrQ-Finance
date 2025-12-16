-- ============================================
-- STEP 2: Add missing columns to uploads table
-- ============================================

-- Add file_hash column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'uploads' AND column_name = 'file_hash'
    ) THEN
        ALTER TABLE uploads ADD COLUMN file_hash TEXT;
        CREATE INDEX IF NOT EXISTS idx_uploads_file_hash ON uploads(file_hash);
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'uploads' AND column_name = 'status'
    ) THEN
        ALTER TABLE uploads ADD COLUMN status TEXT DEFAULT 'completed';
    END IF;
END $$;

-- Ensure upload_date has a default
DO $$ 
BEGIN
    ALTER TABLE uploads 
    ALTER COLUMN upload_date SET DEFAULT NOW();
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Disable RLS (API handles authorization)
ALTER TABLE uploads DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_uploads_user_email ON uploads(user_email);

-- Verify the structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'uploads'
ORDER BY ordinal_position;
