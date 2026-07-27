// Adds Toronto Volleyball Centre (The Hangar) adult league
// Usage: node scripts/add-tvc.mjs <supabase-url> <service-role-key>

import { createClient } from '@supabase/supabase-js'

const [url, key] = process.argv.slice(2)
if (!url || !key) {
  console.error('Usage: node scripts/add-tvc.mjs <supabase-url> <service-role-key>')
  process.exit(1)
}

const supabase = createClient(url, key)

const venue = {
  name: 'Toronto Volleyball Centre — The Hangar',
  type: 'indoor',
  address: '75 Carl Hall Rd',
  city: 'Toronto',
  lat: 43.7445,
  lng: -79.4750,
  slug: 'tvc-the-hangar',
  approved: true,
  website: 'https://torontovolleyballcentre.ca',
}

console.log('Adding TVC venue...')
const { data: inserted, error: venueError } = await supabase
  .from('venues')
  .insert([venue])
  .select()
  .single()

if (venueError) { console.error('✗ Venue:', venueError.message); process.exit(1) }
console.log(`✓ Venue inserted: ${inserted.name}`)

const sessions = [
  {
    venue_id: inserted.id,
    title: 'TVC Thursday Intermediate Co-Ed League (7:15pm)',
    day_of_week: 4,
    start_time: '19:15',
    end_time: '20:45',
    recurring: true,
    skill_level: 'intermediate',
    notes: 'Momentum-run league. May 21–Jul 23, 2026. $229+HST individual / $1,249+HST team. Register at momentumvolleyball.ca. Contact: programs@momentumvolleyball.ca',
    contact_link: 'https://momentumvolleyball.ca',
  },
  {
    venue_id: inserted.id,
    title: 'TVC Thursday Intermediate Co-Ed League (8:45pm)',
    day_of_week: 4,
    start_time: '20:45',
    end_time: '22:15',
    recurring: true,
    skill_level: 'intermediate',
    notes: 'Momentum-run league. May 21–Jul 23, 2026. $229+HST individual / $1,249+HST team. Register at momentumvolleyball.ca. Contact: programs@momentumvolleyball.ca',
    contact_link: 'https://momentumvolleyball.ca',
  },
]

console.log('Adding TVC sessions...')
const { error: sessionError } = await supabase.from('game_sessions').insert(sessions)
if (sessionError) { console.error('✗ Sessions:', sessionError.message); process.exit(1) }
console.log(`✓ ${sessions.length} sessions inserted`)
console.log('\n✓ Done.')
