"use client";

// ============================================================
// Canopy — Main Application Page
// Handles routing between onboarding and dashboard views
// Responsive layout: mobile → tablet → desktop
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigation } from "@/components/layout/Navigation";
import { TopBar } from "@/components/layout/TopBar";
import { OnboardingDeck } from "@/components/onboarding/OnboardingDeck";
import { Terrarium } from "@/components/dashboard/Terrarium";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { StatsSummary } from "@/components/dashboard/StatsSummary";
import { Insights } from "@/components/dashboard/Insights";
import { CarbonTracker } from "@/components/dashboard/CarbonTracker";
import { LogActivityForm } from "@/components/dashboard/LogActivityForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { useAnnounce } from "@/components/a11y/LiveAnnouncer";
import { MICRO_ACTIONS } from "@/lib/micro-actions-data";

// Auth user type
interface AuthUser {
  id: string;
  email: string;
  name: string;
  onboardingComplete: boolean;
  token: string;
}

// Serializable user state for localStorage
interface SerializedUserState {
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
  lastActiveDate: string; // ISO date string (YYYY-MM-DD)
}

// User state for dashboard
interface UserState {
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

/** Get today's date as YYYY-MM-DD */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Storage key for user progress, scoped by user ID */
function getProgressKey(userId: string): string {
  return `canopy_progress_${userId}`;
}

/** Load user state from localStorage for a given user */
function loadUserState(userId: string): UserState | null {
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
function saveUserState(userId: string, state: UserState): void {
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

const INITIAL_STATE: UserState = {
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

export default function HomePage() {
  // Lazy initialization: restore session from localStorage or OAuth cookies
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;

    // Check for OAuth callback cookies first
    const oauthUser = document.cookie.match(/canopy_oauth_user=([^;]+)/);
    const oauthToken = document.cookie.match(/canopy_oauth_token=([^;]+)/);
    if (oauthUser && oauthToken) {
      try {
        const user = JSON.parse(decodeURIComponent(oauthUser[1]));
        const token = decodeURIComponent(oauthToken[1]);
        localStorage.setItem("canopy_user", JSON.stringify(user));
        localStorage.setItem("canopy_token", token);
        document.cookie = "canopy_oauth_user=; max-age=0; path=/";
        document.cookie = "canopy_oauth_token=; max-age=0; path=/";
        return { ...user, token };
      } catch { /* fall through */ }
    }

    const storedUser = localStorage.getItem("canopy_user");
    const storedToken = localStorage.getItem("canopy_token");
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        if (!user.id || !user.email) {
          throw new Error("Invalid stored session");
        }
        return { ...user, token: storedToken };
      } catch {
        localStorage.removeItem("canopy_user");
        localStorage.removeItem("canopy_token");
      }
    }
    return null;
  });

  // Load user state from persisted progress (scoped by user ID)
  const [userState, setUserState] = useState<UserState>(() => {
    if (typeof window === "undefined") return INITIAL_STATE;

    const storedUser = localStorage.getItem("canopy_user");
    if (!storedUser) return INITIAL_STATE;

    try {
      const user = JSON.parse(storedUser);
      if (!user.id) return INITIAL_STATE;
      const loaded = loadUserState(user.id);
      if (loaded) return loaded;
      // Fallback: if user has onboardingComplete in their auth record
      if (user.onboardingComplete) {
        return { ...INITIAL_STATE, onboardingComplete: true };
      }
    } catch { /* use default */ }
    return INITIAL_STATE;
  });

  const [activeView, setActiveView] = useState("home");
  const { announce } = useAnnounce();

  // Ref to track if we should persist (avoid saving INITIAL_STATE on first render for new users)
  const hasInitialized = useRef(false);

  // Persist userState to localStorage whenever it changes
  useEffect(() => {
    if (!authUser?.id) return;
    // Skip persisting the very first render if user hasn't completed onboarding yet
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    saveUserState(authUser.id, userState);
  }, [userState, authUser?.id]);

  // Also persist immediately when onboarding completes or actions are completed
  // (this ensures the initial onboarding save is captured)
  const persistState = useCallback(
    (state: UserState) => {
      if (authUser) {
        saveUserState(authUser.id, state);
        hasInitialized.current = true;
      }
    },
    [authUser]
  );

  // Check for date change while app is open (e.g. user leaves tab open overnight)
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

    // Check on visibility change (tab comes back to focus)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkDateChange();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Also check every minute
    const interval = setInterval(checkDateChange, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [authUser?.id]);

  // Restore persisted progress when user logs in
  const handleAuthenticated = useCallback((user: AuthUser) => {
    setAuthUser(user);
    // Load persisted progress for this user
    const loaded = loadUserState(user.id);
    if (loaded) {
      setUserState(loaded);
      hasInitialized.current = true;
    } else if (user.onboardingComplete) {
      setUserState((prev) => ({ ...prev, onboardingComplete: true }));
    }
  }, []);

  // Handle logout — keep progress, just clear auth session
  const handleLogout = useCallback(() => {
    localStorage.removeItem("canopy_user");
    localStorage.removeItem("canopy_token");
    setAuthUser(null);
    setUserState(INITIAL_STATE);
    hasInitialized.current = false;
    announce("Logged out successfully");
  }, [announce]);

  // Announce view changes for screen readers
  useEffect(() => {
    const viewLabels: Record<string, string> = {
      home: "Home dashboard",
      log: "Log activity",
      actions: "All micro-actions",
      profile: "Your profile",
      insights: "Your insights",
      tracker: "Carbon tracker",
    };
    announce(`Navigated to ${viewLabels[activeView] || activeView}`);
  }, [activeView, announce]);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(
    async (answers: Record<string, boolean>) => {
      let baseline = 0;
      if (answers["drives_gas_car"]) baseline += 0.404 * 30 * 250;
      if (answers["takes_public_transit"]) baseline += 0.089 * 15 * 250;
      if (answers["flies_frequently"]) baseline += 0.195 * 2000 * 4;
      if (answers["eats_meat_daily"]) baseline += 6.61 * 365;
      if (answers["eats_dairy_daily"]) baseline += 1.39 * 365;
      if (answers["lives_in_large_home"]) baseline += 0.417 * 10000;
      else baseline += 0.417 * 5000;
      if (answers["uses_natural_gas"]) baseline += 5.3 * 500;
      if (answers["shops_fast_fashion"]) baseline += 10.0 * 52;
      if (answers["buys_electronics_often"]) baseline += 25.0 * 6;

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

      // Mark onboardingComplete in stored user record so it's retained
      if (authUser) {
        const updatedUser = { ...authUser, onboardingComplete: true };
        localStorage.setItem("canopy_user", JSON.stringify({
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          onboardingComplete: true,
        }));
      }
    },
    [authUser, persistState]
  );

  // Handle micro-action completion
  const handleActionComplete = useCallback((actionId: string) => {
    const action = MICRO_ACTIONS.find((_, i) => `action-${i}` === actionId);
    if (!action) return;

    announce(`Completed: ${action.title}. Saved ${action.co2SavingsKg} kg CO₂.`);

    setUserState((prev) => {
      const newCompleted = new Set(prev.completedActionIds);
      newCompleted.add(actionId);

      const newFootprint = Math.max(0, prev.totalFootprintKg - action.co2SavingsKg);
      const newActionsToday = prev.todayActionsCompleted + 1;
      const newHealth = Math.min(100, prev.terrariumHealth + 5);

      return {
        ...prev,
        completedActionIds: newCompleted,
        totalFootprintKg: newFootprint,
        todayActionsCompleted: newActionsToday,
        terrariumHealth: newHealth,
      };
    });
  }, [announce]);

  // Auth screen — show before anything else
  if (!authUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  // Onboarding view
  if (!userState.onboardingComplete) {
    return (
      <main
        id="main-content"
        className="flex flex-col items-center justify-center min-h-screen px-4 py-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-2">
            🌱 Welcome to Canopy
          </h1>
          <p className="text-sm sm:text-base text-navy/60 max-w-md mx-auto">
            Let&apos;s understand your current carbon footprint. Swipe right for
            &quot;Yes&quot; and left for &quot;No&quot;.
          </p>
        </motion.div>
        <OnboardingDeck onComplete={handleOnboardingComplete} />
      </main>
    );
  }

  // Dashboard view
  return (
    <div className="flex min-h-screen bg-oat/30">
      <Navigation activeId={activeView} onNavigate={setActiveView} />

      {/* Main content area — offset for navigation */}
      <div className="flex-1 flex flex-col pb-20 md:pb-0 md:pl-16 lg:pl-56">
        {/* Top Bar with profile + logout */}
        <TopBar
          userName={authUser.name}
          userEmail={authUser.email}
          onLogout={handleLogout}
          onNavigate={setActiveView}
        />

        <main id="main-content" className="flex-1">
          <AnimatePresence mode="wait">
            {activeView === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"
              >
                {/* Welcome Header */}
                <header className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-navy">
                    Welcome back, {authUser.name.split(" ")[0]} 👋
                  </h1>
                  <p className="text-sm text-navy/60 mt-1">
                    Nurture your ecosystem by reducing emissions
                  </p>
                </header>

                {/* Responsive Grid: Terrarium + Stats + Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Terrarium (full width mobile, left column desktop) */}
                  <section className="lg:col-span-5 xl:col-span-4">
                    <div className="bg-white rounded-2xl border border-oat-dark p-4 shadow-sm">
                      <Terrarium
                        health={userState.terrariumHealth}
                        streak={userState.currentStreak}
                        className="w-full aspect-square max-w-[300px] mx-auto lg:max-w-none"
                      />
                      <div className="mt-3 text-center">
                        <p className="text-xs font-medium text-navy/60" id="terrarium-health-label">Terrarium Health</p>
                        <div
                          className="mt-1 h-2 bg-oat rounded-full overflow-hidden max-w-[200px] mx-auto"
                          role="progressbar"
                          aria-valuenow={userState.terrariumHealth}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-labelledby="terrarium-health-label"
                        >
                          <motion.div
                            className="h-full bg-gradient-to-r from-sage to-sage-dark rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${userState.terrariumHealth}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                        <p className="text-xs text-sage-dark font-semibold mt-1">{userState.terrariumHealth}%</p>
                      </div>
                    </div>
                  </section>

                  {/* Stats + Actions (full width mobile, right column desktop) */}
                  <section className="lg:col-span-7 xl:col-span-8 space-y-6">
                    {/* Stats */}
                    <StatsSummary
                      totalFootprintKg={userState.totalFootprintKg}
                      baselineFootprintKg={userState.baselineFootprintKg}
                      currentStreak={userState.currentStreak}
                      streakShields={userState.streakShields}
                      todayActionsCompleted={userState.todayActionsCompleted}
                      weeklyTotal={userState.weeklyTotal}
                    />

                    {/* Quick Insights */}
                    <Insights
                      totalFootprintKg={userState.totalFootprintKg}
                      baselineFootprintKg={userState.baselineFootprintKg}
                      currentStreak={userState.currentStreak}
                      todayActionsCompleted={userState.todayActionsCompleted}
                      completedActionIds={userState.completedActionIds}
                      terrariumHealth={userState.terrariumHealth}
                    />

                    {/* Daily Action Cards */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-navy">
                          Daily Actions
                        </h2>
                        <button
                          onClick={() => setActiveView("actions")}
                          className="text-xs font-medium text-sage-dark hover:text-sage transition-colors"
                        >
                          View all →
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {MICRO_ACTIONS.filter((a) => a.isDaily)
                          .slice(0, 4)
                          .map((action, i) => (
                            <ActionCard
                              key={`action-${i}`}
                              id={`action-${i}`}
                              title={action.title}
                              description={action.description}
                              iconEmoji={action.iconEmoji}
                              co2SavingsKg={action.co2SavingsKg}
                              difficulty={action.difficulty}
                              completedToday={userState.completedActionIds.has(
                                `action-${i}`
                              )}
                              onComplete={handleActionComplete}
                            />
                          ))}
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}

            {activeView === "log" && (
              <motion.div
                key="log"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto"
              >
                <h1 className="text-2xl font-bold text-navy mb-6">
                  Log Activity
                </h1>
                <LogActivityForm />
              </motion.div>
            )}

            {activeView === "actions" && (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto"
              >
                <h1 className="text-2xl font-bold text-navy mb-2">
                  All Micro-Actions
                </h1>
                <p className="text-sm text-navy/60 mb-6">
                  Complete actions to reduce your footprint and grow your terrarium
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MICRO_ACTIONS.map((action, i) => (
                    <ActionCard
                      key={`action-${i}`}
                      id={`action-${i}`}
                      title={action.title}
                      description={action.description}
                      iconEmoji={action.iconEmoji}
                      co2SavingsKg={action.co2SavingsKg}
                      difficulty={action.difficulty}
                      completedToday={userState.completedActionIds.has(
                        `action-${i}`
                      )}
                      onComplete={handleActionComplete}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {activeView === "insights" && (
              <motion.div
                key="insights"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto"
              >
                <h1 className="text-2xl font-bold text-navy mb-2">Insights</h1>
                <p className="text-sm text-navy/60 mb-6">
                  Personalized analysis of your carbon reduction journey
                </p>
                <Insights
                  totalFootprintKg={userState.totalFootprintKg}
                  baselineFootprintKg={userState.baselineFootprintKg}
                  currentStreak={userState.currentStreak}
                  todayActionsCompleted={userState.todayActionsCompleted}
                  completedActionIds={userState.completedActionIds}
                  terrariumHealth={userState.terrariumHealth}
                />
                <div className="mt-8">
                  <CarbonTracker
                    baselineFootprintKg={userState.baselineFootprintKg}
                    totalFootprintKg={userState.totalFootprintKg}
                    completedActionIds={userState.completedActionIds}
                  />
                </div>
              </motion.div>
            )}

            {activeView === "tracker" && (
              <motion.div
                key="tracker"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto"
              >
                <h1 className="text-2xl font-bold text-navy mb-2">
                  Carbon Tracker
                </h1>
                <p className="text-sm text-navy/60 mb-6">
                  Understand your footprint breakdown and reduction progress
                </p>
                <CarbonTracker
                  baselineFootprintKg={userState.baselineFootprintKg}
                  totalFootprintKg={userState.totalFootprintKg}
                  completedActionIds={userState.completedActionIds}
                />
              </motion.div>
            )}

            {activeView === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto"
              >
                <h1 className="text-2xl font-bold text-navy mb-6">Profile</h1>

                {/* User card */}
                <div className="bg-white rounded-2xl border border-oat-dark p-6 mb-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-oat-dark/50">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center text-white text-lg font-bold">
                      {authUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{authUser.name}</p>
                      <p className="text-sm text-navy/50">{authUser.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-oat/50 rounded-xl p-4">
                      <p className="text-xs text-navy/50 mb-1">Annual Baseline</p>
                      <p className="text-lg font-bold text-navy">
                        {userState.baselineFootprintKg.toLocaleString()} kg
                      </p>
                    </div>
                    <div className="bg-oat/50 rounded-xl p-4">
                      <p className="text-xs text-navy/50 mb-1">Current Total</p>
                      <p className="text-lg font-bold text-terracotta">
                        {userState.totalFootprintKg.toLocaleString()} kg
                      </p>
                    </div>
                    <div className="bg-oat/50 rounded-xl p-4">
                      <p className="text-xs text-navy/50 mb-1">Longest Streak</p>
                      <p className="text-lg font-bold text-sage-dark">
                        {userState.longestStreak} days
                      </p>
                    </div>
                    <div className="bg-oat/50 rounded-xl p-4">
                      <p className="text-xs text-navy/50 mb-1">Streak Shields</p>
                      <p className="text-lg font-bold text-navy">
                        🛡️ {userState.streakShields}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full rounded-xl bg-terracotta/10 border border-terracotta/20 py-3 text-sm font-semibold text-terracotta hover:bg-terracotta/20 transition-colors"
                >
                  Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
