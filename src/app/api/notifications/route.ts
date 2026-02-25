import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true'

  const notifications = await prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      listingMaster: { select: { id: true, title: true, priceEur: true, locationText: true, sources: { select: { images: true }, take: 1 } } },
      watchlist: { select: { name: true } },
    },
  })

  const unreadCount = await prisma.notification.count({ where: { userId, read: false } })

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  const { id, readAll } = await req.json()

  if (readAll) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
  } else if (id) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } })
  }

  return NextResponse.json({ ok: true })
}
