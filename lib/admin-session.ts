import { createHmac, createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'admin_session'
const SESSION_DAYS = 30

// Prefer a dedicated secret; fall back to a key derived from ADMIN_PASSWORD so
// existing deployments keep working. Changing the password invalidates sessions.
function getSecret(): string | null {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET
  if (process.env.ADMIN_PASSWORD) {
    return createHash('sha256').update(`vm-admin-session:${process.env.ADMIN_PASSWORD}`).digest('hex')
  }
  return null
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function createAdminSession() {
  const secret = getSecret()
  if (!secret) throw new Error('ADMIN_PASSWORD or ADMIN_SESSION_SECRET must be set')
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const value = `${expires}.${sign(String(expires), secret)}`
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

export async function destroyAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = getSecret()
  if (!secret) return false
  const cookieStore = await cookies()
  const value = cookieStore.get(COOKIE_NAME)?.value
  if (!value) return false
  const dot = value.indexOf('.')
  if (dot === -1) return false
  const expires = value.slice(0, dot)
  const sig = value.slice(dot + 1)
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false
  return safeEqual(sig, sign(expires, secret))
}
