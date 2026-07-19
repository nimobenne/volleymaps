import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BATCH_IDS = 100

// In-memory best-effort rate limit — not distributed across serverless
// instances (resets per cold start), but stops naive scripted abuse from
// a single warm instance without adding new infra/dependencies. If real
// abuse shows up in prod, upgrade to Upstash Redis for a durable limit.
// Buckets are keyed "g:<ip>" (GET) and "p:<ip>" (POST) so read traffic
// can't starve toggles and vice versa.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_POST = 10
const RATE_LIMIT_MAX_GET = 30
const RATE_LIMIT_SWEEP_SIZE = 1000

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now()
  // Bounded memory: sweep expired windows once the map grows past the cap,
  // so long-lived warm instances don't accumulate one entry per IP forever.
  if (rateLimitMap.size > RATE_LIMIT_SWEEP_SIZE) {
    for (const [k, v] of rateLimitMap) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(k)
    }
  }
  const entry = rateLimitMap.get(key)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now })
    return false
  }
  entry.count++
  return entry.count > max
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
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

// Batch read: GET /api/rsvp?sessionIds=<uuid>,<uuid>,...&token=<uuid>
// Replaces the old per-session GET — the feed renders every session's button,
// so per-card fetches meant N requests and ~2N Supabase queries per page
// view. This answers all sessions in 2 queries total.
// Response: { counts: { [sessionId]: number }, going: string[] }
export async function GET(req: NextRequest) {
  if (isRateLimited(`g:${getIp(req)}`, RATE_LIMIT_MAX_GET)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const url = new URL(req.url)
  const raw = url.searchParams.get('sessionIds') ?? url.searchParams.get('sessionId') ?? ''
  const token = url.searchParams.get('token')

  const ids = raw.split(',').map(s => s.trim()).filter(s => UUID_RE.test(s)).slice(0, MAX_BATCH_IDS)
  if (ids.length === 0) {
    return NextResponse.json({ counts: {}, going: [] })
  }

  // No physical cleanup here — GET fires on page views; the created_at
  // filter makes reads correct regardless. Physical deletion happens
  // opportunistically on POST (an actual user action) instead.
  const supabase = getSupabase()
  const cutoff = new Date(Date.now() - RSVP_TTL_MS).toISOString()

  const [{ data: rows, error: rowsError }, mineRes] = await Promise.all([
    supabase.from('rsvps').select('session_id').in('session_id', ids).gte('created_at', cutoff),
    token && UUID_RE.test(token)
      ? supabase.from('rsvps').select('session_id').eq('token', token).in('session_id', ids).gte('created_at', cutoff)
      : Promise.resolve({ data: null, error: null }),
  ])
  if (rowsError) console.error('[rsvp] batch count error:', rowsError.message)
  if (mineRes.error) console.error('[rsvp] batch mine error:', mineRes.error.message)

  const counts: Record<string, number> = {}
  for (const id of ids) counts[id] = 0
  for (const row of rows ?? []) counts[row.session_id] = (counts[row.session_id] ?? 0) + 1

  const going = [...new Set((mineRes.data ?? []).map(r => r.session_id))]

  return NextResponse.json(
    { counts, going },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(req: NextRequest) {
  if (isRateLimited(`p:${getIp(req)}`, RATE_LIMIT_MAX_POST)) {
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
