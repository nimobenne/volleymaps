import 'server-only'
import { neon } from '@neondatabase/serverless'

const DATE_ONLY = new Set(['specific_date', 'season_start', 'season_end'])
const pad = (n: number) => String(n).padStart(2, '0')

// The driver parses date/timestamptz into Date objects; the app (and its old Supabase
// client) expects strings: 'YYYY-MM-DD' for date columns, ISO strings for timestamps.
export function toWireValues<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = value instanceof Date
      ? DATE_ONLY.has(key)
        ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
        : value.toISOString()
      : value
  }
  return out as T
}

// Lazy creation lets builds and public pages use mocks without a database URL.
export async function query<T = Record<string, unknown>>(text: string, values: unknown[] = []): Promise<T[]> {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')
  const rows = await neon(url).query(text, values) as Record<string, unknown>[]
  return rows.map(row => toWireValues<T>(row))
}

export async function dbResult<T = Record<string, unknown>>(text: string, values: unknown[] = []) {
  try {
    return { data: await query<T>(text, values), error: null }
  } catch (cause) {
    // Postgres detail/message can include submitted personal data. Log codes only.
    const code = typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : undefined
    return { data: null, error: { code, message: code ? `Database query failed (${code})` : 'Database query failed' } }
  }
}
