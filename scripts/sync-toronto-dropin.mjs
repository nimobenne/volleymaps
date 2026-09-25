// Syncs free City of Toronto adult drop-in volleyball into venues + game_sessions.
//
// Source: City of Toronto open data, "Registered Programs and Drop In Courses
// Offering" (refreshed daily, ~6 weeks of schedule at a time). Read straight
// from the CKAN datastore as JSON so there is no CSV parsing and no snapshot
// to go stale in the repo.
//
// Re-runnable: city venues use a `city-` slug prefix, and every run wipes and
// rebuilds only those venues' sessions. Hand-curated venues are never touched.
// Re-run it every few weeks — the city's window rolls forward and old sessions
// would otherwise linger on the map after they stop running.
//
// Usage:
//   node scripts/sync-toronto-dropin.mjs <supabase-url> <service-role-key>
//   node scripts/sync-toronto-dropin.mjs --dry-run

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getSeedClient } from './lib/seed-client.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CKAN = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search'
const DROPIN_RESOURCE = 'c99ec04f-4540-482c-9ee4-efb38774eab4'
const LOCATIONS_RESOURCE = 'f23ac1ad-6f46-4b59-811f-eb34be9b1f7a'
const COURSE_TITLES = ['Volleyball', 'Volleyball (Women)']

// Already on the map under hand-curated venues — adding them again would put a
// second pin on the same building.
const SKIP_LOCATION_IDS = new Set(['2773', '3643']) // TPASC, Canoe Landing CRC

const DAYS = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
const GTA_BOUNDS = { latMin: 43.4, latMax: 44.1, lngMin: -79.9, lngMax: -78.9 }

const dryRun = process.argv.includes('--dry-run')

async function ckanAll(resourceId, filters) {
  const out = []
  for (let offset = 0; ; offset += 1000) {
    const url = `${CKAN}?resource_id=${resourceId}&limit=1000&offset=${offset}` +
      (filters ? `&filters=${encodeURIComponent(JSON.stringify(filters))}` : '')
    const res = await fetch(url)
    if (!res.ok) throw new Error(`CKAN ${res.status} for ${resourceId}`)
    const { result } = await res.json()
    out.push(...result.records)
    if (out.length >= result.total || result.records.length === 0) return out
  }
}

const num = v => {
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

// VolleyMaps lists adult pickup. Drop youth programs, youth-capped programs,
// and 55+ programs — all are a different audience than the site serves.
function isAdult(row) {
  const lo = num(row['Age Min'])
  const hi = num(row['Age Max'])
  if (lo === null || lo < 16 || lo >= 55) return false
  if (hi !== null && hi < 24) return false
  return true
}

const pad = n => String(n).padStart(2, '0')
const hhmm = (h, m) => `${pad(h)}:${pad(m)}`

function slugify(name) {
  return 'city-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function addressOf(loc) {
  const clean = v => (v && v !== 'None' ? String(v) : '')
  return [clean(loc['Street No']), clean(loc['Street Name']), clean(loc['Street Type']), clean(loc['Street Direction'])]
    .filter(Boolean).join(' ')
}

// One CKAN row per occurrence. Collapse them into one weekly recurring session
// per (location, day, time-slot); a slot that only ever runs once becomes a
// one-off with a specific_date instead.
function toWeeklySessions(rows) {
  const groups = new Map()
  for (const r of rows) {
    const day = DAYS[r['DayOftheWeek']]
    if (day === undefined) continue
    const start = hhmm(r['Start Hour'], r['Start Minute'])
    const end = hhmm(r['End Hour'], r['End Min'])
    const key = [r['Location ID'], r['Course Title'], day, start, end, r['Age Min'], r['Section']].join('|')
    const g = groups.get(key)
    if (g) { g.dates.push(r['First Date']); continue }
    groups.set(key, {
      locationId: String(r['Location ID']),
      courseTitle: r['Course Title'],
      section: r['Section'],
      ageMin: r['Age Min'],
      day, start, end,
      dates: [r['First Date']],
    })
  }
  const sessions = [...groups.values()].map(g => {
    const dates = g.dates.sort()
    return { ...g, first: dates[0], last: dates[dates.length - 1], occurrences: dates.length }
  })

  // Hybrid centres publish the same slot twice, once as walk-in and once as
  // reservable. That is one game, not two — merge them so the map shows a
  // single card, and keep it free since walking in still works.
  const bySlot = new Map()
  for (const s of sessions) {
    const slot = [s.locationId, s.day, s.start, s.end].join('|')
    const seen = bySlot.get(slot)
    if (!seen) { bySlot.set(slot, { ...s, reservable: s.section === 'Reserve a Spot - Sports' }); continue }
    seen.reservable = true
    if (seen.section === 'Reserve a Spot - Sports') seen.section = s.section
    seen.occurrences = Math.max(seen.occurrences, s.occurrences)
    if (s.first < seen.first) seen.first = s.first
    if (s.last > seen.last) seen.last = s.last
  }
  return [...bySlot.values()]
}

function buildSessionRow(g, venueId) {
  // City drop-in sport costs nothing to play. "Reserve a Spot" slots are still
  // free — booking is how you get in the door, not a price — so they are `free`
  // with the booking called out in the notes. Keeping them as a third cost
  // bucket made them unfilterable against the leagues, which charge real money.
  const needsBooking = g.section === 'Reserve a Spot - Sports'
  const oneOff = g.occurrences === 1
  const women = g.courseTitle.includes('Women')
  const noteParts = [
    `City of Toronto drop-in. ${g.ageMin}+.`,
    needsBooking ? 'Reserve a spot online before attending.' : 'First come, first served.',
    !needsBooking && g.reservable ? 'A spot can also be reserved online.' : '',
    oneOff ? '' : `Runs ${g.first} to ${g.last}; city publishes about six weeks ahead.`,
  ]
  return {
    venue_id: venueId,
    // Title carries the programme only: day, time, level and venue each have
    // their own field and their own slot on the card.
    title: women ? 'City Drop-In (Women)' : 'City Drop-In',
    day_of_week: oneOff ? null : g.day,
    specific_date: oneOff ? g.first : null,
    start_time: g.start,
    end_time: g.end,
    recurring: !oneOff,
    skill_level: 'all',
    notes: noteParts.filter(Boolean).join(' '),
    contact_link: 'https://www.toronto.ca/explore-enjoy/parks-recreation/program-activities/sports/drop-in-sports-map/',
    cost_type: 'free',
    cost_label: needsBooking ? 'Free · book' : null,
    featured: false,
    // The city only publishes ~6 weeks out, so every imported session carries
    // the window it was published for. If this script is not re-run in time the
    // sessions retire themselves instead of advertising a schedule that has
    // already finished. Requires supabase/schema-v11.sql.
    season_start: oneOff ? null : g.first,
    season_end: oneOff ? null : g.last,
  }
}

function check(venues, sessions, geocodes) {
  const fail = []
  const slugs = new Set()
  for (const v of venues) {
    if (slugs.has(v.slug)) fail.push(`duplicate slug: ${v.slug}`)
    slugs.add(v.slug)
    if (!v.address) fail.push(`${v.slug}: empty address`)
    if (v.lat < GTA_BOUNDS.latMin || v.lat > GTA_BOUNDS.latMax ||
        v.lng < GTA_BOUNDS.lngMin || v.lng > GTA_BOUNDS.lngMax) {
      fail.push(`${v.slug}: ${v.lat},${v.lng} is outside the GTA`)
    }
  }
  for (const s of sessions) {
    if (s.end_time <= s.start_time) fail.push(`${s.title}: end ${s.end_time} <= start ${s.start_time}`)
    if (s.recurring === (s.specific_date !== null)) fail.push(`${s.title}: recurring/specific_date disagree`)
    if (s.recurring && s.day_of_week === null) fail.push(`${s.title}: recurring with no day_of_week`)
  }
  const unused = Object.keys(geocodes).filter(id => !venues.some(v => v.locationId === id))
  if (unused.length) console.warn(`  note: ${unused.length} geocode(s) no longer referenced: ${unused.join(', ')}`)
  return fail
}

// ---- build ----------------------------------------------------------------

const geocodes = JSON.parse(readFileSync(join(HERE, 'data', 'toronto-rec-geocodes.json'), 'utf8'))

console.log('Fetching City of Toronto drop-in data...')
const dropInRows = (await Promise.all(
  COURSE_TITLES.map(t => ckanAll(DROPIN_RESOURCE, { 'Course Title': t }))
)).flat()
console.log(`  ${dropInRows.length} volleyball occurrences`)

const adultRows = dropInRows.filter(isAdult).filter(r => !SKIP_LOCATION_IDS.has(String(r['Location ID'])))
const weekly = toWeeklySessions(adultRows)
console.log(`  ${adultRows.length} adult occurrences -> ${weekly.length} weekly sessions`)

const locationRows = await ckanAll(LOCATIONS_RESOURCE)
const locations = new Map(locationRows.map(l => [String(l['Location ID']), l]))

const wantedIds = [...new Set(weekly.map(g => g.locationId))]
const missingGeo = wantedIds.filter(id => !geocodes[id])
if (missingGeo.length) {
  console.error('✗ No geocode for location IDs: ' + missingGeo.join(', '))
  console.error('  Add them to scripts/data/toronto-rec-geocodes.json, then re-run.')
  for (const id of missingGeo) console.error(`    ${id}: ${locations.get(id)?.['Location Name'] ?? '(unknown)'}`)
  process.exit(1)
}

const venues = wantedIds.map(id => {
  const loc = locations.get(id)
  const name = loc?.['Location Name'] ?? geocodes[id].name
  return {
    locationId: id,
    name,
    type: 'indoor',
    address: addressOf(loc ?? {}) || geocodes[id].address,
    city: 'Toronto',
    lat: geocodes[id].lat,
    lng: geocodes[id].lng,
    slug: slugify(name),
    approved: true,
    website: 'https://www.toronto.ca/explore-enjoy/parks-recreation/program-activities/sports/drop-in-sports-map/',
  }
})

const failures = check(venues, weekly.map(g => buildSessionRow(g, 'placeholder')), geocodes)
if (failures.length) {
  console.error('✗ Validation failed:')
  for (const f of failures) console.error('  ' + f)
  process.exit(1)
}
console.log(`✓ ${venues.length} venues, ${weekly.length} sessions passed validation`)

if (dryRun) {
  for (const v of venues.slice().sort((a, b) => a.name.localeCompare(b.name))) {
    const mine = weekly.filter(g => g.locationId === v.locationId)
    console.log(`  ${v.name} (${v.slug})`)
    for (const g of mine.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))) {
      console.log(`      ${Object.keys(DAYS)[g.day]} ${g.start}-${g.end}  x${g.occurrences}  ${g.section}`)
    }
  }
  console.log('\nDry run — nothing written.')
  process.exit(0)
}

// ---- write ----------------------------------------------------------------

const supabase = getSeedClient('sync-toronto-dropin.mjs')

// Split into insert/update by slug rather than upserting on a conflict target:
// venues.slug has no unique index in any schema file in this repo, and
// onConflict would throw at runtime if it turns out there isn't one.
const slugs = venues.map(v => v.slug)
const { data: existing, error: lookupError } = await supabase
  .from('venues').select('id, slug').in('slug', slugs)
if (lookupError) { console.error('✗ Venue lookup:', lookupError.message); process.exit(1) }

const idBySlug = Object.fromEntries(existing.map(v => [v.slug, v.id]))
const toInsert = venues.filter(v => !idBySlug[v.slug]).map(({ locationId, ...v }) => v)
const toUpdate = venues.filter(v => idBySlug[v.slug])

if (toInsert.length) {
  const { data: inserted, error } = await supabase.from('venues').insert(toInsert).select('id, slug')
  if (error) { console.error('✗ Venue insert:', error.message); process.exit(1) }
  for (const v of inserted) idBySlug[v.slug] = v.id
}
for (const { locationId, slug, ...fields } of toUpdate) {
  const { error } = await supabase.from('venues').update(fields).eq('slug', slug)
  if (error) { console.error(`✗ Venue update ${slug}:`, error.message); process.exit(1) }
}
console.log(`✓ ${toInsert.length} venues added, ${toUpdate.length} updated`)

const venueIdBySlug = idBySlug

// Clear only this script's own sessions, so a re-run replaces a stale schedule
// instead of stacking a second copy on top of it.
const cityVenueIds = venues.map(v => venueIdBySlug[v.slug])
const { error: clearError } = await supabase.from('game_sessions').delete().in('venue_id', cityVenueIds)
if (clearError) { console.error('✗ Clearing old sessions:', clearError.message); process.exit(1) }

const sessionRows = weekly.map(g => {
  const venue = venues.find(v => v.locationId === g.locationId)
  return buildSessionRow(g, venueIdBySlug[venue.slug])
})
const { error: sessionError } = await supabase.from('game_sessions').insert(sessionRows)
if (sessionError) { console.error('✗ Sessions:', sessionError.message); process.exit(1) }
console.log(`✓ ${sessionRows.length} sessions inserted`)
console.log('\n✓ Sync complete.')
