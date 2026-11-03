import { PrismaClient } from "./generated/prisma";

const globalForPrisma = globalThis as unknown as {
  __edubufPrisma?: PrismaClient;
};

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// cached on globalThis so next dev hot-reload doesn't open a new pool every time
export const db: PrismaClient = globalForPrisma.__edubufPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__edubufPrisma = db;
}

export type { PrismaClient } from "./generated/prisma";
export * from "./generated/prisma";
