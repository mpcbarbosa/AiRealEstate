'use client'
import { useState } from 'react'
import { CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Copy, Check, Activity, Database, RefreshCw } from 'lucide-react'

const RESULT_COLORS = {
  DONE: 'text-green-400',
  PROCESSING: 'text-blue-400',
  FAILED: 'text-red-400',
}

function RunRow({ run }: { run: any }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [copied, setCopied] = useState(false)

  async function loadItems() {
    if (items.length > 0) { setOpen(!open); return }
    setLoadingItems(true)
    const res = await fetch(`/api/admin/ingest/${run.id}/items`)
    if (res.ok) setItems(await res.json())
    setLoadingItems(false)
    setOpen(true)
  }

  function copyRunId() {
    navigator.clipboard.writeText(run.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const duration = run.finishedAt
    ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
    : null

  return (
    <>
      <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition">
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {run.status === 'DONE'
              ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              : run.status === 'PROCESSING'
              ? <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            }
            <span className={`text-sm font-medium ${RESULT_COLORS[run.status as keyof typeof RESULT_COLORS] || 'text-gray-400'}`}>
              {run.status}
            </span>
          </div>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm font-medium text-white">{run.source}</span>
        </td>
        <td className="py-3 px-4 text-sm text-gray-400">
          {new Date(run.startedAt).toLocaleString('pt-PT')}
        </td>
        <td className="py-3 px-4 text-sm text-gray-500">
          {duration !== null ? `${duration}s` : '—'}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-3 text-sm">
            <span title="Recebidos" className="text-gray-400">{run.received}</span>
            <span title="Criados" className="text-green-400">+{run.created}</span>
            <span title="Atualizados" className="text-blue-400">~{run.updated}</span>
            <span title="Deduplicados" className="text-gray-500">={run.deduped}</span>
            {run.rejected > 0 && <span title="Rejeitados" className="text-red-400">✗{run.rejected}</span>}
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <button onClick={copyRunId} title="Copiar ID"
              className="p-1 text-gray-600 hover:text-gray-300 transition">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {run._count?.items > 0 && (
              <button onClick={loadItems}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">
                {loadingItems ? <RefreshCw className="w-3 h-3 animate-spin" /> : open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {run._count.items} items
              </button>
            )}
          </div>
        </td>
      </tr>

      {open && items.length > 0 && (
        <tr>
          <td colSpan={6} className="bg-gray-900 px-4 pb-4">
            <div className="mt-2 border border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Resultado</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">URL</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Razão</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-800 last:border-0">
                      <td className="py-2 px-3">
                        <span className={`font-medium ${
                          item.result === 'CREATED' ? 'text-green-400' :
                          item.result === 'UPDATED' ? 'text-blue-400' :
                          item.result === 'DEDUPED' ? 'text-gray-500' : 'text-red-400'
                        }`}>{item.result}</span>
                      </td>
                      <td className="py-2 px-3 max-w-xs">
                        {item.sourceUrl ? (
                          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-400 truncate block transition">
                            {item.sourceUrl}
                          </a>
                        ) : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="py-2 px-3 text-gray-500">{item.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminIngestClient({ runs, totals }: { runs: any[]; totals: any }) {
  const [filter, setFilter] = useState<'all' | 'DONE' | 'FAILED'>('all')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeResult, setGeocodeResult] = useState<any>(null)

  const filtered = filter === 'all' ? runs : runs.filter(r => r.status === filter)
  const failedCount = runs.filter(r => r.status === 'FAILED').length

  async function runGeocode() {
    setGeocoding(true)
    setGeocodeResult(null)
    try {
      const res = await fetch('/api/admin/geocode', { method: 'POST' })
      const data = await res.json()
      setGeocodeResult(data)
    } catch (e) {
      setGeocodeResult({ error: 'Erro ao geocodificar' })
    }
    setGeocoding(false)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin — Ingest</h1>
          <p className="text-sm text-gray-500 mt-0.5">{runs.length} runs registadas</p>
        </div>
        <div className="flex items-center gap-3">
          {geocodeResult && !geocodeResult.error && (
            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
              ✓ {geocodeResult.updated} geocodificados · {geocodeResult.remaining} restantes
            </span>
          )}
          <button
            onClick={runGeocode}
            disabled={geocoding}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 hover:text-white rounded-lg text-sm transition"
          >
            <Database className={`w-4 h-4 ${geocoding ? 'animate-pulse' : ''}`} />
            {geocoding ? 'A geocodificar…' : 'Geocodificar GPS'}
          </button>
          {failedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {failedCount} run(s) com falha
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Recebidos', value: totals.received || 0, color: 'text-white' },
          { label: 'Criados', value: totals.created || 0, color: 'text-green-400' },
          { label: 'Atualizados', value: totals.updated || 0, color: 'text-blue-400' },
          { label: 'Deduplicados', value: totals.deduped || 0, color: 'text-gray-400' },
          { label: 'Rejeitados', value: totals.rejected || 0, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(['all', 'DONE', 'FAILED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${filter === f ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>
            {f === 'all' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>Nenhum ingest encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Estado</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Fonte</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Data</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Duração</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Resultados</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(run => <RunRow key={run.id} run={run} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
