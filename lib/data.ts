import { createClient } from '@supabase/supabase-js'
import { Venue, GameSession } from '@/types'
import { MOCK_VENUES, MOCK_SESSIONS } from './mock-data'

// Single server-side read layer for venues + sessions. Every page/route that
// reads public data goes through here so the mock fallback, the approved-only
// rule, and error logging live in exactly one place. (Admin mutations use
// lib/supabase-admin.ts with the service role key instead.)

const USE_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Today in Toronto, not in UTC. A session that ends on the 30th has to stay
// visible all of the 30th local time, and the server runs in UTC.
export function torontoToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

// A session with no season_end runs year-round. One whose season has passed is
// dropped here rather than in the UI, so a finished season cannot leak into the
// feed, the map, the venue page, the embed or the sitemap by way of some caller
// that forgot to check. Seasons used to live in `notes` as prose, which meant
// nothing could filter on them and U of T kept advertising spring sessions into
// September.
export function isInSeason(session: GameSession, today = torontoToday()): boolean {
  return !session.season_end || session.season_end >= today
}

export async function getVenues(): Promise<Venue[]> {
  if (USE_MOCK) return MOCK_VENUES
  const { data, error } = await getClient()
    .from('venues')
    .select('*')
    .eq('approved', true)
    .order('name')
  if (error) console.error('[data] getVenues error:', error.message)
  return (data ?? []) as Venue[]
}

export async function getSessions(): Promise<GameSession[]> {
  if (USE_MOCK) return MOCK_SESSIONS
  const { data, error } = await getClient()
    .from('game_sessions')
    .select('*')
    .order('start_time')
  if (error) console.error('[data] getSessions error:', error.message)
  return ((data ?? []) as GameSession[]).filter(sess => isInSeason(sess))
}

// Homepage data: venues plus only the sessions belonging to an approved
// venue — unapproved-venue sessions must never reach the client.
export async function getApprovedVenuesAndSessions(): Promise<{ venues: Venue[]; sessions: GameSession[] }> {
  const [venues, allSessions] = await Promise.all([getVenues(), getSessions()])
  const approvedVenueIds = new Set(venues.map(v => v.id))
  return { venues, sessions: allSessions.filter(s => approvedVenueIds.has(s.venue_id)) }
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  if (USE_MOCK) return MOCK_VENUES.find(v => v.slug === slug) ?? null
  const { data, error } = await getClient()
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .eq('approved', true)
    .single()
  // PGRST116 = no rows — an expected miss (bad slug), not an error worth logging
  if (error && error.code !== 'PGRST116') console.error('[data] getVenueBySlug error:', error.message)
  return (data as Venue) ?? null
}

export async function getVenueSessions(venueId: string): Promise<GameSession[]> {
  if (USE_MOCK) return MOCK_SESSIONS.filter(s => s.venue_id === venueId)
  const { data, error } = await getClient()
    .from('game_sessions')
    .select('*')
    .eq('venue_id', venueId)
    .order('day_of_week')
    .order('start_time')
  if (error) console.error('[data] getVenueSessions error:', error.message)
  return ((data ?? []) as GameSession[]).filter(sess => isInSeason(sess))
}
