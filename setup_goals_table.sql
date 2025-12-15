-- Create goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'savings',
    target_amount NUMERIC DEFAULT 0,
    current_amount NUMERIC DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    category TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own goals
CREATE POLICY "Users can view their own goals" ON goals
    FOR SELECT
    USING (user_email = auth.jwt() ->> 'email');

-- Create policy to allow users to insert their own goals
CREATE POLICY "Users can insert their own goals" ON goals
    FOR INSERT
    WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Create policy to allow users to update their own goals
CREATE POLICY "Users can update their own goals" ON goals
    FOR UPDATE
    USING (user_email = auth.jwt() ->> 'email');

-- Create policy to allow users to delete their own goals
CREATE POLICY "Users can delete their own goals" ON goals
    FOR DELETE
    USING (user_email = auth.jwt() ->> 'email');
