import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
// Using adapter-pg which is required for Prisma v7 when schema url is removed
const adapter = new PrismaPg(pool)

// Use global singleton to prevent multiple instances in dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const prisma = (() => {
    const existing = globalForPrisma.prisma
    // If we have an existing client, check if it has the 'follow' model (added recently)
    // This helps recover from stale global instances during development
    if (existing && (existing as any).follow) {
        return existing
    }
    return new PrismaClient({ adapter })
})()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
