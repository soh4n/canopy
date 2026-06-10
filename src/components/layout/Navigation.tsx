"use client";

// ============================================================
// Canopy — Responsive Navigation Component
// Mobile: bottom nav bar
// Tablet: collapsed side menu
// Desktop: expanded left sidebar
// ============================================================

import { motion } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: "🌿" },
  { id: "log", label: "Log", icon: "📝" },
  { id: "actions", label: "Actions", icon: "⚡" },
  { id: "insights", label: "Insights", icon: "📊" },
  { id: "tracker", label: "Tracker", icon: "🎯" },
];

interface NavigationProps {
  activeId?: string;
  onNavigate?: (id: string) => void;
}

export function Navigation({ activeId = "home", onNavigate }: NavigationProps) {
  const handleNav = (id: string) => {
    onNavigate?.(id);
  };

  return (
    <>
      {/* ===== MOBILE: Bottom Navigation Bar ===== */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-oat-dark safe-area-bottom"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="flex justify-around items-center h-16 px-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNav(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  activeId === item.id
                    ? "text-sage-dark"
                    : "text-navy/50 hover:text-navy"
                }`}
                aria-current={activeId === item.id ? "page" : undefined}
                aria-label={item.label}
              >
                <span className="text-xl" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
                {activeId === item.id && (
                  <motion.div
                    className="absolute -bottom-0 h-0.5 w-6 bg-sage rounded-full"
                    layoutId="nav-indicator-mobile"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ===== TABLET: Collapsed Side Menu ===== */}
      <nav
        className="hidden md:flex lg:hidden fixed left-0 top-0 bottom-0 z-40 w-16 bg-white/95 backdrop-blur-md border-r border-oat-dark flex-col items-center py-6 gap-2"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="mb-6 text-2xl" aria-hidden="true">
          🌱
        </div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
              activeId === item.id
                ? "bg-sage/10 text-sage-dark"
                : "text-navy/50 hover:bg-oat hover:text-navy"
            }`}
            aria-current={activeId === item.id ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
          >
            <span className="text-lg" aria-hidden="true">
              {item.icon}
            </span>
            {activeId === item.id && (
              <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sage rounded-full"
                layoutId="nav-indicator-tablet"
              />
            )}
          </button>
        ))}
      </nav>

      {/* ===== DESKTOP: Expanded Left Sidebar ===== */}
      <nav
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-56 bg-white/95 backdrop-blur-md border-r border-oat-dark flex-col py-6 px-3"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-3 mb-8">
          <span className="text-2xl" aria-hidden="true">
            🌱
          </span>
          <h1 className="text-lg font-bold text-navy">Canopy</h1>
        </div>

        {/* Nav items */}
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNav(item.id)}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeId === item.id
                    ? "bg-sage/10 text-sage-dark"
                    : "text-navy/60 hover:bg-oat hover:text-navy"
                }`}
                aria-current={activeId === item.id ? "page" : undefined}
              >
                <span className="text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
                {activeId === item.id && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sage rounded-full"
                    layoutId="nav-indicator-desktop"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-auto px-3 pt-4 border-t border-oat-dark">
          <p className="text-[10px] text-navy/40 leading-relaxed">
            Grow your impact,
            <br />
            shrink your footprint.
          </p>
        </div>
      </nav>
    </>
  );
}
