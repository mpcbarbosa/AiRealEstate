import { prisma } from '@/lib/prisma'

interface ListingData {
  id: string
  title?: string | null
  businessType?: string | null
  propertyType?: string | null
  typology?: string | null
  priceEur?: number | null
  areaM2?: number | null
  locationText?: string | null
  description?: string | null
}

// Verifica se um imóvel corresponde aos filtros de uma watchlist
function matchesFilters(listing: ListingData, filters: Record<string, any>): boolean {
  if (filters.businessType && listing.businessType !== filters.businessType) return false
  if (filters.propertyType && listing.propertyType !== filters.propertyType) return false
  if (filters.typology && listing.typology !== filters.typology) return false

  if (filters.priceMin && listing.priceEur != null && listing.priceEur < Number(filters.priceMin)) return false
  if (filters.priceMax && listing.priceEur != null && listing.priceEur > Number(filters.priceMax)) return false
  if (filters.areaMin && listing.areaM2 != null && listing.areaM2 < Number(filters.areaMin)) return false
  if (filters.areaMax && listing.areaM2 != null && listing.areaM2 > Number(filters.areaMax)) return false

  if (filters.location) {
    const loc = (listing.locationText || '').toLowerCase()
    if (!loc.includes(filters.location.toLowerCase())) return false
  }

  if (filters.keywords) {
    const haystack = [listing.title, listing.description, listing.locationText]
      .filter(Boolean).join(' ').toLowerCase()
    const keywords = filters.keywords.toLowerCase().split(/[\s,]+/).filter(Boolean)
    if (!keywords.every((kw: string) => haystack.includes(kw))) return false
  }

  return true
}

// Cria notificações para todas as watchlists que correspondam ao imóvel
export async function matchListingToWatchlists(
  listing: ListingData,
  isNew: boolean
): Promise<number> {
  // Só notificar para imóveis novos (não atualizações)
  if (!isNew) return 0

  const watchlists = await prisma.watchlist.findMany({
    where: { active: true },
    select: { id: true, userId: true, name: true, filtersJson: true },
  })

  let matched = 0
  const notifications: any[] = []

  for (const wl of watchlists) {
    const filters = (wl.filtersJson as Record<string, any>) || {}

    if (matchesFilters(listing, filters)) {
      // Verificar se já existe notificação para este par watchlist+listing
      const existing = await prisma.notification.findFirst({
        where: {
          watchlistId: wl.id,
          listingMasterId: listing.id,
          type: 'NEW_LISTING',
        },
      })
      if (existing) continue

      notifications.push({
        userId: wl.userId,
        watchlistId: wl.id,
        listingMasterId: listing.id,
        type: 'NEW_LISTING' as const,
        message: `Novo imóvel corresponde à watchlist "${wl.name}": ${listing.title || listing.locationText || 'sem título'}`,
      })
      matched++
    }
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications })
    console.log(`[MATCHER] ${matched} watchlist(s) corresponderam ao imóvel ${listing.id}`)
  }

  return matched
}

// Notificação de queda de preço para utilizadores com o imóvel no pipeline
export async function notifyPriceDrop(
  listingId: string,
  listingTitle: string | null,
  oldPrice: number,
  newPrice: number
): Promise<void> {
  const pct = Math.abs(((newPrice - oldPrice) / oldPrice) * 100).toFixed(1)

  // Notificar utilizadores que têm este imóvel no pipeline (exceto NONE e NOT_INTERESTED)
  const userListings = await prisma.userListing.findMany({
    where: {
      listingMasterId: listingId,
      status: { in: ['FAVORITE', 'TO_CONTACT', 'CONTACTED', 'CLOSED'] },
    },
    select: { userId: true },
  })

  if (userListings.length === 0) return

  await prisma.notification.createMany({
    data: userListings.map(ul => ({
      userId: ul.userId,
      listingMasterId: listingId,
      type: 'PRICE_DROP' as const,
      message: `Queda de preço -${pct}%: ${listingTitle || 'Imóvel'} passou de ${Math.round(oldPrice).toLocaleString('pt-PT')}€ para ${Math.round(newPrice).toLocaleString('pt-PT')}€`,
    })),
  })

  console.log(`[MATCHER] Notificação de queda de preço enviada a ${userListings.length} utilizador(es)`)
}
