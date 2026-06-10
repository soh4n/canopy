// ============================================================
// Canopy — Email Verification API Route
// POST /api/auth/verify — Send OTP / Verify OTP
// Uses Google SMTP via nodemailer
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sendVerificationEmail, generateOTP } from "@/lib/email";
import { checkRateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return timingSafeEqual(bufA, bufB);
}

export const dynamic = "force-dynamic";

// In-memory OTP store (in production, use Redis or DB)
const otpStore = new Map<string, { otp: string; expiresAt: number; name?: string; attempts: number }>();

// Max verification attempts before invalidating OTP
const MAX_OTP_ATTEMPTS = 5;

// Cleanup expired OTPs periodically
function cleanupExpiredOTPs() {
  const now = Date.now();
  for (const [key, value] of otpStore) {
    if (value.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(`verify:${ip}`, AUTH_RATE_LIMIT)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, email, otp, name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (action === "send_otp") {
      return handleSendOTP(normalizedEmail, name);
    } else if (action === "verify_otp") {
      return handleVerifyOTP(normalizedEmail, otp);
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'send_otp' or 'verify_otp'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[POST /api/auth/verify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleSendOTP(email: string, name?: string) {
  // Cleanup expired entries
  cleanupExpiredOTPs();

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store OTP
  otpStore.set(email, { otp, expiresAt, name, attempts: 0 });

  // Send email
  const sent = await sendVerificationEmail(email, otp, name);

  if (!sent) {
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Verification code sent to your email",
    expiresIn: 600, // seconds
  });
}

async function handleVerifyOTP(email: string, otp: string) {
  if (!otp || typeof otp !== "string") {
    return NextResponse.json(
      { error: "Verification code required" },
      { status: 400 }
    );
  }

  const stored = otpStore.get(email);

  if (!stored) {
    return NextResponse.json(
      { error: "No verification code found. Please request a new one." },
      { status: 400 }
    );
  }

  if (stored.expiresAt < Date.now()) {
    otpStore.delete(email);
    return NextResponse.json(
      { error: "Verification code expired. Please request a new one." },
      { status: 400 }
    );
  }

  // Brute-force protection: limit attempts
  stored.attempts += 1;
  if (stored.attempts > MAX_OTP_ATTEMPTS) {
    otpStore.delete(email);
    return NextResponse.json(
      { error: "Too many failed attempts. Please request a new code." },
      { status: 429 }
    );
  }

  // Constant-time comparison to prevent timing attacks
  const isValid = timingSafeCompare(otp, stored.otp);

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 400 }
    );
  }

  // OTP verified — clean up
  otpStore.delete(email);

  return NextResponse.json({
    verified: true,
    email,
    name: stored.name,
  });
}
