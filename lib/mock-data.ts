import { Venue, GameSession } from '@/types'

export const MOCK_VENUES: Venue[] = [
  {
    id: '1',
    name: 'Woodbine Beach',
    type: 'beach',
    address: '1675 Lake Shore Blvd E',
    city: 'Toronto',
    lat: 43.6621,
    lng: -79.3027,
    slug: 'woodbine-beach',
    approved: true,
  },
  {
    id: '2',
    name: 'Ashbridges Bay',
    type: 'beach',
    address: '1561 Lake Shore Blvd E',
    city: 'Toronto',
    lat: 43.6596,
    lng: -79.3120,
    slug: 'ashbridges-bay',
    approved: true,
  },
  {
    id: '3',
    name: 'Kew Beach',
    type: 'beach',
    address: '2075 Queen St E',
    city: 'Toronto',
    lat: 43.6643,
    lng: -79.2942,
    slug: 'kew-beach',
    approved: true,
  },
  {
    id: '4',
    name: 'Christie Pits Community Centre',
    type: 'indoor',
    address: '750 Bloor St W',
    city: 'Toronto',
    lat: 43.6645,
    lng: -79.4183,
    slug: 'christie-pits',
    approved: true,
  },
  {
    id: '5',
    name: "Hanlan's Point Beach",
    type: 'beach',
    address: 'Centre Island, Toronto Island',
    city: 'Toronto',
    lat: 43.6265,
    lng: -79.3871,
    slug: 'hanlans-point',
    approved: true,
  },
]

function minutesFromNow(offset: number): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() + offset)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const today = new Date().getDay()

export const MOCK_SESSIONS: GameSession[] = [
  {
    id: 's1',
    venue_id: '1',
    title: 'Saturday Drop-In',
    day_of_week: today,
    // Starts 1 hour ago, ends in 2 hours → Live Now
    start_time: minutesFromNow(-60),
    end_time: minutesFromNow(120),
    recurring: true,
    skill_level: 'all',
    notes: 'Casual games, all welcome. Bring water.',
    featured: false,
  },
  {
    id: 's2',
    venue_id: '4',
    title: 'Indoor Drop-In',
    day_of_week: today,
    // Starts in 20 min → Starting Soon
    start_time: minutesFromNow(20),
    end_time: minutesFromNow(200),
    recurring: true,
    skill_level: 'intermediate',
    notes: '$5 drop-in. Indoor courts. No spike serves.',
    contact_link: 'https://example.com',
    featured: false,
  },
  {
    id: 's3',
    venue_id: '2',
    title: 'Evening Pickup',
    day_of_week: today,
    // Starts in 2 hours → upcoming
    start_time: minutesFromNow(120),
    end_time: minutesFromNow(300),
    recurring: true,
    skill_level: 'competitive',
    notes: '4s and 6s. Competitive but friendly.',
    featured: true,
  },
  {
    id: 's4',
    venue_id: '3',
    title: 'Beach Doubles',
    day_of_week: today,
    start_time: minutesFromNow(180),
    end_time: minutesFromNow(360),
    recurring: true,
    skill_level: 'all',
    notes: 'Sand doubles. All levels. Bring sunscreen.',
    featured: false,
  },
  {
    id: 's5',
    venue_id: '1',
    title: 'Sunset Session',
    day_of_week: today,
    start_time: minutesFromNow(240),
    end_time: minutesFromNow(360),
    recurring: true,
    skill_level: 'beginner',
    notes: 'Great for newcomers. Patient group.',
    featured: false,
  },
]
