'use client'

/**
 * /platform/my-website — Founder's own website management page
 *
 * Shows the founder's live site preview link, all saved content sections,
 * and edit shortcuts back into the setup wizard at the right step.
 * Only accessible when logged in (protected by middleware).
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Globe, Eye, Pencil, Wand2, CheckCircle, AlertCircle,
  ExternalLink, Sparkles, Target, Layers, Award, DoorOpen,
  BookOpen, Palette, Share2, Wallet, User, ArrowRight,
  RefreshCw, Copy, Check, Settings, Zap,
} from 'lucide-react'

// ─── Section definitions — maps each wizard step to its display ──────────────
const SECTIONS = [
  {
    key: 'start',
    step: 1,
    label: 'Business description',
    icon: Sparkles,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-500',
    getValue: s => s.site?.subdomain
      ? `Your site: ${s.site.subdomain}`
      : (s.business?.type || null),
    isComplete: s => !!(s.site?.subdomain),
  },
  {
    key: 'identity',
    step: 2,
    label: 'Identity & contact',
    icon: User,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    getValue: s => s.business?.owner?.name
      ? `${s.business.owner.name} · ${s.business.owner.email || ''}`
      : null,
    isComplete: s => !!(s.business?.owner?.name && s.business?.owner?.email),
  },
  {
    key: 'positioning',
    step: 3,
    label: 'Positioning',
    icon: Target,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotColor: 'bg-indigo-500',
    getValue: s => s.positioning?.buyer
      ? `I help ${s.positioning.buyer}`
      : null,
    isComplete: s => !!(s.positioning?.buyer && s.positioning?.problem && s.positioning?.outcome),
  },
  {
    key: 'offers',
    step: 4,
    label: 'Offers & prices',
    icon: Layers,
    color: 'bg-green-50 text-green-700 border-green-200',
    dotColor: 'bg-green-500',
    getValue: s => {
      const tiers = (s.offers?.tiers || []).filter(t => t?.name)
      return tiers.length ? `${tiers.length} offer${tiers.length > 1 ? 's' : ''}: ${tiers.map(t => t.name).join(', ')}`.slice(0, 80) : null
    },
    isComplete: s => (s.offers?.tiers || []).some(t => t?.name),
  },
  {
    key: 'proof',
    step: 5,
    label: 'Proof & testimonials',
    icon: Award,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    getValue: s => {
      const p = s.proof || {}
      const parts = []
      if (p.yearsExperience) parts.push(`${p.yearsExperience} yrs exp`)
      if (p.clientsServed) parts.push(`${p.clientsServed} clients`)
      if ((p.credentials || []).some(Boolean)) parts.push(`${(p.credentials || []).filter(Boolean).length} credentials`)
      if ((p.testimonials || []).length) parts.push(`${(p.testimonials || []).length} testimonials`)
      return parts.length ? parts.join(' · ') : null
    },
    isComplete: s => !!(s.proof?.yearsExperience || (s.proof?.credentials || []).some(Boolean)),
  },
  {
    key: 'frontDoor',
    step: 6,
    label: 'Front door / CTA',
    icon: DoorOpen,
    color: 'bg-red-50 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
    getValue: s => {
      const fd = s.frontDoor || {}
      const ctaMap = { book_call: 'Book a call', buy_tier1: 'Buy Tier 1', whatsapp: 'WhatsApp', enquiry_form: 'Enquiry form' }
      return fd.primaryAction ? `CTA: ${ctaMap[fd.primaryAction] || fd.primaryAction}` : null
    },
    isComplete: s => !!(s.frontDoor?.primaryAction),
  },
  {
    key: 'knowledge',
    step: 7,
    label: 'FAQs & policies',
    icon: BookOpen,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    dotColor: 'bg-teal-500',
    getValue: s => {
      const k = s.knowledge || {}
      const faqs = (k.faqs || []).filter(f => f?.question)
      return faqs.length ? `${faqs.length} FAQ${faqs.length > 1 ? 's' : ''}` : null
    },
    isComplete: s => (s.knowledge?.faqs || []).some(f => f?.question),
  },
  {
    key: 'brand',
    step: 8,
    label: 'Brand & style',
    icon: Palette,
    color: 'bg-pink-50 text-pink-700 border-pink-200',
    dotColor: 'bg-pink-500',
    getValue: s => s.brand?.style
      ? `${s.brand.style} · ${s.brand.tone} · ${s.brand.primaryColor || '#2563eb'}`
      : null,
    isComplete: s => !!(s.brand?.style),
  },
  {
    key: 'channels',
    step: 11,
    label: 'Social & publishing',
    icon: Share2,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    dotColor: 'bg-sky-500',
    getValue: s => {
      const social = s.channels?.social || {}
      const filled = Object.values(social).filter(Boolean)
      return filled.length ? `${filled.length} social profile${filled.length > 1 ? 's' : ''} linked` : null
    },
    isComplete: s => Object.values(s.channels?.social || {}).some(Boolean),
  },
  {
    key: 'payments',
    step: 10,
    label: 'Payments & GST',
    icon: Wallet,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500',
    getValue: s => {
      const p = s.payments || {}
      return p.gateways?.length
        ? `${p.gateways.join(', ')} · ${p.gstRegistered === 'yes' ? 'GST registered' : 'GST not registered'}`
        : null
    },
    isComplete: s => (s.payments?.gateways || []).length > 0,
  },
]

// ─── Small helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === 'published') {
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Live</span>
  }
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Draft</span>
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
      title="Copy link"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ section, settings }) {
  const Icon = section.icon
  const complete = section.isComplete(settings)
  const preview = section.getValue(settings)

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${complete ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${section.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-gray-900">{section.label}</p>
          {complete
            ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            : <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {preview || <span className="italic text-amber-600">Not filled — click Edit to add</span>}
        </p>
      </div>
      <Link
        href={`/setup-wizard?step=${section.step}`}
        className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
      >
        <Pencil className="w-3 h-3" />Edit
      </Link>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MyWebsitePage() {
  const router = useRouter()
  const [settings, setSettings] = useState(null)
  const [siteInfo,  setSiteInfo]  = useState(null)   // { slug, theme, status }
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [token,    setToken]    = useState(null)

  useEffect(() => {
    const tok = localStorage.getItem('auth_token') || localStorage.getItem('token') || ''
    if (!tok) {
      router.replace('/login?redirect=/platform/my-website')
      return
    }
    setToken(tok)
    const headers = { Authorization: `Bearer ${tok}` }

    Promise.all([
      fetch('/api/settings/mine', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/genie/status',  { headers }).then(r => r.ok ? r.json() : null),
    ])
      .then(([mine, genie]) => {
        setSettings(mine || {})
        const slug = mine?.site?.subdomain || null
        if (slug) {
          setSiteInfo({ slug, status: 'draft', theme: mine?.brand?.style || 'professional' })
        }
        setLoading(false)
      })
      .catch(err => { setError('Could not load your site data. Please refresh.'); setLoading(false) })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading your website…</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-primary-600 text-sm underline">Retry</button>
        </div>
      </div>
    )
  }

  // No site built yet
  if (!siteInfo) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-3">Your website isn't built yet</h1>
            <p className="text-gray-500 mb-8">Answer a few questions about your business. Genie drafts your positioning, offers and pages — you confirm before anything goes live.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/platform/ai-website-builder"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-colors"
              >
                <Wand2 className="w-4 h-4" />Build with AI Genie
              </Link>
              <Link
                href="/setup-wizard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
              >
                <Settings className="w-4 h-4" />Manual setup wizard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const previewUrl  = `/${siteInfo.slug}`
  const completedCount = SECTIONS.filter(s => s.isComplete(settings)).length
  const totalCount     = SECTIONS.length
  const pct = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary-600" />
                My Website
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage and edit your generated website.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/platform/ai-website-builder"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-primary-300 hover:text-primary-700 text-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />Rebuild with AI
              </Link>
              <Link
                href="/setup-wizard"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-primary-300 hover:text-primary-700 text-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />Open full wizard
              </Link>
              <Link
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />Preview site
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Link>
            </div>
          </div>
        </div>

        {/* Site overview card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4 bg-gray-900 text-white">
            <div className="flex items-center gap-3">
              {/* Traffic lights */}
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs font-mono text-gray-300">localhost:3000{previewUrl}</span>
              <CopyButton text={`http://localhost:3000${previewUrl}`} />
            </div>
            <StatusBadge status={siteInfo.status} />
          </div>

          {/* Business summary */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Identity */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Business</p>
              <p className="text-lg font-black text-gray-900">{settings?.business?.brandName || siteInfo.slug}</p>
              {settings?.business?.owner?.name && (
                <p className="text-sm text-gray-600">{settings.business.owner.name} · {settings.business.owner.role || ''}</p>
              )}
              {settings?.business?.owner?.email && (
                <p className="text-xs text-gray-500">{settings.business.owner.email}</p>
              )}
            </div>

            {/* Positioning */}
            {settings?.positioning?.buyer && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Positioning</p>
                <p className="text-sm text-gray-800 leading-relaxed">
                  I help <strong>{settings.positioning.buyer}</strong> who struggle with <strong>{settings.positioning.problem}</strong> to get <strong>{settings.positioning.outcome}</strong>.
                </p>
              </div>
            )}

            {/* Offer tiers */}
            {(settings?.offers?.tiers || []).some(t => t?.name) && (
              <div className="sm:col-span-2 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Offers</p>
                <div className="flex flex-wrap gap-2">
                  {(settings.offers.tiers || []).filter(t => t?.name).map((t, i) => {
                    const inr = t.prices?.INR ? `₹${Number(t.prices.INR).toLocaleString('en-IN')}` : (t.priceInr ? `₹${Number(t.priceInr).toLocaleString('en-IN')}` : null)
                    const usd = t.prices?.USD ? `$${Number(t.prices.USD).toLocaleString('en-US')}` : null
                    const price = inr || usd || null
                    return (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                        <span className="text-xs text-gray-500">T{i + 1}</span>
                        <span className="text-xs font-semibold text-gray-900">{t.name}</span>
                        {price && <span className="text-xs text-primary-600 font-bold">{price}{t.tier === 'recurring' ? '/mo' : ''}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Completion bar */}
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>{completedCount} of {totalCount} sections complete</span>
              <span className={pct === 100 ? 'text-green-600 font-semibold' : ''}>{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-primary-600'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Section cards */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Website sections</h2>
          {SECTIONS.map(section => (
            <SectionCard key={section.key} section={section} settings={settings} />
          ))}
        </div>

        {/* Action footer */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-colors"
          >
            <Eye className="w-4 h-4" />Open my website
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </Link>
          <Link
            href="/setup-wizard"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />Open full setup wizard
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your site is at{' '}
          <a href={`http://localhost:3000${previewUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-mono">
            localhost:3000{previewUrl}
          </a>
          {' '}— status: <span className="font-medium capitalize">{siteInfo.status}</span>
        </p>
      </div>
    </div>
  )
}
