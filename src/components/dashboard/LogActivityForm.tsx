"use client";

// ============================================================
// Canopy — Log Activity Form
// Allows users to manually calculate emissions for activities
// Uses the carbon engine for real-time CO₂ calculation
// ============================================================

import { useState, useCallback } from "react";

const ACTIVITY_TYPES: Record<string, { label: string; value: string }[]> = {
  TRANSPORT: [
    { label: "Gas Car (miles)", value: "gas_car" },
    { label: "Electric Car (miles)", value: "electric_car" },
    { label: "Bus (miles)", value: "bus" },
    { label: "Train (miles)", value: "train" },
    { label: "Airplane - Short (miles)", value: "airplane_short" },
  ],
  FOOD: [
    { label: "Beef Meal (servings)", value: "beef_meal" },
    { label: "Chicken Meal (servings)", value: "chicken_meal" },
    { label: "Vegetarian Meal (servings)", value: "vegetarian_meal" },
    { label: "Vegan Meal (servings)", value: "vegan_meal" },
  ],
  ENERGY: [
    { label: "Electricity (kWh)", value: "electricity_kwh" },
    { label: "Natural Gas (therms)", value: "natural_gas_therm" },
  ],
  SHOPPING: [
    { label: "Clothing Item", value: "clothing_item" },
    { label: "Electronics (small)", value: "electronics_small" },
  ],
  WASTE: [
    { label: "Landfill (kg)", value: "landfill_kg" },
    { label: "Recycled (kg)", value: "recycled_kg" },
  ],
} as const;

export function LogActivityForm() {
  const [category, setCategory] = useState("TRANSPORT");
  const [activityType, setActivityType] = useState("gas_car");
  const [quantity, setQuantity] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        setResult("Please enter a valid positive number.");
        return;
      }

      setIsCalculating(true);
      import("@/lib/carbon-engine").then(({ calculateCO2 }) => {
        try {
          const calc = calculateCO2({
            category: category.toLowerCase() as
              | "transport"
              | "food"
              | "energy"
              | "shopping"
              | "waste",
            activityType,
            quantity: qty,
          });
          setResult(`${calc.breakdown}`);
        } catch (err) {
          setResult(`Error: ${(err as Error).message}`);
        } finally {
          setIsCalculating(false);
        }
      });
    },
    [category, activityType, quantity]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white rounded-2xl border border-oat-dark p-6 shadow-sm"
      aria-label="Log a carbon activity"
    >
      {/* Category select */}
      <div>
        <label
          htmlFor="log-category"
          className="block text-xs font-medium text-navy/70 mb-1.5"
        >
          Category
        </label>
        <select
          id="log-category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setActivityType(ACTIVITY_TYPES[e.target.value][0].value);
          }}
          className="w-full rounded-xl border border-oat-dark bg-oat/50 px-4 py-2.5 text-sm text-navy focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
        >
          {Object.keys(ACTIVITY_TYPES).map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Activity type select */}
      <div>
        <label
          htmlFor="log-activityType"
          className="block text-xs font-medium text-navy/70 mb-1.5"
        >
          Activity
        </label>
        <select
          id="log-activityType"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          className="w-full rounded-xl border border-oat-dark bg-oat/50 px-4 py-2.5 text-sm text-navy focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
        >
          {ACTIVITY_TYPES[category].map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div>
        <label
          htmlFor="log-quantity"
          className="block text-xs font-medium text-navy/70 mb-1.5"
        >
          Quantity
        </label>
        <input
          id="log-quantity"
          type="number"
          min="0.1"
          step="0.1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 15"
          className="w-full rounded-xl border border-oat-dark bg-oat/50 px-4 py-2.5 text-sm text-navy placeholder:text-navy/35 focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
          required
          aria-describedby="log-quantity-hint"
        />
        <p id="log-quantity-hint" className="text-[10px] text-navy/45 mt-1.5">
          Enter miles, servings, kWh, items, or kg depending on category.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isCalculating}
        className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white hover:bg-navy-light transition-all focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 disabled:opacity-50 active:scale-[0.98]"
      >
        {isCalculating ? "Calculating..." : "Calculate Emissions"}
      </button>

      {/* Result */}
      {result && (
        <div
          className="mt-4 p-4 rounded-xl bg-oat/50 border border-oat-dark"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-sm font-medium text-navy">{result}</p>
        </div>
      )}
    </form>
  );
}
