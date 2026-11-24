'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Venue, GameSession, TypeFilter, SkillFilter, DayFilter, CostFilter } from '@/types'
import { getTodaysSessions } from '@/lib/sessions'
import { matchesFilters, type SessionFilters } from '@/lib/filters'
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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all')
  const [dayFilter, setDayFilter] = useState<DayFilter>('all')
  const [costFilter, setCostFilter] = useState<CostFilter>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Fix iOS Safari 100vh bug: track the real viewport height in a CSS var
  useEffect(() => {
    function setVh() {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }
    setVh()
    window.addEventListener('resize', setVh)
    return () => window.removeEventListener('resize', setVh)
  }, [])

  const venueMap = Object.fromEntries(venues.map(v => [v.id, v]))

  const filters: SessionFilters = {
    type: typeFilter, skill: skillFilter, day: dayFilter, cost: costFilter, query: searchQuery,
  }
  // Counts run through the same predicate the feed does, so the drawer header
  // can no longer advertise games the list underneath it is filtering out.
  const sessionMatches = (s: GameSession) => matchesFilters(s, venueMap[s.venue_id], filters)

  function clearFilters() {
    setTypeFilter('all'); setSkillFilter('all'); setDayFilter('all'); setCostFilter('all'); setSearchQuery('')
  }

  const todayCount = getTodaysSessions(sessions).filter(sessionMatches).length
  const totalCount = sessions.filter(sessionMatches).length

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
      <div className="relative flex-1">
        {/* Court Lights: warm floodlight falloff from the top of the map */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48 z-[5]"
          style={{ background: 'radial-gradient(ellipse 130% 100% at 50% -30%, oklch(0.82 0.17 75 / 9%), transparent 65%)' }}
        />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-auto flex flex-col items-center gap-2 w-[calc(100vw-1rem)] sm:w-auto">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <Filters
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            skillFilter={skillFilter}
            onSkillChange={setSkillFilter}
            dayFilter={dayFilter}
            onDayChange={setDayFilter}
            costFilter={costFilter}
            onCostChange={setCostFilter}
          />
        </div>

        <Map
          venues={venues}
          sessions={sessions}
          filters={filters}
          onPinTap={() => setDrawerOpen(false)}
          onGeolocate={setUserCoords}
        />
      </div>

      <aside className="hidden md:flex w-80 lg:w-96 shrink-0 flex-col border-l border-border bg-card overflow-hidden">
        <LiveFeed
          venues={venues}
          sessions={sessions}
          filters={filters}
          userCoords={userCoords}
          onClearFilters={clearFilters}
        />
      </aside>

      <div
        className="md:hidden fixed inset-x-0 z-30 bg-card border-t border-border rounded-t-2xl overflow-hidden"
        style={{
          height: 'calc(var(--vh, 1vh) * 72)',
          bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
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
                {todayCount > 0 ? `${todayCount} game${todayCount !== 1 ? 's' : ''} today` : 'Games this week'}
              </span>
              {todayCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
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

        <div className="overflow-y-auto overscroll-contain" style={{ height: 'calc(var(--vh, 1vh) * 72 - 88px)' }}>
          <LiveFeed
            venues={venues}
            sessions={sessions}
            filters={filters}
            userCoords={userCoords}
            onClearFilters={clearFilters}
          />
        </div>
      </div>
    </div>
  )
}
