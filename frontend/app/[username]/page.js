'use client'

/**
 * /[username] — Founder's generated website preview
 *
 * Fetches GET /api/sites/public/:slug, reads payload.templateSlug, then
 * dynamically imports and renders the matching template component, passing
 * the full payload as the `data` prop.
 *
 * If no templateSlug is set (legacy sites), falls back to the built-in
 * GenericSite renderer below so existing sites are never broken.
 *
 * The page is publicly accessible (no auth required).
 * If the slug is not found the Next.js 404 page is shown.
 */

import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle, Phone, Mail, Calendar, MessageCircle, ExternalLink,
  Star, Award, Clock, ChevronDown, ChevronUp, Play, Shield,
  ArrowRight, Linkedin, Instagram, Facebook, Youtube, Twitter,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (v, prefix = '') => v ? `${prefix}${Number(v).toLocaleString('en-IN')}` : null

function priceLabel(tier, market) {
  const inr = tier.priceInr ? fmt(tier.priceInr, '₹') : null
  const usd = tier.priceUsd ? fmt(tier.priceUsd, '$') : null
  const suffix = tier.tier === 'recurring' ? '/mo' : ''
  const parts = market === 'india' ? [inr] : market === 'global' ? [usd] : [inr, usd]
  return parts.filter(Boolean).map(p => p + suffix).join(' · ') || null
}

function Chip({ children, color = 'blue' }) {
  const cls = {
    blue:  'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    gray:  'bg-gray-100 text-gray-700',
  }[color] || 'bg-gray-100 text-gray-700'
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{children}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// Section blocks
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection({ payload }) {
  const { business, positioning, frontDoor, brand } = payload
  const pos = positioning || {}
  const fd  = frontDoor  || {}
  const biz = business   || {}

  const primaryCta = fd.primaryCta || fd.primaryAction
  const ctaLabel = fd.ctaLabel || fd.buttonLabel ||
    (primaryCta === 'book_call'   ? 'Book a free call'
   : primaryCta === 'whatsapp'   ? 'Chat on WhatsApp'
   : primaryCta === 'buy_tier1'  ? 'Get started'
   : 'Get in touch')

  const ctaHref = primaryCta === 'book_call'    ? (fd.bookingUrl || '#contact')
                : primaryCta === 'whatsapp'      ? `https://wa.me/${(biz.owner?.whatsapp || '').replace(/\D/g, '')}`
                : primaryCta === 'enquiry_form'  ? '#contact'
                : '#contact'

  const headline = pos.buyer && pos.outcome
    ? `Helping ${pos.buyer} get ${pos.outcome}`
    : biz.brandName || 'Welcome'

  return (
    <section className="py-20 px-4 text-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto">
        {biz.owner?.photoUrl && (
          <img src={biz.owner.photoUrl} alt={biz.owner.name || ''} className="w-20 h-20 rounded-full object-cover mx-auto mb-6 border-4 border-white shadow-md" />
        )}
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-5">
          {headline}
        </h1>
        {pos.buyer && pos.problem && (
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            I help <strong className="text-gray-900">{pos.buyer}</strong> who struggle with{' '}
            <strong className="text-gray-900">{pos.problem}</strong> to get{' '}
            <strong className="text-gray-900">{pos.outcome}</strong>
            {pos.timeframe ? ` within ${pos.timeframe}` : ''}
            {pos.fear ? `, without ${pos.fear}` : ''}.
          </p>
        )}
        <a
          href={ctaHref}
          target={primaryCta === 'whatsapp' || primaryCta === 'book_call' ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-md transition-colors"
        >
          {ctaLabel}
        </a>
        {fd.responseTime && (
          <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />{fd.responseTime}
          </p>
        )}
      </div>
    </section>
  )
}

function ForWhoSection({ payload }) {
  const pos = payload.positioning || {}
  const forWho = (pos.forWho || []).filter(Boolean)
  const notFor  = (pos.notFor  || []).filter(Boolean)
  if (!forWho.length && !notFor.length) return null
  return (
    <section className="py-14 px-4 bg-white" id="for-who">
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
        {forWho.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">This is for you if…</h3>
            <ul className="space-y-2">
              {forWho.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-800 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {notFor.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Not for you if…</h3>
            <ul className="space-y-2">
              {notFor.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                  <span className="text-gray-400 shrink-0 mt-0.5">✕</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function OffersSection({ payload }) {
  const { offers, site } = payload
  if (!offers?.tiers?.length) return null
  const market = site?.market || 'india'
  const tiers = offers.tiers.filter(t => t?.name)
  if (!tiers.length) return null

  return (
    <section className="py-16 px-4 bg-gray-50" id="offers">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-10">How we work together</h2>
        <div className={`grid grid-cols-1 ${tiers.length > 1 ? 'sm:grid-cols-' + Math.min(tiers.length, 3) : ''} gap-6`}>
          {tiers.map((tier, i) => {
            const highlight = offers.mostBought === tier.tier
            const shown = priceLabel(tier, market)
            const deliverables = typeof tier.deliverables === 'string'
              ? tier.deliverables.split('\n').filter(Boolean)
              : Array.isArray(tier.deliverables) ? tier.deliverables : []
            return (
              <div key={i} className={`rounded-2xl p-6 border-2 flex flex-col ${highlight ? 'border-blue-500 bg-white shadow-lg' : 'border-gray-200 bg-white'}`}>
                {highlight && <Chip color="blue">Most popular</Chip>}
                <p className="text-xs text-gray-500 mt-2">{['Tier 1 · First step', 'Tier 2 · Main offer', 'Tier 3 · Ongoing'][i] || ''}</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{tier.name}</h3>
                {tier.summary && <p className="text-gray-600 text-sm mt-2">{tier.summary}</p>}
                {shown && (
                  <p className={`text-2xl font-black mt-4 ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>{shown}</p>
                )}
                {tier.duration && <p className="text-xs text-gray-500 mt-1">{tier.duration}</p>}
                {deliverables.length > 0 && (
                  <ul className="mt-4 space-y-1.5 flex-1">
                    {deliverables.map((d, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />{d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ProofSection({ payload }) {
  const proof = payload.proof || {}
  const results = (proof.results || []).filter(r => r?.number && r?.label)
  const testimonials = (proof.testimonials || []).filter(t => t?.quote)
  const credentials = (proof.credentials || []).filter(Boolean)
  if (!results.length && !testimonials.length && !credentials.length && !proof.yearsExperience && !proof.clientsServed) return null

  return (
    <section className="py-16 px-4 bg-white" id="proof">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-10">Real results</h2>

        {(proof.yearsExperience || proof.clientsServed || results.length > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {proof.yearsExperience && (
              <div className="text-center"><p className="text-4xl font-black text-blue-600">{proof.yearsExperience}+</p><p className="text-sm text-gray-600">years experience</p></div>
            )}
            {proof.clientsServed && (
              <div className="text-center"><p className="text-4xl font-black text-blue-600">{proof.clientsServed}+</p><p className="text-sm text-gray-600">clients served</p></div>
            )}
            {results.map((r, i) => (
              <div key={i} className="text-center"><p className="text-3xl font-black text-blue-600">{r.number}</p><p className="text-sm text-gray-600">{r.label}</p></div>
            ))}
          </div>
        )}

        {credentials.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {credentials.map((c, i) => <Chip key={i} color="gray"><Award className="w-3 h-3 inline mr-1" />{c}</Chip>)}
          </div>
        )}

        {testimonials.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {testimonials.map((t, i) => (
              <blockquote key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex gap-0.5 mb-2">{[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                <p className="text-gray-800 text-sm italic">"{t.quote}"</p>
                <footer className="mt-2 text-xs text-gray-500">{t.name}{t.role ? ` · ${t.role}` : ''}</footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── How it works (process steps) ────────────────────────────────────────────
function ProcessSection({ payload }) {
  const process = (payload.knowledge?.process || []).filter(s => s?.title)
  if (!process.length) return null
  return (
    <section className="py-16 px-4 bg-white" id="process">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-3">How we work together</h2>
        <p className="text-center text-gray-500 text-sm mb-10">A simple, predictable process from first call to final delivery.</p>
        <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(process.length, 4)} gap-6`}>
          {process.map((step, i) => (
            <div key={i} className="flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-base shrink-0">
                {i + 1}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{step.title}</p>
                {step.detail && <p className="text-gray-600 text-sm mt-1 leading-relaxed">{step.detail}</p>}
              </div>
              {i < process.length - 1 && (
                <ArrowRight className="hidden sm:block w-4 h-4 text-gray-300 absolute right-0 top-3" />
              )}
            </div>
          ))}
        </div>

        {/* Included / Not included */}
        {(() => {
          const included    = (payload.knowledge?.included    || []).filter(Boolean)
          const notIncluded = (payload.knowledge?.notIncluded || []).filter(Boolean)
          if (!included.length && !notIncluded.length) return null
          return (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {included.length > 0 && (
                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">What's included</p>
                  <ul className="space-y-2">
                    {included.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {notIncluded.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Not included</p>
                  <ul className="space-y-2">
                    {notIncluded.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 shrink-0 mt-0.5">–</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })()}

        {/* Refund policy */}
        {payload.knowledge?.refundPolicy && (
          <div className="mt-8 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
            <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Satisfaction guarantee</p>
              <p className="leading-relaxed">{payload.knowledge.refundPolicy}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── YouTube intro video ──────────────────────────────────────────────────────
function VideoSection({ payload }) {
  const video = payload.knowledge?.introVideo
  if (!video?.url) return null
  // Only render for real YouTube embed URLs (not the placeholder rick-roll)
  // Comment out the line below if you want to show the placeholder too
  // if (video.url.includes('dQw4w9WgXcQ')) return null
  return (
    <section className="py-16 px-4 bg-gray-900" id="video">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Play className="w-5 h-5 text-red-500 fill-red-500" />
          <h2 className="text-2xl font-black text-white">{video.title || 'See how I work'}</h2>
        </div>
        <p className="text-gray-400 text-sm mb-8">Watch a quick overview before we talk.</p>
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={video.url}
            title={video.title || 'Intro video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl border border-gray-700"
          />
        </div>
        <p className="text-gray-500 text-xs mt-4">
          Replace this video from your <a href="/setup-wizard" className="text-blue-400 underline">website dashboard</a>.
        </p>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FaqSection({ payload }) {
  const faqs = (payload.knowledge?.faqs || []).filter(f => f?.question && f?.answer)
  const [open, setOpen] = useState(null)
  if (!faqs.length) return null
  return (
    <section className="py-16 px-4 bg-gray-50" id="faq">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-3">Frequently asked questions</h2>
        <p className="text-center text-gray-500 text-sm mb-8">Everything you need to know before we start working together.</p>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                {f.question}
                {open === i ? <ChevronUp className="w-4 h-4 shrink-0 text-gray-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />}
              </button>
              {open === i && <p className="px-5 pb-4 text-sm text-gray-700 border-t border-gray-100 pt-3">{f.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection({ payload }) {
  const { business, frontDoor } = payload
  const fd  = frontDoor || {}
  const owner = business?.owner || {}
  const primaryCta = fd.primaryCta || fd.primaryAction

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/enquiries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subdomain: payload?.site?.subdomain || business?.brandName || '',
          business: business?.brandName || '',
        }),
      })
      if (res.ok) {
        setSubmitted(true)
        setFormData({ name: '', email: '', phone: '', message: '' })
      } else {
        setError('Failed to send enquiry. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-16 px-4 bg-slate-900 text-white" id="contact">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-black mb-4">Let's talk</h2>
        {fd.invitation && <p className="text-slate-300 mb-8 text-lg leading-relaxed">"{fd.invitation}"</p>}
        
        {/* Quick Contact Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {primaryCta === 'book_call' && fd.bookingUrl && (
            <a href={fd.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors">
              <Calendar className="w-4 h-4" />Book a call
            </a>
          )}
          {(fd.channels?.whatsapp || primaryCta === 'whatsapp') && owner.whatsapp && (
            <a href={`https://wa.me/${owner.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-colors">
              <MessageCircle className="w-4 h-4" />WhatsApp
            </a>
          )}
          {(fd.channels?.email || primaryCta === 'enquiry_form') && owner.email && (
            <a href={`mailto:${owner.email}`} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition-colors">
              <Mail className="w-4 h-4" />{owner.email}
            </a>
          )}
        </div>

        {/* Lead Capture Form */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-left max-w-lg mx-auto shadow-xl">
          <h3 className="text-lg font-bold text-white mb-1">Send a Project Enquiry</h3>
          <p className="text-xs text-slate-400 mb-5">Share your requirements and we'll get back to you with a tailored plan.</p>
          
          {submitted ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm text-center font-medium">
              ✓ Thank you! Your enquiry has been received. We'll be in touch shortly.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@company.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">What are you looking for?</label>
                <textarea
                  rows={3}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your project goals, timeline, and questions..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md"
              >
                {submitting ? 'Sending Enquiry...' : 'Submit Enquiry'}
              </button>
            </form>
          )}
        </div>

        {fd.workingHours && <p className="text-slate-400 text-xs mt-6"><Clock className="w-3.5 h-3.5 inline mr-1" />{fd.workingHours}</p>}
      </div>
    </section>
  )
}

function SiteFooter({ payload }) {
  const { business, channels } = payload
  const biz    = business || {}
  const social = channels?.social || {}

  // Platform config: key → label + icon component
  const SOCIAL_PLATFORMS = [
    { key: 'linkedin',       label: 'LinkedIn',  Icon: Linkedin  },
    { key: 'instagram',      label: 'Instagram', Icon: Instagram },
    { key: 'facebook',       label: 'Facebook',  Icon: Facebook  },
    { key: 'youtube',        label: 'YouTube',   Icon: Youtube   },
    { key: 'x',              label: 'X',         Icon: Twitter   },
    { key: 'googleBusiness', label: 'Google',    Icon: ExternalLink },
  ]

  // Show links that have a URL (includes placeholders so footer is never empty)
  const activeSocial = SOCIAL_PLATFORMS.filter(p => social[p.key])

  return (
    <footer className="py-12 px-4 bg-gray-900 text-gray-400 text-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-gray-800">
          {/* Brand */}
          <div>
            <p className="font-bold text-white text-lg">{biz.brandName}</p>
            {biz.owner?.name && <p className="text-xs mt-0.5 text-gray-400">{biz.owner.name}{biz.owner.role ? ` · ${biz.owner.role}` : ''}</p>}
            {biz.city && <p className="text-xs text-gray-500">{biz.city}{biz.country ? `, ${biz.country}` : ''}</p>}
          </div>
          {/* Social icons */}
          {activeSocial.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              {activeSocial.map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={social[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
        {/* Bottom row */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} {biz.brandName || biz.owner?.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#contact" className="hover:text-gray-400 transition-colors">Contact</a>
            <a href="#faq" className="hover:text-gray-400 transition-colors">FAQ</a>
            <a href="#offers" className="hover:text-gray-400 transition-colors">Services</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav — update links to include How-it-works and Video
// ─────────────────────────────────────────────────────────────────────────────
function SiteNav({ payload }) {
  const biz    = payload.business  || {}
  const hasVideo   = !!(payload.knowledge?.introVideo?.url)
  const hasProcess = (payload.knowledge?.process || []).some(s => s?.title)
  const links = [
    { label: 'Services',    href: '#offers'  },
    { label: 'Results',     href: '#proof'   },
    hasProcess && { label: 'How it works', href: '#process' },
    hasVideo   && { label: 'Video',        href: '#video'   },
    { label: 'FAQ',         href: '#faq'     },
    { label: 'Contact',     href: '#contact' },
  ].filter(Boolean)
  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="font-black text-gray-900">{biz.brandName || 'Site'}</span>
        <div className="hidden sm:flex items-center gap-5 text-sm text-gray-600">
          {links.map(l => <a key={l.href} href={l.href} className="hover:text-blue-600 transition-colors">{l.label}</a>)}
        </div>
        <a href="#contact" className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Get in touch
        </a>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Template registry — slug → dynamic import
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATE_COMPONENTS = {
  'tutor-training':         lazy(() => import('../templates/tutor-training/page')),
  'trip-architect':         lazy(() => import('../templates/trip-architect/page')),
  'education-migration':    lazy(() => import('../templates/education-migration/page')),
  'civil-architect-consultant': lazy(() => import('../templates/civil-architect-consultant/page')),
  'consultant-advisor':     lazy(() => import('../templates/consultant-advisor/page')),
  'home-interior-vastu':    lazy(() => import('../templates/home-interior-vastu/page')),
}

// ─────────────────────────────────────────────────────────────────────────────
// GenericSite — the original built-in renderer, used as fallback when
// payload.templateSlug is absent or not yet in TEMPLATE_COMPONENTS.
// ─────────────────────────────────────────────────────────────────────────────
function GenericSite({ payload }) {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav      payload={payload} />
      <HeroSection  payload={payload} />
      <ForWhoSection payload={payload} />
      <OffersSection payload={payload} />
      <ProofSection  payload={payload} />
      <ProcessSection payload={payload} />
      <VideoSection  payload={payload} />
      <FaqSection    payload={payload} />
      <ContactSection payload={payload} />
      <SiteFooter    payload={payload} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function FounderSitePage() {
  const params = useParams()
  const slug = params?.username   // Next.js dynamic segment is named [username]

  const [siteData, setSiteData] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/sites/public/${slug}`)
      .then(async res => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        return res.json()
      })
      .then(data => { if (data) setSiteData(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading site…</p>
        </div>
      </div>
    )
  }

  if (notFound || !siteData?.payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-4">
          <p className="text-6xl font-black text-gray-300 mb-4">404</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Site not found</h1>
          <p className="text-gray-500 text-sm mb-6">
            <code className="bg-gray-100 px-2 py-0.5 rounded">{slug}</code> doesn't have a published site yet.
          </p>
          <a href="/" className="text-blue-600 underline text-sm">Go to homepage</a>
        </div>
      </div>
    )
  }

  const payload = siteData.payload
  const templateSlug = payload.templateSlug || null
  const TemplateComponent = templateSlug ? TEMPLATE_COMPONENTS[templateSlug] : null

  // If a known template is selected, render it with live data
  if (TemplateComponent) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <TemplateComponent data={payload} />
      </Suspense>
    )
  }

  // Fallback: generic renderer (legacy sites or templates not yet wired up)
  return <GenericSite payload={payload} />
}
