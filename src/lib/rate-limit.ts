// ============================================================
// Canopy — In-Memory Rate Limiter
// Token-bucket algorithm for API rate limiting
// Prevents brute force attacks on auth endpoints
// ============================================================

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const staleThreshold = now - 10 * 60 * 1000; // Remove entries older than 10min
  for (const [key, entry] of store.entries()) {
    if (entry.lastRefill < staleThreshold) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Maximum tokens in the bucket */
  maxTokens: number;
  /** Tokens refilled per interval */
  refillRate: number;
  /** Refill interval in milliseconds */
  refillInterval: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxTokens: 10,
  refillRate: 1,
  refillInterval: 1000, // 1 token per second
};

/**
 * Check if a request is allowed under the rate limit.
 * @returns `true` if allowed, `false` if rate-limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): boolean {
  cleanup();

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry) {
    // First request — initialize bucket with max-1 tokens (this request costs 1)
    store.set(identifier, { tokens: config.maxTokens - 1, lastRefill: now });
    return true;
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const tokensToAdd = Math.floor(elapsed / config.refillInterval) * config.refillRate;

  if (tokensToAdd > 0) {
    entry.tokens = Math.min(config.maxTokens, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  // Try to consume a token
  if (entry.tokens > 0) {
    entry.tokens -= 1;
    return true;
  }

  return false;
}

/** Rate limit config for auth endpoints (stricter: 5 attempts per 30s) */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxTokens: 5,
  refillRate: 1,
  refillInterval: 6000, // 1 token every 6 seconds
};

/** @internal Exposed for testing only */
export function _resetLastCleanup(time: number) {
  lastCleanup = time;
}
