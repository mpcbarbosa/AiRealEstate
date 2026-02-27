'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, MapPin } from 'lucide-react'
import { PORTUGAL_GEO, getConcelhosByRegiao, getFreguesias } from '@/lib/geo/portugal'

export interface LocationSelection {
  regiao?: string
  concelho?: string
  freguesia?: string
  label: string
}

interface LocationFilterProps {
  value: LocationSelection[]
  onChange: (locations: LocationSelection[]) => void
}

export default function LocationFilter({ value, onChange }: LocationFilterProps) {
  const [open, setOpen] = useState(false)
  const [regiao, setRegiao] = useState('')
  const [concelho, setConcelho] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const concelhos = regiao ? getConcelhosByRegiao(regiao) : []
  const freguesias = (regiao && concelho) ? getFreguesias(regiao, concelho) : []

  function add(selection: LocationSelection) {
    const exists = value.some(v => v.label === selection.label)
    if (!exists) onChange([...value, selection])
    setOpen(false)
    setRegiao('')
    setConcelho('')
  }

  function remove(label: string) {
    onChange(value.filter(v => v.label !== label))
  }

  function addCurrent() {
    if (!regiao) return
    const label = [regiao, concelho].filter(Boolean).join(' › ')
    add({ regiao, concelho: concelho || undefined, label })
  }

  return (
    <div className="relative" ref={ref}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map(v => (
            <span key={v.label} className="flex items-center gap-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              {v.label}
              <button onClick={() => remove(v.label)} className="hover:text-white ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:border-gray-600 transition"
      >
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          {value.length === 0 ? 'Adicionar localização…' : `${value.length} localização(ões) selecionada(s)`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-3 space-y-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Região</label>
              <select
                value={regiao}
                onChange={e => { setRegiao(e.target.value); setConcelho('') }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Selecionar região…</option>
                {PORTUGAL_GEO.map(r => (
                  <option key={r.nome} value={r.nome}>{r.nome}</option>
                ))}
              </select>
            </div>

            {regiao && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Concelho</label>
                <select
                  value={concelho}
                  onChange={e => setConcelho(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todos os concelhos</option>
                  {concelhos.map(c => (
                    <option key={c.nome} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {concelho && freguesias.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Freguesia</label>
                <select
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) add({ regiao, concelho, freguesia: e.target.value, label: `${concelho} › ${e.target.value}` })
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todas as freguesias</option>
                  {freguesias.map(f => (
                    <option key={f.nome} value={f.nome}>{f.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {regiao && (
              <button
                onClick={addCurrent}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
              >
                + Adicionar {concelho || regiao}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
