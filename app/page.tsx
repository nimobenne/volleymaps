export const revalidate = 3600

import { Venue, GameSession } from '@/types'
import HomeClient from '@/components/HomeClient'
import { MOCK_VENUES, MOCK_SESSIONS } from '@/lib/mock-data'

const USE_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

async function getVenues(): Promise<Venue[]> {
  if (USE_MOCK) return MOCK_VENUES
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('venues')
    .select('*')
    .eq('approved', true)
    .order('name')
  return (data ?? []) as Venue[]
}

async function getSessions(): Promise<GameSession[]> {
  if (USE_MOCK) return MOCK_SESSIONS
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('game_sessions')
    .select('*')
    .order('start_time')
  return (data ?? []) as GameSession[]
}

export default async function HomePage() {
  const [venues, allSessions] = await Promise.all([getVenues(), getSessions()])
  const approvedVenueIds = new Set(venues.map(v => v.id))
  const sessions = allSessions.filter(s => approvedVenueIds.has(s.venue_id))
  return (
    <div className="h-[calc(100dvh-3.25rem)] md:h-[calc(100dvh-5.75rem)] overflow-hidden">
      <h1 className="sr-only">Find pickup volleyball games in Toronto</h1>
      <HomeClient venues={venues} sessions={sessions} />
    </div>
  )
}
