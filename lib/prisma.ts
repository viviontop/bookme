import { PrismaClient, type Prisma } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const clientOptions: Prisma.PrismaClientOptions = {};
if (process.env.DATABASE_URL) {
  // Provide the runtime datasource URL when available (server/deployment)
  // Prisma may require a runtime datasource when the generated client can't auto-detect it.
  // Keep this conditional to avoid constructor option issues in some environments.
  // @ts-ignore - allow passing datasources when present
  clientOptions.datasources = { db: { url: process.env.DATABASE_URL } } as any;
}

const prisma = globalThis.__prisma ?? new PrismaClient(clientOptions);
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma;

export default prisma;
