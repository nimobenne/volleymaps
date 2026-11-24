import { ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import NewsletterSignup from '@/components/NewsletterSignup'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Contact — VolleyMaps',
}

export default function ContactPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to map
      </Link>

      <div className="h-1 w-10 rounded-full mb-4" style={{ backgroundColor: 'oklch(0.82 0.17 75)' }} />
      <h1 className="font-display font-bold text-3xl uppercase tracking-wide mb-2">Say hello</h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        Got a venue to add? Feedback on the app? Just want to talk volleyball?
        Reach out — I read everything.
      </p>

      <a
        href="mailto:nimobenne@gmail.com"
        className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-full hover:opacity-90 active:scale-95 transition-all"
      >
        <Mail className="h-4 w-4" />
        nimobenne@gmail.com
      </a>

      <Separator className="my-10" />

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-display font-bold text-xl uppercase tracking-wide mb-1">Stay in the loop</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            New venues, session updates, and weekly picks of what&apos;s on in Toronto.
            No spam, unsubscribe any time.
          </p>
        </div>
        <NewsletterSignup />
      </div>
    </div>
  )
}
