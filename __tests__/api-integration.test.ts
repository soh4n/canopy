// ============================================================
// Canopy — API Route Integration Tests
// Tests the full request → validation → business logic → response cycle
// Mocks the database layer to test route handlers in isolation
// ============================================================

import { NextRequest } from "next/server";

// Mock the database module
jest.mock("../src/lib/db", () => ({
  prisma: {
    microAction: {
      findMany: jest.fn(),
    },
    userAction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from "../src/lib/db";
import { GET as getActions, POST as postActions } from "../src/app/api/actions/route";
import { POST as postOnboarding } from "../src/app/api/onboarding/route";
import { GET as getDashboard } from "../src/app/api/dashboard/route";
import { POST as postActivity, GET as getActivities } from "../src/app/api/activities/route";

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

function createRequest(
  method: string,
  url: string,
  body?: unknown,
  headers?: Record<string, string>
): NextRequest {
  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init as never);
}

describe("API Route Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // GET /api/actions
  // ==========================================================
  describe("GET /api/actions", () => {
    it("returns 401 without x-user-id header", async () => {
      const req = createRequest("GET", "/api/actions");
      const res = await getActions(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns list of micro-actions for authenticated user", async () => {
      const mockActions = [
        {
          id: "action-1",
          title: "Walk to work",
          description: "Skip the car",
          iconEmoji: "🚶",
          co2SavingsKg: 2.4,
          difficulty: "EASY",
          category: "TRANSPORT",
          pointsAwarded: 15,
          isActive: true,
          isDaily: true,
          createdAt: new Date("2026-01-01"),
        },
      ];

      (mockedPrisma.microAction.findMany as jest.Mock).mockResolvedValue(mockActions);
      (mockedPrisma.userAction.findMany as jest.Mock).mockResolvedValue([]);

      const req = createRequest("GET", "/api/actions", undefined, {
        "x-user-id": "user-123",
      });
      const res = await getActions(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.actions).toHaveLength(1);
      expect(data.actions[0].title).toBe("Walk to work");
      expect(data.actions[0].completedToday).toBe(false);
    });

    it("marks actions as completed today when user has completed them", async () => {
      const mockActions = [
        {
          id: "action-1",
          title: "Walk to work",
          description: "Skip the car",
          iconEmoji: "🚶",
          co2SavingsKg: 2.4,
          difficulty: "EASY",
          category: "TRANSPORT",
          pointsAwarded: 15,
          isActive: true,
          isDaily: true,
          createdAt: new Date("2026-01-01"),
        },
      ];

      const todayActions = [{ microActionId: "action-1" }];

      (mockedPrisma.microAction.findMany as jest.Mock).mockResolvedValue(mockActions);
      (mockedPrisma.userAction.findMany as jest.Mock).mockResolvedValue(todayActions);

      const req = createRequest("GET", "/api/actions", undefined, {
        "x-user-id": "user-123",
      });
      const res = await getActions(req);
      const data = await res.json();
      expect(data.actions[0].completedToday).toBe(true);
    });
  });

  // ==========================================================
  // POST /api/actions (complete a micro-action)
  // ==========================================================
  describe("POST /api/actions", () => {
    it("returns 401 without auth header", async () => {
      const req = createRequest("POST", "/api/actions", {
        microActionId: "clxyz123",
      });
      const res = await postActions(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid microActionId", async () => {
      const req = createRequest(
        "POST",
        "/api/actions",
        { microActionId: "not-a-cuid" },
        { "x-user-id": "user-123" }
      );
      const res = await postActions(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
    });
  });

  // ==========================================================
  // POST /api/onboarding
  // ==========================================================
  describe("POST /api/onboarding", () => {
    it("returns 401 without auth header", async () => {
      const req = createRequest("POST", "/api/onboarding", {
        answers: { drives_gas_car: true },
      });
      const res = await postOnboarding(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid body", async () => {
      const req = createRequest(
        "POST",
        "/api/onboarding",
        { answers: "not-an-object" },
        { "x-user-id": "user-123" }
      );
      const res = await postOnboarding(req);
      expect(res.status).toBe(400);
    });

    it("calculates baseline and updates user on valid input", async () => {
      const mockUser = {
        id: "user-123",
        onboardingComplete: true,
        baselineFootprintKg: 5000,
        totalFootprintKg: 5000,
      };

      (mockedPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const req = createRequest(
        "POST",
        "/api/onboarding",
        {
          answers: {
            drives_gas_car: true,
            eats_meat_daily: true,
            lives_in_large_home: false,
          },
        },
        { "x-user-id": "user-123" }
      );

      const res = await postOnboarding(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.baselineFootprintKg).toBeGreaterThan(0);
      expect(data.onboardingComplete).toBe(true);
      expect(data.comparison.nationalAverageKg).toBe(16000);
    });
  });

  // ==========================================================
  // GET /api/dashboard
  // ==========================================================
  describe("GET /api/dashboard", () => {
    it("returns 401 without auth header", async () => {
      const req = createRequest("GET", "/api/dashboard");
      const res = await getDashboard(req);
      expect(res.status).toBe(401);
    });

    it("returns 404 for non-existent user", async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createRequest("GET", "/api/dashboard", undefined, {
        "x-user-id": "nonexistent",
      });
      const res = await getDashboard(req);
      expect(res.status).toBe(404);
    });

    it("returns aggregated dashboard data for existing user", async () => {
      const mockUser = {
        id: "user-123",
        name: "Test User",
        totalFootprintKg: 4500,
        baselineFootprintKg: 5000,
        currentStreak: 5,
        longestStreak: 10,
        streakShields: 1,
        lastLoggedAt: new Date(),
        onboardingComplete: true,
      };

      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockedPrisma.activityLog.findMany as jest.Mock).mockResolvedValue([
        { co2Kg: 3.5, occurredAt: new Date() },
      ]);
      (mockedPrisma.userAction as unknown as { count: jest.Mock }).count =
        jest.fn().mockResolvedValue(2);

      const req = createRequest("GET", "/api/dashboard", undefined, {
        "x-user-id": "user-123",
      });
      const res = await getDashboard(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.user.id).toBe("user-123");
      expect(data.user.terrariumHealth).toBeGreaterThanOrEqual(0);
      expect(data.weeklyTotal).toBe(3.5);
    });
  });

  // ==========================================================
  // POST /api/activities
  // ==========================================================
  describe("POST /api/activities", () => {
    it("returns 401 without auth header", async () => {
      const req = createRequest("POST", "/api/activities", {
        category: "TRANSPORT",
        activityType: "gas_car",
        quantity: 15,
      });
      const res = await postActivity(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid category", async () => {
      const req = createRequest(
        "POST",
        "/api/activities",
        {
          category: "INVALID",
          activityType: "gas_car",
          quantity: 15,
        },
        { "x-user-id": "user-123" }
      );
      const res = await postActivity(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for negative quantity", async () => {
      const req = createRequest(
        "POST",
        "/api/activities",
        {
          category: "TRANSPORT",
          activityType: "gas_car",
          quantity: -5,
        },
        { "x-user-id": "user-123" }
      );
      const res = await postActivity(req);
      expect(res.status).toBe(400);
    });

    it("calculates CO₂ and persists for valid input", async () => {
      const mockLog = {
        id: "log-1",
        co2Kg: 6.06,
        category: "TRANSPORT",
        activityType: "gas_car",
      };
      const mockUser = {
        id: "user-123",
        totalFootprintKg: 5006.06,
        currentStreak: 2,
        longestStreak: 5,
        streakShields: 1,
        lastLoggedAt: new Date(),
      };

      (mockedPrisma.$transaction as jest.Mock).mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            activityLog: {
              create: jest.fn().mockResolvedValue(mockLog),
            },
            user: {
              findUniqueOrThrow: jest.fn().mockResolvedValue({
                ...mockUser,
                lastLoggedAt: null,
                currentStreak: 1,
                longestStreak: 1,
                streakShields: 1,
              }),
              update: jest.fn().mockResolvedValue(mockUser),
            },
          };
          return fn(tx);
        }
      );

      const req = createRequest(
        "POST",
        "/api/activities",
        {
          category: "TRANSPORT",
          activityType: "gas_car",
          quantity: 15,
        },
        { "x-user-id": "user-123" }
      );
      const res = await postActivity(req);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.activity.co2Kg).toBeGreaterThan(0);
    });
  });

  // ==========================================================
  // GET /api/activities
  // ==========================================================
  describe("GET /api/activities", () => {
    it("returns 401 without auth header", async () => {
      const req = createRequest("GET", "/api/activities");
      const res = await getActivities(req);
      expect(res.status).toBe(401);
    });

    it("returns activity history for authenticated user", async () => {
      const mockActivities = [
        {
          id: "log-1",
          category: "TRANSPORT",
          activityType: "gas_car",
          co2Kg: 6.06,
          occurredAt: new Date("2026-06-10"),
          createdAt: new Date("2026-06-10"),
        },
      ];

      (mockedPrisma.activityLog.findMany as jest.Mock).mockResolvedValue(mockActivities);
      (mockedPrisma.activityLog.count as jest.Mock).mockResolvedValue(1);

      const req = createRequest("GET", "/api/activities", undefined, {
        "x-user-id": "user-123",
      });
      const res = await getActivities(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.activities).toHaveLength(1);
      expect(data.activities[0].co2Kg).toBe(6.06);
      expect(data.pagination.total).toBe(1);
    });
  });
});
