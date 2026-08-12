-- Migration 005: email_signups table for homepage subscription card
-- Apply to staging first (akirfftvtpnfudsaghej), then production.

create table if not exists email_signups (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null,
  source     text        not null default 'homepage_subscription_card',
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness: prevents duplicate sign-ups regardless of
-- how the email was originally typed.
create unique index if not exists email_signups_email_idx
  on email_signups (lower(email));
