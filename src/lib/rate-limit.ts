// Simple in-memory rate limiter for ingest endpoint
const requests = new Map<string, { count: number; resetAt: number }>()

// maxRequests por windowSeconds
export function rateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now()
  const entry = requests.get(key)

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return true // allowed
  }

  if (entry.count >= maxRequests) {
    return false // blocked
  }

  entry.count++
  return true // allowed
}
