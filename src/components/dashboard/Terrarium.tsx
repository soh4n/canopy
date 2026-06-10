"use client";

// ============================================================
// Canopy — Digital Terrarium Component
// Dynamic SVG visualization whose appearance reflects carbon score
// Health: 0 (wilting/stressed) → 100 (lush/thriving ecosystem)
// Features: glass jar, layered soil, multiple plants, particles,
//           butterflies at high health, atmospheric glow effects
// ============================================================

import { motion } from "framer-motion";
import { useMemo } from "react";

interface TerrariumProps {
  health: number;
  streak: number;
  className?: string;
}

/** Deterministic pseudo-random from seed for consistent rendering */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function Terrarium({ health, streak, className = "" }: TerrariumProps) {
  const t = health / 100; // normalized 0→1

  const palette = useMemo(() => {
    // Foliage transitions: dried olive → vibrant green
    const foliageH = Math.round(90 + t * 40);   // 90→130 (yellow-green → green)
    const foliageS = Math.round(20 + t * 45);   // 20%→65%
    const foliageL = Math.round(35 + t * 15);   // 35%→50%
    const foliage = `hsl(${foliageH}, ${foliageS}%, ${foliageL}%)`;
    const foliageLight = `hsl(${foliageH}, ${foliageS - 5}%, ${foliageL + 15}%)`;
    const foliageDark = `hsl(${foliageH}, ${foliageS + 10}%, ${foliageL - 12}%)`;

    // Soil: cracked sand → rich loam
    const soilH = Math.round(30 + t * 5);
    const soilS = Math.round(25 + t * 30);
    const soilL = Math.round(55 - t * 20);
    const soil = `hsl(${soilH}, ${soilS}%, ${soilL}%)`;
    const soilDark = `hsl(${soilH}, ${soilS + 10}%, ${soilL - 10}%)`;

    // Accent flower color
    const flowerH = Math.round(340 + t * 30); // pink→rose
    const flower = `hsl(${flowerH}, 60%, 65%)`;

    // Atmosphere: hazy → clear with warm glow
    const glowOpacity = 0.05 + t * 0.12;
    const mossOpacity = t * 0.6;

    return { foliage, foliageLight, foliageDark, soil, soilDark, flower, glowOpacity, mossOpacity };
  }, [t]);

  // Dynamic elements scale with health
  const leafCount = Math.floor(3 + t * 9);        // 3→12
  const particleCount = Math.floor(t * 6);         // 0→6
  const hasButterfly = health > 65;
  const hasFlowers = health > 40;
  const hasMushrooms = health > 25;

  return (
    <div
      className={`relative ${className}`}
      role="img"
      aria-label={`Your terrarium health is ${health} out of 100. ${
        health > 70
          ? "Your ecosystem is thriving with lush plants and butterflies!"
          : health > 40
          ? "Your ecosystem is growing steadily."
          : "Your ecosystem needs care and attention."
      }`}
    >
      <svg
        viewBox="0 0 300 320"
        className="w-full h-full max-w-[320px] mx-auto drop-shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glass jar gradient */}
          <radialGradient id="glass-shine" cx="35%" cy="30%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0.25" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Inner glow gradient */}
          <radialGradient id="inner-glow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#A8C5AB" stopOpacity={palette.glowOpacity} />
            <stop offset="100%" stopColor="#A8C5AB" stopOpacity="0" />
          </radialGradient>

          {/* Soil gradient */}
          <linearGradient id="soil-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.soil} />
            <stop offset="100%" stopColor={palette.soilDark} />
          </linearGradient>

          {/* Leaf shape */}
          <path id="leaf-shape" d="M0,-6 C3,-5 6,-2 6,0 C6,2 3,5 0,6 C-1,4 -1,2 0,0 C-1,-2 -1,-4 0,-6Z" />

          {/* Clip for jar interior */}
          <clipPath id="jar-clip">
            <path d="M60,80 C60,50 100,35 150,35 C200,35 240,50 240,80 L240,260 C240,280 200,290 150,290 C100,290 60,280 60,260Z" />
          </clipPath>
        </defs>

        {/* ===== Jar Back Glass ===== */}
        <path
          d="M60,80 C60,50 100,35 150,35 C200,35 240,50 240,80 L240,260 C240,280 200,290 150,290 C100,290 60,280 60,260Z"
          fill="#F8F6F2"
          stroke="#D4CBC0"
          strokeWidth="2.5"
          opacity="0.9"
        />

        {/* Interior scene (clipped to jar) */}
        <g clipPath="url(#jar-clip)">
          {/* Background atmosphere */}
          <rect x="60" y="35" width="180" height="260" fill="url(#inner-glow)" />

          {/* ===== Soil Layers ===== */}
          {/* Gravel/pebble layer */}
          <ellipse cx="150" cy="270" rx="95" ry="18" fill="#C4B8A8" opacity="0.8" />
          {/* Main soil */}
          <motion.ellipse
            cx="150"
            cy="255"
            rx="95"
            ry="28"
            fill="url(#soil-grad)"
            animate={{ ry: 28 + t * 4 }}
            transition={{ duration: 1.5 }}
          />
          {/* Moss layer on soil surface */}
          <motion.ellipse
            cx="150"
            cy="242"
            rx="80"
            ry="8"
            fill={palette.foliageLight}
            opacity={palette.mossOpacity}
            animate={{ opacity: palette.mossOpacity }}
            transition={{ duration: 1 }}
          />

          {/* ===== Small Rocks/Pebbles ===== */}
          <circle cx="100" cy="265" r="4" fill="#B8AFA2" />
          <circle cx="185" cy="268" r="3" fill="#A89E92" />
          <circle cx="130" cy="270" r="2.5" fill="#C4B8A8" />

          {/* ===== Mushrooms (health > 25) ===== */}
          {hasMushrooms && (
            <g>
              <motion.g
                initial={{ scale: 0, originX: "195px", originY: "248px" }}
                animate={{ scale: t > 0.25 ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <rect x="194" y="240" width="2.5" height="12" rx="1" fill="#F0E8DC" />
                <ellipse cx="195" cy="240" rx="6" ry="4" fill="#E8956A" opacity="0.9" />
                <ellipse cx="193" cy="239" rx="1.5" ry="1" fill="#F5F0E8" opacity="0.6" />
              </motion.g>
              <motion.g
                initial={{ scale: 0, originX: "205px", originY: "252px" }}
                animate={{ scale: t > 0.35 ? 0.7 : 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <rect x="204" y="246" width="2" height="8" rx="1" fill="#F0E8DC" />
                <ellipse cx="205" cy="246" rx="4.5" ry="3" fill="#C4653A" opacity="0.8" />
              </motion.g>
            </g>
          )}

          {/* ===== Main Plant (Center) — Tree/Bush ===== */}
          {/* Trunk */}
          <motion.path
            d="M150,248 C149,230 148,210 150,180 C151,165 149,150 150,135"
            stroke={palette.foliageDark}
            strokeWidth={3 + t * 1.5}
            fill="none"
            strokeLinecap="round"
            animate={{ pathLength: 0.5 + t * 0.5 }}
            transition={{ duration: 1.5 }}
          />

          {/* Left branch */}
          <motion.path
            d="M150,195 C140,185 125,180 115,175"
            stroke={palette.foliageDark}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            animate={{ pathLength: t > 0.3 ? 1 : 0.3 }}
            transition={{ duration: 1.2 }}
          />

          {/* Right branch */}
          <motion.path
            d="M150,175 C160,168 172,162 185,158"
            stroke={palette.foliageDark}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            animate={{ pathLength: t > 0.5 ? 1 : 0.2 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          />

          {/* Upper branch */}
          <motion.path
            d="M150,155 C145,145 140,138 135,130"
            stroke={palette.foliageDark}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={{ pathLength: t > 0.6 ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          />

          {/* ===== Foliage Canopy (Dynamic Leaves) ===== */}
          {Array.from({ length: leafCount }).map((_, i) => {
            const seed = i * 7 + 13;
            const angle = seededRandom(seed) * 360;
            const dist = 20 + seededRandom(seed + 1) * 35;
            const cx = 150 + Math.cos((angle * Math.PI) / 180) * dist * 0.9;
            const cy = 155 + Math.sin((angle * Math.PI) / 180) * dist * 0.5 - i * 3;
            const size = 10 + seededRandom(seed + 2) * 8 * t;
            const rotation = seededRandom(seed + 3) * 360;
            const color = i % 3 === 0 ? palette.foliageLight : i % 3 === 1 ? palette.foliage : palette.foliageDark;

            return (
              <motion.use
                key={`leaf-${i}`}
                href="#leaf-shape"
                x={cx}
                y={cy}
                fill={color}
                opacity={0.6 + t * 0.4}
                transform={`rotate(${rotation}, ${cx}, ${cy}) scale(${size / 6})`}
                initial={{ scale: 0 }}
                animate={{ scale: size / 6, opacity: 0.6 + t * 0.4 }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            );
          })}

          {/* ===== Flowers (health > 40) ===== */}
          {hasFlowers && (
            <g>
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: t > 0.4 ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <circle cx="120" cy="168" r="4" fill={palette.flower} />
                <circle cx="120" cy="168" r="1.5" fill="#FFD700" />
              </motion.g>
              {health > 60 && (
                <motion.g
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  <circle cx="175" cy="148" r="3.5" fill={palette.flower} opacity="0.85" />
                  <circle cx="175" cy="148" r="1.2" fill="#FFD700" />
                </motion.g>
              )}
              {health > 80 && (
                <motion.g
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  <circle cx="138" cy="135" r="3" fill="#B088D4" opacity="0.8" />
                  <circle cx="138" cy="135" r="1" fill="#FFD700" />
                </motion.g>
              )}
            </g>
          )}

          {/* ===== Small fern (Left Side) ===== */}
          <motion.path
            d="M95,250 C95,240 90,235 85,228 M95,250 C98,238 100,232 105,225 M95,250 C93,242 88,238 82,235"
            stroke={palette.foliage}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity={0.5 + t * 0.5}
            animate={{ opacity: 0.5 + t * 0.5 }}
            transition={{ duration: 1 }}
          />
          {health > 30 && (
            <>
              <ellipse cx="85" cy="227" rx="5" ry="3" fill={palette.foliageLight} opacity={t} />
              <ellipse cx="105" cy="224" rx="4.5" ry="2.5" fill={palette.foliage} opacity={t} />
              <ellipse cx="82" cy="234" rx="4" ry="2.5" fill={palette.foliageDark} opacity={t * 0.8} />
            </>
          )}

          {/* ===== Butterfly (health > 65) ===== */}
          {hasButterfly && (
            <motion.g
              animate={{
                x: [0, 10, -5, 8, 0],
                y: [0, -8, -3, -10, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.g
                animate={{ rotateY: [0, 180, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ transformOrigin: "170px 100px" }}
              >
                {/* Wing left */}
                <path
                  d="M170,100 C165,94 160,92 162,97 C160,95 158,98 164,100Z"
                  fill="#E8956A"
                  opacity="0.85"
                />
                {/* Wing right */}
                <path
                  d="M170,100 C175,94 180,92 178,97 C180,95 182,98 176,100Z"
                  fill="#C4653A"
                  opacity="0.85"
                />
                {/* Body */}
                <ellipse cx="170" cy="100" rx="1" ry="3" fill="#1B2A4A" />
              </motion.g>
            </motion.g>
          )}

          {/* ===== Floating Spores/Particles ===== */}
          {Array.from({ length: particleCount }).map((_, i) => {
            const startX = 100 + seededRandom(i * 3 + 50) * 100;
            const startY = 120 + seededRandom(i * 3 + 51) * 80;
            return (
              <motion.circle
                key={`particle-${i}`}
                cx={startX}
                cy={startY}
                r={1 + seededRandom(i + 99)}
                fill="#A8C5AB"
                animate={{
                  opacity: [0, 0.7, 0],
                  y: [0, -15 - seededRandom(i) * 10, -25],
                  x: [0, seededRandom(i + 10) * 10 - 5],
                }}
                transition={{
                  duration: 3 + seededRandom(i) * 2,
                  repeat: Infinity,
                  delay: i * 0.9,
                  ease: "easeOut",
                }}
              />
            );
          })}

          {/* ===== Water droplets on glass (high health) ===== */}
          {health > 75 && (
            <g opacity="0.4">
              <circle cx="85" cy="90" r="2" fill="white" />
              <circle cx="88" cy="95" r="1.5" fill="white" />
              <circle cx="220" cy="110" r="1.8" fill="white" />
              <circle cx="75" cy="140" r="1.2" fill="white" />
            </g>
          )}
        </g>

        {/* ===== Glass Jar Front (overlay for 3D depth) ===== */}
        <path
          d="M60,80 C60,50 100,35 150,35 C200,35 240,50 240,80 L240,260 C240,280 200,290 150,290 C100,290 60,280 60,260Z"
          fill="url(#glass-shine)"
          stroke="#C4B8A8"
          strokeWidth="2"
        />

        {/* Jar rim / lip */}
        <ellipse cx="150" cy="38" rx="55" ry="10" fill="none" stroke="#B8AFA2" strokeWidth="3" />
        <ellipse cx="150" cy="38" rx="55" ry="10" fill="#F5F0E8" opacity="0.5" />

        {/* Cork/lid */}
        <rect x="118" y="24" width="64" height="14" rx="5" fill="#D4A574" stroke="#B8956A" strokeWidth="1" />
        <rect x="120" y="27" width="60" height="3" rx="1.5" fill="#C4955A" opacity="0.5" />
      </svg>

      {/* Health indicator badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-oat-dark">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: health > 70 ? "#7A9E7E" : health > 40 ? "#E8956A" : "#C4653A" }}
        />
        <span className="text-xs font-medium text-navy">
          {health > 70 ? "Thriving" : health > 40 ? "Growing" : "Needs care"}
        </span>
        {streak > 0 && (
          <span className="text-xs font-bold text-terracotta">
            🔥 {streak}d
          </span>
        )}
      </div>
    </div>
  );
}
