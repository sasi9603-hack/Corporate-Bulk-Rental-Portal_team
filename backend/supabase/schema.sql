-- ============================================================
-- Corporate Bulk Rental Portal — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (linked to auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- COMPANIES
-- ============================================================
create table if not exists companies (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  contact_person text not null,
  email text not null,
  phone text not null,
  address text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- DEVICES (Inventory)
-- ============================================================
create table if not exists devices (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null check (category in ('Laptop', 'Desktop', 'Monitor', 'Projector', 'Printer')),
  available_quantity integer not null default 0,
  daily_price numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- Seed default devices
insert into devices (name, category, available_quantity, daily_price) values
  ('Dell Latitude 5520', 'Laptop', 50, 500),
  ('HP EliteBook 840', 'Laptop', 40, 450),
  ('Lenovo ThinkPad E15', 'Laptop', 30, 400),
  ('Dell OptiPlex 7080', 'Desktop', 25, 350),
  ('HP ProDesk 400', 'Desktop', 20, 300),
  ('Dell UltraSharp 24"', 'Monitor', 60, 150),
  ('LG 27" IPS Monitor', 'Monitor', 45, 180),
  ('Epson EB-X51 Projector', 'Projector', 15, 800),
  ('BenQ MH733 Projector', 'Projector', 10, 1000),
  ('HP LaserJet Pro M404', 'Printer', 20, 300),
  ('Canon PIXMA G3010', 'Printer', 15, 250)
on conflict do nothing;

-- ============================================================
-- RENTAL REQUESTS
-- ============================================================
create table if not exists rental_requests (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade,
  event_name text not null,
  start_date date not null,
  end_date date not null,
  delivery_location text not null,
  notes text,
  status text not null default 'Pending' check (status in (
    'Pending', 'Under Review', 'Quoted', 'Approved', 'Allocated', 'Delivered', 'Completed', 'Rejected'
  )),
  created_at timestamptz default now()
);

-- ============================================================
-- REQUEST ITEMS
-- ============================================================
create table if not exists request_items (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references rental_requests(id) on delete cascade,
  device_id uuid references devices(id) on delete set null,
  quantity integer not null default 1
);

-- ============================================================
-- QUOTATIONS
-- ============================================================
create table if not exists quotations (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references rental_requests(id) on delete cascade unique,
  total_amount numeric(12,2) not null default 0,
  quotation_notes text,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Approved', 'Rejected')),
  created_at timestamptz default now()
);

-- ============================================================
-- STATUS HISTORY
-- ============================================================
create table if not exists status_history (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references rental_requests(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  admin_note text,
  changed_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table companies enable row level security;
alter table devices enable row level security;
alter table rental_requests enable row level security;
alter table request_items enable row level security;
alter table quotations enable row level security;
alter table status_history enable row level security;

-- Helper function: check if current user is admin
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- PROFILES policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (is_admin());
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- COMPANIES policies
create policy "Anyone can insert company" on companies for insert with check (true);
create policy "Admins can view all companies" on companies for select using (is_admin());
create policy "Admins can update companies" on companies for update using (is_admin());

-- DEVICES policies
create policy "Anyone can view devices" on devices for select using (true);
create policy "Admins can manage devices" on devices for all using (is_admin());

-- RENTAL REQUESTS policies
create policy "Anyone can insert request" on rental_requests for insert with check (true);
create policy "Admins can view all requests" on rental_requests for select using (is_admin());
create policy "Admins can update requests" on rental_requests for update using (is_admin());

-- REQUEST ITEMS policies
create policy "Anyone can insert items" on request_items for insert with check (true);
create policy "Admins can view all items" on request_items for select using (is_admin());
create policy "Admins can manage items" on request_items for all using (is_admin());

-- QUOTATIONS policies
create policy "Admins can manage quotations" on quotations for all using (is_admin());

-- STATUS HISTORY policies
create policy "Admins can manage history" on status_history for all using (is_admin());
create policy "Anyone can insert history" on status_history for insert with check (true);

-- ============================================================
-- STORAGE: Quotation PDFs
-- ============================================================
-- Run these in Supabase Storage section or SQL:
-- insert into storage.buckets (id, name, public) values ('quotations', 'quotations', false);
