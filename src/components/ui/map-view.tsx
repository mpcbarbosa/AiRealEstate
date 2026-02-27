'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MapListing {
  id: string
  title: string | null
  priceEur: number | null
  locationText: string | null
  lat: number | null
  lng: number | null
  propertyType: string | null
  typology: string | null
  thumbnail: string | null
}

interface MapViewProps {
  listings: MapListing[]
}

function formatPrice(price: number | null) {
  if (!price) return '—'
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

export default function MapView({ listings }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const router = useRouter()
  const [selected, setSelected] = useState<MapListing | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const withCoords = listings.filter(l => l.lat && l.lng)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    async function initMap() {
      const mapboxgl = (await import('mapbox-gl')).default
      await import('mapbox-gl/dist/mapbox-gl.css')

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-8.6291, 39.5], // Centro de Portugal
        zoom: 6,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

      mapRef.current = map
      map.on('load', () => setMapLoaded(true))
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Atualizar markers quando os listings mudarem
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const mapboxgl = require('mapbox-gl')

    // Remover markers anteriores
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (withCoords.length === 0) return

    const bounds = new mapboxgl.LngLatBounds()

    withCoords.forEach(listing => {
      const el = document.createElement('div')
      el.className = 'map-marker'
      el.innerHTML = `
        <div style="
          background: ${selected?.id === listing.id ? '#3b82f6' : '#1e293b'};
          border: 2px solid ${selected?.id === listing.id ? '#60a5fa' : '#475569'};
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transition: all 0.15s;
        ">
          ${listing.priceEur ? formatPrice(listing.priceEur) : listing.typology || '?'}
        </div>
      `

      el.addEventListener('click', () => setSelected(listing))
      el.addEventListener('mouseenter', () => {
        el.querySelector('div')!.style.background = '#3b82f6'
        el.querySelector('div')!.style.borderColor = '#60a5fa'
      })
      el.addEventListener('mouseleave', () => {
        if (selected?.id !== listing.id) {
          el.querySelector('div')!.style.background = '#1e293b'
          el.querySelector('div')!.style.borderColor = '#475569'
        }
      })

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([listing.lng!, listing.lat!])
        .addTo(mapRef.current)

      markersRef.current.push(marker)
      bounds.extend([listing.lng!, listing.lat!])
    })

    // Ajustar zoom para mostrar todos os pins
    if (withCoords.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 })
    }
  }, [listings, mapLoaded])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />

      {/* Contador */}
      <div className="absolute top-3 left-3 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300">
        {withCoords.length} imóveis no mapa
        {listings.length - withCoords.length > 0 && (
          <span className="text-gray-500 ml-1">({listings.length - withCoords.length} sem coordenadas)</span>
        )}
      </div>

      {/* Popup do imóvel selecionado */}
      {selected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-start gap-3 p-3">
            {selected.thumbnail ? (
              <img src={selected.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-800" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 text-gray-600 text-xs">Sem foto</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{selected.title || 'Sem título'}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{selected.locationText || '—'}</p>
              <p className="text-blue-400 font-bold text-sm mt-1">{formatPrice(selected.priceEur)}</p>
              {selected.typology && (
                <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded mt-1 inline-block">{selected.typology}</span>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white shrink-0 text-lg leading-none">×</button>
          </div>
          <button
            onClick={() => router.push(`/listings/${selected.id}`)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
          >
            Ver detalhe →
          </button>
        </div>
      )}

      {withCoords.length === 0 && mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-xl px-6 py-4 text-center">
            <p className="text-gray-400 text-sm">Nenhum imóvel com coordenadas GPS</p>
            <p className="text-gray-600 text-xs mt-1">As coordenadas são preenchidas automaticamente pelo Gobii</p>
          </div>
        </div>
      )}
    </div>
  )
}
