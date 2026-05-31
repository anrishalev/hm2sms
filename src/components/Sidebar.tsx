'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './Logo'
import { signOut } from 'next-auth/react'
import { MessageSquare, Phone, CreditCard, Settings, Shield, LogOut } from 'lucide-react'

const navItems = [
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/numbers', label: 'Numbers', icon: Phone },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  activeNumberCount: number
  role: string
}

export function Sidebar({ activeNumberCount, role }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col py-6 px-4">
      <div className="mb-10 px-2">
        <Logo />
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
              pathname === href
                ? 'bg-gray-100 font-semibold text-black'
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
        {role === 'ADMIN' && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
              pathname === '/admin'
                ? 'bg-gray-100 font-semibold text-black'
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }`}
          >
            <Shield size={16} />
            Admin
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 rounded text-sm text-gray-500 hover:text-black hover:bg-gray-50 mt-2 text-left"
        >
          <LogOut size={16} />
          Logout
        </button>
      </nav>

      <div className="mt-4 space-y-2">
        <div className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 text-center">
          {activeNumberCount} Active Numbers
        </div>
        <p className="text-xs text-[#5BA4CF] text-center cursor-pointer hover:underline">
          Terms of Service
        </p>
      </div>
    </aside>
  )
}
