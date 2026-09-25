import { describe, it, expect, vi, afterEach } from 'vitest'
import { matchesFilters, DEFAULT_FILTERS, type SessionFilters } from './filters'
import type { GameSession, Venue } from '@/types'

const venue = (over: Partial<Venue> = {}): Venue => ({
  id: 'v1', name: 'York Recreation Centre', type: 'indoor',
  address: '115 Black Creek Dr', lat: 43.7, lng: -79.5,
  slug: 'city-york-recreation-centre', approved: true, city: 'Toronto', ...over,
})

const session = (over: Partial<GameSession> = {}): GameSession => ({
  id: 's1', venue_id: 'v1', title: 'City Drop-In',
  day_of_week: 3, start_time: '20:00', end_time: '21:30',
  recurring: true, skill_level: 'all', featured: false, cost_type: 'free', ...over,
})

const f = (over: Partial<SessionFilters> = {}): SessionFilters => ({ ...DEFAULT_FILTERS, ...over })

// isToday() reads the real clock, so pin it wherever "today" matters.
// 2026-09-30T18:00Z is Wednesday 2:00 PM in Toronto (EDT).
function freezeToWednesday() {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-30T18:00:00Z'))
}
afterEach(() => vi.useRealTimers())

describe('matchesFilters', () => {
  it('rejects a session whose venue is missing', () => {
    expect(matchesFilters(session(), undefined, f())).toBe(false)
  })

  it('passes everything through with default filters', () => {
    expect(matchesFilters(session(), venue(), f())).toBe(true)
  })

  describe('type', () => {
    it('keeps a matching venue type', () => {
      expect(matchesFilters(session(), venue({ type: 'beach' }), f({ type: 'beach' }))).toBe(true)
    })
    it('drops a non-matching venue type', () => {
      expect(matchesFilters(session(), venue({ type: 'indoor' }), f({ type: 'beach' }))).toBe(false)
    })
  })

  describe('skill', () => {
    it('drops a session whose level differs', () => {
      expect(matchesFilters(session({ skill_level: 'competitive' }), venue(), f({ skill: 'beginner' }))).toBe(false)
    })
    it('keeps an "all levels" session under any skill filter', () => {
      expect(matchesFilters(session({ skill_level: 'all' }), venue(), f({ skill: 'competitive' }))).toBe(true)
    })
  })

  describe('cost', () => {
    it('keeps free under the free filter', () => {
      expect(matchesFilters(session({ cost_type: 'free' }), venue(), f({ cost: 'free' }))).toBe(true)
    })
    it('drops paid under the free filter', () => {
      expect(matchesFilters(session({ cost_type: 'paid' }), venue(), f({ cost: 'free' }))).toBe(false)
    })
    it('keeps paid under the paid filter', () => {
      expect(matchesFilters(session({ cost_type: 'paid' }), venue(), f({ cost: 'paid' }))).toBe(true)
    })
    // `unknown` is a data gap, not a price. It must not masquerade as free.
    it('drops unknown under both free and paid', () => {
      expect(matchesFilters(session({ cost_type: 'unknown' }), venue(), f({ cost: 'free' }))).toBe(false)
      expect(matchesFilters(session({ cost_type: 'unknown' }), venue(), f({ cost: 'paid' }))).toBe(false)
    })
    it('keeps unknown when no cost filter is set', () => {
      expect(matchesFilters(session({ cost_type: 'unknown' }), venue(), f({ cost: 'all' }))).toBe(true)
    })
    it('treats a missing cost_type as unknown', () => {
      expect(matchesFilters(session({ cost_type: undefined }), venue(), f({ cost: 'free' }))).toBe(false)
      expect(matchesFilters(session({ cost_type: undefined }), venue(), f({ cost: 'all' }))).toBe(true)
    })
  })

  describe('day', () => {
    // The bug this replaces: the feed honoured `weekend` but ignored `today`,
    // so the map dimmed pins the list kept showing.
    it('keeps a session running today under the today filter', () => {
      freezeToWednesday()
      expect(matchesFilters(session({ day_of_week: 3 }), venue(), f({ day: 'today' }))).toBe(true)
    })
    it('drops a session not running today under the today filter', () => {
      freezeToWednesday()
      expect(matchesFilters(session({ day_of_week: 5 }), venue(), f({ day: 'today' }))).toBe(false)
    })
    it('keeps Saturday and Sunday under the weekend filter', () => {
      expect(matchesFilters(session({ day_of_week: 6 }), venue(), f({ day: 'weekend' }))).toBe(true)
      expect(matchesFilters(session({ day_of_week: 0 }), venue(), f({ day: 'weekend' }))).toBe(true)
    })
    it('drops a weekday under the weekend filter', () => {
      expect(matchesFilters(session({ day_of_week: 3 }), venue(), f({ day: 'weekend' }))).toBe(false)
    })
    it('drops a one-off with no day_of_week under the weekend filter', () => {
      const oneOff = session({ recurring: false, day_of_week: undefined, specific_date: '2026-10-03' })
      expect(matchesFilters(oneOff, venue(), f({ day: 'weekend' }))).toBe(false)
    })
    it('matches a one-off by its specific date under the today filter', () => {
      freezeToWednesday()
      const oneOff = session({ recurring: false, day_of_week: undefined, specific_date: '2026-09-30' })
      expect(matchesFilters(oneOff, venue(), f({ day: 'today' }))).toBe(true)
    })
  })

  describe('query', () => {
    it('matches on venue name, case-insensitively', () => {
      expect(matchesFilters(session(), venue(), f({ query: 'york rec' }))).toBe(true)
    })
    it('matches on venue address', () => {
      expect(matchesFilters(session(), venue(), f({ query: 'black creek' }))).toBe(true)
    })
    it('matches on session title', () => {
      expect(matchesFilters(session({ title: 'Javelin Drop-In' }), venue(), f({ query: 'javelin' }))).toBe(true)
    })
    it('matches on session notes', () => {
      expect(matchesFilters(session({ notes: 'Bring your own ball' }), venue(), f({ query: 'own ball' }))).toBe(true)
    })
    it('drops a session matching nothing', () => {
      expect(matchesFilters(session(), venue(), f({ query: 'scarborough' }))).toBe(false)
    })
    it('ignores surrounding whitespace', () => {
      expect(matchesFilters(session(), venue(), f({ query: '  york  ' }))).toBe(true)
    })
  })

  it('requires every active filter to pass, not just one', () => {
    const s = session({ cost_type: 'free', skill_level: 'competitive' })
    expect(matchesFilters(s, venue({ type: 'indoor' }), f({ cost: 'free', type: 'indoor' }))).toBe(true)
    expect(matchesFilters(s, venue({ type: 'indoor' }), f({ cost: 'free', type: 'beach' }))).toBe(false)
    expect(matchesFilters(s, venue({ type: 'indoor' }), f({ cost: 'paid', type: 'indoor' }))).toBe(false)
  })
})
