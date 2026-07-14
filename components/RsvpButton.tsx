'use client'

import { useState, useEffect } from 'react'
import { User } from 'lucide-react'

interface RsvpButtonProps {
  sessionId: string
}

function getToken(): string {
  const today = new Date().toISOString().slice(0, 10)
  const stored = localStorage.getItem('vm_token')
  const storedDay = localStorage.getItem('vm_token_day')
  if (!stored || storedDay !== today) {
    const token = crypto.randomUUID()
    localStorage.setItem('vm_token', token)
    localStorage.setItem('vm_token_day', today)
    return token
  }
  return stored
}

interface RsvpState { count: number; going: boolean }

// LiveFeed is mounted twice (desktop aside + mobile drawer), so each session's
// RSVP button renders twice. Share one initial fetch per session and broadcast
// toggles so both instances stay in sync.
const initialFetch = new Map<string, Promise<RsvpState>>()
const SYNC_EVENT = 'vm:rsvp-sync'

function fetchInitial(sessionId: string): Promise<RsvpState> {
  let p = initialFetch.get(sessionId)
  if (!p) {
    const token = getToken()
    p = fetch(`/api/rsvp?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`)
      .then(r => r.json())
    initialFetch.set(sessionId, p)
  }
  return p
}

export default function RsvpButton({ sessionId }: RsvpButtonProps) {
  const [count, setCount] = useState<number | null>(null)
  const [going, setGoing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchInitial(sessionId)
      .then(d => { if (!cancelled) { setCount(d.count); setGoing(d.going) } })
      .catch(() => {})

    function onSync(e: Event) {
      const d = (e as CustomEvent<RsvpState & { sessionId: string }>).detail
      if (d.sessionId === sessionId) { setCount(d.count); setGoing(d.going) }
    }
    window.addEventListener(SYNC_EVENT, onSync)
    return () => { cancelled = true; window.removeEventListener(SYNC_EVENT, onSync) }
  }, [sessionId])

  async function toggle() {
    if (loading) return
    const token = getToken()
    const wasGoing = going
    const prevCount = count
    setLoading(true)
    setGoing(!wasGoing)
    setCount(c => (c ?? 0) + (wasGoing ? -1 : 1))
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, token }),
      })
      if (!res.ok) throw new Error('rsvp failed')
      const data: RsvpState = await res.json()
      setCount(data.count)
      setGoing(data.going)
      initialFetch.set(sessionId, Promise.resolve(data))
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { sessionId, ...data } }))
    } catch {
      setGoing(wasGoing)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  if (count === null) return null

  const MAX_AVATARS = 3
  const shown = Math.min(count, MAX_AVATARS)
  const overflow = count - shown

  return (
    <div className="inline-flex items-center gap-1.5">
      {count > 0 && (
        <div className="flex items-center -space-x-1.5" aria-hidden="true">
          {Array.from({ length: shown }).map((_, i) => (
            <span
              key={i}
              className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-background bg-primary/20 text-primary"
            >
              <User className="h-2.5 w-2.5" strokeWidth={2.5} />
            </span>
          ))}
          {overflow > 0 && (
            <span className="flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full border-2 border-background bg-muted text-[9px] font-bold text-muted-foreground">
              +{overflow}
            </span>
          )}
        </div>
      )}
      <button
        onClick={toggle}
        disabled={loading}
        aria-pressed={going}
        aria-label={going ? `Cancel RSVP${count > 0 ? `, ${count} going` : ''}` : `RSVP going${count > 0 ? `, ${count} already going` : ''}`}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 min-h-[28px] rounded-full border transition-all ${
          going
            ? 'bg-primary/15 text-primary border-primary/40'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
        }`}
      >
        {going ? '✓ Going' : 'Going'}{count > 0 ? ` (${count})` : ''}
      </button>
    </div>
  )
}
