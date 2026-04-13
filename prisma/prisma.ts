import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  client.$connect().catch((err) => {
    console.error("[Prisma] Failed to connect on startup:", err);
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always persist the singleton to avoid "Engine is not yet connected" in production
globalForPrisma.prisma = prisma;
