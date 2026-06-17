-- ============================================================
-- CORPORATE BULK RENTAL PORTAL — FULL DATABASE RESET
-- ============================================================
-- Run this entire script in Supabase SQL Editor
-- It will DROP everything and rebuild from scratch
-- ============================================================


-- ============================================================
-- STEP 1: DROP ALL EXISTING TABLES (in reverse dependency order)
-- ============================================================

drop table if exists status_history cascade;
drop table if exists quotations cascade;
drop table if exists request_items cascade;
drop table if exists rental_requests cascade;
drop table if exists devices cascade;
drop table if exists companies cascade;
drop table if exists profiles cascade;


-- ============================================================
-- STEP 2: DROP EXISTING TRIGGERS & FUNCTIONS
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;


-- ============================================================
-- STEP 3: ENABLE UUID EXTENSION
-- ============================================================

create extension if not exists "uuid-ossp";


-- ============================================================
-- STEP 4: CREATE TABLES
-- ============================================================

-- PROFILES (linked to auth.users)
create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text,
  full_name   text,
  role        text not null default 'client' check (role in ('admin', 'client')),
  created_at  timestamptz default now()
);

-- COMPANIES
create table companies (
  id            uuid default uuid_generate_v4() primary key,
  company_name  text not null,
  contact_person text not null,
  email         text not null,
  phone         text not null,
  address       text not null,
  created_at    timestamptz default now()
);

-- DEVICES (Inventory)
create table devices (
  id                 uuid default uuid_generate_v4() primary key,
  name               text not null,
  category           text not null check (category in ('Laptop', 'Desktop', 'Monitor', 'Projector', 'Printer')),
  available_quantity integer not null default 0,
  daily_price        numeric(10,2) not null default 0,
  created_at         timestamptz default now()
);

-- RENTAL REQUESTS
create table rental_requests (
  id                uuid default uuid_generate_v4() primary key,
  company_id        uuid references companies(id) on delete cascade,
  user_id           uuid references auth.users(id) on delete set null,
  event_name        text not null,
  start_date        date not null,
  end_date          date not null,
  delivery_location text not null,
  notes             text,
  status            text not null default 'Pending' check (status in (
                      'Pending', 'Under Review', 'Quoted', 'Approved',
                      'Allocated', 'Delivered', 'Completed', 'Rejected'
                    )),
  created_at        timestamptz default now()
);

-- REQUEST ITEMS
create table request_items (
  id          uuid default uuid_generate_v4() primary key,
  request_id  uuid references rental_requests(id) on delete cascade,
  device_id   uuid references devices(id) on delete set null,
  quantity    integer not null default 1
);

-- QUOTATIONS
create table quotations (
  id               uuid default uuid_generate_v4() primary key,
  request_id       uuid references rental_requests(id) on delete cascade unique,
  total_amount     numeric(12,2) not null default 0,
  quotation_notes  text,
  status           text not null default 'Draft' check (status in ('Draft', 'Sent', 'Approved', 'Rejected')),
  created_at       timestamptz default now()
);

-- STATUS HISTORY
create table status_history (
  id          uuid default uuid_generate_v4() primary key,
  request_id  uuid references rental_requests(id) on delete cascade,
  old_status  text,
  new_status  text not null,
  changed_by  uuid references auth.users(id) on delete set null,
  admin_note  text,
  changed_at  timestamptz default now()
);


-- ============================================================
-- STEP 5: TRIGGER — AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- STEP 6: HELPER FUNCTION — is_admin()
-- ============================================================

create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- ============================================================
-- STEP 7: ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles       enable row level security;
alter table companies      enable row level security;
alter table devices        enable row level security;
alter table rental_requests enable row level security;
alter table request_items  enable row level security;
alter table quotations     enable row level security;
alter table status_history enable row level security;


-- -------- PROFILES --------
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select using (is_admin());

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);


-- -------- COMPANIES --------
create policy "Anyone can insert company"
  on companies for insert with check (true);

create policy "Admins can view all companies"
  on companies for select using (is_admin());

create policy "Admins can update companies"
  on companies for update using (is_admin());

create policy "Clients can view own company"
  on companies for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.company_id = companies.id
      and rental_requests.user_id = auth.uid()
    )
  );


-- -------- DEVICES --------
create policy "Anyone can view devices"
  on devices for select using (true);

create policy "Admins can insert devices"
  on devices for insert with check (is_admin());

create policy "Admins can update devices"
  on devices for update using (is_admin());

create policy "Admins can delete devices"
  on devices for delete using (is_admin());


-- -------- RENTAL REQUESTS --------
create policy "Anyone can insert request"
  on rental_requests for insert with check (true);

create policy "Admins can view all requests"
  on rental_requests for select using (is_admin());

create policy "Admins can update requests"
  on rental_requests for update using (is_admin());

create policy "Clients can view own requests"
  on rental_requests for select
  using (auth.uid() = user_id);


-- -------- REQUEST ITEMS --------
create policy "Anyone can insert items"
  on request_items for insert with check (true);

create policy "Admins can view all items"
  on request_items for select using (is_admin());

create policy "Admins can manage items"
  on request_items for all using (is_admin());

create policy "Clients can view own request items"
  on request_items for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = request_items.request_id
      and rental_requests.user_id = auth.uid()
    )
  );


-- -------- QUOTATIONS --------
create policy "Admins can manage quotations"
  on quotations for all using (is_admin());

create policy "Admins can insert quotations"
  on quotations for insert with check (is_admin());

create policy "Clients can view own quotations"
  on quotations for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = quotations.request_id
      and rental_requests.user_id = auth.uid()
    )
  );


-- -------- STATUS HISTORY --------
create policy "Admins can manage history"
  on status_history for all using (is_admin());

create policy "Anyone can insert history"
  on status_history for insert with check (true);

create policy "Clients can view own status history"
  on status_history for select using (
    exists (
      select 1 from rental_requests
      where rental_requests.id = status_history.request_id
      and rental_requests.user_id = auth.uid()
    )
  );


-- ============================================================
-- STEP 8: SEED DEFAULT DEVICES (Inventory)
-- ============================================================

insert into devices (name, category, available_quantity, daily_price) values
  -- Laptops
  ('Dell Latitude 5520',        'Laptop',    50,  500.00),
  ('HP EliteBook 840 G8',       'Laptop',    40,  450.00),
  ('Lenovo ThinkPad E15',       'Laptop',    30,  400.00),
  ('Apple MacBook Air M2',      'Laptop',    20,  800.00),
  ('Asus VivoBook 15',          'Laptop',    35,  350.00),

  -- Desktops
  ('Dell OptiPlex 7080',        'Desktop',   25,  350.00),
  ('HP ProDesk 400 G7',         'Desktop',   20,  300.00),
  ('Lenovo ThinkCentre M70q',   'Desktop',   15,  320.00),

  -- Monitors
  ('Dell UltraSharp 24" U2422H','Monitor',   60,  150.00),
  ('LG 27" IPS 27BL650C',       'Monitor',   45,  180.00),
  ('Samsung 32" Curved CF396',  'Monitor',   30,  220.00),

  -- Projectors
  ('Epson EB-X51 XGA',          'Projector', 15,  800.00),
  ('BenQ MH733 Full HD',        'Projector', 10, 1000.00),
  ('Optoma HD146X 1080p',       'Projector',  8, 1200.00),

  -- Printers
  ('HP LaserJet Pro M404dn',    'Printer',   20,  300.00),
  ('Canon PIXMA G3010',         'Printer',   15,  250.00),
  ('Epson EcoTank L3150',       'Printer',   12,  280.00);


-- ============================================================
-- ✅ DONE — Database is ready!
-- ============================================================
-- Next steps:
--   1. Go to Authentication → Users → Create a new user
--   2. Go to Table Editor → profiles → set their role to 'admin'
--   3. That user can now login at /login and access /admin/*
-- ============================================================
