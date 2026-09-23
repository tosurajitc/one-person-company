'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Brain, Sparkles, Zap, ArrowRight, Search, ChevronDown, Globe, Users, BarChart3, Shield, Settings, LogOut, User, Bell, Crown, LayoutDashboard, LayoutTemplate, ExternalLink, Wallet, Share2 } from 'lucide-react'
import { useSiteConfig } from '../hooks/useSiteConfig'

// ─────────────────────────────────────────────
// Brand — edit here to rename or swap the logo
//   Logo file:    frontend/public/brand/logo-mark.png   (or .png — update LOGO_SRC)
//   Favicon file: frontend/app/favicon.ico              (Next.js picks it up automatically)
// If the logo file is missing, the header falls back to the Brain icon.
// ─────────────────────────────────────────────
const BRAND_NAME = 'Shukto'
const LOGO_SRC = '/brand/logo-mark.png'
const SHOW_NAME_NEXT_TO_LOGO = true // set false if your logo file already contains the "Shukto" wordmark

// Theme (matches the home page): bottle green + light green + orange
const GREEN = '#0a4836'
const GREEN_DEEP = '#053728'

// Routes that have their own full-page shell (AdminShell, founder site nav, etc.)
// and must NOT render the platform header/footer.
const SUPPRESS_HEADER_PREFIXES = ['/admin', '/templates']

function isFounderSitePath(pathname) {
  if (SUPPRESS_HEADER_PREFIXES.some(p => pathname.startsWith(p + '/'))) return true
  // Founder site slugs: single lowercase segment, not a known platform route
  const PLATFORM_ROUTES = new Set([
    'dashboard', 'profile', 'settings', 'platform', 'setup-wizard',
    'login', 'signout', 'pricing', 'resources', 'community',
    'marketing', 'contact', 'get_started', 'about', 'auth', 'templates',
  ])
  if (!/^\/[a-z0-9][a-z0-9-]*$/.test(pathname)) return false
  const segment = pathname.slice(1)
  return !PLATFORM_ROUTES.has(segment)
}

export default function Header() {
  const pathname = usePathname()
  const siteConfig = useSiteConfig()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [dynamicPages, setDynamicPages] = useState([])
  const [websiteSlug, setWebsiteSlug] = useState(null)
  const [logoOk, setLogoOk] = useState(true)

  useEffect(() => {
    fetch('/api/pages/public')
      .then(r => r.ok ? r.json() : [])
      .then(pages => setDynamicPages(pages.filter(p => p.in_header_nav)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const checkUserAuth = () => {
      const token = localStorage.getItem('auth_token')
      const userRole = localStorage.getItem('user_role') // 'super_admin', 'admin', 'user'
      const userData = localStorage.getItem('user_data')

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser({ ...parsedUser, role: userRole || 'user' })
          // Fetch the user's website subdomain
          fetch('/api/settings/mine', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(settings => {
              const slug = settings?.site?.subdomain || null
              if (slug) setWebsiteSlug(slug)
            })
            .catch(() => {})
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      } else {
        setWebsiteSlug(null)
      }
    }

    checkUserAuth()

    // 'storage' fires from other tabs, 'authchange' is dispatched from this tab after login/logout.
    window.addEventListener('storage', checkUserAuth)
    window.addEventListener('authchange', checkUserAuth)
    return () => {
      window.removeEventListener('storage', checkUserAuth)
      window.removeEventListener('authchange', checkUserAuth)
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_data')
    localStorage.removeItem('oauth_state')
    localStorage.removeItem('oauth_provider')
    window.dispatchEvent(new Event('authchange'))
    setUser(null)
    setIsProfileOpen(false)
    // /signout is a server-side route handler that clears the token cookie before redirecting to /login
    window.location.href = '/signout'
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'
  const isLoggedIn = !!user

  const getUserInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      default: return 'User'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-[#d9f5e4] text-[#053728] border-[#a7f3c0]'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Shared class strings so the palette lives in one place
  const navLink = 'px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:text-[#0a4836]'
  const menuItem = 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[#f2faf5] hover:text-[#0a4836] transition-colors'
  const adminItem = 'flex items-center px-4 py-2 text-sm text-[#0a4836] hover:bg-[#f2faf5] transition-colors'
  const ctaOrange = 'flex items-center bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30 transition-all duration-200'
  const avatar = 'bg-gradient-to-br from-[#053728] to-[#0a4836] text-[#a7f3c0]'

  // Hide platform header on founder-generated website pages
  if (isFounderSitePath(pathname)) return null

  return (
    <header
      className={`fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#c9f2d8] transition-shadow ${isScrolled ? 'shadow-lg' : 'shadow-sm'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group" aria-label={`${BRAND_NAME} home`}>
            {logoOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={LOGO_SRC}
                alt={BRAND_NAME}
                className="h-10 w-auto max-w-[160px] object-contain"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#053728] to-[#0a4836] group-hover:opacity-90 transition-opacity">
                <Brain className="w-6 h-6 text-[#a7f3c0]" />
              </div>
            )}
            {(SHOW_NAME_NEXT_TO_LOGO || !logoOk) && (
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-[#06352a] leading-tight">{BRAND_NAME}</h1>
                {siteConfig?.brand?.tagline && (
                  <p className="text-xs text-gray-500">{siteConfig.brand.tagline}</p>
                )}
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <div className="relative group">
              <button className={`${navLink} flex items-center`}>
                Features
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>

              {/* Platform Dropdown Menu */}
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#c9f2d8] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link href="/platform/ai-website-builder" className="block px-4 py-3 text-sm text-gray-700 hover:bg-[#f2faf5] hover:text-[#0a4836]">
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 mr-3 text-[#0a4836]" />
                      <div>
                        <div className="font-medium">AI Website Builder</div>
                        <div className="text-xs text-gray-500">Live branded site in under 10 minutes</div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/platform/ai-genie" className="block px-4 py-3 text-sm text-gray-700 hover:bg-[#f2faf5] hover:text-[#0a4836]">
                    <div className="flex items-center">
                      <Sparkles className="w-5 h-5 mr-3 text-orange-500" />
                      <div>
                        <div className="font-medium">AI Genie</div>
                        <div className="text-xs text-gray-500">7 specialist consultants, first minute free</div>
                      </div>
                    </div>
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <Link href="/templates" className="block px-4 py-3 text-sm text-gray-700 hover:bg-[#f2faf5] hover:text-[#0a4836]">
                    <div className="flex items-center">
                      <LayoutTemplate className="w-5 h-5 mr-3 text-[#0f6b4f]" />
                      <div>
                        <div className="font-medium">Templates</div>
                        <div className="text-xs text-gray-500">Browse 16 ready-made website templates</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/pricing" className={navLink}>Pricing</Link>
            {/* Dynamic Pages from Admin */}
            {dynamicPages.map(page => (
              <Link
                key={page.id}
                href={page.slug.startsWith('/') ? page.slug : `/${page.slug}`}
                className={navLink}
              >
                {page.title}
              </Link>
            ))}

            {/* Admin Navigation - only for admin users */}
            {isAdmin && (
              <Link href="/admin" className="px-3 py-2 text-sm font-medium transition-colors flex items-center text-[#0a4836] hover:text-[#053728]">
                <Shield className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            <button className="hidden xl:flex items-center px-3 py-2 rounded-lg text-sm transition-colors text-gray-600 hover:text-[#0a4836] hover:bg-[#f2faf5]">
              <Search className="w-4 h-4 mr-2" />
              Search
            </button>

            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <button className="relative p-2 rounded-lg transition-colors text-gray-600 hover:text-[#0a4836] hover:bg-[#f2faf5]" aria-label="Notifications">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-[#f2faf5]"
                  >
                    <div className={`w-8 h-8 ${avatar} rounded-full flex items-center justify-center font-bold text-sm relative`}>
                      {getUserInitials(user.name || user.full_name)}
                      {isSuperAdmin && <Crown className="absolute -top-1 -right-1 w-3 h-3 text-orange-500" />}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{user.name || user.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{getRoleDisplay(user.role)}</p>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#c9f2d8] py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${avatar} rounded-full flex items-center justify-center font-bold relative`}>
                            {getUserInitials(user.name || user.full_name)}
                            {isSuperAdmin && <Crown className="absolute -top-1 -right-1 w-3 h-3 text-orange-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.name || user.full_name || 'User'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full border ${getRoleColor(user.role)}`}>
                              {getRoleDisplay(user.role)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {websiteSlug && (
                          <a
                            href={`/${websiteSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={menuItem}
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ExternalLink className="w-4 h-4 mr-3 text-[#0f6b4f]" />
                            <span>Open Website</span>
                          </a>
                        )}
                        <Link href="/dashboard" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                          <BarChart3 className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link href="/setup-wizard" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          My Website Admin
                        </Link>
                        <Link href="/profile" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                          <User className="w-4 h-4 mr-3" />
                          Profile Settings
                        </Link>
                        <Link href="/profile/wallet" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                          <Wallet className="w-4 h-4 mr-3" />
                          Wallet & Funds
                        </Link>
                        <Link href="/platform/offers-payments" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                          <Share2 className="w-4 h-4 mr-3" />
                          Referral Program
                        </Link>
                        <Link href="/settings" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                          <Settings className="w-4 h-4 mr-3" />
                          Account Settings
                        </Link>

                        {/* Admin Section */}
                        {isAdmin && (
                          <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <div className="px-4 py-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Administration</p>
                            </div>
                            <Link href="/admin" className={adminItem} onClick={() => setIsProfileOpen(false)}>
                              <Shield className="w-4 h-4 mr-3" />
                              Admin Dashboard
                              {isSuperAdmin && <Crown className="w-3 h-3 ml-auto text-orange-500" />}
                            </Link>
                            <Link href="/admin/users" className={adminItem} onClick={() => setIsProfileOpen(false)}>
                              <Users className="w-4 h-4 mr-3" />
                              Manage Users
                            </Link>

                            {isSuperAdmin && (
                              <>
                                <Link href="/admin/system" className={adminItem} onClick={() => setIsProfileOpen(false)}>
                                  <Settings className="w-4 h-4 mr-3" />
                                  System Settings
                                  <Crown className="w-3 h-3 ml-auto text-orange-500" />
                                </Link>
                                <Link href="/admin/analytics" className={adminItem} onClick={() => setIsProfileOpen(false)}>
                                  <BarChart3 className="w-4 h-4 mr-3" />
                                  Platform Analytics
                                  <Crown className="w-3 h-3 ml-auto text-orange-500" />
                                </Link>
                              </>
                            )}
                          </>
                        )}

                        <div className="border-t border-gray-100 my-2"></div>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 text-[#0a4836] hover:bg-[#f2faf5] border border-[#a7f3c0] hover:border-[#0a4836]"
                >
                  Sign In
                </Link>

                <Link href="/setup-wizard" className={`${ctaOrange} px-5 py-2.5 rounded-lg text-sm font-bold`}>
                  <Zap className="w-4 h-4 mr-2" />
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors text-gray-700 hover:bg-[#f2faf5]"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-[#c9f2d8] shadow-lg z-50">
            <div className="px-4 py-6 space-y-4">
              {isLoggedIn && (
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 ${avatar} rounded-full flex items-center justify-center relative`}>
                      <span className="font-bold">{getUserInitials(user.name || user.full_name)}</span>
                      {isSuperAdmin && <Crown className="absolute -top-1 -right-1 w-3 h-3 text-orange-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name || user.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full border ${getRoleColor(user.role)}`}>
                        {getRoleDisplay(user.role)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link href="/dashboard" className="block py-2 text-gray-600 hover:text-[#0a4836] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>My Dashboard</Link>
                    <Link href="/profile" className="block py-2 text-gray-600 hover:text-[#0a4836] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>Profile Settings</Link>
                    <Link href="/profile/wallet" className="block py-2 text-gray-600 hover:text-[#0a4836] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>Wallet & Funds</Link>
                    <Link href="/platform/offers-payments" className="block py-2 text-gray-600 hover:text-[#0a4836] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>Referral Program</Link>

                    {isAdmin && (
                      <>
                        <Link href="/admin" className="flex items-center py-2 text-[#0a4836] hover:text-[#053728] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                          Admin Dashboard
                          {isSuperAdmin && <Crown className="w-3 h-3 ml-2 text-orange-500" />}
                        </Link>
                        <Link href="/admin/users" className="block py-2 text-[#0a4836] hover:text-[#053728] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>Manage Users</Link>
                      </>
                    )}

                    <button onClick={handleSignOut} className="block w-full text-left py-2 text-red-600 hover:text-red-700 transition-colors font-medium">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {!isLoggedIn && (
                <div className="pb-4 border-b border-gray-200 space-y-3">
                  <Link
                    href="/setup-wizard"
                    className={`${ctaOrange} justify-center w-full py-3 px-4 rounded-lg font-bold`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full py-3 px-4 text-[#0a4836] bg-[#f2faf5] rounded-lg font-semibold hover:bg-[#d9f5e4] transition-colors border border-[#a7f3c0]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              )}

              <div className="space-y-2">
                <div className="py-1">
                  <p className="py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Features</p>
                  <Link href="/platform/ai-website-builder" className="block py-2 pl-2 text-gray-600 hover:text-[#0a4836] transition-colors" onClick={() => setIsMenuOpen(false)}>AI Website Builder</Link>
                  <Link href="/platform/ai-genie" className="block py-2 pl-2 text-gray-600 hover:text-[#0a4836] transition-colors" onClick={() => setIsMenuOpen(false)}>AI Genie</Link>
                  <Link href="/templates" className="block py-2 pl-2 text-gray-600 hover:text-[#0a4836] transition-colors" onClick={() => setIsMenuOpen(false)}>Templates</Link>
                </div>
                <Link href="/pricing" className="block py-2 text-gray-600 hover:text-[#0a4836] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false)
            setIsMenuOpen(false)
          }}
        />
      )}
    </header>
  )
}