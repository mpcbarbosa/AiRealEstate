'use client'
import { useState } from 'react'
import { Bell, BellOff, Plus, Trash2, Edit2, Search, Euro, Ruler, Home, Tag } from 'lucide-react'
import { BUSINESS_TYPE_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/utils'

const BUSINESS_TYPES = ['buy', 'rent', 'invest']
const PROPERTY_TYPES = ['apartment', 'house', 'land', 'commercial', 'warehouse', 'building']
const TYPOLOGIES = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6+']

const EMPTY_FILTERS = {
  businessType: '', propertyType: '', typology: '',
  location: '', priceMin: '', priceMax: '',
  areaMin: '', areaMax: '', keywords: '',
}

function WatchlistCard({ wl, onDelete, onToggle }: { wl: any; onDelete: () => void; onToggle: () => void }) {
  const filters = wl.filtersJson || {}
  const tags = [
    filters.businessType && BUSINESS_TYPE_LABELS[filters.businessType],
    filters.propertyType && PROPERTY_TYPE_LABELS[filters.propertyType],
    filters.typology,
    filters.location,
    filters.priceMax && `até ${Number(filters.priceMax).toLocaleString('pt-PT')}€`,
    filters.areaMin && `min ${filters.areaMin}m²`,
    filters.keywords,
  ].filter(Boolean)

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition ${wl.active ? 'border-gray-700' : 'border-gray-800 opacity-60'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {wl.active
            ? <Bell className="w-4 h-4 text-blue-400 shrink-0" />
            : <BellOff className="w-4 h-4 text-gray-600 shrink-0" />
          }
          <h3 className="text-sm font-semibold text-white">{wl.name}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {wl._count?.notifications > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
              {wl._count.notifications} notif.
            </span>
          )}
          <button onClick={onToggle} title={wl.active ? 'Desativar' : 'Ativar'}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition">
            {wl.active ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onDelete} title="Eliminar"
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-lg border border-gray-700">
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600">Todos os imóveis</p>
      )}

      <p className="text-xs text-gray-600 mt-3">
        Criada em {new Date(wl.createdAt).toLocaleDateString('pt-PT')}
      </p>
    </div>
  )
}

export default function WatchlistsClient({ watchlists: initial }: { watchlists: any[] }) {
  const [watchlists, setWatchlists] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [saving, setSaving] = useState(false)

  async function reload() {
    const res = await fetch('/api/watchlists')
    if (res.ok) setWatchlists(await res.json())
  }

  async function create() {
    if (!name.trim()) return
    setSaving(true)
    const filtersJson: Record<string, any> = {}
    Object.entries(filters).forEach(([k, v]) => { if (v) filtersJson[k] = v })
    await fetch('/api/watchlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, filtersJson }),
    })
    setName('')
    setFilters(EMPTY_FILTERS)
    setShowForm(false)
    setSaving(false)
    reload()
  }

  async function deleteWl(id: string) {
    await fetch(`/api/watchlists?id=${id}`, { method: 'DELETE' })
    reload()
  }

  async function toggleWl(id: string, active: boolean) {
    await fetch('/api/watchlists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    reload()
  }

  function setFilter(k: string, v: string) {
    setFilters(f => ({ ...f, [k]: v }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlists</h1>
          <p className="text-sm text-gray-500 mt-0.5">Alertas automáticos para novos imóveis</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" />
          Nova watchlist
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            Criar nova watchlist
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Nome do alerta *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: T2 Lisboa até 300k"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>

            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider pt-1">Filtros (opcional)</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Negócio</label>
                <select value={filters.businessType} onChange={e => setFilter('businessType', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="">Qualquer</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{BUSINESS_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                <select value={filters.propertyType} onChange={e => setFilter('propertyType', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="">Qualquer</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipologia</label>
                <select value={filters.typology} onChange={e => setFilter('typology', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="">Qualquer</option>
                  {TYPOLOGIES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Localização</label>
                <input value={filters.location} onChange={e => setFilter('location', e.target.value)}
                  placeholder="Ex: Lisboa, Porto"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Preço máx. (€)</label>
                <input type="number" value={filters.priceMax} onChange={e => setFilter('priceMax', e.target.value)}
                  placeholder="Sem limite"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Área mín. (m²)</label>
                <input type="number" value={filters.areaMin} onChange={e => setFilter('areaMin', e.target.value)}
                  placeholder="Qualquer"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Palavras-chave</label>
              <input value={filters.keywords} onChange={e => setFilter('keywords', e.target.value)}
                placeholder="Ex: piscina, terraço, garagem"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={create} disabled={!name.trim() || saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition">
                {saving ? 'A criar…' : 'Criar watchlist'}
              </button>
              <button onClick={() => { setShowForm(false); setName(''); setFilters(EMPTY_FILTERS) }}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {watchlists.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">Nenhuma watchlist ainda</p>
          <p className="text-sm mt-1">Cria alertas para seres notificado quando chegam novos imóveis</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {watchlists.map(wl => (
            <WatchlistCard
              key={wl.id}
              wl={wl}
              onDelete={() => deleteWl(wl.id)}
              onToggle={() => toggleWl(wl.id, wl.active)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
