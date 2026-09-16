'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Brain, Sparkles, Zap, ArrowRight, Search, ChevronDown, Globe, MessageSquare, FileText, PenTool, Users, BarChart3, Shield, Settings, LogOut, User, Bell, Crown } from 'lucide-react'
import { useSiteConfig } from '../hooks/useSiteConfig'

export default function Header() {
  const siteConfig = useSiteConfig()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [dynamicPages, setDynamicPages] = useState([])

  useEffect(() => {
    fetch('/api/pages/public')
      .then(r => r.ok ? r.json() : [])
      .then(pages => setDynamicPages(pages.filter(p => p.in_header_nav)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Check for logged-in user and their role
    const checkUserAuth = () => {
      // This would typically come from your auth context/state management
      const token = localStorage.getItem('auth_token')
      const userRole = localStorage.getItem('user_role') // 'super_admin', 'admin', 'user'
      const userData = localStorage.getItem('user_data')
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser({
            ...parsedUser,
            role: userRole || 'user'
          })
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    }

    checkUserAuth()
    
    // Listen for auth changes — 'storage' fires from other tabs,
    // 'authchange' is dispatched from this tab after login/logout.
    window.addEventListener('storage', checkUserAuth)
    window.addEventListener('authchange', checkUserAuth)
    return () => {
      window.removeEventListener('storage', checkUserAuth)
      window.removeEventListener('authchange', checkUserAuth)
    }
  }, [])

  const handleSignOut = () => {
    // Clear localStorage immediately so the UI updates
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_data')
    window.dispatchEvent(new Event('authchange'))
    setUser(null)
    setIsProfileOpen(false)
    // Navigate to /signout — a server-side route handler that clears
    // the token cookie before redirecting to /login, so the middleware
    // cannot redirect /login back to /dashboard.
    window.location.href = '/signout'
  }

  // Role checks
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'
  const isLoggedIn = !!user

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Get role display name
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'user': return 'User'
      default: return 'User'
    }
  }

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-primary-100 text-primary-800 border-primary-200'
      case 'admin': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'user': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <header 
      className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-700 transition-colors duration-200">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold transition-colors text-gray-900">
                {siteConfig.brand.name}
              </h1>
              <p className="text-xs transition-colors text-gray-600">
                {siteConfig.brand.tagline}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <div className="relative group">
              <button className="px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:text-blue-600 flex items-center">
                Features
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              {/* Platform Dropdown Menu */}
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                    <Link href="/platform/ai-website-builder" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="flex items-center">
                        <Globe className="w-5 h-5 mr-3 text-blue-500" />
                        <div>
                          <div className="font-medium">AI Website Builder</div>
                          <div className="text-xs text-gray-500">Live branded site in under 10 minutes</div>
                        </div>
                      </div>
                    </Link>
                    <Link href="/platform/offers-payments" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 mr-3 text-purple-500" />
                        <div>
                          <div className="font-medium">Offers & Payments</div>
                          <div className="text-xs text-gray-500">Create packages, products & payment links</div>
                        </div>
                      </div>
                    </Link>
                    <Link href="/platform/content-studio" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="flex items-center">
                        <PenTool className="w-5 h-5 mr-3 text-orange-500" />
                        <div>
                          <div className="font-medium">Content Studio</div>
                          <div className="text-xs text-gray-500">AI-generated copy, posts & emails</div>
                        </div>
                      </div>
                    </Link>
                    <Link href="/dashboard" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-3 text-red-500" />
                        <div>
                          <div className="font-medium">Business Analytics</div>
                          <div className="text-xs text-gray-500">Revenue, visitors & customer insights</div>
                        </div>
                      </div>
                    </Link>
                  </div>
              </div>
            </div>
            
            <Link
              href="/pricing"
              className="px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:text-blue-600"
            >
              Pricing
            </Link>
            <Link
              href="/resources"
              className="px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:text-blue-600"
            >
              Playbooks
            </Link>

            {/* Dynamic Pages from Admin */}
            {dynamicPages.map(page => (
              <Link
                key={page.id}
                href={page.slug.startsWith('/') ? page.slug : `/${page.slug}`}
                className="px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:text-blue-600"
              >
                {page.title}
              </Link>
            ))}

            {/* Admin Navigation - Only show for admin users */}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2 text-sm font-medium transition-colors flex items-center text-primary-600 hover:text-primary-700"
              >
                <Shield className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <button className="hidden xl:flex items-center px-3 py-2 rounded-lg text-sm transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Search className="w-4 h-4 mr-2" />
              Search
            </button>

            {/* Authentication-based content */}
            {isLoggedIn ? (
              /* Logged In - Show User Menu */
              <div className="flex items-center space-x-3">
                {/* Notifications (for logged-in users) */}
                <button className="relative p-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm relative">
                      {getUserInitials(user.name || user.full_name)}
                      {isSuperAdmin && (
                        <Crown className="absolute -top-1 -right-1 w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{user.name || user.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{getRoleDisplay(user.role)}</p>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* User Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold relative">
                            {getUserInitials(user.name || user.full_name)}
                            {isSuperAdmin && (
                              <Crown className="absolute -top-1 -right-1 w-3 h-3 text-gray-400" />
                            )}
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
                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <BarChart3 className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile Settings
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Account Settings
                        </Link>

                        {/* Admin Section */}
                        {isAdmin && (
                          <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <div className="px-4 py-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Administration
                              </p>
                            </div>
                            <Link
                              href="/admin"
                              className="flex items-center px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Shield className="w-4 h-4 mr-3" />
                              Admin Dashboard
                              {isSuperAdmin && <Crown className="w-3 h-3 ml-auto text-primary-600" />}
                            </Link>
                            <Link
                              href="/admin/users"
                              className="flex items-center px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Users className="w-4 h-4 mr-3" />
                              Manage Users
                            </Link>
                            
                            {/* Super Admin only features */}
                            {isSuperAdmin && (
                              <>
                                <Link
                                  href="/admin/system"
                                  className="flex items-center px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                                  onClick={() => setIsProfileOpen(false)}
                                >
                                  <Settings className="w-4 h-4 mr-3" />
                                  System Settings
                                  <Crown className="w-3 h-3 ml-auto" />
                                </Link>
                                <Link
                                  href="/admin/analytics"
                                  className="flex items-center px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                                  onClick={() => setIsProfileOpen(false)}
                                >
                                  <BarChart3 className="w-4 h-4 mr-3" />
                                  Platform Analytics
                                  <Crown className="w-3 h-3 ml-auto" />
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
              /* Not Logged In - Show Login/Signup */
              <>
                {/* Login Button */}
                <Link
                  href="/login"
                  className="hidden sm:flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 hover:border-blue-300"
                >
                  Sign In
                </Link>

                {/* Start Trial Button */}
                <Link
                  href="/setup-wizard"
                  className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors duration-200"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile User Section (if logged in) */}
              {isLoggedIn && (
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center relative">
                      <span className="text-white font-bold">
                        {getUserInitials(user.name || user.full_name)}
                      </span>
                      {isSuperAdmin && (
                        <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                      )}
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
                    <Link
                      href="/dashboard"
                      className="block py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    
                    {/* Mobile Admin Links */}
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          className="flex items-center py-2 text-primary-600 hover:text-primary-700 transition-colors font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Admin Dashboard
                          {isSuperAdmin && <Crown className="w-3 h-3 ml-2 text-primary-600" />}
                        </Link>
                        <Link
                          href="/admin/users"
                          className="block py-2 text-primary-600 hover:text-primary-700 transition-colors font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Manage Users
                        </Link>
                      </>
                    )}
                    
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left py-2 text-red-600 hover:text-red-700 transition-colors font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Auth Buttons (if not logged in) */}
              {!isLoggedIn && (
                <div className="pb-4 border-b border-gray-200 space-y-3">
                  <Link
                    href="/setup-wizard"
                    className="flex items-center justify-center w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full py-3 px-4 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <div className="py-1">
                  <p className="py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Features</p>
                  <Link
                    href="/platform/ai-website-builder"
                    className="block py-2 pl-2 text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    AI Website Builder
                  </Link>
                  <Link
                    href="/platform/offers-payments"
                    className="block py-2 pl-2 text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Offers &amp; Payments
                  </Link>
                  <Link
                    href="/platform/content-studio"
                    className="block py-2 pl-2 text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Content Studio
                  </Link>
                </div>
                <Link
                  href="/pricing"
                  className="block py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/resources"
                  className="block py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Playbooks
                </Link>
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