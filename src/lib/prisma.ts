import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  if (typeof window !== 'undefined') {
    throw new Error('Prisma não pode ser usado no cliente')
  }
  
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }
  
  return global.__prisma
}

// Export lazy - só instancia quando chamado, não quando importado
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
