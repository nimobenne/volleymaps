import { GameSession, Venue } from '@/types'
import { formatTime, isLiveNow, isStartingSoon } from '@/lib/sessions'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface GameCardProps {
  session: GameSession
  venue: Venue
  showVenueName?: boolean
}

const SKILL_LABEL: Record<string, string> = {
  all: 'All levels',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  competitive: 'Competitive',
}

export default function GameCard({ session, venue, showVenueName = true }: GameCardProps) {
  const live = isLiveNow(session)
  const soon = !live && isStartingSoon(session)
  const venueColor = venue.type === 'beach'
    ? 'oklch(0.82 0.17 75)'
    : venue.type === 'grass'
    ? 'oklch(0.55 0.18 145)'
    : 'oklch(0.52 0.23 263)'

  return (
    <div className="group flex gap-3 py-3 border-b border-border last:border-0">
      {/* Venue type stripe */}
      <div
        className="shrink-0 w-1 rounded-full mt-0.5"
        style={{ backgroundColor: venueColor }}
      />

      <div className="flex-1 min-w-0">
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
              <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full border"
                style={{
                  color: 'oklch(0.68 0.21 145)',
                  borderColor: 'oklch(0.68 0.21 145 / 40%)',
                  backgroundColor: 'oklch(0.68 0.21 145 / 12%)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'oklch(0.68 0.21 145)' }} />
                Live
              </span>
            )}
            {soon && (
              <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full border"
                style={{
                  color: 'oklch(0.70 0.16 90)',
                  borderColor: 'oklch(0.87 0.19 105 / 50%)',
                  backgroundColor: 'oklch(0.87 0.19 105 / 15%)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'oklch(0.87 0.19 105)' }} />
                Soon
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(session.start_time)} – {formatTime(session.end_time)}
          </span>
          <span className="text-muted-foreground/30 text-xs">·</span>
          <span className="text-xs text-muted-foreground">{SKILL_LABEL[session.skill_level]}</span>
          {session.featured && (
            <>
              <span className="text-muted-foreground/30 text-xs">·</span>
              <span className="text-xs font-medium" style={{ color: 'oklch(0.82 0.17 75)' }}>Featured</span>
            </>
          )}
        </div>

        {session.notes && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{session.notes}</p>
        )}

        {session.contact_link && (
          <a
            href={session.contact_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1.5 transition-colors"
          >
            Join / register <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}
