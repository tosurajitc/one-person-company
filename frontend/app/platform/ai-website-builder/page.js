'use client'

import { useState } from 'react'
import { useSiteConfig } from '../../../hooks/useSiteConfig'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ArrowRight, CheckCircle, Loader2, Wand2, AlertCircle,
  ChevronDown, ChevronUp,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Field classification — mirrors the analysis in ai-genie-assistant/page.js
// ─────────────────────────────────────────────────────────────────────────────

// Fields only the user can supply (shown in red)
const USER_FIELDS = new Set([
  'brandName', 'contactEmail', 'contactPhone', 'location',
  'adminEmail', 'adminPassword', 'supportEmail',
  'twitter', 'linkedin', 'github', 'youtube', 'facebook', 'instagram',
  'stats', 'testimonials',
  'currency', 'annualDiscount', 'studentDiscount',
  'offerPrice', 'offerCurrency', 'offerTitle', 'offerDuration',
  'mktCompetitors',
  'emailProvider', 'smtpHost', 'smtpUsername', 'smtpPassword',
  'fromEmail', 'replyToEmail',
])

// Flat string/scalar keys that Genie fills (shown in green)
const GENIE_FLAT_KEYS = [
  'tagline', 'description', 'siteName', 'siteDescription',
  'heroBadge', 'heroHeadline', 'heroSubheadline', 'heroHighlightWord',
  'heroPrimaryText', 'heroSecondaryText',
  'trustedBy', 'whyDifferentTitle', 'whyDifferentSubtitle',
  'ctaHeadline', 'ctaSubheadline', 'ctaPrimaryText', 'ctaSecondaryText',
  'badge0', 'badge1', 'badge2',
  'mktHeadline', 'mktSubheadline', 'mktCtaLabel',
  'mktLeadMagnetHeadline', 'mktLeadMagnetCta',
  'mktFinalCtaHeadline', 'mktFinalCtaLabel',
]

// User-required fields shown in the red "still needed" checklist
const USER_CHECKLIST = [
  { label: 'Admin email & password',     step: 2 },
  { label: 'Social profile URLs',        step: 3 },
  { label: 'Real stats / numbers',       step: 5 },
  { label: 'Customer testimonials',      step: 5 },
  { label: 'Pricing tier prices',        step: 8 },
  { label: 'Offer titles & prices',      step: 9 },
  { label: 'Competitor names',           step: 10 },
  { label: 'Email / SMTP credentials',   step: 11 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────────────────────────────────────

// A single field tile — green for Genie, red for user-supplied
function FieldTile({ label, value, kind, className = '' }) {
  const bg    = kind === 'genie' ? 'bg-green-50 border-green-200'
              : kind === 'user'  ? 'bg-red-50   border-red-200'
              :                    'bg-gray-50  border-gray-200'
  const badge = kind === 'genie' ? 'bg-green-100 text-green-700'
              : kind === 'user'  ? 'bg-red-100   text-red-700'
              :                    'bg-gray-100  text-gray-500'
  const badgeText = kind === 'genie' ? '✦ Genie' : kind === 'user' ? '✎ You' : 'Auto'
  const display = (value === '' || value == null) ? '—' : String(value)

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${bg} ${className}`}>
      <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
        {badgeText}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-gray-900 text-sm leading-snug break-words">{display}</p>
      </div>
    </div>
  )
}

// Collapsible section for arrays (plans, offers, valueProps, etc.)
function CollapsibleSection({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!count) return null
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
      >
        <span className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✦ Genie</span>
          {title}
        </span>
        <span className="flex items-center gap-2 text-gray-400 font-normal text-xs">
          {count} items
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {open && <div className="divide-y divide-gray-100 bg-green-50">{children}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main widget
// ─────────────────────────────────────────────────────────────────────────────

function GeniePrefillWidget() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [loading, setLoading]         = useState(false)
  const [preview, setPreview]         = useState(null)
  const [savedToProfile, setSavedToProfile] = useState(false)
  const [error, setError]             = useState(null)

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    setPreview(null)
    setSavedToProfile(false)
    try {
      const token = (typeof window !== 'undefined' &&
        (localStorage.getItem('auth_token') || localStorage.getItem('token'))) || ''
      const endpoint = token ? '/api/chat/prefill-and-save' : '/api/chat/prefill'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Something went wrong')
      setPreview(data.prefill)
      setSavedToProfile(!!data.saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLaunchWizard = () => {
    if (!preview) return
    sessionStorage.setItem('genie_prefill', JSON.stringify(preview))
    router.push('/setup-wizard')
  }

  // Count how many Genie flat fields were filled
  const genieCount = preview ? GENIE_FLAT_KEYS.filter(k => preview[k]).length : 0

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">

      {/* ── Input form ── */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <label className="block text-sm font-semibold text-gray-800">
          Describe your business in a few sentences
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={`e.g. "I'm Priya, a solo fitness coach in Mumbai. I help working women over 30 lose weight and build strength in 90 days through personalised online coaching."`}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />

        {/* Legend — shown before results appear */}
        {!preview && (
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
              <span className="text-green-700 font-medium">Green</span> — Genie generates these
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              <span className="text-red-700 font-medium">Red</span> — You fill these in the wizard
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !description.trim()}
          className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Genie is thinking…</>
            : <><Wand2 className="w-4 h-4 mr-2" /> Generate My Site Content</>
          }
        </button>
      </form>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Review panel ── */}
      {preview && (
        <div className="space-y-5">

          {/* Success banner */}
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm">
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">
                Genie filled {genieCount} fields — review below
              </p>
              {savedToProfile
                ? <p className="text-xs text-green-700 mt-0.5">✅ Saved to your profile. Complete the red fields in the wizard to finish.</p>
                : <p className="text-xs text-gray-500 mt-0.5">Not logged in — draft held in session. <a href="/login" className="underline text-primary-600">Log in</a> to save.</p>
              }
              <p className="text-xs text-green-700 mt-1">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Green</span> = AI-generated &nbsp;·&nbsp;
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Red</span> = You must fill in the wizard
              </p>
            </div>
          </div>

          {/* ── RED: User-required fields checklist ── */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Complete your website — fill these in the Setup Wizard:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {USER_CHECKLIST.map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-auto text-red-400 font-semibold">Step {item.step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── GREEN: Brand & Identity ── */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Brand &amp; Identity</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <FieldTile label="Brand Name"      value={preview.brandName}     kind="user" />
              <FieldTile label="Tagline"         value={preview.tagline}       kind="genie" />
              <FieldTile label="Hero Headline"   value={preview.heroHeadline}  kind="genie" className="sm:col-span-2" />
              <FieldTile label="Subheadline"     value={preview.heroSubheadline} kind="genie" className="sm:col-span-2" />
              <FieldTile label="SEO Description" value={preview.description}   kind="genie" className="sm:col-span-2" />
              {preview.heroBadge       && <FieldTile label="Hero Badge"         value={preview.heroBadge}        kind="genie" />}
              {preview.heroHighlightWord && <FieldTile label="Highlight Word"   value={preview.heroHighlightWord} kind="genie" />}
              {preview.trustedBy       && <FieldTile label="Trusted By"         value={preview.trustedBy}        kind="genie" />}
            </div>
          </div>

          {/* ── GREEN: CTAs & Badges ── */}
          {(preview.ctaHeadline || preview.badge0) && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CTAs &amp; Trust Badges</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {preview.ctaHeadline    && <FieldTile label="CTA Headline"    value={preview.ctaHeadline}    kind="genie" className="sm:col-span-2" />}
                {preview.ctaSubheadline && <FieldTile label="CTA Subheadline" value={preview.ctaSubheadline} kind="genie" className="sm:col-span-2" />}
                {preview.ctaPrimaryText && <FieldTile label="Primary CTA"     value={preview.ctaPrimaryText} kind="genie" />}
                {preview.ctaSecondaryText && <FieldTile label="Secondary CTA" value={preview.ctaSecondaryText} kind="genie" />}
                {preview.badge0 && <FieldTile label="Trust Badge 1" value={preview.badge0} kind="genie" />}
                {preview.badge1 && <FieldTile label="Trust Badge 2" value={preview.badge1} kind="genie" />}
                {preview.badge2 && <FieldTile label="Trust Badge 3" value={preview.badge2} kind="genie" />}
              </div>
            </div>
          )}

          {/* ── GREEN: Marketing Page ── */}
          {preview.mktHeadline && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Marketing Page</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <FieldTile label="Marketing Headline"  value={preview.mktHeadline}    kind="genie" className="sm:col-span-2" />
                <FieldTile label="Marketing Sub"       value={preview.mktSubheadline} kind="genie" className="sm:col-span-2" />
                {preview.mktLeadMagnetHeadline && <FieldTile label="Lead Magnet Headline" value={preview.mktLeadMagnetHeadline} kind="genie" />}
                {preview.mktFinalCtaHeadline   && <FieldTile label="Final CTA Headline"   value={preview.mktFinalCtaHeadline}   kind="genie" />}
              </div>
              {/* Pain point bullets */}
              {(preview.mktBullets || []).filter(Boolean).length > 0 && (
                <div className="mt-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✦ Genie</span>
                    Problem / Pain Point Bullets
                  </p>
                  <ul className="space-y-1">
                    {(preview.mktBullets || []).filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                        <span className="mt-0.5 w-4 h-4 rounded-full bg-green-200 text-green-700 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── GREEN: Collapsible arrays ── */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Collections (click to expand)</p>

            <CollapsibleSection title="Value Proposition Cards" count={(preview.valueProps || []).length} defaultOpen={true}>
              {(preview.valueProps || []).map((vp, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-xs font-bold text-green-700 mb-0.5">Card {i + 1}: {vp.title}</p>
                  <p className="text-sm text-gray-700">{vp.description}</p>
                  {vp.highlight && <span className="text-xs text-green-600 italic">vs. {vp.highlight}</span>}
                </div>
              ))}
            </CollapsibleSection>

            <CollapsibleSection title="Pricing Plans" count={(preview.plans || []).length}>
              {(preview.plans || []).map((plan, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-bold text-green-700">{plan.name}</p>
                    {plan.badge && <span className="text-xs text-gray-400">({plan.badge})</span>}
                  </div>
                  <p className="text-sm text-gray-700">{plan.description}</p>
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Price — you set this in Step 8
                  </p>
                </div>
              ))}
            </CollapsibleSection>

            <CollapsibleSection title="Suggested Offers" count={(preview.offers || []).length}>
              {(preview.offers || []).map((offer, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-green-700">{offer.title || '(untitled)'}</p>
                    <span className="text-xs text-gray-500 capitalize">{(offer.offer_type || '').replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-700">{offer.description}</p>
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Title &amp; price — confirm in Step 9
                  </p>
                </div>
              ))}
            </CollapsibleSection>

            <CollapsibleSection title="Pricing FAQs" count={(preview.faqs || []).length}>
              {(preview.faqs || []).map((faq, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-xs font-bold text-green-700">Q: {faq.question}</p>
                  <p className="text-sm text-gray-700 mt-0.5">A: {faq.answer}</p>
                </div>
              ))}
            </CollapsibleSection>

            <CollapsibleSection title="Marketing Feature Grid (Before → After)" count={(preview.mktFeatureGrid || []).length}>
              {(preview.mktFeatureGrid || []).map((fg, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-xs font-bold text-green-700 mb-0.5">{fg.title}</p>
                  <p className="text-sm text-gray-500">Before: {fg.before}</p>
                  <p className="text-sm text-gray-700">After: {fg.after}</p>
                </div>
              ))}
            </CollapsibleSection>

            {/* Stats — RED: user must fill real numbers */}
            {(preview.stats || []).length > 0 && (
              <div className="rounded-xl border border-red-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-red-50 flex items-center gap-2 text-sm font-semibold text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  Stats — placeholder labels only · Fill your real numbers in Step 5
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-red-100">
                  {(preview.stats || []).map((s, i) => (
                    <div key={i} className="bg-red-50 px-3 py-3 text-center">
                      <p className="text-xl font-black text-red-300">{s.number || '?'}</p>
                      <p className="text-xs text-red-600 mt-0.5">{s.label || `Stat ${i + 1}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-200">
            <button
              onClick={handleLaunchWizard}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-colors flex-1"
            >
              Open Setup Wizard with Genie's data
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <button
              onClick={() => { setPreview(null); setDescription('') }}
              className="inline-flex items-center justify-center px-6 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Start over
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">
            All green fields are pre-loaded. Complete the red fields in the wizard to finish your site.
          </p>

        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AIWebsiteBuilderPage() {
  const siteConfig = useSiteConfig()
  const feature = (siteConfig.features || []).find(f => f.title === 'AI Website Builder') || {}

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-4 py-2 bg-primary-50 border border-primary-100 rounded-full text-sm font-medium mb-6 text-primary-700">
            <Sparkles className="w-4 h-4 mr-2" />
            {feature.status || 'Available'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
            {feature.title || 'AI Website Builder'}
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Tell your Genie what you do in plain English — it drafts your entire site in seconds. Review, confirm, and publish.
          </p>
        </div>

        {/* The Genie widget */}
        <GeniePrefillWidget />

        {/* Trust line */}
        <p className="text-center text-xs text-gray-400 mt-6">
          No account needed to preview · Only saved when you finish the wizard
        </p>

      </div>
    </div>
  )
}
