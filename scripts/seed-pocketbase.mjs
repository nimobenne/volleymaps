// Usage: node scripts/seed-pocketbase.mjs <admin-email> <admin-password>

import PocketBase from 'pocketbase'

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error('Usage: node scripts/seed-pocketbase.mjs <email> <password>')
  process.exit(1)
}

const pb = new PocketBase('http://127.0.0.1:8090')

try {
  await pb.collection('_superusers').authWithPassword(email, password)
  console.log('✓ Authenticated')
} catch {
  try { await pb.admins.authWithPassword(email, password) } catch (e) {
    console.error('✗ Auth failed:', e.message); process.exit(1)
  }
}

const venues = [
  {
    name: 'Toronto Sandsharks',
    type: 'beach',
    address: '1675 Lake Shore Blvd E',
    city: 'Toronto',
    lat: 43.6621,
    lng: -79.3027,
    slug: 'toronto-sandsharks',
    approved: true,
    website: 'https://www.sandsharks.ca/',
    photo_url: '',
  },
  {
    name: 'Ashbridges Bay Beach VB (OVA)',
    type: 'beach',
    address: 'Ashbridges Bay Park Rd',
    city: 'Toronto',
    lat: 43.6596,
    lng: -79.3120,
    slug: 'ashbridges-bay-ova',
    approved: true,
    website: 'https://www.ashbridgesvolleyball.com/',
    photo_url: '',
  },
  {
    name: "Beach VB Social Group (Ed's Meetup)",
    type: 'beach',
    address: '30 Ashbridges Bay Park Rd',
    city: 'Toronto',
    lat: 43.6596,
    lng: -79.3120,
    slug: 'eds-beach-vb-meetup',
    approved: true,
    website: 'https://www.meetup.com/beach-vball/',
    photo_url: '',
  },
  {
    name: 'Junction Pickup Volleyball',
    type: 'beach',
    address: '221 Ryding Ave',
    city: 'Toronto',
    lat: 43.6653,
    lng: -79.4769,
    slug: 'junction-pickup-volleyball',
    approved: true,
    website: 'https://www.meetup.com/junction-pickup-volleyball/',
    photo_url: '',
  },
  {
    name: 'TPASC Adult Drop-In Volleyball',
    type: 'indoor',
    address: '875 Morningside Ave',
    city: 'Toronto',
    lat: 43.7844,
    lng: -79.1916,
    slug: 'tpasc-adult-drop-in',
    approved: true,
    website: 'https://www.tpasc.ca/activities/volleyball',
    photo_url: '',
  },
  {
    name: 'Javelin Sports @ Eastdale CI',
    type: 'indoor',
    address: '701 Gerrard St E',
    city: 'Toronto',
    lat: 43.6641,
    lng: -79.3337,
    slug: 'javelin-eastdale',
    approved: true,
    website: 'https://www.javelinsportsinc.com/volleyball-dropin/downtown-toronto',
    photo_url: '',
  },
  {
    name: 'Javelin Sports @ Canoe Landing',
    type: 'indoor',
    address: '45 Fort York Blvd',
    city: 'Toronto',
    lat: 43.6393,
    lng: -79.3975,
    slug: 'javelin-canoe-landing',
    approved: true,
    website: 'https://www.javelinsportsinc.com/volleyball-dropin/downtown-toronto',
    photo_url: '',
  },
  {
    name: 'U of T Athletic Centre Drop-In',
    type: 'indoor',
    address: '55 Harbord Street',
    city: 'Toronto',
    lat: 43.6637,
    lng: -79.3998,
    slug: 'uoft-athletic-centre',
    approved: true,
    website: 'https://kpe.utoronto.ca/sport-recreationrecreational-fitness-drop-sportsdrop-sports-activities/drop-volleyball',
    photo_url: '',
  },
  {
    name: 'Javelin Sports @ Pakmen Courts',
    type: 'indoor',
    address: '1775 Sismet Rd',
    city: 'Mississauga',
    lat: 43.6108,
    lng: -79.6362,
    slug: 'javelin-pakmen',
    approved: true,
    website: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto',
    photo_url: '',
  },
]

const venueIds = {}

for (const v of venues) {
  try {
    const record = await pb.collection('venues').create(v)
    venueIds[v.slug] = record.id
    console.log(`✓ Venue: ${v.name}`)
  } catch (e) {
    console.error(`✗ Venue ${v.name}:`, e.message)
  }
}

// Sessions — day_of_week: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const sessions = [
  // Sandsharks — weekends
  { venue_slug: 'toronto-sandsharks', title: 'Sandsharks Weekend Open Play', day_of_week: 6, start_time: '10:00', end_time: '14:00', recurring: true, skill_level: 'all', notes: 'Register online first at sandsharks.ca to get schedule details', contact_link: 'https://www.sandsharks.ca/' },
  { venue_slug: 'toronto-sandsharks', title: 'Sandsharks Weekend Open Play', day_of_week: 0, start_time: '10:00', end_time: '14:00', recurring: true, skill_level: 'all', notes: 'Register online first at sandsharks.ca to get schedule details', contact_link: 'https://www.sandsharks.ca/' },

  // Ashbridges OVA
  { venue_slug: 'ashbridges-bay-ova', title: 'OVA Beach League', day_of_week: 6, start_time: '09:00', end_time: '17:00', recurring: true, skill_level: 'all', notes: 'Spring (May–Jun), Summer (Jul–Sep), Fall (Sep) seasons. Mix n Match program available.', contact_link: 'https://www.ashbridgesvolleyball.com/' },

  // Ed's Meetup — weekends + weeknights
  { venue_slug: 'eds-beach-vb-meetup', title: "Ed's Beach VB Social — Weekend", day_of_week: 6, start_time: '09:00', end_time: '12:00', recurring: true, skill_level: 'all', notes: '$5 CAD cash per event. RSVP on Meetup required. 5 divisions from Rec to Advanced.', contact_link: 'https://www.meetup.com/beach-vball/' },
  { venue_slug: 'eds-beach-vb-meetup', title: "Ed's Beach VB Social — Weekend", day_of_week: 0, start_time: '09:00', end_time: '12:00', recurring: true, skill_level: 'all', notes: '$5 CAD cash per event. RSVP on Meetup required. 5 divisions from Rec to Advanced.', contact_link: 'https://www.meetup.com/beach-vball/' },

  // Junction Pickup
  { venue_slug: 'junction-pickup-volleyball', title: 'Junction Sunday Pickup', day_of_week: 0, start_time: '10:30', end_time: '13:00', recurring: true, skill_level: 'all', notes: 'Casual grass volleyball (not sand). All welcome.', contact_link: 'https://www.meetup.com/junction-pickup-volleyball/' },

  // TPASC
  { venue_slug: 'tpasc-adult-drop-in', title: 'TPASC Friday Drop-In (17+)', day_of_week: 5, start_time: '19:15', end_time: '21:15', recurring: true, skill_level: 'all', notes: 'Call 416-283-5222 to confirm drop-in fee. Also 60+ Sundays 5:15PM.', contact_link: 'https://www.tpasc.ca/activities/volleyball' },

  // Javelin Eastdale
  { venue_slug: 'javelin-eastdale', title: 'Javelin Thursday Drop-In — High Int', day_of_week: 4, start_time: '18:00', end_time: '20:00', recurring: true, skill_level: 'intermediate', notes: '$10.00 per session. 18+. Cancel 4hr before via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/downtown-toronto' },

  // Javelin Canoe Landing
  { venue_slug: 'javelin-canoe-landing', title: 'Javelin Friday Drop-In — High Rec', day_of_week: 5, start_time: '18:30', end_time: '21:30', recurring: true, skill_level: 'intermediate', notes: '$14.69 per session. 18+. Cancel 4hr before via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/downtown-toronto' },

  // U of T
  { venue_slug: 'uoft-athletic-centre', title: 'U of T Drop-In Volleyball', day_of_week: 1, start_time: '12:10', end_time: '13:30', recurring: true, skill_level: 'all', notes: 'Members and U of T students only. Spring 2026: May 4–Jun 28. Weekdays 12:10–8:55PM, weekends 12:10–4:55PM.', contact_link: 'https://kpe.utoronto.ca/sport-recreationrecreational-fitness-drop-sportsdrop-sports-activities/drop-volleyball' },
  { venue_slug: 'uoft-athletic-centre', title: 'U of T Drop-In Volleyball', day_of_week: 3, start_time: '12:10', end_time: '13:30', recurring: true, skill_level: 'all', notes: 'Members and U of T students only.', contact_link: 'https://kpe.utoronto.ca/sport-recreationrecreational-fitness-drop-sportsdrop-sports-activities/drop-volleyball' },
  { venue_slug: 'uoft-athletic-centre', title: 'U of T Drop-In Volleyball', day_of_week: 5, start_time: '12:10', end_time: '13:30', recurring: true, skill_level: 'all', notes: 'Members and U of T students only.', contact_link: 'https://kpe.utoronto.ca/sport-recreationrecreational-fitness-drop-sportsdrop-sports-activities/drop-volleyball' },

  // Pakmen
  { venue_slug: 'javelin-pakmen', title: 'Pakmen Monday Drop-In', day_of_week: 1, start_time: '20:00', end_time: '22:00', recurring: true, skill_level: 'intermediate', notes: '$10.50–$12.29 per session. 18+. Book via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto' },
  { venue_slug: 'javelin-pakmen', title: 'Pakmen Thursday Drop-In', day_of_week: 4, start_time: '22:00', end_time: '23:59', recurring: true, skill_level: 'competitive', notes: '$10.50–$12.29 per session. 18+. Book via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto' },
  { venue_slug: 'javelin-pakmen', title: 'Pakmen Friday Drop-In', day_of_week: 5, start_time: '18:00', end_time: '21:00', recurring: true, skill_level: 'intermediate', notes: '$10.50–$12.29 per session. 18+. Book via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto' },
  { venue_slug: 'javelin-pakmen', title: 'Pakmen Saturday Drop-In', day_of_week: 6, start_time: '18:00', end_time: '21:00', recurring: true, skill_level: 'all', notes: '$10.50–$12.29 per session. 18+. Book via Javelin app.', contact_link: 'https://www.javelinsportsinc.com/volleyball-dropin/toronto' },
]

for (const s of sessions) {
  const venue_id = venueIds[s.venue_slug]
  if (!venue_id) { console.error(`✗ No venue ID for ${s.venue_slug}`); continue }
  const { venue_slug, ...data } = s
  try {
    await pb.collection('game_sessions').create({ ...data, venue_id })
    console.log(`✓ Session: ${s.title} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][s.day_of_week]})`)
  } catch (e) {
    console.error(`✗ Session ${s.title}:`, e.message)
  }
}

console.log('\n✓ Seed complete. Check http://127.0.0.1:8090/_/ → Collections')
