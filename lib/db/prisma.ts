import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

let unavailable = false;
let warned = false;

export function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    return error.message.includes("Can't reach database server");
  }

  return false;
}

export async function disablePrismaClient(reason: string): Promise<void> {
  if (!warned) {
    console.warn(reason);
    warned = true;
  }

  unavailable = true;

  if (global.prisma) {
    try {
      await global.prisma.$disconnect();
    } catch {
      // no-op
    } finally {
      global.prisma = undefined;
    }
  }
}

export function getPrismaClient(): PrismaClient | null {
  if (unavailable || !process.env.DATABASE_URL) {
    return null;
  }

  try {
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
      });
    }

    return global.prisma;
  } catch (error) {
    console.warn("Prisma initialization failed. Falling back to mock data.");
    unavailable = true;
    return null;
  }
}
