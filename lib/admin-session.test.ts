import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// next/headers' cookies() needs a request context we don't have in a unit
// test — swap in an in-memory cookie jar with the same get/set/delete shape.
const jar = new Map<string, { value: string }>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => jar.get(name),
    set: (name: string, value: string) => jar.set(name, { value }),
    delete: (name: string) => jar.delete(name),
  }),
}))

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  jar.clear()
  process.env = { ...ORIGINAL_ENV, ADMIN_PASSWORD: 'correct-horse', ADMIN_SESSION_SECRET: '' }
  delete process.env.ADMIN_SESSION_SECRET
  vi.resetModules()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.useRealTimers()
})

describe('admin-session', () => {
  it('createAdminSession followed by isAdminAuthenticated succeeds', async () => {
    const { createAdminSession, isAdminAuthenticated } = await import('./admin-session')
    await createAdminSession()
    expect(await isAdminAuthenticated()).toBe(true)
  })

  it('rejects when no cookie is set', async () => {
    const { isAdminAuthenticated } = await import('./admin-session')
    expect(await isAdminAuthenticated()).toBe(false)
  })

  it('rejects a tampered expiry (signature no longer matches)', async () => {
    const { createAdminSession, isAdminAuthenticated } = await import('./admin-session')
    await createAdminSession()
    const cookie = jar.get('admin_session')!
    const dot = cookie.value.indexOf('.')
    const forgedExpires = String(Date.now() + 999 * 24 * 60 * 60 * 1000)
    jar.set('admin_session', { value: `${forgedExpires}.${cookie.value.slice(dot + 1)}` })
    expect(await isAdminAuthenticated()).toBe(false)
  })

  it('rejects an expired session even with a valid signature', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const { createAdminSession, isAdminAuthenticated } = await import('./admin-session')
    await createAdminSession()
    vi.setSystemTime(new Date('2026-03-01T00:00:00Z')) // > 30 days later
    expect(await isAdminAuthenticated()).toBe(false)
  })

  it('rejects malformed cookie values without throwing', async () => {
    const { isAdminAuthenticated } = await import('./admin-session')
    jar.set('admin_session', { value: 'not-a-valid-cookie' })
    expect(await isAdminAuthenticated()).toBe(false)
  })

  it('destroyAdminSession clears the cookie', async () => {
    const { createAdminSession, destroyAdminSession, isAdminAuthenticated } = await import('./admin-session')
    await createAdminSession()
    await destroyAdminSession()
    expect(await isAdminAuthenticated()).toBe(false)
  })

  it('throws on createAdminSession when neither secret nor password is set', async () => {
    delete process.env.ADMIN_PASSWORD
    delete process.env.ADMIN_SESSION_SECRET
    const { createAdminSession } = await import('./admin-session')
    await expect(createAdminSession()).rejects.toThrow()
  })

  it('safeEqual rejects different-length inputs without throwing', async () => {
    const { safeEqual } = await import('./admin-session')
    expect(safeEqual('abc', 'abcd')).toBe(false)
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'xyz')).toBe(false)
  })
})
