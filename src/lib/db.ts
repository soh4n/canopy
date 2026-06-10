// ============================================================
// Canopy — Prisma Client Singleton (Lazy Initialization)
// Prevents multiple instances in development (hot reload)
// Uses Proxy for lazy instantiation — avoids build-time DB connection
// ============================================================

import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Lazily-initialized Prisma client via Proxy.
 * PrismaClient is not instantiated until the first property access at runtime.
 * This prevents build-time errors when no live database is available.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      const connectionString = process.env["DATABASE_URL"]!;
      const adapter = new PrismaPg(connectionString);
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});
