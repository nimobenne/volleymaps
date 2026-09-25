import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VolleyMaps',
    short_name: 'VolleyMaps',
    description: 'Find pickup volleyball in Toronto — beach, grass, and indoor sessions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1c1917',
    theme_color: '#d97706',
    icons: [
      {
        src: '/icon.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        // Square and opaque, so Android can mask it to any shape without
        // clipping the ball.
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
