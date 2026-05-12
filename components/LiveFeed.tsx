'use client'

import { useState, useEffect } from 'react'
import { Venue, GameSession } from '@/types'
import { getAllSessionsSorted, isLiveNow, isStartingSoon } from '@/lib/sessions'
import GameCard from './GameCard'
import { Skeleton } from '@/components/ui/skeleton'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface LiveFeedProps {
  venues: Venue[]
  sessions: GameSession[]
  typeFilter: 'all' | 'beach' | 'indoor' | 'grass'
  searchQuery?: string
}

export default function LiveFeed({ venues, sessions, typeFilter, searchQuery = '' }: LiveFeedProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const venueMap = Object.fromEntries(venues.map(v => [v.id, v]))

  const q = searchQuery.toLowerCase()
  const filtered = sessions.filter(s => {
    const venue = venueMap[s.venue_id]
    if (!venue) return false
    if (typeFilter !== 'all' && venue.type !== typeFilter) return false
    if (q && !venue.name.toLowerCase().includes(q) && !venue.address.toLowerCase().includes(q)) return false
    return true
  })

  const { today, upcoming } = getAllSessionsSorted(filtered)

  const liveCount = today.filter(isLiveNow).length
  const soonCount = today.filter(s => !isLiveNow(s) && isStartingSoon(s)).length

  const dateLabel = new Date().toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  // Group upcoming by day_of_week (null = "Flexible")
  const upcomingByDay: { label: string; sessions: GameSession[] }[] = []
  for (const s of upcoming) {
    const label = s.day_of_week != null ? DAY_SHORT[s.day_of_week] : 'Flexible'
    const existing = upcomingByDay.find(g => g.label === label)
    if (existing) existing.sessions.push(s)
    else upcomingByDay.push({ label, sessions: [s] })
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
              <span
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 border"
                style={{
                  color: 'oklch(0.68 0.21 145)',
                  borderColor: 'oklch(0.68 0.21 145 / 40%)',
                  backgroundColor: 'oklch(0.68 0.21 145 / 12%)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'oklch(0.68 0.21 145)' }} />
                {liveCount} live
              </span>
            )}
            {soonCount > 0 && (
              <span
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 border"
                style={{
                  color: 'oklch(0.70 0.16 90)',
                  borderColor: 'oklch(0.87 0.19 105 / 50%)',
                  backgroundColor: 'oklch(0.87 0.19 105 / 15%)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'oklch(0.87 0.19 105)' }} />
                {soonCount} soon
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {today.length === 0 && upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
            <span className="text-5xl mb-4 opacity-60">🏐</span>
            <p className="text-sm font-semibold">No sessions found</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Try changing the filter or browse the map.
            </p>
          </div>
        ) : (
          <div className="px-4">
            {today.length > 0 && (
              today.map(session => {
                const venue = venueMap[session.venue_id]
                if (!venue) return null
                return <GameCard key={session.id} session={session} venue={venue} showVenueName />
              })
            )}

            {today.length === 0 && (
              <p className="text-xs text-muted-foreground py-4">No games today. Check back or browse the week below.</p>
            )}

            {upcomingByDay.length > 0 && (
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
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <a
          href="/add-your-game"
          className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors py-1"
        >
          + Add your game or venue
        </a>
      </div>
    </div>
  )
}
