// ============================================================
// Canopy — Validation Schema Unit Tests
// ============================================================

import {
  LogActivitySchema,
  CompleteMicroActionSchema,
  OnboardingAnswersSchema,
  RegisterUserSchema,
  LoginUserSchema,
} from "../src/lib/validations";

describe("Validation Schemas", () => {
  describe("LogActivitySchema", () => {
    it("accepts valid activity input", () => {
      const result = LogActivitySchema.safeParse({
        category: "TRANSPORT",
        activityType: "gas_car",
        quantity: 15,
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid input with optional occurredAt", () => {
      const result = LogActivitySchema.safeParse({
        category: "FOOD",
        activityType: "beef_meal",
        quantity: 1,
        occurredAt: "2026-06-10T12:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid category", () => {
      const result = LogActivitySchema.safeParse({
        category: "INVALID",
        activityType: "gas_car",
        quantity: 15,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative quantity", () => {
      const result = LogActivitySchema.safeParse({
        category: "TRANSPORT",
        activityType: "gas_car",
        quantity: -5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero quantity", () => {
      const result = LogActivitySchema.safeParse({
        category: "TRANSPORT",
        activityType: "gas_car",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects quantity exceeding maximum", () => {
      const result = LogActivitySchema.safeParse({
        category: "TRANSPORT",
        activityType: "gas_car",
        quantity: 200000,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty activityType", () => {
      const result = LogActivitySchema.safeParse({
        category: "TRANSPORT",
        activityType: "",
        quantity: 10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CompleteMicroActionSchema", () => {
    it("accepts valid cuid", () => {
      const result = CompleteMicroActionSchema.safeParse({
        microActionId: "clx1234567890abcdef",
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-cuid string", () => {
      const result = CompleteMicroActionSchema.safeParse({
        microActionId: "not-a-cuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("OnboardingAnswersSchema", () => {
    it("accepts valid answers object", () => {
      const result = OnboardingAnswersSchema.safeParse({
        answers: {
          drives_gas_car: true,
          eats_meat_daily: false,
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty answers object", () => {
      const result = OnboardingAnswersSchema.safeParse({
        answers: {},
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-boolean values in answers", () => {
      const result = OnboardingAnswersSchema.safeParse({
        answers: {
          drives_gas_car: "yes",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RegisterUserSchema", () => {
    it("accepts valid registration", () => {
      const result = RegisterUserSchema.safeParse({
        email: "user@example.com",
        password: "SecurePass1",
        name: "Jane Doe",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = RegisterUserSchema.safeParse({
        email: "not-an-email",
        password: "SecurePass1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects weak password (no uppercase)", () => {
      const result = RegisterUserSchema.safeParse({
        email: "user@example.com",
        password: "weakpass1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects weak password (no number)", () => {
      const result = RegisterUserSchema.safeParse({
        email: "user@example.com",
        password: "WeakPassword",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = RegisterUserSchema.safeParse({
        email: "user@example.com",
        password: "Short1",
      });
      expect(result.success).toBe(false);
    });

    it("allows optional name", () => {
      const result = RegisterUserSchema.safeParse({
        email: "user@example.com",
        password: "SecurePass1",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("LoginUserSchema", () => {
    it("accepts valid login", () => {
      const result = LoginUserSchema.safeParse({
        email: "user@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const result = LoginUserSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
