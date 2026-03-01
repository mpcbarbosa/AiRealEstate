import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  const watchlists = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { notifications: true } } },
  })
  return NextResponse.json(watchlists)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  const { name, filtersJson } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const wl = await prisma.watchlist.create({
    data: { userId, name, filtersJson: filtersJson || {} },
  })
  return NextResponse.json(wl, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  const { id, active } = await req.json()
  const wl = await prisma.watchlist.updateMany({
    where: { id, userId },
    data: { active },
  })
  return NextResponse.json(wl)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.watchlist.deleteMany({ where: { id, userId } })
  return NextResponse.json({ ok: true })
}
