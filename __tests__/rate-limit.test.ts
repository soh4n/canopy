// ============================================================
// Canopy — Rate Limiter Unit Tests
// ============================================================

import { checkRateLimit } from "../src/lib/rate-limit";

describe("Rate Limiter", () => {
  it("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    expect(checkRateLimit(key, { maxTokens: 5, refillRate: 1, refillInterval: 1000 })).toBe(true);
    expect(checkRateLimit(key, { maxTokens: 5, refillRate: 1, refillInterval: 1000 })).toBe(true);
    expect(checkRateLimit(key, { maxTokens: 5, refillRate: 1, refillInterval: 1000 })).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const key = `test-block-${Date.now()}`;
    const config = { maxTokens: 2, refillRate: 1, refillInterval: 60000 };

    // First 2 should pass (initial bucket has maxTokens)
    expect(checkRateLimit(key, config)).toBe(true);
    expect(checkRateLimit(key, config)).toBe(true);

    // Third should be blocked
    expect(checkRateLimit(key, config)).toBe(false);
  });

  it("uses separate buckets per identifier", () => {
    const config = { maxTokens: 1, refillRate: 1, refillInterval: 60000 };
    const key1 = `test-sep1-${Date.now()}`;
    const key2 = `test-sep2-${Date.now()}`;

    expect(checkRateLimit(key1, config)).toBe(true);
    expect(checkRateLimit(key2, config)).toBe(true);

    // Both are now at 0 tokens
    expect(checkRateLimit(key1, config)).toBe(false);
    expect(checkRateLimit(key2, config)).toBe(false);
  });

  it("refills tokens over time", () => {
    const key = `test-refill-${Date.now()}`;
    const config = { maxTokens: 2, refillRate: 2, refillInterval: 1 }; // Refill 2 tokens every 1ms

    // Exhaust all tokens
    expect(checkRateLimit(key, config)).toBe(true);
    expect(checkRateLimit(key, config)).toBe(true);
    expect(checkRateLimit(key, config)).toBe(false);

    // After a short wait, tokens should refill (1ms interval)
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(key, config)).toBe(true);
        resolve();
      }, 20);
    });
  });
});
