'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import {
  BarChart3, Activity, User, Settings,
  TrendingUp, MessageSquare, FileText,
  Users, Zap, ChevronRight,
  Bell, ArrowRight, Globe, CheckCircle, Sparkles, Bot,
  ExternalLink, Pencil, Eye, Wand2, Layers, Target,
  BookOpen, DoorOpen, Award, Wallet, Share2, AlertCircle,
} from 'lucide-react'
import SalesDeskSection from '../../components/SalesDeskSection'
import AdManagementSection from '../../components/AdManagementSection'
import DashboardSidebar from '../../components/DashboardSidebar'

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
    setLoading(true)
    setSite(null)
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
        brandName:    settings?.business?.brandName || settings?.identity?.brandName || slug,
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
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'sales-desk' | 'website' | 'digital-workforce'
  const [token,   setToken]     = useState(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token') || localStorage.getItem('token') || null
  })
  const [hasSite, setHasSite]   = useState(false)
  const [userSiteSlug, setUserSiteSlug] = useState(null)

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
      fetch('/api/settings/mine', { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([me, settings]) => {
      if (me) setUser(me)
      const slug = settings?.site?.subdomain || null
      if (slug) {
        setHasSite(true)
        setUserSiteSlug(slug)
      }
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

        {/* ── Main Workspace: Sticky Left Nav + Dynamic Tab View ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Navigation Menu (Sticky / Floating) */}
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            hasSite={hasSite}
            userSiteSlug={userSiteSlug}
            user={user}
          />

          {/* Right Area: Dynamic View Panel */}
          <div className="lg:col-span-9">
            
            {/* VIEW 1: AI Sales Desk */}
            {activeTab === 'sales-desk' && (
              <div className="space-y-6">
                <SalesDeskSection token={token} />
              </div>
            )}

            {/* VIEW 1.5: AI Ad Management */}
            {activeTab === 'ad-management' && (
              <div className="space-y-6">
                <AdManagementSection token={token} />
              </div>
            )}

            {/* VIEW 2: My Website */}
            {activeTab === 'website' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />My Website Manager
                  </h2>
                </div>
                <MyWebsitePanel token={token} />
              </div>
            )}

            {/* VIEW 3: Overview (Default) */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats & AI Usage Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-2xl font-black text-indigo-700">
                        ₹{Number(user?.wallet_consumed || 0).toFixed(2)}
                      </div>
                      <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-indigo-950 font-semibold text-xs">AI Usage (Consumed)</div>
                    <div className="text-[11px] text-indigo-600 mt-0.5">
                      {(user?.ai_tokens_used || 0).toLocaleString()} tokens total
                    </div>
                    {(user?.ai_refine_tokens_used > 0) && (
                      <div className="mt-2 pt-2 border-t border-indigo-100 space-y-0.5">
                        <div className="flex justify-between text-[10px] text-indigo-500">
                          <span>Website generation</span>
                          <span>{((user?.ai_tokens_used || 0) - (user?.ai_refine_tokens_used || 0)).toLocaleString()} tk</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-indigo-500">
                          <span>Answer refinement</span>
                          <span>{(user?.ai_refine_tokens_used || 0).toLocaleString()} tk</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <div className="text-2xl font-black text-primary-600 mb-1">
                      {hasSite ? 1 : 0}
                    </div>
                    <div className="text-gray-900 font-semibold text-xs">Active Website</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{hasSite ? 'Live online' : 'Draft stage'}</div>
                  </div>

                  {(siteConfig.stats || []).slice(0, 1).map((stat, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <div className="text-2xl font-black text-primary-600 mb-1">{stat.number}</div>
                      <div className="text-gray-900 font-semibold text-xs">{stat.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Platform Network</div>
                    </div>
                  ))}
                </div>

                {/* My Website Quick Summary Card */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />Live Website
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('website')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Manage Website →
                    </button>
                  </div>
                  <MyWebsitePanel token={token} />
                </div>

                {/* AI Sales Desk Teaser Card in Overview */}
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-bold text-base">Inbound Leads & AI Sales Desk</h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-lg">
                      AI analyzes your incoming website enquiries, matches them against your offers, and drafts response emails for your 1-click approval.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sales-desk')}
                    className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    Open Sales Desk
                  </button>
                </div>

                {/* Feature cards from config */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-primary-600" />
                      {siteConfig.ecosystemSection?.title || 'Your Business Tools'}
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(siteConfig.features || []).map((feature, i) => (
                      <Link
                        key={i}
                        href={feature.link || '#'}
                        className="group flex items-start p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-sm transition-all"
                      >
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{feature.title}</p>
                          <p className="text-gray-500 text-xs mt-0.5 leading-snug">{feature.preview}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
