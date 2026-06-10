// ============================================================
// Canopy — Carbon Engine Unit Tests
// ============================================================

import { calculateCO2, calculateBaseline, EMISSION_FACTORS } from "../src/lib/carbon-engine";

describe("Carbon Calculation Engine", () => {
  describe("calculateCO2", () => {
    it("calculates transport emissions correctly for gas car", () => {
      const result = calculateCO2({
        category: "transport",
        activityType: "gas_car",
        quantity: 15,
      });

      expect(result.co2Kg).toBeCloseTo(0.404 * 15, 2);
      expect(result.factor).toBe(0.404);
      expect(result.unit).toBe("miles");
      expect(result.breakdown).toContain("15 miles");
    });

    it("calculates food emissions correctly for beef meal", () => {
      const result = calculateCO2({
        category: "food",
        activityType: "beef_meal",
        quantity: 1,
      });

      expect(result.co2Kg).toBe(6.61);
      expect(result.factor).toBe(6.61);
    });

    it("returns zero for zero quantity", () => {
      const result = calculateCO2({
        category: "transport",
        activityType: "gas_car",
        quantity: 0,
      });

      expect(result.co2Kg).toBe(0);
    });

    it("returns zero for zero-emission activities", () => {
      const result = calculateCO2({
        category: "transport",
        activityType: "bicycle",
        quantity: 10,
      });

      expect(result.co2Kg).toBe(0);
    });

    it("throws for negative quantity", () => {
      expect(() =>
        calculateCO2({
          category: "transport",
          activityType: "gas_car",
          quantity: -5,
        })
      ).toThrow("Quantity cannot be negative");
    });

    it("throws for unknown category", () => {
      expect(() =>
        calculateCO2({
          category: "unknown" as never,
          activityType: "test",
          quantity: 1,
        })
      ).toThrow("Unknown category");
    });

    it("throws for unknown activity type", () => {
      expect(() =>
        calculateCO2({
          category: "transport",
          activityType: "spaceship",
          quantity: 1,
        })
      ).toThrow('Unknown activity type "spaceship"');
    });

    it("handles energy calculations correctly", () => {
      const result = calculateCO2({
        category: "energy",
        activityType: "electricity_kwh",
        quantity: 100,
      });

      expect(result.co2Kg).toBeCloseTo(41.7, 1);
    });

    it("handles waste calculations correctly", () => {
      const result = calculateCO2({
        category: "waste",
        activityType: "landfill_kg",
        quantity: 5,
      });

      expect(result.co2Kg).toBeCloseTo(0.587 * 5, 2);
    });

    it("handles large quantities without overflow", () => {
      const result = calculateCO2({
        category: "transport",
        activityType: "gas_car",
        quantity: 99999,
      });

      expect(result.co2Kg).toBeGreaterThan(0);
      expect(isFinite(result.co2Kg)).toBe(true);
    });
  });

  describe("calculateBaseline", () => {
    it("returns 0 for all-false answers", () => {
      const result = calculateBaseline({
        drives_gas_car: false,
        takes_public_transit: false,
        flies_frequently: false,
        eats_meat_daily: false,
        eats_dairy_daily: false,
        lives_in_large_home: false,
        uses_natural_gas: false,
        shops_fast_fashion: false,
        buys_electronics_often: false,
      });

      // Should still include base energy (~2085 for small home)
      expect(result).toBeGreaterThan(0);
      expect(result).toBe(Math.round(0.417 * 5000)); // Small home baseline
    });

    it("returns higher value for all-true answers", () => {
      const allTrue = calculateBaseline({
        drives_gas_car: true,
        takes_public_transit: true,
        flies_frequently: true,
        eats_meat_daily: true,
        eats_dairy_daily: true,
        lives_in_large_home: true,
        uses_natural_gas: true,
        shops_fast_fashion: true,
        buys_electronics_often: true,
      });

      const allFalse = calculateBaseline({
        drives_gas_car: false,
        takes_public_transit: false,
        flies_frequently: false,
        eats_meat_daily: false,
        eats_dairy_daily: false,
        lives_in_large_home: false,
        uses_natural_gas: false,
        shops_fast_fashion: false,
        buys_electronics_often: false,
      });

      expect(allTrue).toBeGreaterThan(allFalse);
    });

    it("returns an integer", () => {
      const result = calculateBaseline({ drives_gas_car: true });
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe("EMISSION_FACTORS", () => {
    it("has all expected transport modes", () => {
      expect(EMISSION_FACTORS.transport).toHaveProperty("gas_car");
      expect(EMISSION_FACTORS.transport).toHaveProperty("electric_car");
      expect(EMISSION_FACTORS.transport).toHaveProperty("bicycle");
      expect(EMISSION_FACTORS.transport).toHaveProperty("bus");
    });

    it("has all non-negative emission factors", () => {
      for (const category of Object.values(EMISSION_FACTORS)) {
        for (const [key, value] of Object.entries(category)) {
          expect(value).toBeGreaterThanOrEqual(0);
          // Ensure no NaN values
          expect(isNaN(value as number)).toBe(false);
        }
      }
    });
  });
});
