// ============================================================
// Canopy — Shared Type Definitions
// Centralizes all application interfaces and type aliases
// ============================================================

/** Authenticated user returned from the auth API */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  onboardingComplete: boolean;
  token: string;
}

/** Serializable user state persisted to localStorage */
export interface SerializedUserState {
  onboardingComplete: boolean;
  totalFootprintKg: number;
  baselineFootprintKg: number;
  currentStreak: number;
  longestStreak: number;
  streakShields: number;
  terrariumHealth: number;
  todayActionsCompleted: number;
  weeklyTotal: number;
  completedActionIds: string[];
  lastActiveDate: string;
}

/** In-memory user state for the dashboard */
export interface UserState {
  onboardingComplete: boolean;
  totalFootprintKg: number;
  baselineFootprintKg: number;
  currentStreak: number;
  longestStreak: number;
  streakShields: number;
  terrariumHealth: number;
  todayActionsCompleted: number;
  weeklyTotal: number;
  completedActionIds: Set<string>;
  lastActiveDate: string;
}
