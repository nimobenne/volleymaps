import type { GameSession, Venue, TypeFilter, SkillFilter, DayFilter, CostFilter } from '@/types'
import { isToday } from './sessions'

// The single filter predicate for public session lists.
//
// This used to be hand-rolled in three places — HomeClient (type + skill only),
// LiveFeed (type + skill + weekend + search) and Map (type + skill + today +
// weekend + search). They drifted: picking "Today" dimmed map pins but left the
// feed showing the whole week, and the "N total" counter disagreed with the list
// underneath it. One predicate, one set of rules, no drift.

export interface SessionFilters {
  type: TypeFilter
  skill: SkillFilter
  day: DayFilter
  cost: CostFilter
  query: string
}

export const DEFAULT_FILTERS: SessionFilters = {
  type: 'all',
  skill: 'all',
  day: 'all',
  cost: 'all',
  query: '',
}

function isWeekend(dayOfWeek?: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6
}

function matchesQuery(session: GameSession, venue: Venue, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    venue.name.toLowerCase().includes(q) ||
    venue.address.toLowerCase().includes(q) ||
    session.title.toLowerCase().includes(q) ||
    (session.notes ?? '').toLowerCase().includes(q)
  )
}

export function matchesFilters(
  session: GameSession,
  venue: Venue | undefined,
  filters: SessionFilters,
): boolean {
  if (!venue) return false

  if (filters.type !== 'all' && venue.type !== filters.type) return false

  // An "all levels" session is welcome under any skill filter — that is the
  // point of the label, not a gap in the data.
  if (filters.skill !== 'all' && session.skill_level !== 'all' && session.skill_level !== filters.skill) {
    return false
  }

  if (filters.day === 'today' && !isToday(session)) return false
  if (filters.day === 'weekend' && !isWeekend(session.day_of_week)) return false

  // `unknown` means nobody has confirmed the price. It is a data gap, so it
  // must fall out of both buckets rather than quietly counting as free.
  if (filters.cost !== 'all' && session.cost_type !== filters.cost) return false

  return matchesQuery(session, venue, filters.query)
}

export function filterSessions(
  sessions: GameSession[],
  venueById: Record<string, Venue>,
  filters: SessionFilters,
): GameSession[] {
  return sessions.filter(s => matchesFilters(s, venueById[s.venue_id], filters))
}

export function countActiveRefinements(filters: SessionFilters): number {
  return (
    (filters.day !== 'all' ? 1 : 0) +
    (filters.skill !== 'all' ? 1 : 0) +
    (filters.cost !== 'all' ? 1 : 0)
  )
}
