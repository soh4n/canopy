// ============================================================
// Canopy — Onboarding API Route
// POST /api/onboarding — Save baseline answers & calculate footprint
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OnboardingAnswersSchema } from "@/lib/validations";
import { calculateBaseline } from "@/lib/carbon-engine";

// Prevent static pre-rendering (requires live DB connection)
export const dynamic = "force-dynamic";

/**
 * POST /api/onboarding
 * Save the user's swipe-card onboarding answers and calculate baseline.
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
    const validation = OnboardingAnswersSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { answers } = validation.data;

    // Calculate baseline annual footprint from answers
    const baselineKg = calculateBaseline(answers);

    // Update user with baseline data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        baselineAnswers: answers,
        baselineFootprintKg: baselineKg,
        totalFootprintKg: baselineKg,
        onboardingComplete: true,
      },
    });

    return NextResponse.json({
      baselineFootprintKg: baselineKg,
      onboardingComplete: updatedUser.onboardingComplete,
      // Provide context: average American is ~16,000 kg CO₂/year
      comparison: {
        userAnnualKg: baselineKg,
        nationalAverageKg: 16000,
        percentOfAverage: Math.round((baselineKg / 16000) * 100),
      },
    });
  } catch (error) {
    console.error("[POST /api/onboarding] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
