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
  page.tsx                 — homepage (server, ISR revalidate=3600)
  layout.tsx               — header + root layout
  venues/[slug]/page.tsx   — venue detail + full schedule
  add-your-game/page.tsx   — submission form
  admin/page.tsx           — approve/reject submissions (force-dynamic)
  admin/login/page.tsx     — login form (HMAC-signed session via lib/admin-session.ts)
  contact/page.tsx         — contact + newsletter signup
  privacy/page.tsx         — PIPEDA privacy policy
  terms/page.tsx           — terms of use
  api/rsvp/route.ts        — RSVP toggle (GET count + going, POST toggle). 24h TTL is enforced at read-time (getCount/mine both filter by created_at) so correctness never depends on deletion; physical cleanupStale() only runs on POST (a real user action), not GET, since GET fires on every page view with no rate limiting anywhere in the app — deleting on every read would turn traffic directly into DB write volume and is a free abuse vector
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
- [x] `supabase/schema-v9.sql` run in Supabase SQL Editor (2026-07-14) — rsvps RLS locked down, anon key can no longer delete arbitrary RSVP rows
- [x] RSVP 24h TTL (2026-07-14) — user was confused seeing "Going" tags with no way to tell if stale; rows older than 24h are now deleted automatically on each `/api/rsvp` request, so the count reflects only the last 24h and doesn't carry over to a recurring session's next occurrence
- [x] RSVP avatar stack for FOMO (2026-07-14) — `RsvpButton.tsx` now renders up to 3 generic person-icon avatars + "+N" overflow next to the Going button, driven purely by the existing anonymous count (no names/identities collected — kept anonymous intentionally; named-RSVP was considered and deferred). Visually verified via Playwright (installed ad hoc, chromium only) at desktop 1400px, 390px, and iPhone SE 375px — avatar stack overlap, dark cutout border, and +N overflow all render correctly in both the sidebar and mobile drawer, no clipping.
- [x] **3-agent max-effort review pass (2026-07-14)** — code/architecture, product/growth, and security agents reviewed the full project in parallel. Fixed from their findings: RSVP count/going correctness no longer depends on `cleanupStale()` succeeding (both now filter by `created_at` directly); moved physical cleanup off the GET hot path (was a free DoS/cost vector — unauthenticated, unrate-limited, fired on every page view); privacy policy now discloses the anonymous RSVP token + 24h auto-delete and its "last updated" date was bumped. Drafted `schema-v10.sql` for the newsletter RLS gap (see above, pending run). Remaining findings intentionally NOT auto-fixed — logged below for a deliberate decision rather than silently building on top:
- [ ] **RSVP counts are spoofable** — `POST /api/rsvp` has no rate limiting (none exists anywhere in the app — no `middleware.ts`, no rate-limit dependency). A script looping random UUIDs can inflate any session's count/avatar stack, undermining the FOMO feature's premise. Needs a real decision on approach (per-IP throttle, token-cookie binding, etc.) before more is built on top of the count.
- [ ] **Map pins don't update after first render** — `components/Map.tsx` gates marker creation behind a one-shot `markersRef.current.length === 0` check, so new/edited/deleted venues never get pin updates without a hard reload, despite the on-demand ISR work that was specifically built to make new venues appear immediately.
- [ ] **Unapproved venue sessions aren't filtered server-side** — `app/page.tsx`'s `getSessions()` has no `.eq('approved', true)` filter (unlike `getVenues()`). Currently harmless since every insert path hardcodes `approved: true`, but it's latent — one workflow change away from leaking full session data (notes, contact links) for hidden venues to every client.
- [ ] Optional: set `ADMIN_SESSION_SECRET` in Vercel (falls back to key derived from ADMIN_PASSWORD)
- [ ] Optional/low-priority: no lockout on repeated failed `/admin/login` attempts
- [ ] Local `.env.local` has empty Supabase values — pull real ones (`vercel env pull`) to dev against live data
- [ ] Visual-test mobile drawer/nav/popover on real devices (iPhone SE + notched)
- [ ] Cherry Beach organized mixed 6s — add when organizer info available
</STATUS>

<CONTEXT name="next-up">
## Next up

Prioritized 2026-07-14 by the product-review agent, grounded in what's actually in the codebase now:

1. Fix RSVP rate limiting first (see STATUS) — building more on a spoofable count compounds the problem.
2. Share a session's going-count — `ShareButton.tsx` already exists (clipboard copy) but only on the venue page and doesn't mention who's going. Add a session-level share on `GameCard` including the live count. Direct compounding move on RSVP + avatar stack, hours of work.
3. Expose the `featured` toggle in admin — `game_sessions.featured` and its GameCard badge already exist and render, but the admin session form never exposes a way to set it. Adding a checkbox lets featured slots be sold/comped manually (e-transfer, DM) to prove organizers will pay *before* writing Stripe integration.
4. Turn on the Vercel Analytics dashboard tab (package + component are already installed, just needs the toggle in Vercel's dashboard) — every prioritization call below is a guess without real traffic data.
5. "Joined in the last hour" momentum chip — `rsvps.created_at` already supports this with zero schema change, reusing the existing Live/Soon badge pattern.

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
