'use client'
import { proxyImageUrl } from '@/lib/image-proxy'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatPrice, formatArea, PIPELINE_LABELS, PROPERTY_TYPE_LABELS, BUSINESS_TYPE_LABELS } from '@/lib/utils'
import { MapPin, Home, Filter, LayoutGrid, LayoutList, Star, Phone, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const PROPERTY_TYPES = ['apartment', 'house', 'land', 'commercial', 'warehouse', 'building', 'other']
const BUSINESS_TYPES = ['buy', 'rent', 'invest']
const TYPOLOGIES = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6+']

function PipelineBadge({ status }: { status?: string }) {
  if (!status || status === 'NONE') return null
  const colors: Record<string, string> = {
    FAVORITE: 'bg-yellow-500/20 text-yellow-300',
    TO_CONTACT: 'bg-blue-500/20 text-blue-300',
    CONTACTED: 'bg-green-500/20 text-green-300',
    NOT_INTERESTED: 'bg-gray-500/20 text-gray-400',
    CLOSED: 'bg-purple-500/20 text-purple-300',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || ''}`}>
      {PIPELINE_LABELS[status]}
    </span>
  )
}

function ListingCard({ listing, onPipeline }: { listing: any; onPipeline: (id: string, status: string) => void }) {
  const userListing = listing.userListings?.[0]
  const mainImage = proxyImageUrl(listing.sources?.[0]?.images?.[0])
  const sourceName = listing.sources?.[0]?.sourceName

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors group">
      <div className="h-44 bg-gray-800 relative overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={listing.title || ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700">
            <Home className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {sourceName && (
          <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md">
            {sourceName}
          </span>
        )}
        {userListing?.status === 'FAVORITE' && (
          <span className="absolute top-2 right-2 text-yellow-400">
            <Star className="w-4 h-4 fill-current drop-shadow" />
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-medium text-white line-clamp-1 flex-1">
            {listing.title || 'Sem título'}
          </h3>
          <PipelineBadge status={userListing?.status} />
        </div>

        {listing.locationText && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{listing.locationText}</span>
          </p>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-blue-400 font-bold text-sm">{formatPrice(listing.priceEur)}</span>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {listing.typology && <span className="bg-gray-800 px-1.5 py-0.5 rounded">{listing.typology}</span>}
            {listing.areaM2 && <span>{formatArea(listing.areaM2)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/listings/${listing.id}`}
            className="flex-1 text-center text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white py-1.5 rounded-lg transition"
          >
            Ver detalhe
          </Link>
          <button
            onClick={() => onPipeline(listing.id, userListing?.status === 'TO_CONTACT' ? 'NONE' : 'TO_CONTACT')}
            title="A contactar"
            className={`p-1.5 rounded-lg transition ${userListing?.status === 'TO_CONTACT' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-blue-600 hover:text-white'}`}
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPipeline(listing.id, userListing?.status === 'FAVORITE' ? 'NONE' : 'FAVORITE')}
            title="Favorito"
            className={`p-1.5 rounded-lg transition ${userListing?.status === 'FAVORITE' ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-gray-500 hover:bg-yellow-500 hover:text-white'}`}
          >
            <Star className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ListingsClient() {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  function filtersFromParams(sp: ReturnType<typeof useSearchParams>) {
    return {
      businessType: sp.get('businessType') || '',
      propertyType: sp.get('propertyType') || '',
      typology: sp.get('typology') || '',
      location: sp.get('location') || '',
      priceMin: sp.get('priceMin') || '',
      priceMax: sp.get('priceMax') || '',
      areaMin: sp.get('areaMin') || '',
      areaMax: sp.get('areaMax') || '',
      keywords: sp.get('keywords') || '',
      status: sp.get('status') || '',
      orderBy: sp.get('orderBy') || 'newest',
      page: parseInt(sp.get('page') || '1'),
    }
  }

  const [filters, setFilters] = useState(() => filtersFromParams(searchParams))

  // Re-sincronizar filtros sempre que o URL mudar (clique no sidebar)
  useEffect(() => {
    setFilters(filtersFromParams(searchParams))
  }, [searchParams])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
    const res = await fetch(`/api/listings?${params}`)
    if (res.ok) {
      const data = await res.json()
      setListings(data.listings)
      setPagination(data.pagination)
    }
    setLoading(false)
  }, [filters])

  useEffect(() => { fetchListings() }, [fetchListings])

  async function handlePipeline(listingMasterId: string, status: string) {
    await fetch('/api/user/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingMasterId, status }),
    })
    fetchListings()
  }

  function updateFilter(key: string, value: string) {
    setFilters(f => ({ ...f, [key]: value, page: 1 }))
  }

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) =>
    v && k !== 'orderBy' && k !== 'page' && k !== 'status'
  ).length

  const statusLabel = filters.status ? PIPELINE_LABELS[filters.status] : null

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {statusLabel || 'Todos os imóveis'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? 'A carregar…' : `${pagination.total} imóvel(eis)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchListings} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${showFilters || activeFiltersCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            <Filter className="w-4 h-4" />
            Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </button>
          <div className="flex rounded-lg bg-gray-800 border border-gray-700 p-0.5">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-500'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-gray-600 text-white' : 'text-gray-500'}`}><LayoutList className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Negócio</label>
              <select value={filters.businessType} onChange={e => updateFilter('businessType', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white">
                <option value="">Todos</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{BUSINESS_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipo</label>
              <select value={filters.propertyType} onChange={e => updateFilter('propertyType', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white">
                <option value="">Todos</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipologia</label>
              <select value={filters.typology} onChange={e => updateFilter('typology', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white">
                <option value="">Todas</option>
                {TYPOLOGIES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Localização</label>
              <input value={filters.location} onChange={e => updateFilter('location', e.target.value)}
                placeholder="Ex: Lisboa, Porto…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Preço mín. (€)</label>
              <input type="number" value={filters.priceMin} onChange={e => updateFilter('priceMin', e.target.value)}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Preço máx. (€)</label>
              <input type="number" value={filters.priceMax} onChange={e => updateFilter('priceMax', e.target.value)}
                placeholder="Sem limite"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Área mín. (m²)</label>
              <input type="number" value={filters.areaMin} onChange={e => updateFilter('areaMin', e.target.value)}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ordenar por</label>
              <select value={filters.orderBy} onChange={e => updateFilter('orderBy', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white">
                <option value="newest">Mais recentes</option>
                <option value="priceAsc">Menor preço</option>
                <option value="priceDesc">Maior preço</option>
                <option value="areaDesc">Maior área</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input value={filters.keywords} onChange={e => updateFilter('keywords', e.target.value)}
              placeholder="Palavras-chave (ex: piscina, garagem…)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600" />
            <button onClick={() => setFilters(f => ({ ...f, businessType: '', propertyType: '', typology: '', location: '', priceMin: '', priceMax: '', areaMin: '', areaMax: '', keywords: '', orderBy: 'newest', page: 1 }))}
              className="text-sm text-gray-400 hover:text-white transition whitespace-nowrap">
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <Home className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">Nenhum imóvel encontrado</p>
          <p className="text-sm mt-1">Ajusta os filtros ou aguarda novos dados dos agentes Gobii</p>
        </div>
      ) : (
        <>
          <div className={view === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
          }>
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} onPipeline={handlePipeline} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40 transition text-sm">
                Anterior
              </button>
              <span className="text-gray-500 text-sm">Página {filters.page} de {pagination.pages}</span>
              <button disabled={filters.page >= pagination.pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40 transition text-sm">
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
