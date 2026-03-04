import crypto from 'crypto'

/**
 * ESTRATÉGIA DE DEDUPLICAÇÃO MULTI-FONTE
 *
 * Nível 1 — Exact URL: mesmo anúncio na mesma fonte
 * Nível 2 — Cross-source fuzzy: mesmo imóvel em fontes diferentes
 *   Critérios (todos devem bater):
 *   - tipologia igual (T1, T2…)
 *   - preço dentro de ±5% (portais têm pequenas variações)
 *   - área dentro de ±8%
 *   - localização normalizada igual (primeiros 40 chars, lowercase, sem espaços duplos)
 *   - propertyType igual
 *   NÃO usa sourceName — permite detetar o mesmo imóvel em portais diferentes
 */
export function generateDedupeHash(item: {
  sourceUrl?: string | null
  typology?: string | null
  priceEur?: number | null
  areaM2?: number | null
  locationText?: string | null
  propertyType?: string | null
}): string {
  // Nível 1: hash exato por sourceUrl
  if (item.sourceUrl) {
    return crypto.createHash('sha256').update(item.sourceUrl).digest('hex')
  }

  // Nível 2: hash fuzzy cross-source (sem sourceName)
  const normalized = [
    (item.propertyType || '').toLowerCase().trim(),
    (item.typology || '').toLowerCase().trim(),
    item.priceEur ? Math.round(item.priceEur / 5000) * 5000 : '',  // banda de 5000€
    item.areaM2 ? Math.round(item.areaM2 / 10) * 10 : '',           // banda de 10m²
    normalizeLocation(item.locationText),
  ].join('|')

  return crypto.createHash('sha256').update(normalized).digest('hex')
}

/**
 * Hash secundário para deduplicação fuzzy mais agressiva via DB query.
 * Usado para encontrar candidatos antes de comparar com tolerâncias.
 */
export function generateLocationFingerprint(locationText: string | null | undefined): string {
  return normalizeLocation(locationText)
}

function normalizeLocation(locationText: string | null | undefined): string {
  if (!locationText) return ''
  return locationText
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remover acentos
    .replace(/[^a-z0-9\s]/g, ' ')                      // só alfanumérico
    .replace(/\s+/g, ' ')                               // espaços duplos
    .trim()
    .slice(0, 50)
}

/**
 * Verifica se dois imóveis são o mesmo com tolerâncias.
 * Usado após encontrar candidatos por localização.
 */
export function isSameListing(a: {
  typology?: string | null
  priceEur?: number | null
  areaM2?: number | null
  locationText?: string | null
  propertyType?: string | null
  businessType?: string | null
}, b: typeof a): boolean {
  // propertyType e businessType têm de bater exatamente
  if (a.propertyType && b.propertyType && a.propertyType !== b.propertyType) return false
  if (a.businessType && b.businessType && a.businessType !== b.businessType) return false

  // tipologia tem de bater (se ambos a tiverem)
  if (a.typology && b.typology && a.typology !== b.typology) return false

  // preço: tolerância ±5%
  if (a.priceEur && b.priceEur) {
    const diff = Math.abs(a.priceEur - b.priceEur) / Math.max(a.priceEur, b.priceEur)
    if (diff > 0.05) return false
  }

  // área: tolerância ±8%
  if (a.areaM2 && b.areaM2) {
    const diff = Math.abs(a.areaM2 - b.areaM2) / Math.max(a.areaM2, b.areaM2)
    if (diff > 0.08) return false
  }

  // localização: similaridade mínima
  const locA = normalizeLocation(a.locationText)
  const locB = normalizeLocation(b.locationText)
  if (locA && locB) {
    // Verificar se partilham pelo menos 60% das palavras
    const wordsA = new Set(locA.split(' ').filter(w => w.length > 2))
    const wordsB = new Set(locB.split(' ').filter(w => w.length > 2))
    if (wordsA.size === 0 || wordsB.size === 0) return false
    const common = [...wordsA].filter(w => wordsB.has(w)).length
    const similarity = common / Math.max(wordsA.size, wordsB.size)
    if (similarity < 0.6) return false
  }

  return true
}

export function normalizeBusinessType(val: string | null | undefined): 'buy' | 'rent' | 'invest' | null {
  if (!val) return null
  const map: Record<string, 'buy' | 'rent' | 'invest'> = {
    buy: 'buy', compra: 'buy', venda: 'buy', sale: 'buy',
    rent: 'rent', arrendamento: 'rent', aluguer: 'rent', renda: 'rent',
    invest: 'invest', investimento: 'invest',
  }
  return map[val.toLowerCase()] || null
}

export function normalizePropertyType(val: string | null | undefined): 'apartment' | 'house' | 'land' | 'commercial' | 'warehouse' | 'building' | 'other' | null {
  if (!val) return null
  const map: Record<string, 'apartment' | 'house' | 'land' | 'commercial' | 'warehouse' | 'building' | 'other'> = {
    apartment: 'apartment', apartamento: 'apartment', flat: 'apartment',
    house: 'house', moradia: 'house', villa: 'house', vivenda: 'house',
    land: 'land', terreno: 'land',
    commercial: 'commercial', comercial: 'commercial', loja: 'commercial', shop: 'commercial',
    warehouse: 'warehouse', armazem: 'warehouse', armazém: 'warehouse',
    building: 'building', edificio: 'building', edifício: 'building',
    other: 'other', outro: 'other',
  }
  return map[val.toLowerCase()] || 'other'
}
