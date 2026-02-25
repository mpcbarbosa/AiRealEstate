'use client'
import { useEffect, useState } from 'react'
import { Bell, Plus, Trash2, Edit2 } from 'lucide-react'
import { PIPELINE_LABELS, BUSINESS_TYPE_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/utils'

export default function WatchlistsPage() {
  const [watchlists, setWatchlists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', businessType: '', propertyType: '', location: '', priceMax: '', typology: '' })

  async function load() {
    const res = await fetch('/api/watchlists')
    if (res.ok) setWatchlists(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.name.trim()) return
    const filtersJson: any = {}
    if (form.businessType) filtersJson.businessType = form.businessType
    if (form.propertyType) filtersJson.propertyType = form.propertyType
    if (form.location) filtersJson.location = form.location
    if (form.priceMax) filtersJson.priceMax = parseFloat(form.priceMax)
    if (form.typology) filtersJson.typology = form.typology

    await fetch('/api/watchlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, filtersJson }),
    })
    setForm({ name: '', businessType: '', propertyType: '', location: '', priceMax: '', typology: '' })
    setShowForm(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Apagar watchlist?')) return
    await fetch(`/api/watchlists?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="w-6 h-6" />Watchlists
        </h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition">
          <Plus className="w-4 h-4" />Nova watchlist
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-white mb-3">Nova watchlist</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome (ex: T3 Lisboa até 300k)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <select value={form.businessType} onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Qualquer negócio</option>
              <option value="buy">Compra</option>
              <option value="rent">Arrendamento</option>
              <option value="invest">Investimento</option>
            </select>
            <select value={form.propertyType} onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Qualquer tipo</option>
              <option value="apartment">Apartamento</option>
              <option value="house">Moradia</option>
              <option value="land">Terreno</option>
              <option value="commercial">Comercial</option>
            </select>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Localização"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
            <input type="number" value={form.priceMax} onChange={e => setForm(f => ({ ...f, priceMax: e.target.value }))}
              placeholder="Preço máx. (€)"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
            <button onClick={create} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition">Guardar</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-500">A carregar…</p> : watchlists.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma watchlist criada</p>
          <p className="text-sm mt-1">Cria watchlists para seres notificado de novos imóveis</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlists.map(w => (
            <div key={w.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between">
              <div>
                <h3 className="font-medium text-white">{w.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {w.filtersJson.businessType && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">{BUSINESS_TYPE_LABELS[w.filtersJson.businessType]}</span>}
                  {w.filtersJson.propertyType && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{PROPERTY_TYPE_LABELS[w.filtersJson.propertyType]}</span>}
                  {w.filtersJson.location && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">📍 {w.filtersJson.location}</span>}
                  {w.filtersJson.priceMax && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">até {w.filtersJson.priceMax.toLocaleString('pt-PT')} €</span>}
                </div>
              </div>
              <button onClick={() => remove(w.id)} className="text-gray-600 hover:text-red-400 transition mt-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
