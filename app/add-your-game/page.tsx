'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function AddYourGamePage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const { pb } = await import('@/lib/pocketbase')
      await pb.collection('submissions').create({
        name:         data.get('name'),
        email:        data.get('email'),
        venue_name:   data.get('venue_name'),
        address:      data.get('address'),
        city:         data.get('city'),
        type:         data.get('type'),
        website:      data.get('website') || undefined,
        schedule:     data.get('schedule'),
        contact_link: data.get('contact_link') || undefined,
        status:       'pending',
      })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center text-center">
        <CheckCircle className="h-12 w-12 text-primary mb-4" />
        <h1 className="font-display font-bold text-2xl uppercase tracking-wide mb-2">Request received!</h1>
        <p className="text-muted-foreground text-sm mb-6">
          We&apos;ll review your submission and add it to the map within a few days.
        </p>
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          ← Back to map
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to map
      </Link>

      <div className="h-1 w-10 rounded-full mb-4" style={{ backgroundColor: 'oklch(0.82 0.17 75)' }} />
      <h1 className="font-display font-bold text-3xl uppercase tracking-wide mb-1">Add your game</h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        Running a pickup session or drop-in? Get listed on VolleyMaps for free.
        We review all submissions before publishing.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Section title="Your info">
          <Field label="Name" name="name" required placeholder="Alex Smith" />
          <Field label="Email" name="email" type="email" required placeholder="you@example.com" />
        </Section>

        <Section title="Venue">
          <Field label="Location name" name="venue_name" required placeholder="Woodbine Beach" />
          <Field label="Full address" name="address" required placeholder="1675 Lake Shore Blvd E, Toronto, ON" />
          <Field label="City" name="city" required placeholder="Toronto" />
          <SelectField label="Type" name="type" required>
            <option value="">Select…</option>
            <option value="beach">Beach / sand</option>
            <option value="grass">Grass / outdoor</option>
            <option value="indoor">Indoor</option>
          </SelectField>
          <Field label="Website or social link" name="website" placeholder="https://…" />
        </Section>

        <Section title="Schedule">
          <TextareaField
            label="Schedule details"
            name="schedule"
            required
            placeholder="e.g. Every Saturday 10am–2pm, all levels welcome. Drop-in $5."
          />
          <Field label="Registration / contact link" name="contact_link" placeholder="https://…" />
        </Section>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground font-bold uppercase tracking-wide font-display text-base rounded-full py-3 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border border-border rounded-xl p-4">
      <legend className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">{title}</legend>
      {children}
    </fieldset>
  )
}

function Field({ label, name, type = 'text', required = false, placeholder }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      <input
        id={name} name={name} type={type} required={required} placeholder={placeholder}
        className="rounded-lg border border-border bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
      />
    </div>
  )
}

function SelectField({ label, name, required = false, children }: {
  label: string; name: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      <select
        id={name} name={name} required={required}
        className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
      >
        {children}
      </select>
    </div>
  )
}

function TextareaField({ label, name, required = false, placeholder }: {
  label: string; name: string; required?: boolean; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      <textarea
        id={name} name={name} required={required} rows={4} placeholder={placeholder}
        className="rounded-lg border border-border bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
      />
    </div>
  )
}
