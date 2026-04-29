# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local dev — next dev / turbopack hangs silently on this machine; always use:
npm run build && npm run start

# Type check only
npx tsc --noEmit

# Lint
npx eslint .
```

## Architecture

Next.js 16 App Router. All pages under `app/` are Server Components by default; interactive ones are marked `"use client"`.

**Rendering strategy:** The landing page (`app/page.tsx`) renders immediately with hardcoded fallback data (no server fetches at build time). Client components fetch live Supabase data after hydration. This avoids build-time DB dependency.

**Supabase clients — two separate files:**
- `lib/supabase.ts` — browser client (lazy singleton via Proxy, used in `"use client"` components)
- `lib/supabase-server.ts` — server client (called inside API routes only, uses service role key)

Both clients must be initialized lazily (inside functions, not at module level) — Next.js 16 static generation evaluates modules at build time and will crash if SDK constructors run without env vars.

**Auth flow:**
1. `supabase.auth.signInWithOAuth({ provider: 'google' })` with `redirectTo: ${origin}/auth/callback`
2. Supabase exchanges code → redirects to `app/auth/callback/page.tsx`
3. Callback exchanges code for session, then redirects to `next` query param

**Donation flow:**
1. User must be signed in (enforced client-side in `DonationSection.tsx`)
2. Form POSTs to `/api/donations` which writes to Supabase via server client
3. API returns bank transfer details — no automated email (removed for MVP)
4. Admin manually confirms donations; confirmation sets status → `confirmed` and calculates KG removed (1 USD = 0.5 KG)

**Key business logic:**
- `project_slug` on donations is a FK to `projects.slug` — the "general" slug must exist in the projects table
- Impact rate: 1 USD confirmed = 0.5 KG plastic removed (stored in `donors.total_kg_removed`)
- WaveNova retains 10–15% management fee; 85–90% goes to local operations

## Environment variables

Two Supabase projects — never mix them:

| Var | Production | Staging/Preview |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `ewkiunpxkemjfxlaaokx` | `akirfftvtpnfudsaghej` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod publishable key | staging publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod secret key | staging secret key |

**Critical:** `NEXT_PUBLIC_` vars must NOT be marked Sensitive in Vercel — they are inlined at build time and marking them sensitive prevents the value from being embedded in the client bundle.

## Database

Schema in `supabase/schema.sql`. Tables: `projects`, `donors`, `donations`, `activities`, `metrics`. All have RLS enabled.

To modify staging DB directly via REST API:
```bash
# Read .env.local for STAGING_SUPABASE_URL and STAGING_SUPABASE_SERVICE_ROLE_KEY
curl -X POST "$STAGING_SUPABASE_URL/rest/v1/table_name" \
  -H "apikey: $STAGING_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $STAGING_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

## Deployment

Three environments, one Vercel project:

```
feat/* → Preview (auto URL) → staging Supabase
staging → staging.wavenova.org → staging Supabase  
main    → wavenova.org         → production Supabase
```

**Before merging feat → staging:** run `/review`
**Before merging staging → main:** run `/security-review` then `/review`, confirm tested on staging.wavenova.org

DNS: `staging.wavenova.org` CNAME → `cname.vercel-dns.com` in Cloudflare, proxy OFF (grey cloud).
