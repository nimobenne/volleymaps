'use client'

import { useState, useEffect } from 'react'
import { Venue, GameSession } from '@/types'
import { getTodaysSessions, isLiveNow, isStartingSoon } from '@/lib/sessions'
import GameCard from './GameCard'
import { Skeleton } from '@/components/ui/skeleton'

interface LiveFeedProps {
  venues: Venue[]
  sessions: GameSession[]
  typeFilter: 'all' | 'beach' | 'indoor' | 'grass'
}

export default function LiveFeed({ venues, sessions, typeFilter }: LiveFeedProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const venueMap = Object.fromEntries(venues.map(v => [v.id, v]))

  const todaysSessions = getTodaysSessions(sessions).filter(s => {
    const venue = venueMap[s.venue_id]
    return venue && (typeFilter === 'all' || venue.type === typeFilter)
  })

  const liveCount = todaysSessions.filter(isLiveNow).length
  const soonCount = todaysSessions.filter(s => !isLiveNow(s) && isStartingSoon(s)).length

  const dateLabel = new Date().toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

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
        {todaysSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
            <span className="text-5xl mb-4 opacity-60">🏐</span>
            <p className="text-sm font-semibold">No games today</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Browse the map to see weekly schedules at each venue.
            </p>
          </div>
        ) : (
          <div className="px-4">
            {todaysSessions.map(session => {
              const venue = venueMap[session.venue_id]
              if (!venue) return null
              return <GameCard key={session.id} session={session} venue={venue} showVenueName />
            })}
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
