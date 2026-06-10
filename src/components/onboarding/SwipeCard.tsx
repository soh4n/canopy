"use client";

// ============================================================
// Canopy — Swipe Card Component (Framer Motion)
// Tinder-style card for onboarding questions
// Supports: touch/swipe (mobile), mouse-drag (desktop), keyboard (a11y)
// ============================================================

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useCallback } from "react";

interface SwipeCardProps {
  /** Card content */
  question: string;
  description: string;
  icon: string;
  category: string;
  /** Callback when card is swiped/decided */
  onSwipe: (direction: "left" | "right") => void;
  /** Whether this card is on top of the stack */
  isTop: boolean;
  /** Card index for stacking visual */
  index: number;
}

const SWIPE_THRESHOLD = 100; // px needed to trigger a swipe

export function SwipeCard({
  question,
  description,
  icon,
  category,
  onSwipe,
  isTop,
  index,
}: SwipeCardProps) {
  const x = useMotionValue(0);

  // Visual feedback: rotate slightly based on drag direction
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  // Opacity of "YES" / "NO" badges
  const yesOpacity = useTransform(x, [0, 100], [0, 1]);
  const noOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        onSwipe("right");
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        onSwipe("left");
      }
    },
    [onSwipe]
  );

  // Keyboard support for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        onSwipe("right");
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        onSwipe("left");
      }
    },
    [onSwipe]
  );

  // Stacking offset for cards behind the top one
  const stackOffset = index * 4;
  const stackScale = 1 - index * 0.05;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale: stackScale,
        y: stackOffset,
        zIndex: 10 - index,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={isTop ? handleDragEnd : undefined}
      tabIndex={isTop ? 0 : -1}
      onKeyDown={isTop ? handleKeyDown : undefined}
      role="button"
      aria-label={`${question}. Swipe right for Yes, left for No. Or use arrow keys.`}
      initial={{ scale: stackScale, y: stackOffset }}
      animate={{ scale: stackScale, y: stackOffset }}
    >
      <div className="relative h-full w-full rounded-2xl bg-white shadow-xl border border-oat-dark overflow-hidden">
        {/* YES indicator */}
        {isTop && (
          <motion.div
            className="absolute top-6 right-6 z-10 rounded-lg border-4 border-sage px-4 py-2 font-bold text-sage text-2xl rotate-12"
            style={{ opacity: yesOpacity }}
            aria-hidden="true"
          >
            YES ✓
          </motion.div>
        )}

        {/* NO indicator */}
        {isTop && (
          <motion.div
            className="absolute top-6 left-6 z-10 rounded-lg border-4 border-terracotta px-4 py-2 font-bold text-terracotta text-2xl -rotate-12"
            style={{ opacity: noOpacity }}
            aria-hidden="true"
          >
            NO ✗
          </motion.div>
        )}

        {/* Card Content */}
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          {/* Category badge */}
          <span className="mb-4 inline-block rounded-full bg-oat px-3 py-1 text-xs font-medium uppercase tracking-wider text-navy">
            {category}
          </span>

          {/* Icon */}
          <span className="text-6xl mb-6" role="img" aria-hidden="true">
            {icon}
          </span>

          {/* Question */}
          <h2 className="text-xl sm:text-2xl font-bold text-navy mb-3 leading-tight">
            {question}
          </h2>

          {/* Description */}
          <p className="text-sm text-navy/60 max-w-xs">
            {description}
          </p>
        </div>

        {/* Bottom hint */}
        {isTop && (
          <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-navy/40">
            ← No &nbsp;|&nbsp; Yes →
          </div>
        )}
      </div>
    </motion.div>
  );
}
