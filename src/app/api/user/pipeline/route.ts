import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  listingMasterId: z.string(),
  status: z.enum(['NONE', 'FAVORITE', 'TO_CONTACT', 'CONTACTED', 'NOT_INTERESTED', 'CLOSED']).optional(),
  favorite: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const userListing = await prisma.userListing.upsert({
      where: { userId_listingMasterId: { userId, listingMasterId: data.listingMasterId } },
      create: {
        userId,
        listingMasterId: data.listingMasterId,
        status: data.status || 'NONE',
        favorite: data.favorite || false,
      },
      update: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.favorite !== undefined && { favorite: data.favorite }),
      },
    })

    return NextResponse.json(userListing)
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
