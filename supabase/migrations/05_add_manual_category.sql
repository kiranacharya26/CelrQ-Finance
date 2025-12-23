-- Add is_manual_category flag to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_manual_category boolean DEFAULT false;
