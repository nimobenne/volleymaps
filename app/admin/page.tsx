import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminAuthenticated } from '@/lib/admin-session'
import { Submission, Venue, GameSession } from '@/types'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')

  const supabase = createAdminClient()

  const [{ data: submissions }, { data: venues }, { data: sessions }] = await Promise.all([
    supabase.from('submissions').select('*').order('created_at', { ascending: false }),
    supabase.from('venues').select('*').order('name'),
    supabase.from('game_sessions').select('*').order('start_time'),
  ])

  return (
    <AdminClient
      submissions={(submissions ?? []) as Submission[]}
      venues={(venues ?? []) as Venue[]}
      sessions={(sessions ?? []) as GameSession[]}
    />
  )
}
