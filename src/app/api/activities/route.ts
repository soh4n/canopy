// ============================================================
// Canopy — Activity Logging API Route
// POST /api/activities — Log a new carbon activity
// GET  /api/activities — Fetch user's activity history
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LogActivitySchema } from "@/lib/validations";
import { calculateCO2, type ActivityInput } from "@/lib/carbon-engine";
import { calculateStreak } from "@/lib/gamification";

// Prevent static pre-rendering (requires live DB connection)
export const dynamic = "force-dynamic";

/**
 * POST /api/activities
 * Log a new carbon-producing activity and update user's footprint.
 */
export async function POST(request: NextRequest) {
  try {
    // In production, extract userId from JWT/session
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = LogActivitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { category, activityType, quantity, occurredAt } = validation.data;

    // Calculate CO₂ emissions
    const calcInput: ActivityInput = {
      category: category.toLowerCase() as ActivityInput["category"],
      activityType,
      quantity,
    };

    const result = calculateCO2(calcInput);

    // Save to database within a transaction
    const [activityLog, updatedUser] = await prisma.$transaction(
      async (tx) => {
        // Create activity log
        const log = await tx.activityLog.create({
          data: {
            userId,
            category,
            activityType,
            inputData: { ...calcInput, quantity },
            co2Kg: result.co2Kg,
            source: "MANUAL",
            occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
          },
        });

        // Fetch current user for streak calculation
        const user = await tx.user.findUniqueOrThrow({
          where: { id: userId },
        });

        // Calculate streak update
        const streakResult = calculateStreak(
          user.lastLoggedAt,
          user.currentStreak,
          user.longestStreak,
          user.streakShields
        );

        // Update user's total footprint and streak
        const updated = await tx.user.update({
          where: { id: userId },
          data: {
            totalFootprintKg: { increment: result.co2Kg },
            currentStreak: streakResult.currentStreak,
            longestStreak: streakResult.longestStreak,
            streakShields: streakResult.streakShields,
            lastLoggedAt: new Date(),
          },
        });

        return [log, updated] as const;
      }
    );

    return NextResponse.json(
      {
        activity: activityLog,
        calculation: result,
        streak: {
          current: updatedUser.currentStreak,
          longest: updatedUser.longestStreak,
          shieldsRemaining: updatedUser.streakShields,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/activities] Error:", error);

    if (error instanceof Error && error.message.includes("Unknown")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/activities
 * Fetch paginated activity history for a user.
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const category = searchParams.get("category");

    const where = {
      userId,
      ...(category ? { category: category as never } : {}),
    };

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/activities] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
