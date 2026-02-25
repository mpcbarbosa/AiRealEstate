'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatPrice, formatArea, formatDate, PIPELINE_LABELS, PROPERTY_TYPE_LABELS, BUSINESS_TYPE_LABELS } from '@/lib/utils'
import { MapPin, ExternalLink, Star, Phone, PhoneCall, XCircle, CheckCircle2, Clock, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const PIPELINE_OPTIONS = [
  { value: 'NONE', label: 'Neutro', color: 'text-gray-400' },
  { value: 'FAVORITE', label: 'Favorito', color: 'text-yellow-400', icon: Star },
  { value: 'TO_CONTACT', label: 'A contactar', color: 'text-blue-400', icon: Phone },
  { value: 'CONTACTED', label: 'Contactado', color: 'text-green-400', icon: PhoneCall },
  { value: 'NOT_INTERESTED', label: 'Sem interesse', color: 'text-gray-500', icon: XCircle },
  { value: 'CLOSED', label: 'Fechado', color: 'text-purple-400', icon: CheckCircle2 },
]

export default function ListingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'info' | 'sources' | 'history' | 'notes' | 'tasks'>('info')
  const [newNote, setNewNote] = useState('')
  const [newTask, setNewTask] = useState({ title: '', dueDate: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch(`/api/listings/${id}`)
    if (res.ok) setListing(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function setPipelineStatus(status: string) {
    await fetch('/api/user/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingMasterId: id, status }),
    })
    load()
  }

  async function addNote() {
    if (!newNote.trim()) return
    setSaving(true)
    await fetch('/api/user/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingMasterId: id, content: newNote }),
    })
    setNewNote('')
    setSaving(false)
    load()
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/user/notes?id=${noteId}`, { method: 'DELETE' })
    load()
  }

  async function addTask() {
    if (!newTask.title.trim()) return
    setSaving(true)
    await fetch('/api/user/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingMasterId: id, ...newTask }),
    })
    setNewTask({ title: '', dueDate: '' })
    setSaving(false)
    load()
  }

  async function toggleTask(taskId: string, done: boolean) {
    await fetch('/api/user/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, done: !done }),
    })
    load()
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/user/tasks?id=${taskId}`, { method: 'DELETE' })
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!listing) return (
    <div className="text-center py-24 text-gray-600">
      <p>Imóvel não encontrado</p>
      <Link href="/listings" className="text-blue-400 hover:underline mt-2 block">Voltar</Link>
    </div>
  )

  const userListing = listing.userListings?.[0]
  const currentStatus = userListing?.status || 'NONE'
  const mainImage = listing.sources?.[0]?.images?.[0]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-white flex-1 line-clamp-1">{listing.title || 'Sem título'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Image */}
          {mainImage && (
            <div className="rounded-xl overflow-hidden h-56 bg-gray-800">
              <img src={mainImage} alt={listing.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {(['info', 'sources', 'history', 'notes', 'tasks'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${tab === t ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {{info:'Info', sources:`Fontes (${listing.sources?.length||0})`, history:`Histórico (${listing.history?.length||0})`, notes:`Notas (${listing.notes?.length||0})`, tasks:`Tarefas (${listing.tasks?.length||0})`}[t]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            {tab === 'info' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {listing.businessType && <div><p className="text-xs text-gray-500">Tipo de negócio</p><p className="text-sm text-white">{BUSINESS_TYPE_LABELS[listing.businessType]}</p></div>}
                  {listing.propertyType && <div><p className="text-xs text-gray-500">Tipo de imóvel</p><p className="text-sm text-white">{PROPERTY_TYPE_LABELS[listing.propertyType]}</p></div>}
                  {listing.typology && <div><p className="text-xs text-gray-500">Tipologia</p><p className="text-sm text-white">{listing.typology}</p></div>}
                  {listing.areaM2 && <div><p className="text-xs text-gray-500">Área</p><p className="text-sm text-white">{formatArea(listing.areaM2)}</p></div>}
                  {listing.locationText && <div className="col-span-2"><p className="text-xs text-gray-500">Localização</p><p className="text-sm text-white">{listing.locationText}</p></div>}
                </div>
                {listing.description && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Descrição</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{listing.description}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'sources' && (
              <div className="space-y-3">
                {listing.sources?.map((s: any) => (
                  <div key={s.id} className="border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{s.sourceName || 'Desconhecido'}</span>
                      <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
                        Ver anúncio <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {s.sourceFamily && <p className="text-xs text-gray-500 mt-1">{s.sourceFamily}</p>}
                    {s.capturedAt && <p className="text-xs text-gray-600 mt-1">Capturado: {formatDate(s.capturedAt)}</p>}
                  </div>
                ))}
              </div>
            )}

            {tab === 'history' && (
              <div className="space-y-2">
                {listing.history?.length === 0 && <p className="text-gray-500 text-sm">Sem histórico</p>}
                {listing.history?.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded mt-0.5">{h.changeType}</span>
                    <div className="flex-1">
                      {h.fieldName && <p className="text-xs text-gray-400">{h.fieldName}: {h.oldValue} → {h.newValue}</p>}
                      {h.note && <p className="text-xs text-gray-400">{h.note}</p>}
                    </div>
                    <span className="text-xs text-gray-600">{formatDate(h.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'notes' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Escreve uma nota…"
                    rows={2}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={addNote} disabled={saving || !newNote.trim()}
                    className="px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {listing.notes?.map((n: any) => (
                  <div key={n.id} className="flex items-start gap-2 bg-gray-800 rounded-lg p-3">
                    <p className="flex-1 text-sm text-gray-300">{n.content}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-600">{formatDate(n.createdAt)}</span>
                      <button onClick={() => deleteNote(n.id)} className="text-gray-600 hover:text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'tasks' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={newTask.title}
                    onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                    placeholder="Nova tarefa…"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={addTask} disabled={saving || !newTask.title.trim()}
                    className="px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {listing.tasks?.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id, t.done)}
                      className="w-4 h-4 rounded accent-blue-500" />
                    <span className={`flex-1 text-sm ${t.done ? 'line-through text-gray-600' : 'text-gray-300'}`}>{t.title}</span>
                    {t.dueDate && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(t.dueDate)}</span>}
                    <button onClick={() => deleteTask(t.id)} className="text-gray-600 hover:text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - summary + pipeline */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-400 mb-1">{formatPrice(listing.priceEur)}</p>
            {listing.areaM2 && listing.priceEur && (
              <p className="text-sm text-gray-500">{formatPrice(listing.priceEur / listing.areaM2)} /m²</p>
            )}
            {listing.locationText && (
              <p className="flex items-center gap-1 text-sm text-gray-400 mt-2">
                <MapPin className="w-4 h-4" />{listing.locationText}
              </p>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase">Estado Pipeline</p>
            <div className="space-y-1">
              {PIPELINE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPipelineStatus(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${currentStatus === opt.value ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                >
                  {opt.icon && <opt.icon className="w-4 h-4" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
