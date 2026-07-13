'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Submission, Venue, GameSession } from '@/types'
import {
  rejectSubmission, approveSubmission, addVenue, updateVenue,
  addSession, updateSession, deleteSession, logoutAction,
} from './actions'

const DAY_OPTIONS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminClient({ submissions, venues, sessions }: { submissions: Submission[]; venues: Venue[]; sessions: GameSession[] }) {
  const [tab, setTab] = useState<'submissions' | 'history' | 'venues'>('submissions')
  const pending = submissions.filter(s => s.status === 'pending')
  const decided = submissions.filter(s => s.status !== 'pending')

  const TAB_LABEL: Record<typeof tab, string> = {
    submissions: `Submissions ${pending.length > 0 ? `(${pending.length})` : ''}`,
    history: `History ${decided.length > 0 ? `(${decided.length})` : ''}`,
    venues: 'Venues',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏐</span>
          <span className="font-display font-bold text-xl tracking-wide uppercase">Admin</span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Sign out
          </button>
        </form>
      </div>

      <div className="flex gap-1 mb-6 border border-border rounded-lg p-1 w-fit">
        {(['submissions', 'history', 'venues'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-semibold px-4 py-1.5 rounded-md transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'submissions' && <SubmissionsTab submissions={pending} />}
      {tab === 'history' && <HistoryTab submissions={decided} />}
      {tab === 'venues' && <VenuesTab venues={venues} sessions={sessions} />}
    </div>
  )
}

function SubmissionsTab({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending submissions.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {submissions.map(s => (
        <SubmissionCard key={s.id} submission={s} />
      ))}
    </div>
  )
}

function HistoryTab({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return <p className="text-sm text-muted-foreground">No approved or rejected submissions yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {submissions.map(s => (
        <div key={s.id} className="border border-border rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h3 className="font-display font-bold text-base uppercase tracking-wide">{s.venue_name}</h3>
              <p className="text-xs text-muted-foreground">{s.address}, {s.city}</p>
            </div>
            <span
              className={`shrink-0 text-xs font-bold uppercase tracking-widest mt-0.5 ${
                s.status === 'approved' ? 'text-green-500' : 'text-destructive'
              }`}
            >
              {s.status}
            </span>
          </div>

          {s.schedule && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{s.schedule}</p>
          )}

          <p className="text-xs text-muted-foreground">
            From: <span className="text-foreground">{s.name}</span> · {s.email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Submitted {new Date(s.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}

function SubmissionCard({ submission: s }: { submission: Submission }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [slug, setSlug] = useState(toSlug(s.venue_name))

  if (done) return null

  function handleReject() {
    startTransition(async () => {
      const result = await rejectSubmission(s.id)
      if (result?.error) { setError(result.error); return }
      setDone(true)
      router.refresh()
    })
  }

  function handleApprove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await approveSubmission(formData)
      if (result?.error) { setError(result.error); return }
      setDone(true)
      router.refresh()
    })
  }

  const typeColor = s.type === 'beach'
    ? 'oklch(0.82 0.17 75)'
    : s.type === 'grass'
    ? 'oklch(0.55 0.18 145)'
    : 'oklch(0.70 0.14 218)'

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-display font-bold text-base uppercase tracking-wide">{s.venue_name}</h3>
            <p className="text-xs text-muted-foreground">{s.address}, {s.city}</p>
          </div>
          <span className="shrink-0 text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: typeColor }}>
            {s.type}
          </span>
        </div>

        {s.schedule && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{s.schedule}</p>
        )}

        <p className="text-xs text-muted-foreground">
          From: <span className="text-foreground">{s.name}</span> · {s.email}
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setExpanded(v => !v)}
            disabled={isPending}
            className="flex-1 text-sm font-semibold bg-primary text-primary-foreground rounded-lg py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {expanded ? 'Cancel' : 'Approve'}
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="flex-1 text-sm font-semibold border border-destructive text-destructive rounded-lg py-2 hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {isPending ? '…' : 'Reject'}
          </button>
        </div>
      </div>

      {expanded && (
        <form ref={formRef} onSubmit={handleApprove} className="border-t border-border bg-card/50 p-4 flex flex-col gap-3">
          <input type="hidden" name="submission_id" value={s.id} />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Confirm venue details</p>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Venue name" name="name" defaultValue={s.venue_name} required />
            <FormField label="Slug" name="slug" value={slug} onChange={e => setSlug(e.target.value)} required />
            <FormField label="Address" name="address" defaultValue={s.address} required />
            <FormField label="City" name="city" defaultValue={s.city} required />
            <FormField label="Lat *" name="lat" placeholder="43.6532" required />
            <FormField label="Lng *" name="lng" placeholder="-79.3832" required />
            <FormField label="Website" name="website" defaultValue={s.website} />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Type</label>
              <select name="type" defaultValue={s.type}
                className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="beach">Beach</option>
                <option value="grass">Grass</option>
                <option value="indoor">Indoor</option>
              </select>
            </div>
          </div>

          {s.schedule && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <span className="font-semibold">Schedule from submission:</span> {s.schedule}
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="text-sm font-bold bg-primary text-primary-foreground rounded-lg py-2 hover:opacity-90 transition-opacity disabled:opacity-50 font-display uppercase tracking-wide"
          >
            {isPending ? 'Creating venue…' : 'Create venue + mark approved'}
          </button>
        </form>
      )}
    </div>
  )
}

function VenuesTab({ venues, sessions }: { venues: Venue[]; sessions: GameSession[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [addSession, setAddSession] = useState(false)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
    setSlug(toSlug(e.target.value))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await addVenue(formData)
      if (result?.error) { setError(result.error); return }
      setSuccess(true)
      formRef.current?.reset()
      setName('')
      setSlug('')
      setAddSession(false)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Venue</p>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Name" name="name" value={name} onChange={handleNameChange} required />
          <FormField label="Slug" name="slug" value={slug} onChange={e => setSlug(e.target.value)} required />
          <FormField label="Address" name="address" required />
          <FormField label="City" name="city" defaultValue="Toronto" required />
          <FormField label="Lat" name="lat" placeholder="43.6532" required />
          <FormField label="Lng" name="lng" placeholder="-79.3832" required />
          <FormField label="Website" name="website" />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Type</label>
            <select name="type" defaultValue="beach"
              className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="beach">Beach</option>
              <option value="grass">Grass</option>
              <option value="indoor">Indoor</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAddSession(v => !v)}
          className="text-sm text-primary font-semibold text-left hover:underline"
        >
          {addSession ? '− Remove session' : '+ Add a session'}
        </button>

        {addSession && (
          <div className="grid grid-cols-2 gap-3 border border-border rounded-xl p-4">
            <div className="col-span-2">
              <FormField label="Session title" name="session_title" placeholder="Saturday Open Play" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Day of week</label>
              <select name="day_of_week" defaultValue="6"
                className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {DAY_OPTIONS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Skill level</label>
              <select name="skill_level" defaultValue="all"
                className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="all">All levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="competitive">Competitive</option>
              </select>
            </div>
            <FormField label="Start time" name="start_time" type="time" />
            <FormField label="End time" name="end_time" type="time" />
            <div className="col-span-2">
              <FormField label="Notes" name="notes" placeholder="$10 drop-in. RSVP required." />
            </div>
            <div className="col-span-2">
              <FormField label="Contact / registration link" name="contact_link" />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-500">Venue added successfully.</p>}

        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground font-bold uppercase tracking-wide font-display text-sm rounded-full py-2.5 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {isPending ? 'Adding…' : 'Add venue'}
        </button>
      </form>

      {venues.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            All venues ({venues.length}) — click to edit
          </p>
          <div className="flex flex-col gap-1">
            {venues.map(v => (
              <VenueRow key={v.id} venue={v} sessions={sessions.filter(s => s.venue_id === v.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function VenueRow({ venue: v, sessions }: { venue: Venue; sessions: GameSession[] }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [slug, setSlug] = useState(v.slug)
  const [addingSession, setAddingSession] = useState(false)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateVenue(formData)
      if (result?.error) { setError(result.error); return }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setExpanded(x => !x)}
        className="flex items-center justify-between py-2 w-full text-left hover:opacity-80 transition-opacity"
      >
        <div>
          <span className="text-sm font-medium">{v.name}</span>
          <span className="text-xs text-muted-foreground ml-2">{v.city}</span>
        </div>
        <span className="text-xs text-muted-foreground capitalize">{v.type}</span>
      </button>

      {expanded && (
        <div className="pb-4 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="hidden" name="venue_id" value={v.id} />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Venue details</p>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" name="name" defaultValue={v.name} required />
              <FormField label="Slug" name="slug" value={slug} onChange={e => setSlug(e.target.value)} required />
              <FormField label="Address" name="address" defaultValue={v.address} required />
              <FormField label="City" name="city" defaultValue={v.city} required />
              <FormField label="Lat" name="lat" defaultValue={String(v.lat)} required />
              <FormField label="Lng" name="lng" defaultValue={String(v.lng)} required />
              <FormField label="Website" name="website" defaultValue={v.website} />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Type</label>
                <select name="type" defaultValue={v.type}
                  className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="beach">Beach</option>
                  <option value="grass">Grass</option>
                  <option value="indoor">Indoor</option>
                </select>
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {saved && <p className="text-xs text-green-500">Saved.</p>}

            <button
              type="submit"
              disabled={isPending}
              className="text-sm font-bold bg-primary text-primary-foreground rounded-lg py-2 hover:opacity-90 transition-opacity disabled:opacity-50 font-display uppercase tracking-wide"
            >
              {isPending ? 'Saving…' : 'Save venue'}
            </button>
          </form>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Sessions {sessions.length > 0 ? `(${sessions.length})` : ''}
              </p>
              <button
                type="button"
                onClick={() => setAddingSession(x => !x)}
                className="text-xs text-primary font-semibold hover:underline"
              >
                {addingSession ? '− Cancel' : '+ Add session'}
              </button>
            </div>

            {sessions.length === 0 && !addingSession && (
              <p className="text-xs text-muted-foreground">No sessions for this venue yet.</p>
            )}

            {sessions.map(s => (
              <SessionForm key={s.id} session={s} />
            ))}

            {addingSession && (
              <SessionForm venueId={v.id} onDone={() => setAddingSession(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SessionForm({
  session, venueId, onDone,
}: {
  session?: GameSession
  venueId?: string
  onDone?: () => void
}) {
  const isNew = !session
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [recurring, setRecurring] = useState(session?.recurring ?? true)
  const router = useRouter()

  if (deleted) return null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = isNew ? await addSession(formData) : await updateSession(formData)
      if (result?.error) { setError(result.error); return }
      setSaved(true)
      router.refresh()
      if (isNew) onDone?.()
    })
  }

  function handleDelete() {
    if (!session) return
    if (!confirm(`Delete "${session.title}"?`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteSession(session.id)
      if (result?.error) { setError(result.error); return }
      setDeleted(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-xl p-3 flex flex-col gap-3">
      {session && <input type="hidden" name="session_id" value={session.id} />}
      {venueId && <input type="hidden" name="venue_id" value={venueId} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField label="Session title" name="title" defaultValue={session?.title} placeholder="Saturday Open Play" required />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Skill level</label>
          <select name="skill_level" defaultValue={session?.skill_level ?? 'all'}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="all">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="competitive">Competitive</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Cost type</label>
          <select name="cost_type" defaultValue={session?.cost_type ?? 'unknown'}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="unknown">Unknown</option>
            <option value="free">Free</option>
            <option value="paid">Paid / drop-in</option>
            <option value="registration">Registration</option>
          </select>
        </div>

        <FormField label="Start time" name="start_time" type="time" defaultValue={session?.start_time} required />
        <FormField label="End time" name="end_time" type="time" defaultValue={session?.end_time} required />

        <label className="flex items-center gap-2 text-xs text-muted-foreground col-span-2">
          <input type="checkbox" name="recurring" defaultChecked={recurring} onChange={e => setRecurring(e.target.checked)} />
          Recurring weekly
        </label>

        {recurring ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Day of week</label>
            <select name="day_of_week" defaultValue={String(session?.day_of_week ?? 6)}
              className="rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {DAY_OPTIONS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
        ) : (
          <FormField label="Specific date" name="specific_date" type="date" defaultValue={session?.specific_date} />
        )}

        <FormField label="Cost label" name="cost_label" defaultValue={session?.cost_label ?? undefined} placeholder="$10 drop-in" />

        <div className="col-span-2">
          <FormField label="Notes" name="notes" defaultValue={session?.notes} placeholder="RSVP required." />
        </div>
        <div className="col-span-2">
          <FormField label="Contact / registration link" name="contact_link" defaultValue={session?.contact_link} />
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground col-span-2">
          <input type="checkbox" name="featured" defaultChecked={session?.featured ?? false} />
          Featured listing
        </label>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && <p className="text-xs text-green-500">Saved.</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 text-sm font-bold bg-primary text-primary-foreground rounded-lg py-2 hover:opacity-90 transition-opacity disabled:opacity-50 font-display uppercase tracking-wide"
        >
          {isPending ? 'Saving…' : isNew ? 'Add session' : 'Save session'}
        </button>
        {session && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm font-semibold border border-destructive text-destructive rounded-lg px-3 py-2 hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

function FormField({
  label, name, type = 'text', required = false, placeholder, defaultValue, value, onChange,
}: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string
  defaultValue?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs text-muted-foreground">{label}</label>
      <input
        id={name} name={name} type={type} required={required} placeholder={placeholder}
        defaultValue={defaultValue} value={value} onChange={onChange}
        className="rounded-lg border border-border bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
