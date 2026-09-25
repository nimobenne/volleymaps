import { describe, it, expect, vi, afterEach } from 'vitest'
import { isInSeason, torontoToday } from './data'
import type { GameSession } from '@/types'

const session = (over: Partial<GameSession> = {}): GameSession => ({
  id: 's1', venue_id: 'v1', title: 'Beach Pickup',
  day_of_week: 6, start_time: '10:00', end_time: '12:00',
  recurring: true, skill_level: 'all', featured: false, cost_type: 'free', ...over,
})

afterEach(() => vi.useRealTimers())

describe('isInSeason', () => {
  it('keeps a session with no season_end (runs year-round)', () => {
    expect(isInSeason(session({ season_end: null }), '2026-12-25')).toBe(true)
    expect(isInSeason(session({ season_end: undefined }), '2026-12-25')).toBe(true)
  })

  it('keeps a session whose season has not ended', () => {
    expect(isInSeason(session({ season_end: '2026-09-30' }), '2026-09-25')).toBe(true)
  })

  // The boundary that matters: a session ending on the 30th must still be
  // listed all day on the 30th, not vanish at midnight UTC.
  it('keeps a session on its final day', () => {
    expect(isInSeason(session({ season_end: '2026-09-30' }), '2026-09-30')).toBe(true)
  })

  it('drops a session the day after its season ends', () => {
    expect(isInSeason(session({ season_end: '2026-09-30' }), '2026-10-01')).toBe(false)
  })

  it('drops the U of T spring sessions that were still showing in September', () => {
    expect(isInSeason(session({ season_end: '2026-06-28' }), '2026-09-25')).toBe(false)
  })

  it('compares lexically across year boundaries', () => {
    expect(isInSeason(session({ season_end: '2026-12-31' }), '2027-01-01')).toBe(false)
    expect(isInSeason(session({ season_end: '2027-01-01' }), '2026-12-31')).toBe(true)
  })
})

describe('torontoToday', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(torontoToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  // 03:00 UTC on Oct 1 is still Sept 30 in Toronto (EDT, UTC-4). Using the
  // server's UTC date here would retire a season a day early.
  it('uses the Toronto date, not UTC', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-01T03:00:00Z'))
    expect(torontoToday()).toBe('2026-09-30')
  })

  it('still reports the Toronto date once UTC and local agree', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-01T16:00:00Z'))
    expect(torontoToday()).toBe('2026-10-01')
  })
})
