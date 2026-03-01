import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: { id: true, name: true, key: true, createdAt: true, lastUsedAt: true, active: true },
    orderBy: { createdAt: 'desc' },
  })

  // Mask keys except last 8 chars
  return NextResponse.json(
    keys.map((k: any) => ({ ...k, key: '••••••••••••••••' + k.key.slice(-8) }))
  )
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  const body = await req.json().catch(() => ({}))
  const name = body.name || 'Gobii Key'
  const key = 'imo_' + crypto.randomBytes(32).toString('hex')

  const apiKey = await prisma.apiKey.create({ data: { userId, key, name } })
  // Return full key only once
  return NextResponse.json({ ...apiKey, key }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID em falta' }, { status: 400 })
  await prisma.apiKey.deleteMany({ where: { id, userId } })
  return NextResponse.json({ ok: true })
}
