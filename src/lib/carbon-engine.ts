// ============================================================
// Canopy — Carbon Calculation Engine
// Converts user activities into CO₂ equivalent (kg)
// Uses static emission factors (mocked Climatiq API integration)
// ============================================================

/**
 * Emission factors sourced from EPA, DEFRA, and Climatiq references.
 * Units: kg CO₂e per unit (miles, kWh, serving, etc.)
 */
export const EMISSION_FACTORS = {
  transport: {
    gas_car: 0.404,        // kg CO₂ per mile (avg US passenger vehicle)
    diesel_car: 0.371,     // kg CO₂ per mile
    hybrid_car: 0.213,     // kg CO₂ per mile
    electric_car: 0.098,   // kg CO₂ per mile (grid average)
    bus: 0.089,            // kg CO₂ per mile per passenger
    train: 0.041,          // kg CO₂ per mile per passenger
    bicycle: 0.0,          // zero direct emissions
    walking: 0.0,          // zero direct emissions
    airplane_short: 0.255, // kg CO₂ per mile (<500mi)
    airplane_long: 0.195,  // kg CO₂ per mile (>500mi)
  },
  food: {
    beef_meal: 6.61,       // kg CO₂ per serving
    chicken_meal: 1.82,    // kg CO₂ per serving
    fish_meal: 1.34,       // kg CO₂ per serving
    vegetarian_meal: 0.86, // kg CO₂ per serving
    vegan_meal: 0.45,      // kg CO₂ per serving
    dairy: 1.39,           // kg CO₂ per serving
  },
  energy: {
    electricity_kwh: 0.417,   // kg CO₂ per kWh (US grid average)
    natural_gas_therm: 5.3,   // kg CO₂ per therm
    heating_oil_gallon: 10.16, // kg CO₂ per gallon
  },
  shopping: {
    clothing_item: 10.0,      // kg CO₂ per item (fast fashion avg)
    electronics_small: 25.0,  // kg CO₂ per item (phone, tablet)
    electronics_large: 300.0, // kg CO₂ per item (laptop, TV)
    furniture: 50.0,          // kg CO₂ per item
  },
  waste: {
    landfill_kg: 0.587,       // kg CO₂ per kg of waste to landfill
    recycled_kg: 0.021,       // kg CO₂ per kg recycled
    composted_kg: 0.01,       // kg CO₂ per kg composted
  },
} as const;

/**
 * Input shape for the calculation engine.
 * Flexible to handle all activity categories.
 */
export interface ActivityInput {
  category: "transport" | "food" | "energy" | "shopping" | "waste";
  activityType: string;
  quantity: number; // miles, servings, kWh, items, kg — depends on category
}

/**
 * Output of the calculation engine.
 */
export interface CalculationResult {
  co2Kg: number;
  breakdown: string;
  factor: number;
  unit: string;
}

/**
 * Core calculation function.
 * Accepts an activity input and returns the CO₂ equivalent in kg.
 *
 * @param input - The activity details (category, type, quantity)
 * @returns CalculationResult with co2Kg, breakdown description, and factor used
 * @throws Error if the activity type is not found in emission factors
 */
export function calculateCO2(input: ActivityInput): CalculationResult {
  const { category, activityType, quantity } = input;

  // Validate inputs
  if (quantity < 0) {
    throw new Error("Quantity cannot be negative");
  }
  if (quantity === 0) {
    return { co2Kg: 0, breakdown: "No emissions for zero quantity", factor: 0, unit: "" };
  }

  // Look up the emission factor
  const categoryFactors = EMISSION_FACTORS[category];
  if (!categoryFactors) {
    throw new Error(`Unknown category: ${category}`);
  }

  const factor = (categoryFactors as Record<string, number>)[activityType];
  if (factor === undefined) {
    throw new Error(`Unknown activity type "${activityType}" in category "${category}"`);
  }

  // Calculate CO₂
  const co2Kg = Math.round(factor * quantity * 1000) / 1000; // 3 decimal precision

  // Determine unit label
  const unitMap: Record<string, string> = {
    transport: "miles",
    food: "servings",
    energy: category === "energy" && activityType.includes("kwh") ? "kWh" : "units",
    shopping: "items",
    waste: "kg",
  };

  const unit = unitMap[category] || "units";

  return {
    co2Kg,
    breakdown: `${quantity} ${unit} × ${factor} kg CO₂/${unit} = ${co2Kg} kg CO₂`,
    factor,
    unit,
  };
}

/**
 * Calculate baseline annual footprint from onboarding answers.
 * Takes the swipe card responses and estimates annual CO₂.
 */
export function calculateBaseline(answers: Record<string, boolean>): number {
  let annualCO2 = 0;

  // Transport baseline (annual estimates)
  if (answers["drives_gas_car"]) annualCO2 += 0.404 * 30 * 250; // 30mi/day, 250 work days
  if (answers["takes_public_transit"]) annualCO2 += 0.089 * 15 * 250;
  if (answers["flies_frequently"]) annualCO2 += 0.195 * 2000 * 4; // 4 long flights/year

  // Food baseline
  if (answers["eats_meat_daily"]) annualCO2 += 6.61 * 365;
  if (answers["eats_dairy_daily"]) annualCO2 += 1.39 * 365;

  // Energy baseline
  if (answers["lives_in_large_home"]) annualCO2 += 0.417 * 10000; // 10k kWh/year
  else annualCO2 += 0.417 * 5000; // average home

  if (answers["uses_natural_gas"]) annualCO2 += 5.3 * 500; // 500 therms/year

  // Shopping baseline
  if (answers["shops_fast_fashion"]) annualCO2 += 10.0 * 52; // weekly purchase
  if (answers["buys_electronics_often"]) annualCO2 += 25.0 * 6; // 6 items/year

  return Math.round(annualCO2);
}
