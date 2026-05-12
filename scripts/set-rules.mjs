// Makes venues and game_sessions publicly readable
import PocketBase from 'pocketbase'

const [email, password] = process.argv.slice(2)
const pb = new PocketBase('http://127.0.0.1:8090')

try {
  await pb.collection('_superusers').authWithPassword(email, password)
} catch {
  await pb.admins.authWithPassword(email, password)
}
console.log('✓ Authenticated')

const publicRead = { listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null }

for (const name of ['venues', 'game_sessions']) {
  try {
    const col = await pb.collections.getOne(name)
    await pb.collections.update(col.id, publicRead)
    console.log(`✓ Public read enabled: ${name}`)
  } catch (e) {
    console.error(`✗ ${name}:`, e.message)
  }
}

// submissions: anyone can create (to submit a venue), only superusers can read/edit
try {
  const col = await pb.collections.getOne('submissions')
  await pb.collections.update(col.id, { listRule: null, viewRule: null, createRule: '', updateRule: null, deleteRule: null })
  console.log('✓ Submissions: public create, admin read')
} catch (e) {
  console.error('✗ submissions:', e.message)
}

console.log('\nDone.')
