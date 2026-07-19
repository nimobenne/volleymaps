export const revalidate = 3600

import HomeClient from '@/components/HomeClient'
import { getApprovedVenuesAndSessions } from '@/lib/data'

export default async function HomePage() {
  const { venues, sessions } = await getApprovedVenuesAndSessions()
  return (
    <div className="h-[calc(100dvh-3.25rem)] md:h-[calc(100dvh-5.75rem)] overflow-hidden">
      <h1 className="sr-only">Find pickup volleyball games in Toronto</h1>
      <HomeClient venues={venues} sessions={sessions} />
    </div>
  )
}
