-- Drop existing policies
drop policy if exists "Users can view own uploads" on uploads;
drop policy if exists "Users can insert own uploads" on uploads;
drop policy if exists "Users can delete own uploads" on uploads;

-- Disable RLS temporarily to allow API access
-- The API route will handle authorization by checking user_email
alter table uploads disable row level security;

-- Alternative: If you want to keep RLS enabled, you would need to:
-- 1. Use a service role key in the API (not recommended for client-side exposure)
-- 2. Or create policies that allow anon access based on user_email matching
-- For now, we disable RLS since the API validates user_email from the session
