// ============================================================
// Canopy — Database Seed Script
// Populates the database with initial micro-actions and test user
// Run with: npx prisma db seed
// ============================================================

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { MICRO_ACTIONS } from "../src/lib/micro-actions-data";

const connectionString = process.env["DATABASE_URL"]!;
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Canopy database...");

  // Seed micro-actions
  console.log("  → Creating micro-actions...");
  for (const action of MICRO_ACTIONS) {
    await prisma.microAction.upsert({
      where: {
        id: `seed-${action.title.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: { ...action, isActive: true },
      create: {
        id: `seed-${action.title.toLowerCase().replace(/\s+/g, "-")}`,
        ...action,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${MICRO_ACTIONS.length} micro-actions seeded`);

  // Seed a demo corporate entity
  console.log("  → Creating demo corporate...");
  await prisma.corporate.upsert({
    where: { domain: "canopy-demo.com" },
    update: {},
    create: {
      id: "corp-demo",
      name: "Canopy Demo Corp",
      domain: "canopy-demo.com",
    },
  });
  console.log("  ✓ Demo corporate created");

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
