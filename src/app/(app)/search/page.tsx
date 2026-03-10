'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PORTUGAL_GEO, getConcelhosByRegiao } from '@/lib/geo/portugal'
import { MapPin, Search, ChevronDown } from 'lucide-react'

const BUSINESS_OPTIONS = [
  { value: '', label: 'Compra ou arrendamento' },
  { value: 'buy', label: 'Comprar' },
  { value: 'rent', label: 'Arrendar' },
]

const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Moradia' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'land', label: 'Terreno' },
  { value: 'warehouse', label: 'Armazém' },
  { value: 'building', label: 'Edifício' },
  { value: 'other', label: 'Outro' },
]

const TYPOLOGY_OPTIONS = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5+']

const BUDGET_OPTIONS = [
  { value: '', label: 'Sem limite' },
  { value: '100000', label: 'até 100 000 €' },
  { value: '200000', label: 'até 200 000 €' },
  { value: '300000', label: 'até 300 000 €' },
  { value: '500000', label: 'até 500 000 €' },
  { value: '750000', label: 'até 750 000 €' },
  { value: '1000000', label: 'até 1 000 000 €' },
  { value: '1500000', label: 'até 1 500 000 €' },
]

const POPULAR_REGIOES = ['Lisboa', 'Porto', 'Braga', 'Setúbal', 'Aveiro', 'Coimbra', 'Faro']

export default function SearchPage() {
  const router = useRouter()
  const [regiao, setRegiao] = useState('')
  const [concelho, setConcelho] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [typologies, setTypologies] = useState<string[]>([])
  const [propertyType, setPropertyType] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const concelhos = regiao ? getConcelhosByRegiao(regiao) : []
  const canSearch = !!regiao

  function toggleTypology(t: string) {
    setTypologies(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function handleSearch() {
    if (!canSearch) return
    const params = new URLSearchParams()
    const locationLabel = concelho ? `${regiao} › ${concelho}` : regiao
    params.set('location', locationLabel)
    if (businessType) params.set('businessType', businessType)
    if (propertyType) params.set('propertyType', propertyType)
    if (typologies.length === 1) params.set('typology', typologies[0])
    if (priceMax) params.set('priceMax', priceMax)
    router.push(`/listings?${params.toString()}`)
  }

  const sortedRegioes = [
    ...PORTUGAL_GEO.filter(r => POPULAR_REGIOES.includes(r.nome)),
    ...PORTUGAL_GEO.filter(r => !POPULAR_REGIOES.includes(r.nome)),
  ]

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">

      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Onde queres viver?
        </h1>
        <p className="text-gray-400 text-lg">
          Anúncios de todos os portais imobiliários portugueses, num só lugar
        </p>
      </div>

      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-5">

        {/* Localização */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-400" />
            Localização <span className="text-blue-400 ml-0.5">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={regiao}
                onChange={e => { setRegiao(e.target.value); setConcelho('') }}
                className="w-full appearance-none bg-gray-800 border border-gray-700 hover:border-gray-500 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition pr-8"
              >
                <option value="">Região…</option>
                {sortedRegioes.map(r => (
                  <option key={r.nome} value={r.nome}>{r.nome}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={concelho}
                onChange={e => setConcelho(e.target.value)}
                disabled={!regiao}
                className="w-full appearance-none bg-gray-800 border border-gray-700 hover:border-gray-500 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition disabled:opacity-40 disabled:cursor-not-allowed pr-8"
              >
                <option value="">Todos os concelhos</option>
                {concelhos.map(c => (
                  <option key={c.nome} value={c.nome}>{c.nome}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tipo de imóvel */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de imóvel</label>
          <div className="flex gap-2 flex-wrap">
            {PROPERTY_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPropertyType(prev => prev === opt.value ? '' : opt.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                  propertyType === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Negócio */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Negócio</label>
          <div className="flex gap-2">
            {BUSINESS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setBusinessType(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                  businessType === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipologia — só para apartamento/moradia */}
        {(!propertyType || propertyType === 'apartment' || propertyType === 'house') && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipologia</label>
          <div className="flex gap-2 flex-wrap">
            {TYPOLOGY_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => toggleTypology(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  typologies.includes(t)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Orçamento */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Orçamento máximo</label>
          <div className="relative">
            <select
              value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
              className="w-full appearance-none bg-gray-800 border border-gray-700 hover:border-gray-500 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition pr-8"
            >
              {BUDGET_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Botão */}
        <button
          onClick={handleSearch}
          disabled={!canSearch}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-base"
        >
          <Search className="w-5 h-5" />
          Ver imóveis
        </button>

        {!canSearch && (
          <p className="text-center text-xs text-gray-600">Seleciona uma região para pesquisar</p>
        )}
      </div>
    </div>
  )
}
