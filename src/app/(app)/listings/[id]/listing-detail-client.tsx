'use client'
import { proxyImageUrls } from '@/lib/image-proxy'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatPrice, formatArea, formatDate, PIPELINE_LABELS, PROPERTY_TYPE_LABELS, BUSINESS_TYPE_LABELS } from '@/lib/utils'
import {
  MapPin, ExternalLink, Star, Phone, PhoneCall, XCircle, CheckCircle2,
  Clock, Plus, Trash2, ArrowLeft, ChevronLeft, ChevronRight, Home,
  Maximize2, X, Building2, Ruler, Euro, Calendar, Tag
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/ui/map-view'), { ssr: false })

const PIPELINE_OPTIONS = [
  { value: 'NONE', label: 'Neutro', color: 'bg-gray-700 text-gray-300' },
  { value: 'FAVORITE', label: '⭐ Favorito', color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
  { value: 'TO_CONTACT', label: '📞 A contactar', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  { value: 'CONTACTED', label: '✅ Contactado', color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
  { value: 'NOT_INTERESTED', label: '✖ Sem interesse', color: 'bg-gray-600/20 text-gray-400 border border-gray-600/30' },
  { value: 'CLOSED', label: '🔒 Fechado', color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
]

function ImageGallery({ images, title }: { images: string[], title: string }) {
  const [current, setCurrent] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, boolean>>({})

  if (!images || images.length === 0) {
    return (
      <div className="h-72 bg-gray-800 rounded-xl flex items-center justify-center text-gray-600">
        <div className="text-center">
          <Home className="w-16 h-16 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Sem fotografias</p>
        </div>
      </div>
    )
  }

  const validImages = images.filter((_, i) => !errors[i])

  return (
    <>
      <div className="relative rounded-xl overflow-hidden bg-gray-800 h-72 group">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${title} - foto ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${i === current ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(l => ({ ...l, [i]: true }))}
            onError={() => setErrors(e => ({ ...e, [i]: true }))}
          />
        ))}

        {/* Overlay sem foto */}
        {errors[current] && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600">
            <Home className="w-16 h-16 opacity-20" />
          </div>
        )}

        {/* Controlos de navegação */}
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition opacity-0 group-hover:opacity-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrent(c => (c + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition opacity-0 group-hover:opacity-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Fullscreen button */}
        <button onClick={() => setFullscreen(true)}
          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition opacity-0 group-hover:opacity-100">
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Contador */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-3' : 'bg-white/50'}`} />
            ))}
          </div>
        )}

        {/* Contador de fotos */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
          {current + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition ${i === current ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={src} alt="" className="w-full h-full object-cover"
                onError={() => setErrors(e => ({ ...e, [i]: true }))} />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setFullscreen(false)}>
          <button onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setCurrent(c => (c - 1 + images.length) % images.length) }}
            className="absolute left-4 p-2 text-white hover:text-gray-300">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img src={images[current]} alt={title} className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); setCurrent(c => (c + 1) % images.length) }}
            className="absolute right-4 p-2 text-white hover:text-gray-300">
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="absolute bottom-4 text-white text-sm">{current + 1}/{images.length}</div>
        </div>
      )}
    </>
  )
}

export default function ListingDetailClient() {
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
    const current = listing?.userListings?.[0]?.status
    await fetch('/api/user/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingMasterId: id, status: current === status ? 'NONE' : status }),
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
      <p className="text-lg">Imóvel não encontrado</p>
      <Link href="/listings" className="text-blue-400 hover:underline mt-2 block">← Voltar à lista</Link>
    </div>
  )

  const userListing = listing.userListings?.[0]
  const currentStatus = userListing?.status || 'NONE'
  const allImages = proxyImageUrls(listing.sources?.flatMap((s: any) => s.images || []) || [])
  const mainSource = listing.sources?.[0]

  const daysOnMarket = mainSource?.publishedAt
    ? Math.floor((Date.now() - new Date(mainSource.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white leading-tight">{listing.title || 'Sem título'}</h1>
          {listing.locationText && (
            <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />{listing.locationText}
            </p>
          )}
        </div>
        {mainSource?.sourceUrl && (
          <a href={mainSource.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition shrink-0">
            <ExternalLink className="w-4 h-4" />
            Ver anúncio
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Preço em destaque */}
          <div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl font-bold text-blue-400">{formatPrice(listing.priceEur)}</span>
              {listing.areaM2 && listing.priceEur && (
                <span className="text-lg text-gray-500">{formatPrice(listing.priceEur / listing.areaM2)}/m²</span>
              )}
            </div>
            {daysOnMarket !== null && (
              <p className="text-sm text-gray-400 mt-1">
                📅 {new Date(mainSource.publishedAt).toLocaleDateString('pt-PT')}
                <span className="text-gray-500 ml-1">· {daysOnMarket === 0 ? 'publicado hoje' : daysOnMarket === 1 ? '1 dia no mercado' : `${daysOnMarket} dias no mercado`}</span>
              </p>
            )}
          </div>

          {/* Atributos */}
          <div className="flex flex-wrap gap-2">
            {listing.typology && <span className="bg-gray-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg">{listing.typology}</span>}
            {listing.areaM2 && <span className="bg-gray-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg">{formatArea(listing.areaM2)}</span>}
            {listing.propertyType && <span className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-lg">{PROPERTY_TYPE_LABELS[listing.propertyType]}</span>}
            {listing.businessType && <span className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-lg">{BUSINESS_TYPE_LABELS[listing.businessType]}</span>}
            {!listing.active && (
              <span className="bg-red-900/60 text-red-300 text-sm px-3 py-1.5 rounded-lg font-medium">
                {listing.offMarketReason === 'sold' ? '🏷️ Vendido' : 'Removido do mercado'}
              </span>
            )}
          </div>

          {/* Descrição */}
          {listing.description && (
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{listing.description}</p>
          )}

          {/* Características */}
          {listing.features && Object.keys(listing.features).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(listing.features).map(([k, v]: any) => (
                <span key={k} className={`text-xs px-2 py-1 rounded-lg ${v ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-600 line-through'}`}>
                  {k}
                </span>
              ))}
            </div>
          )}

          {/* Fontes */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
              {listing.sources?.length === 1 ? '1 fonte' : `${listing.sources?.length} fontes`}
            </p>
            <div className="space-y-2">
              {listing.sources?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{s.sourceName || 'Desconhecido'}</span>
                    {s.sourceFamily && <span className="text-xs text-gray-500">({s.sourceFamily})</span>}
                    {s.publishedAt && (
                      <span className="text-xs text-gray-500">· publicado {new Date(s.publishedAt).toLocaleDateString('pt-PT')}</span>
                    )}
                    {s.contacts?.agencyName && (
                      <span className="text-xs text-gray-500">· {s.contacts.agencyName}</span>
                    )}
                  </div>
                  <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition shrink-0">
                    Ver <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico */}
          {listing.history?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Histórico</p>
              <div className="space-y-1">
                {listing.history.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                    {h.changeType === 'PRICE_CHANGE' && <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded shrink-0">💰 Preço</span>}
                    {h.changeType === 'CREATED' && <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded shrink-0">✨ Criado</span>}
                    {h.changeType === 'FIELD_UPDATE' && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded shrink-0">📝 Atualizado</span>}
                    {h.changeType === 'DEACTIVATED' && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded shrink-0">🚫 Inativo</span>}
                    <p className="flex-1 text-xs text-gray-400">
                      {h.oldValue && h.newValue ? <><span className="line-through text-gray-600">{h.oldValue}</span> → <span className="text-white">{h.newValue}</span></> : h.note || '—'}
                    </p>
                    <span className="text-xs text-gray-600 shrink-0">{formatDate(h.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Notas</p>
            <div className="flex gap-2 mb-3">
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                placeholder="Escreve uma nota…"
                rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addNote() }}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500" />
              <button onClick={addNote} disabled={saving || !newNote.trim()}
                className="px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {listing.notes?.length === 0 && <p className="text-gray-600 text-sm">Sem notas ainda</p>}
            {listing.notes?.map((n: any) => (
              <div key={n.id} className="bg-gray-800 rounded-xl p-3 flex items-start gap-2 mb-2">
                <p className="flex-1 text-sm text-gray-300 leading-relaxed">{n.content}</p>
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                  <span className="text-xs text-gray-600">{formatDate(n.createdAt)}</span>
                  <button onClick={() => deleteNote(n.id)} className="text-gray-600 hover:text-red-400 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tarefas */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Tarefas</p>
            <div className="flex gap-2 mb-3">
              <input value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                placeholder="Nova tarefa…"
                onKeyDown={e => { if (e.key === 'Enter') addTask() }}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
              <input type="date" value={newTask.dueDate} onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              <button onClick={addTask} disabled={saving || !newTask.title.trim()}
                className="px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {listing.tasks?.length === 0 && <p className="text-gray-600 text-sm">Sem tarefas ainda</p>}
            {listing.tasks?.map((t: any) => (
              <div key={t.id} className={`flex items-center gap-3 rounded-xl p-3 mb-2 transition ${t.done ? 'bg-gray-800/50' : 'bg-gray-800'}`}>
                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id, t.done)}
                  className="w-4 h-4 rounded accent-blue-500 shrink-0" />
                <span className={`flex-1 text-sm ${t.done ? 'line-through text-gray-600' : 'text-gray-300'}`}>{t.title}</span>
                {t.dueDate && (
                  <span className={`text-xs flex items-center gap-1 ${new Date(t.dueDate) < new Date() && !t.done ? 'text-red-400' : 'text-gray-500'}`}>
                    <Clock className="w-3 h-3" />{formatDate(t.dueDate)}
                  </span>
                )}
                <button onClick={() => deleteTask(t.id)} className="text-gray-600 hover:text-red-400 transition shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-600 pt-2">Capturado em {formatDate(listing.createdAt)}</p>

        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Pipeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Estado Pipeline</p>
            <div className="space-y-1.5">
              {PIPELINE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setPipelineStatus(opt.value)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentStatus === opt.value
                      ? opt.color + ' ring-1 ring-inset ring-current'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}>
                  {opt.label}
                  {currentStatus === opt.value && <span className="ml-auto text-xs opacity-60">✓ ativo</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Contacto */}
          {mainSource?.contacts && (mainSource.contacts.agencyName || mainSource.contacts.phone) && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Contacto</p>
              <div className="space-y-2 text-sm">
                {mainSource.contacts.agencyName && (
                  <p className="text-white font-medium">{mainSource.contacts.agencyName}</p>
                )}
                {mainSource.contacts.phone && (
                  <a href={`tel:${mainSource.contacts.phone}`}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
                    <Phone className="w-4 h-4" />{mainSource.contacts.phone}
                  </a>
                )}
                {mainSource.contacts.email && (
                  <a href={`mailto:${mainSource.contacts.email}`}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
                    ✉️ {mainSource.contacts.email}
                  </a>
                )}
                {mainSource.contacts.contactUrl && (
                  <a href={mainSource.contacts.contactUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />Formulário de contacto
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Mapa */}
          {listing.lat && listing.lng && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Localização</p>
                <a href={`https://www.google.com/maps?q=${listing.lat},${listing.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline">
                  Google Maps →
                </a>
              </div>
              <MapView
                listings={[{ id: listing.id, lat: listing.lat, lng: listing.lng, title: listing.title }]}
                height="220px"
                singlePin
              />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
