'use client'

import { useState, useEffect } from 'react'

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

export default function RsvpButton({ sessionId }: RsvpButtonProps) {
  const [count, setCount] = useState<number | null>(null)
  const [going, setGoing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = getToken()
    fetch(`/api/rsvp?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => { setCount(d.count); setGoing(d.going) })
      .catch(() => {})
  }, [sessionId])

  async function toggle() {
    if (loading) return
    const token = getToken()
    const wasGoing = going
    setLoading(true)
    setGoing(!wasGoing)
    setCount(c => (c ?? 0) + (wasGoing ? -1 : 1))
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, token }),
      })
      const data = await res.json()
      setCount(data.count)
      setGoing(data.going)
    } catch {
      setGoing(wasGoing)
      setCount(c => (c ?? 0) + (wasGoing ? 1 : -1))
    } finally {
      setLoading(false)
    }
  }

  if (count === null) return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
        going
          ? 'bg-primary/15 text-primary border-primary/40'
          : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
      }`}
    >
      {going ? '✓ Going' : 'Going'}{count > 0 ? ` (${count})` : ''}
    </button>
  )
}
