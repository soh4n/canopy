// ============================================================
// Canopy — User Progress Hook
// Manages user state, persistence, daily resets, and actions
// ============================================================

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { AuthUser, UserState } from "@/types";
import {
  INITIAL_STATE,
  getTodayDate,
  loadUserState,
  saveUserState,
} from "@/lib/persistence";
import { EMISSION_FACTORS } from "@/lib/carbon-engine";
import { MICRO_ACTIONS } from "@/lib/micro-actions-data";

/**
 * Baseline calculation factors based on onboarding answers.
 * Each entry: [emission factor per unit, units per day/trip, days/trips per year]
 */
const BASELINE_FACTORS: Record<string, [number, number, number]> = {
  drives_gas_car: [EMISSION_FACTORS.transport.gas_car, 30, 250],
  takes_public_transit: [EMISSION_FACTORS.transport.bus, 15, 250],
  flies_frequently: [EMISSION_FACTORS.transport.airplane_long, 2000, 4],
  eats_meat_daily: [EMISSION_FACTORS.food.beef_meal, 1, 365],
  eats_dairy_daily: [EMISSION_FACTORS.food.dairy, 1, 365],
  uses_natural_gas: [EMISSION_FACTORS.energy.natural_gas_therm, 1, 500],
  shops_fast_fashion: [EMISSION_FACTORS.shopping.clothing_item, 1, 52],
  buys_electronics_often: [EMISSION_FACTORS.shopping.electronics_small, 1, 6],
};

export function useUserProgress(authUser: AuthUser | null) {
  const [userState, setUserState] = useState<UserState>(() => {
    if (typeof window === "undefined") return INITIAL_STATE;

    const storedUser = localStorage.getItem("canopy_user");
    if (!storedUser) return INITIAL_STATE;

    try {
      const user = JSON.parse(storedUser);
      if (!user.id) return INITIAL_STATE;
      const loaded = loadUserState(user.id);
      if (loaded) return loaded;
      if (user.onboardingComplete) {
        return { ...INITIAL_STATE, onboardingComplete: true };
      }
    } catch {
      /* use default */
    }
    return INITIAL_STATE;
  });

  const hasInitialized = useRef(false);

  // Persist state on changes (skip first render for new users)
  useEffect(() => {
    if (!authUser?.id) return;
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    saveUserState(authUser.id, userState);
  }, [userState, authUser?.id]);

  const persistState = useCallback(
    (state: UserState) => {
      if (authUser) {
        saveUserState(authUser.id, state);
        hasInitialized.current = true;
      }
    },
    [authUser]
  );

  // Check for date change (tab visibility + interval)
  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayDate();
      setUserState((prev) => {
        if (prev.lastActiveDate !== today) {
          const updated = {
            ...prev,
            todayActionsCompleted: 0,
            completedActionIds: new Set<string>(),
            lastActiveDate: today,
          };
          if (authUser?.id) saveUserState(authUser.id, updated);
          return updated;
        }
        return prev;
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkDateChange();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(checkDateChange, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [authUser?.id]);

  // Restore progress when user logs in
  const restoreProgress = useCallback((user: AuthUser) => {
    const loaded = loadUserState(user.id);
    if (loaded) {
      setUserState(loaded);
      hasInitialized.current = true;
    } else if (user.onboardingComplete) {
      setUserState((prev) => ({ ...prev, onboardingComplete: true }));
    }
  }, []);

  // Handle onboarding completion
  const completeOnboarding = useCallback(
    (answers: Record<string, boolean>) => {
      let baseline = 0;

      for (const [key, [factor, units, frequency]] of Object.entries(BASELINE_FACTORS)) {
        if (answers[key]) baseline += factor * units * frequency;
      }

      // Home energy: large home vs average
      if (answers["lives_in_large_home"]) baseline += EMISSION_FACTORS.energy.electricity_kwh * 10000;
      else baseline += EMISSION_FACTORS.energy.electricity_kwh * 5000;

      baseline = Math.round(baseline);

      const newState: UserState = {
        ...INITIAL_STATE,
        onboardingComplete: true,
        baselineFootprintKg: baseline,
        totalFootprintKg: baseline,
        terrariumHealth: 50,
        currentStreak: 1,
        lastActiveDate: getTodayDate(),
      };

      setUserState(newState);
      persistState(newState);

      // Mark onboardingComplete in stored user record
      if (authUser) {
        localStorage.setItem(
          "canopy_user",
          JSON.stringify({
            id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            onboardingComplete: true,
          })
        );
      }
    },
    [authUser, persistState]
  );

  // Handle micro-action completion
  const completeAction = useCallback((actionId: string) => {
    const action = MICRO_ACTIONS.find((_, i) => `action-${i}` === actionId);
    if (!action) return null;

    setUserState((prev) => {
      const newCompleted = new Set(prev.completedActionIds);
      newCompleted.add(actionId);

      return {
        ...prev,
        completedActionIds: newCompleted,
        totalFootprintKg: Math.max(0, prev.totalFootprintKg - action.co2SavingsKg),
        todayActionsCompleted: prev.todayActionsCompleted + 1,
        terrariumHealth: Math.min(100, prev.terrariumHealth + 5),
      };
    });

    return action;
  }, []);

  // Reset state on logout
  const resetState = useCallback(() => {
    setUserState(INITIAL_STATE);
    hasInitialized.current = false;
  }, []);

  return {
    userState,
    completeOnboarding,
    completeAction,
    restoreProgress,
    resetState,
  };
}
