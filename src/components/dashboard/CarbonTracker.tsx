"use client";

// ============================================================
// Canopy — Carbon Tracker Component
// Visual breakdown of carbon footprint by category with progress
// ============================================================

import { motion } from "framer-motion";

interface CarbonTrackerProps {
  baselineFootprintKg: number;
  totalFootprintKg: number;
  completedActionIds: Set<string>;
}

interface CategoryBreakdown {
  category: string;
  icon: string;
  baselineKg: number;
  currentKg: number;
  color: string;
}

export function CarbonTracker({
  baselineFootprintKg,
  totalFootprintKg,
  completedActionIds,
}: CarbonTrackerProps) {
  const totalCompleted = completedActionIds.size;

  // Simulated category breakdown based on typical ratios
  const categories: CategoryBreakdown[] = [
    {
      category: "Transport",
      icon: "🚗",
      baselineKg: Math.round(baselineFootprintKg * 0.27),
      currentKg: Math.round(totalFootprintKg * 0.27),
      color: "bg-terracotta",
    },
    {
      category: "Food",
      icon: "🍽️",
      baselineKg: Math.round(baselineFootprintKg * 0.26),
      currentKg: Math.round(totalFootprintKg * 0.26),
      color: "bg-sage",
    },
    {
      category: "Energy",
      icon: "⚡",
      baselineKg: Math.round(baselineFootprintKg * 0.28),
      currentKg: Math.round(totalFootprintKg * 0.28),
      color: "bg-navy",
    },
    {
      category: "Shopping",
      icon: "🛒",
      baselineKg: Math.round(baselineFootprintKg * 0.12),
      currentKg: Math.round(totalFootprintKg * 0.12),
      color: "bg-terracotta-light",
    },
    {
      category: "Waste",
      icon: "🗑️",
      baselineKg: Math.round(baselineFootprintKg * 0.07),
      currentKg: Math.round(totalFootprintKg * 0.07),
      color: "bg-sage-dark",
    },
  ];

  const totalReduction = baselineFootprintKg - totalFootprintKg;
  const reductionPercent = baselineFootprintKg > 0
    ? (totalReduction / baselineFootprintKg) * 100
    : 0;

  // Calculate equivalent metrics
  const treesEquivalent = Math.round(totalReduction / 22);
  const drivingMilesEquivalent = Math.round(totalReduction / 0.404);
  const flightHoursEquivalent = (totalReduction / 195).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Overall Progress Ring */}
      <div className="bg-white rounded-2xl border border-oat-dark p-6" role="region" aria-label="Carbon reduction progress">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Progress Ring */}
          <div className="relative w-32 h-32 flex-shrink-0" role="img" aria-label={`${reductionPercent.toFixed(0)} percent carbon reduction achieved`}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="currentColor"
                className="text-oat-dark"
                strokeWidth="8"
              />
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="currentColor"
                className="text-sage"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 42 * (1 - Math.min(reductionPercent, 100) / 100),
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-navy">{reductionPercent.toFixed(0)}%</span>
              <span className="text-[10px] text-navy/50">reduced</span>
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h3 className="text-lg font-bold text-navy">Carbon Reduction Progress</h3>
            <p className="text-sm text-navy/60">
              You&apos;ve saved <span className="font-semibold text-sage-dark">{totalReduction.toFixed(0)} kg CO₂</span> from your baseline of {baselineFootprintKg.toLocaleString()} kg/year.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-xs bg-sage/10 text-sage-dark rounded-full px-3 py-1 font-medium">
                🌳 {treesEquivalent} trees planted equivalent
              </span>
              <span className="text-xs bg-navy/5 text-navy rounded-full px-3 py-1 font-medium">
                🚗 {drivingMilesEquivalent.toLocaleString()} miles not driven
              </span>
              <span className="text-xs bg-terracotta/10 text-terracotta rounded-full px-3 py-1 font-medium">
                ✈️ {flightHoursEquivalent}h of flight offset
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl border border-oat-dark p-6" role="region" aria-label="Emissions breakdown by category">
        <h3 className="text-sm font-semibold text-navy mb-4">Breakdown by Category</h3>
        <div className="space-y-4" role="list">
          {categories.map((cat, i) => {
            const reduction = cat.baselineKg - cat.currentKg;
            const percent = cat.baselineKg > 0 ? (reduction / cat.baselineKg) * 100 : 0;
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                role="listitem"
                aria-label={`${cat.category}: ${cat.currentKg} of ${cat.baselineKg} kg, ${percent.toFixed(0)}% reduced`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{cat.icon}</span>
                    <span className="text-sm font-medium text-navy">{cat.category}</span>
                  </div>
                  <span className="text-xs text-navy/60">
                    {cat.currentKg.toLocaleString()} / {cat.baselineKg.toLocaleString()} kg
                  </span>
                </div>
                <div className="h-2 bg-oat rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${cat.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, 100 - percent)}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  />
                </div>
                {percent > 0 && (
                  <p className="text-[10px] text-sage-dark mt-0.5">
                    ↓ {percent.toFixed(0)}% reduction ({reduction} kg saved)
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Actions completed summary */}
      <div className="bg-white rounded-2xl border border-oat-dark p-6">
        <h3 className="text-sm font-semibold text-navy mb-3">Impact Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-sage-dark">{totalCompleted}</p>
            <p className="text-[10px] text-navy/50 mt-0.5">Actions Done</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-navy">{totalReduction.toFixed(0)}</p>
            <p className="text-[10px] text-navy/50 mt-0.5">kg CO₂ Saved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-terracotta">{treesEquivalent}</p>
            <p className="text-[10px] text-navy/50 mt-0.5">Trees Equivalent</p>
          </div>
        </div>
      </div>
    </div>
  );
}
