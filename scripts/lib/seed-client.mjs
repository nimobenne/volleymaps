import { createClient } from '@supabase/supabase-js'

// Shared by one-off seed/migration scripts: node scripts/<name>.mjs <supabase-url> <service-role-key>
export function getSeedClient(scriptName) {
  const [url, key] = process.argv.slice(2)
  if (!url || !key) {
    console.error(`Usage: node scripts/${scriptName} <supabase-url> <service-role-key>`)
    process.exit(1)
  }
  return createClient(url, key)
}
