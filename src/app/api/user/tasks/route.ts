import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  listingMasterId: z.string(),
  title: z.string().min(1),
  dueDate: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string(),
  done: z.boolean().optional(),
  title: z.string().optional(),
  dueDate: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const task = await prisma.task.create({
      data: {
        userId,
        listingMasterId: data.listingMasterId,
        title: data.title,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })
    return NextResponse.json(task, { status: 201 })
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)
    const task = await prisma.task.updateMany({
      where: { id: data.id, userId },
      data: {
        ...(data.done !== undefined && { done: data.done }),
        ...(data.title && { title: data.title }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      },
    })
    return NextResponse.json(task)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID em falta' }, { status: 400 })
  await prisma.task.deleteMany({ where: { id, userId } })
  return NextResponse.json({ ok: true })
}
