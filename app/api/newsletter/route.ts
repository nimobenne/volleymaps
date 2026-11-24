import { NextRequest, NextResponse } from 'next/server'
import { dbResult } from '@/lib/db'
import { getClientIp, isRateLimited } from '@/lib/rate-limit'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  if (isRateLimited(`newsletter:${getClientIp(req.headers)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let email: unknown
  try {
    ;({ email } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const normalized = email.toLowerCase().trim()
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!normalized || !emailRe.test(normalized)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { error } = await dbResult(
    'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
    [normalized],
  )

  if (error) {
    console.error('[newsletter] database error:', error.message)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
