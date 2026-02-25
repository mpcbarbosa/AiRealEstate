import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null | undefined): string {
  if (!price) return 'Preço sob consulta'
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatArea(area: number | null | undefined): string {
  if (!area) return '—'
  return `${area} m²`
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export const PIPELINE_LABELS: Record<string, string> = {
  NONE: 'Neutro',
  FAVORITE: 'Favorito',
  TO_CONTACT: 'A contactar',
  CONTACTED: 'Contactado',
  NOT_INTERESTED: 'Sem interesse',
  CLOSED: 'Fechado',
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Moradia',
  land: 'Terreno',
  commercial: 'Comercial',
  warehouse: 'Armazém',
  building: 'Edifício',
  other: 'Outro',
}

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  buy: 'Compra',
  rent: 'Arrendamento',
  invest: 'Investimento',
}

export const TYPOLOGIES = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6+']
