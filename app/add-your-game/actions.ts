'use server'

import { dbResult } from '@/lib/db'
import { safeHttpUrl } from '@/lib/safe-url'

export async function submitGame(data: FormData) {
  if (data.get('website_url')) return { ok: true }
  const field = (name: string, max: number) => String(data.get(name) ?? '').trim().slice(0, max)
  const name = field('name', 100)
  const email = field('email', 200)
  const venueName = field('venue_name', 100)
  const address = field('address', 200)
  const city = field('city', 100)
  const type = field('type', 20)
  const schedule = field('schedule', 500)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email address.' }
  if (!name || !venueName || !address || !city || !schedule || !['beach', 'grass', 'indoor'].includes(type)) {
    return { error: 'Please complete all required fields.' }
  }
  const { error } = await dbResult(
    "INSERT INTO submissions (name, email, venue_name, address, city, type, schedule, website, contact_link, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')",
    [name, email, venueName, address, city, type, schedule,
      safeHttpUrl(field('website', 2000)), safeHttpUrl(field('contact_link', 2000))],
  )
  if (error) {
    console.error('[submissions] database error:', error.message)
    return { error: 'Something went wrong. Please try again.' }
  }
  return { ok: true }
}
