-- Create bank_connections table for tracking linked bank accounts
create table if not exists bank_connections (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  bank_name text not null,
  account_number_masked text, -- Last 4 digits only
  account_type text, -- savings, current, credit_card
  connection_status text default 'pending', -- pending, active, disconnected, error
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  provider text default 'manual', -- manual, setu, plaid
  provider_account_id text, -- External ID from provider
  unique(user_email, bank_name, account_number_masked)
);

-- Index for fast lookups
create index if not exists bank_connections_user_email_idx on bank_connections(user_email);
create index if not exists bank_connections_status_idx on bank_connections(connection_status);

-- Disable RLS for now (API handles auth)
alter table bank_connections disable row level security;
