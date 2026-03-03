import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Palavras que indicam anúncio fora do mercado
const OFF_MARKET_SIGNALS = [
  'anúncio não encontrado', 'anuncio nao encontrado',
  'anúncio removido', 'removido pelo anunciante',
  'já não está disponível', 'ja nao esta disponivel',
  'vendido', 'sold', 'arrendado', 'rented',
  'página não encontrada', 'not found', '404',
  'este imóvel já não se encontra disponível',
  'listing not available', 'property not available',
  'imóvel vendido', 'imóvel arrendado',
]

async function checkUrl(url: string): Promise<'active' | 'sold' | 'removed' | 'unreachable'> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImoRadar/1.0)' },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (res.status === 404 || res.status === 410) return 'removed'
    if (!res.ok) return 'unreachable'

    const html = (await res.text()).toLowerCase()
    for (const signal of OFF_MARKET_SIGNALS) {
      if (html.includes(signal)) {
        if (signal.includes('vend') || signal.includes('sold')) return 'sold'
        return 'removed'
      }
    }
    return 'active'
  } catch {
    return 'unreachable'
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const limit = body.limit || 20 // verificar N anúncios por run

  // Buscar anúncios ativos mais antigos (os que há mais tempo não foram verificados)
  const sources = await prisma.listingSource.findMany({
    where: {
      listingMaster: { active: true },
    },
    orderBy: { updatedAt: 'asc' },
    take: limit,
    select: { id: true, sourceUrl: true, listingMasterId: true, updatedAt: true },
  })

  const stats = { checked: 0, stillActive: 0, markedOffMarket: 0, unreachable: 0 }

  for (const source of sources) {
    const status = await checkUrl(source.sourceUrl)
    stats.checked++

    if (status === 'active') {
      stats.stillActive++
      // Atualizar updatedAt para não re-verificar tão cedo
      await prisma.listingSource.update({ where: { id: source.id }, data: { updatedAt: new Date() } })
    } else if (status === 'unreachable') {
      stats.unreachable++
    } else {
      // sold ou removed — marcar off-market
      try {
        await prisma.listingMaster.update({
          where: { id: source.listingMasterId },
          data: { active: false, offMarketAt: new Date(), offMarketReason: status },
        })
      } catch {
        await prisma.listingMaster.update({
          where: { id: source.listingMasterId },
          data: { active: false },
        })
      }
      stats.markedOffMarket++
    }
  }

  return NextResponse.json({ ok: true, ...stats })
}

// GET — quantos anúncios estão ativos vs off-market
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const [active, offMarket, soldCount, removedCount] = await Promise.all([
    prisma.listingMaster.count({ where: { active: true } }),
    prisma.listingMaster.count({ where: { active: false } }),
    prisma.listingMaster.count({ where: { active: false, offMarketReason: 'sold' } }).catch(() => 0),
    prisma.listingMaster.count({ where: { active: false, offMarketReason: 'removed' } }).catch(() => 0),
  ])

  return NextResponse.json({ active, offMarket, soldCount, removedCount })
}
