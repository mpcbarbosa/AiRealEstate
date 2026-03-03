import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ notifications: [], unreadCount: 0 })
    const userId = (session.user as any).id
    const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true'
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, ...(unreadOnly ? { read: false } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          listingMaster: { select: { id: true, title: true, priceEur: true, locationText: true } },
          watchlist: { select: { name: true } },
        },
      }),
      prisma.notification.count({ where: { userId, read: false } }),
    ])
    return NextResponse.json({ notifications, unreadCount })
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    const userId = (session.user as any).id
    const { id, readAll } = await req.json()
    if (readAll) {
      await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
    } else if (id) {
      await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
