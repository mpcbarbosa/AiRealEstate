import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

function createPrisma() {
  return new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL + (
          process.env.DATABASE_URL?.includes('?') ? '&' : '?'
        ) + 'connection_limit=3&pool_timeout=10',
      },
    },
  })
}

function getPrisma(): PrismaClient {
  if (globalThis.__prisma) return globalThis.__prisma
  const client = createPrisma()
  globalThis.__prisma = client
  return client
}

export const prisma = getPrisma()
