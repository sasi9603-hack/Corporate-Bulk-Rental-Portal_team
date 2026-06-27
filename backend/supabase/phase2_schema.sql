-- ============================================================
-- PHASE 2 SCHEMA ADDITIONS
-- Run this in Supabase SQL Editor AFTER schema.sql and schema_addendum.sql
-- ============================================================

-- 1. KYC Documents
create table if not exists kyc_documents (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  document_type text not null check (document_type in ('GSTIN', 'Company_PAN', 'Trade_License', 'Aadhar_Corp')),
  document_url text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Verified', 'Rejected')),
  rejection_reason text,
  created_at timestamptz default now()
);

-- 2. Rental Agreements
create table if not exists rental_agreements (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references rental_requests(id) on delete cascade unique,
  agreement_url text,
  signed_by_name text,
  signed_by_email text,
  signed_at timestamptz,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Signed')),
  created_at timestamptz default now()
);

-- 3. Logistics (Delivery & Pickup Trips)
create table if not exists logistics_trips (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references rental_requests(id) on delete cascade,
  trip_type text not null check (trip_type in ('Delivery', 'Pickup')),
  scheduled_date date not null,
  assigned_agent text,
  vehicle_details text,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'In Transit', 'Completed', 'Failed')),
  delivery_notes text,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- 4. Returns Log
create table if not exists returns_log (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references rental_requests(id) on delete cascade,
  returned_at timestamptz default now(),
  notes text,
  inspected_by uuid references auth.users(id),
  status text not null default 'Pending' check (status in ('Pending', 'Completed'))
);

-- 5. Return Items (Track condition & quantities)
create table if not exists return_items (
  id uuid default uuid_generate_v4() primary key,
  return_id uuid references returns_log(id) on delete cascade,
  device_id uuid references devices(id) on delete set null,
  quantity_good integer not null default 0,
  quantity_damaged integer not null default 0,
  damage_notes text
);

-- 6. Damage Claims (Financial claims for repairs)
create table if not exists damage_claims (
  id uuid default uuid_generate_v4() primary key,
  return_id uuid references returns_log(id) on delete cascade,
  claim_amount numeric(10,2) not null,
  description text not null,
  photo_urls text[] default '{}',
  status text not null default 'Pending' check (status in ('Pending', 'Paid', 'Disputed', 'Waived')),
  created_at timestamptz default now()
);

-- 7. Device Maintenance & Repairs
create table if not exists maintenance_logs (
  id uuid default uuid_generate_v4() primary key,
  device_id uuid references devices(id) on delete cascade,
  damage_claim_id uuid references damage_claims(id) on delete set null,
  quantity integer not null default 1,
  issue_description text not null,
  repair_cost numeric(10,2) default 0,
  status text not null default 'In Repair' check (status in ('In Repair', 'Completed', 'Scrapped')),
  logged_at timestamptz default now(),
  resolved_at timestamptz
);

-- 8. Support Tickets & Real-Time Chat
create table if not exists support_tickets (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references auth.users(id) on delete cascade,
  subject text not null,
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'Closed')),
  created_at timestamptz default now()
);

create table if not exists support_messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references support_tickets(id) on delete cascade,
  sender_id uuid references auth.users(id),
  message_text text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) FOR PHASE 2 TABLES
-- ============================================================

-- Enable RLS on all new tables
alter table kyc_documents enable row level security;
alter table rental_agreements enable row level security;
alter table logistics_trips enable row level security;
alter table returns_log enable row level security;
alter table return_items enable row level security;
alter table damage_claims enable row level security;
alter table maintenance_logs enable row level security;
alter table support_tickets enable row level security;
alter table support_messages enable row level security;

-- 1. KYC Documents
-- Clients can insert and view their own documents
create policy "Clients can view own KYC docs" on kyc_documents
  for select using (auth.uid() = uploaded_by);
create policy "Clients can insert own KYC docs" on kyc_documents
  for insert with check (auth.uid() = uploaded_by);
create policy "Admins can manage all KYC docs" on kyc_documents
  for all using (is_admin());

-- 2. Rental Agreements
-- Clients can view agreements for their own requests
create policy "Clients can view own agreements" on rental_agreements
  for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = rental_agreements.request_id
      and rental_requests.user_id = auth.uid()
    )
  );
-- Clients can update agreements (to sign them)
create policy "Clients can sign agreements" on rental_agreements
  for update using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = rental_agreements.request_id
      and rental_requests.user_id = auth.uid()
    )
  );
create policy "Admins can manage agreements" on rental_agreements
  for all using (is_admin());

-- 3. Logistics, Returns, Damage, Maintenance
-- Mostly Admin managed. Clients can view logistics/returns related to their requests.
create policy "Admins can manage logistics" on logistics_trips for all using (is_admin());
create policy "Admins can manage returns_log" on returns_log for all using (is_admin());
create policy "Admins can manage return_items" on return_items for all using (is_admin());
create policy "Admins can manage damage_claims" on damage_claims for all using (is_admin());
create policy "Admins can manage maintenance_logs" on maintenance_logs for all using (is_admin());

create policy "Clients can view own logistics" on logistics_trips
  for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = logistics_trips.request_id
      and rental_requests.user_id = auth.uid()
    )
  );

create policy "Clients can view own returns" on returns_log
  for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = returns_log.request_id
      and rental_requests.user_id = auth.uid()
    )
  );

create policy "Clients can view own damage claims" on damage_claims
  for select using (
    exists (
      select 1 from returns_log
      join rental_requests on rental_requests.id = returns_log.request_id
      where returns_log.id = damage_claims.return_id
      and rental_requests.user_id = auth.uid()
    )
  );

-- 4. Support Tickets & Messages
-- Clients can manage their own tickets and send messages
create policy "Clients can view own tickets" on support_tickets
  for select using (auth.uid() = client_id);
create policy "Clients can insert own tickets" on support_tickets
  for insert with check (auth.uid() = client_id);

create policy "Clients can view own messages" on support_messages
  for select using (
    exists (
      select 1 from support_tickets
      where support_tickets.id = support_messages.ticket_id
      and support_tickets.client_id = auth.uid()
    )
  );
create policy "Clients can insert messages to own tickets" on support_messages
  for insert with check (
    exists (
      select 1 from support_tickets
      where support_tickets.id = support_messages.ticket_id
      and support_tickets.client_id = auth.uid()
    )
    and auth.uid() = sender_id
  );

create policy "Admins can manage support tickets" on support_tickets for all using (is_admin());
create policy "Admins can manage support messages" on support_messages for all using (is_admin());
