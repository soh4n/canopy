// ============================================================
// Canopy — API Input Validation Schemas (Zod)
// Centralized validation for all API routes
// ============================================================

import { z } from "zod";

/**
 * Valid activity categories matching the Prisma enum.
 */
export const ActivityCategoryEnum = z.enum([
  "TRANSPORT",
  "FOOD",
  "ENERGY",
  "SHOPPING",
  "WASTE",
]);

/**
 * Schema for logging a new activity.
 */
export const LogActivitySchema = z.object({
  category: ActivityCategoryEnum,
  activityType: z
    .string()
    .min(1, "Activity type is required")
    .max(50, "Activity type too long"),
  quantity: z
    .number()
    .positive("Quantity must be positive")
    .max(100000, "Quantity exceeds maximum"),
  occurredAt: z.string().datetime().optional(),
});

/**
 * Schema for completing a micro-action.
 */
export const CompleteMicroActionSchema = z.object({
  microActionId: z.string().cuid("Invalid micro-action ID"),
});

/**
 * Schema for onboarding baseline answers.
 */
export const OnboardingAnswersSchema = z.object({
  answers: z.record(z.string(), z.boolean()),
});

/**
 * Schema for user registration.
 */
export const RegisterUserSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number"
    ),
  name: z.string().min(1).max(100).optional(),
});

/**
 * Schema for user login.
 */
export const LoginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Export types derived from schemas
export type LogActivityInput = z.infer<typeof LogActivitySchema>;
export type CompleteMicroActionInput = z.infer<typeof CompleteMicroActionSchema>;
export type OnboardingAnswersInput = z.infer<typeof OnboardingAnswersSchema>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginUserInput = z.infer<typeof LoginUserSchema>;
