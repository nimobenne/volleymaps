import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — VolleyMaps',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to map
      </Link>

      <div className="h-1 w-10 rounded-full mb-4" style={{ backgroundColor: 'oklch(0.82 0.17 75)' }} />
      <h1 className="font-display font-bold text-3xl uppercase tracking-wide mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: May 2026</p>

      <div className="prose prose-sm prose-invert max-w-none flex flex-col gap-6 text-sm leading-relaxed text-foreground/90">

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Who we are</h2>
          <p>VolleyMaps is a free, community-run directory of volleyball pickup games and sessions in Toronto, Canada. It is operated by Nimo Hains Benne. Questions? Email <a href="mailto:bernoubenne@me.com" className="text-primary hover:underline">bernoubenne@me.com</a>.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">What we collect</h2>
          <p>We only collect personal information when you voluntarily submit a venue or session through the <strong>Add Your Game</strong> form. This includes:</p>
          <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
            <li>Your name</li>
            <li>Your email address</li>
            <li>Venue details you provide (location name, address, schedule)</li>
          </ul>
          <p>We do not collect any personal information from people who simply browse the map. We use no analytics, no tracking pixels, and no advertising cookies.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Why we collect it</h2>
          <p>Your name and email are used solely to review your submission and follow up if we have questions. Your email will not be used for marketing or shared with third parties.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">How we store it</h2>
          <p>Submission data is stored in a Supabase PostgreSQL database hosted on servers in the United States. Supabase acts as a data processor on our behalf and does not access your data for its own purposes. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase&apos;s Privacy Policy</a> for details.</p>
          <p>We retain submission records for a maximum of 12 months from the date of submission, after which personal data is deleted.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Cookies</h2>
          <p>This site sets one cookie: <code className="bg-muted px-1 rounded text-xs">admin_session</code>. It is only set for site administrators after login and is not set for regular visitors. It expires after 30 days.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Your rights (PIPEDA)</h2>
          <p>Under Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA), you have the right to:</p>
          <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your personal information</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:bernoubenne@me.com" className="text-primary hover:underline">bernoubenne@me.com</a>. We will respond within 30 days.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Changes to this policy</h2>
          <p>We may update this policy from time to time. The &quot;last updated&quot; date at the top will reflect any changes. Continued use of VolleyMaps constitutes acceptance of the updated policy.</p>
        </section>

      </div>
    </div>
  )
}
