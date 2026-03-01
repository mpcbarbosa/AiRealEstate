import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  const listing = await prisma.listingMaster.findUnique({
    where: { id: params.id },
    include: {
      sources: true,
      history: { orderBy: { createdAt: 'desc' }, take: 50 },
      userListings: { where: { userId } },
      notes: { where: { userId }, orderBy: { createdAt: 'desc' } },
      tasks: { where: { userId }, orderBy: { dueDate: 'asc' } },
    },
  })

  if (!listing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(listing)
}
