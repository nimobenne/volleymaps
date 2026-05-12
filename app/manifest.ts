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
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
