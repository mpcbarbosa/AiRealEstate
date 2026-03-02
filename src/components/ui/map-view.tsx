'use client'
import { useEffect, useRef } from 'react'
import { formatPrice } from '@/lib/utils'

export interface MapListing {
  id: string
  lat: number
  lng: number
  title?: string
  priceEur?: number
  typology?: string
  locationText?: string
}

interface MapViewProps {
  listings: MapListing[]
  center?: [number, number]
  zoom?: number
  height?: string
  onMarkerClick?: (id: string) => void
  singlePin?: boolean
}

export default function MapView({
  listings,
  center,
  zoom = 7,
  height = '500px',
  onMarkerClick,
  singlePin = false,
}: MapViewProps) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || listings.length === 0) return
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (cancelled || !containerRef.current) return

      // Fix leaflet default icon paths (webpack issue)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const mapCenter = center ||
        (listings.length === 1
          ? [listings[0].lat, listings[0].lng] as [number, number]
          : [39.5, -8.0] as [number, number])

      const map = L.map(containerRef.current, {
        center: mapCenter,
        zoom: singlePin ? 15 : zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const validListings = listings.filter(l => l.lat && l.lng)

      if (singlePin && validListings.length === 1) {
        const l = validListings[0]
        L.marker([l.lat, l.lng]).addTo(map)
        return
      }

      // Custom blue dot marker for clusters
      const dotIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:12px;height:12px;
          background:#3b82f6;
          border:2px solid #fff;
          border-radius:50%;
          box-shadow:0 1px 4px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -8],
      })

      validListings.forEach(l => {
        const popup = L.popup({ maxWidth: 220, className: 'imoradar-popup' }).setContent(`
          <div style="font-family:system-ui;padding:2px">
            <div style="font-size:13px;font-weight:600;color:#111;margin-bottom:4px;line-height:1.3">
              ${l.title || 'Sem título'}
            </div>
            ${l.priceEur ? `<div style="font-size:14px;font-weight:700;color:#2563eb">${formatPrice(l.priceEur)}</div>` : ''}
            ${l.typology ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${l.typology}</div>` : ''}
            ${l.locationText ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${l.locationText}</div>` : ''}
            <a href="/listings/${l.id}" style="
              display:block;margin-top:8px;padding:4px 0;
              text-align:center;background:#2563eb;color:#fff;
              border-radius:6px;font-size:12px;text-decoration:none;font-weight:500
            ">Ver detalhe →</a>
          </div>
        `)

        const marker = L.marker([l.lat, l.lng], { icon: dotIcon })
          .bindPopup(popup)
          .addTo(map)

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(l.id))
        }
      })

      // Fit bounds if multiple markers
      if (validListings.length > 1 && !center) {
        const bounds = L.latLngBounds(validListings.map(l => [l.lat, l.lng]))
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }
    }

    init()
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [listings, center, zoom, singlePin, onMarkerClick])

  if (listings.length === 0) {
    return (
      <div
        style={{ height }}
        className="bg-gray-900 rounded-xl flex flex-col items-center justify-center text-gray-500 border border-gray-800"
      >
        <div className="text-center px-6">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-sm font-medium text-gray-400 mb-1">Nenhum imóvel com coordenadas GPS</p>
          <p className="text-xs text-gray-600 max-w-xs">
            As coordenadas são preenchidas pelo agente Gobii no próximo run automático.
            Os imóveis já existentes serão atualizados na próxima ingestão.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ height, zIndex: 0 }}
      className="w-full rounded-xl overflow-hidden border border-gray-700"
    />
  )
}
