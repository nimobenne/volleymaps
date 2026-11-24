import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getApprovedVenuesAndSessions, getVenueBySlug, PublicDataError } from './data'

vi.mock('server-only', () => ({}))

const { dbResult } = vi.hoisted(() => ({ dbResult: vi.fn() }))
vi.mock('./db', () => ({ dbResult }))

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'test-database-url')
  dbResult.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('public data reads', () => {
  it('returns empty results when successful queries find no rows', async () => {
    dbResult.mockResolvedValue({ data: [], error: null })

    await expect(getApprovedVenuesAndSessions()).resolves.toEqual({ venues: [], sessions: [] })
    await expect(getVenueBySlug('missing')).resolves.toBeNull()
  })

  it('throws a typed error when a public query fails', async () => {
    dbResult.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM venues')) return { data: null, error: { message: 'Database query failed' } }
      return { data: [], error: null }
    })

    await expect(getApprovedVenuesAndSessions()).rejects.toBeInstanceOf(PublicDataError)
  })

  it('keeps mock data when DATABASE_URL is not configured', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const result = await getApprovedVenuesAndSessions()

    expect(result.venues.length).toBeGreaterThan(0)
    expect(result.sessions.length).toBeGreaterThan(0)
    expect(dbResult).not.toHaveBeenCalled()
  })
})
