import { PrismaClient } from '@prisma/client'

// Durante o build do Next.js, não inicializar o Prisma
// Isto evita o erro "PrismaClient did not initialize yet" no Collecting page data
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

declare global {
  var __prisma: PrismaClient | undefined
}

function createPrismaClient() {
  if (isBuildPhase) {
    // Retornar um mock durante o build
    return {} as PrismaClient
  }
  
  if (globalThis.__prisma) return globalThis.__prisma
  
  const client = new PrismaClient({ log: ['error'] })
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = client
  }
  return client
}

export const prisma = createPrismaClient()
