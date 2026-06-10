export type VenueType = 'beach' | 'indoor' | 'grass'
export type SkillLevel = 'all' | 'beginner' | 'intermediate' | 'competitive'
export type CostType = 'free' | 'paid' | 'registration' | 'unknown'

export interface Venue {
  id: string
  name: string
  type: VenueType
  address: string
  lat: number
  lng: number
  photo_url?: string
  website?: string
  slug: string
  approved: boolean
  city: string
  created_at?: string
}

export interface GameSession {
  id: string
  venue_id: string
  venue?: Venue
  title: string
  day_of_week?: number // 0=Sun, 6=Sat; null if specific_date is set
  specific_date?: string // YYYY-MM-DD; null if recurring
  start_time: string // HH:MM
  end_time: string // HH:MM
  recurring: boolean
  skill_level: SkillLevel
  notes?: string
  contact_link?: string
  featured: boolean
  cost_type?: CostType
  cost_cents?: number | null
  cost_label?: string | null
}

export interface Submission {
  id: string
  name: string
  email: string
  venue_name: string
  address: string
  city: string
  type: VenueType
  website?: string
  schedule?: string
  contact_link?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Filters {
  type: 'all' | VenueType
  skillLevel: 'all' | SkillLevel
  day: 'all' | number
}

export type TypeFilter = 'all' | VenueType
export type DayFilter = 'all' | 'today' | 'weekend'
export type SkillFilter = 'all' | SkillLevel
