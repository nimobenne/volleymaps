import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getVenueBySlug, getVenueSessions, PublicDataError } = vi.hoisted(() => ({
  getVenueBySlug: vi.fn(),
  getVenueSessions: vi.fn(),
  PublicDataError: class PublicDataError extends Error {},
}))

vi.mock('@/lib/data', () => ({ getVenueBySlug, getVenueSessions, PublicDataError }))

beforeEach(() => {
  getVenueBySlug.mockReset()
  getVenueSessions.mockReset()
})

describe('GET /api/embed/[slug]', () => {
  it('returns 404 when the venue query succeeds with no row', async () => {
    getVenueBySlug.mockResolvedValue(null)
    const { GET } = await import('./route')

    const response = await GET(new NextRequest('http://localhost/api/embed/missing'), {
      params: Promise.resolve({ slug: 'missing' }),
    })

    expect(response.status).toBe(404)
  })

  it('returns a branded 503 when a public query fails', async () => {
    getVenueBySlug.mockRejectedValue(new PublicDataError())
    const { GET } = await import('./route')

    const response = await GET(new NextRequest('http://localhost/api/embed/test'), {
      params: Promise.resolve({ slug: 'test' }),
    })

    expect(response.status).toBe(503)
    expect(await response.text()).toContain('Games could not load')
  })

  it('returns a branded 503 when the venue schedule query fails', async () => {
    getVenueBySlug.mockResolvedValue({ id: 'venue-1' })
    getVenueSessions.mockRejectedValue(new PublicDataError())
    const { GET } = await import('./route')

    const response = await GET(new NextRequest('http://localhost/api/embed/test'), {
      params: Promise.resolve({ slug: 'test' }),
    })

    expect(response.status).toBe(503)
    expect(await response.text()).toContain('Try again soon.')
  })
})
