import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import WatchlistsClient from './watchlists-client'

export default async function WatchlistsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const watchlists = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { notifications: true } } },
  })

  return <WatchlistsClient watchlists={watchlists} />
}
