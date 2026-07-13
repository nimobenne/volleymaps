import { NextRequest } from 'next/server'

export const revalidate = 1800

const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function fmt(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const SKILL_LABEL: Record<string, string> = {
  all: 'All levels', beginner: 'Beginner', intermediate: 'Intermediate', competitive: 'Competitive',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: venue, error: venueErr } = await supabase.from('venues').select('*').eq('slug', slug).eq('approved', true).single()
  if (venueErr) console.error('[embed] venue fetch error:', venueErr.message)
  if (!venue) return new Response('Not found', { status: 404 })

  const { data: sessions } = await supabase
    .from('game_sessions').select('*').eq('venue_id', venue.id).order('day_of_week').order('start_time')

  const all = (sessions ?? []) as { title: string; day_of_week: number | null; start_time: string; end_time: string; skill_level: string; recurring: boolean; specific_date?: string }[]
  const recurring = all.filter(s => s.recurring && s.day_of_week != null)
  const byDay = DAY_FULL.map((day, i) => ({ day, ss: recurring.filter(s => s.day_of_week === i) })).filter(d => d.ss.length)
  const oneOffs = all.filter(s => !s.recurring && s.specific_date)

  const typeColor = venue.type === 'beach' ? '#D97706' : venue.type === 'grass' ? '#16A34A' : '#3B82F6'
  const typeLabel = venue.type === 'beach' ? 'Beach' : venue.type === 'grass' ? 'Grass' : 'Indoor'

  const sessionRow = (s: typeof all[0]) => `
    <div class="session">
      <div class="session-title">${esc(s.title)}</div>
      <div class="session-meta">${fmt(s.start_time)} – ${fmt(s.end_time)} · ${esc(SKILL_LABEL[s.skill_level] ?? s.skill_level)}</div>
    </div>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(venue.name)} Schedule — VolleyMaps</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #1c1917; color: #e7e5e4; font-size: 14px; padding: 16px; }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #292524; }
  .stripe { width: 4px; height: 36px; border-radius: 2px; background: ${typeColor}; flex-shrink: 0; }
  .venue-name { font-weight: 700; font-size: 16px; letter-spacing: 0.02em; text-transform: uppercase; }
  .type-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${typeColor}; }
  .day-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; margin: 12px 0 6px; }
  .session { padding: 6px 0; border-bottom: 1px solid #292524; }
  .session:last-child { border-bottom: none; }
  .session-title { font-weight: 600; font-size: 13px; }
  .session-meta { font-size: 12px; color: #a8a29e; margin-top: 2px; }
  .footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #292524; text-align: center; font-size: 11px; color: #57534e; }
  .footer a { color: #d97706; text-decoration: none; }
</style>
</head>
<body>
<div class="header">
  <div class="stripe"></div>
  <div>
    <div class="type-tag">${typeLabel}</div>
    <div class="venue-name">${esc(venue.name)}</div>
  </div>
</div>
${byDay.map(({ day, ss }) => `
  <div class="day-label">${day}</div>
  ${ss.map(sessionRow).join('')}
`).join('')}
${oneOffs.length ? `
  <div class="day-label">One-time events</div>
  ${oneOffs.map(sessionRow).join('')}
` : ''}
<div class="footer">Schedule via <a href="https://volleymaps.vercel.app/venues/${encodeURIComponent(slug)}" target="_blank">VolleyMaps</a></div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'ALLOWALL',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
