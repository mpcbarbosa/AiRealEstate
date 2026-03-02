import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

function getPrisma(): PrismaClient {
  if (globalThis.__prisma) return globalThis.__prisma
  const client = new PrismaClient({ log: ['error'] })
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = client
  }
  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    const value = (client as any)[prop]
    if (typeof value === 'function') return value.bind(client)
    return value
  }
})
