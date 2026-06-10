"use client";

// ============================================================
// Canopy — Action Card Component
// Displays a micro-action with one-click "Complete" button
// Modern card design with no overlap issues
// ============================================================

import { motion } from "framer-motion";
import { useState } from "react";

interface ActionCardProps {
  id: string;
  title: string;
  description: string;
  iconEmoji: string;
  co2SavingsKg: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  completedToday: boolean;
  onComplete: (id: string) => void;
}

const DIFFICULTY_STYLES = {
  EASY: "bg-sage/10 text-sage-dark border-sage/20",
  MEDIUM: "bg-terracotta-light/10 text-terracotta border-terracotta/20",
  HARD: "bg-navy/10 text-navy border-navy/20",
};

const DIFFICULTY_LABELS = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export function ActionCard({
  id,
  title,
  description,
  iconEmoji,
  co2SavingsKg,
  difficulty,
  completedToday,
  onComplete,
}: ActionCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (completedToday || isCompleting) return;
    setIsCompleting(true);

    try {
      onComplete(id);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <motion.article
      className={`group rounded-2xl border-2 p-4 transition-all duration-200 ${
        completedToday
          ? "bg-sage/5 border-sage/40"
          : "bg-white border-oat-dark hover:border-sage/40 hover:shadow-lg hover:shadow-sage/5 hover:-translate-y-0.5"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label={`${title}. Saves ${co2SavingsKg} kg CO₂. ${
        completedToday ? "Completed today." : "Not yet completed."
      }`}
    >
      {/* Top row: icon + difficulty + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-hidden="true">
            {iconEmoji}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${DIFFICULTY_STYLES[difficulty]}`}
          >
            {DIFFICULTY_LABELS[difficulty]}
          </span>
        </div>
        {completedToday && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage-dark bg-sage/15 rounded-full px-2.5 py-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Done
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <h3 className="font-semibold text-navy text-sm sm:text-base leading-tight">
          {title}
        </h3>
        <p className="text-xs text-navy/55 mt-1 line-clamp-2 leading-relaxed">{description}</p>
      </div>

      {/* Bottom row: savings + action button */}
      <div className="flex items-center justify-between pt-2 border-t border-oat-dark/50">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-xs font-semibold text-sage-dark">
            -{co2SavingsKg} kg CO₂
          </span>
        </div>

        <button
          onClick={handleComplete}
          disabled={completedToday || isCompleting}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            completedToday
              ? "bg-sage/10 text-sage-dark cursor-default"
              : "bg-navy text-white hover:bg-navy-light active:scale-95 focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2"
          }`}
          aria-label={completedToday ? `${title} completed` : `Complete ${title}`}
        >
          {completedToday ? "Completed ✓" : isCompleting ? "Saving…" : "Mark Done"}
        </button>
      </div>
    </motion.article>
  );
}
