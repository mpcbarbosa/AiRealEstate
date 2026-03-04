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
  if (location) where.locationText = { contains: location, mode: 'insensitive' }
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
