'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { RefreshCw, Database, MapPin, Building2, TrendingUp, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, color = 'blue' }: { label: string, value: string | number, sub?: string, icon: any, color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-xs uppercase tracking-wider font-medium opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

function QualityBar({ label, filled, total }: { label: string, filled: number, total: number }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-20 text-right tabular-nums">{filled}/{total} ({pct}%)</span>
    </div>
  )
}

const PROPERTY_LABELS: Record<string, string> = {
  apartment: 'Apartamento', house: 'Moradia', land: 'Terreno',
  commercial: 'Comercial', warehouse: 'Armazém', building: 'Edifício', other: 'Outro',
}
const BUSINESS_LABELS: Record<string, string> = { buy: 'Compra', rent: 'Arrendamento', invest: 'Investimento' }

export default function StatsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'concelhos' | 'regioes' | 'fontes' | 'tipos' | 'quality' | 'runs'>('concelhos')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/stats')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return <p className="text-gray-500 text-center py-12">Erro ao carregar estatísticas</p>

  const { totals, byConcelho, byRegiao, bySource, byPropertyType, byTypology, quality, recentRuns } = data

  const tabs = [
    { key: 'concelhos', label: 'Por concelho' },
    { key: 'regioes', label: 'Por região' },
    { key: 'fontes', label: 'Por fonte' },
    { key: 'tipos', label: 'Por tipo' },
    { key: 'quality', label: 'Qualidade dados' },
    { key: 'runs', label: 'Últimos runs' },
  ] as const

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Estatísticas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Validação da cobertura e qualidade dos dados</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total" value={totals.total} sub={`${totals.active} ativos`} icon={Database} color="blue" />
        <StatCard label="Regiões" value={byRegiao.length} sub={`${byConcelho.length}+ concelhos`} icon={MapPin} color="green" />
        <StatCard label="Fontes" value={bySource.length} sub="portais activos" icon={Building2} color="purple" />
        <StatCard label="Com GPS" value={totals.withGeo} sub={`${totals.total > 0 ? Math.round((totals.withGeo / totals.total) * 100) : 0}% cobertura`} icon={TrendingUp} color="blue" />
        <StatCard label="S/ preço" value={totals.noPrice} sub="dados em falta" icon={AlertTriangle} color={totals.noPrice > 0 ? 'red' : 'green'} />
        <StatCard label="S/ descrição" value={totals.noDescription} sub="dados em falta" icon={AlertTriangle} color={totals.noDescription > 0 ? 'yellow' : 'green'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

        {tab === 'concelhos' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left px-4 py-3">Concelho</th>
                <th className="text-left px-4 py-3">Região</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Ativos</th>
                <th className="text-right px-4 py-3">Preço médio compra</th>
                <th className="text-right px-4 py-3">Preço médio renda</th>
              </tr>
            </thead>
            <tbody>
              {byConcelho.map((row: any, i: number) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-2.5 text-white font-medium">{row.concelho}</td>
                  <td className="px-4 py-2.5 text-gray-400">{row.regiao || '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-gray-300">{row.total}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-green-400">{row.ativos}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-blue-400">{row.preco_medio_compra ? formatPrice(row.preco_medio_compra) : '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-purple-400">{row.preco_medio_renda ? formatPrice(row.preco_medio_renda) : '—'}</td>
                </tr>
              ))}
              {byConcelho.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">Sem dados</td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === 'regioes' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left px-4 py-3">Região</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Ativos</th>
                <th className="text-right px-4 py-3">Concelhos</th>
                <th className="px-4 py-3">Distribuição</th>
              </tr>
            </thead>
            <tbody>
              {byRegiao.map((row: any, i: number) => {
                const maxTotal = byRegiao[0]?.total || 1
                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-2.5 text-white font-medium">{row.regiao}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-300">{row.total}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-green-400">{row.ativos}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">{row.concelhos}</td>
                    <td className="px-4 py-2.5">
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(row.total / maxTotal) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {tab === 'fontes' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left px-4 py-3">Fonte</th>
                <th className="text-left px-4 py-3">Família</th>
                <th className="text-right px-4 py-3">Imóveis</th>
                <th className="px-4 py-3">Distribuição</th>
              </tr>
            </thead>
            <tbody>
              {bySource.map((row: any, i: number) => {
                const maxTotal = bySource[0]?.total || 1
                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-2.5 text-white font-medium">{row.fonte || 'Desconhecido'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        row.familia === 'portals' ? 'bg-blue-500/15 text-blue-400' :
                        row.familia === 'franchises' ? 'bg-purple-500/15 text-purple-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>{row.familia || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-300">{row.total}</td>
                    <td className="px-4 py-2.5">
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(row.total / maxTotal) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {tab === 'tipos' && (
          <div className="p-4 space-y-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Por tipo de imóvel e negócio</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                    <th className="text-left px-4 py-2">Tipo</th>
                    <th className="text-left px-4 py-2">Negócio</th>
                    <th className="text-right px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {byPropertyType.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="px-4 py-2 text-white">{PROPERTY_LABELS[row.tipo] || row.tipo || '—'}</td>
                      <td className="px-4 py-2 text-gray-400">{BUSINESS_LABELS[row.negocio] || row.negocio || '—'}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-300">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Por tipologia</p>
              <div className="flex flex-wrap gap-2">
                {byTypology.map((row: any) => (
                  <div key={row.typology} className="bg-gray-800 rounded-lg px-3 py-2 text-center">
                    <p className="text-white font-bold text-lg">{row.total}</p>
                    <p className="text-xs text-gray-400">{row.typology}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'quality' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
              Preenchimento dos campos — {quality.total} imóveis ativos
            </p>
            <QualityBar label="Preço" filled={quality.com_preco} total={quality.total} />
            <QualityBar label="Área" filled={quality.com_area} total={quality.total} />
            <QualityBar label="Descrição" filled={quality.com_descricao} total={quality.total} />
            <QualityBar label="GPS" filled={quality.com_gps} total={quality.total} />
            <QualityBar label="Região" filled={quality.com_regiao} total={quality.total} />
            <QualityBar label="Concelho" filled={quality.com_concelho} total={quality.total} />
            <QualityBar label="Freguesia" filled={quality.com_freguesia} total={quality.total} />
            <QualityBar label="Andar" filled={quality.com_andar} total={quality.total} />
            <QualityBar label="WCs" filled={quality.com_wcs} total={quality.total} />
            <QualityBar label="Elevador" filled={quality.com_elevador} total={quality.total} />
            <QualityBar label="Estacionamento" filled={quality.com_estacionamento} total={quality.total} />
          </div>
        )}

        {tab === 'runs' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Recebidos</th>
                <th className="text-right px-4 py-3">Criados</th>
                <th className="text-right px-4 py-3">Atualizados</th>
                <th className="text-right px-4 py-3">Deduplicados</th>
                <th className="text-right px-4 py-3">Rejeitados</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((run: any) => (
                <tr key={run.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-2.5 text-gray-300">{new Date(run.startedAt).toLocaleString('pt-PT')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      run.status === 'DONE' ? 'bg-green-500/15 text-green-400' :
                      run.status === 'FAILED' ? 'bg-red-500/15 text-red-400' :
                      'bg-yellow-500/15 text-yellow-400'
                    }`}>{run.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">{run.received}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-green-400">{run.created}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-blue-400">{run.updated}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-yellow-400">{run.deduped}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-red-400">{run.rejected}</td>
                </tr>
              ))}
              {recentRuns.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600">Sem runs registados</td></tr>
              )}
            </tbody>
          </table>
        )}

      </div>
    </div>
  )
}
