import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { sourceUrl } = await req.json()
  if (!sourceUrl) return NextResponse.json({ error: 'sourceUrl obrigatório' }, { status: 400 })

  const source = await prisma.listingSource.findUnique({ where: { sourceUrl } })
  if (!source) return NextResponse.json({ error: 'Source não encontrada' }, { status: 404 })

  const deleted = await prisma.storedImage.deleteMany({ where: { sourceId: source.id } })
  await prisma.listingSource.update({ where: { id: source.id }, data: { images: [] } })

  return NextResponse.json({ ok: true, deletedImages: deleted.count, sourceId: source.id })
}
