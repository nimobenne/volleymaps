import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isToday,
  getTodaysSessions,
  getAllSessionsSorted,
  isLiveNow,
  isStartingSoon,
  formatTime,
} from './sessions'
import type { GameSession } from '@/types'

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: 'id',
    venue_id: 'venue',
    title: 'Session',
    day_of_week: null,
    specific_date: null,
    start_time: '18:00',
    end_time: '20:00',
    recurring: false,
    skill_level: 'all',
    notes: null,
    contact_link: null,
    featured: false,
    cost_type: 'free',
    cost_cents: null,
    cost_label: null,
    ...overrides,
  } as GameSession
}

// Freeze "now" at a known Toronto local instant so day-of-week/date/time math
// is deterministic instead of depending on when the test happens to run.
function setTorontoNow(isoUtc: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(isoUtc))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('isToday', () => {
  it('matches a specific_date session on that exact date', () => {
    // 2026-07-20 16:00 UTC = 12:00 EDT (Toronto, UTC-4 in July)
    setTorontoNow('2026-07-20T16:00:00Z')
    expect(isToday(makeSession({ specific_date: '2026-07-20' }))).toBe(true)
    expect(isToday(makeSession({ specific_date: '2026-07-21' }))).toBe(false)
  })

  it('matches a recurring session by Toronto day-of-week, not UTC day', () => {
    // 2026-07-20T02:30Z is Sun 22:30 EDT locally — still Sunday in Toronto,
    // even though UTC has already rolled over to Monday.
    setTorontoNow('2026-07-20T02:30:00Z')
    expect(isToday(makeSession({ recurring: true, day_of_week: 0 }))).toBe(true)
    expect(isToday(makeSession({ recurring: true, day_of_week: 1 }))).toBe(false)
  })

  it('is false for a session with neither specific_date nor recurring', () => {
    setTorontoNow('2026-07-20T16:00:00Z')
    expect(isToday(makeSession())).toBe(false)
  })
})

describe('getTodaysSessions', () => {
  it('filters to today and sorts by start_time', () => {
    setTorontoNow('2026-07-20T16:00:00Z') // Monday-ish local, day_of_week 1
    const sessions = [
      makeSession({ id: 'a', recurring: true, day_of_week: 1, start_time: '20:00' }),
      makeSession({ id: 'b', recurring: true, day_of_week: 1, start_time: '09:00' }),
      makeSession({ id: 'c', recurring: true, day_of_week: 2, start_time: '08:00' }),
    ]
    const result = getTodaysSessions(sessions)
    expect(result.map(s => s.id)).toEqual(['b', 'a'])
  })
})

describe('getAllSessionsSorted', () => {
  it('buckets today vs upcoming and orders upcoming by nearest day-of-week', () => {
    setTorontoNow('2026-07-20T16:00:00Z') // local day_of_week === 1
    const sessions = [
      makeSession({ id: 'today', recurring: true, day_of_week: 1, start_time: '19:00' }),
      makeSession({ id: 'in-2-days', recurring: true, day_of_week: 3, start_time: '19:00' }),
      makeSession({ id: 'in-1-day', recurring: true, day_of_week: 2, start_time: '19:00' }),
      makeSession({ id: 'one-off', specific_date: undefined, recurring: false, day_of_week: undefined, start_time: '10:00' }),
    ]
    const { today, upcoming } = getAllSessionsSorted(sessions)
    expect(today.map(s => s.id)).toEqual(['today'])
    expect(upcoming.map(s => s.id)).toEqual(['in-1-day', 'in-2-days', 'one-off'])
  })
})

describe('isLiveNow / isStartingSoon', () => {
  it('isLiveNow is true only within [start_time, end_time] on today', () => {
    // 2026-07-20T23:00Z = 19:00 EDT
    setTorontoNow('2026-07-20T23:00:00Z')
    const session = makeSession({ recurring: true, day_of_week: 1, start_time: '18:00', end_time: '20:00' })
    expect(isLiveNow(session)).toBe(true)
    expect(isLiveNow(makeSession({ recurring: true, day_of_week: 1, start_time: '20:30', end_time: '22:00' }))).toBe(false)
  })

  it('isStartingSoon is true only within the threshold before start_time', () => {
    // 2026-07-20T22:45Z = 18:45 EDT
    setTorontoNow('2026-07-20T22:45:00Z')
    const soon = makeSession({ recurring: true, day_of_week: 1, start_time: '19:00', end_time: '21:00' })
    expect(isStartingSoon(soon, 30)).toBe(true)
    expect(isStartingSoon(soon, 10)).toBe(false)
    const alreadyStarted = makeSession({ recurring: true, day_of_week: 1, start_time: '18:00', end_time: '21:00' })
    expect(isStartingSoon(alreadyStarted)).toBe(false)
  })
})

describe('formatTime', () => {
  it('formats 24h HH:MM into 12h with AM/PM', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
    expect(formatTime('09:05')).toBe('9:05 AM')
    expect(formatTime('12:00')).toBe('12:00 PM')
    expect(formatTime('18:30')).toBe('6:30 PM')
    expect(formatTime('23:59')).toBe('11:59 PM')
  })
})
