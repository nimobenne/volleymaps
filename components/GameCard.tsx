'use client'

import { useState, useRef, useEffect } from 'react'
import { GameSession, Venue } from '@/types'
import { formatTime, isLiveNow, isStartingSoon } from '@/lib/sessions'
import { buildCalendarUrls } from '@/lib/calendar'
import { ExternalLink, CalendarPlus } from 'lucide-react'
import Link from 'next/link'
import RsvpButton from './RsvpButton'
import CostChip from './CostChip'

interface GameCardProps {
  session: GameSession
  venue: Venue
  showVenueName?: boolean
  dimmed?: boolean
}

const SKILL_LABEL: Record<string, string> = {
  all: 'All levels',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  competitive: 'Competitive',
}

export default function GameCard({ session, venue, showVenueName = true, dimmed = false }: GameCardProps) {
  const live = isLiveNow(session)
  const soon = !live && isStartingSoon(session)
  const [calOpen, setCalOpen] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  const isOneTime = !session.recurring && !!session.specific_date
  const { googleUrl, icsUri } = buildCalendarUrls(session, venue)

  const dateDisplay = session.specific_date
    ? new Date(session.specific_date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
    : null

  useEffect(() => {
    if (!calOpen) return
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCalOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [calOpen])

  return (
    <div className={`group py-3 border-b border-border last:border-0 transition-opacity ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
      <div className="min-w-0">
        {showVenueName && (
          <Link
            href={`/venues/${venue.slug}`}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors truncate block"
          >
            {venue.name}
          </Link>
        )}

        <div className="flex items-start justify-between gap-2 mt-0.5">
          <p className="text-sm font-semibold leading-snug">{session.title}</p>
          <div className="shrink-0 flex items-center gap-1.5">
            {live && (
              <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full border text-live border-live/40 bg-live/12">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-live" />
                Live
              </span>
            )}
            {soon && (
              <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full border text-soon border-soon/50 bg-soon/15">
                <span className="w-1.5 h-1.5 rounded-full bg-soon" />
                Soon
              </span>
            )}
          </div>
        </div>

        {/* Time is the bold anchor */}
        <p className="text-sm font-bold tabular-nums mt-0.5 text-foreground/90">
          {formatTime(session.start_time)} – {formatTime(session.end_time)}
          {dateDisplay && <span className="font-normal text-muted-foreground ml-1.5">{dateDisplay}</span>}
        </p>

        {/* Chips row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className="text-[11px] text-muted-foreground">{SKILL_LABEL[session.skill_level]}</span>
          <CostChip costType={session.cost_type} costCents={session.cost_cents} costLabel={session.cost_label} />
          {isOneTime && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-indoor/15 text-indoor-soft">
              One-time
            </span>
          )}
          {session.featured && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
              Featured
            </span>
          )}
        </div>

        {session.notes && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{session.notes}</p>
        )}

        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {session.contact_link && (
              <a
                href={session.contact_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
              >
                Join / register <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <RsvpButton sessionId={session.id} />

            <div className="relative" ref={calRef}>
              <button
                onClick={() => setCalOpen(o => !o)}
                className="p-1.5 min-h-[28px] min-w-[28px] inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Add to calendar"
                aria-expanded={calOpen}
                aria-haspopup="true"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
              </button>
              {calOpen && (
                <div className="absolute bottom-full right-0 mb-1.5 w-44 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden">
                  <a
                    href={googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setCalOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" /> Google Calendar
                  </a>
                  <a
                    href={icsUri}
                    download={`${session.title.replace(/\s+/g, '-').toLowerCase()}.ics`}
                    onClick={() => setCalOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted transition-colors border-t border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" /> Apple / iCal
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
