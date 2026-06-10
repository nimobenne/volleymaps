'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: 'Wrong password' }
  }
  const cookieStore = await cookies()
  cookieStore.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  redirect('/admin')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/admin/login')
}

export async function rejectSubmission(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'rejected' })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { ok: true }
}

export async function approveSubmission(formData: FormData) {
  const supabase = createAdminClient()

  const submissionId = formData.get('submission_id') as string
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const type = formData.get('type') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const website = (formData.get('website') as string) || null
  const slugInput = (formData.get('slug') as string) || toSlug(name)

  if (isNaN(lat) || isNaN(lng)) return { error: 'Lat/Lng must be valid numbers' }

  const { error: venueError } = await supabase.from('venues').insert({
    name, address, city, type, lat, lng, website,
    slug: slugInput,
    approved: true,
  })
  if (venueError) return { error: venueError.message }

  const { error: subError } = await supabase
    .from('submissions')
    .update({ status: 'approved' })
    .eq('id', submissionId)
  if (subError) return { error: subError.message }

  // New venue is live immediately — bust the homepage + venue page caches
  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}

export async function addVenue(formData: FormData) {
  const supabase = createAdminClient()

  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const type = formData.get('type') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const website = (formData.get('website') as string) || null
  const slugInput = (formData.get('slug') as string) || toSlug(name)

  if (isNaN(lat) || isNaN(lng)) return { error: 'Lat/Lng must be valid numbers' }

  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .insert({ name, address, city, type, lat, lng, website, slug: slugInput, approved: true })
    .select()
    .single()
  if (venueError) return { error: venueError.message }

  // Optional session
  const sessionTitle = formData.get('session_title') as string
  if (sessionTitle && venue) {
    const dayRaw = formData.get('day_of_week') as string
    const { error: sessionError } = await supabase.from('game_sessions').insert({
      venue_id: venue.id,
      title: sessionTitle,
      day_of_week: dayRaw !== '' ? parseInt(dayRaw) : null,
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      skill_level: formData.get('skill_level') || 'all',
      notes: (formData.get('notes') as string) || null,
      contact_link: (formData.get('contact_link') as string) || null,
      recurring: true,
    })
    if (sessionError) return { error: sessionError.message }
  }

  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}
