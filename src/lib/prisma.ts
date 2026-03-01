import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Durante o build, IMORADAR_BUILD=1 é definido no start.sh
// Evita instanciar o Prisma no "Collecting page data"
if (process.env.IMORADAR_BUILD === '1') {
  // Mock durante o build - não instanciar Prisma
  module.exports = { prisma: new Proxy({}, { get: () => () => Promise.resolve([]) }) }
} else {
  const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  module.exports = { prisma }
}
