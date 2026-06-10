"use client";

// ============================================================
// Canopy — PWA Service Worker Registration
// Registers the SW on mount for offline support & install prompt
// Forces update on every page load to prevent stale cache issues
// ============================================================

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => {
          // Force update check on every page load
          registration.update();
        })
        .catch((err) => console.warn("SW registration failed:", err));
    }
  }, []);

  return null;
}
