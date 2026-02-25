'use client'
import Link from 'next/link'
import { formatPrice, formatArea, BUSINESS_TYPE_LABELS, PROPERTY_TYPE_LABELS, PIPELINE_LABELS } from '@/lib/utils'
import { Home, TrendingUp, TrendingDown, Activity, RefreshCw, AlertCircle, CheckCircle, Building2, MapPin } from 'lucide-react'

const PIPELINE_COLORS: Record<string, string> = {
  NONE: 'bg-gray-600',
  FAVORITE: 'bg-yellow-500',
  TO_CONTACT: 'bg-blue-500',
  CONTACTED: 'bg-green-500',
  NOT_INTERESTED: 'bg-gray-500',
  CLOSED: 'bg-purple-500',
}

const BUSINESS_COLORS: Record<string, string> = {
  buy: 'bg-blue-500',
  rent: 'bg-green-500',
  invest: 'bg-purple-500',
}

function StatCard({ label, value, sub, icon: Icon, color = 'text-white' }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        {Icon && <Icon className="w-5 h-5 text-gray-600" />}
      </div>
    </div>
  )
}

function MiniBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right shrink-0">{count}</span>
    </div>
  )
}

export default function DashboardClient({ stats }: { stats: any }) {
  const {
    totalListings, avgPrice, avgRent,
    listingsByBusiness, listingsByStatus,
    pipelineCounts, recentListings,
    recentIngest, priceHistory,
  } = stats

  const totalPipeline = pipelineCounts.reduce((s: number, p: any) => s + p._count, 0)
  const totalBusiness = listingsByBusiness.reduce((s: number, b: any) => s + b._count, 0)
  const totalType = listingsByStatus.reduce((s: number, b: any) => s + b._count, 0)

  const lastIngest = recentIngest[0]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral do mercado e da tua atividade</p>
        </div>
        <Link href="/listings" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
          <Home className="w-4 h-4" />
          Ver imóveis
        </Link>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de imóveis" value={totalListings.toLocaleString()} icon={Building2} />
        <StatCard label="Preço médio venda" value={avgPrice ? formatPrice(avgPrice) : '—'} sub="imóveis para compra" icon={TrendingUp} color="text-blue-400" />
        <StatCard label="Renda média" value={avgRent ? formatPrice(avgRent) : '—'} sub="imóveis para arrendar" icon={Home} color="text-green-400" />
        <StatCard
          label="Último ingest"
          value={lastIngest ? `+${lastIngest.created}` : '—'}
          sub={lastIngest ? `${lastIngest.source} · ${lastIngest.received} recebidos` : 'Sem dados'}
          icon={Activity}
          color={lastIngest?.status === 'DONE' ? 'text-green-400' : 'text-red-400'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Por tipo de negócio */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-4">Por tipo de negócio</p>
          <div className="space-y-3">
            {listingsByBusiness.map((b: any) => (
              <MiniBar
                key={b.businessType}
                label={BUSINESS_TYPE_LABELS[b.businessType] || b.businessType || 'N/D'}
                count={b._count}
                total={totalBusiness}
                color={BUSINESS_COLORS[b.businessType] || 'bg-gray-500'}
              />
            ))}
            {listingsByBusiness.length === 0 && <p className="text-gray-600 text-sm">Sem dados</p>}
          </div>
        </div>

        {/* Por tipo de imóvel */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-4">Por tipo de imóvel</p>
          <div className="space-y-3">
            {listingsByStatus.map((b: any) => (
              <MiniBar
                key={b.propertyType}
                label={PROPERTY_TYPE_LABELS[b.propertyType] || b.propertyType || 'N/D'}
                count={b._count}
                total={totalType}
                color="bg-indigo-500"
              />
            ))}
            {listingsByStatus.length === 0 && <p className="text-gray-600 text-sm">Sem dados</p>}
          </div>
        </div>

        {/* Pipeline pessoal */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-4">O teu pipeline</p>
          {pipelineCounts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm">Ainda não classificaste imóveis</p>
              <Link href="/listings" className="text-blue-400 text-xs hover:underline mt-1 block">Começa aqui →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pipelineCounts.map((p: any) => (
                <MiniBar
                  key={p.status}
                  label={PIPELINE_LABELS[p.status] || p.status}
                  count={p._count}
                  total={totalPipeline}
                  color={PIPELINE_COLORS[p.status] || 'bg-gray-500'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Imóveis recentes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Imóveis recentes</p>
            <Link href="/listings" className="text-xs text-blue-400 hover:text-blue-300">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {recentListings.map((l: any) => {
              const img = l.sources?.[0]?.images?.[0]
              return (
                <Link key={l.id} href={`/listings/${l.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800 transition group">
                  <div className="w-12 h-10 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700"><Home className="w-5 h-5" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 group-hover:text-white truncate transition">{l.title || 'Sem título'}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />{l.locationText || '—'}
                    </p>
                  </div>
                  <span className="text-sm text-blue-400 font-medium shrink-0">{formatPrice(l.priceEur)}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Histórico de preços */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Variações de preço recentes</p>
          </div>
          {priceHistory.length === 0 ? (
            <p className="text-gray-600 text-sm">Sem variações de preço registadas</p>
          ) : (
            <div className="space-y-2">
              {priceHistory.map((h: any) => {
                const old = parseFloat(h.oldValue)
                const nw = parseFloat(h.newValue)
                const pct = ((nw - old) / old * 100).toFixed(1)
                const up = nw > old
                return (
                  <Link key={h.id} href={`/listings/${h.listingMasterId}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800 transition">
                    {up
                      ? <TrendingUp className="w-4 h-4 text-red-400 shrink-0" />
                      : <TrendingDown className="w-4 h-4 text-green-400 shrink-0" />
                    }
                    <p className="flex-1 text-sm text-gray-400 truncate">{h.listingMaster?.title || 'Imóvel'}</p>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-medium ${up ? 'text-red-400' : 'text-green-400'}`}>
                        {up ? '+' : ''}{pct}%
                      </p>
                      <p className="text-xs text-gray-600">{formatPrice(old)} → {formatPrice(nw)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ingest runs recentes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ingest recente</p>
          <Link href="/admin/ingest" className="text-xs text-blue-400 hover:text-blue-300">Ver todos →</Link>
        </div>
        {recentIngest.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhum ingest registado ainda</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentIngest.map((run: any) => (
              <div key={run.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{run.source}</span>
                  {run.status === 'DONE'
                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                    : <AlertCircle className="w-4 h-4 text-red-400" />
                  }
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-400">+{run.created}</span>
                  <span className="text-blue-400">~{run.updated}</span>
                  <span className="text-gray-500">={run.deduped}</span>
                  {run.rejected > 0 && <span className="text-red-400">✗{run.rejected}</span>}
                </div>
                <p className="text-xs text-gray-600 mt-1">{new Date(run.startedAt).toLocaleString('pt-PT')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
