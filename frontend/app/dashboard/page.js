'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import {
  BarChart3, Activity, User, Settings,
  TrendingUp, MessageSquare, FileText,
  Users, Zap, ChevronRight,
  Bell, ArrowRight, Globe, CheckCircle, Sparkles,
  ExternalLink, Pencil, Eye, Wand2, Layers, Target,
  BookOpen, DoorOpen, Award, Wallet, Share2, AlertCircle,
} from 'lucide-react'

// ─── My Website panel ────────────────────────────────────────────────────────
// Fetches the user's saved site data and renders a management card.

const WIZARD_SHORTCUTS = [
  { step: 1,  label: 'Business description', icon: Sparkles  },
  { step: 2,  label: 'Identity & contact',   icon: User      },
  { step: 3,  label: 'Positioning',          icon: Target    },
  { step: 4,  label: 'Offers & prices',      icon: Layers    },
  { step: 5,  label: 'Proof & testimonials', icon: Award     },
  { step: 6,  label: 'Front door / CTA',     icon: DoorOpen  },
  { step: 7,  label: 'FAQs & policies',      icon: BookOpen  },
  { step: 10, label: 'Payments & GST',       icon: Wallet    },
  { step: 11, label: 'Social & publishing',  icon: Share2    },
]

function MyWebsitePanel({ token }) {
  const [site,    setSite]    = useState(null)   // { slug, theme, status, payload }
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    // Load the founder's own site data through the authenticated settings endpoint
    Promise.all([
      fetch('/api/settings/mine', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null),
      fetch('/api/genie/status', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null),
    ]).then(([settings, genie]) => {
      const siteKey = settings?.site || {}
      const slug = siteKey.subdomain || null
      if (!slug) { setLoading(false); return }

      // Derive display data straight from saved settings groups
      setSite({
        slug,
        brandName:    settings?.business?.brandName || slug,
        status:       'draft',   // site_build_routes always saves 'draft' initially
        positioning:  settings?.positioning || {},
        offers:       (settings?.offers?.tiers || []).filter(t => t?.name),
        market:       settings?.site?.market || 'india',
        hasDraft:     !!genie?.has_saved_draft,
      })
      setLoading(false)
    }).catch(() => { setError('Could not load site data'); setLoading(false) })
  }, [token])

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  // No site built yet
  if (!site) {
    return (
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Your website is not built yet</h2>
            <p className="text-blue-100 text-sm mt-0.5">Answer a few questions and Genie will build it for you in minutes.</p>
          </div>
        </div>
        <Link
          href="/platform/ai-website-builder"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
        >
          <Wand2 className="w-4 h-4" />Build my website with AI
        </Link>
      </div>
    )
  }

  const pos = site.positioning
  const previewUrl = `/${site.slug}`

  const fmt = (v, prefix = '') => v ? `${prefix}${Number(v).toLocaleString('en-IN')}` : null
  const tierPrice = t => {
    const inr = fmt(t.priceInr, '₹')
    const usd = fmt(t.priceUsd, '$')
    const suffix = t.tier === 'recurring' ? '/mo' : ''
    const parts = site.market === 'india' ? [inr] : site.market === 'global' ? [usd] : [inr, usd]
    return parts.filter(Boolean).map(p => p + suffix).join(' · ') || null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{site.brandName}</p>
            <p className="text-xs text-gray-500 font-mono">localhost:3000{previewUrl}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Draft</span>
          <Link
            href={previewUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />Preview
          </Link>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Positioning sentence */}
        {pos?.buyer && pos?.outcome && (
          <div className="sm:col-span-2 rounded-xl bg-gray-900 text-white px-4 py-3 text-sm leading-relaxed">
            I help <strong>{pos.buyer}</strong> who struggle with <strong>{pos.problem || '…'}</strong> to get <strong>{pos.outcome}</strong>
            {pos.timeframe ? ` within ${pos.timeframe}` : ''}
            {pos.fear ? `, without ${pos.fear}` : ''}.
          </div>
        )}

        {/* Offer tiers */}
        {site.offers.length > 0 && (
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your offers</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {site.offers.slice(0, 3).map((t, i) => (
                <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                  <p className="text-xs text-gray-500">{['Tier 1', 'Tier 2', 'Tier 3'][i]}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{t.name}</p>
                  {tierPrice(t) && <p className="text-xs text-blue-600 font-medium mt-0.5">{tierPrice(t)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit shortcuts into wizard */}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Edit sections</p>
          <div className="flex flex-wrap gap-2">
            {WIZARD_SHORTCUTS.map(s => {
              const Icon = s.icon
              return (
                <Link
                  key={s.step}
                  href={`/setup-wizard?step=${s.step}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-gray-200 rounded-lg text-xs text-gray-700 transition-colors"
                >
                  <Icon className="w-3 h-3" />{s.label}
                </Link>
              )
            })}
            <Link
              href="/setup-wizard"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-lg text-xs font-semibold transition-colors"
            >
              <Pencil className="w-3 h-3" />Open full wizard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [token,   setToken]     = useState(null)

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening')
  }, [])

  // Fetch dashboard stats from API
  useEffect(() => {
    const tok = localStorage.getItem('auth_token') || localStorage.getItem('token')
    setToken(tok)
    const headers = tok ? { Authorization: `Bearer ${tok}` } : {}

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

        {/* ── My Website Panel ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />My Website
            </h2>
          </div>
          <MyWebsitePanel token={token} />
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
