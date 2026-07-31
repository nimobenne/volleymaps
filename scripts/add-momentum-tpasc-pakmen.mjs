// Adds Momentum Volleyball venues + enriches TPASC + Pakmen sessions
// Usage: node scripts/add-momentum-tpasc-pakmen.mjs <supabase-url> <service-role-key>

import { getSeedClient } from './lib/seed-client.mjs'

const supabase = getSeedClient('add-momentum-tpasc-pakmen.mjs')

// --- 1. Add Momentum Volleyball venues ---

const momentumVenues = [
  {
    name: 'Momentum Volleyball — The York School',
    type: 'indoor',
    address: '1320 Yonge St',
    city: 'Toronto',
    lat: 43.6852,
    lng: -79.3892,
    slug: 'momentum-york-school',
    approved: true,
    website: 'https://momentumvolleyball.ca',
  },
  {
    name: 'Momentum Volleyball — Toronto Volleyball Centre',
    type: 'indoor',
    address: '75 Carl Hall Rd',
    city: 'Toronto',
    lat: 43.7443,
    lng: -79.4752,
    slug: 'momentum-tvc-downsview',
    approved: true,
    website: 'https://momentumvolleyball.ca',
  },
  {
    name: 'Momentum Volleyball — Kings Court Etobicoke',
    type: 'indoor',
    address: '1589 The Queensway',
    city: 'Toronto',
    lat: 43.6195,
    lng: -79.5095,
    slug: 'momentum-kings-court',
    approved: true,
    website: 'https://momentumvolleyball.ca',
  },
]

console.log('Adding Momentum Volleyball venues...')
const { data: insertedVenues, error: venueError } = await supabase
  .from('venues')
  .insert(momentumVenues)
  .select()

if (venueError) { console.error('✗ Venues:', venueError.message); process.exit(1) }
console.log(`✓ ${insertedVenues.length} Momentum venues inserted`)

const venueIds = Object.fromEntries(insertedVenues.map(v => [v.slug, v.id]))

// --- 2. Momentum sessions (schedule is behind portal — link out) ---

const momentumSessions = [
  {
    venue_id: venueIds['momentum-york-school'],
    title: 'Momentum — Leagues & Drop-In (Central Toronto)',
    day_of_week: null,
    start_time: '09:00',
    end_time: '22:00',
    recurring: true,
    skill_level: 'all',
    notes: 'Leagues, drop-ins, and clinics for all levels. Check portal for current schedule.',
    contact_link: 'https://portal.momentumvolleyball.ca',
  },
  {
    venue_id: venueIds['momentum-tvc-downsview'],
    title: 'Momentum — Leagues & Drop-In (North York)',
    day_of_week: null,
    start_time: '09:00',
    end_time: '22:00',
    recurring: true,
    skill_level: 'all',
    notes: 'Leagues, drop-ins, and clinics for all levels. Check portal for current schedule.',
    contact_link: 'https://portal.momentumvolleyball.ca',
  },
  {
    venue_id: venueIds['momentum-kings-court'],
    title: 'Momentum — Leagues & Drop-In (Etobicoke)',
    day_of_week: null,
    start_time: '09:00',
    end_time: '22:00',
    recurring: true,
    skill_level: 'all',
    notes: 'Leagues, drop-ins, and clinics for all levels. Check portal for current schedule.',
    contact_link: 'https://portal.momentumvolleyball.ca',
  },
]

console.log('Adding Momentum sessions...')
const { error: mSessionError } = await supabase.from('game_sessions').insert(momentumSessions)
if (mSessionError) { console.error('✗ Momentum sessions:', mSessionError.message) }
else console.log(`✓ ${momentumSessions.length} Momentum sessions inserted`)

// --- 3. Add missing TPASC sessions ---
// Existing seed has only Friday 7:15pm. TPASC also runs:
//   Tuesday 3:15pm (All Access 17+), Sunday 5:15pm (60+), Wednesday 8:00pm (UTSC)

const { data: tpasc, error: tpascErr } = await supabase
  .from('venues')
  .select('id')
  .eq('slug', 'tpasc-adult-drop-in')
  .single()

if (tpascErr || !tpasc) {
  console.error('✗ TPASC venue not found — skipping TPASC sessions')
} else {
  const tpascSessions = [
    {
      venue_id: tpasc.id,
      title: 'TPASC All Access Drop-In (17+)',
      day_of_week: 2,
      start_time: '15:15',
      end_time: '17:15',
      recurring: true,
      skill_level: 'all',
      notes: 'All Access membership or drop-in fee. 17+. Phone 416-283-5222 to confirm.',
      contact_link: 'https://www.tpasc.ca/activities/volleyball',
    },
    {
      venue_id: tpasc.id,
      title: 'TPASC Drop-In Volleyball (60+)',
      day_of_week: 0,
      start_time: '17:15',
      end_time: '19:15',
      recurring: true,
      skill_level: 'all',
      notes: 'Seniors 60+ drop-in. Phone 416-283-5222 to confirm fee.',
      contact_link: 'https://www.tpasc.ca/activities/volleyball',
    },
    {
      venue_id: tpasc.id,
      title: 'TPASC UTSC Drop-In Volleyball',
      day_of_week: 3,
      start_time: '20:00',
      end_time: '22:00',
      recurring: true,
      skill_level: 'all',
      notes: 'U of T Scarborough students drop-in. Phone 416-283-5222 to confirm.',
      contact_link: 'https://www.tpasc.ca/activities/volleyball',
    },
  ]

  console.log('Adding TPASC sessions...')
  const { error: tpascSessionErr } = await supabase.from('game_sessions').insert(tpascSessions)
  if (tpascSessionErr) console.error('✗ TPASC sessions:', tpascSessionErr.message)
  else console.log(`✓ ${tpascSessions.length} TPASC sessions inserted`)
}

// --- 4. Add Pakmen self-run Friday night drop-in ---
// Existing Pakmen entry (slug: javelin-pakmen) has Javelin-booked sessions.
// Pakmen also run their own Friday 8pm–midnight drop-in at $20, intermediate+.

const { data: pakmen, error: pakmenErr } = await supabase
  .from('venues')
  .select('id')
  .eq('slug', 'javelin-pakmen')
  .single()

if (pakmenErr || !pakmen) {
  console.error('✗ Pakmen venue not found — skipping Pakmen session')
} else {
  const pakmenSession = {
    venue_id: pakmen.id,
    title: 'Pakmen Friday Night Drop-In',
    day_of_week: 5,
    start_time: '20:00',
    end_time: '23:59',
    recurring: true,
    skill_level: 'competitive',
    notes: '$20/session. Int–Advanced only, no beginners. 5–6 courts with tiered skill levels. Register online weekly at shoppakmen.com.',
    contact_link: 'https://www.shoppakmen.com/events/category/drop-ins/',
  }

  console.log('Adding Pakmen Friday night session...')
  const { error: pakmenSessionErr } = await supabase.from('game_sessions').insert([pakmenSession])
  if (pakmenSessionErr) console.error('✗ Pakmen session:', pakmenSessionErr.message)
  else console.log('✓ Pakmen Friday night drop-in inserted')
}

console.log('\n✓ Done.')
