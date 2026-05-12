import { GameSession, Venue } from '@/types'

const BY_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function nextOccurrence(dayOfWeek: number): string {
  const now = new Date()
  const todayDow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' })).getDay()
  const daysAhead = ((dayOfWeek - todayDow + 7) % 7) || 7
  const target = new Date(now)
  target.setDate(target.getDate() + daysAhead)
  return target.toISOString().slice(0, 10)
}

export function buildCalendarUrls(session: GameSession, venue: Venue) {
  const dateStr =
    session.specific_date ??
    (session.day_of_week != null ? nextOccurrence(session.day_of_week) : new Date().toISOString().slice(0, 10))

  const startDt = `${dateStr.replace(/-/g, '')}T${session.start_time.replace(':', '')}00`
  const endDt   = `${dateStr.replace(/-/g, '')}T${session.end_time.replace(':', '')}00`
  const location = `${venue.address}, ${venue.city || 'Toronto'}`
  const details  = [
    session.notes,
    session.contact_link ? `Register: ${session.contact_link}` : null,
    'Powered by VolleyMaps — volleymaps.vercel.app',
  ].filter(Boolean).join('\n')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${startDt}/${endDt}`,
    details,
    location,
  })
  if (session.recurring && session.day_of_week != null) {
    params.set('recur', `RRULE:FREQ=WEEKLY;BYDAY=${BY_DAY[session.day_of_week]}`)
  }
  const googleUrl = `https://calendar.google.com/calendar/render?${params}`

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VolleyMaps//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${session.id}@volleymaps.vercel.app`,
    `DTSTART;TZID=America/Toronto:${startDt}`,
    `DTEND;TZID=America/Toronto:${endDt}`,
    `SUMMARY:${session.title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
    session.recurring && session.day_of_week != null
      ? `RRULE:FREQ=WEEKLY;BYDAY=${BY_DAY[session.day_of_week]}`
      : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const icsUri = `data:text/calendar;charset=utf8,${encodeURIComponent(icsLines)}`

  return { googleUrl, icsUri }
}
