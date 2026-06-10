"use client";

// ============================================================
// Canopy — Main Application Page
// Thin orchestration component using extracted hooks/modules
// Routes between: Auth → Onboarding → Dashboard
// ============================================================

import { useState, useCallback, useEffect } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { MICRO_ACTIONS } from "@/lib/micro-actions-data";
import type { AuthUser, UserState } from "@/types";

/** View labels for screen reader announcements */
const VIEW_LABELS: Record<string, string> = {
  home: "Home dashboard",
  log: "Log activity",
  actions: "All micro-actions",
  profile: "Your profile",
  insights: "Your insights",
  tracker: "Carbon tracker",
};

export default function HomePage() {
  const { authUser, login, logout } = useAuth();
  const { userState, completeOnboarding, completeAction, restoreProgress, resetState } =
    useUserProgress(authUser);
  const [activeView, setActiveView] = useState("home");
  const { announce } = useAnnounce();

  // Restore progress when user logs in
  const handleAuthenticated = useCallback(
    (user: AuthUser) => {
      login(user);
      restoreProgress(user);
    },
    [login, restoreProgress]
  );

  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    resetState();
    announce("Logged out successfully");
  }, [logout, resetState, announce]);

  // Announce view changes for screen readers
  useEffect(() => {
    announce(`Navigated to ${VIEW_LABELS[activeView] || activeView}`);
  }, [activeView, announce]);

  // Handle micro-action completion with announcement
  const handleActionComplete = useCallback(
    (actionId: string) => {
      const action = completeAction(actionId);
      if (action) {
        announce(`Completed: ${action.title}. Saved ${action.co2SavingsKg} kg CO₂.`);
      }
    },
    [completeAction, announce]
  );

  // ─── Auth Screen ────────────────────────────────────────────
  if (!authUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  // ─── Onboarding ─────────────────────────────────────────────
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
        <OnboardingDeck onComplete={completeOnboarding} />
      </main>
    );
  }

  // ─── Dashboard ──────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-oat/30">
      <Navigation activeId={activeView} onNavigate={setActiveView} />

      <div className="flex-1 flex flex-col pb-20 md:pb-0 md:pl-16 lg:pl-56">
        <TopBar
          userName={authUser.name}
          userEmail={authUser.email}
          onLogout={handleLogout}
          onNavigate={setActiveView}
        />

        <main id="main-content" className="flex-1">
          <AnimatePresence mode="wait">
            {activeView === "home" && (
              <HomeView
                authUser={authUser}
                userState={userState}
                onActionComplete={handleActionComplete}
                onViewAll={() => setActiveView("actions")}
              />
            )}

            {activeView === "log" && (
              <PageSection viewKey="log" title="Log Activity">
                <LogActivityForm />
              </PageSection>
            )}

            {activeView === "actions" && (
              <PageSection
                viewKey="actions"
                title="All Micro-Actions"
                subtitle="Complete actions to reduce your footprint and grow your terrarium"
              >
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
                      completedToday={userState.completedActionIds.has(`action-${i}`)}
                      onComplete={handleActionComplete}
                    />
                  ))}
                </div>
              </PageSection>
            )}

            {activeView === "insights" && (
              <PageSection
                viewKey="insights"
                title="Insights"
                subtitle="Personalized analysis of your carbon reduction journey"
              >
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
              </PageSection>
            )}

            {activeView === "tracker" && (
              <PageSection
                viewKey="tracker"
                title="Carbon Tracker"
                subtitle="Understand your footprint breakdown and reduction progress"
              >
                <CarbonTracker
                  baselineFootprintKg={userState.baselineFootprintKg}
                  totalFootprintKg={userState.totalFootprintKg}
                  completedActionIds={userState.completedActionIds}
                />
              </PageSection>
            )}

            {activeView === "profile" && (
              <ProfileView
                authUser={authUser}
                userState={userState}
                onLogout={handleLogout}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

/** Reusable page section with fade animation and standard layout */
function PageSection({
  viewKey,
  title,
  subtitle,
  children,
}: {
  viewKey: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={viewKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto"
    >
      <h1 className="text-2xl font-bold text-navy mb-2">{title}</h1>
      {subtitle && <p className="text-sm text-navy/60 mb-6">{subtitle}</p>}
      {children}
    </motion.div>
  );
}

/** Home dashboard view with terrarium, stats, and daily actions */
function HomeView({
  authUser,
  userState,
  onActionComplete,
  onViewAll,
}: {
  authUser: AuthUser;
  userState: UserState;
  onActionComplete: (id: string) => void;
  onViewAll: () => void;
}) {
  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy">
          Welcome back, {authUser.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-navy/60 mt-1">
          Nurture your ecosystem by reducing emissions
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terrarium */}
        <section className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl border border-oat-dark p-4 shadow-sm">
            <Terrarium
              health={userState.terrariumHealth}
              streak={userState.currentStreak}
              className="w-full aspect-square max-w-[300px] mx-auto lg:max-w-none"
            />
            <div className="mt-3 text-center">
              <p className="text-xs font-medium text-navy/60" id="terrarium-health-label">
                Terrarium Health
              </p>
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
              <p className="text-xs text-sage-dark font-semibold mt-1">
                {userState.terrariumHealth}%
              </p>
            </div>
          </div>
        </section>

        {/* Stats + Actions */}
        <section className="lg:col-span-7 xl:col-span-8 space-y-6">
          <StatsSummary
            totalFootprintKg={userState.totalFootprintKg}
            baselineFootprintKg={userState.baselineFootprintKg}
            currentStreak={userState.currentStreak}
            streakShields={userState.streakShields}
            todayActionsCompleted={userState.todayActionsCompleted}
            weeklyTotal={userState.weeklyTotal}
          />

          <Insights
            totalFootprintKg={userState.totalFootprintKg}
            baselineFootprintKg={userState.baselineFootprintKg}
            currentStreak={userState.currentStreak}
            todayActionsCompleted={userState.todayActionsCompleted}
            completedActionIds={userState.completedActionIds}
            terrariumHealth={userState.terrariumHealth}
          />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-navy">Daily Actions</h2>
              <button
                onClick={onViewAll}
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
                    completedToday={userState.completedActionIds.has(`action-${i}`)}
                    onComplete={onActionComplete}
                  />
                ))}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

/** Profile view with user card and logout */
function ProfileView({
  authUser,
  userState,
  onLogout,
}: {
  authUser: AuthUser;
  userState: UserState;
  onLogout: () => void;
}) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto"
    >
      <h1 className="text-2xl font-bold text-navy mb-6">Profile</h1>

      <div className="bg-white rounded-2xl border border-oat-dark p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-oat-dark/50">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center text-white text-lg font-bold">
            {authUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
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
            <p className="text-lg font-bold text-sage-dark">{userState.longestStreak} days</p>
          </div>
          <div className="bg-oat/50 rounded-xl p-4">
            <p className="text-xs text-navy/50 mb-1">Streak Shields</p>
            <p className="text-lg font-bold text-navy">🛡️ {userState.streakShields}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full rounded-xl bg-terracotta/10 border border-terracotta/20 py-3 text-sm font-semibold text-terracotta hover:bg-terracotta/20 transition-colors"
      >
        Log Out
      </button>
    </motion.div>
  );
}
