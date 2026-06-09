# VolleyMaps

<CONTEXT name="project">
Toronto volleyball pickup game finder. Organizers opt in to be listed. Monetization planned via featured listings. Live at https://volleymaps.vercel.app/
</CONTEXT>

<STACK>
- **Next.js 16** (App Router, TypeScript)
- **Supabase** — Postgres, RLS, hosted on Supabase cloud
- **MapLibre GL JS** + CartoDB Voyager tiles — free, no API key needed
- **shadcn/ui** + Tailwind CSS v4
- **Vercel** — production hosting
</STACK>

<CONTEXT name="env-vars">
## Env vars

Copy `.env.local.example` → `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (admin mutations + newsletter)
- `ADMIN_PASSWORD` (admin login)

Falls back to mock data (`lib/mock-data.ts`) when env vars are not set.
</CONTEXT>

<CONTEXT name="supabase">
## Supabase setup

Run migrations in order in Supabase SQL Editor. Latest: `supabase/schema-v7.sql` (adds cost_type/cost_cents/cost_label to game_sessions — run this if not yet applied).

Seed: `node scripts/seed-supabase.mjs <project-url> <service-role-key>`
</CONTEXT>

<CONTEXT name="tables">
## Tables

- **venues** — name, type (beach/grass/indoor), address, city, lat, lng, slug, approved, website, photo_url
- **game_sessions** — venue_id, title, day_of_week (0=Sun), specific_date, start_time, end_time, recurring, skill_level, notes, contact_link, featured, cost_type, cost_cents, cost_label
- **submissions** — name, email, venue_name, address, city, type, website, schedule, contact_link, status (pending/approved/rejected)
- **newsletter_subscribers** — email
- **rsvps** — planned (not yet built)
</CONTEXT>

<CONTEXT name="structure">
## Project structure

```
app/
  page.tsx                 — homepage (server, ISR revalidate=3600)
  layout.tsx               — header + root layout
  venues/[slug]/page.tsx   — venue detail + full schedule
  add-your-game/page.tsx   — submission form
  admin/page.tsx           — approve/reject submissions (force-dynamic)
  admin/login/page.tsx     — cookie-based auth
  contact/page.tsx         — contact + newsletter signup
  privacy/page.tsx         — PIPEDA privacy policy
  terms/page.tsx           — terms of use

components/
  HomeClient.tsx           — client shell (type + day filter state, mobile drawer)
  Map.tsx                  — MapLibre map with teardrop SVG pins (client, ssr: false)
  MapPin.tsx               — createPinElement() — returns HTMLElement (not React)
  VenuePopover.tsx         — card on pin click, directions link
  LiveFeed.tsx             — today's sessions sidebar, day filter support
  GameCard.tsx             — session card with CostChip, Lucide icons, focus rings
  Filters.tsx              — type pills + day pills + skill pills
  CostChip.tsx             — Free/Drop-in/Register colored pill

lib/
  supabase.ts              — Supabase client
  sessions.ts              — getTodaysSessions, isLiveNow, isStartingSoon (Toronto TZ)
  mock-data.ts             — fallback data when Supabase not configured

types/index.ts             — Venue, GameSession, Filters, CostType interfaces
```
</CONTEXT>

<CONTEXT name="design">
## Design

"Court Lights" dark theme — warm charcoal bg, amber/gold primary, Mikasa volleyball colors.
- Beach pins: amber `oklch(0.82 0.17 75)`
- Indoor pins: cobalt `oklch(0.52 0.23 263)`
- Grass pins: green `oklch(0.55 0.18 145)`
- Live badge: animated pulse ring via `@keyframes ping`
- WCAG AA: muted-foreground at `oklch(0.65 0.020 70)`, focus-visible rings on all interactive elements
- Fonts: Barlow Condensed (display) + DM Sans (body)
</CONTEXT>

<STATUS>
## Current status (June 2026)

- [x] Full UX + design overhaul complete and deployed
- [x] Teardrop SVG map pins with per-type color + live pulse ring
- [x] Day filter (All / Today / Weekend) in Filters + LiveFeed
- [x] CostChip (Free / Drop-in / Register) on GameCards
- [x] Venue detail hero + gradient fallback + directions link
- [x] WCAG AA contrast + focus rings
- [x] Admin panel (force-dynamic)
- [x] Contact email: nimobenne@gmail.com everywhere
- [x] Deployed to Vercel — https://volleymaps.vercel.app/
- [ ] **PENDING:** Run `supabase/schema-v7.sql` in Supabase SQL Editor
- [ ] Cherry Beach organized mixed 6s — add when organizer info available
</STATUS>

<CONTEXT name="next-up">
## Next up

- RSVP counter (anonymous localStorage token, toggle "Going" on GameCard, `rsvps` table)
- Organizer portal (Supabase Auth)
- Featured listings + Stripe (monetization)
- Expand beyond Toronto
</CONTEXT>

<RULE name="keep-updated">
---

## Keep This File Updated

At the end of every session, update this file to reflect what changed:
- Current status and completed work
- New decisions, files, or architecture changes
- Remove anything no longer accurate
- Refresh what's next / pending

This file is Claude's primary context for this project. Keep it current. Use XML tags on all sections.
</RULE>
