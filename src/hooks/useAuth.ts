// ============================================================
// Canopy — Authentication Hook
// Manages auth state: login, logout, OAuth callback handling
// ============================================================

"use client";

import { useState, useCallback } from "react";
import type { AuthUser } from "@/types";

/** Parse and clear OAuth cookies set by the callback route */
function getOAuthSession(): AuthUser | null {
  const oauthUser = document.cookie.match(/canopy_oauth_user=([^;]+)/);
  const oauthToken = document.cookie.match(/canopy_oauth_token=([^;]+)/);
  if (!oauthUser || !oauthToken) return null;

  try {
    const user = JSON.parse(decodeURIComponent(oauthUser[1]));
    const token = decodeURIComponent(oauthToken[1]);
    localStorage.setItem("canopy_user", JSON.stringify(user));
    localStorage.setItem("canopy_token", token);
    // Clear cookies after consuming
    document.cookie = "canopy_oauth_user=; max-age=0; path=/";
    document.cookie = "canopy_oauth_token=; max-age=0; path=/";
    return { ...user, token };
  } catch {
    return null;
  }
}

/** Restore session from localStorage */
function getStoredSession(): AuthUser | null {
  const storedUser = localStorage.getItem("canopy_user");
  const storedToken = localStorage.getItem("canopy_token");
  if (!storedUser || !storedToken) return null;

  try {
    const user = JSON.parse(storedUser);
    if (!user.id || !user.email) throw new Error("Invalid stored session");
    return { ...user, token: storedToken };
  } catch {
    localStorage.removeItem("canopy_user");
    localStorage.removeItem("canopy_token");
    return null;
  }
}

export function useAuth() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    return getOAuthSession() || getStoredSession();
  });

  const login = useCallback((user: AuthUser) => {
    setAuthUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("canopy_user");
    localStorage.removeItem("canopy_token");
    setAuthUser(null);
  }, []);

  return { authUser, login, logout };
}
