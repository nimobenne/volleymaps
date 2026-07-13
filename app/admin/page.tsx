import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminAuthenticated } from '@/lib/admin-session'
import { Submission, Venue } from '@/types'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')

  const supabase = createAdminClient()

  const [{ data: submissions }, { data: venues }] = await Promise.all([
    supabase.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('venues').select('*').order('name'),
  ])

  return (
    <AdminClient
      submissions={(submissions ?? []) as Submission[]}
      venues={(venues ?? []) as Venue[]}
    />
  )
}
