'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Star,
  Phone,
  CheckCircle,
  XCircle,
  Archive,
  Bell,
  Settings,
  ChevronRight,
} from 'lucide-react'

const pipelineItems = [
  { label: 'Todos os imóveis', href: '/listings', icon: Home, status: null },
  { label: 'Favoritos', href: '/listings?status=favorite', icon: Star, status: 'favorite', color: 'text-yellow-600' },
  { label: 'A contactar', href: '/listings?status=to_contact', icon: Phone, status: 'to_contact', color: 'text-blue-600' },
  { label: 'Contactado', href: '/listings?status=contacted', icon: CheckCircle, status: 'contacted', color: 'text-purple-600' },
  { label: 'Sem interesse', href: '/listings?status=no_interest', icon: XCircle, status: 'no_interest', color: 'text-red-500' },
  { label: 'Fechado', href: '/listings?status=closed', icon: Archive, status: 'closed', color: 'text-green-600' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">IR</span>
          </div>
          <span className="font-bold text-gray-900">ImoRadar</span>
        </div>
      </div>

      {/* Pipeline Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Pipeline
        </p>
        {pipelineItems.map((item) => {
          const Icon = item.icon
          const isActive = item.status === null
            ? pathname === '/listings' && !window?.location?.search?.includes('status=')
            : pathname === '/listings' && typeof window !== 'undefined' && window.location.search.includes(`status=${item.status}`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors group',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4', item.color || (isActive ? 'text-blue-600' : 'text-gray-400'))} />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          )
        })}

        <div className="pt-4">
          <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Watchlists
          </p>
          <Link
            href="/watchlists"
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Bell className="w-4 h-4 text-gray-400" />
            <span>Gerir Watchlists</span>
          </Link>
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-gray-200 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-400" />
          <span>Definições</span>
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
