import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { toWireValues } from './db'

describe('toWireValues', () => {
  it('turns driver Date objects back into the strings the app expects', () => {
    const row = toWireValues<Record<string, unknown>>({
      specific_date: new Date(2026, 5, 1),
      season_end: new Date(2026, 8, 30),
      created_at: new Date(Date.UTC(2026, 10, 24, 18, 30, 0)),
      start_time: '18:00:00',
      title: 'Open play',
      cost_cents: null,
    })
    expect(row.specific_date).toBe('2026-06-01')
    expect(row.season_end).toBe('2026-09-30')
    expect(row.created_at).toBe('2026-11-24T18:30:00.000Z')
    expect(row.start_time).toBe('18:00:00')
    expect(row.title).toBe('Open play')
    expect(row.cost_cents).toBeNull()
  })
})
