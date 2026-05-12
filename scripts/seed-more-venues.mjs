// Adds more Toronto-area venues to PocketBase
import PocketBase from 'pocketbase'

const [email, password] = process.argv.slice(2)
const pb = new PocketBase('http://127.0.0.1:8090')

try {
  await pb.collection('_superusers').authWithPassword(email, password)
} catch {
  await pb.admins.authWithPassword(email, password)
}
console.log('✓ Authenticated')

const venues = [
  {
    name: 'Kew Balmy Beach',
    type: 'beach',
    address: '1 Kew Beach Ave',
    city: 'Toronto',
    lat: 43.6695,
    lng: -79.2984,
    slug: 'kew-balmy-beach',
    approved: true,
    website: '',
    photo_url: '',
  },
  {
    name: 'Sunnyside Beach',
    type: 'beach',
    address: '1755 Lake Shore Blvd W',
    city: 'Toronto',
    lat: 43.6363,
    lng: -79.4479,
    slug: 'sunnyside-beach',
    approved: true,
    website: '',
    photo_url: '',
  },
  {
    name: 'Marie Curtis Park Beach',
    type: 'beach',
    address: '20 Colonel Samuel Smith Park Dr',
    city: 'Toronto',
    lat: 43.5974,
    lng: -79.5430,
    slug: 'marie-curtis-park',
    approved: true,
    website: '',
    photo_url: '',
  },
  {
    name: 'Christie Pits Park',
    type: 'grass',
    address: '750 Bloor St W',
    city: 'Toronto',
    lat: 43.6650,
    lng: -79.4197,
    slug: 'christie-pits-park',
    approved: true,
    website: '',
    photo_url: '',
  },
  {
    name: 'High Park South Fields',
    type: 'grass',
    address: '1873 Bloor St W',
    city: 'Toronto',
    lat: 43.6468,
    lng: -79.4627,
    slug: 'high-park-south-fields',
    approved: true,
    website: '',
    photo_url: '',
  },
  {
    name: 'Greenwood Park',
    type: 'grass',
    address: '150 Greenwood Ave',
    city: 'Toronto',
    lat: 43.6672,
    lng: -79.3301,
    slug: 'greenwood-park',
    approved: true,
    website: '',
    photo_url: '',
  },
  {
    name: 'North York Community Centre',
    type: 'indoor',
    address: '5110 Yonge St',
    city: 'Toronto',
    lat: 43.7679,
    lng: -79.4147,
    slug: 'north-york-community-centre',
    approved: true,
    website: '',
    photo_url: '',
  },
  {
    name: 'Scarborough Village Recreation Centre',
    type: 'indoor',
    address: '3600 Kingston Rd',
    city: 'Toronto',
    lat: 43.7310,
    lng: -79.2268,
    slug: 'scarborough-village-rec',
    approved: true,
    website: '',
    photo_url: '',
  },
  {
    name: 'Etobicoke Olympium',
    type: 'indoor',
    address: '590 Rathburn Rd',
    city: 'Toronto',
    lat: 43.6424,
    lng: -79.5653,
    slug: 'etobicoke-olympium',
    approved: true,
    website: '',
    photo_url: '',
  },
  {
    name: 'George Bell Arena',
    type: 'indoor',
    address: '175 Ryding Ave',
    city: 'Toronto',
    lat: 43.6617,
    lng: -79.4779,
    slug: 'george-bell-arena',
    approved: true,
    website: '',
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
    console.error(`✗ ${v.name}:`, e.message)
  }
}

const sessions = [
  // Kew Balmy Beach — weekend pickup
  { venue_slug: 'kew-balmy-beach', title: 'Kew Beach Pickup', day_of_week: 6, start_time: '10:00', end_time: '14:00', recurring: true, skill_level: 'all', notes: 'Informal pickup at the beach courts. Show up and play.', contact_link: '' },
  { venue_slug: 'kew-balmy-beach', title: 'Kew Beach Pickup', day_of_week: 0, start_time: '11:00', end_time: '15:00', recurring: true, skill_level: 'all', notes: 'Informal pickup at the beach courts. Show up and play.', contact_link: '' },

  // Sunnyside Beach
  { venue_slug: 'sunnyside-beach', title: 'Sunnyside Beach Volleyball', day_of_week: 6, start_time: '09:00', end_time: '13:00', recurring: true, skill_level: 'all', notes: 'Public beach courts. First come, first served.', contact_link: '' },
  { venue_slug: 'sunnyside-beach', title: 'Sunnyside Beach Volleyball', day_of_week: 0, start_time: '10:00', end_time: '14:00', recurring: true, skill_level: 'all', notes: 'Public beach courts. First come, first served.', contact_link: '' },

  // Marie Curtis Park
  { venue_slug: 'marie-curtis-park', title: 'Marie Curtis Park Beach VB', day_of_week: 6, start_time: '10:00', end_time: '14:00', recurring: true, skill_level: 'all', notes: 'West-end beach courts near Etobicoke border.', contact_link: '' },

  // Christie Pits
  { venue_slug: 'christie-pits-park', title: 'Christie Pits Grass Pickup', day_of_week: 0, start_time: '11:00', end_time: '14:00', recurring: true, skill_level: 'all', notes: 'Casual grass pickup in the park. All welcome.', contact_link: '' },
  { venue_slug: 'christie-pits-park', title: 'Christie Pits Evening Pickup', day_of_week: 3, start_time: '18:00', end_time: '20:30', recurring: true, skill_level: 'all', notes: 'Weeknight grass volleyball. Bring your own net if possible.', contact_link: '' },

  // High Park
  { venue_slug: 'high-park-south-fields', title: 'High Park Grass VB', day_of_week: 6, start_time: '10:00', end_time: '13:00', recurring: true, skill_level: 'all', notes: 'South sports fields near Bloor St. Casual, all levels.', contact_link: '' },
  { venue_slug: 'high-park-south-fields', title: 'High Park Grass VB', day_of_week: 0, start_time: '10:00', end_time: '13:00', recurring: true, skill_level: 'all', notes: 'South sports fields near Bloor St. Casual, all levels.', contact_link: '' },

  // Greenwood Park
  { venue_slug: 'greenwood-park', title: 'Greenwood Park Pickup', day_of_week: 6, start_time: '10:30', end_time: '13:30', recurring: true, skill_level: 'all', notes: 'East end grass volleyball. Relaxed and social.', contact_link: '' },

  // North York CC
  { venue_slug: 'north-york-community-centre', title: 'North York Drop-In Volleyball', day_of_week: 2, start_time: '19:00', end_time: '21:00', recurring: true, skill_level: 'all', notes: 'City of Toronto drop-in. Check toronto.ca for current schedule and fees.', contact_link: 'https://www.toronto.ca/data/parks/prd/facilities/complex/153/index.html' },
  { venue_slug: 'north-york-community-centre', title: 'North York Drop-In Volleyball', day_of_week: 5, start_time: '19:30', end_time: '21:30', recurring: true, skill_level: 'all', notes: 'City of Toronto drop-in. Check toronto.ca for current schedule and fees.', contact_link: 'https://www.toronto.ca/data/parks/prd/facilities/complex/153/index.html' },

  // Scarborough Village
  { venue_slug: 'scarborough-village-rec', title: 'Scarborough Drop-In Volleyball', day_of_week: 4, start_time: '19:00', end_time: '21:00', recurring: true, skill_level: 'all', notes: 'City of Toronto drop-in. Check toronto.ca for current schedule and fees.', contact_link: '' },

  // Etobicoke Olympium
  { venue_slug: 'etobicoke-olympium', title: 'Etobicoke Drop-In Volleyball', day_of_week: 1, start_time: '19:00', end_time: '21:00', recurring: true, skill_level: 'all', notes: 'City of Toronto drop-in. Check toronto.ca for current schedule and fees.', contact_link: '' },
  { venue_slug: 'etobicoke-olympium', title: 'Etobicoke Drop-In Volleyball', day_of_week: 4, start_time: '19:00', end_time: '21:00', recurring: true, skill_level: 'all', notes: 'City of Toronto drop-in. Check toronto.ca for current schedule and fees.', contact_link: '' },

  // George Bell Arena
  { venue_slug: 'george-bell-arena', title: 'George Bell Drop-In Volleyball', day_of_week: 3, start_time: '19:30', end_time: '21:30', recurring: true, skill_level: 'all', notes: 'West end indoor drop-in.', contact_link: '' },
]

for (const s of sessions) {
  const venue_id = venueIds[s.venue_slug]
  if (!venue_id) { console.error(`✗ No venue ID for ${s.venue_slug}`); continue }
  const { venue_slug, ...data } = s
  try {
    await pb.collection('game_sessions').create({
      ...data,
      venue_id,
      contact_link: data.contact_link || undefined,
    })
    console.log(`✓ Session: ${s.title} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][s.day_of_week]})`)
  } catch (e) {
    console.error(`✗ Session ${s.title}:`, e.message)
  }
}

console.log('\n✓ Done. Total venues now seeded: 19')
