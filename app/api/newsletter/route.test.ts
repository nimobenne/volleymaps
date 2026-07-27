import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

type QueuedResult = { error?: unknown }
let resultQueue: QueuedResult[] = []
let upsertArgs: unknown[] = []

function makeBuilder(): any {
  const builder: any = {}
  for (const method of ['from']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.upsert = vi.fn((...args: unknown[]) => {
    upsertArgs = args
    return builder
  })
  builder.then = (resolve: (v: QueuedResult) => unknown) =>
    Promise.resolve(resultQueue.shift() ?? { error: null }).then(resolve)
  return builder
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => makeBuilder(),
}))

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/newsletter', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
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
    expect(upsertArgs[0]).toEqual({ email: 'person@example.com' })
    expect(upsertArgs[1]).toEqual({ onConflict: 'email' })
  })

  it('trims leading/trailing whitespace before validating (mobile autofill often adds it)', async () => {
    resultQueue = [{ error: null }]
    const { POST } = await import('./route')
    const res = await POST(postReq({ email: '  Person@Example.COM  ' }))
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    expect(upsertArgs[0]).toEqual({ email: 'person@example.com' })
  })

  it('returns 500 without leaking the db error message when supabase fails', async () => {
    resultQueue = [{ error: { message: 'unique constraint violation on secret_internal_table' } }]
    const { POST } = await import('./route')
    const res = await POST(postReq({ email: 'person@example.com' }))
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(JSON.stringify(json)).not.toContain('secret_internal_table')
  })
})
