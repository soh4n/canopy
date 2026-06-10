"use client";

// ============================================================
// Canopy — Stats Summary Component
// Displays key metrics in a responsive grid
// ============================================================

import { motion } from "framer-motion";

interface StatsProps {
  totalFootprintKg: number;
  baselineFootprintKg: number;
  currentStreak: number;
  streakShields: number;
  todayActionsCompleted: number;
  weeklyTotal: number;
}

export function StatsSummary({
  totalFootprintKg,
  baselineFootprintKg,
  currentStreak,
  streakShields,
  todayActionsCompleted,
  weeklyTotal,
}: StatsProps) {
  const reduction = baselineFootprintKg - totalFootprintKg;
  const reductionPercent =
    baselineFootprintKg > 0
      ? Math.round((reduction / baselineFootprintKg) * 100)
      : 0;

  const stats = [
    {
      label: "Weekly Emissions",
      value: `${weeklyTotal.toFixed(1)} kg`,
      icon: "📊",
      color: "text-terracotta",
    },
    {
      label: "Streak",
      value: `${currentStreak} days`,
      icon: "🔥",
      color: "text-terracotta",
      subtitle: streakShields > 0 ? `🛡️ ${streakShields} shield${streakShields > 1 ? "s" : ""}` : undefined,
    },
    {
      label: "CO₂ Reduced",
      value: reduction > 0 ? `${reduction.toFixed(0)} kg` : "—",
      icon: "📉",
      color: "text-sage-dark",
      subtitle: reductionPercent > 0 ? `${reductionPercent}% from baseline` : undefined,
    },
    {
      label: "Today's Actions",
      value: `${todayActionsCompleted}`,
      icon: "✅",
      color: "text-sage",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      role="region"
      aria-label="Your carbon footprint statistics"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="rounded-xl bg-white border border-oat-dark p-3 sm:p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span role="img" aria-hidden="true">{stat.icon}</span>
            <span className="text-xs text-navy/60 font-medium">
              {stat.label}
            </span>
          </div>
          <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>
            {stat.value}
          </p>
          {stat.subtitle && (
            <p className="text-[10px] text-navy/50 mt-0.5">{stat.subtitle}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
