import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getCount(supabase: ReturnType<typeof getSupabase>, sessionId: string) {
  const { count, error } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
  if (error) console.error('[rsvp] count error:', error.message)
  return count ?? 0
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  const token = url.searchParams.get('token')
  if (!sessionId || !UUID_RE.test(sessionId)) return NextResponse.json({ count: 0, going: false })

  const supabase = getSupabase()

  const [count, { data: mine }] = await Promise.all([
    getCount(supabase, sessionId),
    token && UUID_RE.test(token)
      ? supabase.from('rsvps').select('id').eq('session_id', sessionId).eq('token', token).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return NextResponse.json(
    { count, going: !!mine },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(req: NextRequest) {
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
