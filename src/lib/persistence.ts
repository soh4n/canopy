// ============================================================
// Canopy — User State Persistence
// Handles localStorage read/write for user progress data
// ============================================================

import type { UserState, SerializedUserState } from "@/types";

/** Get today's date as YYYY-MM-DD */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Storage key for user progress, scoped by user ID */
function getProgressKey(userId: string): string {
  return `canopy_progress_${userId}`;
}

/** Default initial state for a new user */
export const INITIAL_STATE: UserState = {
  onboardingComplete: false,
  totalFootprintKg: 0,
  baselineFootprintKg: 0,
  currentStreak: 0,
  longestStreak: 0,
  streakShields: 1,
  terrariumHealth: 50,
  todayActionsCompleted: 0,
  weeklyTotal: 0,
  completedActionIds: new Set(),
  lastActiveDate: getTodayDate(),
};

/** Load user state from localStorage for a given user */
export function loadUserState(userId: string): UserState | null {
  try {
    const raw = localStorage.getItem(getProgressKey(userId));
    if (!raw) return null;
    const parsed: SerializedUserState = JSON.parse(raw);
    const today = getTodayDate();

    // If the date has changed, reset daily actions
    const isNewDay = parsed.lastActiveDate !== today;

    return {
      onboardingComplete: parsed.onboardingComplete,
      totalFootprintKg: parsed.totalFootprintKg,
      baselineFootprintKg: parsed.baselineFootprintKg,
      currentStreak: parsed.currentStreak,
      longestStreak: parsed.longestStreak,
      streakShields: parsed.streakShields,
      terrariumHealth: parsed.terrariumHealth,
      todayActionsCompleted: isNewDay ? 0 : parsed.todayActionsCompleted,
      weeklyTotal: parsed.weeklyTotal,
      completedActionIds: isNewDay ? new Set() : new Set(parsed.completedActionIds),
      lastActiveDate: today,
    };
  } catch {
    return null;
  }
}

/** Save user state to localStorage for a given user */
export function saveUserState(userId: string, state: UserState): void {
  const serialized: SerializedUserState = {
    onboardingComplete: state.onboardingComplete,
    totalFootprintKg: state.totalFootprintKg,
    baselineFootprintKg: state.baselineFootprintKg,
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    streakShields: state.streakShields,
    terrariumHealth: state.terrariumHealth,
    todayActionsCompleted: state.todayActionsCompleted,
    weeklyTotal: state.weeklyTotal,
    completedActionIds: Array.from(state.completedActionIds),
    lastActiveDate: state.lastActiveDate,
  };
  localStorage.setItem(getProgressKey(userId), JSON.stringify(serialized));
}
