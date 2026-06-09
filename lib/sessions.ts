import { GameSession } from '@/types'

const TZ = 'America/Toronto'

function getTorontoNow(): { minutes: number; dayOfWeek: number; dateStr: string } {
  const now = new Date()
  // Parse Toronto local time using Intl
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    hour: '2-digit', minute: '2-digit', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short',
  }).formatToParts(now)

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
  const h = parseInt(get('hour'), 10)
  const m = parseInt(get('minute'), 10)
  // Reconstruct YYYY-MM-DD
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`
  // Get day index Sun=0..Sat=6 from a Date built in Toronto local time
  const dayOfWeek = new Date(
    now.toLocaleString('en-US', { timeZone: TZ })
  ).getDay()

  return { minutes: h * 60 + m, dayOfWeek, dateStr }
}

export function isToday(session: GameSession): boolean {
  const { dayOfWeek, dateStr } = getTorontoNow()
  if (session.specific_date) return session.specific_date === dateStr
  if (session.recurring && session.day_of_week != null) return session.day_of_week === dayOfWeek
  return false
}

export function getTodaysSessions(sessions: GameSession[]): GameSession[] {
  return sessions.filter(isToday).sort((a, b) => a.start_time.localeCompare(b.start_time))
}

export function getAllSessionsSorted(sessions: GameSession[]): {
  today: GameSession[]
  upcoming: GameSession[]
} {
  const { dayOfWeek } = getTorontoNow()

  const today = sessions
    .filter(isToday)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const upcoming = sessions
    .filter(s => !isToday(s))
    .sort((a, b) => {
      if (a.day_of_week == null && b.day_of_week == null) return a.start_time.localeCompare(b.start_time)
      if (a.day_of_week == null) return 1
      if (b.day_of_week == null) return -1
      const daysA = ((a.day_of_week - dayOfWeek + 7) % 7) || 7
      const daysB = ((b.day_of_week - dayOfWeek + 7) % 7) || 7
      if (daysA !== daysB) return daysA - daysB
      return a.start_time.localeCompare(b.start_time)
    })

  return { today, upcoming }
}

export function isLiveNow(session: GameSession): boolean {
  if (!isToday(session)) return false
  const { minutes } = getTorontoNow()
  return minutes >= timeToMinutes(session.start_time) && minutes <= timeToMinutes(session.end_time)
}

export function isStartingSoon(session: GameSession, thresholdMinutes = 30): boolean {
  if (!isToday(session)) return false
  const { minutes } = getTorontoNow()
  const diff = timeToMinutes(session.start_time) - minutes
  return diff > 0 && diff <= thresholdMinutes
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
