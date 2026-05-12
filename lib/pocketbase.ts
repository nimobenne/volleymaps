import PocketBase from 'pocketbase'

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL ?? 'http://localhost:8090')

// Disable auto-cancellation for server-side usage
pb.autoCancellation(false)
