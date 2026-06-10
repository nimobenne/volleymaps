import { Venue, GameSession } from '@/types'
import { notFound } from 'next/navigation'
import GameCard from '@/components/GameCard'
import ShareButton from '@/components/ShareButton'
import { MapPin, ExternalLink, ArrowLeft, Waves, Trees, Building2, Navigation } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { DAY_NAMES_FULL } from '@/lib/sessions'
import Link from 'next/link'
import Image from 'next/image'
import { MOCK_VENUES, MOCK_SESSIONS } from '@/lib/mock-data'
import { getVenueColor, getVenueLabel } from '@/lib/utils'
import type { Metadata } from 'next'

export const revalidate = 3600

const USE_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getVenue(slug: string): Promise<Venue | null> {
  if (USE_MOCK) return MOCK_VENUES.find(v => v.slug === slug) ?? null
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('venues').select('*').eq('slug', slug).eq('approved', true).single()
  return (data as Venue) ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const venue = await getVenue(slug)
  if (!venue) return { title: 'Venue Not Found — VolleyMaps' }
  const typeLabel = venue.type === 'beach' ? 'Beach' : venue.type === 'grass' ? 'Grass' : 'Indoor'
  return {
    title: `${venue.name} — VolleyMaps`,
    description: `${typeLabel} volleyball at ${venue.address}, Toronto. View the full schedule and sessions on VolleyMaps.`,
    openGraph: {
      title: `${venue.name} — VolleyMaps`,
      description: `${typeLabel} volleyball at ${venue.address}, Toronto.`,
      url: `https://volleymaps.vercel.app/venues/${slug}`,
      siteName: 'VolleyMaps',
      type: 'website',
    },
  }
}

export default async function VenuePage({ params }: PageProps) {
  const { slug } = await params

  const venue = await getVenue(slug)
  let allSessions: GameSession[] = []

  if (venue) {
    if (USE_MOCK) {
      allSessions = MOCK_SESSIONS.filter(s => s.venue_id === venue.id)
    } else {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await supabase.from('game_sessions').select('*').eq('venue_id', venue.id).order('day_of_week').order('start_time')
      allSessions = (data ?? []) as GameSession[]
    }
  }

  if (!venue) notFound()

  const recurring = allSessions.filter(s => s.recurring)
  const oneOffs = allSessions.filter(s => !s.recurring && s.specific_date)

  const byDay = DAY_NAMES_FULL.map((day, i) => ({
    day,
    sessions: recurring.filter(s => s.day_of_week === i),
  })).filter(d => d.sessions.length > 0)

  const venueColor = getVenueColor(venue.type)
  const TypeIcon = venue.type === 'beach' ? Waves : venue.type === 'grass' ? Trees : Building2
  const typeLabel = getVenueLabel(venue.type)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: venue.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
      addressLocality: venue.city || 'Toronto',
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
    url: `https://volleymaps.vercel.app/venues/${venue.slug}`,
    event: allSessions.map(s => ({
      '@type': 'SportsEvent',
      name: s.title,
      location: { '@type': 'Place', name: venue.name, address: venue.address },
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
    })),
  }

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to map
      </Link>

      {/* Hero: photo if available, gradient fallback otherwise */}
      <div className="relative h-52 w-full rounded-xl overflow-hidden mb-6 border border-border">
        {venue.photo_url ? (
          <Image
            src={venue.photo_url}
            alt={venue.name}
            fill
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
            priority
          />
        ) : (
          <div
            className="w-full h-full flex items-end p-4"
            style={{
              background: venue.type === 'beach'
                ? 'linear-gradient(135deg, oklch(0.25 0.06 75) 0%, oklch(0.18 0.03 75) 100%)'
                : venue.type === 'grass'
                ? 'linear-gradient(135deg, oklch(0.22 0.06 145) 0%, oklch(0.17 0.03 145) 100%)'
                : 'linear-gradient(135deg, oklch(0.22 0.06 263) 0%, oklch(0.17 0.03 263) 100%)',
            }}
          >
            <span className="font-display font-bold text-5xl uppercase tracking-wide opacity-20"
              style={{ color: venueColor }}>
              {venue.type}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-display font-bold text-3xl uppercase tracking-wide leading-tight">
          {venue.name}
        </h1>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest" style={{ color: venueColor }}>
            <TypeIcon className="h-3.5 w-3.5" /> {typeLabel}
          </span>
          <ShareButton url={`https://volleymaps.vercel.app/venues/${venue.slug}`} />
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
        <MapPin className="h-4 w-4 shrink-0" />
        {venue.address}{venue.city ? `, ${venue.city}` : ''}
      </p>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venue.address}, ${venue.city || 'Toronto'}, ON`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1 mb-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
      >
        <Navigation className="h-3 w-3" /> Get directions
      </a>

      {venue.website && (
        <a
          href={venue.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-3 mb-2"
        >
          Visit website <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <Separator className="my-6" />

      <section>
        <h2 className="font-display font-bold text-xl uppercase tracking-wide mb-5">Weekly Schedule</h2>
        {byDay.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recurring sessions listed yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {byDay.map(({ day, sessions: daySessions }) => (
              <div key={day}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{day}</h3>
                {daySessions.map(s => (
                  <GameCard key={s.id} session={s} venue={venue as Venue} showVenueName={false} />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {oneOffs.length > 0 && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="font-display font-bold text-xl uppercase tracking-wide mb-5">Upcoming One-Offs</h2>
            {oneOffs.map(s => (
              <GameCard key={s.id} session={s} venue={venue as Venue} showVenueName={false} />
            ))}
          </section>
        </>
      )}
    </div>
    </>
  )
}
