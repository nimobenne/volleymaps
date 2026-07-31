// Usage: node scripts/seed-new-venues-jun2026.mjs <supabase-url> <service-role-key>
// Adds 7 new venues found via research (June 2026)

import { getSeedClient } from './lib/seed-client.mjs'

const supabase = getSeedClient('seed-new-venues-jun2026.mjs')

const venues = [
  {
    name: 'RendezViews Sand Court',
    type: 'beach',
    address: '229 Richmond St W',
    city: 'Toronto',
    lat: 43.6488,
    lng: -79.3937,
    slug: 'rendezviews-sand-court',
    approved: true,
    website: 'https://rendezviews.ca/beach-volleyball',
  },
  {
    name: 'JAM Sportsplex (Polson Pier)',
    type: 'beach',
    address: '176 Cherry St',
    city: 'Toronto',
    lat: 43.6409,
    lng: -79.3532,
    slug: 'jam-polson-pier',
    approved: true,
    website: 'https://toronto.jamsports.com/beachvolleyball',
  },
  {
    name: 'Off Limit Sports @ Woodbine',
    type: 'beach',
    address: '1675 Lake Shore Blvd E',
    city: 'Toronto',
    lat: 43.6621,
    lng: -79.3027,
    slug: 'off-limit-sports-woodbine',
    approved: true,
    website: 'https://www.offlimitsports.com',
  },
  {
    name: 'Wind Rain or Shine VB Club',
    type: 'beach',
    address: '1695 Lake Shore Blvd E',
    city: 'Toronto',
    lat: 43.6617,
    lng: -79.3032,
    slug: 'wind-rain-or-shine',
    approved: true,
    website: 'https://windrainorshine.com',
  },
  {
    name: 'Trinity Bellwoods Grass VB',
    type: 'grass',
    address: '790 Queen St W',
    city: 'Toronto',
    lat: 43.6464,
    lng: -79.4136,
    slug: 'trinity-bellwoods-grass-vb',
    approved: true,
    website: null,
  },
  {
    name: 'Lithuania Park Grass VB',
    type: 'grass',
    address: 'Keele St & Glenlake Ave',
    city: 'Toronto',
    lat: 43.6558,
    lng: -79.4575,
    slug: 'lithuania-park-grass-vb',
    approved: true,
    website: 'https://www.meetup.com/high-park-sunday-grass-volleyball',
  },
  {
    name: 'Toronto Volleyball Centre',
    type: 'indoor',
    address: '75 Carl Hall Rd',
    city: 'Toronto',
    lat: 43.7437,
    lng: -79.4742,
    slug: 'toronto-volleyball-centre',
    approved: true,
    website: 'https://momentumvolleyball.ca/adult-drop-in',
  },
]

const slugs = venues.map(v => v.slug)

// Upsert venues (insert or skip if slug already exists)
const { error: venueError } = await supabase.from('venues').upsert(venues, { onConflict: 'slug', ignoreDuplicates: true })
if (venueError) { console.error('Venues error:', venueError.message); process.exit(1) }

// Fetch inserted venue IDs by slug
const { data: insertedVenues, error: fetchError } = await supabase.from('venues').select('id, slug').in('slug', slugs)
if (fetchError) { console.error('Fetch error:', fetchError.message); process.exit(1) }
console.log(`+ ${insertedVenues.length} venues ready`)

const id = (slug) => insertedVenues.find(v => v.slug === slug)?.id

const sessions = [
  // RendezViews — free open play Wed-Fri + Sat
  { venue_id: id('rendezviews-sand-court'), title: 'RendezViews Open Play', day_of_week: 3, start_time: '16:00', end_time: '17:30', recurring: true, skill_level: 'all', notes: 'Free open play on the sand court. First come first served.', contact_link: 'https://rendezviews.ca/beach-volleyball', featured: false },
  { venue_id: id('rendezviews-sand-court'), title: 'RendezViews Open Play', day_of_week: 4, start_time: '16:00', end_time: '17:30', recurring: true, skill_level: 'all', notes: 'Free open play on the sand court. First come first served.', contact_link: 'https://rendezviews.ca/beach-volleyball', featured: false },
  { venue_id: id('rendezviews-sand-court'), title: 'RendezViews Open Play', day_of_week: 5, start_time: '16:00', end_time: '17:30', recurring: true, skill_level: 'all', notes: 'Free open play on the sand court. First come first served.', contact_link: 'https://rendezviews.ca/beach-volleyball', featured: false },
  { venue_id: id('rendezviews-sand-court'), title: 'RendezViews Saturday Play', day_of_week: 6, start_time: '16:00', end_time: '22:00', recurring: true, skill_level: 'all', notes: 'Free open play Saturday evenings. Urban beach escape downtown.', contact_link: 'https://rendezviews.ca/beach-volleyball', featured: false },

  // JAM Polson Pier — leagues daily, pointing to their site
  { venue_id: id('jam-polson-pier'), title: 'JAM Beach Volleyball Leagues', day_of_week: 1, start_time: '18:00', end_time: '22:00', recurring: true, skill_level: 'all', notes: 'JAM Sports runs leagues 7 days/week. Book via jamsports.com.', contact_link: 'https://toronto.jamsports.com/beachvolleyball', featured: false },
  { venue_id: id('jam-polson-pier'), title: 'JAM Beach Volleyball Leagues', day_of_week: 5, start_time: '18:00', end_time: '22:00', recurring: true, skill_level: 'all', notes: 'JAM Sports runs leagues 7 days/week. Book via jamsports.com.', contact_link: 'https://toronto.jamsports.com/beachvolleyball', featured: false },
  { venue_id: id('jam-polson-pier'), title: 'JAM Beach Volleyball Leagues', day_of_week: 6, start_time: '10:00', end_time: '20:00', recurring: true, skill_level: 'all', notes: 'JAM Sports runs leagues 7 days/week. Book via jamsports.com.', contact_link: 'https://toronto.jamsports.com/beachvolleyball', featured: false },
  { venue_id: id('jam-polson-pier'), title: 'JAM Beach Volleyball Leagues', day_of_week: 0, start_time: '10:00', end_time: '20:00', recurring: true, skill_level: 'all', notes: 'JAM Sports runs leagues 7 days/week. Book via jamsports.com.', contact_link: 'https://toronto.jamsports.com/beachvolleyball', featured: false },

  // Off Limit Sports @ Woodbine — Mon-Thu leagues
  { venue_id: id('off-limit-sports-woodbine'), title: 'OLS Coed 4s Beach League', day_of_week: 1, start_time: '18:00', end_time: '21:00', recurring: true, skill_level: 'intermediate', notes: 'Off Limit Sports Bonnie & Clyde 4s league. Register at offlimitsports.com.', contact_link: 'https://www.offlimitsports.com', featured: false },
  { venue_id: id('off-limit-sports-woodbine'), title: 'OLS Beach League', day_of_week: 2, start_time: '18:00', end_time: '21:00', recurring: true, skill_level: 'all', notes: 'Off Limit Sports beach league. Register at offlimitsports.com.', contact_link: 'https://www.offlimitsports.com', featured: false },
  { venue_id: id('off-limit-sports-woodbine'), title: 'OLS Beach League', day_of_week: 4, start_time: '18:00', end_time: '21:00', recurring: true, skill_level: 'all', notes: 'Off Limit Sports beach league. Register at offlimitsports.com.', contact_link: 'https://www.offlimitsports.com', featured: false },

  // Wind Rain or Shine — Mon men's int/adv
  { venue_id: id('wind-rain-or-shine'), title: "Wind Rain or Shine — Men's Open Play", day_of_week: 1, start_time: '18:00', end_time: '20:00', recurring: true, skill_level: 'intermediate', notes: "Monday men's intermediate/advanced open play. Check windrainorshine.com for schedule.", contact_link: 'https://windrainorshine.com', featured: false },

  // Trinity Bellwoods — Thursday grass, free
  { venue_id: id('trinity-bellwoods-grass-vb'), title: 'Trinity Bellwoods Community Grass VB', day_of_week: 4, start_time: '18:00', end_time: '20:00', recurring: true, skill_level: 'all', notes: 'Free outdoor grass volleyball every Thursday summer 2026. All levels welcome. Run by The League Volleyball.', contact_link: null, featured: false },

  // Lithuania Park — Sunday grass meetup
  { venue_id: id('lithuania-park-grass-vb'), title: 'Lithuania Park Grass Pickup', day_of_week: 0, start_time: '10:00', end_time: '13:00', recurring: true, skill_level: 'all', notes: 'Sunday grass pickup via High Park Sunday Grass VB Meetup group. Show up and play.', contact_link: 'https://www.meetup.com/high-park-sunday-grass-volleyball', featured: false },

  // Toronto Volleyball Centre — Momentum drop-ins
  { venue_id: id('toronto-volleyball-centre'), title: 'Momentum Drop-In Volleyball', day_of_week: 2, start_time: '19:00', end_time: '21:00', recurring: true, skill_level: 'all', notes: 'Momentum Volleyball adult drop-in at TVC. Check momentumvolleyball.ca for current schedule and pricing.', contact_link: 'https://momentumvolleyball.ca/adult-drop-in', featured: false },
  { venue_id: id('toronto-volleyball-centre'), title: 'Momentum Drop-In Volleyball', day_of_week: 4, start_time: '19:00', end_time: '21:00', recurring: true, skill_level: 'intermediate', notes: 'Momentum Volleyball adult drop-in at TVC (Thu intermediate+). Check momentumvolleyball.ca for schedule.', contact_link: 'https://momentumvolleyball.ca/adult-drop-in', featured: false },
]

console.log('Seeding sessions...')
const { error: sessionError } = await supabase.from('game_sessions').insert(sessions)
if (sessionError) { console.error('Sessions error:', sessionError.message); process.exit(1) }
console.log(`+ ${sessions.length} sessions inserted`)
console.log('\nDone.')
