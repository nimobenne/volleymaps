import { createAdminClient } from '@/lib/supabase-admin'
import { Submission, Venue } from '@/types'
import AdminClient from './AdminClient'

export default async function AdminPage() {
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
