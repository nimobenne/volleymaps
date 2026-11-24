import pg from 'pg'
import { pathToFileURL } from 'node:url'

export const TABLES = ['venues', 'game_sessions', 'submissions', 'newsletter_subscribers', 'rsvps']

export async function migrate({ source, target, dryRun = false, log = console.log }) {
  // One stable source snapshot keeps FK rows and counts consistent during copy.
  await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  let targetStarted = false
  try {
    const counts = {}
    if (!dryRun) {
      await target.query('BEGIN')
      targetStarted = true
    }
    for (const table of TABLES) {
      const { rows: [{ count }] } = await source.query(`SELECT count(*)::int AS count FROM public.${table}`)
      counts[table] = count
      if (dryRun) {
        log(`${table}: ${count}`)
        continue
      }
      // row_to_json preserves date strings and timestamp precision, unlike pg's Date parser.
      const { rows } = await source.query(`SELECT row_to_json(t)::text AS record FROM public.${table} t`)
      for (const { record } of rows) {
        const row = JSON.parse(record)
        const columns = Object.keys(row)
        if (columns.some(column => !/^[a-z_][a-z0-9_]*$/.test(column))) throw new Error('Unexpected source column')
        await target.query(
          `INSERT INTO public.${table} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}) ON CONFLICT DO NOTHING`,
          columns.map(column => row[column]),
        )
      }
      const { rows: [{ count: targetCount }] } = await target.query(`SELECT count(*)::int AS count FROM public.${table}`)
      log(`${table}: source=${count} target=${targetCount}`)
      if (count !== targetCount) throw new Error(`Count mismatch for ${table}`)
    }
    if (targetStarted) await target.query('COMMIT')
    await source.query('COMMIT')
    return counts
  } catch (error) {
    if (targetStarted) await target.query('ROLLBACK')
    await source.query('ROLLBACK')
    throw error
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (!process.env.SUPABASE_DB_URL || (!dryRun && !process.env.DATABASE_URL)) {
    console.error('SUPABASE_DB_URL is required; DATABASE_URL is also required for a real copy')
    process.exitCode = 1
    return
  }
  const source = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL })
  const target = dryRun ? null : new pg.Client({ connectionString: process.env.DATABASE_URL })
  try {
    await source.connect()
    if (target) await target.connect()
    await migrate({ source, target, dryRun })
  } catch {
    console.error('Migration failed; transaction rolled back if open. Check connections, schema and counts.')
    process.exitCode = 1
  } finally {
    await Promise.all([source.end(), target?.end()])
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
