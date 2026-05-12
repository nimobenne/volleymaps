// Usage: node scripts/setup-pocketbase.mjs <admin-email> <admin-password>

import PocketBase from 'pocketbase'

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error('Usage: node scripts/setup-pocketbase.mjs <email> <password>')
  process.exit(1)
}

const pb = new PocketBase('http://127.0.0.1:8090')

try {
  await pb.health.check()
  console.log('✓ PocketBase is reachable')
} catch {
  console.error('✗ Cannot reach PocketBase — is it running?')
  process.exit(1)
}

let authed = false
try {
  await pb.collection('_superusers').authWithPassword(email, password)
  console.log('✓ Authenticated')
  authed = true
} catch {}
if (!authed) {
  try { await pb.admins.authWithPassword(email, password); authed = true } catch {}
}
if (!authed) {
  console.error('✗ Auth failed')
  process.exit(1)
}

const sel = (values, maxSelect = 1) => ({ maxSelect, values })

const collections = [
  {
    name: 'venues',
    type: 'base',
    fields: [
      { name: 'name',      type: 'text',   required: true },
      { name: 'type',      type: 'select', required: true, maxSelect: 1, values: ['beach', 'indoor'] },
      { name: 'address',   type: 'text',   required: true },
      { name: 'city',      type: 'text',   required: true },
      { name: 'lat',       type: 'number', required: true },
      { name: 'lng',       type: 'number', required: true },
      { name: 'slug',      type: 'text',   required: true },
      { name: 'approved',  type: 'bool' },
      { name: 'website',   type: 'url' },
      { name: 'photo_url', type: 'text' },
    ],
  },
  {
    name: 'game_sessions',
    type: 'base',
    fields: [
      { name: 'venue_id',      type: 'text',   required: true },
      { name: 'title',         type: 'text',   required: true },
      { name: 'day_of_week',   type: 'number' },
      { name: 'specific_date', type: 'text' },
      { name: 'start_time',    type: 'text',   required: true },
      { name: 'end_time',      type: 'text',   required: true },
      { name: 'recurring',     type: 'bool' },
      { name: 'skill_level',   type: 'select', required: true, maxSelect: 1, values: ['all', 'beginner', 'intermediate', 'competitive'] },
      { name: 'notes',         type: 'text' },
      { name: 'contact_link',  type: 'url' },
      { name: 'featured',      type: 'bool' },
    ],
  },
  {
    name: 'submissions',
    type: 'base',
    fields: [
      { name: 'name',         type: 'text',   required: true },
      { name: 'email',        type: 'email',  required: true },
      { name: 'venue_name',   type: 'text',   required: true },
      { name: 'address',      type: 'text',   required: true },
      { name: 'city',         type: 'text',   required: true },
      { name: 'type',         type: 'select', required: true, maxSelect: 1, values: ['beach', 'indoor'] },
      { name: 'website',      type: 'url' },
      { name: 'schedule',     type: 'text' },
      { name: 'contact_link', type: 'url' },
      { name: 'status',       type: 'select', maxSelect: 1, values: ['pending', 'approved', 'rejected'] },
    ],
  },
]

for (const col of collections) {
  try {
    // Try to get existing collection and update it, else create
    let existing = null
    try { existing = await pb.collections.getOne(col.name) } catch {}

    if (existing) {
      await pb.collections.update(existing.id, { fields: col.fields })
      console.log(`✓ Updated collection: ${col.name}`)
    } else {
      await pb.collections.create(col)
      console.log(`✓ Created collection: ${col.name}`)
    }
  } catch (e) {
    console.error(`✗ Failed ${col.name}:`, e.message, JSON.stringify(e.data ?? ''))
  }
}

console.log('\nDone. Check http://127.0.0.1:8090/_/ → Collections')
