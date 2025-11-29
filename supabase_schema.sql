-- 1. Create Transactions Table
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  date date not null,
  description text not null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  category text,
  merchant_name text,
  merchant_icon text,
  bank_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Goals Table
create table goals (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline date,
  icon text,
  color text,
  type text default 'savings',
  category text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table transactions enable row level security;
alter table goals enable row level security;

-- 4. RLS Policies for Transactions
-- Allow users to view ONLY their own transactions
create policy "Users can view their own transactions"
  on transactions for select
  using (auth.jwt() ->> 'email' = user_email);

-- Allow users to insert ONLY their own transactions
create policy "Users can insert their own transactions"
  on transactions for insert
  with check (auth.jwt() ->> 'email' = user_email);

-- Allow users to update ONLY their own transactions
create policy "Users can update their own transactions"
  on transactions for update
  using (auth.jwt() ->> 'email' = user_email);

-- Allow users to delete ONLY their own transactions
create policy "Users can delete their own transactions"
  on transactions for delete
  using (auth.jwt() ->> 'email' = user_email);


-- 5. RLS Policies for Goals
-- Allow users to view ONLY their own goals
create policy "Users can view their own goals"
  on goals for select
  using (auth.jwt() ->> 'email' = user_email);

-- Allow users to insert ONLY their own goals
create policy "Users can insert their own goals"
  on goals for insert
  with check (auth.jwt() ->> 'email' = user_email);

-- Allow users to update ONLY their own goals
create policy "Users can update their own goals"
  on goals for update
  using (auth.jwt() ->> 'email' = user_email);

-- Allow users to delete ONLY their own goals
create policy "Users can delete their own goals"
  on goals for delete
  using (auth.jwt() ->> 'email' = user_email);
