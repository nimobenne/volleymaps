import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import Logo from '@/components/Logo'
import MobileNav from '@/components/MobileNav'

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
  description: 'Free map of pickup volleyball games in Toronto. Beach, grass, and indoor sessions. Find a game today.',
  openGraph: {
    siteName: 'VolleyMaps',
    title: 'VolleyMaps — Find Pickup Volleyball Near You',
    description: 'Free map of pickup volleyball games in Toronto. Beach, grass, and indoor sessions.',
    url: 'https://volleymaps.vercel.app',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VolleyMaps',
  },
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
            <Logo className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
            <span className="font-display font-bold text-xl tracking-wide uppercase text-foreground">
              Volley<span className="text-primary">Maps</span>
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

        {/* Mobile bottom nav — footer links are hidden on mobile */}
        <MobileNav />

        <footer className="shrink-0 hidden md:flex items-center justify-center gap-4 px-4 py-2 border-t border-border bg-card text-xs text-muted-foreground">
          <span>Toronto volleyball, all in one place.</span>
          <span className="text-border">·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span className="text-border">·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
          <span className="text-border">·</span>
          <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </footer>
      </body>
    </html>
  )
}
