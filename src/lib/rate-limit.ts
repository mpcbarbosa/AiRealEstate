// Simple in-memory rate limiter for ingest endpoint
const requests = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = requests.get(key)

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (entry.count >= maxRequests) {
    return false // blocked
  }

  entry.count++
  return true // allowed
}
