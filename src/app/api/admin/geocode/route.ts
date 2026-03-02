import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function geocodeAddress(locationText: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${locationText}, Portugal`)
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=pt`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ImoRadar/1.0 (imobiliario CRM)' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Buscar imóveis sem coordenadas mas com locationText
  const listings = await prisma.listingMaster.findMany({
    where: {
      lat: null,
      locationText: { not: null },
    },
    select: { id: true, locationText: true },
    take: 50, // processar 50 de cada vez (rate limit Nominatim: 1 req/s)
  })

  if (listings.length === 0) {
    return NextResponse.json({ message: 'Todos os imóveis já têm coordenadas', updated: 0 })
  }

  let updated = 0
  let failed = 0

  for (const listing of listings) {
    if (!listing.locationText) continue
    
    const coords = await geocodeAddress(listing.locationText)
    
    if (coords) {
      await prisma.listingMaster.update({
        where: { id: listing.id },
        data: { lat: coords.lat, lng: coords.lng },
      })
      updated++
    } else {
      failed++
    }

    // Respeitar rate limit do Nominatim (1 req/s)
    await new Promise(r => setTimeout(r, 1100))
  }

  return NextResponse.json({
    message: `Geocodificação concluída`,
    updated,
    failed,
    remaining: await prisma.listingMaster.count({ where: { lat: null, locationText: { not: null } } }),
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const withGps = await prisma.listingMaster.count({ where: { lat: { not: null } } })
  const withoutGps = await prisma.listingMaster.count({ where: { lat: null, locationText: { not: null } } })
  const noLocation = await prisma.listingMaster.count({ where: { lat: null, locationText: null } })

  return NextResponse.json({ withGps, withoutGps, noLocation })
}
