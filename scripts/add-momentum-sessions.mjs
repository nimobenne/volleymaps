// Fills the Momentum venues that were sitting on the map with zero sessions.
//
// Source: momentumvolleyball.ca/adult-drop-in, read 2026-09-25.
//
// Scope note: `momentum-tvc-downsview` is deliberately NOT filled here. It is
// one of three separate venue rows for 75 Carl Hall Rd (alongside
// `toronto-volleyball-centre` and `tvc-the-hangar`), so adding sessions to it
// would deepen a duplicate-pin problem rather than fix it. Those three need to
// be merged first — a decision that changes public URLs.
// `momentum-kings-court` is also left alone: Momentum publishes no volleyball
// drop-in there, so there is nothing verified to add.
//
// Usage:
//   node scripts/add-momentum-sessions.mjs [--dry-run] <supabase-url> <service-role-key>

import { createClient } from '@supabase/supabase-js'

const dryRun = process.argv.includes('--dry-run')
const [url, key] = process.argv.slice(2).filter(a => !a.startsWith('--'))
if (!url || !key) {
  console.error('Usage: node scripts/add-momentum-sessions.mjs [--dry-run] <supabase-url> <service-role-key>')
  process.exit(1)
}
const supabase = createClient(url, key)

const NOTE = 'Momentum Volleyball adult drop-in. Book a spot at momentumvolleyball.ca; sessions are non-refundable and non-transferable.'
const LINK = 'https://momentumvolleyball.ca/adult-drop-in'

const base = { recurring: true, featured: false, cost_type: 'paid', cost_label: 'Drop-in fee', notes: NOTE, contact_link: LINK }

// Venue that already exists and is empty — fill it.
const YORK_SCHOOL_SLUG = 'momentum-york-school'
const yorkSessions = [
  { ...base, title: 'Momentum Drop-In', day_of_week: 6, start_time: '15:00', end_time: '17:00', skill_level: 'intermediate' },
  { ...base, title: 'Momentum Drop-In', day_of_week: 6, start_time: '17:00', end_time: '19:00', skill_level: 'competitive' },
]

// Venue that does not exist yet — create it, then fill it.
const delaSalleVenue = {
  name: 'De La Salle College',
  type: 'indoor',
  address: '131 Farnham Ave',
  city: 'Toronto',
  lat: 43.682346,
  lng: -79.398302,
  slug: 'momentum-de-la-salle',
  approved: true,
  website: 'https://momentumvolleyball.ca/adult-drop-in',
}
const delaSalleSessions = [
  { ...base, title: "Momentum Women's Drop-In", day_of_week: 6, start_time: '16:30', end_time: '18:30', skill_level: 'intermediate' },
  { ...base, title: 'Momentum Drop-In', day_of_week: 6, start_time: '18:30', end_time: '20:30', skill_level: 'intermediate' },
  { ...base, title: 'Momentum Drop-In', day_of_week: 0, start_time: '20:00', end_time: '22:00', skill_level: 'competitive' },
]

const { data: venues, error: vErr } = await supabase.from('venues').select('id, slug, name')
if (vErr) { console.error('✗ venues:', vErr.message); process.exit(1) }
const bySlug = Object.fromEntries(venues.map(v => [v.slug, v]))

const york = bySlug[YORK_SCHOOL_SLUG]
if (!york) { console.error(`✗ venue ${YORK_SCHOOL_SLUG} not found`); process.exit(1) }

const { data: existing, error: eErr } = await supabase
  .from('game_sessions').select('id, venue_id, day_of_week, start_time')
if (eErr) { console.error('✗ sessions:', eErr.message); process.exit(1) }

// Re-running must not stack a second copy of the same slot.
const taken = new Set(existing.map(s => `${s.venue_id}|${s.day_of_week}|${s.start_time}`))
const newYork = yorkSessions.filter(s => !taken.has(`${york.id}|${s.day_of_week}|${s.start_time}`))

const delaSalleExists = !!bySlug[delaSalleVenue.slug]

console.log(`${YORK_SCHOOL_SLUG}: ${newYork.length} session(s) to add`)
console.log(`${delaSalleVenue.slug}: ${delaSalleExists ? 'venue exists' : 'venue to create'}, ${delaSalleSessions.length} session(s)`)

if (dryRun) {
  for (const s of [...newYork, ...delaSalleSessions]) {
    console.log(`  d${s.day_of_week} ${s.start_time}-${s.end_time}  ${s.title}  (${s.skill_level})`)
  }
  console.log('\nDry run — nothing written.')
  process.exit(0)
}

if (newYork.length) {
  const { error } = await supabase.from('game_sessions').insert(newYork.map(s => ({ ...s, venue_id: york.id })))
  if (error) { console.error('✗ York School sessions:', error.message); process.exit(1) }
  console.log(`✓ ${newYork.length} session(s) added to ${york.name}`)
}

let delaSalleId = bySlug[delaSalleVenue.slug]?.id
if (!delaSalleId) {
  const { data, error } = await supabase.from('venues').insert(delaSalleVenue).select('id').single()
  if (error) { console.error('✗ De La Salle venue:', error.message); process.exit(1) }
  delaSalleId = data.id
  console.log('✓ De La Salle College venue created')
}

const newDelaSalle = delaSalleSessions.filter(s => !taken.has(`${delaSalleId}|${s.day_of_week}|${s.start_time}`))
if (newDelaSalle.length) {
  const { error } = await supabase.from('game_sessions').insert(newDelaSalle.map(s => ({ ...s, venue_id: delaSalleId })))
  if (error) { console.error('✗ De La Salle sessions:', error.message); process.exit(1) }
  console.log(`✓ ${newDelaSalle.length} session(s) added to De La Salle College`)
}

console.log('\n✓ Done.')
