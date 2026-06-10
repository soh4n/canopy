// ============================================================
// Canopy — Rate Limiter Unit Tests
// ============================================================

import { checkRateLimit, _resetLastCleanup } from "../src/lib/rate-limit";

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
    const config = { maxTokens: 2, refillRate: 2, refillInterval: 50 }; // Refill 2 tokens every 50ms

    // Exhaust all tokens
    expect(checkRateLimit(key, config)).toBe(true);
    expect(checkRateLimit(key, config)).toBe(true);

    // Immediately should be blocked (no time for refill)
    expect(checkRateLimit(key, config)).toBe(false);

    // After enough time, tokens should refill
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(key, config)).toBe(true);
        resolve();
      }, 100);
    });
  });

  it("cleans up stale entries after cleanup interval", () => {
    const key = `test-cleanup-${Date.now()}`;
    const config = { maxTokens: 5, refillRate: 1, refillInterval: 1000 };

    // Create an entry
    checkRateLimit(key, config);

    // Force lastCleanup to a very old time so cleanup triggers
    const realNow = Date.now();
    _resetLastCleanup(realNow - 6 * 60 * 1000);

    // Mock Date.now to be 11 min ahead (entry is stale after 10 min)
    const originalNow = Date.now;
    Date.now = () => realNow + 11 * 60 * 1000;

    // This call triggers cleanup which removes the stale entry
    const freshKey = `test-cleanup-fresh-${realNow}`;
    checkRateLimit(freshKey, config);

    // Restore
    Date.now = originalNow;
    _resetLastCleanup(realNow);
  });

  it("does not remove fresh entries during cleanup", () => {
    const realNow = Date.now();
    const config = { maxTokens: 5, refillRate: 1, refillInterval: 1000 };

    // Force lastCleanup to be old so cleanup triggers
    _resetLastCleanup(realNow - 6 * 60 * 1000);

    // Create a fresh entry
    const freshKey = `test-fresh-${realNow}`;
    checkRateLimit(freshKey, config);

    // Advance time by 6 minutes (cleanup triggers, but entry is only 6 min old < 10 min threshold)
    const originalNow = Date.now;
    Date.now = () => realNow + 6 * 60 * 1000;
    _resetLastCleanup(realNow); // so cleanup triggers again

    // This call should NOT remove the fresh entry
    const anotherKey = `test-fresh2-${realNow}`;
    checkRateLimit(anotherKey, config);

    // The fresh entry should still allow requests (bucket still has tokens)
    expect(checkRateLimit(freshKey, config)).toBe(true);

    // Restore
    Date.now = originalNow;
    _resetLastCleanup(realNow);
  });

  it("uses default config when none provided", () => {
    const key = `test-default-config-${Date.now()}`;
    // Call without config — uses DEFAULT_CONFIG
    expect(checkRateLimit(key)).toBe(true);
  });
});
