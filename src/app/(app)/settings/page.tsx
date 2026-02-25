'use client'
import { useEffect, useState } from 'react'
import { Copy, Plus, Trash2, Eye, EyeOff, Key } from 'lucide-react'

export default function SettingsPage() {
  const [keys, setKeys] = useState<any[]>([])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function load() {
    const res = await fetch('/api/keys')
    if (res.ok) setKeys(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createKey() {
    setCreating(true)
    const res = await fetch('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Gobii Key' }) })
    if (res.ok) {
      const data = await res.json()
      setNewKey(data.key)
    }
    setCreating(false)
    load()
  }

  async function deleteKey(id: string) {
    if (!confirm('Apagar esta chave?')) return
    await fetch(`/api/keys?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Definições</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Key className="w-5 h-5" />API Keys (Gobii)</h2>
            <p className="text-sm text-gray-500 mt-0.5">Usa estas chaves para autenticar os agentes Gobii no endpoint de ingest</p>
          </div>
          <button onClick={createKey} disabled={creating}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm transition">
            <Plus className="w-4 h-4" />Nova chave
          </button>
        </div>

        {newKey && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4">
            <p className="text-xs text-green-400 mb-1">✓ Chave criada! Copia agora — não voltará a ser mostrada completa.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-gray-800 px-3 py-2 rounded text-green-300 break-all">{newKey}</code>
              <button onClick={() => { navigator.clipboard.writeText(newKey); alert('Copiado!') }}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">A carregar…</p>
        ) : keys.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma chave criada ainda.</p>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                <code className="flex-1 text-xs text-gray-400">{k.key}</code>
                <span className="text-xs text-gray-600">{new Date(k.createdAt).toLocaleDateString('pt-PT')}</span>
                <button onClick={() => deleteKey(k.id)} className="text-gray-600 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500">Endpoint de ingest:</p>
          <code className="text-xs text-blue-400">POST /api/ingest/gobii/listings</code>
          <p className="text-xs text-gray-600 mt-1">Header: <code>X-API-KEY: &lt;chave&gt;</code></p>
        </div>
      </div>
    </div>
  )
}
