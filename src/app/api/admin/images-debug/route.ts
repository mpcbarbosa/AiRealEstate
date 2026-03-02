import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sources = await prisma.listingSource.findMany({
    where: { images: { not: [] } },
    select: { sourceName: true, images: true },
    take: 20,
  })

  // Agregar domínios únicos
  const domains: Record<string, number> = {}
  const sampleUrls: string[] = []

  for (const s of sources) {
    const imgs = s.images as string[]
    for (const img of imgs.slice(0, 3)) {
      try {
        const host = new URL(img).hostname
        domains[host] = (domains[host] || 0) + 1
        if (sampleUrls.length < 5) sampleUrls.push(img)
      } catch {}
    }
  }

  // Testar se o proxy consegue buscar 1 imagem de cada domínio
  const tested: Record<string, string> = {}
  for (const [domain, sampleUrl] of Object.entries(
    Object.fromEntries(sampleUrls.map(u => [new URL(u).hostname, u]))
  )) {
    try {
      const res = await fetch(sampleUrl as string, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': `https://${domain}/`,
        },
        signal: AbortSignal.timeout(5000),
      })
      tested[domain] = `${res.status} ${res.statusText}`
    } catch (e: any) {
      tested[domain] = `ERROR: ${e.message}`
    }
  }

  return NextResponse.json({ domains, sampleUrls, tested })
}
