// One-shot data pass: move prices out of prose and into the structured cost
// fields, and cut titles down to the one thing the card doesn't already show.
//
// Why: the free/paid filter reads `cost_type`, and 39% of sessions said
// `unknown` — even though most of those notes already stated the price in
// words ("$14.69/session", "Free open play"). The information was collected,
// it just never landed in a field anything could filter on.
//
// Titles were doing the schema's job too: "Javelin Thursday Drop-In — High Int"
// repeats the day (day_of_week), the level (skill_level) and, on the card, the
// venue printed directly above it. Convention now: the program or organiser
// only. Everything else has its own slot.
//
// Keyed by (venue slug, current title) so it is explicit and auditable rather
// than inferring from string patterns. Safe to re-run: every change is an
// idempotent field write, nothing is inserted twice and nothing is deleted.
//
// Usage:
//   node scripts/backfill-sessions.mjs <supabase-url> <service-role-key>
//   node scripts/backfill-sessions.mjs --dry-run <supabase-url> <service-role-key>

import { createClient } from '@supabase/supabase-js'

const dryRun = process.argv.includes('--dry-run')
const [url, key] = process.argv.slice(2).filter(a => !a.startsWith('--'))
if (!url || !key) {
  console.error('Usage: node scripts/backfill-sessions.mjs [--dry-run] <supabase-url> <service-role-key>')
  process.exit(1)
}
const supabase = createClient(url, key)

// free    — you can turn up and play without paying
// paid    — money changes hands, whether per session or as a season/membership fee
// (cents is set only where an exact per-session price is confirmed)
const FIX = {
  'toronto-sandsharks': {
    // Verified on sandsharks.ca: pay-what-you-can, no per-session fee.
    'Sandsharks Weekend Open Play': { title: 'Sandsharks Open Play', cost_type: 'free', cost_label: 'PWYC' },
  },
  'ashbridges-bay-ova': {
    'OVA Beach League': { title: 'OVA Beach League', cost_type: 'paid', cost_label: 'League fee' },
  },
  'eds-beach-vb-meetup': {
    // Verified on meetup.com/beach-vball: CA$5.00 cash per event.
    "Ed's Beach VB Social": { title: "Ed's Beach Social", cost_type: 'paid', cost_cents: 500 },
  },
  'christie-pits-park': {
    'Christie Pits Grass Pickup': { title: 'Grass Pickup', cost_type: 'free' },
    'Christie Pits Evening Pickup': { title: 'Evening Grass Pickup', cost_type: 'free' },
  },
  'greenwood-park': {
    'Greenwood Park Pickup': { title: 'Grass Pickup', cost_type: 'free' },
  },
  'high-park-south-fields': {
    'High Park Grass VB': { title: 'Grass Pickup', cost_type: 'free' },
  },
  'junction-pickup-volleyball': {
    'Junction Sunday Pickup': { title: 'Grass Pickup', cost_type: 'free' },
  },
  'lithuania-park-grass-vb': {
    'Lithuania Park Grass Pickup': { title: 'Grass Pickup', cost_type: 'free' },
  },
  'trinity-bellwoods-grass-vb': {
    'Trinity Bellwoods Community Grass VB': { title: 'Community Grass Pickup', cost_type: 'free' },
  },
  'kew-balmy-beach': {
    'Kew Beach Pickup': { title: 'Beach Pickup', cost_type: 'free' },
  },
  'sunnyside-beach': {
    'Sunnyside Beach Volleyball': { title: 'Beach Pickup', cost_type: 'free' },
  },
  'marie-curtis-park': {
    'Marie Curtis Park Beach VB': { title: 'Beach Pickup', cost_type: 'free' },
  },
  'rendezviews-sand-court': {
    // Notes already said "Free open play" in prose.
    'RendezViews Open Play': { title: 'Open Play', cost_type: 'free' },
    'RendezViews Saturday Play': { title: 'Open Play', cost_type: 'free' },
  },
  'tpasc-adult-drop-in': {
    // Verified on tpasc.ca/portal/city-toronto/drop-rates: $4.96 adult 19–59,
    // $2.49 for 60+, pay-as-you-go sports drop-in.
    'TPASC All Access Drop-In (17+)': { title: 'TPASC All Access Drop-In', cost_type: 'paid', cost_cents: 496 },
    'TPASC Adult Drop-In (17+)': { title: 'TPASC Adult Drop-In', cost_type: 'paid', cost_cents: 496 },
    'TPASC Drop-In Volleyball (60+)': { title: 'TPASC Older Adult Drop-In', cost_type: 'paid', cost_cents: 249 },
    'TPASC UTSC Drop-In': { title: 'UTSC Student Drop-In', cost_type: 'paid', cost_label: 'UTSC students' },
  },
  'javelin-eastdale': {
    'Javelin Thursday Drop-In — High Int': { title: 'Javelin Drop-In', cost_type: 'paid', cost_cents: 1000, skill_level: 'intermediate' },
  },
  'javelin-canoe-landing': {
    'Javelin Friday Drop-In — High Rec': { title: 'Javelin Drop-In', cost_type: 'paid', cost_cents: 1469, skill_level: 'intermediate' },
  },
  'javelin-pakmen': {
    'Pakmen Monday Drop-In': { title: 'Javelin Drop-In', cost_type: 'paid', cost_cents: 1050, cost_label: '$10.50–12.29', skill_level: 'intermediate' },
    'Pakmen Thursday Drop-In': { title: 'Javelin Drop-In', cost_type: 'paid', cost_cents: 1050, cost_label: '$10.50–12.29', skill_level: 'competitive' },
    'Pakmen Friday Drop-In (Javelin)': { title: 'Javelin Drop-In', cost_type: 'paid', cost_cents: 1050, cost_label: '$10.50–12.29', skill_level: 'intermediate' },
    'Pakmen Saturday Drop-In': { title: 'Javelin Drop-In', cost_type: 'paid', cost_cents: 1229, skill_level: 'intermediate' },
    'Pakmen Friday Night Drop-In': { title: 'Pakmen Night Drop-In', cost_type: 'paid', cost_cents: 2000, skill_level: 'competitive' },
  },
  'uoft-athletic-centre': {
    'U of T Drop-In Volleyball': { title: 'U of T Drop-In', cost_type: 'paid', cost_label: 'Members only' },
  },
  'toronto-volleyball-centre': {
    'Momentum Drop-In Volleyball': { title: 'Momentum Drop-In', cost_type: 'paid', cost_label: 'Drop-in fee' },
  },
  'tvc-the-hangar': {
    'TVC Thursday League (7:15pm)': { title: 'Momentum League', cost_type: 'paid', cost_label: '$229 season', skill_level: 'intermediate' },
    'TVC Thursday League (8:45pm)': { title: 'Momentum League', cost_type: 'paid', cost_label: '$229 season', skill_level: 'intermediate' },
  },
  'jam-polson-pier': {
    'JAM Beach Volleyball Leagues': { title: 'JAM Beach League', cost_type: 'paid', cost_label: 'League fee' },
  },
  'off-limit-sports-woodbine': {
    'OLS Coed 4s Beach League': { title: 'OLS Coed 4s League', cost_type: 'paid', cost_label: 'League fee' },
    'OLS Beach League': { title: 'OLS Beach League', cost_type: 'paid', cost_label: 'League fee' },
  },
  'wind-rain-or-shine': {
    // Club open play, fee not published anywhere I could verify — title only.
    "Wind Rain or Shine — Men's Open": { title: "Men's Open Play", skill_level: 'intermediate' },
  },
  // These four are city facilities, but the live City of Toronto drop-in feed
  // lists no adult volleyball at any of them — so the sessions may be stale.
  // Titles are normalised; cost stays `unknown` rather than assuming free.
  'north-york-community-centre': {
    'North York Drop-In Volleyball': { title: 'Drop-In Volleyball' },
  },
  'scarborough-village-rec': {
    'Scarborough Drop-In Volleyball': { title: 'Drop-In Volleyball' },
  },
  'etobicoke-olympium': {
    'Etobicoke Drop-In Volleyball': { title: 'Drop-In Volleyball' },
  },
  'george-bell-arena': {
    'George Bell Drop-In Volleyball': { title: 'Drop-In Volleyball' },
  },
  'tmu': {
    // `registration` is retired: it meant "free but book" for city venues and
    // "pay a season fee" for leagues, which made it unfilterable. This one is
    // an email sign-up with no published price, so it is honestly `unknown`.
    'Drop-In Scrimmages': { cost_type: 'unknown' },
  },
}

// The 81 city rows follow one rule, so they don't need 81 table entries.
const CITY_TITLES = {
  'City Drop-In Volleyball': 'City Drop-In',
  'City Drop-In Volleyball (Women)': 'City Drop-In (Women)',
}

const { data: venues, error: vErr } = await supabase.from('venues').select('id, slug, name')
if (vErr) { console.error('✗ venues:', vErr.message); process.exit(1) }
const { data: sessions, error: sErr } = await supabase.from('game_sessions').select('*')
if (sErr) { console.error('✗ sessions:', sErr.message); process.exit(1) }

const venueById = Object.fromEntries(venues.map(v => [v.id, v]))

const updates = []
const untouched = []

for (const s of sessions) {
  const venue = venueById[s.venue_id]
  if (!venue) continue

  const cityTitle = CITY_TITLES[s.title]
  const patch = venue.slug.startsWith('city-') && cityTitle
    ? { title: cityTitle }
    : FIX[venue.slug]?.[s.title]

  if (!patch) {
    if (s.cost_type === 'unknown' || !s.cost_type) untouched.push({ venue: venue.name, title: s.title })
    continue
  }

  // Only write fields that actually change, so a re-run is a no-op.
  const changed = {}
  for (const [field, value] of Object.entries(patch)) {
    if (s[field] !== value) changed[field] = value
  }
  // An explicit label replaces a stale one; clear it when the new price speaks
  // for itself, otherwise an old "$10.50–12.29" would outlive its price.
  if (patch.cost_cents && !patch.cost_label && s.cost_label) changed.cost_label = null
  if (Object.keys(changed).length) updates.push({ id: s.id, venue: venue.name, was: s.title, changed })
}

console.log(`${sessions.length} sessions | ${updates.length} to update | ${untouched.length} left unknown`)

if (untouched.length) {
  console.log('\nStill `unknown` — no published price I could verify:')
  for (const u of untouched) console.log(`  ${u.venue} — ${u.title}`)
}

if (dryRun) {
  console.log('\nChanges:')
  for (const u of updates) console.log(`  ${u.venue} / ${u.was}\n      ${JSON.stringify(u.changed)}`)
  console.log('\nDry run — nothing written.')
  process.exit(0)
}

let failed = 0
for (const u of updates) {
  const { error } = await supabase.from('game_sessions').update(u.changed).eq('id', u.id)
  if (error) { console.error(`✗ ${u.venue} / ${u.was}:`, error.message); failed++ }
}
console.log(`\n✓ ${updates.length - failed} updated${failed ? `, ${failed} failed` : ''}`)

const { data: after } = await supabase.from('game_sessions').select('cost_type')
const counts = after.reduce((acc, s) => ({ ...acc, [s.cost_type ?? 'null']: (acc[s.cost_type ?? 'null'] ?? 0) + 1 }), {})
console.log('cost_type now:', counts)
