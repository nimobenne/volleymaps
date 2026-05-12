import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  const token = url.searchParams.get('token')
  if (!sessionId) return NextResponse.json({ count: 0, going: false })

  const supabase = getSupabase()

  const [{ count, error: countErr }, { data: mine }] = await Promise.all([
    supabase.from('rsvps').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
    token
      ? supabase.from('rsvps').select('id').eq('session_id', sessionId).eq('token', token).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  if (countErr) console.error('[rsvp] GET error:', countErr.message)

  return NextResponse.json(
    { count: count ?? 0, going: !!mine },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(req: NextRequest) {
  const { sessionId, token } = await req.json()
  if (!sessionId || !token) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('rsvps')
    .select('id')
    .eq('session_id', sessionId)
    .eq('token', token)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('rsvps').delete().eq('id', existing.id)
    if (error) console.error('[rsvp] delete error:', error.message)
  } else {
    const { error } = await supabase.from('rsvps').insert({ session_id: sessionId, token })
    if (error) console.error('[rsvp] insert error:', error.message)
  }

  const { count } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  return NextResponse.json({ count: count ?? 0, going: !existing })
}
