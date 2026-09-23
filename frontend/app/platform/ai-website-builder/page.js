'use client'

/**
 * AI Website Builder — Genie intake page
 * ------------------------------------------------------------------
 * Collects the answers Genie needs, sends them to /api/genie/intake, shows a
 * review of what Genie drafted, then saves the result DIRECTLY to the user's
 * profile via /api/genie/save-wizard — bypassing the 13-step setup wizard.
 *
 * The user is redirected to /setup-wizard after saving, where they can
 * edit any field. The /setup-wizard is never shown unless the user navigates
 * there manually.
 *
 * Programmatic defaults (social links, YouTube video, FAQs) are applied both
 * client-side (via applyProgrammaticDefaults from wizard-schema.js) and
 * server-side (in _apply_programmatic_defaults in genie_routes.py) so the
 * website is always complete even when the LLM leaves fields blank.
 *
 * API CONTRACT
 *   POST /api/genie/intake     — generate prefill from user answers
 *   POST /api/genie/save-wizard — save completed state directly (skips wizard)
 */

import { useState, useEffect, useCallback } from 'react'
import { useSiteConfig } from '../../../hooks/useSiteConfig'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ArrowRight, CheckCircle, Loader2, Wand2, AlertCircle, AlertTriangle,
  ChevronDown, ChevronUp, RotateCcw, HelpCircle, User, Menu, X,
} from 'lucide-react'
import { applyProgrammaticDefaults } from '../../../lib/wizard-schema'
import { TEMPLATE_CATALOGUE } from '../../setup-wizard/page'

const SCHEMA_VERSION = '2.0'
const ANSWERS_STORAGE_KEY = 'genie_intake_answers_v2'
const PREFILL_KEY = 'genie_prefill'
const CONFIRM_KEY = 'genie_needs_confirmation'

// ─────────────────────────────────────────────────────────────────────────────
// Questions (drawn from the book's positioning, pricing and proof chapters)
// ─────────────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  // ── Q1 ─────────────────────────────────────────────────────────────────────
  {
    key: 'whatAndWho',
    title: 'What do you do, and who do you do it for?',
    help: 'Pick every option that applies, then edit the text to make it specific to your niche.',
    placeholder: "I'm a chartered accountant in Kolkata. I help freelance designers and small agencies with GST filing and income tax returns.",
    required: true,
    minLength: 40,
    fills: 'Business type, who you help, tagline, SEO description',
    options: [
      { label: 'Consultant / Advisor', text: "I'm a consultant. I help [type of client] with [specific problem]." },
      { label: 'Coach / Trainer', text: "I'm a coach. I help [type of person] achieve [specific outcome] through [method]." },
      { label: 'Freelancer / Designer', text: "I'm a freelancer. I do [service] for [type of client] in [industry/niche]." },
      { label: 'Agency (solo)', text: "I run a solo agency. I help [type of business] with [service] to achieve [result]." },
      { label: 'CA / Finance Pro', text: "I'm a chartered accountant. I help [freelancers / startups / SMEs] with [GST, tax, compliance]." },
      { label: 'Tech / Developer', text: "I'm a developer. I build [type of product/solution] for [type of client]." },
      { label: 'Content / Marketing', text: "I do [content/SEO/social media] for [type of business] who want to [goal]." },
      { label: 'Health / Wellness', text: "I'm a [nutritionist / therapist / coach]. I help [type of person] with [specific issue]." },
    ],
  },
  // ── Q2 ─────────────────────────────────────────────────────────────────────
  {
    key: 'problem',
    title: 'What problem do clients come to you with, and what does it cost them if it stays unfixed?',
    help: 'Select the pains that match, then add the real cost — money lost, stress, missed deadlines.',
    placeholder: 'They miss GST deadlines, pay late fees and get surprise tax bills in March. Some have received notices from the department.',
    required: true,
    minLength: 40,
    rows: 5,
    elaborate: true,
    fills: 'The problem, their fears, "this is for you if…", FAQ topics',
    options: [
      { label: 'Missing deadlines', text: 'Clients miss important deadlines and pay avoidable late fees or penalties.' },
      { label: 'Losing money', text: 'They are losing money because they have no clear picture of costs, margins, or cash flow.' },
      { label: 'Too much stress', text: 'They are overwhelmed and stressed trying to handle this themselves without the right expertise.' },
      { label: 'Wasting time', text: 'They spend hours on tasks outside their core skill, wasting time that should go into growing the business.' },
      { label: 'No clear system', text: 'Everything is ad-hoc — there is no repeatable system, so quality and results are inconsistent.' },
      { label: 'Fear of compliance / legal risk', text: 'They worry about getting notices, fines, or legal trouble because they are not fully compliant.' },
      { label: 'Stuck / not growing', text: 'The business has hit a ceiling. They are busy but not growing, and cannot figure out why.' },
      { label: 'Wrong past provider', text: 'They have been let down by a cheaper or less experienced provider before and need someone reliable.' },
    ],
  },
  // ── Q3 ─────────────────────────────────────────────────────────────────────
  {
    key: 'result',
    title: 'What result do clients get after working with you, and how long does it take?',
    help: 'Describe the transformation — what is better, clearer, or gone. Pick the outcomes that apply.',
    placeholder: 'Clean books, every return filed on time, zero penalties. Most clients are fully sorted within 4 weeks of starting.',
    required: true,
    minLength: 30,
    fills: 'Outcome, time frame, headline, offer summaries',
    options: [
      { label: 'Saves money', text: 'Clients save money — either directly through lower costs or by avoiding penalties and waste.' },
      { label: 'Saves time', text: 'They get back hours every week that they were previously spending on this problem.' },
      { label: 'Peace of mind', text: 'They stop worrying about this area entirely because it is handled, monitored, and up to date.' },
      { label: 'Grows revenue', text: 'Their revenue or client base grows because they now have the right foundation or strategy in place.' },
      { label: 'Builds a system', text: 'They leave with a clear, repeatable system they can run themselves or hand off to a team.' },
      { label: 'Gets compliant', text: 'All filings, registrations, and legal requirements are completed, documented, and fully compliant.' },
      { label: 'Looks professional', text: 'Their brand, website, or materials look polished and credible to the clients they want to attract.' },
      { label: 'Achieves a milestone', text: 'They hit a specific goal — launch, raise, close a deal, pass an exam, or complete a transformation.' },
    ],
  },
  // ── Q4 ─────────────────────────────────────────────────────────────────────
  {
    key: 'beforeAfter',
    title: "Describe your client's situation before they hire you vs. one month after.",
    help: "You don't need a real client yet — describe the most likely scenario. This builds your homepage story.",
    placeholder: "Before: chasing invoices, anxious every March, no idea what tax is owed. After: books sorted, all returns filed, zero anxiety about compliance.",
    required: true,
    minLength: 40,
    rows: 6,
    elaborate: true,
    fills: 'Hero copy, homepage story, fear & outcome, frontDoor invitation',
    options: [
      { label: 'Chaos → Clarity', text: 'Before: chaotic, reactive, no system in place. After: clear process, everything tracked, full visibility.' },
      { label: 'Stressed → Confident', text: 'Before: stressed and second-guessing every decision. After: confident with a plan and professional support.' },
      { label: 'Losing money → Saving money', text: 'Before: spending too much or missing revenue. After: costs are under control and leakages fixed.' },
      { label: 'Non-compliant → Fully sorted', text: 'Before: overdue filings, missed deadlines, risk of notices. After: fully compliant, documents in order.' },
      { label: 'No brand → Professional', text: 'Before: no online presence or a poor one. After: a polished, credible brand that attracts ideal clients.' },
      { label: 'Stuck → Growing', text: 'Before: plateaued, unsure of the next step. After: growing with a clear strategy and action plan.' },
      { label: 'DIY & struggling', text: 'Before: doing it all themselves and getting poor results. After: expert handles it so they can focus on their work.' },
    ],
  },
  // ── Q5 ─────────────────────────────────────────────────────────────────────
  {
    key: 'offersAndPrices',
    title: 'What do you sell, what does the client walk away with, and what do you charge?',
    help: 'For each service, write what the client receives at the end — not just the task. Genie uses only the prices you write here.',
    placeholder: 'Free 30-min call — no deliverable.\nGST registration ₹3,000 — client gets GSTIN, registration certificate, first return filed.\nMonthly filing ₹2,500/month — all monthly returns filed, reminders sent, books reconciled.',
    required: true,
    minLength: 20,
    rows: 6,
    elaborate: true,
    fills: 'Tier 1, 2 and 3 offers, deliverables, prices, payment terms',
    options: [
      { label: 'Free intro call', text: 'Free 30-minute discovery call — client gets clarity on whether we are a fit and a next-step plan.' },
      { label: 'One-time project', text: '[Service name] — one-time project, client receives [deliverable], timeline [X weeks], price ₹[amount].' },
      { label: 'Monthly retainer', text: '[Service name] — monthly retainer, client gets [what is done each month], price ₹[amount]/month.' },
      { label: 'Starter package', text: 'Starter package — [what is included], ideal for [type of client], price ₹[amount].' },
      { label: 'Full-year package', text: 'Annual package — [everything included for the year], price ₹[amount], saves ₹[X] vs monthly.' },
      { label: 'Audit / review', text: 'Audit or review — client receives a written report with findings and action plan, price ₹[amount].' },
      { label: 'Workshop / training', text: '[Workshop name] — [duration], client walks away with [skill/output], price ₹[amount].' },
    ],
  },
  // ── Q6 ─────────────────────────────────────────────────────────────────────
  {
    key: 'whyYou',
    title: 'Why should someone choose you? Give the background, training, or proof that makes you the right person.',
    help: "New to this? Describe your education, past job, or the specific reason you're qualified — even without a long client list.",
    placeholder: 'CA for 9 years, ex-Deloitte, specialised in SME and freelancer accounts. Handled 140+ clients across design, tech and media sectors.',
    required: true,
    minLength: 30,
    rows: 5,
    elaborate: true,
    fills: 'Credibility, credentials, experience, results, About page',
    options: [
      { label: 'Years in this field', text: '[X] years of hands-on experience specialising in [niche].' },
      { label: 'Formal qualification', text: 'Qualified [degree / certification] from [institution].' },
      { label: 'Past employer / brand', text: 'Previously worked at [company name] as [role], handling [what].' },
      { label: 'Number of clients', text: 'Worked with [X]+ clients in [industry / niche].' },
      { label: 'Specific result I achieved', text: 'Helped a client [achieve specific result] — [number or outcome].' },
      { label: 'Deep niche focus', text: 'I specialise exclusively in [narrow niche], so my clients get focused, expert-level work.' },
      { label: 'Personal story', text: 'I started this because I faced [problem] myself and built the solution that I wished existed.' },
      { label: 'Award / recognition', text: 'Recognised by [publication / body] for [achievement].' },
    ],
  },
  // ── Q7 ─────────────────────────────────────────────────────────────────────
  {
    key: 'notFit',
    title: 'Who is NOT a good fit for you?',
    help: 'Be direct. This copy filters out bad-fit enquiries and makes good-fit clients feel they have found the right person.',
    placeholder: 'Not for large companies with an in-house finance team, or anyone looking for the cheapest possible filing with no questions asked.',
    required: true,
    minLength: 20,
    fills: '"Not for you if…" section, enquiry form filter questions',
    options: [
      { label: 'Price-sensitive only', text: 'People whose only criteria is the lowest price, with no concern for quality or reliability.' },
      { label: 'Large enterprises', text: 'Large companies or enterprises with existing in-house teams for this function.' },
      { label: 'Needs overnight results', text: 'Anyone expecting overnight results or a quick fix without proper process or collaboration.' },
      { label: 'Not ready to invest', text: 'Businesses that are not ready to invest time or budget into solving this problem properly.' },
      { label: 'Handles it in-house', text: 'People who prefer to manage this entirely in-house and just want a one-off answer.' },
      { label: 'Outside my niche', text: 'Clients outside [specific niche or sector] — I specialise narrowly and do not take general work.' },
      { label: 'No active business', text: 'People who have not yet started their business or are still at the idea stage.' },
    ],
  },
  // ── Q8 ─────────────────────────────────────────────────────────────────────
  {
    key: 'realFaqs',
    title: 'What are the 3 questions a new client almost always asks before saying yes?',
    help: 'Think about your last few conversations. What did they want to know before committing? This becomes your FAQ page.',
    placeholder: "How long will it take? Do I need GST registration? What if I'm already behind on filings? Can I see a sample report?",
    required: true,
    minLength: 30,
    rows: 5,
    elaborate: true,
    fills: 'FAQ page, enquiry form pre-questions, sales objection handling',
    options: [
      { label: 'How long does it take?', text: 'How long does the process take from start to finish?' },
      { label: 'What is included?', text: 'What exactly is included in the service, and what is not?' },
      { label: 'Do I need to share documents?', text: 'What documents or access do you need from me to get started?' },
      { label: 'Is this right for me?', text: 'I am not sure if I qualify or if this applies to my situation — can you check?' },
      { label: 'What happens if something goes wrong?', text: 'What if there is a mistake or the outcome is not what I expected?' },
      { label: 'Can I get a refund?', text: 'What is your refund or revision policy if I am not satisfied?' },
      { label: 'Why should I pay this price?', text: 'Why does this cost what it does — what am I paying for exactly?' },
      { label: 'How do we work together?', text: 'How does the process work — what do you handle and what do I need to do?' },
      { label: 'Do you work with my type of business?', text: 'Have you worked with someone in my situation or industry before?' },
    ],
  },
  // ── Q9 ─────────────────────────────────────────────────────────────────────
  {
    key: 'howFound',
    title: 'How do new clients find you, and how do they usually first contact you?',
    help: 'Pick every channel that applies. This determines the main call-to-action button and contact options on your site.',
    placeholder: 'Mostly referrals from past clients and LinkedIn posts. Most people message me on WhatsApp first before booking a call.',
    required: true,
    minLength: 20,
    fills: 'Main CTA button, contact channels, content plan, AI agent settings',
    options: [
      { label: 'Referrals / word of mouth', text: 'Mostly referrals from past clients and people in my network.' },
      { label: 'LinkedIn', text: 'LinkedIn posts, direct messages, and connections.' },
      { label: 'Instagram', text: 'Instagram posts, reels, or DMs.' },
      { label: 'Google search', text: 'Google search — people find my website or profile organically.' },
      { label: 'WhatsApp first contact', text: 'Most new clients message me on WhatsApp before anything else.' },
      { label: 'Calendly / booking link', text: 'People book a call directly via a Calendly or similar booking link.' },
      { label: 'Industry events', text: 'Industry events, conferences, or in-person networking.' },
      { label: 'Email outreach', text: 'Direct email — either inbound enquiries or my own outreach.' },
    ],
  },
  // ── Q10 ────────────────────────────────────────────────────────────────────
  {
    key: 'voiceAndTone',
    title: 'How do you communicate? Pick the style that sounds most like you.',
    help: 'Your website copy will match this tone. Click one or more that fit, then describe in your own words if you like.',
    placeholder: 'Direct and no-nonsense, but warm with clients once they are on a call. I avoid corporate jargon.',
    required: true,
    minLength: 10,
    fills: 'Brand tone, copy style across every page, AI agent personality',
    options: [
      { label: 'Direct & no-nonsense', text: 'Direct and no-nonsense. I get to the point and avoid fluff or corporate jargon.' },
      { label: 'Warm & personal', text: 'Warm and personal. I make clients feel heard and supported, not just processed.' },
      { label: 'Expert & authoritative', text: 'Expert and authoritative. I back everything with knowledge and clients trust my judgement.' },
      { label: 'Friendly & approachable', text: 'Friendly and approachable. I am easy to talk to and clients feel comfortable asking anything.' },
      { label: 'Calm & reassuring', text: 'Calm and reassuring. I work with clients who are stressed and I help them feel safe.' },
      { label: 'Sharp & results-driven', text: 'Sharp and results-driven. I focus on outcomes and ROI, not process.' },
      { label: 'Conversational & honest', text: 'Conversational and honest. I say what I think, explain my reasoning, and avoid sales-speak.' },
    ],
  },
]

const BUSINESS_TYPES = TEMPLATE_CATALOGUE.map(s => ({
  value: s.id,
  label: s.section,
  hint: s.templates
    .filter(t => t.status === 'live')
    .map(t => t.name)
    .join(', ') || s.section,
}))

const CATEGORY_DEFAULT_TEMPLATES = {
  'service-based': { section: 'service-based', slug: 'consultant-advisor' },
  'knowledge-content': { section: 'knowledge-content', slug: 'course-creator' },
  'local-trade': { section: 'local-trade', slug: 'local-service-pro' },
  'product-commerce': { section: 'product-commerce', slug: 'digital-product-seller' },
  'hybrid-platform': { section: 'hybrid-platform', slug: 'community-led' },
}

const createEmptyIntake = () => ({
  basics: { ownerName: '', brandName: '', email: '', whatsapp: '', city: '', country: 'India', photoUrl: '', bookingUrl: '' },
  start: { businessType: 'service-based', market: 'india', language: 'en' },
  template: { sectionId: 'service-based', slug: 'consultant-advisor' },
  answers: Object.fromEntries(QUESTIONS.map(q => [q.key, ''])),
  links: { facebook: '', youtube: '', instagram: '', linkedin: '', pinterest: '' },
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

      {/* ── Desktop: sticky inline sidebar | Mobile: slide-up sheet ── */}
      <aside
        className={[
          'bg-white z-40 transition-transform duration-300',
          /* desktop — sticky inline column */
          'lg:static lg:translate-y-0 lg:translate-x-0 lg:rounded-xl lg:border lg:border-gray-200 lg:shadow-sm lg:overflow-hidden lg:flex lg:flex-col',
          /* mobile — slide-up sheet */
          'fixed bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl px-4 pt-3 pb-6',
          mobileOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0',
        ].join(' ')}
      >
        {/* drag handle (mobile only) */}
        <div className="lg:hidden flex justify-center mb-3">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <span className="text-sm font-semibold text-gray-800">Your intake</span>
          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            {answeredKeys.size}/{QUESTIONS.length}
          </span>
        </div>
        <p className="lg:hidden text-xs font-semibold text-gray-700 mb-3">Jump to a section</p>

        {/* scrollable nav list */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
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
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-sm',
                  isActive
                    ? 'bg-primary-600 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                ].join(' ')}
              >
                {/* number / status dot */}
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? 'bg-white/20 text-white' : dot}`}>
                  {answered ? '✓' : sec.short ?? '●'}
                </span>
                {/* label */}
                <span className="leading-snug truncate flex-1 text-xs">{sec.label}</span>
                {/* required pill */}
                {sec.required && !answered && (
                  <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'text-red-500 bg-red-50'}`}>req</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* footer hint */}
        <div className="px-4 py-3 border-t border-gray-100 shrink-0">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Answer all required questions, then click <strong className="text-gray-700">Draft my website</strong>.
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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { prefill, needsConfirmation, removed, followUps, saved }
  const [quotaInfo, setQuotaInfo] = useState(null)
  const [paying, setPaying] = useState(false)
  const [activeSection, setActiveSection] = useState('section-basics')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // Per-question AI-refine state: { [questionKey]: 'idle' | 'loading' | 'done' }
  const [refineState, setRefineState] = useState({})
  // Snapshot of the text before AI refinement so the user can undo: { [questionKey]: string }
  const [undoSnapshot, setUndoSnapshot] = useState({})

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

  // ── AI answer refinement ─────────────────────────────────────────────────
  // Calls the dedicated /api/genie/refine-answer endpoint (not /api/chat).
  // No quota, no history, no RAG — pure single-shot text improvement.
  // Token usage is tracked server-side on the user's profile.
  const handleRefineWithAI = async (q) => {
    const current = (intake.answers?.[q.key] || '').trim()
    if (!current) return
    // Save snapshot before overwriting so the user can undo
    setUndoSnapshot(s => ({ ...s, [q.key]: current }))
    setRefineState(s => ({ ...s, [q.key]: 'loading' }))
    try {
      const token = (typeof window !== 'undefined' && (localStorage.getItem('auth_token') || localStorage.getItem('token'))) || ''
      const res = await fetch('/api/genie/refine-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question_title: q.title,
          fills: q.fills,
          answer: current,
          business_context: [
            intake.start?.businessType,
            intake.start?.market,
            intake.answers?.whatAndWho,
          ].filter(Boolean).join('. '),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.refined) throw new Error(data.detail || 'AI could not improve this answer right now.')
      update(`answers.${q.key}`, data.refined)
      setRefineState(s => ({ ...s, [q.key]: 'done' }))
    } catch (err) {
      // Roll back the snapshot on failure — don't leave stale undo state
      setUndoSnapshot(s => { const n = { ...s }; delete n[q.key]; return n })
      setRefineState(s => ({ ...s, [q.key]: 'idle' }))
      alert(`Could not improve answer: ${err.message}`)
    }
  }

  const handleUndoRefine = (qKey) => {
    const original = undoSnapshot[qKey]
    if (!original) return
    update(`answers.${qKey}`, original)
    setUndoSnapshot(s => { const n = { ...s }; delete n[qKey]; return n })
    setRefineState(s => ({ ...s, [qKey]: 'idle' }))
  }

  const requiredQs = QUESTIONS.filter(q => q.required)
  const answeredCount = QUESTIONS.filter(q => (intake.answers?.[q.key] || '').trim()).length
  const answeredKeys = new Set(QUESTIONS.filter(q => {
    const v = (intake.answers?.[q.key] || '').trim()
    return v && (!q.minLength || v.length >= q.minLength)
  }).map(q => q.key))
  // Missing = blank OR below minLength threshold
  const missingRequired = requiredQs.filter(q => {
    const v = (intake.answers?.[q.key] || '').trim()
    return !v || (q.minLength && v.length < q.minLength)
  })
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
          template: intake.template || {},
          template_data: {},
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
        template: intake.template || { sectionId: intake.start.businessType, slug: CATEGORY_DEFAULT_TEMPLATES[intake.start.businessType]?.slug || 'consultant-advisor' },
        identity: Object.fromEntries(Object.entries(intake.basics).filter(([, v]) => typeof v === 'string' && v.trim())),
        frontDoor: intake.basics.bookingUrl ? { bookingUrl: intake.basics.bookingUrl.trim() } : {},
        channels: {
          social: Object.fromEntries([
            ['linkedin', intake.links.linkedin],
            ['instagram', intake.links.instagram],
          ].filter(([, v]) => v.trim())),
        },
      }
      const merged = deepMerge(raw, userOwned)
      const honest = enforceHonesty(merged, intake, Array.isArray(data.needsConfirmation) ? data.needsConfirmation : [])

      // Apply programmatic defaults: social links, YouTube video, FAQs, process,
      // CTA label, invitation, refund policy. These never overwrite non-blank values.
      const withDefaults = applyProgrammaticDefaults(honest.prefill, intake)

      setResult({
        prefill: withDefaults,
        needsConfirmation: honest.needsConfirmation,
        removed: honest.removed,
        followUps: Array.isArray(data.followUps) ? data.followUps.filter(Boolean) : [],
        saved: !!data.saved,
        intake,   // keep intake so save-wizard can send basics + start + userSocialLinks
      })
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Save the Genie-generated state directly to the user's profile and redirect
   * to /setup-wizard. The user never visits the 13-step setup wizard.
   */
  const handleSaveAndGoToDashboard = async () => {
    if (!result) return
    setSaving(true)
    setError(null)
    try {
      const token = (typeof window !== 'undefined' && (localStorage.getItem('auth_token') || localStorage.getItem('token'))) || ''
      if (!token) {
        // Not logged in — fall back to wizard flow (keeps backward compat)
        try {
          sessionStorage.setItem(PREFILL_KEY, JSON.stringify(result.prefill))
          sessionStorage.setItem(CONFIRM_KEY, JSON.stringify(result.needsConfirmation))
        } catch (_) { /* ignore */ }
        router.push('/setup-wizard')
        return
      }

      const srcIntake = result.intake || intake
      const userSocialLinks = {}
      const SOCIAL_KEYS = ['facebook', 'youtube', 'instagram', 'linkedin', 'pinterest']
      for (const key of SOCIAL_KEYS) {
        if ((srcIntake.links?.[key] || '').trim()) userSocialLinks[key] = srcIntake.links[key].trim()
      }

      const res = await fetch('/api/genie/save-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          prefill: result.prefill,
          basics: srcIntake.basics || {},
          start: srcIntake.start || {},
          template: srcIntake.template || result.prefill.template || {},
          template_data: result.prefill.template_data || {},
          userSocialLinks,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : 'Could not save your website data. Please try again.')
      }

      // Clear local draft — data is now in the DB
      try { localStorage.removeItem(ANSWERS_STORAGE_KEY) } catch (_) { /* ignore */ }
      router.push('/setup-wizard')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
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

  const handleUseSavedDraft = async () => {
    if (!quotaInfo?.saved_draft) return
    const token = (typeof window !== 'undefined' && (localStorage.getItem('auth_token') || localStorage.getItem('token'))) || ''
    if (!token) {
      // Not logged in — fall back to wizard
      try {
        sessionStorage.setItem(PREFILL_KEY, JSON.stringify(quotaInfo.saved_draft))
        sessionStorage.setItem(CONFIRM_KEY, JSON.stringify([]))
      } catch (_) {}
      router.push('/setup-wizard')
      return
    }
    // Saved draft already went through save-wizard on its original generation,
    // so just navigate to the edit page directly.
    router.push('/setup-wizard')
  }

  if (result) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">
        <ReviewPanel
          result={result}
          onSaveAndContinue={handleSaveAndGoToDashboard}
          saving={saving}
          onEdit={() => setResult(null)}
          onStartOver={handleStartOver}
        />
      </div>
    )
  }

  return (
    <div className="lg:grid lg:grid-cols-12 gap-8">
      {/* ── Sticky sidebar (desktop) ── */}
      <div className="hidden lg:block lg:col-span-3 self-start sticky top-24">
        <div>
          <SideNav
            activeId={activeSection}
            onNavigate={scrollToSection}
            mobileOpen={mobileNavOpen}
            onMobileToggle={() => setMobileNavOpen(o => !o)}
            answeredKeys={answeredKeys}
          />
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="lg:col-span-9">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">
      {/* Mobile FAB is rendered inside SideNav */}
      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Quota Banner */}
        {quotaInfo?.has_saved_draft && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-blue-950">You have a saved AI website draft.</p>
              <p className="text-xs text-blue-800 mt-0.5">
                Your website is ready to edit. Generating a brand-new AI draft costs ₹99.
              </p>
            </div>
            <button
              type="button"
              onClick={handleUseSavedDraft}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm"
            >
              Go to my website &rarr;
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
            <input className={inputCls} aria-label="Your name" placeholder="Your name *" value={intake.basics.ownerName} onChange={e => update('basics.ownerName', e.target.value)} />
            <input className={inputCls} aria-label="Business name" placeholder="Business name (if you have one)" value={intake.basics.brandName} onChange={e => update('basics.brandName', e.target.value)} />
            <input className={inputCls} aria-label="Business email" type="email" placeholder="Business email *" value={intake.basics.email} onChange={e => update('basics.email', e.target.value)} />
            <input className={inputCls} aria-label="WhatsApp number" placeholder="WhatsApp / Phone number" value={intake.basics.whatsapp} onChange={e => update('basics.whatsapp', e.target.value)} />
            <input className={inputCls} aria-label="City" placeholder="City (e.g. Mumbai, Bangalore, London)" value={intake.basics.city} onChange={e => update('basics.city', e.target.value)} />
            <input className={inputCls} aria-label="Country" placeholder="Country (e.g. India, United States)" value={intake.basics.country} onChange={e => update('basics.country', e.target.value)} />

          </div>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">1. Select your business model category</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" role="radiogroup">
                {BUSINESS_TYPES.map(b => {
                  const active = intake.start.businessType === b.value
                  return (
                    <button
                      key={b.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        update('start.businessType', b.value)
                        const defaultTpl = CATEGORY_DEFAULT_TEMPLATES[b.value] || { section: b.value, slug: 'consultant-advisor' }
                        update('template.sectionId', defaultTpl.section)
                        update('template.slug', defaultTpl.slug)
                      }}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        active ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className={`block font-medium ${active ? 'text-primary-800' : 'text-gray-900'}`}>{b.label}</span>
                      {b.hint && <span className="block text-xs text-gray-500 mt-0.5">{b.hint}</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Template Selector based on category */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">2. Choose the design template for your website</p>
              {(() => {
                const currentSection = TEMPLATE_CATALOGUE.find(s => s.id === (intake.template?.sectionId || intake.start.businessType)) || TEMPLATE_CATALOGUE[0]
                const templates = currentSection.templates || []
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {templates.map(t => {
                      const isSelected = (intake.template?.slug || 'consultant-advisor') === t.slug
                      return (
                        <button
                          key={t.slug}
                          type="button"
                          onClick={() => {
                            update('template.sectionId', currentSection.id)
                            update('template.slug', t.slug)
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50/70 ring-2 ring-primary-500 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full border border-white shadow-xs shrink-0"
                            style={{ backgroundColor: t.accent || '#1e3a5f' }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold truncate ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                              {t.name}
                            </p>
                            <span className="text-[10px] text-gray-500 capitalize">{t.status === 'live' ? 'Live template' : 'Preview'}</span>
                          </div>
                          {isSelected && <CheckCircle className="w-4 h-4 text-primary-600 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
          </div>
        </fieldset>

        {/* Questions */}
        <ol className="space-y-4">
          {QUESTIONS.map((q, i) => {
            const value = intake.answers?.[q.key] || ''
            const trimmed = value.trim()
            // A chip is "active" if its sentence text is already present in the textarea
            const isChipActive = (optText) => trimmed.includes(optText.trim())
            const tooShort = trimmed && q.minLength && trimmed.length < q.minLength
            // For required fields: not answered at all, OR typed but still below minLength
            const incomplete = q.required && (!trimmed || tooShort)
            const answered = trimmed.length > 0 && !tooShort
            return (
              <li
                key={q.key}
                id={`section-q-${q.key}`}
                className={`bg-white rounded-2xl border p-5 space-y-3 scroll-mt-28 transition-shadow ${
                  answered ? 'border-green-200 shadow-sm' : incomplete && trimmed ? 'border-amber-300' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Question header */}
                <label htmlFor={`q-${q.key}`} className="block cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5 transition-colors ${
                      answered ? 'bg-green-500' : 'bg-primary-600'
                    }`}>
                      {answered ? '✓' : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {q.title}
                        <span className="ml-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full align-middle">required</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{q.help}</p>
                    </div>
                    {answered && <span className="shrink-0 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">Done</span>}
                  </div>
                </label>

                {/* ── Option chips ── click to toggle sentence into textarea ── */}
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      Select what applies — edit the text below to personalise it:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt, oIdx) => {
                        const active = isChipActive(opt.text)
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => {
                              const current = (intake.answers?.[q.key] || '').trim()
                              let next
                              if (active) {
                                // Remove this sentence from the textarea
                                next = current.replace(opt.text.trim(), '').replace(/\s{2,}/g, ' ').trim()
                              } else {
                                // Append with a space separator
                                next = current ? `${current} ${opt.text}` : opt.text
                              }
                              update(`answers.${q.key}`, next)
                            }}
                            className={`text-xs rounded-lg px-3 py-1.5 border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                              active
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50'
                            }`}
                          >
                            {active ? '✓ ' : '+ '}{opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── Free-text textarea ── always shown, editable ── */}
                <textarea
                  id={`q-${q.key}`}
                  rows={q.rows || 3}
                  value={value}
                  onChange={e => update(`answers.${q.key}`, e.target.value)}
                  placeholder={q.placeholder}
                  className={`${inputCls} resize-y ${incomplete && trimmed ? 'border-amber-300 focus:ring-amber-400' : ''}`}
                />

                {/* ── AI refine button + undo — shown for elaborate questions once user has typed ── */}
                {q.elaborate && trimmed.length >= 20 && (() => {
                  const rs = refineState[q.key] || 'idle'
                  const canUndo = !!undoSnapshot[q.key]
                  return (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleRefineWithAI(q)}
                        disabled={rs === 'loading'}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                          rs === 'done'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : rs === 'loading'
                            ? 'bg-violet-50 text-violet-400 border-violet-200 cursor-not-allowed'
                            : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 hover:border-violet-300'
                        }`}
                      >
                        {rs === 'loading' ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Improving with AI…</>
                        ) : rs === 'done' ? (
                          <><Sparkles className="w-3.5 h-3.5" />AI improved — improve again?</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" />Improve this answer with AI</>
                        )}
                      </button>
                      {canUndo && (
                        <button
                          type="button"
                          onClick={() => handleUndoRefine(q.key)}
                          className="text-[11px] text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
                        >
                          ↩ Undo AI change
                        </button>
                      )}
                    </div>
                  )
                })()}

                {/* ── Footer: fills label + validation message ── */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t border-gray-100">
                  <span className="text-gray-400 flex items-center gap-1">
                    <span className="text-gray-300">→</span> Fills: {q.fills}
                  </span>
                  {tooShort && (
                    <span className="text-amber-600 font-semibold">
                      Add a bit more detail — this fills {q.fills.split(',')[0].toLowerCase()}
                    </span>
                  )}
                  {!trimmed && (
                    <span className="text-red-500 font-semibold">Required — select options above or type your answer</span>
                  )}
                </div>
              </li>
            )
          })}

          {/* Social media links */}
          <li id="section-extras" className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 scroll-mt-28">
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">{QUESTIONS.length + 1}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Your social media profiles <span className="ml-1 text-xs font-normal text-gray-400">optional</span></p>
                <p className="text-xs text-gray-500 mt-0.5">These appear in your website footer and help Genie set the right contact channels.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'facebook',  placeholder: 'https://facebook.com/yourpage',    icon: 'f', label: 'Facebook',  color: '#1877F2' },
                { key: 'youtube',   placeholder: 'https://youtube.com/@yourchannel', icon: '▶', label: 'YouTube',   color: '#FF0000' },
                { key: 'instagram', placeholder: 'https://instagram.com/yourhandle', icon: '◈', label: 'Instagram', color: '#E1306C' },
                { key: 'linkedin',  placeholder: 'https://linkedin.com/in/yourname', icon: 'in', label: 'LinkedIn',  color: '#0A66C2' },
                { key: 'pinterest', placeholder: 'https://pinterest.com/yourname',   icon: 'P', label: 'Pinterest', color: '#E60023' },
              ].map(({ key, placeholder, icon, label, color }) => (
                <div key={key} className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-white text-[11px] font-black select-none pointer-events-none"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  >{icon}</span>
                  <input
                    type="url"
                    aria-label={label}
                    placeholder={placeholder}
                    value={intake.links?.[key] || ''}
                    onChange={e => update(`links.${key}`, e.target.value)}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              ))}
            </div>
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
                    Go to my website (Free)
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
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Review panel — what Genie drafted, what to check, what only the user can add
// ─────────────────────────────────────────────────────────────────────────────
function ReviewPanel({ result, onSaveAndContinue, saving, onEdit, onStartOver }) {
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
          <p className="font-semibold text-green-900">Genie drafted your website. Review it below, then click <strong>Save &amp; go to my website</strong>.</p>
          <p className="text-xs text-green-800 mt-0.5">
            {saved ? 'Draft saved to your account. You can edit every field from your dashboard.' : <>Draft kept on this device only. <a href="/login" className="underline">Log in</a> to save it to your account.</>}
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
          onClick={onSaveAndContinue}
          disabled={saving}
          className="inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors flex-1"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving your website…</>
            : <>Save &amp; go to my website<ArrowRight className="w-4 h-4 ml-2" /></>}
        </button>
        <button type="button" onClick={onEdit} disabled={saving} className="inline-flex items-center justify-center px-6 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 disabled:opacity-50">
          Edit my answers
        </button>
        <button type="button" onClick={onStartOver} disabled={saving} className="inline-flex items-center justify-center px-4 py-3.5 text-gray-500 hover:text-red-600 text-sm disabled:opacity-50">
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Top banner */}
      <div className="bg-blue-600 text-white text-center py-3 px-4 text-sm font-medium">
        Answer a few questions about your business. Our AI drafts your positioning, offers and pages.
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-medium mb-3 text-primary-700">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {feature.status || 'Available'}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 leading-tight">
            {feature.title || 'AI Website Builder'}
          </h1>
          <p className="text-sm text-gray-600 max-w-xl leading-relaxed">
            Takes about 10 minutes. Keep your price list and LinkedIn link handy.
          </p>
        </div>

        <GenieIntakeWidget />
        <p className="text-center text-xs text-gray-400 mt-4 pb-8">
          Your answers are saved on this device as you type. Genie never invents prices, numbers or testimonials.
        </p>
      </div>
    </div>
  )
}