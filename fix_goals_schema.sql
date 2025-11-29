-- Run this in your Supabase SQL Editor to fix the "Error saving goal" issue
-- The error occurs because the 'goals' table is missing these columns

ALTER TABLE goals ADD COLUMN IF NOT EXISTS type text DEFAULT 'savings';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS color text DEFAULT 'teal';
