/**
 * A minimal in-memory rate limiter for the public ordering endpoints.
 *
 * Deliberately simple: it holds counters in the process, so it resets on
 * deploy and doesn't coordinate across serverless instances. That's enough to
 * blunt casual abuse of the public order endpoints for an MVP. Move to a
 * shared store (Redis / Upstash) before this carries real traffic.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Bounded so a flood of unique keys can't grow the map without limit.
const MAX_BUCKETS = 10_000;

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      // Array.from rather than iterating the Map directly: the project's
      // tsconfig targets ES5, where Map iteration needs downlevelIteration.
      for (const [bucketKey, bucket] of Array.from(buckets.entries())) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
      }
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP from the usual proxy headers. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
