import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// In-memory best-effort rate limit — not distributed across serverless
// instances (resets per cold start), but stops naive scripted abuse from
// a single warm instance without adding new infra/dependencies. If real
// abuse shows up in prod, upgrade to Upstash Redis for a durable limit.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const RSVP_TTL_MS = 24 * 60 * 60 * 1000

// RSVPs are "going today" signals, not permanent attendance records — wipe
// anything older than 24h so counts don't linger across future occurrences
// of a recurring session.
async function cleanupStale(supabase: ReturnType<typeof getSupabase>, sessionId: string) {
  const cutoff = new Date(Date.now() - RSVP_TTL_MS).toISOString()
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('session_id', sessionId)
    .lt('created_at', cutoff)
  if (error) console.error('[rsvp] cleanup error:', error.message)
}

// Filters by created_at directly so counts are correct even if a cleanup
// delete was skipped or hasn't run yet — correctness never depends on the
// physical DELETE succeeding.
async function getCount(supabase: ReturnType<typeof getSupabase>, sessionId: string) {
  const cutoff = new Date(Date.now() - RSVP_TTL_MS).toISOString()
  const { count, error } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .gte('created_at', cutoff)
  if (error) console.error('[rsvp] count error:', error.message)
  return count ?? 0
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  const token = url.searchParams.get('token')
  if (!sessionId || !UUID_RE.test(sessionId)) return NextResponse.json({ count: 0, going: false })

  // No physical cleanup here — GET fires on every page view (unauthenticated,
  // no rate limiting in this app), so deleting on every read turns page
  // traffic directly into DB write volume. getCount()'s created_at filter
  // already makes reads correct regardless; physical deletion happens
  // opportunistically on POST (an actual user action) instead.
  const supabase = getSupabase()
  const cutoff = new Date(Date.now() - RSVP_TTL_MS).toISOString()

  const [count, { data: mine }] = await Promise.all([
    getCount(supabase, sessionId),
    token && UUID_RE.test(token)
      ? supabase.from('rsvps').select('id').eq('session_id', sessionId).eq('token', token).gte('created_at', cutoff).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return NextResponse.json(
    { count, going: !!mine },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let sessionId: unknown, token: unknown
  try {
    ;({ sessionId, token } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (
    typeof sessionId !== 'string' || !UUID_RE.test(sessionId) ||
    typeof token !== 'string' || !UUID_RE.test(token)
  ) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const supabase = getSupabase()
  await cleanupStale(supabase, sessionId)

  // Toggle atomically: try to delete an existing RSVP first; if nothing was
  // deleted, insert. A concurrent duplicate insert hits the unique constraint
  // (23505) and is treated as already-going.
  let going: boolean
  const { data: deleted, error: delError } = await supabase
    .from('rsvps')
    .delete()
    .eq('session_id', sessionId)
    .eq('token', token)
    .select('id')

  if (delError) {
    console.error('[rsvp] delete error:', delError.message)
    return NextResponse.json({ error: 'RSVP failed' }, { status: 500 })
  }

  if (deleted && deleted.length > 0) {
    going = false
  } else {
    const { error: insError } = await supabase.from('rsvps').insert({ session_id: sessionId, token })
    if (insError && insError.code !== '23505') {
      console.error('[rsvp] insert error:', insError.message)
      return NextResponse.json({ error: 'RSVP failed' }, { status: 500 })
    }
    going = true
  }

  const count = await getCount(supabase, sessionId)
  return NextResponse.json({ count, going })
}
