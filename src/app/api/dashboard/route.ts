// ============================================================
// Canopy — User Dashboard API Route
// GET /api/dashboard — Aggregated dashboard data
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Prevent static pre-rendering (requires live DB connection)
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard
 * Fetch aggregated data for the user's terrarium dashboard.
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

    // Fetch user profile with aggregated stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        totalFootprintKg: true,
        baselineFootprintKg: true,
        currentStreak: true,
        longestStreak: true,
        streakShields: true,
        lastLoggedAt: true,
        onboardingComplete: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get recent activities (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivities = await prisma.activityLog.findMany({
      where: {
        userId,
        occurredAt: { gte: sevenDaysAgo },
      },
      orderBy: { occurredAt: "desc" },
      take: 10,
    });

    // Get today's completed micro-actions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayActions = await prisma.userAction.count({
      where: {
        userId,
        completedAt: { gte: todayStart },
      },
    });

    // Calculate weekly CO₂ total
    const weeklyTotal = recentActivities.reduce(
      (sum, log) => sum + log.co2Kg,
      0
    );

    // Calculate terrarium health score (0-100)
    // Based on: reduction from baseline + streak + actions completed
    const reductionPercent = user.baselineFootprintKg > 0
      ? ((user.baselineFootprintKg - user.totalFootprintKg) /
          user.baselineFootprintKg) *
        100
      : 0;

    const terrariumHealth = Math.min(
      100,
      Math.max(
        0,
        50 + reductionPercent * 0.3 + user.currentStreak * 2 + todayActions * 5
      )
    );

    return NextResponse.json({
      user: {
        ...user,
        terrariumHealth: Math.round(terrariumHealth),
      },
      weeklyTotal: Math.round(weeklyTotal * 100) / 100,
      recentActivities,
      todayActionsCompleted: todayActions,
    });
  } catch (error) {
    console.error("[GET /api/dashboard] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
