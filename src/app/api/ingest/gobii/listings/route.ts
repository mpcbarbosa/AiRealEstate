import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { generateDedupeHash, normalizeBusinessType, normalizePropertyType } from '@/lib/dedupe'
import { matchListingToWatchlists, notifyPriceDrop } from '@/lib/watchlist-matcher'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const GeoSchema = z.object({
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
}).optional().nullable()

const ContactsSchema = z.object({
  agencyName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  contactUrl: z.string().nullable().optional(),
}).optional().nullable()

const IngestItemSchema = z.object({
  payloadVersion: z.string().optional(),
  itemType: z.string().optional(),
  masterListingId: z.string().optional(),
  capturedAt: z.string().optional(),
  sourceFamily: z.string().nullable().optional(),
  sourceName: z.string().nullable().optional(),
  sourceUrl: z.string().url('sourceUrl deve ser uma URL válida'),
  sourceExternalId: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  businessType: z.string().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  typology: z.string().nullable().optional(),
  priceEur: z.number().nullable().optional(),
  areaM2: z.number().nullable().optional(),
  locationText: z.string().nullable().optional(),
  geo: GeoSchema,
  features: z.record(z.any()).nullable().optional(),
  contacts: ContactsSchema,
  images: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1).optional().default(1),
  hash: z.string().optional(),
  raw: z.record(z.any()).optional(),
})

const IngestPayloadSchema = z.object({
  payloadVersion: z.string().optional(),
  agent: z.string().optional(),
  runId: z.string().optional(),
  source: z.string().default('gobii'),
  capturedAt: z.string().optional(),
  input: z.any().optional(),
  stats: z.any().optional(),
  items: z.array(IngestItemSchema),
})

// ── Processar imagens: base64 → StoredImage, URLs → manter ──────────────────
async function processImages(images: string[], sourceId: string): Promise<string[]> {
  const result: string[] = []

  for (let i = 0; i < images.length; i++) {
    const img = images[i]

    if (img.startsWith('data:')) {
      // Base64: data:image/jpeg;base64,/9j/4AAQ...
      try {
        const [header, b64] = img.split(',')
        if (!b64) { result.push(img); continue }
        const mimeMatch = header.match(/data:([^;]+);base64/)
        const mimeType = mimeMatch?.[1] || 'image/jpeg'
        const buffer = Buffer.from(b64, 'base64')

        // Upsert: se já existir (mesmo sourceId + index), atualizar
        const stored = await prisma.storedImage.upsert({
          where: { sourceId_index: { sourceId, index: i } },
          create: { sourceId, index: i, mimeType, data: buffer, size: buffer.length },
          update: { mimeType, data: buffer, size: buffer.length },
        })
        result.push(`/api/images/${stored.id}`)
      } catch {
        // Falhou a processar base64 — ignorar esta imagem
      }
    } else {
      // URL normal — manter como está
      result.push(img)
    }
  }

  return result
}

// ── Processar um item ────────────────────────────────────────────────────────
async function processItem(item: z.infer<typeof IngestItemSchema>, ingestRunId: string) {
  const businessType = normalizeBusinessType(item.businessType)
  const propertyType = normalizePropertyType(item.propertyType)
  const dedupeHash = generateDedupeHash(item)

  // ── Atualizar fonte existente (UPDATED) ──────────────────────────────────
  const existingSource = await prisma.listingSource.findUnique({
    where: { sourceUrl: item.sourceUrl },
    include: { listingMaster: true },
  })

  if (existingSource) {
    const master = existingSource.listingMaster
    const historyEntries: any[] = []
    let oldPrice = master.priceEur
    let priceDrop = false

    if (item.priceEur != null && master.priceEur != null && item.priceEur !== master.priceEur) {
      historyEntries.push({
        listingMasterId: master.id,
        changeType: 'PRICE_CHANGE',
        fieldName: 'priceEur',
        oldValue: String(master.priceEur),
        newValue: String(item.priceEur),
      })
      priceDrop = item.priceEur < master.priceEur
    }

    await prisma.listingMaster.update({
      where: { id: master.id },
      data: {
        title: item.title || master.title,
        description: item.description || master.description,
        priceEur: item.priceEur ?? master.priceEur,
        areaM2: item.areaM2 ?? master.areaM2,
        locationText: item.locationText || master.locationText,
        lat: item.geo?.lat ?? master.lat,
        lng: item.geo?.lng ?? master.lng,
        typology: item.typology || master.typology,
        businessType: businessType || master.businessType,
        propertyType: propertyType || master.propertyType,
        confidence: item.confidence,
        active: true,
      },
    })

    // Processar imagens (base64 → StoredImage ou manter URLs)
    const finalImages = item.images.length > 0
      ? await processImages(item.images, existingSource.id)
      : (existingSource.images as string[])

    await prisma.listingSource.update({
      where: { id: existingSource.id },
      data: {
        images: finalImages,
        contacts: (item.contacts as any) || existingSource.contacts,
        rawPayload: (item.raw as any) || null,
        capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date(),
      },
    })

    if (historyEntries.length > 0) {
      await prisma.listingHistory.createMany({ data: historyEntries })
    }

    if (priceDrop && item.priceEur != null) {
      await notifyPriceDrop(master.id, master.title, oldPrice, item.priceEur)
    }

    await prisma.ingestItem.create({
      data: { ingestRunId, sourceUrl: item.sourceUrl, result: 'UPDATED', listingId: master.id },
    })
    return { result: 'UPDATED', listingId: master.id }
  }

  // ── Dedupe fuzzy (DEDUPED) ───────────────────────────────────────────────
  const existingByHash = await prisma.listingMaster.findUnique({ where: { dedupeHash } })

  if (existingByHash) {
    const newSource = await prisma.listingSource.create({
      data: {
        listingMasterId: existingByHash.id,
        sourceFamily: item.sourceFamily,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        sourceExternalId: item.sourceExternalId,
        contacts: (item.contacts as any) || null,
        images: [],
        rawPayload: (item.raw as any) || null,
        capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date(),
      },
    })

    const finalImages = await processImages(item.images, newSource.id)
    if (finalImages.length > 0) {
      await prisma.listingSource.update({
        where: { id: newSource.id },
        data: { images: finalImages },
      })
    }

    await prisma.ingestItem.create({
      data: { ingestRunId, sourceUrl: item.sourceUrl, result: 'DEDUPED', reason: 'Hash duplicado', listingId: existingByHash.id },
    })
    return { result: 'DEDUPED', listingId: existingByHash.id }
  }

  // ── Criar novo (CREATED) ─────────────────────────────────────────────────
  const master = await prisma.listingMaster.create({
    data: {
      title: item.title,
      description: item.description,
      businessType,
      propertyType,
      typology: item.typology,
      priceEur: item.priceEur,
      areaM2: item.areaM2,
      locationText: item.locationText,
      lat: item.geo?.lat,
      lng: item.geo?.lng,
      features: (item.features as any) || null,
      confidence: item.confidence,
      dedupeHash,
      active: true,
    },
  })

  const newSource = await prisma.listingSource.create({
    data: {
      listingMasterId: master.id,
      sourceFamily: item.sourceFamily,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      sourceExternalId: item.sourceExternalId,
      contacts: (item.contacts as any) || null,
      images: [],
      rawPayload: (item.raw as any) || null,
      capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date(),
    },
  })

  const finalImages = await processImages(item.images, newSource.id)
  if (finalImages.length > 0) {
    await prisma.listingSource.update({
      where: { id: newSource.id },
      data: { images: finalImages },
    })
  }

  await prisma.listingHistory.create({
    data: {
      listingMasterId: master.id,
      changeType: 'CREATED',
      note: `Criado via Gobii (${item.sourceName || 'desconhecido'})`,
    },
  })

  await matchListingToWatchlists(master.id)

  await prisma.ingestItem.create({
    data: { ingestRunId, sourceUrl: item.sourceUrl, result: 'CREATED', listingId: master.id },
  })
  return { result: 'CREATED', listingId: master.id }
}

// ── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth
  const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('apiKey')
  if (!apiKey) return NextResponse.json({ error: 'API key obrigatória' }, { status: 401 })

  const keyRecord = await prisma.apiKey.findFirst({
    where: { key: apiKey, active: true },
    include: { user: true },
  })
  if (!keyRecord) return NextResponse.json({ error: 'API key inválida' }, { status: 401 })

  const limited = await rateLimit(keyRecord.userId, 100, 60)
  if (limited) return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const parsed = IngestPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten() }, { status: 422 })
  }

  const payload = parsed.data

  // Criar IngestRun
  const run = await prisma.ingestRun.create({
    data: {
      userId: keyRecord.userId,
      source: payload.source || 'gobii',
      agent: payload.agent,
      status: 'PROCESSING',
      itemCount: payload.items.length,
    },
  })

  const stats = { received: payload.items.length, created: 0, updated: 0, deduped: 0, rejected: 0 }
  const errors: any[] = []

  for (const item of payload.items) {
    try {
      const r = await processItem(item, run.id)
      if (r.result === 'CREATED') stats.created++
      else if (r.result === 'UPDATED') stats.updated++
      else if (r.result === 'DEDUPED') stats.deduped++
    } catch (e: any) {
      stats.rejected++
      errors.push({ url: item.sourceUrl, error: e.message })
      await prisma.ingestItem.create({
        data: { ingestRunId: run.id, sourceUrl: item.sourceUrl, result: 'REJECTED', reason: e.message },
      }).catch(() => {})
    }
  }

  await prisma.ingestRun.update({
    where: { id: run.id },
    data: { status: 'DONE', stats: stats as any },
  })

  return NextResponse.json({ runId: run.id, stats, errors: errors.slice(0, 10) })
}
