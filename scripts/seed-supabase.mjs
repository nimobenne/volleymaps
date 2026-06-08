// Usage: node scripts/seed-supabase.mjs <supabase-url> <service-role-key>
// Get these from Supabase → project → Settings → API

import { createClient } from '@supabase/supabase-js'

const [url, key] = process.argv.slice(2)
if (!url || !key) {
  console.error('Usage: node scripts/seed-supabase.mjs <supabase-url> <service-role-key>')
  process.exit(1)
}

const supabase = createClient(url, key)

const venues = [
  { name: 'Toronto Sandsharks', type: 'beach', address: '1675 Lake Shore Blvd E', city: 'Toronto', lat: 43.6621, lng: -79.3027, slug: 'toronto-sandsharks', approved: true, website: 'https://www.sandsharks.ca/' },
  { name: 'Ashbridges Bay Beach VB (OVA)', type: 'beach', address: 'Ashbridges Bay Park Rd', city: 'Toronto', lat: 43.6596, lng: -79.3120, slug: 'ashbridges-bay-ova', approved: true, website: 'https://www.ashbridgesvolleyball.com/' },
  { name: "Beach VB Social Group (Ed's Meetup)", type: 'beach', address: '30 Ashbridges Bay Park Rd', city: 'Toronto', lat: 43.6596, lng: -79.3120, slug: 'eds-beach-vb-meetup', approved: true, website: 'https://www.meetup.com/beach-vball/' },
  { name: 'Junction Pickup Volleyball', type: 'grass', address: '221 Ryding Ave', city: 'Toronto', lat: 43.6653, lng: -79.4769, slug: 'junction-pickup-volleyball', approved: true, website: 'https://www.meetup.com/junction-pickup-volleyball/' },
  { name: 'TPASC Adult Drop-In Volleyball', type: 'indoor', address: '875 Morningside Ave', city: 'Toronto', lat: 43.7844, lng: -79.1916, slug: 'tpasc-adult-drop-in', approved: true, website: 'https://www.tpasc.ca/activities/volleyball' },
  { name: 'Javelin Sports @ Eastdale CI', type: 'indoor', address: '701 Gerrard St E', city: 'Toronto', lat: 43.6641, lng: -79.3337, slug: 'javelin-eastdale', approved: true, website: 'https://www.javelinsportsinc.com/volleyball-dropin/downtown-toronto' },
  { name: 'Javelin Sports @ Canoe Landing', type: 'indoor', address: '45 Fort York Blvd', city: 'Toronto', lat: 43.6393, lng: -79.3975, slug: 'javelin-canoe-landing', approved: true, website: 'https://www.javelinsportsinc.com/volleyball-dropin/downtown-toronto' },
  { name: 'U of T Athletic Centre Drop-In', type: 'indoor', address: '55 Harbord Street', city: 'Toronto', lat: 43.6637, lng: -79.3998, slug: 'uoft-athletic-centre', approved: true, website: 'https://kpe.utoronto.ca/sport-recreationrecreational-fitness-drop-sportsdrop-sports-activities/drop-volleyball' },
  { name: 'Javelin Sports @ Pakmen Courts', type: 'indoor', address: '1775 Sismet Rd', city: 'Mississauga', lat: 43.6108, lng: -79.6362, slug: 'javelin-pakmen', approved: true, website: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto' },
]

console.log('Seeding venues...')
const { data: insertedVenues, error: venueError } = await supabase
  .from('venues')
  .insert(venues)
  .select()

if (venueError) { console.error('✗ Venues:', venueError.message); process.exit(1) }
console.log(`✓ ${insertedVenues.length} venues inserted`)

const venueIds = Object.fromEntries(insertedVenues.map(v => [v.slug, v.id]))

const sessions = [
  { venue_id: venueIds['toronto-sandsharks'], title: 'Sandsharks Weekend Open Play', day_of_week: 6, start_time: '10:00', end_time: '14:00', recurring: true, skill_level: 'all', cost_type: 'registration', notes: 'Register online first at sandsharks.ca to get schedule details', contact_link: 'https://www.sandsharks.ca/' },
  { venue_id: venueIds['toronto-sandsharks'], title: 'Sandsharks Weekend Open Play', day_of_week: 0, start_time: '10:00', end_time: '14:00', recurring: true, skill_level: 'all', cost_type: 'registration', notes: 'Register online first at sandsharks.ca to get schedule details', contact_link: 'https://www.sandsharks.ca/' },
  { venue_id: venueIds['ashbridges-bay-ova'], title: 'OVA Beach League', day_of_week: 6, start_time: '09:00', end_time: '17:00', recurring: true, skill_level: 'all', cost_type: 'registration', notes: 'Spring (May–Jun), Summer (Jul–Sep), Fall (Sep) seasons. Mix n Match program available.', contact_link: 'https://www.ashbridgesvolleyball.com/' },
  { venue_id: venueIds['eds-beach-vb-meetup'], title: "Ed's Beach VB Social — Weekend", day_of_week: 6, start_time: '09:00', end_time: '12:00', recurring: true, skill_level: 'all', cost_type: 'paid', cost_cents: 500, notes: '$5 CAD cash per event. RSVP on Meetup required. 5 divisions from Rec to Advanced.', contact_link: 'https://www.meetup.com/beach-vball/' },
  { venue_id: venueIds['eds-beach-vb-meetup'], title: "Ed's Beach VB Social — Weekend", day_of_week: 0, start_time: '09:00', end_time: '12:00', recurring: true, skill_level: 'all', cost_type: 'paid', cost_cents: 500, notes: '$5 CAD cash per event. RSVP on Meetup required. 5 divisions from Rec to Advanced.', contact_link: 'https://www.meetup.com/beach-vball/' },
  { venue_id: venueIds['junction-pickup-volleyball'], title: 'Junction Sunday Pickup', day_of_week: 0, start_time: '10:30', end_time: '13:00', recurring: true, skill_level: 'all', cost_type: 'free', notes: 'Casual grass volleyball. All welcome.', contact_link: 'https://www.meetup.com/junction-pickup-volleyball/' },
  { venue_id: venueIds['tpasc-adult-drop-in'], title: 'TPASC Friday Drop-In (17+)', day_of_week: 5, start_time: '19:15', end_time: '21:15', recurring: true, skill_level: 'all', notes: 'Call 416-283-5222 to confirm drop-in fee.', contact_link: 'https://www.tpasc.ca/activities/volleyball' },
  { venue_id: venueIds['javelin-eastdale'], title: 'Javelin Thursday Drop-In — High Int', day_of_week: 4, start_time: '18:00', end_time: '20:00', recurring: true, skill_level: 'intermediate', cost_type: 'paid', cost_cents: 1000, notes: '$10.00 per session. 18+. Cancel 4hr before via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/downtown-toronto' },
  { venue_id: venueIds['javelin-canoe-landing'], title: 'Javelin Friday Drop-In — High Rec', day_of_week: 5, start_time: '18:30', end_time: '21:30', recurring: true, skill_level: 'intermediate', cost_type: 'paid', cost_cents: 1469, notes: '$14.69 per session. 18+. Cancel 4hr before via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/downtown-toronto' },
  { venue_id: venueIds['uoft-athletic-centre'], title: 'U of T Drop-In Volleyball', day_of_week: 1, start_time: '12:10', end_time: '13:30', recurring: true, skill_level: 'all', notes: 'Members and U of T students only. Spring 2026: May 4–Jun 28.', contact_link: 'https://kpe.utoronto.ca/sport-recreationrecreational-fitness-drop-sportsdrop-sports-activities/drop-volleyball' },
  { venue_id: venueIds['uoft-athletic-centre'], title: 'U of T Drop-In Volleyball', day_of_week: 3, start_time: '12:10', end_time: '13:30', recurring: true, skill_level: 'all', notes: 'Members and U of T students only.', contact_link: 'https://kpe.utoronto.ca/sport-recreationrecreational-fitness-drop-sportsdrop-sports-activities/drop-volleyball' },
  { venue_id: venueIds['uoft-athletic-centre'], title: 'U of T Drop-In Volleyball', day_of_week: 5, start_time: '12:10', end_time: '13:30', recurring: true, skill_level: 'all', notes: 'Members and U of T students only.', contact_link: 'https://kpe.utoronto.ca/sport-recreationrecreational-fitness-drop-sportsdrop-sports-activities/drop-volleyball' },
  { venue_id: venueIds['javelin-pakmen'], title: 'Pakmen Monday Drop-In', day_of_week: 1, start_time: '20:00', end_time: '22:00', recurring: true, skill_level: 'intermediate', cost_type: 'paid', cost_cents: 1050, notes: '$10.50–$12.29 per session. 18+. Book via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto' },
  { venue_id: venueIds['javelin-pakmen'], title: 'Pakmen Thursday Drop-In', day_of_week: 4, start_time: '22:00', end_time: '23:59', recurring: true, skill_level: 'competitive', cost_type: 'paid', cost_cents: 1050, notes: '$10.50–$12.29 per session. 18+. Book via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto' },
  { venue_id: venueIds['javelin-pakmen'], title: 'Pakmen Friday Drop-In', day_of_week: 5, start_time: '18:00', end_time: '21:00', recurring: true, skill_level: 'intermediate', cost_type: 'paid', cost_cents: 1050, notes: '$10.50–$12.29 per session. 18+. Book via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto' },
  { venue_id: venueIds['javelin-pakmen'], title: 'Pakmen Saturday Drop-In', day_of_week: 6, start_time: '18:00', end_time: '21:00', recurring: true, skill_level: 'all', cost_type: 'paid', cost_cents: 1050, notes: '$10.50–$12.29 per session. 18+. Book via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto' },
]

console.log('Seeding sessions...')
const { error: sessionError } = await supabase.from('game_sessions').insert(sessions)
if (sessionError) { console.error('✗ Sessions:', sessionError.message); process.exit(1) }
console.log(`✓ ${sessions.length} sessions inserted`)
console.log('\n✓ Seed complete.')
