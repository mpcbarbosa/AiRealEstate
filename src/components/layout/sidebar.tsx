'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Home, Star, Phone, PhoneCall, XCircle, CheckCircle2, Bell, Settings, BarChart3 } from 'lucide-react'

const pipelineItems = [
  { label: 'Todos', href: '/listings', icon: Home, status: '' },
  { label: 'Favoritos', href: '/listings?status=FAVORITE', icon: Star, status: 'FAVORITE' },
  { label: 'A contactar', href: '/listings?status=TO_CONTACT', icon: Phone, status: 'TO_CONTACT' },
  { label: 'Contactado', href: '/listings?status=CONTACTED', icon: PhoneCall, status: 'CONTACTED' },
  { label: 'Sem interesse', href: '/listings?status=NOT_INTERESTED', icon: XCircle, status: 'NOT_INTERESTED' },
  { label: 'Fechado', href: '/listings?status=CLOSED', icon: CheckCircle2, status: 'CLOSED' },
]

const toolItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Watchlists', href: '/watchlists', icon: Bell },
  { label: 'Admin', href: '/admin/ingest', icon: BarChart3 },
  { label: 'Definições', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">ImoRadar</h1>
        <p className="text-xs text-gray-500">CRM Imobiliário</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-auto">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wider px-2 py-2 mt-1">Pipeline</p>
        {pipelineItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === '/listings' && item.href === '/listings'
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <p className="text-xs font-medium text-gray-600 uppercase tracking-wider px-2 py-2 mt-3">Ferramentas</p>
        {toolItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
