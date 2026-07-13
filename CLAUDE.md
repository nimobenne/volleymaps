# VolleyMaps

<CONTEXT name="project">
Toronto volleyball pickup game finder. Organizers opt in to be listed. Monetization planned via featured listings. Live at https://volleymaps.vercel.app/
</CONTEXT>

<STACK>
- **Next.js 16** (App Router, TypeScript)
- **Supabase** — Postgres, RLS, hosted on Supabase cloud
- **MapLibre GL JS** + CartoDB Voyager tiles — free, no API key needed
- **shadcn/ui** + Tailwind CSS v4
- **Vercel** — production hosting + Web Analytics (cookieless, aggregate-only; see privacy policy)
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

Run migrations in order in Supabase SQL Editor. `schema-v8.sql` (rsvps) applied 2026-07-13 — RSVP persistence verified live. Latest: `supabase/schema-v9.sql` (drops the wide-open rsvps RLS policies; API uses service role) — **PENDING manual run.**

Seed: `node scripts/seed-supabase.mjs <project-url> <service-role-key>`
</CONTEXT>

<CONTEXT name="tables">
## Tables

- **venues** — name, type (beach/grass/indoor), address, city, lat, lng, slug, approved, website, photo_url
- **game_sessions** — venue_id, title, day_of_week (0=Sun), specific_date, start_time, end_time, recurring, skill_level, notes, contact_link, featured, cost_type, cost_cents, cost_label
- **submissions** — name, email, venue_name, address, city, type, website, schedule, contact_link, status (pending/approved/rejected)
- **newsletter_subscribers** — email
- **rsvps** — session_id (FK game_sessions, cascade), token (anon device token), created_at; unique(session_id, token). Defined in `supabase/schema-v8.sql` — run pending.
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
  admin/login/page.tsx     — login form (HMAC-signed session via lib/admin-session.ts)
  contact/page.tsx         — contact + newsletter signup
  privacy/page.tsx         — PIPEDA privacy policy
  terms/page.tsx           — terms of use
  api/rsvp/route.ts        — RSVP toggle (GET count + going, POST toggle)
  sitemap.ts               — dynamic sitemap (static routes + approved venues)
  robots.ts                — robots.txt (blocks /admin)
  opengraph-image.tsx      — branded OG share image (edge runtime)

components/
  HomeClient.tsx           — client shell (type + day filter state, mobile drawer)
  Map.tsx                  — MapLibre map with teardrop SVG pins (client, ssr: false)
  MapPin.tsx               — createPinElement() — returns HTMLElement (not React)
  VenuePopover.tsx         — card on pin click, directions link
  LiveFeed.tsx             — today's sessions sidebar, day filter support
  GameCard.tsx             — session card with CostChip, Lucide icons, focus rings
  Filters.tsx              — type pills + day pills + skill pills
  CostChip.tsx             — Free/Drop-in/Register colored pill
  RsvpButton.tsx           — anon localStorage RSVP toggle (token resets daily; shared fetch cache + sync event because LiveFeed mounts twice)
  MobileNav.tsx            — Lucide bottom nav with aria-current active state
  Logo.tsx                 — SVG volleyball mark (amber)

lib/
  supabase.ts              — Supabase client
  admin-session.ts         — HMAC session cookie create/verify + timing-safe compare (secret: ADMIN_SESSION_SECRET or derived from ADMIN_PASSWORD)
  utils.ts                 — cn, isNewVenue, getVenueColor, getVenueLabel
  sessions.ts              — getTodaysSessions, isLiveNow, isStartingSoon (Toronto TZ)
  mock-data.ts             — fallback data when Supabase not configured

types/index.ts             — Venue, GameSession, Filters, CostType interfaces
```
</CONTEXT>

<CONTEXT name="design">
## Design

"Court Lights" dark theme — warm charcoal bg, amber/gold primary, Mikasa volleyball colors.
- Beach pins: amber `oklch(0.82 0.17 75)`
- Indoor accent: blue `oklch(0.70 0.14 218)` (centralized in `getVenueColor()`; map pins themselves use `TYPE_COLORS` hex `#1D4ED8`)
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
- [x] `supabase/schema-v7.sql` applied — cost_type/cost_cents/cost_label live in game_sessions
- [x] Foundation cleanup — getVenueColor/getVenueLabel util, filter types in types/index.ts, dead files removed
- [x] Mobile UX — --vh drawer height, safe-area VenuePopover, mobile bottom nav (Map / Add game / Contact)
- [x] Search matches session title + notes (not just venue name/address)
- [x] next/image on VenuePopover + venue hero (Supabase remote host in next.config.ts)
- [x] RSVP counter built — RsvpButton + /api/rsvp, anon daily token (needs schema-v8 run to persist)
- [x] Map markers update opacity in place (no flash); `.live-pulse` ring toggled
- [x] On-demand ISR — revalidatePath on admin approve / reject / add
- [x] Admin: History tab shows approved/rejected submissions (previously only pending was queried, decided ones vanished)
- [x] Admin: Venues tab rows are click-to-expand editable (updateVenue action) — was add-only + read-only list before
- [x] Admin: each venue row lists its game_sessions inline, fully editable/deletable (updateSession/deleteSession) + add-session form (addSession) — schedule details could previously only be set once at venue creation
- [x] Footer layout fix — body was height:100% capped so long pages (privacy/terms/contact) overflowed instead of growing; footer stuck mid-page instead of true bottom. Now min-h-dvh on body, homepage keeps fixed-viewport map via explicit dvh calc.
- [x] Vercel Web Analytics added — site had zero traffic visibility (privacy policy explicitly promised no analytics/tracking); Web Analytics is cookieless/aggregate-only so it doesn't conflict with that promise. Privacy policy wording updated to match. **Needs the Analytics tab enabled in the Vercel dashboard for the project** (package + component alone don't turn it on).
- [x] SEO — sitemap.xml, robots.txt, OG share image
- [x] schema-v8 applied — RSVP persistence verified live in prod (toggle on/off tested 2026-07-13)
- [x] **Security pass (2026-07-13)** — /admin page + all admin server actions were fully unauthenticated in prod; now gated by HMAC-signed cookie. Embed API stored-XSS escaped. Newsletter API no longer leaks DB errors / logs emails. RSVP route: UUID validation, atomic toggle, honest error responses.
- [x] A11y pass — aria-pressed on all toggles, calendar menu aria-expanded + Escape, ≥28px touch targets, homepage h1, skeleton role=status, feed date pinned to America/Toronto
- [x] Design pass — SVG volleyball logo + two-tone wordmark, Lucide mobile nav w/ active state, floodlight wash on map, court-line accent on feed header; live/soon chips use theme tokens
- [x] Dead deps removed (pocketbase + 5 legacy scripts); .env.local.example fixed (was PocketBase-only)
- [x] Audit report: `mdfiles/audit-2026-07.md` (15/20; open P2/P3 items listed there)
- [ ] **Run `supabase/schema-v9.sql` in Supabase SQL Editor** — locks down rsvps RLS (currently anon key can delete all RSVP rows)
- [ ] Optional: set `ADMIN_SESSION_SECRET` in Vercel (falls back to key derived from ADMIN_PASSWORD)
- [ ] Verify in Supabase dashboard: `newsletter_subscribers` has RLS on with no anon policies
- [ ] Local `.env.local` has empty Supabase values — pull real ones (`vercel env pull`) to dev against live data
- [ ] Visual-test mobile drawer/nav/popover on real devices (iPhone SE + notched)
- [ ] Cherry Beach organized mixed 6s — add when organizer info available
</STATUS>

<CONTEXT name="next-up">
## Next up

- Organizer portal (Supabase Auth)
- Featured listings + Stripe (monetization)
- Expand beyond Toronto
- LiveFeed virtualization (only worth it at 200+ sessions)
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
