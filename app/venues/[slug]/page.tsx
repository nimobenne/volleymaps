import { Venue, GameSession } from '@/types'
import { notFound } from 'next/navigation'
import GameCard from '@/components/GameCard'
import ShareButton from '@/components/ShareButton'
import { MapPin, ExternalLink, ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { DAY_NAMES_FULL } from '@/lib/sessions'
import Link from 'next/link'
import { MOCK_VENUES, MOCK_SESSIONS } from '@/lib/mock-data'
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

  const venueColor = venue.type === 'beach'
    ? 'oklch(0.82 0.17 75)'
    : venue.type === 'grass'
    ? 'oklch(0.55 0.18 145)'
    : 'oklch(0.70 0.14 218)'
  const typeLabel = venue.type === 'beach' ? '🏖 Beach' : venue.type === 'grass' ? '🌿 Grass' : '🏟 Indoor'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to map
      </Link>

      {venue.photo_url && (
        <div className="h-52 w-full rounded-xl overflow-hidden mb-6 border border-border">
          <img src={venue.photo_url} alt={venue.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="h-1 w-16 rounded-full mb-4" style={{ backgroundColor: venueColor }} />

      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-display font-bold text-3xl uppercase tracking-wide leading-tight">
          {venue.name}
        </h1>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: venueColor }}>
            {typeLabel}
          </span>
          <ShareButton url={`https://volleymaps.vercel.app/venues/${venue.slug}`} />
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
        <MapPin className="h-4 w-4 shrink-0" />
        {venue.address}{venue.city ? `, ${venue.city}` : ''}
      </p>

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
  )
}
