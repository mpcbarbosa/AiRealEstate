import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const businessType = searchParams.get('businessType')
  const propertyType = searchParams.get('propertyType')
  const typology = searchParams.get('typology')
  const location = searchParams.get('location')
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')
  const areaMin = searchParams.get('areaMin')
  const areaMax = searchParams.get('areaMax')
  const keywords = searchParams.get('keywords')
  const status = searchParams.get('status')
  const orderBy = searchParams.get('orderBy') || 'newest'

  // Por defeito mostra só ativos; ?market=all mostra todos; ?market=off mostra só off-market
  const market = searchParams.get('market') || 'active'
  const where: Record<string, any> = {}
  if (market === 'active') where.active = true
  else if (market === 'off') where.active = false
  // market === 'all' → sem filtro

  if (businessType) where.businessType = businessType
  if (propertyType) where.propertyType = propertyType
  if (typology) where.typology = typology
  if (location) {
    // Múltiplas localizações separadas por vírgula → OR entre localizações
    const locationParts = location.split(',').map((l: string) => l.trim()).filter(Boolean)
    const locationConditions = locationParts.map((loc: string) => {
      // "Lisboa › Misericórdia" → regiao=Lisboa, freguesia=Misericórdia
      const subParts = loc.split('›').map((p: string) => p.trim()).filter(Boolean)
      if (subParts.length === 1) {
        // Só região — filtrar por locationRegiao OU locationConcelho
        return { OR: [
          { locationRegiao: { equals: subParts[0], mode: 'insensitive' as const } },
          { locationConcelho: { equals: subParts[0], mode: 'insensitive' as const } },
          { locationText: { contains: subParts[0], mode: 'insensitive' as const } },
        ]}
      } else if (subParts.length === 2) {
        // Região + Concelho/Freguesia
        return { OR: [
          { AND: [{ locationRegiao: { equals: subParts[0], mode: 'insensitive' as const } }, { locationConcelho: { equals: subParts[1], mode: 'insensitive' as const } }] },
          { AND: [{ locationConcelho: { equals: subParts[0], mode: 'insensitive' as const } }, { locationFreguesia: { equals: subParts[1], mode: 'insensitive' as const } }] },
          { locationFreguesia: { equals: subParts[1], mode: 'insensitive' as const } },
        ]}
      } else {
        return { locationText: { contains: loc, mode: 'insensitive' as const } }
      }
    })
    if (locationConditions.length === 1) {
      Object.assign(where, locationConditions[0])
    } else if (locationConditions.length > 1) {
      where.OR = locationConditions
    }
  }
  if (priceMin || priceMax) {
    where.priceEur = {}
    if (priceMin) where.priceEur.gte = parseFloat(priceMin)
    if (priceMax) where.priceEur.lte = parseFloat(priceMax)
  }
  if (areaMin || areaMax) {
    where.areaM2 = {}
    if (areaMin) where.areaM2.gte = parseFloat(areaMin)
    if (areaMax) where.areaM2.lte = parseFloat(areaMax)
  }
  if (keywords) {
    where.OR = [
      { title: { contains: keywords, mode: 'insensitive' } },
      { description: { contains: keywords, mode: 'insensitive' } },
      { locationText: { contains: keywords, mode: 'insensitive' } },
    ]
  }

  // Filter by pipeline status
  if (status && status !== 'ALL') {
    where.userListings = { some: { userId, status } }
  }

  const orderByMap: Record<string, any> = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    priceAsc: { priceEur: 'asc' },
    priceDesc: { priceEur: 'desc' },
    areaDesc: { areaM2: 'desc' },
  }

  const [listings, total] = await Promise.all([
    prisma.listingMaster.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderByMap[orderBy] || { createdAt: 'desc' },
      include: {
        sources: { select: { id: true, sourceName: true, sourceUrl: true, images: true, publishedAt: true } },
        userListings: { where: { userId }, select: { status: true, favorite: true } },
        _count: { select: { notes: { where: { userId } }, tasks: { where: { userId } } } },
      },
    }),
    prisma.listingMaster.count({ where }),
  ])

  return NextResponse.json({
    listings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
