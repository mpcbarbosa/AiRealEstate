import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  done: z.boolean().optional(),
  title: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const task = await prisma.task.findUnique({ where: { id: params.id } })
  if (!task || task.userId !== session.user.id) {
    return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
  }

  const body = await req.json()
  const data = updateSchema.parse(body)

  const updated = await prisma.task.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const task = await prisma.task.findUnique({ where: { id: params.id } })
  if (!task || task.userId !== session.user.id) {
    return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
  }

  await prisma.task.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
