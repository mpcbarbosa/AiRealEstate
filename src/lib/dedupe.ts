import crypto from 'crypto'

// Gera hash de deduplicação a partir de campos chave do imóvel
export function generateDedupeHash(item: {
  sourceUrl?: string | null
  sourceName?: string | null
  typology?: string | null
  priceEur?: number | null
  areaM2?: number | null
  locationText?: string | null
}): string {
  // Nível 1: hash exato por sourceUrl (identificador único)
  if (item.sourceUrl) {
    return crypto.createHash('sha256').update(item.sourceUrl).digest('hex')
  }

  // Nível 2: hash fuzzy por campos combinados
  const normalized = [
    (item.sourceName || '').toLowerCase().trim(),
    (item.typology || '').toLowerCase().trim(),
    item.priceEur ? Math.round(item.priceEur / 1000) * 1000 : '', // arredondar a 1000€
    item.areaM2 ? Math.round(item.areaM2 / 5) * 5 : '',           // arredondar a 5m²
    (item.locationText || '').toLowerCase().trim().slice(0, 30),
  ].join('|')

  return crypto.createHash('sha256').update(normalized).digest('hex')
}

// Normaliza o businessType do Gobii para o enum da DB
export function normalizeBusinessType(val: string | null | undefined): 'buy' | 'rent' | 'invest' | null {
  if (!val) return null
  const map: Record<string, 'buy' | 'rent' | 'invest'> = {
    buy: 'buy', compra: 'buy', venda: 'buy', sale: 'buy',
    rent: 'rent', arrendamento: 'rent', aluguer: 'rent',
    invest: 'invest', investimento: 'invest',
  }
  return map[val.toLowerCase()] || null
}

// Normaliza o propertyType do Gobii para o enum da DB
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
