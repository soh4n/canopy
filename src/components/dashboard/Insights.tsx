"use client";

// ============================================================
// Canopy — Insights Dashboard
// AI-driven insights based on user activity patterns
// ============================================================

import { motion } from "framer-motion";
import { useMemo } from "react";

interface InsightsProps {
  totalFootprintKg: number;
  baselineFootprintKg: number;
  currentStreak: number;
  todayActionsCompleted: number;
  completedActionIds: Set<string>;
  terrariumHealth: number;
}

interface Insight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: "success" | "tip" | "warning" | "milestone";
  metric?: string;
}

export function Insights({
  totalFootprintKg,
  baselineFootprintKg,
  currentStreak,
  todayActionsCompleted,
  completedActionIds,
  terrariumHealth,
}: InsightsProps) {
  const insights = useMemo(() => {
    const list: Insight[] = [];
    const totalCompleted = completedActionIds.size;
    const reduction = baselineFootprintKg - totalFootprintKg;
    const reductionPercent = baselineFootprintKg > 0
      ? Math.round((reduction / baselineFootprintKg) * 100)
      : 0;

    // Streak insights
    if (currentStreak >= 7) {
      list.push({
        id: "streak-week",
        icon: "🔥",
        title: "Week-long streak!",
        description: `You've maintained a ${currentStreak}-day streak. Consistency is the #1 predictor of lasting habit change.`,
        type: "milestone",
        metric: `${currentStreak} days`,
      });
    } else if (currentStreak >= 3) {
      list.push({
        id: "streak-building",
        icon: "📈",
        title: "Streak building momentum",
        description: "You're on a roll! Research shows it takes 21 days to form a habit. Keep going!",
        type: "success",
        metric: `${currentStreak} days`,
      });
    } else {
      list.push({
        id: "streak-start",
        icon: "💡",
        title: "Start your streak today",
        description: "Complete at least one action daily to build your streak. Even small actions compound over time.",
        type: "tip",
      });
    }

    // Reduction insights
    if (reductionPercent >= 20) {
      list.push({
        id: "reduction-great",
        icon: "🌍",
        title: "Significant impact!",
        description: `You've reduced your footprint by ${reductionPercent}%. That's equivalent to planting ${Math.round(reduction / 22)} trees per year.`,
        type: "milestone",
        metric: `${reduction.toFixed(0)} kg CO₂ saved`,
      });
    } else if (reductionPercent > 0) {
      list.push({
        id: "reduction-progress",
        icon: "🌱",
        title: "Making progress",
        description: `You've cut ${reductionPercent}% of your baseline emissions. Every kilogram counts toward a healthier planet.`,
        type: "success",
        metric: `${reduction.toFixed(0)} kg saved`,
      });
    }

    // Activity-based insights
    if (todayActionsCompleted >= 3) {
      list.push({
        id: "active-day",
        icon: "⭐",
        title: "Super active today!",
        description: `You've completed ${todayActionsCompleted} actions today. Your terrarium is thriving from the attention.`,
        type: "success",
      });
    } else if (todayActionsCompleted === 0) {
      list.push({
        id: "no-actions",
        icon: "🎯",
        title: "Today's opportunity",
        description: "You haven't logged any actions yet today. Start with something easy like using a reusable bag.",
        type: "tip",
      });
    }

    // Terrarium health insights
    if (terrariumHealth >= 80) {
      list.push({
        id: "terrarium-thriving",
        icon: "🦋",
        title: "Ecosystem thriving",
        description: "Your terrarium is flourishing! The butterfly has appeared, showing your ecosystem is balanced.",
        type: "milestone",
      });
    } else if (terrariumHealth < 40) {
      list.push({
        id: "terrarium-needs-care",
        icon: "💧",
        title: "Your terrarium needs care",
        description: "Complete daily actions to improve your terrarium's health. Each action adds nutrients to your ecosystem.",
        type: "warning",
      });
    }

    // Milestone insights
    if (totalCompleted >= 50) {
      list.push({
        id: "milestone-50",
        icon: "🏆",
        title: "50 actions milestone!",
        description: "You've completed 50 eco-actions. You're in the top tier of Canopy users making real change.",
        type: "milestone",
      });
    } else if (totalCompleted >= 10) {
      list.push({
        id: "milestone-10",
        icon: "🎉",
        title: "Double digits!",
        description: `${totalCompleted} actions completed so far. You're building strong eco-habits.`,
        type: "success",
        metric: `${totalCompleted} total`,
      });
    }

    // Weekly carbon budget insight
    const weeklyBudget = baselineFootprintKg / 52;
    if (weeklyBudget > 0) {
      const weeklyTarget = weeklyBudget * 0.8; // 20% reduction target
      list.push({
        id: "weekly-budget",
        icon: "📊",
        title: "Weekly carbon budget",
        description: `Your weekly target is ${weeklyTarget.toFixed(0)} kg CO₂ (20% below baseline of ${weeklyBudget.toFixed(0)} kg/week). Track daily to stay on target.`,
        type: "tip",
        metric: `${weeklyTarget.toFixed(0)} kg/week target`,
      });
    }

    return list;
  }, [totalFootprintKg, baselineFootprintKg, currentStreak, todayActionsCompleted, completedActionIds, terrariumHealth]);

  const typeStyles = {
    success: "bg-sage/10 border-sage/30 text-sage-dark",
    tip: "bg-navy/5 border-navy/20 text-navy",
    warning: "bg-terracotta/10 border-terracotta/30 text-terracotta-dark",
    milestone: "bg-gradient-to-br from-sage/10 to-terracotta-light/10 border-sage/30 text-navy",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy">Your Insights</h2>
          <p className="text-xs text-navy/50">Personalized tips based on your activity</p>
        </div>
        <span className="text-xs font-medium bg-sage/10 text-sage-dark px-2 py-1 rounded-full">
          {insights.length} insights
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.id}
            className={`rounded-xl border p-4 ${typeStyles[insight.type]}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">
                {insight.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{insight.title}</h3>
                <p className="text-xs opacity-80 mt-0.5 leading-relaxed">
                  {insight.description}
                </p>
                {insight.metric && (
                  <span className="inline-block mt-2 text-xs font-bold bg-white/60 rounded-full px-2 py-0.5">
                    {insight.metric}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
