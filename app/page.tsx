export const revalidate = 3600

import HomeClient from '@/components/HomeClient'
import DataLoadError from '@/components/DataLoadError'
import { getApprovedVenuesAndSessions, PublicDataError } from '@/lib/data'
import type { GameSession, Venue } from '@/types'

export default async function HomePage() {
  let venues: Venue[]
  let sessions: GameSession[]
  try {
    ;({ venues, sessions } = await getApprovedVenuesAndSessions())
  } catch (error) {
    if (error instanceof PublicDataError) return <DataLoadError />
    throw error
  }
  return (
    <div className="h-[calc(100dvh-3.25rem)] md:h-[calc(100dvh-5.75rem)] overflow-hidden">
      <h1 className="sr-only">Find pickup volleyball games in Toronto</h1>
      <HomeClient venues={venues} sessions={sessions} />
    </div>
  )
}
