// ============================================================
// Canopy — Google OAuth Callback Route
// GET /api/auth/callback — Handles Google OAuth redirect
// Exchanges code for tokens, creates/finds user, redirects home
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return redirectWithError("Google sign-in was cancelled");
    }

    if (!code) {
      return redirectWithError("No authorization code received");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : "http://localhost:3000/api/auth/callback";

    if (!clientId || !clientSecret) {
      return redirectWithError("Google OAuth not configured");
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return redirectWithError("Failed to exchange authorization code");
    }

    const tokens = await tokenRes.json();

    // Fetch user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return redirectWithError("Failed to get user info from Google");
    }

    const googleUser = await userInfoRes.json();
    const { email: rawEmail, name, id: googleId } = googleUser;

    if (!rawEmail) {
      return redirectWithError("No email received from Google");
    }

    // Normalize email to lowercase to match registration
    const email = rawEmail.toLowerCase();

    // Find or create user in our database
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user (no password since they use Google)
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          passwordHash: `google_oauth:${googleId}`, // Mark as OAuth user
          onboardingComplete: false,
        },
      });
    } else if (user.passwordHash.startsWith("google_oauth:") && name && !user.name) {
      // Update name if it was missing from a previous OAuth login
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    // Generate session token
    const sessionToken = randomUUID();

    // Build redirect URL with user data encoded
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = new URL("/", appUrl);

    // Store auth data in a short-lived cookie for the client to pick up
    const userData = JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      onboardingComplete: user.onboardingComplete,
    });

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("canopy_oauth_user", userData, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 1 minute — just long enough for client to read
      path: "/",
    });
    response.cookies.set("canopy_oauth_token", sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[GET /api/auth/callback] Error:", error);
    return redirectWithError("Authentication failed");
  }
}

function redirectWithError(message: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL("/", appUrl);
  url.searchParams.set("auth_error", message);
  return NextResponse.redirect(url);
}
