-- Add ai_category column to track initial AI guesses for accuracy monitoring
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ai_category TEXT;

-- Update existing rows to have ai_category match category (as a baseline)
UPDATE transactions SET ai_category = category WHERE ai_category IS NULL;
