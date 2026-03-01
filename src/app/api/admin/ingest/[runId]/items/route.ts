import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { runId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const items = await prisma.ingestItem.findMany({
    where: { ingestRunId: params.runId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(items)
}
