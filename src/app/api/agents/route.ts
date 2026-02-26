import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function requireAdmin(session: any) {
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  return null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const err = requireAdmin(session); if (err) return err

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { ingestRuns: true } },
      ingestRuns: {
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: { startedAt: true, status: true, created: true, received: true },
      },
    },
  })
  return NextResponse.json(agents)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const err = requireAdmin(session); if (err) return err

  const { name, description, sourceFamily, sourceName } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  // Gerar slug único a partir do nome
  const baseSlug = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remover acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Garantir unicidade do slug
  let slug = baseSlug
  let i = 1
  while (await prisma.agent.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`
  }

  // Gerar webhook secret
  const webhookSecret = crypto.randomBytes(32).toString('hex')

  const agent = await prisma.agent.create({
    data: { name, slug, description, sourceFamily, sourceName, webhookSecret },
  })

  return NextResponse.json({ ...agent }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const err = requireAdmin(session); if (err) return err

  const { id, name, description, sourceFamily, sourceName, active, regenerateSecret } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const data: any = {}
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description
  if (sourceFamily !== undefined) data.sourceFamily = sourceFamily
  if (sourceName !== undefined) data.sourceName = sourceName
  if (active !== undefined) data.active = active
  if (regenerateSecret) data.webhookSecret = crypto.randomBytes(32).toString('hex')

  const agent = await prisma.agent.update({ where: { id }, data })
  return NextResponse.json(agent)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const err = requireAdmin(session); if (err) return err

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.agent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
