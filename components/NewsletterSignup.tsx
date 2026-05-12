'use client'

import { useState } from 'react'

export default function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <p className="text-sm font-semibold text-primary">
        You&apos;re on the list.
      </p>
    )
  }

  return (
    <div className={compact ? '' : 'flex flex-col gap-3'}>
      {!compact && (
        <div>
          <p className="text-sm font-semibold">Weekly volleyball picks</p>
          <p className="text-xs text-muted-foreground mt-0.5">New sessions, venues, and Toronto game updates every week.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 min-w-0 rounded-lg border border-border bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="shrink-0 bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {status === 'loading' ? '…' : 'Join'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-destructive">Something went wrong. Try again.</p>
      )}
    </div>
  )
}
