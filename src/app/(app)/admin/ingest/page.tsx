import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminIngestClient from './admin-ingest-client'

export default async function AdminIngestPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if ((session.user as any).role !== 'ADMIN') redirect('/listings')

  const runs = await prisma.ingestRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: { _count: { select: { items: true } } },
  })

  const totals = await prisma.ingestRun.aggregate({
    _sum: { created: true, updated: true, deduped: true, rejected: true, received: true },
  })

  return <AdminIngestClient runs={runs} totals={totals._sum} />
}
