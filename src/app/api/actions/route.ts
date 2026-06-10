// ============================================================
// Canopy — Micro-Actions API Route
// GET  /api/actions — Fetch available micro-actions
// POST /api/actions — Complete a micro-action
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ActivityCategory } from "@/generated/prisma";
import { CompleteMicroActionSchema, ActivityCategoryEnum } from "@/lib/validations";
import { calculateStreak, calculatePoints } from "@/lib/gamification";

// Prevent static pre-rendering (requires live DB connection)
export const dynamic = "force-dynamic";

/**
 * GET /api/actions
 * Fetch available micro-actions for the daily action cards.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Fetch active micro-actions
    const where: { isActive: boolean; category?: ActivityCategory } = { isActive: true };
    if (category) {
      const parsed = ActivityCategoryEnum.safeParse(category);
      if (parsed.success) where.category = parsed.data as ActivityCategory;
    }

    const actions = await prisma.microAction.findMany({
      where,
      orderBy: [{ difficulty: "asc" }, { co2SavingsKg: "desc" }],
    });

    // Fetch today's completed actions for this user
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedToday = await prisma.userAction.findMany({
      where: {
        userId,
        completedAt: { gte: todayStart },
      },
      select: { microActionId: true },
    });

    const completedIds = new Set(completedToday.map((a) => a.microActionId));

    // Mark which actions are completed today
    const actionsWithStatus = actions.map((action) => ({
      ...action,
      completedToday: completedIds.has(action.id),
    }));

    return NextResponse.json({ actions: actionsWithStatus });
  } catch (error) {
    console.error("[GET /api/actions] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/actions
 * Mark a micro-action as completed.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = CompleteMicroActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { microActionId } = validation.data;

    // Verify the micro-action exists and is active
    const microAction = await prisma.microAction.findUnique({
      where: { id: microActionId },
    });

    if (!microAction || !microAction.isActive) {
      return NextResponse.json(
        { error: "Micro-action not found or inactive" },
        { status: 404 }
      );
    }

    // Check if already completed today (prevent duplicate completions)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingCompletion = await prisma.userAction.findFirst({
      where: {
        userId,
        microActionId,
        completedAt: { gte: todayStart },
      },
    });

    if (existingCompletion) {
      return NextResponse.json(
        { error: "Action already completed today" },
        { status: 409 }
      );
    }

    // Complete the action within a transaction
    const [userAction, updatedUser] = await prisma.$transaction(
      async (tx) => {
        // Record the completion
        const action = await tx.userAction.create({
          data: { userId, microActionId },
        });

        // Get user for streak calculation
        const user = await tx.user.findUniqueOrThrow({
          where: { id: userId },
        });

        // Calculate streak
        const streakResult = calculateStreak(
          user.lastLoggedAt,
          user.currentStreak,
          user.longestStreak,
          user.streakShields
        );

        // Calculate points with streak bonus
        const points = calculatePoints(
          microAction.pointsAwarded,
          streakResult.currentStreak
        );

        // Update user — reduce footprint by the action's savings
        const updated = await tx.user.update({
          where: { id: userId },
          data: {
            totalFootprintKg: {
              decrement: microAction.co2SavingsKg,
            },
            currentStreak: streakResult.currentStreak,
            longestStreak: streakResult.longestStreak,
            streakShields: streakResult.streakShields,
            lastLoggedAt: new Date(),
          },
        });

        return [action, updated, points] as const;
      }
    );

    return NextResponse.json(
      {
        completion: userAction,
        pointsEarned: updatedUser,
        co2Saved: microAction.co2SavingsKg,
        streak: {
          current: updatedUser.currentStreak,
          longest: updatedUser.longestStreak,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/actions] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
