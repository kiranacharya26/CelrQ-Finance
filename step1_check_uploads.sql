-- ============================================
-- STEP 1: Check current state
-- ============================================
-- Run this first to see what exists
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'uploads'
ORDER BY ordinal_position;
