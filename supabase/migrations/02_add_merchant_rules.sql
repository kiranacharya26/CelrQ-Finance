-- Create merchant_rules table for "The Memory Bank" feature
create table if not exists merchant_rules (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  keyword text not null,
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_email, keyword)
);

-- Index for fast lookups
create index if not exists merchant_rules_user_email_idx on merchant_rules(user_email);

-- Note: RLS is not enabled by default to allow the API route (which uses anon key) to access it.
-- If you enable RLS, ensure you have policies that allow access based on user_email or use a service role key in the API.
