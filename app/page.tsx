import { Venue, GameSession } from '@/types'
import HomeClient from '@/components/HomeClient'
import { MOCK_VENUES, MOCK_SESSIONS } from '@/lib/mock-data'

const USE_MOCK = !process.env.NEXT_PUBLIC_POCKETBASE_URL

async function getVenues(): Promise<Venue[]> {
  if (USE_MOCK) return MOCK_VENUES
  const { pb } = await import('@/lib/pocketbase')
  const records = await pb.collection('venues').getFullList({
    filter: 'approved = true',
    sort: 'name',
  })
  return records as unknown as Venue[]
}

async function getSessions(): Promise<GameSession[]> {
  if (USE_MOCK) return MOCK_SESSIONS
  const { pb } = await import('@/lib/pocketbase')
  const records = await pb.collection('game_sessions').getFullList({
    sort: 'start_time',
  })
  return records as unknown as GameSession[]
}

export default async function HomePage() {
  const [venues, sessions] = await Promise.all([getVenues(), getSessions()])
  return (
    <div className="h-full overflow-hidden">
      <HomeClient venues={venues} sessions={sessions} />
    </div>
  )
}
