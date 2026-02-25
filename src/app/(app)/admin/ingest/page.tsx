'use client'
import { useEffect, useState } from 'react'
import { BarChart3, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminIngestPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])

  async function load() {
    const res = await fetch('/api/admin/ingest')
    if (res.ok) setRuns(await res.json())
    setLoading(false)
  }

  async function loadItems(runId: string) {
    if (expandedId === runId) { setExpandedId(null); return }
    const res = await fetch(`/api/admin/ingest/${runId}/items`)
    if (res.ok) setItems(await res.json())
    setExpandedId(runId)
  }

  useEffect(() => { load() }, [])

  const statusColor = (s: string) => ({
    PROCESSING: 'text-yellow-400',
    DONE: 'text-green-400',
    FAILED: 'text-red-400',
  }[s] || 'text-gray-400')

  const resultColor = (r: string) => ({
    CREATED: 'bg-green-500/20 text-green-300',
    UPDATED: 'bg-blue-500/20 text-blue-300',
    DEDUPED: 'bg-yellow-500/20 text-yellow-300',
    REJECTED: 'bg-red-500/20 text-red-300',
  }[r] || 'bg-gray-700 text-gray-400')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />Ingest Runs
        </h1>
        <button onClick={load} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? <p className="text-gray-500">A carregar…</p> : runs.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum ingest ainda</p>
          <p className="text-sm mt-1">Envia dados via POST /api/ingest/gobii/listings</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map(run => (
            <div key={run.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition"
                onClick={() => loadItems(run.id)}
              >
                <span className={`text-sm font-medium ${statusColor(run.status)}`}>{run.status}</span>
                <span className="text-xs text-gray-500">{run.source}</span>
                <span className="text-xs text-gray-600 flex-1">{run.id.slice(0, 12)}…</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-green-400">+{run.created} criados</span>
                  <span className="text-blue-400">↻{run.updated} atualizados</span>
                  <span className="text-yellow-400">={run.deduped} dedup</span>
                  <span className="text-red-400">✗{run.rejected} rejeitados</span>
                </div>
                <span className="text-xs text-gray-600">{formatDate(run.startedAt)}</span>
                {expandedId === run.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>

              {expandedId === run.id && (
                <div className="border-t border-gray-800 px-4 py-3">
                  {run.errors && Array.isArray(run.errors) && run.errors.length > 0 && (
                    <div className="mb-3 flex items-start gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>{run.errors.map((e: any, i: number) => <p key={i}>{typeof e === 'string' ? e : JSON.stringify(e)}</p>)}</div>
                    </div>
                  )}
                  <div className="space-y-1 max-h-64 overflow-auto">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 text-xs py-1 border-b border-gray-800 last:border-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${resultColor(item.result)}`}>{item.result}</span>
                        <span className="text-gray-500 flex-1 truncate">{item.sourceUrl || '—'}</span>
                        {item.reason && <span className="text-red-400 truncate max-w-xs">{item.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
