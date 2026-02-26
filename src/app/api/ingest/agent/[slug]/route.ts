import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { generateDedupeHash, normalizeBusinessType, normalizePropertyType } from '@/lib/dedupe'
import { matchListingToWatchlists, notifyPriceDrop } from '@/lib/watchlist-matcher'
import crypto from 'crypto'
import { z } from 'zod'

// Validar assinatura HMAC-SHA256
function validateSignature(body: string, secret: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

const IngestItemSchema = z.object({
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
  geo: z.object({ lat: z.number().nullable().optional(), lng: z.number().nullable().optional() }).optional().nullable(),
  features: z.record(z.any()).nullable().optional(),
  contacts: z.object({
    agencyName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    contactUrl: z.string().nullable().optional(),
  }).optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1).optional().default(1),
  raw: z.record(z.any()).optional(),
})

async function processItem(rawItem: any, ingestRunId: string, agentSourceName?: string | null, agentSourceFamily?: string | null) {
  const parsed = IngestItemSchema.safeParse(rawItem)
  if (!parsed.success) {
    await prisma.ingestItem.create({
      data: {
        ingestRunId,
        sourceUrl: rawItem?.sourceUrl,
        result: 'REJECTED',
        reason: parsed.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; '),
        rawPayload: rawItem,
      },
    })
    return { result: 'REJECTED' as const, reason: parsed.error.errors[0]?.message }
  }

  const item = parsed.data
  // sourceName e sourceFamily do agente como fallback
  const sourceName = item.sourceName || agentSourceName
  const sourceFamily = item.sourceFamily || agentSourceFamily
  const businessType = normalizeBusinessType(item.businessType)
  const propertyType = normalizePropertyType(item.propertyType)
  const dedupeHash = generateDedupeHash({ ...item, sourceName })

  // UPDATE — sourceUrl já existe
  const existingSource = await prisma.listingSource.findUnique({
    where: { sourceUrl: item.sourceUrl },
    include: { listingMaster: true },
  })

  if (existingSource) {
    const master = existingSource.listingMaster
    const historyEntries: any[] = []
    let priceDrop = false
    const oldPrice = master.priceEur || 0

    if (item.priceEur != null && master.priceEur != null && Math.abs(item.priceEur - master.priceEur) > 1) {
      historyEntries.push({ listingMasterId: master.id, changeType: 'PRICE_CHANGE', fieldName: 'priceEur', oldValue: String(master.priceEur), newValue: String(item.priceEur) })
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

    await prisma.listingSource.update({
      where: { id: existingSource.id },
      data: {
        images: item.images.length > 0 ? item.images : existingSource.images,
        contacts: (item.contacts as any) || existingSource.contacts,
        rawPayload: (item.raw as any) || null,
        capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date(),
      },
    })

    if (historyEntries.length > 0) await prisma.listingHistory.createMany({ data: historyEntries })
    if (priceDrop && item.priceEur != null) await notifyPriceDrop(master.id, master.title, oldPrice, item.priceEur)

    await prisma.ingestItem.create({ data: { ingestRunId, sourceUrl: item.sourceUrl, result: 'UPDATED', listingId: master.id } })
    return { result: 'UPDATED' as const, listingId: master.id }
  }

  // DEDUPED — hash já existe
  const existingByHash = await prisma.listingMaster.findUnique({ where: { dedupeHash } })
  if (existingByHash) {
    await prisma.listingSource.create({
      data: { listingMasterId: existingByHash.id, sourceFamily, sourceName, sourceUrl: item.sourceUrl, sourceExternalId: item.sourceExternalId, contacts: (item.contacts as any) || null, images: item.images, rawPayload: (item.raw as any) || null, capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date() },
    })
    await prisma.ingestItem.create({ data: { ingestRunId, sourceUrl: item.sourceUrl, result: 'DEDUPED', reason: 'Hash duplicado', listingId: existingByHash.id } })
    return { result: 'DEDUPED' as const, listingId: existingByHash.id }
  }

  // CREATED — novo imóvel
  const master = await prisma.listingMaster.create({
    data: { title: item.title, description: item.description, businessType, propertyType, typology: item.typology, priceEur: item.priceEur, areaM2: item.areaM2, locationText: item.locationText, lat: item.geo?.lat, lng: item.geo?.lng, features: (item.features as any) || null, confidence: item.confidence, dedupeHash, active: true },
  })

  await prisma.listingSource.create({
    data: { listingMasterId: master.id, sourceFamily, sourceName, sourceUrl: item.sourceUrl, sourceExternalId: item.sourceExternalId, contacts: (item.contacts as any) || null, images: item.images, rawPayload: (item.raw as any) || null, capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date() },
  })

  await prisma.listingHistory.create({ data: { listingMasterId: master.id, changeType: 'CREATED', note: `Criado via agente ${sourceName || 'desconhecido'}` } })
  await prisma.ingestItem.create({ data: { ingestRunId, sourceUrl: item.sourceUrl, result: 'CREATED', listingId: master.id } })

  await matchListingToWatchlists({ id: master.id, title: master.title, businessType: master.businessType, propertyType: master.propertyType, typology: master.typology, priceEur: master.priceEur, areaM2: master.areaM2, locationText: master.locationText, description: master.description }, true)

  return { result: 'CREATED' as const, listingId: master.id }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`agent:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })
  }

  // Encontrar agente pelo slug
  const agent = await prisma.agent.findUnique({ where: { slug: params.slug } })
  if (!agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
  if (!agent.active) return NextResponse.json({ error: 'Agente inativo' }, { status: 403 })

  // Ler body como texto para validar HMAC
  const rawBody = await req.text()
  const signature = req.headers.get('x-gobii-signature') || req.headers.get('x-webhook-signature')

  if (!validateSignature(rawBody, agent.webhookSecret, signature)) {
    console.warn(`[AGENT:${agent.slug}] Assinatura inválida`)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let body: any
  try { body = JSON.parse(rawBody) }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const items: any[] = Array.isArray(body) ? body : body.items || [body]
  if (items.length === 0) return NextResponse.json({ error: 'Sem items' }, { status: 400 })

  const ingestRun = await prisma.ingestRun.create({
    data: { source: agent.slug, agentId: agent.id, received: items.length, status: 'PROCESSING' },
  })

  let created = 0, updated = 0, deduped = 0, rejected = 0
  const errors: string[] = []

  for (const rawItem of items) {
    try {
      const result = await processItem(rawItem, ingestRun.id, agent.sourceName, agent.sourceFamily)
      if (result.result === 'CREATED') created++
      else if (result.result === 'UPDATED') updated++
      else if (result.result === 'DEDUPED') deduped++
      else { rejected++; if (result.reason) errors.push(result.reason) }
    } catch (err: any) {
      rejected++
      errors.push(err.message)
      await prisma.ingestItem.create({ data: { ingestRunId: ingestRun.id, sourceUrl: rawItem?.sourceUrl, result: 'REJECTED', reason: err.message, rawPayload: rawItem } })
    }
  }

  await prisma.ingestRun.update({
    where: { id: ingestRun.id },
    data: { status: 'DONE', created, updated, deduped, rejected, errors: errors.length > 0 ? errors as any : null, finishedAt: new Date() },
  })

  console.log(`[AGENT:${agent.slug}] +${created} ~${updated} =${deduped} x${rejected}`)
  return NextResponse.json({ ingestRunId: ingestRun.id, received: items.length, created, updated, deduped, rejected, errors })
}
