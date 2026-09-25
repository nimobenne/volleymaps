'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { GameSession, Venue } from '@/types'
import { formatTime, isLiveNow, isStartingSoon } from '@/lib/sessions'
import { buildCalendarUrls } from '@/lib/calendar'
import { getVenueLabel } from '@/lib/utils'
import { ChevronDown, ExternalLink, CalendarPlus, Navigation, ArrowRight } from 'lucide-react'
import RsvpButton, { useRsvpState } from './RsvpButton'
import CostChip from './CostChip'
import ShareButton from './ShareButton'

// One row shape for every surface: the feed, the map popover and the venue
// page. Collapsed it is two lines you can scan down a column of fifty; expanded
// it carries everything you need to actually show up. The actions used to sit
// on every collapsed card, which is what made the old list impossible to skim.

interface SessionRowProps {
  session: GameSession
  venue: Venue
  /** Off on the venue page, where the venue is already the page you're on. */
  showVenueName?: boolean
  dimmed?: boolean
}

const SKILL_LABEL: Record<string, string> = {
  all: 'All levels',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  competitive: 'Competitive',
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export default function SessionRow({ session, venue, showVenueName = true, dimmed = false }: SessionRowProps) {
  // A shared link points at one session, so open it on arrival rather than
  // landing the visitor on a collapsed row they have to hunt for. Read via an
  // external store rather than an effect: the server snapshot is `false`, so
  // SSR and the first client render agree and nothing sets state during render.
  const isLinkTarget = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash === `#session-${session.id}`,
    () => false,
  )
  // null = follow the link target; true/false = the visitor has since decided.
  const [toggled, setToggled] = useState<boolean | null>(null)
  const open = toggled ?? isLinkTarget
  const live = isLiveNow(session)
  const soon = !live && isStartingSoon(session)
  const isOneTime = !session.recurring && !!session.specific_date

  const { googleUrl, icsUri } = buildCalendarUrls(session, venue)
  const { count: rsvpCount } = useRsvpState(session.id)
  const shareUrl = `https://volleymaps.vercel.app/venues/${venue.slug}#session-${session.id}`
  const shareText = rsvpCount && rsvpCount > 0
    ? `${rsvpCount} ${rsvpCount === 1 ? 'person is' : 'people are'} going to ${session.title} at ${venue.name} — join them:`
    : `Join ${session.title} at ${venue.name}:`

  const dateDisplay = session.specific_date
    ? new Date(session.specific_date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
    : null

  // Line 2 leads with whatever identifies this game and isn't already on screen.
  // "All levels" is dropped: it applies to ~87% of sessions, so printing it
  // pushes the venue name into an ellipsis to say almost nothing.
  const secondary = [
    showVenueName ? venue.name : session.title,
    session.skill_level === 'all' ? null : SKILL_LABEL[session.skill_level] ?? session.skill_level,
    getVenueLabel(venue.type),
  ].filter(Boolean)

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${venue.address}, ${venue.city || 'Toronto'}, ON`,
  )}`

  return (
    <div
      id={`session-${session.id}`}
      className={`border-b border-border last:border-0 scroll-mt-16 transition-opacity ${dimmed ? 'opacity-40' : 'opacity-100'}`}
    >
      <button
        type="button"
        onClick={() => setToggled(!open)}
        aria-expanded={open}
        aria-label={`${session.title} at ${venue.name}, ${formatTime(session.start_time)} to ${formatTime(session.end_time)}`}
        className="w-full text-left py-2.5 flex items-start gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
      >
        <span aria-hidden className="mt-[7px] shrink-0">
          {live ? (
            <span className="block w-2 h-2 rounded-full bg-live animate-pulse" />
          ) : soon ? (
            <span className="block w-2 h-2 rounded-full bg-soon" />
          ) : (
            <span className="block w-2 h-2 rounded-full border border-border" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold tabular-nums text-foreground/90 whitespace-nowrap">
              {formatTime(session.start_time)} – {formatTime(session.end_time)}
              {dateDisplay && <span className="font-normal text-muted-foreground ml-1.5">{dateDisplay}</span>}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              {live && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-live">Live</span>
              )}
              {soon && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-soon">Soon</span>
              )}
              <CostChip costType={session.cost_type} costCents={session.cost_cents} costLabel={session.cost_label} />
            </span>
          </span>

          <span className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">
              {secondary.join(' · ')}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              {session.featured && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                  Featured
                </span>
              )}
              {isOneTime && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-indoor/15 text-indoor-soft">
                  One-time
                </span>
              )}
              <ChevronDown
                aria-hidden
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </span>
          </span>
        </span>
      </button>

      {open && (
        <div className="pb-3 pl-4 flex flex-col gap-2.5">
          {showVenueName && (
            <p className="text-sm font-semibold leading-snug">{session.title}</p>
          )}

          {session.notes && (
            <p className="text-xs text-muted-foreground leading-relaxed">{session.notes}</p>
          )}

          <div className="flex flex-col gap-1">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-fit focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
              <Navigation className="h-3 w-3 shrink-0" />
              <span className="truncate">{venue.address}</span>
            </a>
            {showVenueName && (
              <Link
                href={`/venues/${venue.slug}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors w-fit focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
              >
                Full schedule at {venue.name} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <RsvpButton sessionId={session.id} />
            <ShareButton url={shareUrl} text={shareText} compact />
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Google
            </a>
            <a
              href={icsUri}
              download={`${session.title.replace(/\s+/g, '-').toLowerCase()}.ics`}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> iCal
            </a>
            {session.contact_link && (
              <a
                href={session.contact_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
              >
                Join / register <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
