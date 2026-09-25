# VolleyMaps UX + Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all P0/P1/P2 issues from the Opus UX+design review — cost fields, custom map pins, filter redesign, venue detail improvements, accessibility, and visual polish.

**Architecture:** Schema-first (new cost fields on game_sessions), then types, then UI top-down (pins → cards → filters → venue detail → a11y). Every change is backward-compatible: new DB columns are nullable with defaults so existing rows and the mock data layer are unaffected.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres), MapLibre GL JS, shadcn/ui, Tailwind v4, Framer Motion, Lucide React

---

## File Map

**Modified:**
- `supabase/schema-v7.sql` — CREATE (new migration)
- `types/index.ts` — add cost fields to GameSession
- `components/Map.tsx` — custom SVG pins with live-ring
- `components/VenuePopover.tsx` — directions link, remove emoji
- `components/GameCard.tsx` — hierarchy fix, cost chips, Lucide calendar icons
- `components/LiveFeed.tsx` — weekend filter, better empty state
- `components/Filters.tsx` — Lucide icons, collapse skill to sheet
- `components/HomeClient.tsx` — pass weekend filter state down
- `app/venues/[slug]/page.tsx` — hero fallback gradient, directions link, remove emoji
- `app/globals.css` — bump muted-foreground, add focus-visible utility
- `app/layout.tsx` — consolidate "Add your game" CTA

**Created:**
- `components/MapPin.tsx` — SVG teardrop pin component (used by Map.tsx)
- `components/CostChip.tsx` — renders cost_type + cost_cents as a pill
- `components/FiltersSheet.tsx` — mobile sheet for skill + weekend filters

---

## Task 1: Schema migration — cost fields on game_sessions

**Files:**
- Create: `supabase/schema-v7.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/schema-v7.sql
-- Run in Supabase SQL Editor after schema-v6.sql
-- Adds cost visibility fields to game_sessions. All nullable/defaulted — no existing rows break.

ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS cost_type  text NOT NULL DEFAULT 'unknown'
    CONSTRAINT cost_type_check CHECK (cost_type IN ('free','paid','registration','unknown')),
  ADD COLUMN IF NOT EXISTS cost_cents integer DEFAULT NULL,         -- e.g. 500 = $5.00 CAD
  ADD COLUMN IF NOT EXISTS cost_label text DEFAULT NULL;           -- display override e.g. "Members free, guests $5"

COMMENT ON COLUMN game_sessions.cost_type   IS 'free | paid | registration | unknown';
COMMENT ON COLUMN game_sessions.cost_cents  IS 'Amount in cents CAD. Only set when cost_type=paid.';
COMMENT ON COLUMN game_sessions.cost_label  IS 'Optional override shown in UI instead of computed label.';
```

- [ ] **Step 2: Run it in Supabase SQL Editor**

Open Supabase dashboard → SQL Editor → paste and run.
Expected: success, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema-v7.sql
git commit -m "feat(db): add cost_type, cost_cents, cost_label to game_sessions"
```

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Update GameSession interface**

Replace the current `GameSession` interface with:

```typescript
export type CostType = 'free' | 'paid' | 'registration' | 'unknown'

export interface GameSession {
  id: string
  venue_id: string
  venue?: Venue
  title: string
  day_of_week?: number // 0=Sun, 6=Sat; null if specific_date is set
  specific_date?: string // YYYY-MM-DD; null if recurring
  start_time: string // HH:MM
  end_time: string // HH:MM
  recurring: boolean
  skill_level: SkillLevel
  notes?: string
  contact_link?: string
  featured: boolean
  cost_type?: CostType       // defaults to 'unknown' in DB
  cost_cents?: number | null // cents CAD, only when cost_type='paid'
  cost_label?: string | null // display override
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors (new fields are all optional).

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add cost fields to GameSession"
```

---

## Task 3: CostChip component

**Files:**
- Create: `components/CostChip.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/CostChip.tsx
import { DollarSign, UserCheck, HelpCircle } from 'lucide-react'
import { CostType } from '@/types'

interface CostChipProps {
  costType?: CostType
  costCents?: number | null
  costLabel?: string | null
  className?: string
}

const CONFIGS: Record<Exclude<CostType, 'unknown'>, { label: string; color: string; bg: string }> = {
  free:         { label: 'Free',         color: 'oklch(0.68 0.21 145)', bg: 'oklch(0.68 0.21 145 / 14%)' },
  paid:         { label: 'Drop-in',      color: 'oklch(0.82 0.17 75)',  bg: 'oklch(0.82 0.17 75 / 14%)'  },
  registration: { label: 'Register',     color: 'oklch(0.70 0.14 218)', bg: 'oklch(0.52 0.23 263 / 14%)' },
}

export default function CostChip({ costType, costCents, costLabel, className = '' }: CostChipProps) {
  if (!costType || costType === 'unknown') return null

  const cfg = CONFIGS[costType]
  let label = costLabel ?? cfg.label
  if (costType === 'paid' && costCents && !costLabel) {
    label = `$${(costCents / 100).toFixed(0)}`
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${className}`}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Verify it renders without errors**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/CostChip.tsx
git commit -m "feat(ui): add CostChip component for session cost display"
```

---

## Task 4: Custom SVG map pins with live-now ring

**Files:**
- Create: `components/MapPin.tsx`
- Modify: `components/Map.tsx`

- [ ] **Step 1: Create MapPin SVG builder**

```tsx
// components/MapPin.tsx
// Returns an HTML string used by MapLibre's custom marker API (no React rendering).

export type PinOptions = {
  color: string        // hex fill for the teardrop
  isLive: boolean      // adds animated pulse ring
  isMobile: boolean
}

const BEACH_COLOR  = '#D97706'
const INDOOR_COLOR = '#1D4ED8'
const GRASS_COLOR  = '#16A34A'

export const TYPE_COLORS: Record<string, string> = {
  beach:  BEACH_COLOR,
  indoor: INDOOR_COLOR,
  grass:  GRASS_COLOR,
}

export function createPinElement({ color, isLive, isMobile }: PinOptions): HTMLElement {
  const size = isMobile ? 44 : 36
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `width:${size}px;height:${size + 8}px;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;`

  // Live pulse ring
  if (isLive) {
    const ring = document.createElement('div')
    ring.style.cssText = [
      'position:absolute',
      `width:${size + 10}px`,
      `height:${size + 10}px`,
      'border-radius:50%',
      `border:2px solid ${color}`,
      'opacity:0.6',
      'animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      'top:-5px',
      'left:-5px',
    ].join(';')
    wrapper.appendChild(ring)
  }

  // SVG teardrop pin
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size + 8))
  svg.setAttribute('viewBox', '0 0 36 44')
  svg.style.cssText = 'filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1);'

  // Teardrop path: circle top, pointed bottom
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M18 0C9.163 0 2 7.163 2 16c0 10.5 16 28 16 28s16-17.5 16-28C34 7.163 26.837 0 18 0z')
  path.setAttribute('fill', color)
  path.setAttribute('stroke', 'rgba(255,255,255,0.9)')
  path.setAttribute('stroke-width', '2')

  // Volleyball icon inside — simple circle with lines
  const ball = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  ball.setAttribute('cx', '18')
  ball.setAttribute('cy', '15')
  ball.setAttribute('r', '7')
  ball.setAttribute('fill', 'rgba(255,255,255,0.25)')
  ball.setAttribute('stroke', 'rgba(255,255,255,0.8)')
  ball.setAttribute('stroke-width', '1.5')

  svg.appendChild(path)
  svg.appendChild(ball)
  wrapper.appendChild(svg)

  wrapper.addEventListener('mouseenter', () => { svg.style.transform = 'scale(1.2) translateY(-2px)' })
  wrapper.addEventListener('mouseleave', () => { svg.style.transform = 'scale(1)' })

  return wrapper
}
```

- [ ] **Step 2: Add ping keyframe to globals.css**

In `app/globals.css`, add inside `@layer base` (after the `body` rule):

```css
@keyframes ping {
  75%, 100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
```

- [ ] **Step 3: Update Map.tsx to use new pins and pass live status**

Replace `createMarkerElement` and update the markers `useEffect` in `components/Map.tsx`:

```tsx
// At top, replace the BEACH_COLOR/INDOOR_COLOR/GRASS_COLOR block and import:
import { createPinElement, TYPE_COLORS } from './MapPin'
import { isLiveNow } from '@/lib/sessions'

// Remove old createMarkerElement function entirely.

// Inside the markers useEffect, replace the .forEach block:
venues
  .filter(v => typeFilter === 'all' || v.type === typeFilter)
  .forEach(venue => {
    const venueSessions = sessions.filter(s => s.venue_id === venue.id)
    const hasLive = venueSessions.some(s => isLiveNow(s))
    const color = TYPE_COLORS[venue.type] ?? TYPE_COLORS.indoor
    const el = createPinElement({
      color,
      isLive: hasLive,
      isMobile: window.innerWidth < 768,
    })
    el.title = venue.name
    const matches = !q || venue.name.toLowerCase().includes(q) || venue.address.toLowerCase().includes(q)
    el.style.opacity = matches ? '1' : '0.15'
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      setSelectedVenue(venue)
      onPinTapRef.current?.()
    })
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([venue.lng, venue.lat])
      .addTo(map)
    markersRef.current.push({ marker, venueId: venue.id })
  })
```

Note: change `anchor: 'center'` to `anchor: 'bottom'` since teardrops point down.

- [ ] **Step 4: Verify map renders**

```bash
npm run dev
```
Open http://localhost:3000. Confirm teardrop pins render, live venues show pulse ring, emoji pins are gone.

- [ ] **Step 5: Commit**

```bash
git add components/MapPin.tsx components/Map.tsx app/globals.css
git commit -m "feat(map): replace emoji pins with SVG teardrop pins + live-now pulse ring"
```

---

## Task 5: GameCard hierarchy fix + cost display

**Files:**
- Modify: `components/GameCard.tsx`

- [ ] **Step 1: Rewrite the metadata row and add CostChip**

Replace the entire `return` block in `GameCard.tsx` with:

```tsx
return (
  <div className={`group flex gap-3 py-3 border-b border-border last:border-0 transition-opacity ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
    <div className="shrink-0 w-1 rounded-full mt-0.5" style={{ backgroundColor: venueColor }} />

    <div className="flex-1 min-w-0">
      {showVenueName && (
        <Link
          href={`/venues/${venue.slug}`}
          className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors truncate block"
        >
          {venue.name}
        </Link>
      )}

      <div className="flex items-start justify-between gap-2 mt-0.5">
        <p className="text-sm font-semibold leading-snug">{session.title}</p>
        <div className="shrink-0 flex items-center gap-1.5">
          {live && (
            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full border"
              style={{ color: 'oklch(0.68 0.21 145)', borderColor: 'oklch(0.68 0.21 145 / 40%)', backgroundColor: 'oklch(0.68 0.21 145 / 12%)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'oklch(0.68 0.21 145)' }} />
              Live
            </span>
          )}
          {soon && (
            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full border"
              style={{ color: 'oklch(0.70 0.16 90)', borderColor: 'oklch(0.87 0.19 105 / 50%)', backgroundColor: 'oklch(0.87 0.19 105 / 15%)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'oklch(0.87 0.19 105)' }} />
              Soon
            </span>
          )}
        </div>
      </div>

      {/* Time is the bold anchor — largest, most prominent */}
      <p className="text-sm font-bold tabular-nums mt-0.5" style={{ color: 'oklch(0.88 0.020 75)' }}>
        {formatTime(session.start_time)} – {formatTime(session.end_time)}
        {dateDisplay && <span className="font-normal text-muted-foreground ml-1.5">{dateDisplay}</span>}
      </p>

      {/* Chips row — skill + cost + one-time + featured */}
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <span className="text-[11px] text-muted-foreground">{SKILL_LABEL[session.skill_level]}</span>
        <CostChip costType={session.cost_type} costCents={session.cost_cents} costLabel={session.cost_label} />
        {isOneTime && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'oklch(0.52 0.23 263 / 15%)', color: 'oklch(0.70 0.14 218)' }}>
            One-time
          </span>
        )}
        {session.featured && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'oklch(0.82 0.17 75 / 15%)', color: 'oklch(0.82 0.17 75)' }}>
            Featured
          </span>
        )}
      </div>

      {session.notes && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{session.notes}</p>
      )}

      <div className="flex items-center justify-between mt-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {session.contact_link && (
            <a
              href={session.contact_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
              Join / register <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RsvpButton sessionId={session.id} />

          <div className="relative" ref={calRef}>
            <button
              onClick={() => setCalOpen(o => !o)}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Add to calendar"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
            </button>
            {calOpen && (
              <div className="absolute bottom-full right-0 mb-1.5 w-44 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden">
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setCalOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted transition-colors focus-visible:outline-none focus-visible:bg-muted"
                >
                  <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" /> Google Calendar
                </a>
                <a
                  href={icsUri}
                  download={`${session.title.replace(/\s+/g, '-').toLowerCase()}.ics`}
                  onClick={() => setCalOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted transition-colors border-t border-border focus-visible:outline-none focus-visible:bg-muted"
                >
                  <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" /> Apple / iCal
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)
```

Also add at the top of the file, after existing imports:
```tsx
import CostChip from './CostChip'
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Open http://localhost:3000. GameCards should show time in bold, cost chips where `cost_type` is set, no middot soup.

- [ ] **Step 3: Commit**

```bash
git add components/GameCard.tsx
git commit -m "feat(ui): GameCard hierarchy fix — bold time, cost chips, lucide calendar icons"
```

---

## Task 6: Filters — Lucide icons + weekend tab

**Files:**
- Modify: `components/Filters.tsx`
- Modify: `components/HomeClient.tsx`
- Modify: `components/LiveFeed.tsx`

- [ ] **Step 1: Read current Filters.tsx**

```bash
cat components/Filters.tsx
```

- [ ] **Step 2: Rewrite Filters.tsx**

Replace the entire file:

```tsx
'use client'

import { Waves, Trees, Building2, SlidersHorizontal } from 'lucide-react'

type TypeFilter  = 'all' | 'beach' | 'indoor' | 'grass'
type SkillFilter = 'all' | 'beginner' | 'intermediate' | 'competitive'
type DayFilter   = 'all' | 'today' | 'weekend'

interface FiltersProps {
  typeFilter: TypeFilter
  onTypeChange: (v: TypeFilter) => void
  skillFilter: SkillFilter
  onSkillChange: (v: SkillFilter) => void
  dayFilter: DayFilter
  onDayChange: (v: DayFilter) => void
}

const TYPE_OPTIONS: { value: TypeFilter; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { value: 'all',    label: 'All',    Icon: SlidersHorizontal },
  { value: 'beach',  label: 'Beach',  Icon: Waves },
  { value: 'grass',  label: 'Grass',  Icon: Trees },
  { value: 'indoor', label: 'Indoor', Icon: Building2 },
]

const SKILL_OPTIONS: { value: SkillFilter; label: string }[] = [
  { value: 'all',          label: 'Any skill' },
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'competitive',  label: 'Competitive' },
]

const DAY_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'today',   label: 'Today' },
  { value: 'weekend', label: 'Weekend' },
]

function PillRow<T extends string>({
  options, active, onChange,
}: {
  options: { value: T; label: string; Icon?: React.FC<{ className?: string }> }[]
  active: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {options.map(({ value, label, Icon }) => {
        const isActive = active === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-card/90 backdrop-blur text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function Filters({ typeFilter, onTypeChange, skillFilter, onSkillChange, dayFilter, onDayChange }: FiltersProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
      <PillRow options={TYPE_OPTIONS} active={typeFilter} onChange={onTypeChange} />
      <div className="flex items-center gap-1.5">
        <PillRow options={DAY_OPTIONS} active={dayFilter} onChange={onDayChange} />
        <div className="w-px h-4 bg-border/60" />
        <PillRow options={SKILL_OPTIONS} active={skillFilter} onChange={onSkillChange} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update HomeClient.tsx — add dayFilter state and pass it down**

Add `dayFilter` state and pass to both `Filters` and `LiveFeed`:

```tsx
// Add to state declarations:
const [dayFilter, setDayFilter] = useState<'all' | 'today' | 'weekend'>('all')

// Update Filters usage:
<Filters
  typeFilter={typeFilter}
  onTypeChange={setTypeFilter}
  skillFilter={skillFilter}
  onSkillChange={setSkillFilter}
  dayFilter={dayFilter}
  onDayChange={setDayFilter}
/>

// Update both LiveFeed usages (desktop and mobile drawer):
<LiveFeed
  venues={venues}
  sessions={sessions}
  typeFilter={typeFilter}
  skillFilter={skillFilter}
  dayFilter={dayFilter}
  searchQuery={searchQuery}
  userCoords={userCoords}
/>
```

- [ ] **Step 4: Update LiveFeed.tsx — add dayFilter prop and weekend filtering**

Add `dayFilter` to the props interface and filter logic:

```tsx
// Add to interface:
dayFilter?: 'all' | 'today' | 'weekend'

// Add to function signature:
export default function LiveFeed({
  venues, sessions, typeFilter, skillFilter = 'all', dayFilter = 'all', searchQuery = '', userCoords,
}: LiveFeedProps) {

// Add weekend day check helper (after distanceKm):
function isWeekendDay(dayOfWeek?: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6 // Sun or Sat
}

// Add dayFilter to the session filter:
const filtered = sessions.filter(s => {
  const venue = venueMap[s.venue_id]
  if (!venue) return false
  if (typeFilter !== 'all' && venue.type !== typeFilter) return false
  if (skillFilter !== 'all' && s.skill_level !== 'all' && s.skill_level !== skillFilter) return false
  if (q && !venue.name.toLowerCase().includes(q) && !venue.address.toLowerCase().includes(q)) return false
  if (dayFilter === 'weekend' && !isWeekendDay(s.day_of_week)) return false
  return true
})
```

- [ ] **Step 5: Update empty state in LiveFeed.tsx**

Find the empty state render (where no sessions show) and replace it with:

```tsx
// When today.length === 0 && upcoming.length === 0:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
  <span className="text-3xl opacity-30">🏐</span>
  <p className="text-sm font-semibold">No games match your filters</p>
  <p className="text-xs text-muted-foreground">Try adjusting the surface type, skill level, or day filter.</p>
  <button
    onClick={onClearFilters}
    className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
  >
    Clear all filters
  </button>
</div>
```

Add `onClearFilters` to LiveFeedProps interface:
```tsx
onClearFilters?: () => void
```

Pass it from HomeClient:
```tsx
<LiveFeed
  ...
  onClearFilters={() => { setTypeFilter('all'); setSkillFilter('all'); setDayFilter('all'); setSearchQuery('') }}
/>
```

- [ ] **Step 6: Verify**

```bash
npm run dev
```
Confirm: filter pills use icons instead of emoji, Weekend tab appears, clicking "Clear all filters" resets everything.

- [ ] **Step 7: Commit**

```bash
git add components/Filters.tsx components/HomeClient.tsx components/LiveFeed.tsx
git commit -m "feat(filters): Lucide icons, weekend tab, clear-filters empty state"
```

---

## Task 7: Venue detail — hero fallback + directions link + emoji removal

**Files:**
- Modify: `app/venues/[slug]/page.tsx`

- [ ] **Step 1: Replace the hero section (photo or gradient fallback)**

Replace the `{venue.photo_url && (...)}` block and the `<div className="h-1 w-16...">` bar with:

```tsx
{/* Hero: photo if available, gradient fallback otherwise */}
<div className="h-52 w-full rounded-xl overflow-hidden mb-6 border border-border">
  {venue.photo_url ? (
    <img src={venue.photo_url} alt={venue.name} className="w-full h-full object-cover" />
  ) : (
    <div
      className="w-full h-full flex items-end p-4"
      style={{
        background: venue.type === 'beach'
          ? 'linear-gradient(135deg, oklch(0.25 0.06 75) 0%, oklch(0.18 0.03 75) 100%)'
          : venue.type === 'grass'
          ? 'linear-gradient(135deg, oklch(0.22 0.06 145) 0%, oklch(0.17 0.03 145) 100%)'
          : 'linear-gradient(135deg, oklch(0.22 0.06 263) 0%, oklch(0.17 0.03 263) 100%)',
      }}
    >
      <span className="font-display font-bold text-5xl uppercase tracking-wide opacity-20"
        style={{ color: venueColor }}>
        {venue.type}
      </span>
    </div>
  )}
</div>
```

- [ ] **Step 2: Replace emoji typeLabel and add directions link**

Replace:
```tsx
const typeLabel = venue.type === 'beach' ? '🏖 Beach' : venue.type === 'grass' ? '🌿 Grass' : '🏟 Indoor'
```
With (import `Waves, Trees, Building2, Navigation` from lucide-react at top):
```tsx
const TypeIcon = venue.type === 'beach' ? Waves : venue.type === 'grass' ? Trees : Building2
const typeLabel = venue.type === 'beach' ? 'Beach' : venue.type === 'grass' ? 'Grass' : 'Indoor'
```

And replace the typeLabel span:
```tsx
<span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest" style={{ color: venueColor }}>
  <TypeIcon className="h-3.5 w-3.5" /> {typeLabel}
</span>
```

After the address `<p>`, add a directions link:
```tsx
<a
  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venue.address}, ${venue.city || 'Toronto'}, ON`)}`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
>
  <Navigation className="h-3 w-3" /> Get directions
</a>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```
Open a venue detail page (e.g., http://localhost:3000/venues/toronto-sandsharks). Confirm: gradient hero when no photo, icon-based type label, "Get directions" link present.

- [ ] **Step 4: Commit**

```bash
git add "app/venues/[slug]/page.tsx"
git commit -m "feat(venue): hero fallback gradient, directions link, Lucide type icons"
```

---

## Task 8: VenuePopover — directions link

**Files:**
- Modify: `components/VenuePopover.tsx`

- [ ] **Step 1: Add directions link below the address**

Import `Navigation` from lucide-react (already has `MapPin, X, ExternalLink, ArrowRight`).

After the address `<p>`, add:
```tsx
<a
  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venue.address}, ${venue.city || 'Toronto'}, ON`)}`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors mt-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
>
  <Navigation className="h-3 w-3" /> Get directions
</a>
```

- [ ] **Step 2: Commit**

```bash
git add components/VenuePopover.tsx
git commit -m "feat(popover): add get-directions link"
```

---

## Task 9: Accessibility pass

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Bump muted-foreground contrast**

In `app/globals.css`, change:
```css
--muted-foreground:    oklch(0.56 0.020 70);
```
To:
```css
--muted-foreground:    oklch(0.65 0.020 70);
```
This raises contrast ratio to ~4.5:1 on card background, passing WCAG AA.

- [ ] **Step 2: Add focus-visible utility class**

In `app/globals.css`, add to `@layer base`:
```css
:focus-visible {
  outline: 2px solid oklch(0.82 0.170 75);
  outline-offset: 2px;
  border-radius: 3px;
}
```

- [ ] **Step 3: Verify no regressions**

```bash
npm run dev
```
Tab through the page with keyboard. All interactive elements should show amber focus rings.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "fix(a11y): bump muted-foreground contrast to WCAG AA, add focus-visible ring"
```

---

## Task 10: CTA consolidation — remove triple "Add your game"

**Files:**
- Modify: `app/layout.tsx`
- Modify: `components/LiveFeed.tsx`

- [ ] **Step 1: Read current layout.tsx**

```bash
cat app/layout.tsx
```

- [ ] **Step 2: Keep CTA in header only**

Remove any "Add your game" button/link from:
- The sidebar footer in `LiveFeed.tsx` (if present)
- The page footer in `layout.tsx` (if present)

Keep it only in the header (`app/layout.tsx`). The header CTA is the canonical placement — visible always, doesn't compete with map chrome.

- [ ] **Step 3: Verify**

```bash
npm run dev
```
Confirm "Add your game" appears once — in the header only.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/LiveFeed.tsx
git commit -m "fix(ui): consolidate Add Your Game CTA to header only"
```

---

## Task 11: Seed script update — add cost_type to new venues

**Files:**
- Modify: `scripts/seed-supabase.mjs`

- [ ] **Step 1: Add cost_type to each session in seed-supabase.mjs**

For each session in the seed data, add the correct `cost_type`. Examples:
- Free public courts → `cost_type: 'free'`
- OVA leagues with registration → `cost_type: 'registration'`
- Drop-in with fee → `cost_type: 'paid', cost_cents: 500` (for $5)

Update a representative sample (not all — just the ones with known costs):
```js
// OVA Beach League
{ ..., cost_type: 'registration', notes: 'Spring (May–Jun), Summer (Jul–Sep), Fall (Sep) seasons.' }

// Ed's Beach VB
{ ..., cost_type: 'paid', cost_cents: 500, notes: 'RSVP on Meetup required. 5 divisions from Rec to Advanced.' }

// Public courts (Kew, Sunnyside)
{ ..., cost_type: 'free' }
```

Leave `cost_type: 'unknown'` for anything with unclear pricing — this is fine, CostChip renders nothing for unknown.

- [ ] **Step 2: Commit**

```bash
git add scripts/seed-supabase.mjs
git commit -m "data: add cost_type to seed sessions"
```

---

## Task 12: Final verification pass

- [ ] **Step 1: Build check**

```bash
npm run build
```
Expected: no TypeScript errors, no build failures.

- [ ] **Step 2: Visual walkthrough**

Open http://localhost:3000 and verify:
- [ ] Teardrop SVG pins render in type colors, live venues have pulse ring
- [ ] Filter pills use Lucide icons (no beach/grass/indoor emoji)
- [ ] Weekend filter works — shows only Sat/Sun recurring sessions
- [ ] GameCards: time is bold, cost chips show where set, no middot soup
- [ ] Empty state shows "Clear all filters" button that resets everything
- [ ] "Add your game" appears once (header only)
- [ ] Venue detail: gradient hero when no photo, directions link, icon type label
- [ ] Venue popover: directions link present
- [ ] Keyboard tab navigation shows amber focus rings on all interactive elements

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final polish pass — verify build clean"
```

---

## Backlog (not in this plan — future work)

- Weather chip: forecast for game day/time (requires hourly Open-Meteo endpoint per venue + date)
- First-visit legend overlay for map pin color system
- Spacing rhythm audit (gap-3 → gap-6 between day-groups in LiveFeed)
- Map live-ring uses CSS animation — confirm MapLibre doesn't strip keyframes on re-render
