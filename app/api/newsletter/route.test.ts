import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

type QueuedResult = { error?: unknown }
let resultQueue: QueuedResult[] = []
let upsertArgs: unknown[] = []

vi.mock('@/lib/db', () => ({
  dbResult: vi.fn(async (...args: unknown[]) => {
    upsertArgs = args
    return resultQueue.shift() ?? { error: null }
  }),
}))

function postReq(body: unknown, ip = '1.1.1.1') {
  return new NextRequest('http://localhost/api/newsletter', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resultQueue = []
  upsertArgs = []
  vi.resetModules()
})

describe('POST /api/newsletter', () => {
  it('rejects invalid JSON body', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects a non-string email', async () => {
    const { POST } = await import('./route')
    const res = await POST(postReq({ email: 12345 }))
    expect(res.status).toBe(400)
  })

  it('rejects a malformed email', async () => {
    const { POST } = await import('./route')
    const res = await POST(postReq({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('accepts a valid email, normalizes it, and upserts on the email column', async () => {
    resultQueue = [{ error: null }]
    const { POST } = await import('./route')
    const res = await POST(postReq({ email: 'Person@Example.COM' }))
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    expect(upsertArgs[1]).toEqual(['person@example.com'])
    expect(upsertArgs[0]).toContain('ON CONFLICT (email) DO NOTHING')
  })

  it('trims leading/trailing whitespace before validating (mobile autofill often adds it)', async () => {
    resultQueue = [{ error: null }]
    const { POST } = await import('./route')
    const res = await POST(postReq({ email: '  Person@Example.COM  ' }))
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    expect(upsertArgs[1]).toEqual(['person@example.com'])
  })

  it('returns 500 without leaking the db error message when the database fails', async () => {
    resultQueue = [{ error: { message: 'unique constraint violation on secret_internal_table' } }]
    const { POST } = await import('./route')
    const res = await POST(postReq({ email: 'person@example.com' }))
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(JSON.stringify(json)).not.toContain('secret_internal_table')
  })

  it('allows five signups per IP per hour, then returns 429', async () => {
    resultQueue = Array.from({ length: 5 }, () => ({ error: null }))
    const { POST } = await import('./route')
    const ip = '9.8.7.6'
    let last
    for (let i = 0; i < 6; i++) {
      last = await POST(postReq({ email: `person${i}@example.com` }, ip))
    }

    expect(last!.status).toBe(429)
    expect(resultQueue).toHaveLength(0)
  })
})
