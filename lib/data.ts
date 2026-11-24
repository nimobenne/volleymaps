import { dbResult } from './db'
import { Venue, GameSession } from '@/types'
import { MOCK_VENUES, MOCK_SESSIONS } from './mock-data'

// Single public read layer: approved venues, mock fallback, seasons and logging.
const mockMode = () => !process.env.DATABASE_URL

export class PublicDataError extends Error {
  constructor() {
    super('Public data query failed')
    this.name = 'PublicDataError'
  }
}

function throwOnQueryError(error: { message: string } | null) {
  if (!error) return
  console.error('[data] public query failed:', error.message)
  throw new PublicDataError()
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
// September. A session not yet started (season_start in the future) is dropped
// the same way.
export function isInSeason(session: GameSession, today = torontoToday()): boolean {
  if (session.season_start && session.season_start > today) return false
  return !session.season_end || session.season_end >= today
}

export async function getVenues(): Promise<Venue[]> {
  if (mockMode()) return MOCK_VENUES
  const { data, error } = await dbResult<Venue>('SELECT * FROM venues WHERE approved = true ORDER BY name')
  throwOnQueryError(error)
  return (data ?? []) as Venue[]
}

export async function getSessions(): Promise<GameSession[]> {
  if (mockMode()) return MOCK_SESSIONS
  const { data, error } = await dbResult<GameSession>('SELECT s.* FROM game_sessions s JOIN venues v ON v.id = s.venue_id WHERE v.approved = true ORDER BY s.start_time')
  throwOnQueryError(error)
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
  if (mockMode()) return MOCK_VENUES.find(v => v.slug === slug) ?? null
  const { data, error } = await dbResult<Venue>('SELECT * FROM venues WHERE slug = $1 AND approved = true', [slug])
  throwOnQueryError(error)
  return data?.[0] ?? null
}

export async function getVenueSessions(venueId: string): Promise<GameSession[]> {
  if (mockMode()) return MOCK_SESSIONS.filter(s => s.venue_id === venueId)
  const { data, error } = await dbResult<GameSession>('SELECT s.* FROM game_sessions s JOIN venues v ON v.id = s.venue_id WHERE s.venue_id = $1 AND v.approved = true ORDER BY s.day_of_week, s.start_time', [venueId])
  throwOnQueryError(error)
  return ((data ?? []) as GameSession[]).filter(sess => isInSeason(sess))
}
