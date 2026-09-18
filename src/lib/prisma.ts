import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let client: PrismaClient | undefined;

function getClient() {
  if (client) return client;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diset. Isi di .env untuk lokal, atau di environment variables hosting.",
    );
  }

  client =
    globalForPrisma.prisma ??
    new PrismaClient({ adapter: new PrismaMariaDb(url) });

  // Reuse across hot reloads in dev so each edit doesn't open a new pool.
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/**
 * Connects on first query, not on import. `next build` imports this module
 * while collecting page data, and a host typically has no DATABASE_URL at
 * build time — constructing the adapter eagerly crashed the build there.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const value = Reflect.get(getClient(), property);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
