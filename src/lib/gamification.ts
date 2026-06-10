// ============================================================
// Canopy — Gamification Logic
// Streak calculation, streak shields, and scoring
// ============================================================

/**
 * Get the UTC calendar day as a comparable number (days since epoch).
 */
function getUTCDay(date: Date): number {
  return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
}

/**
 * Check if two dates are consecutive calendar days (UTC).
 */
function isConsecutiveDay(date1: Date, date2: Date): boolean {
  return getUTCDay(date2) - getUTCDay(date1) === 1;
}

/**
 * Check if two dates are the same calendar day (UTC).
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return getUTCDay(date1) === getUTCDay(date2);
}

/**
 * Streak calculation result.
 */
export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  streakShields: number;
  shieldUsed: boolean;
  streakBroken: boolean;
}

/**
 * Calculate the user's streak status based on their last log time.
 *
 * Rules:
 * - If user logged today → streak continues (no change)
 * - If user logged yesterday → streak increments
 * - If user missed exactly 1 day AND has a shield → use shield, maintain streak
 * - If user missed >1 day OR no shield → streak resets to 0
 *
 * @param lastLoggedAt - The user's last activity log timestamp (null if never logged)
 * @param currentStreak - The user's current streak count
 * @param longestStreak - The user's all-time longest streak
 * @param streakShields - Number of shields available
 * @param now - Current timestamp (injectable for testing)
 */
export function calculateStreak(
  lastLoggedAt: Date | null,
  currentStreak: number,
  longestStreak: number,
  streakShields: number,
  now: Date = new Date()
): StreakResult {
  // First-ever log
  if (!lastLoggedAt) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      streakShields,
      shieldUsed: false,
      streakBroken: false,
    };
  }

  // Already logged today — no streak change
  if (isSameDay(lastLoggedAt, now)) {
    return {
      currentStreak,
      longestStreak,
      streakShields,
      shieldUsed: false,
      streakBroken: false,
    };
  }

  // Logged yesterday — streak increments
  if (isConsecutiveDay(lastLoggedAt, now)) {
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      streakShields,
      shieldUsed: false,
      streakBroken: false,
    };
  }

  // Calculate gap in days (UTC)
  const gapDays = getUTCDay(now) - getUTCDay(lastLoggedAt);

  // Missed exactly 1 day (gap of 2) — try to use shield
  if (gapDays === 2 && streakShields > 0) {
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      streakShields: streakShields - 1,
      shieldUsed: true,
      streakBroken: false,
    };
  }

  // Streak broken — reset
  return {
    currentStreak: 1,
    longestStreak,
    streakShields,
    shieldUsed: false,
    streakBroken: true,
  };
}

/**
 * Calculate points for completing a micro-action.
 * Bonus multiplier based on streak length.
 */
export function calculatePoints(
  basePoints: number,
  currentStreak: number
): number {
  // Streak multiplier: +10% per 7 consecutive days, capped at 2x
  const multiplier = Math.min(2.0, 1.0 + Math.floor(currentStreak / 7) * 0.1);
  return Math.round(basePoints * multiplier);
}
