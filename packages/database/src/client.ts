import { PrismaClient } from "@prisma/client";

const globalRef = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalRef.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalRef.prisma = prisma;
}
