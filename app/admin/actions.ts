'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { createAdminSession, destroyAdminSession, isAdminAuthenticated, safeEqual } from '@/lib/admin-session'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || !password || !safeEqual(password, expected)) {
    return { error: 'Wrong password' }
  }
  await createAdminSession()
  redirect('/admin')
}

export async function logoutAction() {
  await destroyAdminSession()
  redirect('/admin/login')
}

export async function rejectSubmission(id: string) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }
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
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }
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

export async function updateVenue(formData: FormData) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }
  const supabase = createAdminClient()

  const venueId = formData.get('venue_id') as string
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const type = formData.get('type') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const website = (formData.get('website') as string) || null
  const slugInput = (formData.get('slug') as string) || toSlug(name)

  if (isNaN(lat) || isNaN(lng)) return { error: 'Lat/Lng must be valid numbers' }

  const { error } = await supabase
    .from('venues')
    .update({ name, address, city, type, lat, lng, website, slug: slugInput })
    .eq('id', venueId)
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}

function sessionFields(formData: FormData) {
  const recurring = formData.get('recurring') === 'on'
  const dayRaw = formData.get('day_of_week') as string
  const specificDate = (formData.get('specific_date') as string) || null

  return {
    title: formData.get('title') as string,
    recurring,
    day_of_week: recurring && dayRaw !== '' ? parseInt(dayRaw) : null,
    specific_date: recurring ? null : specificDate,
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    skill_level: (formData.get('skill_level') as string) || 'all',
    notes: (formData.get('notes') as string) || null,
    contact_link: (formData.get('contact_link') as string) || null,
    cost_type: (formData.get('cost_type') as string) || 'unknown',
    cost_label: (formData.get('cost_label') as string) || null,
    featured: formData.get('featured') === 'on',
  }
}

export async function updateSession(formData: FormData) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }
  const supabase = createAdminClient()

  const sessionId = formData.get('session_id') as string
  const { error } = await supabase
    .from('game_sessions')
    .update(sessionFields(formData))
    .eq('id', sessionId)
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}

export async function addSession(formData: FormData) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }
  const supabase = createAdminClient()

  const venueId = formData.get('venue_id') as string
  const { error } = await supabase
    .from('game_sessions')
    .insert({ venue_id: venueId, ...sessionFields(formData) })
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}

export async function deleteSession(id: string) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }
  const supabase = createAdminClient()
  const { error } = await supabase.from('game_sessions').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}

export async function addVenue(formData: FormData) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }
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
