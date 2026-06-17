-- ============================================================
-- ADDENDUM: Add user_id to rental_requests for client auth
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Add user_id column to rental_requests
alter table rental_requests
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Update RLS: clients can see only their own requests
drop policy if exists "Clients can view own requests" on rental_requests;
create policy "Clients can view own requests" on rental_requests
  for select using (auth.uid() = user_id);

-- Clients can insert their own requests (with user_id = auth.uid())
drop policy if exists "Clients can insert own requests" on rental_requests;
create policy "Clients can insert own requests" on rental_requests
  for insert with check (auth.uid() = user_id OR auth.uid() IS NULL);

-- Clients can view request items for their own requests
drop policy if exists "Clients can view own request items" on request_items;
create policy "Clients can view own request items" on request_items
  for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = request_items.request_id
      and rental_requests.user_id = auth.uid()
    )
  );

-- Clients can view their own quotations
drop policy if exists "Clients can view own quotations" on quotations;
create policy "Clients can view own quotations" on quotations
  for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = quotations.request_id
      and rental_requests.user_id = auth.uid()
    )
  );

-- Clients can view status history for their own requests
drop policy if exists "Clients can view own status history" on status_history;
create policy "Clients can view own status history" on status_history
  for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = status_history.request_id
      and rental_requests.user_id = auth.uid()
    )
  );

-- Clients can view their own companies
drop policy if exists "Clients can view own company" on companies;
create policy "Clients can view own company" on companies
  for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.company_id = companies.id
      and rental_requests.user_id = auth.uid()
    )
  );
