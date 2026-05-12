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
  const [venues, sessions] = await Promise.all([getVenues(), getSessions()])
  return (
    <div className="h-full overflow-hidden">
      <HomeClient venues={venues} sessions={sessions} />
    </div>
  )
}
