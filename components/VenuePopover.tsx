'use client'

import { Venue, GameSession } from '@/types'
import { X, MapPin, ExternalLink, ArrowRight, Navigation } from 'lucide-react'
import { getTodaysSessions } from '@/lib/sessions'
import { isNewVenue, getVenueColor, getVenueLabel } from '@/lib/utils'
import GameCard from './GameCard'
import WeatherChip from './WeatherChip'
import Link from 'next/link'
import Image from 'next/image'

interface VenuePopoverProps {
  venue: Venue
  sessions: GameSession[]
  onClose: () => void
}

export default function VenuePopover({ venue, sessions, onClose }: VenuePopoverProps) {
  const todaysSessions = getTodaysSessions(sessions)
  const venueColor = getVenueColor(venue.type)
  const typeLabel = getVenueLabel(venue.type)

  return (
    <div className="
      absolute z-30
      inset-x-3 bottom-[calc(144px_+_env(safe-area-inset-bottom,0px))]
      md:inset-x-auto md:left-4 md:bottom-6 md:w-80
      rounded-xl border border-border bg-card shadow-2xl shadow-black/50
      overflow-hidden
    ">
      {/* Colored type bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: venueColor }}
      />

      {venue.photo_url && (
        <div className="relative h-28 w-full overflow-hidden">
          <Image
            src={venue.photo_url}
            alt={venue.name}
            fill
            className="object-cover"
            sizes="320px"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: venueColor }}
              >
                {typeLabel}
              </span>
              {isNewVenue(venue) && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                  New
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-base leading-tight uppercase tracking-wide">{venue.name}</h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{venue.address}</span>
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venue.address}, ${venue.city || 'Toronto'}, ON`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors mt-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
              <Navigation className="h-3 w-3" /> Get directions
            </a>
            {venue.type !== 'indoor' && (
              <div className="mt-1">
                <WeatherChip />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2.5 -mr-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {todaysSessions.length > 0 ? (
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Today</p>
            {todaysSessions.slice(0, 2).map(s => (
              <GameCard key={s.id} session={s} venue={venue} showVenueName={false} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">No games scheduled today.</p>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Link
            href={`/venues/${venue.slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg py-2 hover:opacity-90 active:scale-95 transition-all"
          >
            Full schedule <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Website"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
