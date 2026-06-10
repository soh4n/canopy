// ============================================================
// Canopy — Authentication API Route
// POST /api/auth — Register or login user
// Security: bcrypt hashing, rate limiting, constant-time comparison
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RegisterUserSchema, LoginUserSchema } from "@/lib/validations";
import { checkRateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Prevent static pre-rendering
export const dynamic = "force-dynamic";

/**
 * POST /api/auth
 * Body: { action: "register" | "login", ... }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: use IP or forwarded header as identifier
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(`auth:${ip}`, AUTH_RATE_LIMIT)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "register") {
      return handleRegister(body);
    } else if (action === "login") {
      return handleLogin(body);
    } else if (action === "google_oauth") {
      return handleGoogleOAuth();
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'register', 'login', or 'google_oauth'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[POST /api/auth] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleRegister(body: unknown) {
  const validation = RegisterUserSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, name } = validation.data;

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    // If account was created via Google OAuth, link it by setting a password
    if (existing.passwordHash.startsWith("google_oauth:")) {
      const passwordHash = await bcrypt.hash(password, 12);
      const linked = await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          name: name || existing.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          onboardingComplete: true,
          createdAt: true,
        },
      });

      const sessionToken = randomUUID();
      return NextResponse.json(
        { user: linked, token: sessionToken },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name || email.split("@")[0],
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      onboardingComplete: true,
      createdAt: true,
    },
  });

  // Generate a session token (in production, use JWT or secure session)
  const sessionToken = randomUUID();

  return NextResponse.json(
    {
      user,
      token: sessionToken,
    },
    { status: 201 }
  );
}

async function handleLogin(body: unknown) {
  const validation = LoginUserSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = validation.data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      onboardingComplete: true,
    },
  });

  if (!user) {
    // Use generic message to prevent email enumeration
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Check if account was created via Google OAuth (no password set)
  if (user.passwordHash.startsWith("google_oauth:")) {
    return NextResponse.json(
      { error: "This account uses Google sign-in. Please use the Google button to log in." },
      { status: 401 }
    );
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Generate session token
  const sessionToken = randomUUID();

  // Return user without passwordHash
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;

  return NextResponse.json({
    user: safeUser,
    token: sessionToken,
  });
}

// ============================================================
// Google OAuth Handler
// Uses Google OAuth 2.0 for authentication
// Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars
// ============================================================
async function handleGoogleOAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
    : "http://localhost:3000/api/auth/callback";

  if (!clientId) {
    // Fallback: Google OAuth not configured, return helpful error
    return NextResponse.json(
      { error: "Google OAuth not configured. Please use email/password login or set GOOGLE_CLIENT_ID env variable." },
      { status: 501 }
    );
  }

  // Build Google OAuth consent URL with CSRF state parameter
  const state = randomUUID();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  // Return authUrl and state (client stores state to verify on callback)
  return NextResponse.json({ authUrl: authUrl.toString(), state });
}
