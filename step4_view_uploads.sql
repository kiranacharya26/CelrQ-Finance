-- ============================================
-- STEP 4: View current uploads (if any)
-- ============================================

-- Check how many uploads exist
SELECT COUNT(*) as total_uploads FROM uploads;

-- View all uploads
SELECT 
    id,
    user_email,
    file_name,
    bank_name,
    transaction_count,
    upload_date,
    status,
    file_hash
FROM uploads 
ORDER BY upload_date DESC 
LIMIT 20;
