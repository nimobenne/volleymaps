# VolleyMaps

A web app for finding pickup and drop-in volleyball games (beach + indoor) on an interactive map. Organizers opt in to be listed. Monetization planned via featured listings.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **PocketBase** — open-source BaaS, SQLite, hosted on Fly.io (Toronto region `yyz`)
- **MapLibre GL JS** + CartoDB Voyager tiles — free, no API key needed
- **shadcn/ui** + Tailwind CSS
- **Vercel** — Next.js hosting

## Env vars

Copy `.env.local.example` → `.env.local`:
- `NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090` (local)
- `NEXT_PUBLIC_POCKETBASE_URL=https://volleymaps-pb.fly.dev` (production)

Falls back to mock data (`lib/mock-data.ts`) when env var is not set.

## PocketBase setup

Scripts in `scripts/` handle collection creation and seeding:
- `setup-pocketbase.mjs` — creates 3 collections (venues, game_sessions, submissions)
- `set-rules.mjs` — sets public read rules on venues + game_sessions
- `seed-pocketbase.mjs` — seeds 9 Toronto venues + 16 sessions

Run order: setup → set-rules → seed

PocketBase admin: `http://127.0.0.1:8090/_/` (local) or `https://volleymaps-pb.fly.dev/_/` (prod)

## Collections

- **venues** — name, type (beach/indoor), address, city, lat, lng, slug, approved, website, photo_url
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
- [x] PocketBase collections created and seeded (9 venues, 16 sessions)
- [x] Submission form wired to PocketBase
- [x] Public read rules set on collections
- [ ] Deploy PocketBase to Fly.io
- [ ] Deploy Next.js to Vercel with production env var

## Next up

- Deploy PocketBase to Fly.io (`mdfiles/pocketbase-setup.md` has full steps)
- Set `NEXT_PUBLIC_POCKETBASE_URL` in Vercel dashboard
- Phase 2: organizer portal
- Phase 3: featured listings + Stripe

---

## Keep This File Updated

At the end of every session, update this file to reflect what changed:
- Current status and completed work
- New decisions, files, or architecture changes
- Remove anything no longer accurate
- Refresh what's next / pending

This file is Claude's primary context for this project. Keep it current.
