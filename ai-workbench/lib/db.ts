/**
 * Prisma Database Client
 * Singleton pattern to avoid multiple instances in development
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper function to safely parse JSON from database
 */
export function parseJson<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Helper function to safely stringify for database
 */
export function stringifyJson(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify JSON:', error);
    return '{}';
  }
}

export default prisma;
