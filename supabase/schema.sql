-- WaveNova Database Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com → SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists partners (
  slug text primary key,
  name text not null,
  description text,
  logo_url text,
  website text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  partner_slug text not null references partners(slug) on delete cascade,
  location text not null,
  status text not null check (status in ('Operational', 'Just Launched', 'Launching May')),
  category text not null check (category in ('Sorting Stations', 'Waste Management')),
  kpis jsonb not null default '[]',
  raised numeric(10,2) not null default 0,
  goal numeric(10,2) not null default 5000,
  image_url text not null,
  since_year text,
  description text,
  created_at timestamptz default now()
);

create table if not exists donors (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now(),
  total_donated numeric(10,2) not null default 0,
  total_kg_removed numeric(10,2) not null default 0
);

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references donors(id) on delete set null,
  project_slug text not null references projects(slug) on delete restrict,
  amount_usd numeric(10,2) not null,
  frequency text not null check (frequency in ('one-time', 'monthly')),
  reference_code text unique not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  tip_amount numeric(10,2) not null default 0,
  donor_name text,
  donor_email text not null,
  created_at timestamptz default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  station_name text not null,
  action_text text not null,
  created_at timestamptz default now()
);

create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  total_kg numeric(12,2) not null default 0,
  active_stations int not null default 0,
  workers_employed int not null default 0,
  households_served int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null check (role in ('admin', 'partner')),
  partner_slug text references partners(slug) on delete set null,
  created_at timestamptz default now()
);

create table if not exists funds (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null references projects(slug) on delete cascade,
  name text not null,
  description text,
  goal numeric(10,2) not null,
  raised numeric(10,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table partners enable row level security;
alter table projects enable row level security;
alter table donors enable row level security;
alter table donations enable row level security;
alter table activities enable row level security;
alter table metrics enable row level security;
alter table funds enable row level security;
alter table user_roles enable row level security;
-- user_roles: no public read — service role only (accessed via API routes)

create policy "Funds are publicly readable" on funds for select using (true);

create policy "Partners are publicly readable" on partners for select using (true);

-- Projects, activities, metrics: public read
create policy "Projects are publicly readable" on projects for select using (true);
create policy "Activities are publicly readable" on activities for select using (true);
create policy "Metrics are publicly readable" on metrics for select using (true);

-- Donors: only the donor can read their own record (matched by email via auth)
create policy "Donors can read own record" on donors for select using (auth.jwt() ->> 'email' = email);

-- Donations: public insert (anyone can submit a donation), donors read their own
create policy "Anyone can insert donations" on donations for insert with check (true);
create policy "Donors can read own donations" on donations for select using (donor_email = auth.jwt() ->> 'email');

-- Storage: project-images bucket
-- Create via Dashboard: Storage → New Bucket → "project-images" → Public ON
-- Then run these policies:
create policy "Public read project images"
  on storage.objects for select
  using (bucket_id = 'project-images');

create policy "Authenticated users can upload project images"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Projects
insert into projects (slug, name, partner, location, status, category, kpis, raised, goal, image_url, since_year, description) values
(
  'general',
  'WaveNova General Fund',
  'WaveNova',
  'Lombok, Indonesia',
  'Operational',
  'Sorting Stations',
  '["Flexible allocation", "Highest impact", "All stations"]',
  0, 10000,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
  '2026',
  'Donations to the General Fund are allocated by the WaveNova team to where they are needed most across all active projects and stations.'
),
(
  'selong-belanak',
  'Selong Belanak Station',
  'SBCA',
  'South Lombok',
  'Operational',
  'Sorting Stations',
  '["5 years running", "12,400 KG", "4 workers"]',
  3200, 5000,
  'https://images.unsplash.com/photo-1582721478779-0ae163c05a60?w=800&q=70',
  '2021',
  'The original Blue Loop station — WaveNova''s Chapter 1. SBCA (Selong Belanak Community Association) has been collecting, sorting, and selling plastic waste from South Lombok''s beaches for 5 years. The station currently needs a facility upgrade to handle growing collection volume.'
),
(
  'mawun',
  'Mawun Station',
  'Eco Mawun',
  'South Lombok',
  'Just Launched',
  'Sorting Stations',
  '["New station", "3 workers", "2026"]',
  800, 4000,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
  '2026',
  'A brand-new sorting station at Mawun beach, operated by the Eco Mawun team. Just launched in early 2026, this station expands the network to one of South Lombok''s most visited beaches.'
),
(
  'awang',
  'Awang Station',
  'Eco Mawun',
  'South Lombok',
  'Launching May',
  'Sorting Stations',
  '["Beach cleanup May 6", "Sea waste", "Boats"]',
  400, 4500,
  'https://images.unsplash.com/photo-1473625247510-8ceb1760943f?w=800&q=70',
  '2026',
  'Kicking off May 6, 2026 with a major beach cleanup event, followed by the setup of a new sorting station in Awang. Eco Mawun will use boats to collect sea waste from this bay-side location.'
),
(
  'gili-gede',
  'Gili Gede Station',
  'GPS_ggi + Marina Del Ray',
  'West Lombok',
  'Launching May',
  'Sorting Stations',
  '["Island station", "Sea collection", "Early May"]',
  600, 5500,
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=70',
  '2026',
  'An island-based sorting station on Gili Gede, fostered in partnership with Marina Del Ray. GPS_ggi (a local NGO) operates on the ground, collecting plastic from the island''s beaches and surrounding waters.'
),
(
  'kuta-honest-impact',
  'Honest Impact — Kuta',
  'Honest Made',
  'Central Lombok',
  'Operational',
  'Waste Management',
  '["Daily sweepers", "River barriers", "Residential"]',
  4200, 6000,
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=70',
  '2021',
  'The social arm of Honest Made, housed under WaveNova''s Yayasan. Honest Impact runs daily road sweepers in Kuta, river barriers intercepting plastic before it reaches the ocean, and residential waste collection diverted from landfill. Their upcycled product line (keyrings, water bottles) features QR codes linking to live impact data.'
)
on conflict (slug) do nothing;

-- Metrics (initial values)
insert into metrics (total_kg, active_stations, workers_employed, households_served)
values (47823, 5, 18, 340)
on conflict do nothing;

-- Activities (initial feed)
insert into activities (station_name, action_text, created_at) values
('Selong Belanak', 'purchased 420 KG this week', now() - interval '2 days'),
('Honest Impact', 'river barrier intercepted 180 KG', now() - interval '3 days'),
('Mawun', 'first station collection — 95 KG', now() - interval '5 days'),
('SBCA upgrade', 'facility upgrade 60% funded', now() - interval '7 days')
on conflict do nothing;
