import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  filtersJson: z.record(z.any()),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id
  const watchlists = await prisma.watchlist.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(watchlists)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const wl = await prisma.watchlist.create({ data: { userId, ...data } })
    return NextResponse.json(wl, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID em falta' }, { status: 400 })
  await prisma.watchlist.deleteMany({ where: { id, userId } })
  return NextResponse.json({ ok: true })
}
