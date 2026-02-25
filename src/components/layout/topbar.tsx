'use client'
import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { ChevronDown, LogOut, Bell, Home, TrendingDown, Check } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<{ notifications: any[]; unreadCount: number }>({ notifications: [], unreadCount: 0 })
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch('/api/notifications')
    if (res.ok) setData(await res.json())
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readAll: true }) })
    load()
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000) // poll a cada 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const ICONS: Record<string, any> = {
    NEW_LISTING: Home,
    PRICE_DROP: TrendingDown,
    LISTING_REMOVED: Bell,
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen(!open); if (!open) load() }}
        className="relative p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">
        <Bell className="w-5 h-5" />
        {data.unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-semibold text-white">
              Notificações {data.unreadCount > 0 && <span className="text-blue-400">({data.unreadCount})</span>}
            </p>
            {data.unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
                <Check className="w-3 h-3" />Marcar todas lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-600">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Sem notificações</p>
              </div>
            ) : (
              data.notifications.map(n => {
                const Icon = ICONS[n.type] || Bell
                const img = n.listingMaster?.sources?.[0]?.images?.[0]
                return (
                  <div key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800 transition cursor-pointer ${n.read ? 'opacity-60' : ''}`}
                    onClick={() => { markRead(n.id); setOpen(false) }}>
                    <div className="shrink-0 mt-0.5">
                      {img ? (
                        <img src={img} alt="" className="w-10 h-8 object-cover rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${n.type === 'PRICE_DROP' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                          <Icon className={`w-4 h-4 ${n.type === 'PRICE_DROP' ? 'text-green-400' : 'text-blue-400'}`} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${n.read ? 'text-gray-500' : 'text-gray-300'}`}>{n.message}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{new Date(n.createdAt).toLocaleString('pt-PT')}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                )
              })
            )}
          </div>

          {data.notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-800">
              <Link href="/notifications" onClick={() => setOpen(false)}
                className="text-xs text-blue-400 hover:text-blue-300 transition">
                Ver todas →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface TopbarProps {
  user: { name?: string | null; email?: string | null; id?: string }
}

export default function Topbar({ user }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <NotificationBell userId={(user as any)?.id || ''} />

        <div ref={menuRef} className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {(user.name || user.email || '?')[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 max-w-32 truncate">{user.name || user.email}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-gray-800">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/login' }) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition">
                  <LogOut className="w-4 h-4" />
                  Terminar sessão
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
