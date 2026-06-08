# VolleyMaps

A web app for finding pickup and drop-in volleyball games (beach + indoor) on an interactive map. Organizers opt in to be listed. Monetization planned via featured listings.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — Postgres, RLS, hosted on Supabase cloud
- **MapLibre GL JS** + CartoDB Voyager tiles — free, no API key needed
- **shadcn/ui** + Tailwind CSS
- **Vercel** — Next.js hosting

## Env vars

Copy `.env.local.example` → `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`

Falls back to mock data (`lib/mock-data.ts`) when env var is not set.

## Supabase setup

Schema: `mdfiles/supabase-schema.sql` — run in Supabase SQL Editor.

Seed: `node scripts/seed-supabase.mjs <project-url> <service-role-key>`

## Tables

- **venues** — name, type (beach/grass/indoor), address, city, lat, lng, slug, approved, website, photo_url
- **game_sessions** — venue_id, title, day_of_week (0=Sun), specific_date, start_time, end_time, recurring, skill_level, notes, contact_link, featured
- **submissions** — name, email, venue_name, address, city, type, website, schedule, contact_link, status (pending/approved/rejected)

## Project structure

```
app/
  page.tsx                 — homepage (server, fetches venues + sessions)
  layout.tsx               — header + root layout
  venues/[slug]/page.tsx   — venue detail + full schedule
  add-your-game/page.tsx   — submission form (writes to PocketBase submissions)

components/
  HomeClient.tsx           — client shell (typeFilter state, mobile drawer)
  Map.tsx                  — MapLibre map with venue pins (client, ssr: false)
  VenuePopover.tsx         — card shown when a map pin is clicked
  LiveFeed.tsx             — today's sessions sidebar (client)
  GameCard.tsx             — individual session card (live/soon badges)
  Filters.tsx              — beach / indoor / all toggle

lib/
  pocketbase.ts            — PocketBase client
  mapbox.ts                — CartoDB tile URL + Toronto center coords
  sessions.ts              — getTodaysSessions, isLiveNow, isStartingSoon (Toronto timezone)
  mock-data.ts             — fallback data when PocketBase not configured

types/index.ts             — Venue, GameSession, Filters interfaces

scripts/
  setup-pocketbase.mjs     — creates collections
  set-rules.mjs            — sets access rules
  seed-pocketbase.mjs      — seeds real Toronto venues
```

## Design

"Court Lights" dark theme — warm charcoal bg, amber/gold primary, Mikasa volleyball colors.
- Beach pins: amber `oklch(0.82 0.17 75)`
- Indoor pins: cobalt `oklch(0.52 0.23 263)`
- Live badge: green `oklch(0.68 0.21 145)`
- Soon badge: yellow `oklch(0.87 0.19 105)`
- Fonts: Barlow Condensed (display) + DM Sans (body)

## Current status

- [x] Full UI built — map, live feed, filters, mobile drawer, venue detail
- [x] Supabase schema + 9 venues / 16 sessions seeded
- [x] Submission form wired to Supabase submissions table
- [x] RLS policies set (public read approved venues + sessions, public insert submissions)
- [x] Deployed on Vercel at https://volleymaps.vercel.app/ with real data
- [x] GitHub: https://github.com/nimobenne/volleymaps

## Next up

- Phase 2: organizer portal (Supabase Auth)
- Phase 2: admin approval flow for submissions
- Phase 3: featured listings + Stripe

---

## Keep This File Updated

At the end of every session, update this file to reflect what changed:
- Current status and completed work
- New decisions, files, or architecture changes
- Remove anything no longer accurate
- Refresh what's next / pending

This file is Claude's primary context for this project. Keep it current.
