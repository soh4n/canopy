// ============================================================
// Canopy — Gamification Logic Unit Tests
// ============================================================

import { calculateStreak, calculatePoints } from "../src/lib/gamification";

describe("Gamification Logic", () => {
  describe("calculateStreak", () => {
    const now = new Date("2026-06-10T12:00:00Z");

    it("starts streak at 1 for first-ever log", () => {
      const result = calculateStreak(null, 0, 0, 1, now);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.shieldUsed).toBe(false);
      expect(result.streakBroken).toBe(false);
    });

    it("does not change streak if already logged today", () => {
      const lastLogged = new Date("2026-06-10T08:00:00Z"); // Same day
      const result = calculateStreak(lastLogged, 5, 10, 1, now);

      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(10);
      expect(result.shieldUsed).toBe(false);
    });

    it("increments streak for consecutive day logging", () => {
      const lastLogged = new Date("2026-06-09T20:00:00Z"); // Yesterday
      const result = calculateStreak(lastLogged, 5, 10, 1, now);

      expect(result.currentStreak).toBe(6);
      expect(result.longestStreak).toBe(10); // Existing longest is higher
      expect(result.shieldUsed).toBe(false);
    });

    it("updates longest streak when current exceeds it", () => {
      const lastLogged = new Date("2026-06-09T20:00:00Z");
      const result = calculateStreak(lastLogged, 10, 10, 1, now);

      expect(result.currentStreak).toBe(11);
      expect(result.longestStreak).toBe(11);
    });

    it("uses streak shield when missing exactly 1 day", () => {
      const lastLogged = new Date("2026-06-08T20:00:00Z"); // 2 days ago
      const result = calculateStreak(lastLogged, 7, 10, 2, now);

      expect(result.currentStreak).toBe(8);
      expect(result.streakShields).toBe(1); // Decremented from 2
      expect(result.shieldUsed).toBe(true);
      expect(result.streakBroken).toBe(false);
    });

    it("breaks streak when missing 1 day with no shield", () => {
      const lastLogged = new Date("2026-06-08T20:00:00Z"); // 2 days ago
      const result = calculateStreak(lastLogged, 7, 10, 0, now);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(10); // Preserved
      expect(result.streakShields).toBe(0);
      expect(result.shieldUsed).toBe(false);
      expect(result.streakBroken).toBe(true);
    });

    it("breaks streak when missing more than 1 day even with shields", () => {
      const lastLogged = new Date("2026-06-07T20:00:00Z"); // 3 days ago
      const result = calculateStreak(lastLogged, 7, 10, 3, now);

      expect(result.currentStreak).toBe(1);
      expect(result.streakBroken).toBe(true);
      expect(result.streakShields).toBe(3); // Shield NOT used for >1 day gap
    });

    it("handles timezone edge cases correctly", () => {
      // Late at night yesterday
      const lastLogged = new Date("2026-06-09T23:59:00Z");
      const result = calculateStreak(lastLogged, 3, 5, 1, now);

      expect(result.currentStreak).toBe(4);
      expect(result.streakBroken).toBe(false);
    });
  });

  describe("calculatePoints", () => {
    it("returns base points for streak < 7", () => {
      expect(calculatePoints(10, 0)).toBe(10);
      expect(calculatePoints(10, 6)).toBe(10);
    });

    it("adds 10% bonus per 7-day streak period", () => {
      expect(calculatePoints(10, 7)).toBe(11);  // 1.1x
      expect(calculatePoints(10, 14)).toBe(12); // 1.2x
      expect(calculatePoints(10, 21)).toBe(13); // 1.3x
    });

    it("caps multiplier at 2x", () => {
      expect(calculatePoints(10, 100)).toBe(20); // Max 2x
      expect(calculatePoints(10, 200)).toBe(20); // Still capped
    });

    it("rounds to nearest integer", () => {
      const result = calculatePoints(15, 7); // 15 * 1.1 = 16.5 → 17
      expect(Number.isInteger(result)).toBe(true);
    });

    it("handles zero base points", () => {
      expect(calculatePoints(0, 10)).toBe(0);
    });
  });
});
