import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const note = await prisma.note.findUnique({ where: { id: params.id } })

  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 })
  }

  await prisma.note.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
