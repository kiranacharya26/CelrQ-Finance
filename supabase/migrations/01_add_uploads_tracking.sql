-- Create uploads table to track file history
create table public.uploads (
  id uuid not null default gen_random_uuid (),
  user_email text not null,
  file_name text not null,
  bank_name text not null,
  upload_date timestamp with time zone not null default now(),
  transaction_count integer not null default 0,
  status text not null default 'completed',
  constraint uploads_pkey primary key (id)
);

-- Add upload_id to transactions table
alter table public.transactions
add column upload_id uuid references public.uploads (id) on delete cascade;

-- Enable RLS on uploads
alter table public.uploads enable row level security;

-- Policy for uploads
create policy "Users can view their own uploads" on public.uploads
  for select using (auth.jwt() ->> 'email' = user_email);

create policy "Users can insert their own uploads" on public.uploads
  for insert with check (auth.jwt() ->> 'email' = user_email);

create policy "Users can delete their own uploads" on public.uploads
  for delete using (auth.jwt() ->> 'email' = user_email);
