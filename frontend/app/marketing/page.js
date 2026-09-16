'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, CheckCircle, Sparkles, Check, X, Download, 
  Send, Star, Shield, Zap, ChevronRight, MessageSquare, BookOpen 
} from 'lucide-react'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import ChatDemoWidget from '../../components/ChatDemoWidget'

function MarketingPageContent() {
  const siteConfig = useSiteConfig()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Extract UTM parameters
  const utmParams = useMemo(() => {
    return {
      utm_source: searchParams.get('utm_source') || undefined,
      utm_medium: searchParams.get('utm_medium') || undefined,
      utm_campaign: searchParams.get('utm_campaign') || undefined,
      utm_content: searchParams.get('utm_content') || undefined,
    }
  }, [searchParams])

  // Get current full query string for forwarding
  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (utmParams.utm_source) params.set('utm_source', utmParams.utm_source)
    if (utmParams.utm_medium) params.set('utm_medium', utmParams.utm_medium)
    if (utmParams.utm_campaign) params.set('utm_campaign', utmParams.utm_campaign)
    if (utmParams.utm_content) params.set('utm_content', utmParams.utm_content)
    const str = params.toString()
    return str ? `?${str}` : ''
  }, [utmParams])

  // Fallback marketing config
  const marketing = siteConfig.marketing_page || {
    hero: {
      headline: "Stop renting your business. Own it.",
      subheadline: "Describe your business. Your AI Genie builds the site, writes the copy, and runs it — no monthly rent, no lock-in.",
      cta_label: "Start free",
      cta_href: "/setup-wizard",
      show_live_demo: true,
    },
    problem_bullets: [
      "Monthly SaaS rent that never ends",
      "Platforms that own your customer data",
      "Generic templates that need a developer",
    ],
    feature_grid: [
      { title: "Build", before: "One month with a developer", after: "One prompt, live in minutes" },
      { title: "Sell", before: "Stitching together checkout tools", after: "Offer page + payments in a day" },
      { title: "Run", before: "Answering DMs at midnight", after: "AI Genie handles enquiries 24/7" },
      { title: "Grow", before: "Guessing what's working", after: "Founder analytics + playbooks" },
    ],
    comparison_table: {
      competitors: ["OPC Genie", "Graphy", "Kajabi", "Skool"],
      rows: [
        { label: "Pricing model", values: ["Flat license", "Monthly %", "Monthly $", "Monthly $"] },
        { label: "You own the code", values: ["Yes", "No", "No", "No"] },
        { label: "White-label", values: ["Day one", "Paid tier", "Paid tier", "No"] },
      ],
    },
    testimonials: [],
    lead_magnet: {
      enabled: true,
      resource_id: null,
      headline: "Get the Solo Founder Launch Playbook",
      cta_label: "Send me the playbook",
    },
    final_cta: {
      headline: "Build your business today.",
      cta_label: "Start free",
    },
  }

  // State for Hero Lead Capture
  const [heroEmail, setHeroEmail] = useState('')
  const [heroSubmitting, setHeroSubmitting] = useState(false)
  const [heroSuccess, setHeroSuccess] = useState(false)

  // State for Lead Magnet
  const [magnetEmail, setMagnetEmail] = useState('')
  const [magnetSubmitting, setMagnetSubmitting] = useState(false)
  const [magnetSuccess, setMagnetSuccess] = useState(false)
  const [magnetMsg, setMagnetMsg] = useState('')

  // Helper function to capture lead
  const captureLead = async (email, source) => {
    try {
      const payload = {
        email,
        source,
        ...utmParams,
        referrer_url: typeof window !== 'undefined' ? document.referrer || window.location.href : undefined,
      }
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return await res.json()
    } catch (e) {
      console.error('Lead capture error', e)
      return null
    }
  }

  // Handle hero CTA click/submit
  const handleHeroSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!heroEmail.trim()) {
      // Direct route to CTA href with UTM params
      const targetHref = (marketing.hero?.cta_href || '/setup-wizard') + queryString
      router.push(targetHref)
      return
    }

    setHeroSubmitting(true)
    try {
      await captureLead(heroEmail.trim(), 'marketing_hero')
      setHeroSuccess(true)
      setTimeout(() => {
        const targetHref = (marketing.hero?.cta_href || '/setup-wizard') + queryString
        router.push(targetHref)
      }, 1000)
    } finally {
      setHeroSubmitting(false)
    }
  }

  // Handle lead magnet download
  const handleLeadMagnetSubmit = async (e) => {
    e.preventDefault()
    if (!magnetEmail.trim()) return

    setMagnetSubmitting(true)
    try {
      await captureLead(magnetEmail.trim(), 'playbook_download')
      setMagnetSuccess(true)
      
      const resourceId = marketing.lead_magnet?.resource_id
      if (resourceId) {
        try {
          const res = await fetch(`/api/resources/${resourceId}`)
          if (res.ok) {
            const data = await res.json()
            if (data.resource_url) {
              setMagnetMsg('Playbook unlocked! Redirecting to download...')
              setTimeout(() => {
                window.open(data.resource_url, '_blank')
              }, 1200)
              return
            }
          }
        } catch (_) {}
      }
      setMagnetMsg('Thank you! The playbook link has been sent to your email.')
    } finally {
      setMagnetSubmitting(false)
    }
  }

  // Construct target link for any generic CTA button
  const getCtaLink = (rawHref) => {
    const base = rawHref || '/setup-wizard'
    return base + queryString
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-primary-500 selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-primary-50/40 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-primary-100/60 border border-primary-200 rounded-full text-sm font-semibold text-primary-800 mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 mr-2 text-primary-600" />
              Build. Sell. Run. Solo.
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              {marketing.hero?.headline}
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-10 max-w-3xl mx-auto">
              {marketing.hero?.subheadline}
            </p>

            {/* Email Capture / Direct CTA Form */}
            <form onSubmit={handleHeroSubmit} className="max-w-md mx-auto mb-10 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={heroEmail}
                onChange={e => setHeroEmail(e.target.value)}
                className="flex-1 px-5 py-4 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 shadow-sm text-base"
              />
              <button
                type="submit"
                disabled={heroSubmitting}
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg disabled:opacity-50 whitespace-nowrap group"
              >
                {heroSubmitting ? 'Starting...' : (marketing.hero?.cta_label || 'Start free')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {heroSuccess && (
              <div className="text-sm font-medium text-green-600 mb-6 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Email saved! Redirecting to setup...
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 font-medium">
              <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-green-500" /> No credit card required</span>
              <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-green-500" /> Full code ownership</span>
              <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-green-500" /> Live in 10 minutes</span>
            </div>
          </div>

          {/* Embedded live demo if enabled */}
          {marketing.hero?.show_live_demo && (
            <div className="mt-16 max-w-3xl mx-auto">
              <ChatDemoWidget previewText="Try your AI Genie live right here" />
            </div>
          )}
        </div>
      </section>

      {/* 2. PROBLEM BULLETS SECTION */}
      {marketing.problem_bullets && marketing.problem_bullets.length > 0 && (
        <section className="py-20 bg-gray-50 border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
                Why Solo Founders Are Tired of SaaS Rents
              </h2>
              <p className="text-gray-600 text-lg">Traditional platforms hold your business hostage.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {marketing.problem_bullets.map((bullet, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start space-x-4">
                  <div className="p-2 rounded-xl bg-red-50 text-red-600 flex-shrink-0 mt-0.5">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-base leading-snug">{bullet}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. LIVE DEMO SECTION (If not shown in Hero) */}
      {!marketing.hero?.show_live_demo && (
        <section className="py-20 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                See Your AI Genie in Action
              </h2>
              <p className="text-lg text-gray-600">
                Ask anything about building your site, structuring offers, or automating support.
              </p>
            </div>
            <ChatDemoWidget previewText="Live Interactive Demo" />
          </div>
        </section>
      )}

      {/* 4. FEATURE GRID (BEFORE / AFTER FRAMING) */}
      {marketing.feature_grid && marketing.feature_grid.length > 0 && (
        <section className="py-24 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                How OPC Genie Replaces Your Entire Stack
              </h2>
              <p className="text-xl text-gray-600">
                A whole business workflow designed for one person to run like a 10-person agency.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {marketing.feature_grid.map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg mb-4">
                      {idx + 1}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{card.title}</h3>
                    
                    {/* Before */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-500 block mb-1">Old Way</span>
                      <p className="text-sm text-gray-500">{card.before}</p>
                    </div>

                    {/* After */}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-green-600 block mb-1">With OPC Genie</span>
                      <p className="text-sm font-semibold text-gray-900">{card.after}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-primary-600 font-semibold text-sm">
                    <span>Learn more</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. COMPARISON TABLE */}
      {marketing.comparison_table && marketing.comparison_table.rows?.length > 0 && (
        <section className="py-24 bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                How We Compare
              </h2>
              <p className="text-xl text-gray-600">
                Why owning your business platform beats recurring platform taxes.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="py-5 px-6 font-bold text-gray-700 text-base">Features & Ownership</th>
                    {(marketing.comparison_table.competitors || []).map((comp, cIdx) => (
                      <th
                        key={cIdx}
                        className={`py-5 px-6 font-bold text-base ${
                          cIdx === 0
                            ? 'bg-primary-600 text-white text-lg font-black'
                            : 'text-gray-800'
                        }`}
                      >
                        {comp}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {marketing.comparison_table.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-900 text-sm">{row.label}</td>
                      {(row.values || []).map((val, vIdx) => {
                        const isPrimary = vIdx === 0
                        return (
                          <td
                            key={vIdx}
                            className={`py-4 px-6 text-sm ${
                              isPrimary
                                ? 'bg-primary-50/50 font-bold text-primary-900 border-x border-primary-100'
                                : 'text-gray-600'
                            }`}
                          >
                            {val === 'Yes' ? (
                              <span className="inline-flex items-center text-green-600 font-bold">
                                <Check className="w-4 h-4 mr-1" /> {val}
                              </span>
                            ) : val === 'No' ? (
                              <span className="inline-flex items-center text-gray-400">
                                <X className="w-4 h-4 mr-1" /> {val}
                              </span>
                            ) : (
                              val
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 6. TESTIMONIALS (Conditional on non-empty) */}
      {marketing.testimonials && marketing.testimonials.length > 0 && (
        <section className="py-24 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                What Solo Founders Are Saying
              </h2>
              <p className="text-xl text-gray-600">
                Real founders building sustainable businesses with OPC Genie.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {marketing.testimonials.map((t, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-8 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-4">
                      {[...Array(t.rating || 5)].map((_, starIdx) => (
                        <Star key={starIdx} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic text-base leading-relaxed mb-6">
                      "{t.content}"
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. LEAD MAGNET SECTION */}
      {marketing.lead_magnet?.enabled && (
        <section className="py-24 bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-primary-200 mb-6 backdrop-blur-sm border border-white/10">
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Free Founder Resource
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                  {marketing.lead_magnet?.headline || 'Get the Solo Founder Launch Playbook'}
                </h2>
                <p className="text-primary-100 text-lg leading-relaxed mb-6">
                  Step-by-step checklist, offer packaging formulas, and copy prompts to take your one-person company from concept to first customer.
                </p>
                <div className="space-y-2 text-sm text-primary-200">
                  <div className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-primary-300" /> Instant PDF download</div>
                  <div className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-primary-300" /> 10+ ready-to-use offer templates</div>
                  <div className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-primary-300" /> 100% free, no sales pitch</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 text-gray-900 shadow-2xl">
                <h3 className="text-xl font-bold mb-2">Download Your Free Copy</h3>
                <p className="text-sm text-gray-500 mb-6">Enter your email and we'll unlock your playbook immediately.</p>
                <form onSubmit={handleLeadMagnetSubmit} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="Enter your best email"
                    value={magnetEmail}
                    onChange={e => setMagnetEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                  <button
                    type="submit"
                    disabled={magnetSubmitting}
                    className="w-full flex items-center justify-center px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-base transition-colors shadow-md disabled:opacity-50"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {magnetSubmitting ? 'Sending...' : (marketing.lead_magnet?.cta_label || 'Send me the playbook')}
                  </button>
                </form>
                {magnetSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {magnetMsg || 'Playbook download ready! Check your email.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. FINAL CTA SECTION */}
      <section className="py-28 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight">
            {marketing.final_cta?.headline || 'Build your business today.'}
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Your website, offer pages, and AI Genie assistant — live in minutes without writing code.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={getCtaLink(marketing.hero?.cta_href || '/setup-wizard')}
              className="inline-flex items-center justify-center px-10 py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl group"
            >
              {marketing.final_cta?.cta_label || 'Start free'}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-6">
            Free tier available • No setup fees • Instant setup
          </p>
        </div>
      </section>
    </div>
  )
}

export default function MarketingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <MarketingPageContent />
    </Suspense>
  )
}
