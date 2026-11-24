import type { MetadataRoute } from 'next'
import { getVenues } from '@/lib/data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://volleymaps.vercel.app'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/add-your-game`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const venues = await getVenues()

  const venueRoutes: MetadataRoute.Sitemap = (venues ?? []).map(v => ({
    url: `${base}/venues/${v.slug}`,
    lastModified: v.created_at ? new Date(v.created_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...venueRoutes]
}
