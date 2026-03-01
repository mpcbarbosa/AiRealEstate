import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({}, { status: 401 })
  const userId = (session.user as any).id

  const [pipelineCounts, total] = await Promise.all([
    prisma.userListing.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
    prisma.listingMaster.count({ where: { active: true } }),
  ])

  const counts: Record<string, number> = { __total: total }
  for (const row of pipelineCounts) {
    counts[row.status] = row._count
  }

  return NextResponse.json(counts)
}
