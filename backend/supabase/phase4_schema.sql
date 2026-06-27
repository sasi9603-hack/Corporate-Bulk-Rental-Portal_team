-- ============================================================
-- PHASE 4 SCHEMA ADDITIONS (Invoices)
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists invoices (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references rental_requests(id) on delete cascade unique,
  invoice_number text not null unique,
  total_amount numeric(12,2) not null,
  due_date date not null,
  status text not null default 'Unpaid' check (status in ('Unpaid', 'Paid', 'Overdue', 'Cancelled')),
  created_at timestamptz default now()
);

alter table invoices enable row level security;

create policy "Admins can manage invoices" on invoices for all using (is_admin());

create policy "Clients can view own invoices" on invoices
  for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = invoices.request_id
      and rental_requests.user_id = auth.uid()
    )
  );
