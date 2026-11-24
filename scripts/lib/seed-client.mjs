import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'node:crypto'

const TABLES = new Set(['venues', 'game_sessions'])
function identifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error('Invalid SQL identifier')
  return `"${value}"`
}
function tableName(table) {
  if (!TABLES.has(table)) throw new Error('Invalid seed table')
  return identifier(table)
}

export function getSeedClient(scriptName, { dryRun = process.argv.includes('--dry-run') } = {}) {
  const url = process.env.DATABASE_URL
  const previewRows = new Map()
  async function query(text, values = [], { single = false } = {}) {
    if (!url) throw new Error(`DATABASE_URL is required for scripts/${scriptName}`)
    try {
      const rows = await neon(url).query(text, values)
      return { data: single ? rows[0] ?? null : rows, error: null }
    } catch {
      return { data: null, error: { message: 'Database query failed' } }
    }
  }
  return {
    query,
    async insert(table, input, { single = false, ignoreDuplicates = false } = {}) {
      const name = tableName(table)
      const rows = Array.isArray(input) ? input : [input]
      if (!rows.length) return { data: [], error: null }
      const columns = [...new Set(rows.flatMap(row => Object.keys(row)))]
      const values = []
      const tuples = rows.map(row => `(${columns.map(column => {
        if (!(column in row)) return 'DEFAULT'
        values.push(row[column])
        return `$${values.length}`
      }).join(', ')})`)
      if (dryRun) {
        const data = rows.map(row => ({ id: randomUUID(), ...row }))
        previewRows.set(table, [...(previewRows.get(table) ?? []), ...data])
        console.log(`Dry run: ${table} insert ${rows.length}`)
        return { data: single ? data[0] : data, error: null }
      }
      return query(`INSERT INTO ${name} (${columns.map(identifier).join(', ')}) VALUES ${tuples.join(', ')}${ignoreDuplicates ? ' ON CONFLICT (slug) DO NOTHING' : ''} RETURNING *`, values, { single })
    },
    async update(table, fields, key, value) {
      const name = tableName(table)
      const columns = Object.keys(fields)
      if (dryRun) {
        console.log(`Dry run: ${table} update`)
        return { data: [], error: null }
      }
      return query(`UPDATE ${name} SET ${columns.map((column, i) => `${identifier(column)} = $${i + 1}`).join(', ')} WHERE ${identifier(key)} = $${columns.length + 1} RETURNING *`, [...Object.values(fields), value])
    },
    // Seed scripts need inserted IDs to build session rows in dry runs.
    preview(table) { return previewRows.get(table) ?? [] },
  }
}
