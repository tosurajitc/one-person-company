'use client'

/**
 * AI Website Builder — Genie intake page
 * ------------------------------------------------------------------
 * Collects the answers Genie needs, sends them to the prefill API, shows a
 * review of what Genie drafted, and hands the result to /setup-wizard.
 *
 * In sync with setup-wizard/page.jsx (schema 2.0):
 *   - Handoff key:   sessionStorage 'genie_prefill'              → partial wizard state
 *   - Review flags:  sessionStorage 'genie_needs_confirmation'   → array of field paths
 *
 * API CONTRACT (backend must follow this)
 *   POST /api/chat/prefill            (guest)
 *   POST /api/chat/prefill-and-save   (logged in, Bearer token)
 *   Request:  { schemaVersion, start, basics, answers, links, pastedMaterial, description }
 *   Response: {
 *     prefill: <partial wizard state, same shape as DEFAULT_STATE in the wizard>,
 *     needsConfirmation: ['offers.tiers.0.name', ...],   // fields Genie inferred
 *     followUps: ['Which kind of small business?'],     // optional clarifying questions
 *     saved: boolean
 *   }
 *
 * Honesty rules (from The One-Person Company) are also enforced here, client-side:
 * prices, numbers and testimonials that do not appear in the user's own input are
 * removed and moved to the "only you can add" list.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSiteConfig } from '../../../hooks/useSiteConfig'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ArrowRight, CheckCircle, Loader2, Wand2, AlertCircle, AlertTriangle,
  ChevronDown, ChevronUp, Link2, ClipboardList, RotateCcw, HelpCircle, User, Menu, X,
} from 'lucide-react'

const SCHEMA_VERSION = '2.0'
const ANSWERS_STORAGE_KEY = 'genie_intake_answers_v2'
const PREFILL_KEY = 'genie_prefill'
const CONFIRM_KEY = 'genie_needs_confirmation'

// ─────────────────────────────────────────────────────────────────────────────
// Questions (drawn from the book's positioning, pricing and proof chapters)
// ─────────────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: 'whatAndWho',
    title: 'What do you do, and who do you do it for?',
    help: 'Name a specific group. "Small businesses" is too broad; "freelance designers in India" works.',
    placeholder: "I'm a chartered accountant in Kolkata. I help freelancers and small agencies with GST and income tax.",
    required: true,
    minLength: 40,
    fills: 'Business type, who you help, tagline, SEO description',
  },
  {
    key: 'problem',
    title: 'What problem do clients come to you with, and what does it cost them if it stays unfixed?',
    help: 'Money lost, stress, missed deadlines, lost customers. Be concrete.',
    placeholder: 'They miss GST deadlines, pay late fees and get surprise tax bills in March. Some have received notices.',
    required: true,
    minLength: 40,
    fills: 'The problem, their fears, "this is for you if…", FAQ topics',
  },
  {
    key: 'result',
    title: 'What result do clients get after working with you, and how long does it take?',
    help: 'Describe what changes for them, not the tasks you do.',
    placeholder: 'Clean books, every return filed on time, no penalties. Most clients are fully sorted within a month.',
    required: true,
    minLength: 30,
    fills: 'Outcome, time frame, headline, offer summaries',
  },
  {
    key: 'offersAndPrices',
    title: 'What do you sell, and what do you charge? List everything, even if it’s messy.',
    help: 'Include free consultations, packages and monthly services. Genie organises them into three tiers and only uses the prices you write here.',
    placeholder: 'Free 30-min call. GST registration ₹3,000. Monthly filing ₹2,500/month. Full-year package ₹25,000.',
    required: true,
    minLength: 20,
    fills: 'Tier 1, 2 and 3 offers, deliverables, prices, payment terms',
  },
  {
    key: 'whyYou',
    title: 'Why should someone choose you?',
    help: 'Years of experience, qualifications, past roles, results you can back up. Genie will not invent any of these.',
    placeholder: 'CA for 9 years, ex-Deloitte. Handled 140+ freelancer clients. Saved one design studio ₹2.4 lakh in its first year.',
    fills: 'Credibility, credentials, experience, results, About page',
    suggestions: [
      "5+ years of hands-on industry experience with 50+ happy clients.",
      "Worked with top tier global brands and startups in this niche.",
      "Proven track record with measurable ROI and verified testimonials.",
      "Certified specialist with end-to-end dedicated 1-on-1 support."
    ]
  },
  {
    key: 'notFit',
    title: 'Who is not a good fit for you?',
    help: 'This filters out enquiries that waste your time.',
    placeholder: 'Companies with their own finance team, or people who only want the cheapest possible filing.',
    fills: '"Not for you if…" list, enquiry form questions',
    suggestions: [
      "People looking for the cheapest quick-fix without long-term quality.",
      "Large enterprise teams with existing in-house departments.",
      "Anyone expecting overnight results without active collaboration.",
      "Businesses not ready to invest in structured growth."
    ]
  },
  {
    key: 'howFound',
    title: 'How do new clients find you, and how do they usually contact you?',
    help: 'Referrals, LinkedIn, Instagram, Google, WhatsApp, events…',
    placeholder: 'Mostly referrals and LinkedIn posts. Most people message me on WhatsApp first.',
    fills: 'Main button on your site, contact options, content plan, AI agents',
    suggestions: [
      "Mostly referrals from past clients and WhatsApp direct messaging.",
      "LinkedIn outreach and posts, with calls booked via Calendly.",
      "Instagram DMs, organic search, and portfolio enquiries.",
      "Word of mouth, industry events, and direct email enquiries."
    ]
  },
]

const BUSINESS_TYPES = [
  { value: 'consulting', label: 'Consultant' },
  { value: 'freelance',  label: 'Freelancer' },
  { value: 'coaching',   label: 'Coach / trainer' },
  { value: 'creator',    label: 'Creator / educator' },
  { value: 'local',      label: 'Local business' },
  { value: 'other',      label: 'Other' },
]

const createEmptyIntake = () => ({
  basics: { ownerName: '', brandName: '', email: '', whatsapp: '' },
  start: { businessType: 'consulting', market: 'india', language: 'en' },
  answers: Object.fromEntries(QUESTIONS.map(q => [q.key, ''])),
  links: { website: '', linkedin: '', instagram: '', other: '' },
  pastedMaterial: '',
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500'

function getIn(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}
function setIn(obj, path, value) {
  const keys = Array.isArray(path) ? path : path.split('.')
  if (keys.length === 0) return value
  const [k, ...rest] = keys
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj || {}) }
  clone[k] = setIn(obj ? obj[k] : undefined, rest, value)
  return clone
}
function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}
function deepMerge(base, patch) {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch === undefined ? base : patch
  const out = { ...base }
  for (const key of Object.keys(patch)) {
    out[key] = isPlainObject(base[key]) && isPlainObject(patch[key]) ? deepMerge(base[key], patch[key]) : patch[key]
  }
  return out
}
const normalise = s => (s || '').toLowerCase().replace(/[\s,₹$"'“”‘’.]/g, '')
const digitsOnly = v => String(v ?? '').replace(/[^\d]/g, '')

// Everything the user typed, as one searchable string
function userText(intake) {
  return [
    ...Object.values(intake.basics),
    ...Object.values(intake.answers),
    ...Object.values(intake.links),
    intake.pastedMaterial,
  ].join(' \n ')
}

// Numbers like "2.4 lakh" or "25,000" should only survive if the user wrote them
function numberAppearsIn(value, text) {
  const d = digitsOnly(value)
  if (!d) return true
  const textDigits = text.replace(/,/g, '')
  return textDigits.includes(d) || text.includes(String(value))
}

// Composed description so the wizard's Step 1 is never empty
function composeDescription(intake) {
  const a = intake.answers
  return [a.whatAndWho, a.problem, a.result].map(s => s.trim()).filter(Boolean).join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Honesty filter: remove invented prices, numbers and testimonials
// ─────────────────────────────────────────────────────────────────────────────
function enforceHonesty(prefill, intake, needsConfirmation) {
  const text = userText(intake)
  const normText = normalise(text)
  let out = prefill
  const removed = []
  const flagged = new Set(needsConfirmation)

  const checkNumber = (path, label) => {
    const v = getIn(out, path)
    if (v === '' || v == null) return
    if (!numberAppearsIn(v, text)) {
      out = setIn(out, path, '')
      removed.push({ path, label })
    } else {
      flagged.add(path)
    }
  }

  ;(getIn(out, 'offers.tiers') || []).forEach((_, i) => {
    checkNumber(`offers.tiers.${i}.priceInr`, `Tier ${i + 1} price (₹)`)
    checkNumber(`offers.tiers.${i}.priceUsd`, `Tier ${i + 1} price ($)`)
  })
  checkNumber('offers.product.priceInr', 'Product price (₹)')
  checkNumber('offers.product.priceUsd', 'Product price ($)')
  checkNumber('proof.yearsExperience', 'Years of experience')
  checkNumber('proof.clientsServed', 'Clients served')

  const results = getIn(out, 'proof.results') || []
  const keptResults = results.filter(r => r && r.number && numberAppearsIn(r.number, text))
  if (keptResults.length < results.length) removed.push({ path: 'proof.results', label: 'Results with numbers you did not mention' })
  out = setIn(out, 'proof.results', keptResults)

  const testimonials = getIn(out, 'proof.testimonials') || []
  const keptTestimonials = testimonials.filter(t => t && t.quote && normText.includes(normalise(t.quote).slice(0, 60)))
  if (keptTestimonials.length < testimonials.length) removed.push({ path: 'proof.testimonials', label: 'Testimonials not found in what you pasted' })
  out = setIn(out, 'proof.testimonials', keptTestimonials)
  if (keptTestimonials.length) flagged.add('proof.testimonials')

  // Case studies and credentials are summaries, so keep them but always ask the user to check
  if ((getIn(out, 'proof.caseStudies') || []).length) flagged.add('proof.caseStudies')
  if ((getIn(out, 'proof.credentials') || []).some(Boolean)) flagged.add('proof.credentials')

  return { prefill: out, removed, needsConfirmation: [...flagged] }
}

// Fields only the user can supply, computed from the final draft
function userOnlyItems(p) {
  const items = []
  const add = (cond, label, step) => { if (cond) items.push({ label, step }) }
  const t1 = getIn(p, 'offers.tiers.0') || {}
  const market = getIn(p, 'start.market')
  const cta = getIn(p, 'frontDoor.primaryCta')

  add(!getIn(p, 'identity.brandName'), 'Business name', 2)
  add(!getIn(p, 'identity.ownerName'), 'Your name', 2)
  add(!getIn(p, 'identity.email'), 'Business email', 2)
  add(!getIn(p, 'identity.photoUrl'), 'Your photo', 2)
  add(cta === 'whatsapp' && !getIn(p, 'identity.whatsapp'), 'WhatsApp number', 2)
  add(market !== 'global' && !t1.priceInr, 'Tier 1 price in ₹', 4)
  add(market !== 'india' && !t1.priceUsd, 'Tier 1 price in $', 4)
  add(cta === 'book_call' && !getIn(p, 'frontDoor.bookingUrl'), 'Booking link (Calendly, Cal.com…)', 6)
  add(!(getIn(p, 'proof.testimonials') || []).length, 'Real client testimonials (optional)', 5)
  add(!(getIn(p, 'proof.results') || []).length, 'Results you can back up with numbers (optional)', 5)
  add(getIn(p, 'payments.gstRegistered') === 'yes' && !getIn(p, 'payments.gstin'), 'GSTIN', 10)
  add(!(getIn(p, 'payments.gateways') || []).length, 'Payment methods you have set up', 10)
  return items
}

// Friendly labels for review flags
const FIELD_LABELS = [
  [/^positioning\.buyer$/, 'Who you help'],
  [/^positioning\.problem$/, 'The problem you solve'],
  [/^positioning\.outcome$/, 'The outcome'],
  [/^positioning\.timeframe$/, 'Time frame'],
  [/^positioning\.fear$/, 'What clients worry about'],
  [/^positioning\.credibility$/, 'Why you'],
  [/^offers\.tiers\.(\d)\.name$/, m => `Tier ${Number(m[1]) + 1} offer name`],
  [/^offers\.tiers\.(\d)\.price(Inr|Usd)$/, m => `Tier ${Number(m[1]) + 1} price (${m[2] === 'Inr' ? '₹' : '$'})`],
  [/^offers\.tiers\.(\d)\./, m => `Tier ${Number(m[1]) + 1} details`],
  [/^offers\.mostBought$/, 'Most popular tier'],
  [/^proof\.testimonials/, 'Testimonials'],
  [/^proof\.caseStudies/, 'Case studies'],
  [/^proof\.credentials/, 'Credentials'],
  [/^proof\.(yearsExperience|clientsServed)$/, 'Experience numbers'],
  [/^frontDoor\.primaryCta$/, 'Main button on your site'],
  [/^knowledge\.refundPolicy$/, 'Refund policy'],
  [/^knowledge\.faqs/, 'FAQs'],
  [/^payments\./, 'Payment and tax details'],
]
function labelFor(path) {
  for (const [re, label] of FIELD_LABELS) {
    const m = path.match(re)
    if (m) return typeof label === 'function' ? label(m) : label
  }
  return path.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())
}

// ─────────────────────────────────────────────────────────────────────────────
// Presentational pieces
// ─────────────────────────────────────────────────────────────────────────────
function Collapsible({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!count) return null
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-800"
      >
        <span>{title}</span>
        <span className="flex items-center gap-2 text-gray-500 font-normal text-xs">
          {count} {count === 1 ? 'item' : 'items'}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {open && <div className="divide-y divide-gray-100 border-t border-gray-100 bg-gray-50">{children}</div>}
    </div>
  )
}

function CheckBadge() {
  return <span className="ml-1.5 align-middle px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-medium">Check</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// Main widget
// ─────────────────────────────────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating nav sections definition
// ─────────────────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: 'section-basics', label: 'The basics', short: null, required: false },
  ...QUESTIONS.map((q, i) => ({
    id: `section-q-${q.key}`,
    label: q.title.replace(/[?]/g, '').split(',')[0].slice(0, 38),
    short: i + 1,
    required: !!q.required,
    key: q.key,
  })),
  { id: 'section-extras', label: 'Links & material', short: QUESTIONS.length + 1, required: false },
]

function SideNav({ activeId, onNavigate, mobileOpen, onMobileToggle, answeredKeys }) {
  return (
    <>
      {/* ── Mobile FAB ── */}
      <button
        type="button"
        onClick={onMobileToggle}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center"
        aria-label="Toggle question menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={onMobileToggle} />
      )}

      {/* ── Desktop: fixed left panel | Mobile: slide-up sheet ── */}
      <aside
        className={[
          /* shared */
          'bg-white z-40 transition-transform duration-300',
          /* desktop */
          'lg:fixed lg:top-20 lg:left-0 lg:bottom-0 lg:w-60 lg:border-r lg:border-gray-200 lg:translate-y-0 lg:translate-x-0 lg:flex lg:flex-col',
          /* mobile */
          'fixed bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl px-4 pt-3 pb-6',
          mobileOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0',
        ].join(' ')}
      >
        {/* drag handle (mobile only) */}
        <div className="lg:hidden flex justify-center mb-3">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* header */}
        <div className="hidden lg:flex items-center justify-between px-5 pt-6 pb-3 border-b border-gray-100 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Sections</span>
          <span className="text-[11px] text-gray-400">
            {answeredKeys.size}/{QUESTIONS.length} done
          </span>
        </div>
        <p className="lg:hidden text-xs font-semibold text-gray-700 mb-3">Jump to a section</p>

        {/* scrollable nav list */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_SECTIONS.map(sec => {
            const isActive = activeId === sec.id
            const answered = sec.key ? answeredKeys.has(sec.key) : false
            const dot = answered
              ? 'bg-green-500 text-white'
              : sec.required
              ? 'bg-red-100 text-red-600 ring-1 ring-red-300'
              : 'bg-gray-100 text-gray-500'
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  onNavigate(sec.id)
                  if (mobileOpen) onMobileToggle()
                }}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-xs group',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                ].join(' ')}
              >
                {/* active bar */}
                <span className={`shrink-0 w-1 h-5 rounded-full ${isActive ? 'bg-primary-500' : 'bg-transparent group-hover:bg-gray-200'}`} />
                {/* number / status dot */}
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${dot}`}>
                  {answered ? '✓' : sec.short ?? '●'}
                </span>
                {/* label */}
                <span className="leading-snug line-clamp-2 flex-1">{sec.label}</span>
                {/* required pill */}
                {sec.required && !answered && (
                  <span className="shrink-0 text-[9px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">req</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* footer CTA (desktop) */}
        <div className="hidden lg:block px-5 py-4 border-t border-gray-100 shrink-0">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Answer all required questions, then click <strong className="text-gray-700">Draft my website</strong> at the bottom.
          </p>
        </div>
      </aside>
    </>
  )
}

function GenieIntakeWidget() {
  const router = useRouter()
  const [intake, setIntake] = useState(createEmptyIntake)
  const [hydrated, setHydrated] = useState(false)
  const [showExtras, setShowExtras] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { prefill, needsConfirmation, removed, followUps, saved }
  const [quotaInfo, setQuotaInfo] = useState(null)
  const [paying, setPaying] = useState(false)
  const [activeSection, setActiveSection] = useState('section-basics')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Fetch generation status and restore answers
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ANSWERS_STORAGE_KEY)
      if (saved) setIntake(deepMerge(createEmptyIntake(), JSON.parse(saved)))
    } catch (_) { /* ignore */ }

    const token = (typeof window !== 'undefined' && (localStorage.getItem('auth_token') || localStorage.getItem('token'))) || ''
    if (token) {
      fetch('/api/genie/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setQuotaInfo(data))
      .catch(() => {})
    }

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const t = setTimeout(() => {
      try { localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(intake)) } catch (_) { /* ignore */ }
    }, 500)
    return () => clearTimeout(t)
  }, [intake, hydrated])

  // Track which section is in view for the side nav highlight
  useEffect(() => {
    const sectionIds = NAV_SECTIONS.map(s => s.id)
    const observers = []
    const visible = new Map()

    sectionIds.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          visible.set(id, entry.isIntersecting)
          // Pick the topmost visible section
          const first = sectionIds.find(sid => visible.get(sid))
          if (first) setActiveSection(first)
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [hydrated, result])

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top: y, behavior: 'smooth' })
    setActiveSection(id)
  }, [])

  const update = (path, value) => setIntake(d => setIn(d, path, value))

  const requiredQs = QUESTIONS.filter(q => q.required)
  const answeredCount = QUESTIONS.filter(q => (intake.answers?.[q.key] || '').trim()).length
  const answeredKeys = new Set(QUESTIONS.filter(q => (intake.answers?.[q.key] || '').trim()).map(q => q.key))
  const missingRequired = requiredQs.filter(q => !(intake.answers?.[q.key] || '').trim())
  const hasExtras = Object.values(intake.links).some(Boolean) || intake.pastedMaterial.trim()
  const canSubmit = missingRequired.length === 0 && !loading

  const handleGenerate = async e => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const token = (typeof window !== 'undefined' && (localStorage.getItem('auth_token') || localStorage.getItem('token'))) || ''
      const endpoint = '/api/genie/intake'
      const description = composeDescription(intake)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          schemaVersion: SCHEMA_VERSION,
          start: intake.start,
          basics: intake.basics,
          answers: intake.answers,
          links: intake.links,
          pastedMaterial: intake.pastedMaterial,
          description,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          // Quota exhausted (1 free draft used, needs Rs. 99 top-up)
          const detail = typeof data.detail === 'object' ? data.detail : {}
          setQuotaInfo(prev => ({
            ...(prev || {}),
            has_saved_draft: !!detail.has_saved_draft,
            saved_draft: detail.saved_draft,
            free_generation_available: false,
            can_generate: false,
          }))
          throw new Error(detail.message || "You have used your 1 free AI website draft. Pay ₹99 to generate a new AI draft, or continue with your saved draft.")
        }
        const errMessage = typeof data.detail === 'string' ? data.detail : (data.detail?.message || `Genie could not draft your site (error ${res.status}). Your answers are saved; try again.`)
        throw new Error(errMessage)
      }

      const raw = isPlainObject(data.prefill) ? data.prefill : {}
      if (raw.brandName || raw.heroHeadline) {
        throw new Error('Genie returned the old data format. The prefill API needs updating to schema 2.0 before the wizard can use it.')
      }

      // The user's own inputs always win over Genie for these fields
      const userOwned = {
        start: { ...intake.start, description },
        identity: Object.fromEntries(Object.entries(intake.basics).filter(([, v]) => v.trim())),
        channels: {
          social: Object.fromEntries([
            ['linkedin', intake.links.linkedin],
            ['instagram', intake.links.instagram],
          ].filter(([, v]) => v.trim())),
        },
      }
      const merged = deepMerge(raw, userOwned)
      const honest = enforceHonesty(merged, intake, Array.isArray(data.needsConfirmation) ? data.needsConfirmation : [])

      setResult({
        prefill: honest.prefill,
        needsConfirmation: honest.needsConfirmation,
        removed: honest.removed,
        followUps: Array.isArray(data.followUps) ? data.followUps.filter(Boolean) : [],
        saved: !!data.saved,
      })
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenWizard = () => {
    if (!result) return
    try {
      sessionStorage.setItem(PREFILL_KEY, JSON.stringify(result.prefill))
      sessionStorage.setItem(CONFIRM_KEY, JSON.stringify(result.needsConfirmation))
    } catch (_) { /* ignore */ }
    router.push('/setup-wizard')
  }

  const handleStartOver = () => {
    if (typeof window !== 'undefined' && !window.confirm('Clear your answers and start again?')) return
    try { localStorage.removeItem(ANSWERS_STORAGE_KEY) } catch (_) { /* ignore */ }
    setIntake(createEmptyIntake())
    setResult(null)
    setError(null)
  }

  const handlePayForAiCredit = async () => {
    setPaying(true)
    setError(null)
    try {
      const token = (typeof window !== 'undefined' && (localStorage.getItem('auth_token') || localStorage.getItem('token'))) || ''
      if (!token) {
        router.push('/login?redirect=/platform/ai-website-builder')
        return
      }

      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gateway: 'razorpay', purpose: 'ai_credit' }),
      })
      const order = await res.json()
      if (!res.ok) throw new Error(order.detail || 'Could not create payment order.')

      const sdkLoaded = await loadRazorpay()
      if (!sdkLoaded) throw new Error('Could not load payment gateway. Please check your internet connection.')

      const rzp = new window.Razorpay({
        key: order.razorpay_key_id,
        amount: order.amount * 100,
        currency: order.currency || 'INR',
        name: 'Shukto AI',
        description: 'New AI Website Generation (1 Credit)',
        order_id: order.order_id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                gateway_order_id: response.razorpay_order_id,
                gateway_payment_id: response.razorpay_payment_id,
                gateway_signature: response.razorpay_signature,
              }),
            })
            if (!verifyRes.ok) throw new Error('Payment verification failed.')
            
            // Refresh status
            const statusRes = await fetch('/api/genie/status', { headers: { Authorization: `Bearer ${token}` } })
            const updated = await statusRes.json()
            setQuotaInfo(updated)
            setError(null)
            alert('Payment successful! You can now click "Draft my website" to generate your new AI draft.')
          } catch (verErr) {
            setError(verErr.message)
          } finally {
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      })
      rzp.open()
    } catch (err) {
      setError(err.message)
      setPaying(false)
    }
  }

  const handleUseSavedDraft = () => {
    if (!quotaInfo?.saved_draft) return
    try {
      sessionStorage.setItem(PREFILL_KEY, JSON.stringify(quotaInfo.saved_draft))
      sessionStorage.setItem(CONFIRM_KEY, JSON.stringify([]))
    } catch (_) {}
    router.push('/setup-wizard')
  }

  if (result) {
    return (
      <ReviewPanel
        result={result}
        onOpenWizard={handleOpenWizard}
        onEdit={() => setResult(null)}
        onStartOver={handleStartOver}
      />
    )
  }

  return (
    <div className="relative">
      {/* Floating fixed side nav */}
      <SideNav
        activeId={activeSection}
        onNavigate={scrollToSection}
        mobileOpen={mobileNavOpen}
        onMobileToggle={() => setMobileNavOpen(o => !o)}
        answeredKeys={answeredKeys}
      />

      {/* Main form */}
      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Quota Banner */}
        {quotaInfo?.has_saved_draft && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-blue-950">You have a saved AI website draft.</p>
              <p className="text-xs text-blue-800 mt-0.5">
                Editing your saved draft in the wizard is 100% free. Generating a brand-new AI draft is ₹99.
              </p>
            </div>
            <button
              type="button"
              onClick={handleUseSavedDraft}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm"
            >
              Continue with saved draft &rarr;
            </button>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{answeredCount} of {QUESTIONS.length} questions answered</span>
            <span>{requiredQs.length} required</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-1.5 bg-primary-600 rounded-full transition-all" style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }} />
          </div>
        </div>

        {/* Basics */}
        <fieldset id="section-basics" className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 scroll-mt-28">
          <legend className="w-full text-sm font-semibold text-gray-900 pb-3 mb-1 border-b border-gray-100 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center"><User className="w-3.5 h-3.5 text-primary-600" /></span>
            The basics
            <span className="ml-auto text-[10px] font-medium text-gray-400">Used on your website</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputCls} aria-label="Your name" placeholder="Your name" value={intake.basics.ownerName} onChange={e => update('basics.ownerName', e.target.value)} />
            <input className={inputCls} aria-label="Business name" placeholder="Business name (if you have one)" value={intake.basics.brandName} onChange={e => update('basics.brandName', e.target.value)} />
            <input className={inputCls} aria-label="Business email" type="email" placeholder="Business email" value={intake.basics.email} onChange={e => update('basics.email', e.target.value)} />
            <input className={inputCls} aria-label="WhatsApp number" placeholder="WhatsApp number (optional)" value={intake.basics.whatsapp} onChange={e => update('basics.whatsapp', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs text-gray-600">
              You are a
              <select className={`${inputCls} mt-1`} value={intake.start.businessType} onChange={e => update('start.businessType', e.target.value)}>
                {BUSINESS_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-gray-600">
              Your clients are in
              <select className={`${inputCls} mt-1`} value={intake.start.market} onChange={e => update('start.market', e.target.value)}>
                <option value="india">India (₹)</option>
                <option value="global">Outside India ($)</option>
                <option value="both">Both (₹ and $)</option>
              </select>
            </label>
            <label className="text-xs text-gray-600">
              Website language
              <select className={`${inputCls} mt-1`} value={intake.start.language} onChange={e => update('start.language', e.target.value)}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="bn">Bengali</option>
                <option value="en-hi">English + Hindi</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* Questions */}
        <ol className="space-y-4">
          {QUESTIONS.map((q, i) => {
            const value = intake.answers?.[q.key] || ''
            const tooShort = value.trim() && q.minLength && value.trim().length < q.minLength
            const answered = value.trim().length > 0
            return (
              <li
                key={q.key}
                id={`section-q-${q.key}`}
                className={`bg-white rounded-2xl border p-5 space-y-3 scroll-mt-28 transition-shadow ${answered ? 'border-green-200 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
              >
                {/* Question header */}
                <label htmlFor={`q-${q.key}`} className="block cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5 transition-colors ${answered ? 'bg-green-500' : 'bg-primary-600'}`}>
                      {answered ? '✓' : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {q.title}
                        {q.required
                          ? <span className="ml-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full align-middle">required</span>
                          : <span className="ml-1.5 text-[10px] font-medium text-gray-400 align-middle">optional</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{q.help}</p>
                    </div>
                    {answered && <span className="shrink-0 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">Done</span>}
                  </div>
                </label>
                <textarea
                  id={`q-${q.key}`}
                  rows={3}
                  value={value}
                  onChange={e => update(`answers.${q.key}`, e.target.value)}
                  placeholder={q.placeholder}
                  className={`${inputCls} resize-y`}
                />
                {Array.isArray(q.suggestions) && q.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <span>💡</span> Quick suggestions — click to add:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {q.suggestions.map((sugg, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            const current = (intake.answers?.[q.key] || '').trim()
                            const updated = current ? `${current} ${sugg}` : sugg
                            update(`answers.${q.key}`, updated)
                          }}
                          className="text-xs bg-gray-50 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 border border-gray-200 text-gray-600 rounded-lg px-2.5 py-1.5 text-left transition-colors"
                        >
                          + {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t border-gray-100">
                  <span className="text-gray-400 flex items-center gap-1">
                    <span className="text-gray-300">→</span> Fills: {q.fills}
                  </span>
                  {tooShort && <span className="text-amber-600 font-medium">A little more detail will give a better draft</span>}
                </div>
              </li>
            )
          })}

          {/* Links & pasted material */}
          <li id="section-extras" className="bg-white rounded-xl border border-gray-200 overflow-hidden scroll-mt-28">
            <button
              type="button"
              onClick={() => setShowExtras(s => !s)}
              aria-expanded={showExtras || !!hasExtras}
              className="w-full flex items-start gap-2.5 p-4 text-left hover:bg-gray-50"
            >
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{QUESTIONS.length + 1}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-gray-900">
                  Share links or paste anything you already have <span className="ml-1 text-xs font-normal text-gray-400">optional, but fills the most</span>
                </span>
                <span className="block text-xs text-gray-500 mt-1">Your website or LinkedIn, a price list, client reviews, FAQs, a past proposal.</span>
              </span>
              {showExtras || hasExtras ? <ChevronUp className="w-4 h-4 text-gray-400 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 mt-1" />}
            </button>
            {(showExtras || hasExtras) && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['website', 'Current website'],
                    ['linkedin', 'LinkedIn profile'],
                    ['instagram', 'Instagram'],
                    ['other', 'Any other link (Google reviews, portfolio)'],
                  ].map(([key, label]) => (
                    <div key={key} className="relative">
                      <Link2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                      <input type="url" aria-label={label} placeholder={label} value={intake.links?.[key] || ''} onChange={e => update(`links.${key}`, e.target.value)} className={`${inputCls} pl-9`} />
                    </div>
                  ))}
                </div>
                <div>
                  <label htmlFor="pasted" className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                    <ClipboardList className="w-3.5 h-3.5" />Paste text
                  </label>
                  <textarea
                    id="pasted"
                    rows={6}
                    value={intake.pastedMaterial || ''}
                    onChange={e => update('pastedMaterial', e.target.value)}
                    placeholder={'Price list, brochure text, client reviews (with names), your FAQs, refund policy…\n\nTestimonials are only used if they appear here, word for word.'}
                    className={`${inputCls} resize-y`}
                  />
                </div>
              </div>
            )}
          </li>
        </ol>

        {error && (
          <div className="flex flex-col gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm" role="alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
              <span className="font-medium">{error}</span>
            </div>
            {quotaInfo && !quotaInfo.free_generation_available && quotaInfo.credits === 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={handlePayForAiCredit}
                  disabled={paying}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                >
                  {paying ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                  Get 1 New AI Draft for ₹99
                </button>
                {quotaInfo.has_saved_draft && (
                  <button
                    type="button"
                    onClick={handleUseSavedDraft}
                    className="inline-flex items-center px-3.5 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-xs rounded-lg hover:bg-gray-50"
                  >
                    Continue with previous draft (Free)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-gray-200">
          <button
            type="submit"
            disabled={!canSubmit || paying}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Genie is drafting your site…</>
              : <><Wand2 className="w-4 h-4 mr-2" />Draft my website</>}
          </button>
          {missingRequired.length > 0 && (
            <p className="text-xs text-gray-500">Answer question{missingRequired.length > 1 ? 's' : ''} {missingRequired.map(q => QUESTIONS.indexOf(q) + 1).join(', ')} to continue.</p>
          )}
          <button type="button" onClick={handleStartOver} className="sm:ml-auto inline-flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-red-600">
            <RotateCcw className="w-3.5 h-3.5" />Clear answers
          </button>
        </div>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Review panel — what Genie drafted, what to check, what only the user can add
// ─────────────────────────────────────────────────────────────────────────────
function ReviewPanel({ result, onOpenWizard, onEdit, onStartOver }) {
  const { prefill: p, needsConfirmation, removed, followUps, saved } = result
  const flagged = path => needsConfirmation.some(f => f === path || f.startsWith(`${path}.`))
  const pos = p.positioning || {}
  const tiers = (getIn(p, 'offers.tiers') || []).filter(t => t && t.name)
  const market = getIn(p, 'start.market')
  const faqs = (getIn(p, 'knowledge.faqs') || []).filter(f => f && f.question)
  const process = (getIn(p, 'knowledge.process') || []).filter(s => s && s.title)
  const forWho = (pos.forWho || []).filter(Boolean)
  const notFor = (pos.notFor || []).filter(Boolean)
  const credentials = (getIn(p, 'proof.credentials') || []).filter(Boolean)
  const caseStudies = (getIn(p, 'proof.caseStudies') || []).filter(c => c && (c.client || c.result))
  const testimonials = getIn(p, 'proof.testimonials') || []
  const youItems = userOnlyItems(p)
  const checkLabels = [...new Set(needsConfirmation.map(labelFor))]
  const tierTitle = ['Tier 1 · Paid first step', 'Tier 2 · Main offer', 'Tier 3 · Ongoing']
  const price = t => {
    const inr = t.priceInr ? `₹${Number(t.priceInr).toLocaleString('en-IN')}` : null
    const usd = t.priceUsd ? `$${Number(t.priceUsd).toLocaleString('en-US')}` : null
    const shown = (market === 'india' ? [inr] : market === 'global' ? [usd] : [inr, usd]).filter(Boolean)
    const suffix = t.tier === 'recurring' ? '/mo' : ''
    return shown.length ? shown.map(s => s + suffix).join(' · ') : null
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm">
        <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-green-600" />
        <div>
          <p className="font-semibold text-green-900">Genie drafted your website. Review it below, then finish in the setup wizard.</p>
          <p className="text-xs text-green-800 mt-0.5">
            {saved ? 'Draft saved to your account.' : <>Draft kept on this device only. <a href="/login" className="underline">Log in</a> to save it to your account.</>}
          </p>
        </div>
      </div>

      {/* Follow-up questions */}
      {followUps.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
          <p className="font-semibold text-blue-900 flex items-center gap-2 mb-2"><HelpCircle className="w-4 h-4" />Genie has a few questions to sharpen your site</p>
          <ul className="list-disc ml-5 space-y-1 text-blue-900">
            {followUps.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
          <button type="button" onClick={onEdit} className="mt-3 text-xs font-medium text-blue-700 underline">Add details to my answers</button>
        </div>
      )}

      {/* Positioning */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Who your website is for
          {['positioning.buyer', 'positioning.problem', 'positioning.outcome'].some(flagged) && <CheckBadge />}
        </h3>
        <p className="rounded-lg bg-gray-900 text-white px-4 py-3 text-base leading-relaxed">
          I help {pos.buyer || '___'} who struggle with {pos.problem || '___'} to get {pos.outcome || '___'}
          {pos.timeframe ? ` within ${pos.timeframe}` : ''}{pos.fear ? `, without ${pos.fear}` : ''}.
        </p>
        {(forWho.length > 0 || notFor.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {forWho.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">For you if…</p>
                <ul className="space-y-1 text-gray-800">{forWho.map((s, i) => <li key={i} className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />{s}</li>)}</ul>
              </div>
            )}
            {notFor.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Not for you if…</p>
                <ul className="space-y-1 text-gray-800">{notFor.map((s, i) => <li key={i} className="flex gap-2"><span className="text-gray-400 shrink-0">✕</span>{s}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Offers */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Your offers {flagged('offers') && <CheckBadge />}</h3>
        {tiers.length === 0 ? (
          <p className="text-sm text-gray-500">Genie couldn't build offers from your answers. You'll add them in step 4 of the wizard.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(getIn(p, 'offers.tiers') || []).map((t, i) => {
              if (!t || !t.name) return null
              const highlight = getIn(p, 'offers.mostBought') === t.tier
              const shownPrice = price(t)
              return (
                <div key={i} className={`rounded-lg p-3 border ${highlight ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'} bg-gray-50`}>
                  <p className="text-xs text-gray-500">{tierTitle[i] || `Tier ${i + 1}`}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{t.name}</p>
                  {t.summary && <p className="text-xs text-gray-600 mt-1">{t.summary}</p>}
                  <p className={`text-sm mt-2 ${shownPrice ? 'text-gray-900 font-medium' : 'text-red-600'}`}>
                    {shownPrice || 'Price needed'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Collections */}
      <div className="space-y-2">
        <Collapsible title="Why you (credentials & case studies)" count={credentials.length + caseStudies.length + testimonials.length}>
          {credentials.map((c, i) => <p key={`c${i}`} className="px-4 py-2.5 text-sm text-gray-800">{c}</p>)}
          {caseStudies.map((c, i) => (
            <div key={`s${i}`} className="px-4 py-3 text-sm">
              <p className="font-medium text-gray-900">{c.client}</p>
              {c.result && <p className="text-gray-700">{c.result}</p>}
            </div>
          ))}
          {testimonials.map((t, i) => (
            <div key={`t${i}`} className="px-4 py-3 text-sm">
              <p className="text-gray-800">“{t.quote}”</p>
              <p className="text-xs text-gray-500 mt-1">{t.name}{t.role ? `, ${t.role}` : ''}</p>
            </div>
          ))}
        </Collapsible>
        <Collapsible title="How working with you goes" count={process.length}>
          {process.map((s, i) => (
            <div key={i} className="px-4 py-2.5 text-sm"><span className="font-medium text-gray-900">{i + 1}. {s.title}</span>{s.detail && <span className="text-gray-600">: {s.detail}</span>}</div>
          ))}
        </Collapsible>
        <Collapsible title="FAQs" count={faqs.length}>
          {faqs.map((f, i) => (
            <div key={i} className="px-4 py-3 text-sm">
              <p className="font-medium text-gray-900">{f.question}</p>
              <p className="text-gray-700 mt-0.5">{f.answer}</p>
            </div>
          ))}
        </Collapsible>
      </div>

      {/* Check these */}
      {(checkLabels.length > 0 || removed.length > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          <p className="font-semibold flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" />Please check these in the wizard</p>
          {checkLabels.length > 0 && (
            <p className="mb-2">Genie inferred: {checkLabels.join(', ')}. They're marked for review.</p>
          )}
          {removed.length > 0 && (
            <>
              <p className="mb-1">Genie suggested these, but they weren't in your answers, so we removed them:</p>
              <ul className="list-disc ml-5 space-y-0.5">{removed.map(r => <li key={r.path}>{r.label}</li>)}</ul>
            </>
          )}
        </div>
      )}

      {/* Only you can add */}
      {youItems.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />Only you can add these
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {youItems.map(item => (
              <li key={item.label} className="flex items-center gap-2 text-xs text-red-800 bg-red-100 rounded-lg px-3 py-2">
                <span className="font-medium">{item.label}</span>
                <span className="ml-auto text-red-500 font-semibold whitespace-nowrap">Step {item.step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={onOpenWizard}
          className="inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-colors flex-1"
        >
          Continue in the setup wizard<ArrowRight className="w-4 h-4 ml-2" />
        </button>
        <button type="button" onClick={onEdit} className="inline-flex items-center justify-center px-6 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">
          Edit my answers
        </button>
        <button type="button" onClick={onStartOver} className="inline-flex items-center justify-center px-4 py-3.5 text-gray-500 hover:text-red-600 text-sm">
          Start over
        </button>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AIWebsiteBuilderPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
    if (!token) {
      router.replace('/login?redirect=/platform/ai-website-builder')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  const siteConfig = useSiteConfig()
  const feature = (siteConfig.features || []).find(f => f.title === 'AI Website Builder') || {}

  if (!authChecked) return null

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Content area — on desktop, left edge starts after the 240px fixed sidebar */}
      <div className="lg:pl-60 min-h-[calc(100vh-5rem)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Page header */}
          <div className="mb-8">
            <div className="inline-flex items-center px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-medium mb-4 text-primary-700">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {feature.status || 'Available'}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 leading-tight">
              {feature.title || 'AI Website Builder'}
            </h1>
            <p className="text-base text-gray-600 max-w-xl leading-relaxed">
              Answer a few questions about your business. Genie drafts your positioning, offers and pages, and you confirm the details before anything goes live.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Takes about 10 minutes. Keep your price list and LinkedIn link handy.
            </p>
          </div>

          <GenieIntakeWidget />

          <p className="text-center text-xs text-gray-400 mt-6 pb-8">
            Your answers are saved on this device as you type. Genie never invents prices, numbers or testimonials.
          </p>
        </div>
      </div>
    </div>
  )
}