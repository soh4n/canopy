// ============================================================
// Canopy — Onboarding Swipe Card Data
// Questions for baseline carbon footprint estimation
// ============================================================

export interface OnboardingCard {
  id: string;
  question: string;
  description: string;
  icon: string;
  category: "transport" | "food" | "energy" | "shopping";
  answerKey: string; // Maps to calculateBaseline() keys
}

export const ONBOARDING_CARDS: OnboardingCard[] = [
  {
    id: "1",
    question: "I drive a gas car to work",
    description: "Regular commute by gasoline-powered vehicle",
    icon: "🚗",
    category: "transport",
    answerKey: "drives_gas_car",
  },
  {
    id: "2",
    question: "I take public transit regularly",
    description: "Bus, subway, or train at least 3x/week",
    icon: "🚌",
    category: "transport",
    answerKey: "takes_public_transit",
  },
  {
    id: "3",
    question: "I fly more than 4 times a year",
    description: "Business or personal air travel",
    icon: "✈️",
    category: "transport",
    answerKey: "flies_frequently",
  },
  {
    id: "4",
    question: "I eat meat daily",
    description: "Beef, pork, or chicken most days",
    icon: "🥩",
    category: "food",
    answerKey: "eats_meat_daily",
  },
  {
    id: "5",
    question: "I consume dairy products daily",
    description: "Milk, cheese, yogurt, butter regularly",
    icon: "🧀",
    category: "food",
    answerKey: "eats_dairy_daily",
  },
  {
    id: "6",
    question: "I live in a large home (3+ bedrooms)",
    description: "Bigger spaces use more energy to heat/cool",
    icon: "🏠",
    category: "energy",
    answerKey: "lives_in_large_home",
  },
  {
    id: "7",
    question: "My home uses natural gas",
    description: "Gas heating, stove, or water heater",
    icon: "🔥",
    category: "energy",
    answerKey: "uses_natural_gas",
  },
  {
    id: "8",
    question: "I buy new clothes every week",
    description: "Regular fast-fashion purchases",
    icon: "👕",
    category: "shopping",
    answerKey: "shops_fast_fashion",
  },
  {
    id: "9",
    question: "I upgrade electronics often",
    description: "New phone, gadgets, or devices 2+ times/year",
    icon: "📱",
    category: "shopping",
    answerKey: "buys_electronics_often",
  },
];
