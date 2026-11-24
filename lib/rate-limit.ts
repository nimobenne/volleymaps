const buckets = new Map<string, { count: number; windowStart: number; windowMs: number }>()
const SWEEP_THRESHOLD = 1000

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()

  if (buckets.size > SWEEP_THRESHOLD) {
    for (const [bucketKey, bucket] of buckets) {
      if (now - bucket.windowStart > bucket.windowMs) buckets.delete(bucketKey)
    }
  }

  const bucket = buckets.get(key)
  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now, windowMs })
    return false
  }

  bucket.count++
  return bucket.count > maxRequests
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || 'unknown'
}
