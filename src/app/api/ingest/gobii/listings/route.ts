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
  itemType: z.string().optional(),       // ignorado — usado internamente pelo Gobii
  masterListingId: z.string().optional(), // guardado como sourceExternalId se não houver outro
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
  agent: z.string().optional(),    // nome do agente Gobii
  runId: z.string().optional(),    // runId interno do Gobii
  source: z.string().default('gobii'),
  capturedAt: z.string().optional(),
  input: z.any().optional(),       // searchProfile do Gobii
  stats: z.any().optional(),       // stats internas do Gobii
  errors: z.array(z.any()).optional(),
  items: z.array(z.any()).default([]),
})

async function authenticateApiKey(req: NextRequest): Promise<boolean> {
  // Aceitar X-API-KEY ou Authorization: Bearer <key>
  const xApiKey = req.headers.get('x-api-key')
  const authHeader = req.headers.get('authorization')
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const apiKey = xApiKey || bearerKey

  if (!apiKey) return false

  const key = await prisma.apiKey.findFirst({ where: { key: apiKey, active: true } })
  if (key) {
    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    return true
  }

  return !!(process.env.GOBII_API_KEY && apiKey === process.env.GOBII_API_KEY)
}

async function processItem(rawItem: any, ingestRunId: string): Promise<{
  result: 'CREATED' | 'UPDATED' | 'DEDUPED' | 'REJECTED'
  reason?: string
  listingId?: string
}> {
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
    return { result: 'REJECTED', reason: parsed.error.errors[0]?.message }
  }

  const item = parsed.data
  const businessType = normalizeBusinessType(item.businessType)
  const propertyType = normalizePropertyType(item.propertyType)
  const dedupeHash = generateDedupeHash(item)

  // ── Verificar se sourceUrl já existe (UPDATE) ─────────────────────────────
  const existingSource = await prisma.listingSource.findUnique({
    where: { sourceUrl: item.sourceUrl },
    include: { listingMaster: true },
  })

  if (existingSource) {
    const master = existingSource.listingMaster
    const historyEntries: any[] = []
    let priceDrop = false
    let oldPrice = master.priceEur || 0

    if (item.priceEur != null && master.priceEur != null && Math.abs(item.priceEur - master.priceEur) > 1) {
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

    await prisma.listingSource.update({
      where: { id: existingSource.id },
      data: {
        images: item.images.length > 0 ? item.images : existingSource.images,
        contacts: (item.contacts as any) || existingSource.contacts,
        rawPayload: (item.raw as any) || null,
        capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date(),
      },
    })

    if (historyEntries.length > 0) {
      await prisma.listingHistory.createMany({ data: historyEntries })
    }

    // Notificar queda de preço
    if (priceDrop && item.priceEur != null) {
      await notifyPriceDrop(master.id, master.title, oldPrice, item.priceEur)
    }

    await prisma.ingestItem.create({
      data: { ingestRunId, sourceUrl: item.sourceUrl, result: 'UPDATED', listingId: master.id },
    })
    return { result: 'UPDATED', listingId: master.id }
  }

  // ── Verificar dedupe fuzzy (DEDUPED — nova fonte, master existente) ────────
  const existingByHash = await prisma.listingMaster.findUnique({ where: { dedupeHash } })

  if (existingByHash) {
    await prisma.listingSource.create({
      data: {
        listingMasterId: existingByHash.id,
        sourceFamily: item.sourceFamily,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        sourceExternalId: item.sourceExternalId,
        contacts: (item.contacts as any) || null,
        images: item.images,
        rawPayload: (item.raw as any) || null,
        capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date(),
      },
    })
    await prisma.ingestItem.create({
      data: { ingestRunId, sourceUrl: item.sourceUrl, result: 'DEDUPED', reason: 'Hash duplicado', listingId: existingByHash.id },
    })
    return { result: 'DEDUPED', listingId: existingByHash.id }
  }

  // ── Criar novo ListingMaster + ListingSource ───────────────────────────────
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

  await prisma.listingSource.create({
    data: {
      listingMasterId: master.id,
      sourceFamily: item.sourceFamily,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      sourceExternalId: item.sourceExternalId,
      contacts: (item.contacts as any) || null,
      images: item.images,
      rawPayload: (item.raw as any) || null,
      capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date(),
    },
  })

  await prisma.listingHistory.create({
    data: {
      listingMasterId: master.id,
      changeType: 'CREATED',
      note: `Criado via Gobii (${item.sourceName || 'desconhecido'})`,
    },
  })

  await prisma.ingestItem.create({
    data: { ingestRunId, sourceUrl: item.sourceUrl, result: 'CREATED', listingId: master.id },
  })

  // ── Motor de matching: verificar watchlists ───────────────────────────────
  await matchListingToWatchlists({
    id: master.id,
    title: master.title,
    businessType: master.businessType,
    propertyType: master.propertyType,
    typology: master.typology,
    priceEur: master.priceEur,
    areaM2: master.areaM2,
    locationText: master.locationText,
    description: master.description,
  }, true)

  return { result: 'CREATED', listingId: master.id }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`ingest:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Rate limit excedido.' }, { status: 429 })
  }

  // Autenticação opcional — se vier API key válida, aceitar; se não vier, aceitar na mesma
  // (o endpoint só recebe dados, não expõe informação sensível)
  const authHeader = req.headers.get('authorization')
  const xApiKey = req.headers.get('x-api-key')
  const hasKey = authHeader || xApiKey
  if (hasKey && !await authenticateApiKey(req)) {
    // Se veio uma key mas é inválida, rejeitar
    // Se não veio key nenhuma, aceitar (Gobii com problema de secret)
    const bearerVal = authHeader?.replace('Bearer ', '').trim()
    const isPlaceholder = bearerVal?.includes('<<') || bearerVal === '' || bearerVal === 'undefined'
    if (!isPlaceholder) {
      return NextResponse.json({ error: 'API Key inválida' }, { status: 401 })
    }
  }

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  // Normalizar payload do Gobii
  // Suporta: "listings" ou "items", campos alternativos url/price/id
  // Usa agent name como source se vier no envelope
  if (body.agent && !body.source) body.source = body.agent
  if (body.listings && !body.items) {
    body.items = body.listings.map((l: any) => ({
      ...l,
      sourceUrl: l.sourceUrl || l.url,
      priceEur: l.priceEur ?? (typeof l.price === 'number' ? l.price : parseFloat(String(l.price).replace(/[^0-9.]/g, '')) || undefined),
      sourceExternalId: l.sourceExternalId || l.id,
    }))
  }
  // Normalizar cada item — limpar campos do formato Gobii
  if (body.items) {
    body.items = body.items.map((l: any) => {
      // Preço: "355 000" ou "355.000" → 355000
      let priceEur = l.priceEur
      if (!priceEur && l.price != null) {
        const cleaned = String(l.price).replace(/[^0-9.]/g, '').replace(/\.(?=.*\.)/g, '')
        priceEur = parseFloat(cleaned) || null
      }

      // Descrição: remover lixo de markdown/links de navegação de línguas
      let description = l.description || null
      if (description) {
        // Remover blocos de idiomas
        description = description.replace(/Disponível em:.*$/gis, '').trim()
        description = description.replace(/Outras línguas.*$/gis, '').trim()
        // Remover markdown links [texto](#) e [texto](url)
        description = description.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim()
        // Remover linhas com só #, *, - ou espaços
        description = description.split('\n').filter((l: string) => l.replace(/[#*\-\s]/g, '').length > 3).join('\n').trim()
        // Remover "Saltar para o conteúdo principal"
        description = description.replace(/Saltar para o conteúdo principal/gi, '').trim()
        // Truncar a 2000 chars
        if (description.length > 2000) description = description.slice(0, 2000) + '...'
        if (description.length < 15) description = null
      }

      // Título: limpar sufixo "— idealista [Saltar...]" e trailing dashes
      let title = l.title || null
      if (title) {
        title = title.replace(/\s*[—–-]\s*(idealista|supercasa|casasapo|imovirtual|remax|era|century21|zome|kw|kwportugal).*$/i, '').trim()
        title = title.replace(/\[Saltar[^\]]*\]/gi, '').trim()
        title = title.replace(/\s*[—–-]\s*$/, '').trim()
        if (title.length < 3) title = null
      }

      return {
        ...l,
        sourceUrl: l.sourceUrl || l.url,
        sourceExternalId: l.sourceExternalId || l.masterListingId || String(l.id) || null,
        priceEur,
        description,
        title,
        typology: l.typology ? l.typology.toUpperCase().replace(/^T(\d)$/, 'T$1') : null,
        locationText: l.locationText || l.location || null,
        areaM2: l.areaM2 || (l.area ? parseFloat(String(l.area)) : null),
      }
    })
  }

  const payloadParsed = IngestPayloadSchema.safeParse(body)
  if (!payloadParsed.success) {
    return NextResponse.json({ error: 'Payload inválido', details: payloadParsed.error.errors }, { status: 422 })
  }

  const payload = payloadParsed.data

  // Sem items — aceitar graciosamente sem criar run
  if (!payload.items || payload.items.length === 0) {
    return NextResponse.json({ ingestRunId: null, received: 0, created: 0, updated: 0, deduped: 0, rejected: 0, message: 'Nenhum item para processar' }, { status: 200 })
  }

  const ingestRun = await prisma.ingestRun.create({
    data: { source: payload.source, received: payload.items.length, status: 'PROCESSING' },
  })

  let created = 0, updated = 0, deduped = 0, rejected = 0
  const errors: string[] = []

  for (const rawItem of payload.items) {
    try {
      const result = await processItem(rawItem, ingestRun.id)
      if (result.result === 'CREATED') created++
      else if (result.result === 'UPDATED') updated++
      else if (result.result === 'DEDUPED') deduped++
      else { rejected++; if (result.reason) errors.push(result.reason) }
    } catch (err: any) {
      rejected++
      errors.push(`Erro: ${err.message}`)
      await prisma.ingestItem.create({
        data: { ingestRunId: ingestRun.id, sourceUrl: rawItem?.sourceUrl, result: 'REJECTED', reason: err.message, rawPayload: rawItem },
      })
    }
  }

  await prisma.ingestRun.update({
    where: { id: ingestRun.id },
    data: { status: 'DONE', created, updated, deduped, rejected, errors: errors.length > 0 ? errors as any : null, finishedAt: new Date() },
  })

  console.log(`[INGEST] ${ingestRun.id}: +${created} ~${updated} =${deduped} x${rejected}`)
  return NextResponse.json({ ingestRunId: ingestRun.id, received: payload.items.length, created, updated, deduped, rejected, errors })
}
