-- Migration 004: donor-landing redesign
-- Apply to staging first, then production.
-- DDL must be pasted in Supabase SQL Editor (service role key cannot run DDL via REST).
-- DML (UPDATE/INSERT) can be run via REST API.

-- ─── projects: phase columns ────────────────────────────────────────────────
alter table projects add column if not exists phase smallint check (phase between 1 and 3);
alter table projects add column if not exists phase1_note jsonb;
alter table projects add column if not exists phase2_note jsonb;
alter table projects add column if not exists phase2_pct smallint check (phase2_pct between 0 and 100);
alter table projects add column if not exists phase3_note jsonb;
alter table projects add column if not exists phase3_complete boolean default false;
alter table projects add column if not exists annual_diverted_kg numeric(12,2);
alter table projects add column if not exists annual_diverted_year smallint;

-- ─── metrics: stat strip columns ────────────────────────────────────────────
alter table metrics add column if not exists member_businesses int;
alter table metrics add column if not exists recyclable_pct smallint;
alter table metrics add column if not exists taiwan_volunteer_turnouts int;

-- ─── partners: innit-resort ──────────────────────────────────────────────────
insert into partners (slug, name)
values ('innit-resort', 'Innit Resort')
on conflict (slug) do nothing;

-- ─── projects: Ekas seed row ────────────────────────────────────────────────
insert into projects (slug, name, partner_slug, location, status, category, kpis, raised, goal, image_url, since_year, phase, phase1_note, phase2_pct, phase2_note)
values (
  'ekas', 'Ekas Station', 'innit-resort', 'South Lombok',
  'Just Launched', 'Sorting Stations', '[]', 0, 0,
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=70', '2026',
  1,
  '{"zh": "與當地 Homestay 社群合作中", "en": "Working with the local homestay community"}',
  30,
  '{"zh": "建站籌備中", "en": "Station in preparation"}'
)
on conflict (slug) do nothing;

-- ─── projects: phase data for existing 4 stations ───────────────────────────
update projects set
  phase = 3,
  phase3_complete = true,
  phase1_note = '{"zh": "清潔隊運作中", "en": "Crew operating"}',
  phase2_note = '{"zh": "常設分類站啟用", "en": "Permanent station live"}',
  phase3_note = '{"zh": "43% 可回收垃圾", "en": "43% recyclable"}',
  annual_diverted_kg = 276731,
  annual_diverted_year = 2025
where slug = 'selong-belanak';

update projects set
  phase = 2,
  phase1_note = '{"zh": "與當地組織 GPS_ggi 合作", "en": "Partnered with local group GPS_ggi"}',
  phase2_pct = 52,
  phase2_note = '{"zh": "募資中，已部放 100 個垃圾桶", "en": "Fundraising · 100 bins already deployed"}'
where slug = 'gili-gede';

update projects set
  phase = 2,
  phase1_note = '{"zh": "清潔隊運作中", "en": "Crew operating"}',
  phase2_pct = 32,
  phase2_note = '{"zh": "建站籌備中", "en": "Station in preparation"}'
where slug = 'awang';

update projects set
  phase = 2,
  phase1_note = '{"zh": "清潔隊運作中", "en": "Crew operating"}',
  phase2_pct = 26,
  phase2_note = '{"zh": "建站籌備中", "en": "Station in preparation"}'
where slug = 'mawun';

-- ─── metrics: stat strip values ─────────────────────────────────────────────
update metrics set
  member_businesses = 76,
  recyclable_pct = 43,
  taiwan_volunteer_turnouts = 2000
where id = (select id from metrics order by updated_at desc limit 1);
