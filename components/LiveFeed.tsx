'use client'

import { useState, useEffect } from 'react'
import { Venue, GameSession, TypeFilter, SkillFilter, DayFilter } from '@/types'
import { getAllSessionsSorted, isLiveNow, isStartingSoon } from '@/lib/sessions'
import GameCard from './GameCard'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin } from 'lucide-react'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface LiveFeedProps {
  venues: Venue[]
  sessions: GameSession[]
  typeFilter: TypeFilter
  skillFilter?: SkillFilter
  dayFilter?: DayFilter
  searchQuery?: string
  userCoords?: { lat: number; lng: number } | null
  onClearFilters?: () => void
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isWeekendDay(dayOfWeek?: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6
}

export default function LiveFeed({
  venues, sessions, typeFilter, skillFilter = 'all', dayFilter = 'all', searchQuery = '', userCoords, onClearFilters,
}: LiveFeedProps) {
  const [mounted, setMounted] = useState(false)
  const [sortByDistance, setSortByDistance] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const venueMap = Object.fromEntries(venues.map(v => [v.id, v]))

  const q = searchQuery.toLowerCase()
  const filtered = sessions.filter(s => {
    const venue = venueMap[s.venue_id]
    if (!venue) return false
    if (typeFilter !== 'all' && venue.type !== typeFilter) return false
    if (skillFilter !== 'all' && s.skill_level !== 'all' && s.skill_level !== skillFilter) return false
    if (dayFilter === 'weekend' && !isWeekendDay(s.day_of_week)) return false
    if (q) {
      const inVenue = venue.name.toLowerCase().includes(q) || venue.address.toLowerCase().includes(q)
      const inSession = s.title.toLowerCase().includes(q) || (s.notes ?? '').toLowerCase().includes(q)
      if (!inVenue && !inSession) return false
    }
    return true
  })

  const venueDist = (s: GameSession) => {
    const v = venueMap[s.venue_id]
    if (!v || !userCoords) return Infinity
    return distanceKm(userCoords.lat, userCoords.lng, v.lat, v.lng)
  }

  const { today, upcoming } = getAllSessionsSorted(filtered)

  const todaySorted = sortByDistance && userCoords
    ? [...today].sort((a, b) => venueDist(a) - venueDist(b))
    : today

  const upcomingSorted = sortByDistance && userCoords
    ? [...upcoming].sort((a, b) => venueDist(a) - venueDist(b))
    : upcoming

  const liveCount = today.filter(isLiveNow).length
  const soonCount = today.filter(s => !isLiveNow(s) && isStartingSoon(s)).length

  const dateLabel = new Date().toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  // Group upcoming by day (or skip grouping in distance mode)
  const upcomingByDay: { label: string; sessions: GameSession[] }[] = []
  if (!sortByDistance) {
    for (const s of upcomingSorted) {
      const label = s.day_of_week != null ? DAY_SHORT[s.day_of_week] : 'Flexible'
      const existing = upcomingByDay.find(g => g.label === label)
      if (existing) existing.sessions.push(s)
      else upcomingByDay.push({ label, sessions: [s] })
    }
  }

  if (!mounted) {
    return (
      <div className="flex flex-col gap-3 px-4 pt-5">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide">Today</h2>
          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 border"
                style={{ color: 'oklch(0.68 0.21 145)', borderColor: 'oklch(0.68 0.21 145 / 40%)', backgroundColor: 'oklch(0.68 0.21 145 / 12%)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'oklch(0.68 0.21 145)' }} />
                {liveCount} live
              </span>
            )}
            {soonCount > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 border"
                style={{ color: 'oklch(0.70 0.16 90)', borderColor: 'oklch(0.87 0.19 105 / 50%)', backgroundColor: 'oklch(0.87 0.19 105 / 15%)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'oklch(0.87 0.19 105)' }} />
                {soonCount} soon
              </span>
            )}
            {userCoords && (
              <button
                onClick={() => setSortByDistance(d => !d)}
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 border transition-all ${
                  sortByDistance
                    ? 'bg-primary/15 text-primary border-primary/40'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapPin className="h-2.5 w-2.5" /> Near me
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
            <span className="text-5xl mb-4 opacity-60">🏐</span>
            <p className="text-sm font-semibold">No sessions found</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              No games match your current filters.
            </p>
            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="mt-4 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="px-4">
            {todaySorted.length > 0
              ? todaySorted.map(session => {
                  const venue = venueMap[session.venue_id]
                  if (!venue) return null
                  return <GameCard key={session.id} session={session} venue={venue} showVenueName />
                })
              : <p className="text-xs text-muted-foreground py-4">No games today. Check back or browse the week below.</p>
            }

            {sortByDistance && userCoords ? (
              upcomingSorted.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-4 pb-1">
                    This week · nearest first
                  </p>
                  {upcomingSorted.map(session => {
                    const venue = venueMap[session.venue_id]
                    if (!venue) return null
                    return <GameCard key={session.id} session={session} venue={venue} showVenueName dimmed />
                  })}
                </div>
              )
            ) : (
              upcomingByDay.length > 0 && (
                <div className="mt-2">
                  {upcomingByDay.map(({ label, sessions: daySessions }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-4 pb-1">
                        {label}
                      </p>
                      {daySessions.map(session => {
                        const venue = venueMap[session.venue_id]
                        if (!venue) return null
                        return <GameCard key={session.id} session={session} venue={venue} showVenueName dimmed />
                      })}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

    </div>
  )
}
