'use client'
import { signOut } from 'next-auth/react'
import { User, LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function Topbar({ user }: { user: any }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex-1 max-w-md">
        <input
          type="text"
          placeholder="Pesquisa rápida…"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value
              window.location.href = `/listings?keywords=${encodeURIComponent(val)}`
            }
          }}
        />
      </div>

      <div className="relative ml-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-300"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="hidden sm:block">{user?.name || user?.email}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-1">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
