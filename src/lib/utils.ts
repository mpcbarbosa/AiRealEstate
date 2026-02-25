import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null | undefined): string {
  if (!price) return '—'
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatArea(area: number | null | undefined): string {
  if (!area) return '—'
  return `${area.toLocaleString('pt-PT')} m²`
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const PIPELINE_LABELS: Record<string, string> = {
  none: 'Sem estado',
  favorite: 'Favorito',
  to_contact: 'A contactar',
  contacted: 'Contactado',
  no_interest: 'Sem interesse',
  closed: 'Fechado',
}

export const PIPELINE_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-700',
  favorite: 'bg-yellow-100 text-yellow-800',
  to_contact: 'bg-blue-100 text-blue-800',
  contacted: 'bg-purple-100 text-purple-800',
  no_interest: 'bg-red-100 text-red-700',
  closed: 'bg-green-100 text-green-800',
}

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  buy: 'Comprar',
  rent: 'Arrendar',
  invest: 'Investir',
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
