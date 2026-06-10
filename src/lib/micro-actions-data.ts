// ============================================================
// Canopy — Mock Micro-Actions Data
// Used for seeding the database and client-side fallback
// ============================================================

export interface MicroActionData {
  title: string;
  description: string;
  iconEmoji: string;
  co2SavingsKg: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING" | "WASTE";
  pointsAwarded: number;
  isDaily: boolean;
}

export const MICRO_ACTIONS: MicroActionData[] = [
  {
    title: "Walk or bike for errands",
    description: "Skip the car for trips under 2 miles today",
    iconEmoji: "🚶",
    co2SavingsKg: 2.4,
    difficulty: "EASY",
    category: "TRANSPORT",
    pointsAwarded: 15,
    isDaily: true,
  },
  {
    title: "Take public transit",
    description: "Use bus or train instead of driving",
    iconEmoji: "🚇",
    co2SavingsKg: 4.1,
    difficulty: "MEDIUM",
    category: "TRANSPORT",
    pointsAwarded: 20,
    isDaily: true,
  },
  {
    title: "Have a meatless meal",
    description: "Choose a vegetarian or vegan option for one meal",
    iconEmoji: "🥗",
    co2SavingsKg: 3.5,
    difficulty: "EASY",
    category: "FOOD",
    pointsAwarded: 10,
    isDaily: true,
  },
  {
    title: "Reduce food waste",
    description: "Use leftovers or plan meals to avoid throwing food away",
    iconEmoji: "♻️",
    co2SavingsKg: 1.8,
    difficulty: "EASY",
    category: "FOOD",
    pointsAwarded: 10,
    isDaily: true,
  },
  {
    title: "Air-dry your laundry",
    description: "Skip the dryer and hang clothes to dry",
    iconEmoji: "👔",
    co2SavingsKg: 2.5,
    difficulty: "EASY",
    category: "ENERGY",
    pointsAwarded: 10,
    isDaily: true,
  },
  {
    title: "Unplug idle electronics",
    description: "Disconnect chargers and devices not in use",
    iconEmoji: "🔌",
    co2SavingsKg: 0.5,
    difficulty: "EASY",
    category: "ENERGY",
    pointsAwarded: 5,
    isDaily: true,
  },
  {
    title: "Use a reusable bag",
    description: "Bring your own bag for shopping instead of plastic",
    iconEmoji: "🛍️",
    co2SavingsKg: 0.3,
    difficulty: "EASY",
    category: "SHOPPING",
    pointsAwarded: 5,
    isDaily: true,
  },
  {
    title: "Carpool to work",
    description: "Share a ride with a colleague or neighbor",
    iconEmoji: "🚙",
    co2SavingsKg: 5.0,
    difficulty: "MEDIUM",
    category: "TRANSPORT",
    pointsAwarded: 25,
    isDaily: true,
  },
  {
    title: "Cold wash your clothes",
    description: "Use cold water setting for laundry loads",
    iconEmoji: "🧊",
    co2SavingsKg: 0.9,
    difficulty: "EASY",
    category: "ENERGY",
    pointsAwarded: 10,
    isDaily: true,
  },
  {
    title: "Compost food scraps",
    description: "Divert organic waste from landfill to compost",
    iconEmoji: "🌱",
    co2SavingsKg: 1.2,
    difficulty: "MEDIUM",
    category: "WASTE",
    pointsAwarded: 15,
    isDaily: true,
  },
  {
    title: "Repair instead of replace",
    description: "Fix a broken item rather than buying new",
    iconEmoji: "🔧",
    co2SavingsKg: 8.0,
    difficulty: "HARD",
    category: "SHOPPING",
    pointsAwarded: 30,
    isDaily: false,
  },
  {
    title: "Shorter shower (under 5 min)",
    description: "Reduce hot water usage by timing your shower",
    iconEmoji: "🚿",
    co2SavingsKg: 1.0,
    difficulty: "EASY",
    category: "ENERGY",
    pointsAwarded: 10,
    isDaily: true,
  },
];
