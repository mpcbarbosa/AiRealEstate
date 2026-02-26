'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy, Check, RefreshCw, Activity, Power, PowerOff, ExternalLink, Eye, EyeOff, Webhook } from 'lucide-react'

function AgentCard({ agent, onUpdate, onDelete }: { agent: any; onUpdate: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const webhookUrl = `${window.location.origin}/api/ingest/agent/${agent.slug}`

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function toggle() {
    await fetch('/api/agents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: agent.id, active: !agent.active }) })
    onUpdate()
  }

  async function regenerateSecret() {
    if (!confirm('Regenerar o secret vai invalidar o webhook actual. Tens a certeza?')) return
    setRegenerating(true)
    const res = await fetch('/api/agents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: agent.id, regenerateSecret: true }) })
    if (res.ok) onUpdate()
    setRegenerating(false)
  }

  async function deleteAgent() {
    if (!confirm(`Eliminar o agente "${agent.name}"? Esta ação não pode ser desfeita.`)) return
    await fetch(`/api/agents?id=${agent.id}`, { method: 'DELETE' })
    onDelete()
  }

  const lastRun = agent.ingestRuns?.[0]

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition ${agent.active ? 'border-gray-700' : 'border-gray-800 opacity-70'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${agent.active ? 'bg-green-400' : 'bg-gray-600'}`} />
          <div>
            <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
            {agent.description && <p className="text-xs text-gray-500 mt-0.5">{agent.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={toggle} title={agent.active ? 'Desativar' : 'Ativar'}
            className={`p-1.5 rounded-lg transition ${agent.active ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-500 hover:bg-gray-700'}`}>
            {agent.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
          </button>
          <button onClick={deleteAgent} title="Eliminar"
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metadados */}
      <div className="flex flex-wrap gap-2 mb-4">
        {agent.sourceFamily && (
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
            família: {agent.sourceFamily}
          </span>
        )}
        {agent.sourceName && (
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
            fonte: {agent.sourceName}
          </span>
        )}
        {lastRun && (
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
            último run: +{lastRun.created} de {lastRun.received} · {new Date(lastRun.startedAt).toLocaleDateString('pt-PT')}
          </span>
        )}
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
          {agent._count?.ingestRuns || 0} runs totais
        </span>
      </div>

      {/* Webhook URL */}
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-500 mb-1 font-medium">Webhook URL</p>
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <Webhook className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <code className="text-xs text-blue-300 flex-1 truncate">{webhookUrl}</code>
            <button onClick={() => copy(webhookUrl, 'url')}
              className="text-gray-500 hover:text-white transition shrink-0">
              {copied === 'url' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Secret */}
        <div>
          <p className="text-xs text-gray-500 mb-1 font-medium">Webhook Secret <span className="text-gray-600">(X-Gobii-Signature)</span></p>
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <code className="text-xs text-yellow-300 flex-1 truncate font-mono">
              {showSecret ? agent.webhookSecret : '••••••••••••••••••••••••••••••••'}
            </code>
            <button onClick={() => setShowSecret(!showSecret)} className="text-gray-500 hover:text-white transition shrink-0">
              {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => copy(agent.webhookSecret, 'secret')} className="text-gray-500 hover:text-white transition shrink-0">
              {copied === 'secret' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={regenerateSecret} disabled={regenerating} title="Regenerar secret"
              className="text-gray-500 hover:text-orange-400 transition shrink-0 disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgentsClient() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', sourceFamily: '', sourceName: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/agents')
    if (res.ok) setAgents(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ name: '', description: '', sourceFamily: '', sourceName: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agentes Gobii</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestão de webhooks e secrets por agente</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" />
          Novo agente
        </button>
      </div>

      {/* Instrução de assinatura */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6 text-sm text-gray-400">
        <p className="font-medium text-blue-300 mb-1">Como configurar no Gobii</p>
        <p>Cada agente deve enviar o header <code className="text-yellow-300 text-xs bg-gray-800 px-1.5 py-0.5 rounded">X-Gobii-Signature: sha256=HMAC_SHA256(body, secret)</code> em cada webhook. O ImoRadar valida a assinatura antes de processar.</p>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Novo agente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Nome *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Idealista PT, SuperCasa Lisboa…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Descrição</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Agente para imóveis de Lisboa no Idealista"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Source Family</label>
              <input value={form.sourceFamily} onChange={e => setForm(f => ({ ...f, sourceFamily: e.target.value }))}
                placeholder="Ex: portals, agencies"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Source Name</label>
              <input value={form.sourceName} onChange={e => setForm(f => ({ ...f, sourceName: e.target.value }))}
                placeholder="Ex: idealista, supercasa"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={create} disabled={!form.name.trim() || saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition">
              {saving ? 'A criar…' : 'Criar agente (gera secret automaticamente)'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">Nenhum agente configurado</p>
          <p className="text-sm mt-1">Cria um agente para obter a URL e secret do webhook</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} onUpdate={load} onDelete={load} />
          ))}
        </div>
      )}
    </div>
  )
}
