import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'VolleyMaps — Find Pickup Volleyball Near You',
  description: 'Discover beach and indoor pickup volleyball games near you. Live map, today\'s sessions, and community drop-ins.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${dmSans.variable} h-full`}
    >
      <body className="h-full flex flex-col antialiased bg-background text-foreground">
        <header className="shrink-0 flex items-center justify-between px-4 md:px-6 h-13 border-b border-border bg-card z-30">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl leading-none">🏐</span>
            <span className="font-display font-bold text-xl tracking-wide uppercase text-foreground group-hover:text-primary transition-colors">
              VolleyMaps
            </span>
          </Link>

          <Link
            href="/add-your-game"
            className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
          >
            Add your game
          </Link>
        </header>

        <main className="flex-1 min-h-0">
          {children}
        </main>
      </body>
    </html>
  )
}
