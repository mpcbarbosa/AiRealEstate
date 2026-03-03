import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function downloadAndStore(img: string, sourceId: string, index: number): Promise<string> {
  if (img.startsWith('/api/images/')) return img // já guardado
  if (img.startsWith('data:')) return img // base64 sem processar (não devia acontecer)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(img, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImoRadar/1.0)',
        'Referer': new URL(img).origin,
      },
    })
    clearTimeout(timeout)
    if (!res.ok) return img

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const mimeType = contentType.split(';')[0].trim()
    if (!mimeType.startsWith('image/')) return img

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length > 5 * 1024 * 1024) return img

    const stored = await prisma.storedImage.upsert({
      where: { sourceId_index: { sourceId, index } },
      create: { sourceId, index, mimeType, data: buffer, size: buffer.length },
      update: { mimeType, data: buffer, size: buffer.length },
    })
    return `/api/images/${stored.id}`
  } catch {
    return img
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Buscar sources com URLs externas (não /api/images/)
  const sources = await prisma.listingSource.findMany({
    select: { id: true, sourceUrl: true, images: true },
    where: { images: { isEmpty: false } },
  })

  const toProcess = sources.filter(s =>
    (s.images as string[]).some(img => img.startsWith('http'))
  )

  let processed = 0, updated = 0, failed = 0

  for (const source of toProcess) {
    const images = source.images as string[]
    const newImages: string[] = []
    let changed = false

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (img.startsWith('http')) {
        const result = await downloadAndStore(img, source.id, i)
        newImages.push(result)
        if (result !== img) changed = true
        else failed++
      } else {
        newImages.push(img)
      }
    }

    if (changed) {
      await prisma.listingSource.update({
        where: { id: source.id },
        data: { images: newImages },
      })
      updated++
    }
    processed++
  }

  return NextResponse.json({
    ok: true,
    total: sources.length,
    toProcess: toProcess.length,
    processed,
    updated,
    failed,
  })
}

// GET para ver quantos precisam de reprocessamento
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sources = await prisma.listingSource.findMany({
    select: { images: true },
    where: { images: { isEmpty: false } },
  })

  const withExternalUrls = sources.filter(s =>
    (s.images as string[]).some(img => img.startsWith('http'))
  ).length

  const withStoredImages = sources.filter(s =>
    (s.images as string[]).every(img => img.startsWith('/api/images/'))
  ).length

  const withNoImages = await prisma.listingSource.count({
    where: { images: { isEmpty: true } },
  })

  return NextResponse.json({ withExternalUrls, withStoredImages, withNoImages, total: sources.length })
}
