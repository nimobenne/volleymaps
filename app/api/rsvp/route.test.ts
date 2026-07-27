import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Thenable query-builder stub: every chained call (from/select/eq/in/gte/lt)
// returns itself; awaiting it resolves to whatever the test queued next.
// Mirrors how @supabase/supabase-js builders work (they're PromiseLike).
type QueuedResult = { data?: unknown; error?: unknown; count?: number | null }
let resultQueue: QueuedResult[] = []

function nextResult(): QueuedResult {
  return resultQueue.shift() ?? { data: null, error: null }
}

function makeBuilder(): any {
  const builder: any = {}
  for (const method of ['from', 'select', 'eq', 'in', 'gte', 'lt', 'delete', 'insert', 'upsert']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.then = (resolve: (v: QueuedResult) => unknown) => Promise.resolve(nextResult()).then(resolve)
  return builder
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => makeBuilder(),
}))

function postReq(body: unknown, ip = '1.1.1.1') {
  return new NextRequest('http://localhost/api/rsvp', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

function getReq(query: string, ip = '2.2.2.2') {
  return new NextRequest(`http://localhost/api/rsvp?${query}`, {
    headers: { 'x-forwarded-for': ip },
  })
}

const VALID_ID = '11111111-1111-1111-1111-111111111111'
const VALID_TOKEN = '22222222-2222-2222-2222-222222222222'

beforeEach(() => {
  resultQueue = []
  vi.resetModules()
})

describe('GET /api/rsvp', () => {
  it('returns empty result without querying supabase when no valid ids are given', async () => {
    const { GET } = await import('./route')
    const res = await GET(getReq('sessionIds=not-a-uuid'))
    const json = await res.json()
    expect(json).toEqual({ counts: {}, going: [] })
  })

  it('returns batched counts and going list for valid ids', async () => {
    resultQueue = [
      { data: [{ session_id: VALID_ID }, { session_id: VALID_ID }] }, // rows
      { data: [{ session_id: VALID_ID }] }, // mine
    ]
    const { GET } = await import('./route')
    const res = await GET(getReq(`sessionIds=${VALID_ID}&token=${VALID_TOKEN}`))
    const json = await res.json()
    expect(json.counts[VALID_ID]).toBe(2)
    expect(json.going).toEqual([VALID_ID])
  })

  it('rate limits after RATE_LIMIT_MAX_GET requests from the same IP', async () => {
    const { GET } = await import('./route')
    const ip = '9.9.9.9'
    let last
    for (let i = 0; i < 31; i++) {
      resultQueue.push({ data: [] }, { data: [] })
      last = await GET(getReq(`sessionIds=${VALID_ID}`, ip))
    }
    expect(last!.status).toBe(429)
  })
})

describe('POST /api/rsvp', () => {
  it('rejects invalid JSON body', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/rsvp', {
      method: 'POST',
      headers: { 'x-forwarded-for': '3.3.3.3', 'content-type': 'application/json' },
      body: '{not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects non-uuid sessionId/token', async () => {
    const { POST } = await import('./route')
    const res = await POST(postReq({ sessionId: 'nope', token: 'nope' }, '3.3.3.4'))
    expect(res.status).toBe(400)
  })

  it('toggles off (going:false) when an existing RSVP is deleted', async () => {
    resultQueue = [
      { error: null }, // cleanupStale delete
      { data: [{ id: 'row-1' }], error: null }, // toggle delete found a row
      { count: 3, error: null }, // getCount
    ]
    const { POST } = await import('./route')
    const res = await POST(postReq({ sessionId: VALID_ID, token: VALID_TOKEN }, '4.4.4.4'))
    const json = await res.json()
    expect(json).toEqual({ count: 3, going: false })
  })

  it('toggles on (going:true) when no existing RSVP is found', async () => {
    resultQueue = [
      { error: null }, // cleanupStale delete
      { data: [], error: null }, // toggle delete found nothing
      { error: null }, // insert
      { count: 1, error: null }, // getCount
    ]
    const { POST } = await import('./route')
    const res = await POST(postReq({ sessionId: VALID_ID, token: VALID_TOKEN }, '4.4.4.5'))
    const json = await res.json()
    expect(json).toEqual({ count: 1, going: true })
  })

  it('returns 500 when the toggle delete errors', async () => {
    resultQueue = [
      { error: null }, // cleanupStale delete
      { data: null, error: { message: 'db down' } }, // toggle delete fails
    ]
    const { POST } = await import('./route')
    const res = await POST(postReq({ sessionId: VALID_ID, token: VALID_TOKEN }, '4.4.4.6'))
    expect(res.status).toBe(500)
  })

  it('rate limits after RATE_LIMIT_MAX_POST requests from the same IP', async () => {
    const { POST } = await import('./route')
    const ip = '8.8.8.8'
    let last
    for (let i = 0; i < 11; i++) {
      resultQueue.push({ error: null }, { data: [], error: null }, { error: null }, { count: 0, error: null })
      last = await POST(postReq({ sessionId: VALID_ID, token: VALID_TOKEN }, ip))
    }
    expect(last!.status).toBe(429)
  })
})
