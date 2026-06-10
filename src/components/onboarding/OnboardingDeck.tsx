"use client";

// ============================================================
// Canopy — Onboarding Swipe Deck
// Manages the stack of swipe cards and aggregates answers
// ============================================================

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { ONBOARDING_CARDS } from "@/lib/onboarding-data";

interface OnboardingDeckProps {
  onComplete: (answers: Record<string, boolean>) => void;
}

export function OnboardingDeck({ onComplete }: OnboardingDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const card = ONBOARDING_CARDS[currentIndex];
      const answer = direction === "right"; // Right = Yes, Left = No

      const newAnswers = { ...answers, [card.answerKey]: answer };
      setAnswers(newAnswers);

      const nextIndex = currentIndex + 1;

      if (nextIndex >= ONBOARDING_CARDS.length) {
        // All cards answered — submit
        onComplete(newAnswers);
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [currentIndex, answers, onComplete]
  );

  const progress = ((currentIndex) / ONBOARDING_CARDS.length) * 100;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4">
      {/* Progress bar */}
      <div className="w-full mb-6" role="progressbar" aria-valuenow={currentIndex} aria-valuemin={0} aria-valuemax={ONBOARDING_CARDS.length} aria-label="Onboarding progress">
        <div className="flex justify-between text-xs text-navy/60 mb-1">
          <span>{currentIndex} of {ONBOARDING_CARDS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-oat-dark rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-sage rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative w-full aspect-[3/4] max-h-[480px]">
        <AnimatePresence>
          {ONBOARDING_CARDS.slice(currentIndex, currentIndex + 3).map(
            (card, i) => (
              <SwipeCard
                key={card.id}
                question={card.question}
                description={card.description}
                icon={card.icon}
                category={card.category}
                onSwipe={handleSwipe}
                isTop={i === 0}
                index={i}
              />
            )
          )}
        </AnimatePresence>
      </div>

      {/* Button controls (accessible alternative to swipe) */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => handleSwipe("left")}
          className="flex items-center gap-2 rounded-full bg-white border-2 border-terracotta px-6 py-3 font-semibold text-terracotta shadow-md hover:bg-terracotta/5 transition-colors focus-visible:ring-2 focus-visible:ring-terracotta"
          aria-label="No, this doesn't apply to me"
        >
          <span aria-hidden="true">✗</span> No
        </button>
        <button
          onClick={() => handleSwipe("right")}
          className="flex items-center gap-2 rounded-full bg-white border-2 border-sage px-6 py-3 font-semibold text-sage shadow-md hover:bg-sage/5 transition-colors focus-visible:ring-2 focus-visible:ring-sage"
          aria-label="Yes, this applies to me"
        >
          Yes <span aria-hidden="true">✓</span>
        </button>
      </div>
    </div>
  );
}
