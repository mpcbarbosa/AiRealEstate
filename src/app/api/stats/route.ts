import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Total counts
  const [totalActive, totalOff, totalNoPrice, totalNoLocation, totalNoDescription, totalWithGeo] = await Promise.all([
    prisma.listingMaster.count({ where: { active: true } }),
    prisma.listingMaster.count({ where: { active: false } }),
    prisma.listingMaster.count({ where: { priceEur: null } }),
    prisma.listingMaster.count({ where: { locationRegiao: null, locationConcelho: null, locationText: null } }),
    prisma.listingMaster.count({ where: { description: null } }),
    prisma.listingMaster.count({ where: { lat: { not: null }, lng: { not: null } } }),
  ])

  // By concelho (top 30)
  const byConcelho = await prisma.$queryRaw`
    SELECT "locationConcelho" as concelho, "locationRegiao" as regiao, 
           COUNT(*)::int as total,
           COUNT(*) FILTER (WHERE active = true)::int as ativos,
           ROUND(AVG("priceEur") FILTER (WHERE "priceEur" IS NOT NULL AND "businessType" = 'buy'))::int as preco_medio_compra,
           ROUND(AVG("priceEur") FILTER (WHERE "priceEur" IS NOT NULL AND "businessType" = 'rent'))::int as preco_medio_renda
    FROM listing_masters
    WHERE "locationConcelho" IS NOT NULL
    GROUP BY "locationConcelho", "locationRegiao"
    ORDER BY total DESC
    LIMIT 30
  ` as any[]

  // By região
  const byRegiao = await prisma.$queryRaw`
    SELECT "locationRegiao" as regiao,
           COUNT(*)::int as total,
           COUNT(*) FILTER (WHERE active = true)::int as ativos,
           COUNT(DISTINCT "locationConcelho")::int as concelhos
    FROM listing_masters
    WHERE "locationRegiao" IS NOT NULL
    GROUP BY "locationRegiao"
    ORDER BY total DESC
  ` as any[]

  // By source (portal)
  const bySource = await prisma.$queryRaw`
    SELECT ls."sourceName" as fonte, ls."sourceFamily" as familia,
           COUNT(DISTINCT ls."listingMasterId")::int as total
    FROM listing_sources ls
    GROUP BY ls."sourceName", ls."sourceFamily"
    ORDER BY total DESC
  ` as any[]

  // By property type
  const byPropertyType = await prisma.$queryRaw`
    SELECT "propertyType" as tipo, "businessType" as negocio,
           COUNT(*)::int as total
    FROM listing_masters
    WHERE active = true
    GROUP BY "propertyType", "businessType"
    ORDER BY total DESC
  ` as any[]

  // By typology
  const byTypology = await prisma.$queryRaw`
    SELECT typology, COUNT(*)::int as total
    FROM listing_masters
    WHERE active = true AND typology IS NOT NULL
    GROUP BY typology
    ORDER BY typology
  ` as any[]

  // Data quality: fields populated
  const quality = await prisma.$queryRaw`
    SELECT 
      COUNT(*)::int as total,
      COUNT("priceEur")::int as com_preco,
      COUNT("areaM2")::int as com_area,
      COUNT("description")::int as com_descricao,
      COUNT("floor")::int as com_andar,
      COUNT("bathrooms")::int as com_wcs,
      COUNT("hasElevator")::int as com_elevador,
      COUNT("parkingSpaces")::int as com_estacionamento,
      COUNT(CASE WHEN lat IS NOT NULL AND lng IS NOT NULL THEN 1 END)::int as com_gps,
      COUNT("locationRegiao")::int as com_regiao,
      COUNT("locationConcelho")::int as com_concelho,
      COUNT("locationFreguesia")::int as com_freguesia
    FROM listing_masters
    WHERE active = true
  ` as any[]

  // Recent ingest runs
  const recentRuns = await prisma.ingestRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      source: true,
      status: true,
      received: true,
      created: true,
      updated: true,
      deduped: true,
      rejected: true,
      startedAt: true,
      finishedAt: true,
    },
  })

  return NextResponse.json({
    totals: {
      active: totalActive,
      offMarket: totalOff,
      total: totalActive + totalOff,
      noPrice: totalNoPrice,
      noLocation: totalNoLocation,
      noDescription: totalNoDescription,
      withGeo: totalWithGeo,
    },
    byConcelho,
    byRegiao,
    bySource,
    byPropertyType,
    byTypology,
    quality: quality[0] || {},
    recentRuns,
  })
}
