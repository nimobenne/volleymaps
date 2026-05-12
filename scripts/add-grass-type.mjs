// Adds 'grass' to type select options + fixes Junction venue type
import PocketBase from 'pocketbase'

const [email, password] = process.argv.slice(2)
const pb = new PocketBase('http://127.0.0.1:8090')

try {
  await pb.collection('_superusers').authWithPassword(email, password)
} catch {
  await pb.admins.authWithPassword(email, password)
}
console.log('✓ Authenticated')

// Update type select field in venues, game_sessions, submissions
for (const colName of ['venues', 'submissions']) {
  try {
    const col = await pb.collections.getOne(colName)
    const fields = col.fields.map(f => {
      if (f.name === 'type' && f.type === 'select') {
        return { ...f, values: ['beach', 'grass', 'indoor'] }
      }
      return f
    })
    await pb.collections.update(col.id, { fields })
    console.log(`✓ Updated type field in: ${colName}`)
  } catch (e) {
    console.error(`✗ ${colName}:`, e.message)
  }
}

// Fix Junction Pickup Volleyball → type: grass
try {
  const results = await pb.collection('venues').getFullList({ filter: 'slug = "junction-pickup-volleyball"' })
  if (results[0]) {
    await pb.collection('venues').update(results[0].id, { type: 'grass' })
    console.log('✓ Fixed Junction Pickup Volleyball → grass')
  }
} catch (e) {
  console.error('✗ Junction fix:', e.message)
}

console.log('\nDone.')
