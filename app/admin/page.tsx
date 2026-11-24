import { redirect } from 'next/navigation'
import { dbResult } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/admin-session'
import { Submission, Venue, GameSession } from '@/types'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')

  const [{ data: submissions }, { data: venues }, { data: sessions }] = await Promise.all([
    dbResult<Submission>('SELECT * FROM submissions ORDER BY created_at DESC'),
    dbResult<Venue>('SELECT * FROM venues ORDER BY name'),
    dbResult<GameSession>('SELECT * FROM game_sessions ORDER BY start_time'),
  ])

  return (
    <AdminClient
      submissions={(submissions ?? []) as Submission[]}
      venues={(venues ?? []) as Venue[]}
      sessions={(sessions ?? []) as GameSession[]}
    />
  )
}
