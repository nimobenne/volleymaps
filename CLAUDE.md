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

Run migrations in order in Supabase SQL Editor. `schema-v8.sql` (rsvps) applied 2026-07-13 — RSVP persistence verified live. `supabase/schema-v9.sql` (drops the wide-open rsvps RLS policies; API uses service role) applied 2026-07-14. `supabase/schema-v10.sql` (locks down `newsletter_subscribers` RLS — table predates tracked migrations, policy state was never verified) drafted 2026-07-14, **PENDING manual run.**

Seed: `node scripts/seed-supabase.mjs <project-url> <service-role-key>`
</CONTEXT>

<CONTEXT name="tables">
## Tables

- **venues** — name, type (beach/grass/indoor), address, city, lat, lng, slug, approved, website, photo_url
- **game_sessions** — venue_id, title, day_of_week (0=Sun), specific_date, start_time, end_time, recurring, skill_level, notes, contact_link, featured, cost_type, cost_cents, cost_label
- **submissions** — name, email, venue_name, address, city, type, website, schedule, contact_link, status (pending/approved/rejected)
- **newsletter_subscribers** — email. RLS status unverified since table predates migrations — `schema-v10.sql` locks it down, pending manual run.
- **rsvps** — session_id (FK game_sessions, cascade), token (anon device token), created_at; unique(session_id, token). Schema from `schema-v8.sql`, RLS locked down in `schema-v9.sql`, both applied. 24h TTL enforced at read-time via `created_at` filter (not physical deletion) in `getCount()`.
</CONTEXT>

<CONTEXT name="structure">
## Project structure

```
app/
  page.tsx                 — homepage (server, ISR revalidate=3600), fetches via lib/data.ts
  layout.tsx               — header + root layout
  venues/[slug]/page.tsx   — venue detail + full schedule + JSON-LD
  add-your-game/page.tsx   — submission form
  admin/page.tsx           — approve/reject submissions (force-dynamic)
  admin/AdminClient.tsx    — admin UI: submissions/history/venues tabs, session forms (incl. featured checkbox)
  admin/actions.ts         — server actions (auth-gated mutations, revalidatePath)
  admin/login/page.tsx     — login form (HMAC-signed session via lib/admin-session.ts)
  contact/page.tsx         — contact + newsletter signup
  privacy/page.tsx         — PIPEDA privacy policy
  terms/page.tsx           — terms of use
  api/rsvp/route.ts        — RSVP API. GET is batched: ?sessionIds=<uuid,uuid,...>&token= answers every session in 2 queries ({counts, going}); POST toggles one session. 24h TTL enforced at read-time (created_at filter) so correctness never depends on deletion; physical cleanupStale() only runs on POST. Per-IP in-memory rate limit: separate GET (30/min) and POST (10/min) buckets, map sweeps expired entries past 1000 keys
  api/newsletter/route.ts  — newsletter signup (service role)
  api/weather/route.ts     — Toronto current weather via Open-Meteo (returns temp/label/WMO code, 30min cache)
  api/embed/[slug]/route.ts — embeddable venue schedule HTML (XSS-escaped), uses lib/data.ts
  sitemap.ts               — dynamic sitemap (static routes + approved venues)
  robots.ts                — robots.txt (blocks /admin)
  manifest.ts              — PWA manifest
  opengraph-image.tsx      — branded OG share image (edge runtime)

components/
  HomeClient.tsx           — client shell (type + day filter state, mobile drawer)
  Map.tsx                  — MapLibre map with teardrop SVG pins (client, ssr: false); marker effect diffs venues by id
  MapPin.tsx               — createPinElement() — returns HTMLElement (not React)
  VenuePopover.tsx         — card on pin click, directions link, WeatherChip for outdoor venues
  LiveFeed.tsx             — today's sessions sidebar, day filter support, Lucide empty state
  GameCard.tsx             — session card with CostChip, calendar menu, RSVP; no side-stripe
  Filters.tsx              — type pills always visible; day + skill rows behind a mobile toggle (active-count badge), always shown ≥md
  CostChip.tsx             — Free/Drop-in/Register colored pill
  RsvpButton.tsx           — anon localStorage RSVP toggle (token resets daily). Mounts enqueue into a microtask-flushed batch → ONE GET for all visible sessions; shared cache + sync event keeps duplicate mounts (LiveFeed ×2) in sync. Label: "I'm going" / "✓ Going", count on avatar stack
  MobileNav.tsx            — Lucide bottom nav with aria-current active state
  NewsletterSignup.tsx     — email capture form (contact page)
  SearchBar.tsx            — homepage search input
  ShareButton.tsx          — clipboard-copy share (venue page)
  WeatherChip.tsx          — temp + condition, Lucide icon mapped from WMO code
  Logo.tsx                 — SVG volleyball mark (amber)

lib/
  data.ts                  — SINGLE public read layer: getVenues/getSessions/getApprovedVenuesAndSessions/getVenueBySlug/getVenueSessions. Owns approved-only rule, mock fallback, error logging. All public pages/routes fetch through this
  supabase-admin.ts        — createAdminClient() (service role, admin mutations only)
  admin-session.ts         — HMAC session cookie create/verify + timing-safe compare (secret: ADMIN_SESSION_SECRET or derived from ADMIN_PASSWORD)
  utils.ts                 — cn, isNewVenue, getVenueColor, getVenueLabel
  sessions.ts              — getTodaysSessions, isLiveNow, isStartingSoon (Toronto TZ)
  calendar.ts              — Google Calendar URL + .ics builder
  mapbox.ts                — map style constants (MapLibre/CartoDB — name is legacy)
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
- [x] `supabase/schema-v9.sql` run in Supabase SQL Editor (2026-07-14) — rsvps RLS locked down, anon key can no longer delete arbitrary RSVP rows
- [x] RSVP 24h TTL (2026-07-14) — user was confused seeing "Going" tags with no way to tell if stale; rows older than 24h are now deleted automatically on each `/api/rsvp` request, so the count reflects only the last 24h and doesn't carry over to a recurring session's next occurrence
- [x] RSVP avatar stack for FOMO (2026-07-14) — `RsvpButton.tsx` now renders up to 3 generic person-icon avatars + "+N" overflow next to the Going button, driven purely by the existing anonymous count (no names/identities collected — kept anonymous intentionally; named-RSVP was considered and deferred). Visually verified via Playwright (installed ad hoc, chromium only) at desktop 1400px, 390px, and iPhone SE 375px — avatar stack overlap, dark cutout border, and +N overflow all render correctly in both the sidebar and mobile drawer, no clipping.
- [x] **3-agent max-effort review pass (2026-07-14)** — code/architecture, product/growth, and security agents reviewed the full project in parallel. Fixed from their findings: RSVP count/going correctness no longer depends on `cleanupStale()` succeeding (both now filter by `created_at` directly); moved physical cleanup off the GET hot path (was a free DoS/cost vector — unauthenticated, unrate-limited, fired on every page view); privacy policy now discloses the anonymous RSVP token + 24h auto-delete and its "last updated" date was bumped. Drafted `schema-v10.sql` for the newsletter RLS gap (see above, pending run). Remaining findings intentionally NOT auto-fixed — logged below for a deliberate decision rather than silently building on top:
- [x] **RSVP rate limiting (2026-07-14)** — `POST /api/rsvp` now uses an in-memory per-IP token bucket (10 req/60s), module-scope `Map`, zero new deps/infra. Best-effort/per-instance only (resets on cold start) — deterrent against naive scripted abuse, upgrade to Upstash Redis if real abuse is observed.
- [x] **Map pins update on venue add/remove/edit (2026-07-14)** — `components/Map.tsx` marker effect now diffs `venues` against `markersRef.current` by `venueId` each run instead of a one-shot `length === 0` guard: adds markers for new venues, removes markers for gone venues, repositions markers whose lat/lng changed.
- [x] **Unapproved venue sessions filtered server-side (2026-07-14)** — `app/page.tsx`'s `HomePage` now filters `getSessions()` results down to `approvedVenueIds` (derived from `getVenues()`) before anything reaches `HomeClient`, closing the latent full-session-data leak for hidden venues.
- [x] **Full review + fix pass (2026-07-18)** — audit scored 14/20 (perf down: RSVP N+1). Shipped: batched RSVP GET (one request, 2 queries for all sessions — was ~57 req/~114 queries per visitor), GET rate limit + bounded rate-limit map, lib/data.ts consolidation (deleted dead lib/supabase.ts; embed/venue/home all fetch through it, errors logged instead of swallowed), Lucide weather/empty-state icons (emoji gone; also fixed WeatherChip hiding at 0°C), tokenized One-time/Featured/New chips (+ --indoor-soft/--grass tokens), mobile filter collapse toggle, "I'm going" button relabel, GameCard side-stripe removed. Discovered: featured checkbox ALREADY existed in admin (AdminClient SessionForm + actions.ts) — old "Next up" #2 was stale.
- [ ] **schema-v10.sql STILL PENDING** — could not verify from CLI (Supabase env vars are sensitive-marked in Vercel; env pull returns empty). Verify in Supabase SQL Editor: `select relrowsecurity from pg_class where relname='newsletter_subscribers';` + `select policyname from pg_policies where tablename='newsletter_subscribers';` — want rowsecurity=true and zero policies; if not, run supabase/schema-v10.sql
- [ ] Optional: set `ADMIN_SESSION_SECRET` in Vercel (falls back to key derived from ADMIN_PASSWORD)
- [ ] Optional/low-priority: no lockout on repeated failed `/admin/login` attempts
- [ ] Local `.env.local` has empty Supabase values — pull real ones (`vercel env pull`) to dev against live data
- [ ] Visual-test mobile drawer/nav/popover on real devices (iPhone SE + notched)
- [ ] Cherry Beach organized mixed 6s — add when organizer info available
</STATUS>

<CONTEXT name="next-up">
## Next up

Prioritized 2026-07-14 by the product-review agent, grounded in what's actually in the codebase now. RSVP rate limiting (was #1) shipped same day — see STATUS.

1. **Human actions, highest ROI (2026-07-18 review):** turn on Vercel Analytics dashboard tab; buy a real domain (organizers won't pay to be featured on a vercel.app subdomain); pitch 2-3 organizers a comped featured slot (the admin checkbox already exists — sell before building Stripe).
2. **Distribution, not code** — refresh the May reddit post, Toronto volleyball FB/Discord groups, ask newsletter subscribers what's missing. Codebase is above the bar for this stage; audience isn't.
3. Share a session's going-count — `ShareButton.tsx` already exists (clipboard copy) but only on the venue page and doesn't mention who's going. Add a session-level share on `GameCard` including the live count. Direct compounding move on RSVP + avatar stack, hours of work.
4. "Joined in the last hour" momentum chip — `rsvps.created_at` already supports this with zero schema change, reusing the existing Live/Soon badge pattern.
5. Opportunistic: unit tests for `lib/sessions.ts` timezone logic (DST-fragile, zero coverage).

Deferred, with reasons (not just parked):
- **Featured listings + Stripe** — right idea, wrong sequencing. Validate demand with the manual admin toggle (#3) first; only build checkout once an organizer has actually asked to pay.
- **Organizer portal (Supabase Auth)** — no demand signal yet (`submissions` is a one-shot form, not accounts), and it's a real architecture change (auth + per-owner RLS) against tables currently gated by one shared admin password.
- **Expand beyond Toronto** — "Toronto" and `America/Toronto` are hardcoded across ~18 files including the live/soon time logic in `lib/sessions.ts`. This is a multi-day rewrite, not a config flag, and there's no traffic data yet (#4) to justify it.
- **LiveFeed virtualization** — correctly deferred, nowhere near the 200-session trigger.
- **Push/email nudges** — explicitly not recommended yet; would need new infrastructure (service worker, subscription table, email-sending library) that doesn't exist, not a compounding move on what's shipped.
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
