'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Venue, GameSession } from '@/types'
import { getTodaysSessions } from '@/lib/sessions'
import Filters from './Filters'
import LiveFeed from './LiveFeed'
import SearchBar from './SearchBar'
import { ChevronUp, ChevronDown } from 'lucide-react'

const Map = dynamic(() => import('./Map'), { ssr: false })

interface HomeClientProps {
  venues: Venue[]
  sessions: GameSession[]
}

export default function HomeClient({ venues, sessions }: HomeClientProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'beach' | 'indoor' | 'grass'>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const touchStartY = useRef<number | null>(null)

  const venueMap = Object.fromEntries(venues.map(v => [v.id, v]))

  const todayCount = getTodaysSessions(sessions).filter(s => {
    const venue = venueMap[s.venue_id]
    return venue && (typeFilter === 'all' || venue.type === typeFilter)
  }).length

  const totalCount = sessions.filter(s => {
    const venue = venueMap[s.venue_id]
    return venue && (typeFilter === 'all' || venue.type === typeFilter)
  }).length

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const delta = touchStartY.current - e.changedTouches[0].clientY
    if (delta > 40) setDrawerOpen(true)
    if (delta < -40) setDrawerOpen(false)
    touchStartY.current = null
  }

  return (
    <div className="relative flex h-full overflow-hidden" style={{ height: '100%' }}>
      {/* ─── Map (always full behind) ─── */}
      <div className="relative flex-1">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-auto flex flex-col items-center gap-2">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <Filters typeFilter={typeFilter} onTypeChange={setTypeFilter} />
        </div>

        <Map
          venues={venues}
          sessions={sessions}
          typeFilter={typeFilter}
          searchQuery={searchQuery}
          onPinTap={() => setDrawerOpen(false)}
        />
      </div>

      {/* ─── Desktop sidebar ─── */}
      <aside className="hidden md:flex w-80 lg:w-96 shrink-0 flex-col border-l border-border bg-card overflow-hidden">
        <LiveFeed venues={venues} sessions={sessions} typeFilter={typeFilter} searchQuery={searchQuery} />
      </aside>

      {/* ─── Mobile bottom drawer ─── */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-border rounded-t-2xl overflow-hidden"
        style={{
          height: '72vh',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(calc(100% - 88px))',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
        }}
      >
        <button
          className="w-full flex flex-col items-center pt-2.5 pb-2 active:bg-muted/40 transition-colors touch-none"
          onClick={() => setDrawerOpen(d => !d)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-label={drawerOpen ? 'Collapse games list' : 'Expand games list'}
          aria-expanded={drawerOpen}
        >
          <div className="w-9 h-1 rounded-full bg-border mb-2.5" />
          <div className="flex w-full items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <span className="font-display font-bold text-sm uppercase tracking-wide">
                {todayCount > 0
                  ? `${todayCount} game${todayCount !== 1 ? 's' : ''} today`
                  : 'Games this week'}
              </span>
              {todayCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
              {totalCount > 0 && (
                <span className="text-xs text-muted-foreground font-normal normal-case tracking-normal">
                  {totalCount} total
                </span>
              )}
            </div>
            {drawerOpen
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronUp className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </button>

        <div className="overflow-y-auto overscroll-contain" style={{ height: 'calc(72vh - 88px)' }}>
          <LiveFeed venues={venues} sessions={sessions} typeFilter={typeFilter} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  )
}
