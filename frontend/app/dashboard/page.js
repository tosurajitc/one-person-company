'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import {
  BarChart3, Activity, User, Settings,
  TrendingUp, MessageSquare, FileText,
  Users, Zap, ChevronRight,
  Bell, ArrowRight, Globe, CheckCircle, Sparkles
} from 'lucide-react'

export default function DashboardPage() {
  const siteConfig = useSiteConfig()
  const [greeting, setGreeting] = useState('')
  const [user, setUser]         = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem('user_data')
      return raw ? JSON.parse(raw) : null
    } catch (_) { return null }
  })
  const [stats, setStats]       = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening')
  }, [])

  // Fetch dashboard stats from API
  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    Promise.all([
      fetch('/api/auth/me', { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([me]) => {
      if (me) setUser(me)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Quick actions read from config features
  const quickActions = (siteConfig.features || []).slice(0, 4).map(f => ({
    label: f.title,
    href:  f.link,
    icon:  [Sparkles, MessageSquare, FileText, Users][0],
  }))

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Founder'

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-10 pb-8 border-b border-gray-100">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {greeting}{user ? `, ${displayName}` : ''}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">{siteConfig.brand?.tagline || 'Your One-Person Company'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </button>
            <Link href="/profile" className="flex items-center px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm transition-colors">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </div>
        </div>

        {/* Stats — pulled from siteConfig so admin can customise them */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {(siteConfig.stats || []).map((stat, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="text-2xl font-black text-primary-600 mb-1">{stat.number}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left — Features / Quick Launch */}
          <div className="lg:col-span-2 space-y-8">

            {/* Feature cards from config */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-primary-600" />
                  {siteConfig.ecosystemSection?.title || 'Your Business Tools'}
                </h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">{siteConfig.ecosystemSection?.subtitle}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {(siteConfig.features || []).map((feature, i) => (
                  <Link
                    key={i}
                    href={feature.link || '#'}
                    className="group flex items-start p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-sm transition-all"
                  >
                    <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{feature.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-snug">{feature.preview}</p>
                    </div>
                    <span className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      feature.status === 'Available' || feature.status === 'Live Demo'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {feature.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Value props from config */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                {siteConfig.whyDifferent?.title || 'Why OPC Genie'}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(siteConfig.valueProps || []).map((vp, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{vp.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{vp.description}</p>
                    <span className="inline-block mt-2 text-xs text-primary-600 font-medium">{vp.highlight}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right — CTA + community + quick links */}
          <div className="space-y-6">

            {/* Primary CTA from config */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">{siteConfig.cta?.headline}</h3>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">{siteConfig.cta?.subheadline}</p>
              <Link
                href={siteConfig.cta?.primary?.href || '/setup-wizard'}
                className="flex items-center justify-between w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                {siteConfig.cta?.primary?.text}
                <ArrowRight className="w-4 h-4" />
              </Link>
              {(siteConfig.cta?.badges || []).map((b, i) => (
                <div key={i} className="flex items-center mt-3 text-gray-400 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                  {b}
                </div>
              ))}
            </div>

            {/* Quick nav */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: 'AI Genie Assistant',  href: '/platform/ai-genie',       icon: MessageSquare },
                  { label: 'Offers & Payments',   href: '/platform/offers',         icon: FileText },
                  { label: 'My Community',        href: '/dashboard/community',     icon: Users },
                  { label: 'Playbooks',           href: '/resources',               icon: Globe },
                  { label: 'Account Settings',    href: '/profile',                 icon: Settings },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={i}
                      href={item.href}
                      className="flex items-center justify-between p-3 bg-white hover:bg-primary-50 rounded-xl border border-gray-200 hover:border-primary-200 transition-all group"
                    >
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 text-primary-600 mr-3" />
                        <span className="text-gray-700 text-sm">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Social proof snippet from config */}
            {(siteConfig.testimonials || []).slice(0, 1).map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex mb-3">
                  {[...Array(t.rating || 5)].map((_, j) => (
                    <span key={j} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed italic mb-4">"{t.content}"</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">{t.name?.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  )
}
