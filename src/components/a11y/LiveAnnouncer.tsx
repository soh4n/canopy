"use client";

// ============================================================
// Canopy — Live Announcer for Screen Readers
// Announces dynamic content changes via ARIA live region
// ============================================================

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface AnnounceContextValue {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AnnounceContext = createContext<AnnounceContextValue>(null as unknown as AnnounceContextValue);

export function useAnnounce() {
  return useContext(AnnounceContext);
}

export function LiveAnnouncer({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (priority === "assertive") {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }

      // Clear after announcement is read
      timeoutRef.current = setTimeout(() => {
        setPoliteMessage("");
        setAssertiveMessage("");
      }, 1000);
    },
    []
  );

  return (
    <AnnounceContext.Provider value={{ announce }}>
      {children}
      {/* Visually hidden live regions */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnounceContext.Provider>
  );
}
