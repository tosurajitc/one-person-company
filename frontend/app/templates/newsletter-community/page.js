'use client'

/**
 * Template 7 — Newsletter / Community Builder
 * Theme: Bold · Indigo #3730a3 + Mint #6ee7b7
 *
 * ─── DATA MAP — how this template reads from user_site_settings ───────────────
 *
 *  key: 'general'
 *    business_name          → nav logo, hero title, footer name
 *    tagline                → hero subheadline
 *    business_type          → hero eyebrow pill
 *    email                  → footer contact, subscribe form target
 *
 *  key: 'hero'
 *    headline               → hero H1
 *    subheadline            → hero paragraph
 *    badge_text             → eyebrow pill label
 *    cta_text               → primary subscribe button label
 *
 *  key: 'about'
 *    founder_name           → "From the founder" section
 *    founder_photo_url      → founder avatar (falls back to initials)
 *    story                  → founder bio copy
 *    credentials            → credential pills
 *
 *  key: 'offers'  (tiers stored as offers[])
 *    offers[0]              → Free tier card  (type: 'free')
 *    offers[1]              → Paid tier card  (type: 'paid')
 *    offers[2]              → Premium tier card (type: 'premium')
 *    Each offer: { title, description, price, includes[], cta_label }
 *
 *  key: 'proof'
 *    testimonials[]         → { name, role, quote, rating }
 *
 *  key: 'hero' (community-specific fields — extend if needed)
 *    member_count           → social proof counter
 *    issue_count            → "X issues published"
 *    open_rate              → email open rate stat
 *
 *  key: 'contact'
 *    booking_url            → "Join community" CTA href
 *    whatsapp_number        → WhatsApp community link
 *
 *  key: 'faq'
 *    items[]                → { question, answer }
 *
 * All SAMPLE values below are the placeholder content shown in this template.
 * When the user completes the Setup Wizard, their saved settings replace these.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import {
  ArrowRight, CheckCircle, Star, ChevronDown, Mail, Users,
  BookOpen, Zap, MessageCircle, Globe, Twitter, Linkedin,
  ChevronUp, Rss, Lock, Unlock, Send, TrendingUp, Heart,
  Coffee, BarChart2, Lightbulb
} from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  indigo:      '#3730a3',
  indigoDark:  '#1e1b4b',
  indigoMid:   '#4338ca',
  indigoLight: '#818cf8',
  indigoPale:  '#eef2ff',
  mint:        '#6ee7b7',
  mintDark:    '#059669',
  mintLight:   '#a7f3d0',
  mintPale:    '#ecfdf5',
  white:       '#ffffff',
  ink:         '#0f0e2e',
  text:        '#1e1b4b',
  muted:       '#6366f1',
  mutedGray:   '#64748b',
  border:      '#c7d2fe',
  bg:          '#f5f3ff',
  bgLight:     '#fafafa',
}

// ─── Sample data  (replace with user_site_settings values in production) ──────
const SAMPLE = {
  // key: 'general' + 'hero'
  brand: {
    name:        'The Indie Stack',
    tagline:     'The weekly read for indie founders building in public.',
    eyebrow:     'Newsletter + Community',
    headline:    'Think better. Build smarter. Ship faster.',
    subheadline: 'Every Tuesday, 4,200+ indie founders get one actionable insight on building a profitable one-person business — no fluff, no funnels, just signal.',
    cta:         'Get the free weekly issue',
    youtube:     null,
  },
  // key: 'hero' (community stats)
  stats: [
    { number: '4,200+', label: 'Active subscribers',  icon: Users },
    { number: '48%',    label: 'Avg open rate',        icon: TrendingUp },
    { number: '112',    label: 'Issues published',     icon: Rss },
    { number: '4.8★',   label: 'Member satisfaction',  icon: Heart },
  ],
  // key: 'about'
  founder: {
    name:        'Arjit Bose',
    title:       'Indie Founder · Writer · Builder',
    bio:         "I've been building side projects and writing about it since 2019. After hitting $10k MRR on my third product, I started sharing what actually worked — not the polished version, the real version. That turned into this newsletter, then a community of founders who think the same way.",
    credentials: ['$10k MRR in 14 months', '3 profitable products', '5 years building in public'],
    social:      { twitter: '#', linkedin: '#' },
    photo:       null,
  },
  // Curated content samples (past issues preview)
  pastIssues: [
    { no: '112', title: 'The "quiet launch" playbook that got me 800 users in a week',         tag: 'Growth',    emoji: '🚀' },
    { no: '111', title: 'Why your pricing page is killing conversions (and how to fix it)',     tag: 'Pricing',   emoji: '💸' },
    { no: '110', title: 'The one-person content machine: tools, systems, and weekly routine',  tag: 'Systems',   emoji: '⚙️' },
    { no: '109', title: 'Cold email scripts that actually get replies from busy founders',     tag: 'Outreach',  emoji: '📬' },
    { no: '108', title: 'Build in public: what to share, what to keep private',                tag: 'Strategy',  emoji: '🧭' },
    { no: '107', title: 'SaaS vs productised service: which one fits your life?',             tag: 'Models',    emoji: '🔀' },
  ],
  // key: 'offers' — free → paid → premium tier ladder
  tiers: [
    {
      type:        'free',
      name:        'Free Reader',
      price:       '₹0',
      billing:     'forever free',
      tagline:     'The weekly newsletter',
      description: 'Every Tuesday issue straight to your inbox. No credit card, no catch.',
      includes:    [
        'Weekly issue (every Tuesday)',
        'Issue archive access (last 12 issues)',
        'Free resource library',
        'Community Discord — read only',
      ],
      cta:         'Subscribe Free',
      highlight:   false,
      icon:        Rss,
    },
    {
      type:        'paid',
      name:        'Member',
      price:       '₹499',
      billing:     'per month',
      tagline:     'The full community',
      description: 'Everything free + access to the inner circle: live sessions, full archive, and peer accountability.',
      includes:    [
        'Everything in Free',
        'Full archive — all 112 issues',
        'Monthly live Q&A with Arjit',
        'Community Discord — full access',
        'Member directory + DMs',
        'Monthly resource drops',
        'Early access to new products',
      ],
      cta:         'Join as Member',
      highlight:   true,
      icon:        Users,
    },
    {
      type:        'premium',
      name:        'Founding Member',
      price:       '₹3,999',
      billing:     'per year',
      tagline:     'Lock in the founder rate',
      description: 'Annual membership at a locked-in rate. Never pay more, even as the community grows.',
      includes:    [
        'Everything in Member',
        'Locked annual rate (never increases)',
        'Founding member badge + directory listing',
        'Priority access to workshops',
        '1 group office-hours call per quarter',
      ],
      cta:         'Become a Founding Member',
      highlight:   false,
      icon:        Zap,
    },
  ],
  // key: 'proof' → testimonials[]
  testimonials: [
    {
      name:    'Shreya Kapoor',
      role:    'SaaS Founder, Bangalore',
      rating:  5,
      quote:   "I have read hundreds of newsletters. This is the only one where I actually implement something every single week. The issue on pricing alone added ₹40k MRR.",
      since:   'Member since Issue #48',
    },
    {
      name:    'Karan Mehta',
      role:    'Freelancer → Productised Studio',
      rating:  5,
      quote:   "The community Discord is where I made my first two B2B partnerships. Joining as a paid member was the best ₹499 I've spent on my business.",
      since:   'Member since Issue #71',
    },
    {
      name:    'Priya Iyer',
      role:    'Digital Product Creator',
      rating:  5,
      quote:   "Arjit writes the way a smart friend would explain things — no jargon, no hype, just what actually works at the stage you are at.",
      since:   'Free reader → Member in 2 weeks',
    },
  ],
  // key: 'faq' → items[]
  faqs: [
    { q: 'How often is the newsletter published?',           a: 'Every Tuesday at 8am IST. Occasionally there is a bonus issue for major events or launches, but the core cadence is weekly.' },
    { q: 'What is in the paid membership?',                  a: 'Full archive access, monthly live Q&A sessions, the community Discord with 900+ active members, and monthly resource drops (templates, swipe files, tools list).' },
    { q: 'Can I cancel anytime?',                            a: 'Yes — monthly membership can be cancelled any time. Annual membership includes a 30-day full refund window.' },
    { q: 'Is this for beginners or experienced founders?',   a: "Both. The newsletter covers everything from day-one decisions to scaling past ₹1 Cr. The community Discord has separate channels for each stage." },
    { q: 'Is there a free trial for the paid membership?',   a: "The free newsletter is effectively the trial. Most people join paid within 4–8 weeks of reading." },
  ],
  // key: 'contact'
  contact: {
    email:     'hello@theindiestack.in',
    twitter:   '#',
    linkedin:  '#',
    joinUrl:   '#join',
  },
}

// ─── payloadToData ────────────────────────────────────────────────────────────
function payloadToData(payload) {
  if (!payload) return SAMPLE
  const biz  = payload.business   || {}
  const pos  = payload.positioning || {}
  const prf  = payload.proof      || {}
  const fd   = payload.frontDoor  || {}
  const know = payload.knowledge  || {}
  const off  = payload.offers     || {}
  const ch   = payload.channels   || {}
  const owner = biz.owner || {}
  const o = (v, fb) => (v && String(v).trim() ? v : fb)
  const a = (v, fb) => (Array.isArray(v) && v.filter(Boolean).length ? v.filter(Boolean) : fb)
  const mappedTiers = (off.tiers || []).filter(t => t?.name).map((t, i) => {
    const pInr = t.prices?.INR ?? t.priceInr
    const pUsd = t.prices?.USD ?? t.priceUsd
    return {
      name:        t.name,
      price:       pInr ? `₹${Number(pInr).toLocaleString('en-IN')}` : (pUsd ? `$${pUsd}` : SAMPLE.tiers[i]?.price || ''),
      period:      t.tier === 'recurring' ? '/month' : '',
      description: t.summary || SAMPLE.tiers[i]?.description || '',
      perks:       typeof t.deliverables === 'string' ? t.deliverables.split('\n').filter(Boolean) : Array.isArray(t.deliverables) ? t.deliverables.filter(Boolean) : (SAMPLE.tiers[i]?.perks || []),
      cta:         SAMPLE.tiers[i]?.cta || 'Subscribe',
      highlight:   off.mostBought === t.tier,
    }
  })
  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer).map(f => ({ q: f.question, a: f.answer }))
  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote).map(t => ({ name: t.name || '', role: t.role || '', rating: 5, quote: t.quote }))
  const social = ch.social || {}
  const email = owner.email || SAMPLE.contact.email
  return {
    brand: {
      name:    o(biz.brandName, SAMPLE.brand.name),
      tagline: o(biz.tagline, SAMPLE.brand.tagline),
      desc:    o(pos.credibility, SAMPLE.brand.desc),
    },
    founder: {
      name:     o(owner.name, SAMPLE.founder.name),
      title:    o(owner.role, SAMPLE.founder.title),
      bio:      o(pos.credibility, SAMPLE.founder.bio),
      photo:    owner.photoUrl || null,
      social: {
        twitter:  social.x || SAMPLE.founder.social.twitter,
        linkedin: social.linkedin || SAMPLE.founder.social.linkedin,
      },
    },
    stats:        SAMPLE.stats,
    pastIssues:   SAMPLE.pastIssues,
    tiers:        mappedTiers.length ? mappedTiers : SAMPLE.tiers,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
    contact: {
      email:   email,
      twitter: social.x || SAMPLE.contact.twitter,
    },
  }
}

// ─── Reading progress bar ─────────────────────────────────────────────────────
function ProgressBar() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setPct(total > 0 ? (el.scrollTop / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1" style={{ background: T.indigoPale }}>
      <div className="h-full transition-all duration-100" style={{ width: `${pct}%`, background: T.mint }} />
    </div>
  )
}

// ─── Scroll to top ────────────────────────────────────────────────────────────
function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110"
      style={{ background: T.indigo }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 text-white" />
    </button>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  return (
    <nav
      className="fixed top-1 left-0 right-0 z-50 backdrop-blur-md border-b"
      style={{ background: 'rgba(245,243,255,0.97)', borderColor: T.border }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: T.indigo }}>
            <Rss className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-base" style={{ color: T.indigo }}>{D.brand.name}</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {[['#issues', 'Past Issues'], ['#membership', 'Membership'], ['#community', 'Community']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-opacity hover:opacity-60" style={{ color: T.mutedGray }}>
              {label}
            </a>
          ))}
        </div>
        <a
          href="#join"
          className="px-4 py-2 rounded-full font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: T.indigo }}
        >
          Subscribe Free
        </a>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)
  const D = useData()
  const b = D.brand

  return (
    <section
      className="relative pt-24 pb-0 overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${T.indigoDark} 0%, ${T.indigo} 55%, #4f46e5 100%)` }}
    >
      {/* Mint glow orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: T.mint }} />
      <div className="absolute bottom-0 left-0 w-96 h-48 rounded-full blur-3xl opacity-10" style={{ background: T.indigoLight }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-16">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold mb-8 uppercase tracking-widest"
          style={{ borderColor: 'rgba(110,231,183,0.3)', color: T.mintLight, background: 'rgba(110,231,183,0.08)' }}>
          <Rss className="w-3.5 h-3.5" /> {b.eyebrow}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.08] mb-6 max-w-4xl mx-auto">
          {b.headline}
        </h1>
        <p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {b.subheadline}
        </p>

        {/* Email subscribe inline form */}
        {joined ? (
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl mb-10" style={{ background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.3)' }}>
            <CheckCircle className="w-5 h-5" style={{ color: T.mint }} />
            <span className="font-semibold text-white">You're in! Check your inbox for the welcome issue.</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-10">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3.5 rounded-xl text-sm font-medium outline-none"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
            />
            <button
              onClick={() => email && setJoined(true)}
              className="px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 flex-shrink-0"
              style={{ background: T.mint, color: T.ink }}
            >
              {b.cta} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
        <p className="text-xs mb-14" style={{ color: 'rgba(255,255,255,0.4)' }}>
          No spam. Unsubscribe any time. Read by 4,200+ founders.
        </p>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {useData().stats.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="py-6 text-center" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <Icon className="w-4 h-4 mx-auto mb-2 opacity-50" style={{ color: T.mint }} />
                <div className="text-2xl font-black" style={{ color: T.mint }}>{s.number}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Past issues preview ──────────────────────────────────────────────────────
function IssuesSection() {
  return (
    <section id="issues" className="py-24" style={{ background: T.bgLight }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: '#e0e7ff' }}>01</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.indigo }}>What you will read</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Recent issues</h2>
            <p className="mt-2 text-base" style={{ color: T.mutedGray }}>
              A taste of what lands in your inbox every Tuesday. No paywalls on the archive — read before you decide.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {useData().pastIssues.map((issue, i) => (
            <a
              key={i}
              href="#"
              className="group rounded-2xl border p-5 flex flex-col gap-3 transition-all hover:border-indigo-400 hover:shadow-sm"
              style={{ background: T.white, borderColor: T.border }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: T.indigoPale, color: T.indigo }}>
                  #{issue.no} · {issue.tag}
                </span>
                <span className="text-lg">{issue.emoji}</span>
              </div>
              <p className="text-sm font-semibold leading-snug group-hover:text-indigo-700 transition-colors" style={{ color: T.text }}>
                {issue.title}
              </p>
              <span className="text-xs font-semibold mt-auto" style={{ color: T.indigo }}>
                Read this issue →
              </span>
            </a>
          ))}
        </div>

        <div className="text-center mt-8">
          <a href="#join" className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: T.indigo }}>
            Subscribe to get the next one in your inbox <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Founder section ──────────────────────────────────────────────────────────
function FounderSection() {
  const D = useData()
  const f = D.founder
  return (
    <section className="py-24" style={{ background: T.indigoDark }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.mint }}>From the founder</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-5 leading-tight">
              Why I started writing this
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {f.bio}
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {f.credentials.map((c, i) => (
                <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-full border" style={{ borderColor: 'rgba(110,231,183,0.2)', color: T.mintLight, background: 'rgba(110,231,183,0.06)' }}>
                  ✦ {c}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {[[Twitter, f.social.twitter], [Linkedin, f.social.linkedin]].map(([Icon, href], i) => (
                <a key={i} href={href} className="w-9 h-9 rounded-lg border flex items-center justify-center transition-all hover:border-indigo-400"
                  style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Right — avatar card */}
          <div className="flex justify-center">
            <div className="rounded-2xl p-8 border text-center max-w-xs w-full" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-black text-2xl border-2"
                style={{ borderColor: T.mint, background: 'rgba(110,231,183,0.08)', color: T.mint }}>
                {f.name.split(' ').map(n => n[0]).join('')}
              </div>
              <p className="font-black text-white text-lg mb-0.5">{f.name}</p>
              <p className="text-sm mb-5" style={{ color: T.indigoLight }}>{f.title}</p>
              <div className="space-y-2">
                {f.credentials.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: T.mint }} /> {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Membership tiers ─────────────────────────────────────────────────────────
function MembershipSection() {
  return (
    <section id="membership" className="py-24" style={{ background: T.bg }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: '#e0e7ff' }}>02</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.indigo }}>Membership</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Free to read. Better together.</h2>
            <p className="mt-2 text-base" style={{ color: T.mutedGray }}>
              Start free. Upgrade when you want the community, the archive, and the live sessions.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {useData().tiers.map((tier, i) => {
            const Icon = tier.icon
            return (
              <div
                key={i}
                className={`relative rounded-2xl border flex flex-col overflow-hidden ${tier.highlight ? 'ring-2' : ''}`}
                style={{
                  background: tier.highlight ? T.indigo : T.white,
                  borderColor: tier.highlight ? T.indigo : T.border,
                  ringColor: T.indigo,
                }}
              >
                {tier.highlight && <div className="h-1" style={{ background: T.mint }} />}
                <div className="p-7 flex flex-col flex-1">
                  {tier.highlight && (
                    <span className="inline-block text-xs font-bold mb-3 px-3 py-1 rounded-full self-start" style={{ background: T.mint, color: T.ink }}>
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: tier.highlight ? 'rgba(110,231,183,0.15)' : T.indigoPale }}>
                      <Icon className="w-5 h-5" style={{ color: tier.highlight ? T.mint : T.indigo }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tier.highlight ? T.indigoLight : T.mutedGray }}>{tier.type}</p>
                      <p className="font-black text-base" style={{ color: tier.highlight ? T.white : T.text }}>{tier.name}</p>
                    </div>
                  </div>
                  <p className="text-sm mb-4 italic" style={{ color: tier.highlight ? 'rgba(255,255,255,0.6)' : T.mutedGray }}>{tier.tagline}</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black" style={{ color: tier.highlight ? T.mint : T.indigo }}>{tier.price}</span>
                    <span className="text-sm" style={{ color: tier.highlight ? 'rgba(255,255,255,0.5)' : T.mutedGray }}>/ {tier.billing}</span>
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: tier.highlight ? 'rgba(255,255,255,0.65)' : T.mutedGray }}>{tier.description}</p>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {tier.includes.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm" style={{ color: tier.highlight ? 'rgba(255,255,255,0.85)' : T.text }}>
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tier.highlight ? T.mint : T.indigo }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#join"
                    className="mt-auto block text-center py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                    style={{
                      background: tier.highlight ? T.mint : T.indigoPale,
                      color: tier.highlight ? T.ink : T.indigo,
                      border: tier.highlight ? 'none' : `1px solid ${T.border}`,
                    }}
                  >
                    {tier.cta} <ArrowRight className="inline w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Community preview ────────────────────────────────────────────────────────
function CommunitySection() {
  const highlights = [
    { icon: MessageCircle, title: 'Weekly discussion threads',         desc: 'Every issue spawns a thread where members share what they implemented and what happened.' },
    { icon: Users,         title: 'Founder accountability groups',     desc: 'Small pods of 5–8 founders at the same stage, matched by Arjit every quarter.' },
    { icon: Lightbulb,     title: 'Monthly live Q&A',                  desc: 'First Tuesday of every month — 60 minutes open Q&A with Arjit. All recordings saved.' },
    { icon: BarChart2,     title: 'Revenue & growth check-ins',        desc: 'Monthly "show your numbers" threads — the most honest conversation in any founder community.' },
    { icon: Coffee,        title: 'Introductions & collaborations',    desc: 'Members have co-founded products, become clients, and referred each other to investors.' },
    { icon: TrendingUp,    title: 'Resource & tool drops',             desc: 'Monthly curated drops: vetted tools, templates, and frameworks used by members actively.' },
  ]

  return (
    <section id="community" className="py-24" style={{ background: T.white }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: '#e0e7ff' }}>03</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.indigo }}>Inside the community</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>What happens after you join</h2>
            <p className="mt-2 text-base" style={{ color: T.mutedGray }}>
              900+ paid members. Every week something useful happens here.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {highlights.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="rounded-2xl border p-6 group hover:border-indigo-400 transition-colors" style={{ background: T.bg, borderColor: T.border }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: T.indigoPale }}>
                <Icon className="w-5 h-5" style={{ color: T.indigo }} />
              </div>
              <h3 className="font-bold text-sm mb-2" style={{ color: T.text }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: T.mutedGray }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const [active, setActive] = useState(0)
  const t = useData().testimonials[active]
  return (
    <section className="py-24" style={{ background: T.indigoDark }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none opacity-5 text-white">04</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.mint }}>Member stories</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">What members say</h2>
          </div>
        </div>
        {/* Large blockquote */}
        <div className="relative pl-8 border-l-4 mb-8" style={{ borderColor: T.mint }}>
          <div className="text-6xl font-black absolute -top-3 -left-2 select-none" style={{ color: T.mint, opacity: 0.25 }}>"</div>
          <p className="text-xl md:text-2xl font-semibold text-white leading-snug mb-6">{t.quote}</p>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: T.indigo, color: T.mint }}>
                {t.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{t.role}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(110,231,183,0.1)', color: T.mint, border: '1px solid rgba(110,231,183,0.2)' }}>
              {t.since}
            </span>
          </div>
        </div>
        {/* Dot switcher */}
        <div className="flex items-center gap-3 pl-8">
          {useData().testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className="w-2.5 h-2.5 rounded-full transition-all" style={{ background: active === i ? T.mint : 'rgba(255,255,255,0.18)' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState(null)
  return (
    <section className="py-24" style={{ background: T.bgLight }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: '#e0e7ff' }}>05</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.indigo }}>FAQ</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Before you join</h2>
          </div>
        </div>
        <div className="space-y-3">
          {useData().faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.indigoPale : T.white }}
              >
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`} style={{ color: T.indigo }} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.mutedGray, background: T.indigoPale }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA — subscribe join ───────────────────────────────────────────────
function JoinSection() {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)
  return (
    <section id="join" className="py-24 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${T.indigoDark} 0%, ${T.indigo} 100%)` }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: T.mint }} />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.2)' }}>
          <Send className="w-6 h-6" style={{ color: T.mint }} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.mint }}>Join 4,200+ founders</p>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
          One email. Every Tuesday.<br />Worth your time.
        </h2>
        <p className="text-base mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Start with the free newsletter. Upgrade to membership when you want the community.
        </p>
        {joined ? (
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl mb-8" style={{ background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.3)' }}>
            <CheckCircle className="w-5 h-5" style={{ color: T.mint }} />
            <span className="font-semibold text-white">Welcome aboard! Issue #113 lands Tuesday.</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto mb-6">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3.5 rounded-xl text-sm font-medium outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
            />
            <button
              onClick={() => email && setJoined(true)}
              className="px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 flex-shrink-0"
              style={{ background: T.mint, color: T.ink }}
            >
              Subscribe Free
            </button>
          </div>
        )}
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>No spam · Unsubscribe anytime · GDPR compliant</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm mt-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <a href={`mailto:${useData().contact.email}`} className="hover:text-white transition-colors">{useData().contact.email}</a>
          <a href={useData().contact.twitter} className="hover:text-white transition-colors flex items-center gap-1"><Twitter className="w-4 h-4" /> Follow on Twitter</a>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function TemplateFooter() {
  const D = useData()
  return (
    <footer style={{ background: T.ink, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: T.indigo }}>
                <Rss className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white">{D.brand.name}</span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{D.brand.tagline}</p>
            <div className="flex items-center gap-2">
              {[[Twitter, D.founder.social.twitter], [Linkedin, D.founder.social.linkedin]].map(([Icon, href], i) => (
                <a key={i} href={href} className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:border-indigo-500"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.mint }}>Navigate</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {[['#issues','Past Issues'],['#membership','Membership'],['#community','Community'],['#join','Subscribe'],['#','Privacy Policy']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.mint }}>Contact</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <li><a href={`mailto:${D.contact.email}`} className="hover:text-white transition-colors">{D.contact.email}</a></li>
            </ul>
            <a href="#join"
              className="inline-flex items-center mt-5 px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:opacity-90"
              style={{ background: T.mint, color: T.ink }}>
              Subscribe Free
            </a>
          </div>
        </div>
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
          <span>© {new Date().getFullYear()} {D.brand.name}. All rights reserved.</span>
          <Link href="/templates" className="hover:text-white transition-colors">← Browse all templates on OPC Genie</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewsletterCommunityTemplate({ data }) {
  const d = payloadToData(data)
  return (
    <DataCtx.Provider value={d}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ProgressBar />
        <TemplateNav />
        <HeroSection />
        <IssuesSection />
        <FounderSection />
        <MembershipSection />
        <CommunitySection />
        <TestimonialsSection />
        <FAQSection />
        <JoinSection />
        <TemplateFooter />
        <ScrollToTop />
      </div>
    </DataCtx.Provider>
  )
}
