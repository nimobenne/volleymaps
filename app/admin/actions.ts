'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { dbResult } from '@/lib/db'
import { safeHttpUrl } from '@/lib/safe-url'
import { createAdminSession, destroyAdminSession, isAdminAuthenticated, safeEqual } from '@/lib/admin-session'
import { getClientIp, isRateLimited } from '@/lib/rate-limit'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function loginAction(formData: FormData) {
  const ip = getClientIp(await headers())
  if (isRateLimited(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    return { error: 'Wrong password' }
  }

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
  const { error } = await dbResult("UPDATE submissions SET status = 'rejected' WHERE id = $1", [id])
  if (error) return { error: error.message }
  revalidatePath('/')
  return { ok: true }
}

export async function approveSubmission(formData: FormData) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }

  const submissionId = formData.get('submission_id') as string
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const type = formData.get('type') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const website = safeHttpUrl(formData.get('website') as string)
  const slugInput = (formData.get('slug') as string) || toSlug(name)

  if (isNaN(lat) || isNaN(lng)) return { error: 'Lat/Lng must be valid numbers' }

  const { error: venueError } = await dbResult(
    'INSERT INTO venues (name, address, city, type, lat, lng, website, slug, approved) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)',
    [name, address, city, type, lat, lng, website, slugInput],
  )
  if (venueError) return { error: venueError.message }

  const { error: subError } = await dbResult("UPDATE submissions SET status = 'approved' WHERE id = $1", [submissionId])
  if (subError) return { error: subError.message }

  // New venue is live immediately — bust the homepage + venue page caches
  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}

export async function updateVenue(formData: FormData) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }

  const venueId = formData.get('venue_id') as string
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const type = formData.get('type') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const website = safeHttpUrl(formData.get('website') as string)
  const slugInput = (formData.get('slug') as string) || toSlug(name)

  if (isNaN(lat) || isNaN(lng)) return { error: 'Lat/Lng must be valid numbers' }

  const { error } = await dbResult(
    'UPDATE venues SET name=$1, address=$2, city=$3, type=$4, lat=$5, lng=$6, website=$7, slug=$8 WHERE id=$9',
    [name, address, city, type, lat, lng, website, slugInput, venueId],
  )
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
    contact_link: safeHttpUrl(formData.get('contact_link') as string),
    cost_type: (formData.get('cost_type') as string) || 'unknown',
    cost_label: (formData.get('cost_label') as string) || null,
    featured: formData.get('featured') === 'on',
  }
}

export async function updateSession(formData: FormData) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }

  const sessionId = formData.get('session_id') as string
  const { error } = await dbResult(
    'UPDATE game_sessions SET title=$1, recurring=$2, day_of_week=$3, specific_date=$4, start_time=$5, end_time=$6, skill_level=$7, notes=$8, contact_link=$9, cost_type=$10, cost_label=$11, featured=$12 WHERE id=$13',
    [...Object.values(sessionFields(formData)), sessionId],
  )
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}

export async function addSession(formData: FormData) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }

  const venueId = formData.get('venue_id') as string
  const { error } = await dbResult(
    'INSERT INTO game_sessions (venue_id, title, recurring, day_of_week, specific_date, start_time, end_time, skill_level, notes, contact_link, cost_type, cost_label, featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
    [venueId, ...Object.values(sessionFields(formData))],
  )
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}

export async function deleteSession(id: string) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }
  const { error } = await dbResult('DELETE FROM game_sessions WHERE id = $1', [id])
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}

export async function addVenue(formData: FormData) {
  if (!(await isAdminAuthenticated())) return { error: 'Unauthorized' }

  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const type = formData.get('type') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const website = safeHttpUrl(formData.get('website') as string)
  const slugInput = (formData.get('slug') as string) || toSlug(name)

  if (isNaN(lat) || isNaN(lng)) return { error: 'Lat/Lng must be valid numbers' }

  const { data: venues, error: venueError } = await dbResult<{ id: string }>(
    'INSERT INTO venues (name, address, city, type, lat, lng, website, slug, approved) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING id',
    [name, address, city, type, lat, lng, website, slugInput],
  )
  const venue = venues?.[0]
  if (venueError) return { error: venueError.message }

  // Optional session
  const sessionTitle = formData.get('session_title') as string
  if (sessionTitle && venue) {
    const dayRaw = formData.get('day_of_week') as string
    const { error: sessionError } = await dbResult(
      'INSERT INTO game_sessions (venue_id, title, day_of_week, start_time, end_time, skill_level, notes, contact_link, recurring) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)',
      [venue.id, sessionTitle, dayRaw !== '' ? parseInt(dayRaw) : null,
        formData.get('start_time'), formData.get('end_time'), formData.get('skill_level') || 'all',
        (formData.get('notes') as string) || null, safeHttpUrl(formData.get('contact_link') as string)],
    )
    if (sessionError) return { error: sessionError.message }
  }

  revalidatePath('/')
  revalidatePath('/venues/[slug]', 'page')
  return { ok: true }
}
