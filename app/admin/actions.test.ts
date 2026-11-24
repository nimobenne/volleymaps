import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { activeIp, createAdminSession } = vi.hoisted(() => ({
  activeIp: { value: '10.0.0.1' },
  createAdminSession: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ 'x-forwarded-for': activeIp.value })),
}))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/db', () => ({ dbResult: vi.fn() }))
vi.mock('@/lib/admin-session', () => ({
  createAdminSession,
  destroyAdminSession: vi.fn(),
  isAdminAuthenticated: vi.fn(),
  safeEqual: (actual: string, expected: string) => actual === expected,
}))

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('ADMIN_PASSWORD', 'correct-password')
  activeIp.value = '10.0.0.1'
  createAdminSession.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('admin login rate limit', () => {
  it('returns the generic password error after five attempts from one IP', async () => {
    const { loginAction } = await import('./actions')
    const form = new FormData()
    form.set('password', 'wrong-password')

    for (let i = 0; i < 5; i++) {
      expect(await loginAction(form)).toEqual({ error: 'Wrong password' })
    }

    form.set('password', 'correct-password')
    expect(await loginAction(form)).toEqual({ error: 'Wrong password' })
    expect(createAdminSession).not.toHaveBeenCalled()
  })
})
