import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const [
    totalListings,
    listingsByBusiness,
    listingsByStatus,
    recentListings,
    pipelineCounts,
    recentIngest,
    priceHistory,
  ] = await Promise.all([
    prisma.listingMaster.count({ where: { active: true } }),
    prisma.listingMaster.groupBy({ by: ['businessType'], where: { active: true }, _count: true }),
    prisma.listingMaster.groupBy({ by: ['propertyType'], where: { active: true }, _count: true }),
    prisma.listingMaster.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { sources: { select: { sourceName: true, images: true }, take: 1 } },
    }),
    prisma.userListing.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
    prisma.ingestRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
    }),
    prisma.listingHistory.findMany({
      where: { changeType: 'PRICE_CHANGE' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { listingMaster: { select: { id: true, title: true } } },
    }),
  ])

  const avgPrice = await prisma.listingMaster.aggregate({
    where: { active: true, businessType: 'buy', priceEur: { not: null } },
    _avg: { priceEur: true },
  })

  const avgRent = await prisma.listingMaster.aggregate({
    where: { active: true, businessType: 'rent', priceEur: { not: null } },
    _avg: { priceEur: true },
  })

  return (
    <DashboardClient
      stats={{
        totalListings,
        avgPrice: avgPrice._avg.priceEur,
        avgRent: avgRent._avg.priceEur,
        listingsByBusiness,
        listingsByStatus,
        pipelineCounts,
        recentListings,
        recentIngest,
        priceHistory,
      }}
    />
  )
}
