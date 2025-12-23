-- Add missing processed_count column to uploads table
ALTER TABLE public.uploads 
ADD COLUMN IF NOT EXISTS processed_count integer NOT NULL DEFAULT 0;
