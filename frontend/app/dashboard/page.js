'use client'

/**
 * Founder Dashboard
 * ------------------------------------------------------------------
 * THEME (matches /platform/ai-website-builder):
 *   bottle green  #021610 / #053728 / #0a4836 / #0f6b4f
 *   light green   #a7f3c0 / #c9f2d8 / #d9f5e4 / #f2faf5
 *   orange        primary action buttons only
 * LAYOUT: full-width hero band + sidebar / content grid.
 *
 * All data loading and behaviour is unchanged from the previous version.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import {
  Settings, MessageSquare, Zap, Bell, Globe, Sparkles, Bot,
  Pencil, Eye, Wand2, Layers, Target, User,
  BookOpen, DoorOpen, Award, Wallet, Share2, ArrowRight,
} from 'lucide-react'
import SalesDeskSection from '../../components/SalesDeskSection'
import SalesDeskSample from '../../components/SalesDeskSample'
import AdManagementSection from '../../components/AdManagementSection'
import DashboardSidebar from '../../components/DashboardSidebar'

// ─── Shared theme class strings (same as AI Website Builder page) ────────────
const BTN_ORANGE = 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30'
const BTN_GREEN = 'bg-[#0a4836] hover:bg-[#053728] text-white'
const BTN_OUTLINE = 'bg-white border border-[#0a4836] text-[#0a4836] hover:bg-[#f2faf5]'
const CARD = 'bg-white rounded-2xl border border-[#c9f2d8]'

// ─── My Website panel ────────────────────────────────────────────────────────
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
  const [site,    setSite]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    setLoading(true)
    setSite(null)
    Promise.all([
      fetch('/api/settings/mine', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null),
      fetch('/api/genie/status', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null),
    ]).then(([settings, genie]) => {
      const siteKey = settings?.site || {}
      const slug = siteKey.subdomain || null
      if (!slug) { setLoading(false); return }

      setSite({
        slug,
        brandName:    settings?.business?.brandName || settings?.identity?.brandName || slug,
        status:       'draft',
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
      <div className={`${CARD} p-6 animate-pulse`}>
        <div className="h-4 bg-[#d9f5e4] rounded w-1/3 mb-3" />
        <div className="h-3 bg-[#d9f5e4] rounded w-1/2" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900" role="alert">
        {error}
      </div>
    )
  }

  // No site built yet
  if (!site) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836] p-6 sm:p-8 text-white">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-11 h-11 bg-[#a7f3c0]/15 border border-[#a7f3c0]/30 rounded-xl flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-[#a7f3c0]" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">Your website is not built yet</h2>
            <p className="text-emerald-50/80 text-sm mt-0.5">Answer a few questions and Genie will build it for you in minutes.</p>
          </div>
          <Link
            href="/platform/ai-website-builder"
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${BTN_ORANGE} rounded-xl font-bold text-sm whitespace-nowrap`}
          >
            <Wand2 className="w-4 h-4" />Build my website with AI
          </Link>
        </div>
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
    <div className={`${CARD} overflow-hidden shadow-sm`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#d9f5e4] bg-[#f2faf5]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-[#0a4836] rounded-lg flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-[#a7f3c0]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#06352a] text-sm truncate">{site.brandName}</p>
            <p className="text-xs text-gray-500 font-mono truncate">localhost:3000{previewUrl}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Draft</span>
          <Link
            href={previewUrl}
            target="_blank"
            className={`inline-flex items-center gap-1.5 px-4 py-2 ${BTN_ORANGE} rounded-lg text-xs font-semibold`}
          >
            <Eye className="w-3.5 h-3.5" />Preview
          </Link>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Positioning sentence */}
        {pos?.buyer && pos?.outcome && (
          <div className="sm:col-span-2 rounded-xl bg-gradient-to-br from-[#021610] to-[#0a4836] text-white px-4 py-3 text-sm leading-relaxed">
            I help <strong className="text-[#a7f3c0]">{pos.buyer}</strong> who struggle with <strong className="text-[#a7f3c0]">{pos.problem || '…'}</strong> to get <strong className="text-[#a7f3c0]">{pos.outcome}</strong>
            {pos.timeframe ? ` within ${pos.timeframe}` : ''}
            {pos.fear ? `, without ${pos.fear}` : ''}.
          </div>
        )}

        {/* Offer tiers */}
        {site.offers.length > 0 && (
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-[#0a4836] mb-2">Your offers</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {site.offers.slice(0, 3).map((t, i) => (
                <div key={i} className="bg-[#f2faf5] rounded-lg px-3 py-2.5 border border-[#c9f2d8]">
                  <p className="text-xs text-gray-500">{['Tier 1 · Paid first step', 'Tier 2 · Main offer', 'Tier 3 · Ongoing'][i]}</p>
                  <p className="text-sm font-semibold text-[#06352a] truncate mt-0.5">{t.name}</p>
                  {tierPrice(t) && <p className="text-xs text-[#0f6b4f] font-semibold mt-0.5">{tierPrice(t)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit shortcuts into wizard */}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-[#0a4836] mb-2">Edit sections</p>
          <div className="flex flex-wrap gap-2">
            {WIZARD_SHORTCUTS.map(s => {
              const Icon = s.icon
              return (
                <Link
                  key={s.step}
                  href={`/setup-wizard?step=${s.step}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f2faf5] hover:border-[#0f6b4f] hover:text-[#0a4836] border border-[#c9f2d8] rounded-lg text-xs text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f6b4f]"
                >
                  <Icon className="w-3 h-3" />{s.label}
                </Link>
              )
            })}
            <Link
              href="/setup-wizard"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 ${BTN_GREEN} rounded-lg text-xs font-semibold`}
            >
              <Pencil className="w-3 h-3" />Open full wizard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
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
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'sales-desk' | 'ad-management' | 'website' | 'digital-workforce'
  const [token,   setToken]     = useState(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token') || localStorage.getItem('token') || null
  })
  const [hasSite, setHasSite]   = useState(false)
  // null = not checked yet, [] = checked and none, [...] = real enquiries exist
  const [realEnquiries, setRealEnquiries] = useState(null)
  const [userSiteSlug, setUserSiteSlug] = useState(null)

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening')
  }, [])

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

  // Decide whether to show sample data in the AI Sales Desk.
  // Any failure (no token, endpoint error) falls back to the sample preview.
  useEffect(() => {
    if (activeTab !== 'sales-desk') return
    const tok = token || localStorage.getItem('auth_token') || localStorage.getItem('token')
    if (!tok) { setRealEnquiries([]); return }
    fetch('/api/enquiries/mine', { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.enquiries || d?.items || [])
        setRealEnquiries(list)
      })
      .catch(() => setRealEnquiries([]))
  }, [activeTab, token])

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Founder'

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f2faf5] to-white pt-16 lg:pt-20">

      {/* ── Full-width hero band ── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836]">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="relative w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-10 lg:py-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center px-4 py-1.5 bg-[#a7f3c0]/10 border border-[#a7f3c0]/30 rounded-full text-xs font-medium mb-3 text-[#a7f3c0]">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {siteConfig.brand?.tagline || 'Your One-Person Company'}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
              {greeting}{user ? `, ${displayName}` : ''}
            </h1>
            <p className="text-sm md:text-base text-emerald-50/80 mt-2 max-w-xl">
              Run your website, enquiries and ads from one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-[#a7f3c0]/30 bg-white/5 text-emerald-50 hover:bg-white/10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#a7f3c0]"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </button>
            <Link
              href="/profile"
              className={`inline-flex items-center px-5 py-2.5 rounded-xl ${BTN_ORANGE} text-sm font-semibold`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </div>
        </div>
      </section>

      {/* ── Full-width workspace: sidebar + tab view ── */}
      <main className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">

          {/* Left navigation */}
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            hasSite={hasSite}
            userSiteSlug={userSiteSlug}
            user={user}
          />

          {/* Right: dynamic view */}
          <div className="lg:col-span-9 min-w-0">

            {/* VIEW: AI Sales Desk */}
            {activeTab === 'sales-desk' && (
              <div className="space-y-6">
                {/* Sample preview only while there are no real enquiries */}
                {realEnquiries !== null && realEnquiries.length === 0 && (
                  <SalesDeskSample onViewWebsite={() => setActiveTab('website')} />
                )}
                <SalesDeskSection token={token} />
              </div>
            )}

            {/* VIEW: AI Ad Management */}
            {activeTab === 'ad-management' && (
              <div className="space-y-6">
                <AdManagementSection token={token} />
              </div>
            )}

            {/* VIEW: My Website */}
            {activeTab === 'website' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-[#06352a] flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#d9f5e4] flex items-center justify-center">
                    <Globe className="w-4 h-4 text-[#0a4836]" />
                  </span>
                  My Website Manager
                </h2>
                <MyWebsitePanel token={token} />
              </div>
            )}

            {/* VIEW: Overview (default) */}
            {activeTab === 'overview' && (
              <div className="space-y-8">

                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`${CARD} p-5 shadow-sm`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-2xl font-black text-[#053728]">
                        ₹{Number(user?.wallet_consumed || 0).toFixed(2)}
                      </div>
                      <span className="w-8 h-8 rounded-full bg-[#d9f5e4] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[#0a4836]" />
                      </span>
                    </div>
                    <div className="text-[#06352a] font-semibold text-xs">AI usage (consumed)</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {(user?.ai_tokens_used || 0).toLocaleString()} tokens total
                    </div>
                    {(user?.ai_refine_tokens_used > 0) && (
                      <div className="mt-2 pt-2 border-t border-[#d9f5e4] space-y-0.5">
                        <div className="flex justify-between text-[10px] text-[#0f6b4f]">
                          <span>Website generation</span>
                          <span>{((user?.ai_tokens_used || 0) - (user?.ai_refine_tokens_used || 0)).toLocaleString()} tk</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#0f6b4f]">
                          <span>Answer refinement</span>
                          <span>{(user?.ai_refine_tokens_used || 0).toLocaleString()} tk</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`${CARD} p-5 shadow-sm`}>
                    <div className="text-2xl font-black text-[#053728] mb-1">
                      {hasSite ? 1 : 0}
                    </div>
                    <div className="text-[#06352a] font-semibold text-xs">Active website</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{hasSite ? 'Live online' : 'Draft stage'}</div>
                  </div>

                  {(siteConfig.stats || []).slice(0, 1).map((stat, i) => (
                    <div key={i} className={`${CARD} p-5 shadow-sm`}>
                      <div className="text-2xl font-black text-[#053728] mb-1">{stat.number}</div>
                      <div className="text-[#06352a] font-semibold text-xs">{stat.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Platform network</div>
                    </div>
                  ))}
                </div>

                {/* Live website summary */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#06352a] flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#d9f5e4] flex items-center justify-center">
                        <Globe className="w-3.5 h-3.5 text-[#0a4836]" />
                      </span>
                      Live website
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('website')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4836] hover:text-[#053728] underline-offset-2 hover:underline"
                    >
                      Manage website<ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <MyWebsitePanel token={token} />
                </div>

                {/* AI Sales Desk teaser */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836] p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
                  <div className="relative space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#a7f3c0]" />
                      <h3 className="font-bold text-base">Inbound leads &amp; AI Sales Desk</h3>
                    </div>
                    <p className="text-xs text-emerald-50/80 max-w-lg">
                      AI reads your website enquiries, matches them to your offers, and drafts replies for your one-click approval.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sales-desk')}
                    className={`relative px-5 py-2.5 ${BTN_ORANGE} rounded-xl text-xs font-bold whitespace-nowrap shrink-0`}
                  >
                    Open Sales Desk
                  </button>
                </div>

                {/* Business tools from config */}
                <div className={`${CARD} p-6 shadow-sm`}>
                  <h3 className="text-base font-bold text-[#06352a] flex items-center mb-4 pb-3 border-b border-[#d9f5e4]">
                    <span className="w-7 h-7 rounded-full bg-[#d9f5e4] flex items-center justify-center mr-2.5">
                      <Zap className="w-3.5 h-3.5 text-[#0a4836]" />
                    </span>
                    {siteConfig.ecosystemSection?.title || 'Your Business Tools'}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(siteConfig.features || []).map((feature, i) => (
                      <Link
                        key={i}
                        href={feature.link || '#'}
                        className="group flex items-start p-4 bg-white rounded-xl border border-[#c9f2d8] hover:border-[#0f6b4f] hover:bg-[#f2faf5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f6b4f]"
                      >
                        <div className="w-8 h-8 bg-[#d9f5e4] rounded-lg flex items-center justify-center mr-3 shrink-0">
                          <Sparkles className="w-4 h-4 text-[#0a4836]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#06352a] text-sm leading-tight">{feature.title}</p>
                          <p className="text-gray-500 text-xs mt-0.5 leading-snug">{feature.preview}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Social proof snippet */}
                {(siteConfig.testimonials || []).slice(0, 1).map((t, i) => (
                  <div key={i} className={`${CARD} p-6`}>
                    <div className="flex mb-3">
                      {[...Array(t.rating || 5)].map((_, j) => (
                        <span key={j} className="text-orange-400 text-sm">★</span>
                      ))}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">&ldquo;{t.content}&rdquo;</p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#0a4836] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">{t.name?.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#06352a] text-sm">{t.name}</p>
                        <p className="text-gray-500 text-xs">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}