import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash Redis credentials are present
const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Fallback in-memory store for development/testing when Redis is not yet configured
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();
const inMemoryNonces = new Set<string>();

/**
 * Sliding window rate limiter
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: true,
      prefix: "cursed_ratelimit",
    });
    const result = await ratelimit.limit(key);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // In-memory sliding window fallback
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, limit, remaining: limit - 1, reset: now + windowSeconds * 1000 };
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, limit, remaining: limit - entry.count, reset: entry.resetAt };
}

/**
 * Replay protection: Store nonce and verify it hasn't been used.
 * Returns true if nonce is valid and fresh, false if already seen (replay attack).
 */
export async function verifyAndStoreNonce(nonce: string, ttlSeconds = 120): Promise<boolean> {
  const nonceKey = `nonce:${nonce}`;

  if (redis) {
    // SETNX with TTL in Redis
    const set = await redis.set(nonceKey, "1", { nx: true, ex: ttlSeconds });
    return set === "OK";
  }

  // Fallback in-memory
  if (inMemoryNonces.has(nonceKey)) {
    return false;
  }

  inMemoryNonces.add(nonceKey);
  setTimeout(() => {
    inMemoryNonces.delete(nonceKey);
  }, ttlSeconds * 1000);

  return true;
}
