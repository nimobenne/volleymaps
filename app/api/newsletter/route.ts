import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email: normalized }, { onConflict: 'email' })

  if (error) {
    console.error('[newsletter] supabase error:', error.message)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
