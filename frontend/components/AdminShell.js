'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3, Target, Mail, Users, FileText, Bot,
  MessageSquare, TrendingUp, Settings, Bell,
  LogOut, User, ChevronDown, LayoutDashboard, Search, Wand2,
} from 'lucide-react'
import AdminGenieChatDrawer from './AdminGenieChatDrawer'

// Canonical navigation — single source of truth for all admin pages.
const NAV_ITEMS = [
  { name: 'Setup Wizard',         href: '/setup-wizard',        icon: Wand2        },
  { name: 'Dashboard',            href: '/admin',                     icon: BarChart3    },
  { name: 'Leads & Funnel',       href: '/admin/leads',               icon: Target       },
  { name: 'Subscribers',          href: '/admin/subscribers',         icon: Mail         },
  { name: 'User Management',      href: '/admin/users',               icon: Users        },
  { name: 'Content Management',   href: '/admin/content',             icon: FileText     },
  { name: 'AI Tools Admin',       href: '/admin/ai-tools',            icon: Bot          },
  { name: 'Communities',          href: '/admin/communities',         icon: Users        },
  { name: 'Community Templates',  href: '/admin/community-templates', icon: MessageSquare },
  { name: 'Business Intelligence',href: '/admin/analytics',           icon: TrendingUp   },
  { name: 'System Settings',      href: '/admin/settings',            icon: Settings     },
  { name: 'Support Center',       href: '/admin/support',             icon: MessageSquare },
]

export default function AdminShell({ children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifications] = useState(3)
  const [user, setUser] = useState(null)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef(null)

  useEffect(() => {
    const raw = localStorage.getItem('user_data')
    if (raw) { try { setUser(JSON.parse(raw)) } catch (_) {} }
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_data')
    window.location.href = '/signout'
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A'

  // Determine active item: exact match first, then prefix match (for /admin exactly use strict)
  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left - Logo & Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-primary-600 transition-colors"
            >
              <BarChart3 className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">OPC Genie Admin</h1>
              <p className="text-sm text-gray-500">Platform Management Dashboard</p>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users, offers, analytics..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center space-x-4">
            <button className="relative text-gray-500 hover:text-primary-600 transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Avatar dropdown */}
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{initials}</span>
                </div>
                {user && (
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user.full_name || user.email}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  {user && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name || 'Admin'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  )}
                  <Link
                    href="/dashboard"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-3 text-gray-400" />
                    My Dashboard
                  </Link>
                  <Link
                    href="/dashboard/community"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-3 text-gray-400" />
                    My Community
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    Profile Settings
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 min-h-screen`}>
          <nav className="p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg transition-all ${
                    active
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="ml-3 font-medium">{item.name}</span>}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Admin Genie Copilot Drawer */}
      <AdminGenieChatDrawer />
    </div>
  )
}
