import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — VolleyMaps',
}

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to map
      </Link>

      <div className="h-1 w-10 rounded-full mb-4" style={{ backgroundColor: 'oklch(0.82 0.17 75)' }} />
      <h1 className="font-display font-bold text-3xl uppercase tracking-wide mb-2">Terms of Use</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: May 2026</p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-foreground/90">

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Free to use</h2>
          <p>VolleyMaps is a free community tool. There is no charge to browse, and listing a venue or session is free. We reserve the right to introduce optional paid features (such as featured listings) in the future, but basic access will remain free.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Accuracy of information</h2>
          <p>Venue schedules, session times, and other details listed on VolleyMaps are submitted by the community and may be out of date or inaccurate. <strong>Always verify directly with the organizer before showing up.</strong> VolleyMaps is not responsible for cancelled sessions, changed times, or any other inaccuracies.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Submissions</h2>
          <p>When you submit a venue or session through the Add Your Game form, you confirm that:</p>
          <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
            <li>The information is accurate to the best of your knowledge</li>
            <li>You have permission to share it publicly</li>
            <li>It does not infringe on anyone else&apos;s rights</li>
          </ul>
          <p>We review all submissions before publishing. We reserve the right to reject, edit, or remove any listing at any time without notice.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Limitation of liability</h2>
          <p>VolleyMaps is provided &quot;as is&quot; without warranties of any kind. We are not liable for any injury, loss, or damage arising from your use of the site or participation in any activity listed on it. Use common sense and play safe.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Geographic scope</h2>
          <p>VolleyMaps currently covers Toronto and the Greater Toronto Area. We may expand to other cities in the future.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-foreground">Contact</h2>
          <p>Questions about these terms? Email <a href="mailto:bernoubenne@me.com" className="text-primary hover:underline">bernoubenne@me.com</a>.</p>
        </section>

      </div>
    </div>
  )
}
