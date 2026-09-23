'use client'

/**
 * Template 1 — Consultant / Advisor (REWORK)
 * Section: Service-Based Solopreneurs
 * Theme: Ink #14171d + Signal Red #b3261e, on warm paper #f7f4ec
 *
 * DESIGN CONCEPT: "The Growth Memo"
 * ─────────────────────────────────────────────────────────────────────────────
 * A strategy advisor's actual work product is a memo and a deck — so the
 * page reads like one, instead of a generic SaaS landing page:
 *
 *  • Section numbers (§1, §2...) in the margin replace repeated all-caps
 *    eyebrow pills — a structural device, not decoration
 *  • The hero's visual anchor is a hand-drawn growth-trajectory chart, not
 *    an avatar + stat-grid + gradient wash
 *  • A single red "signal" accent stands in for a highlighter / redline pen
 *    — used sparingly, not spread across gold-bordered cards
 *  • Engagement options read as a ledger, not three identical pricing cards
 *  • Case studies are "Exhibits," stacked and alternating, not a card grid
 *  • Testimonials sit as quoted testimony inline, not boxed with star-rating
 *    cards
 *  • CTA copy is plain and confident; the arrow icon is used exactly once,
 *    as a signature move, not appended to every button
 *
 * Data layer (payloadToData / SAMPLE) is UNCHANGED from the original — this
 * is a visual rework only, so it stays a drop-in replacement for the wizard.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import {
  Calendar, CheckCircle, XCircle, Star, ChevronDown, Phone, Mail, ArrowRight,
  Play, TrendingUp, Users, Target, FileText, PenTool, Quote,
} from 'lucide-react'
import { useState, createContext, useContext } from 'react'

// ─── Data context — sections read live data when provided, SAMPLE otherwise ──
const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Theme tokens ────────────────────────────────────────────────────────────
const T = {
  ink:      '#14171d',
  inkSoft:  '#20252c',
  red:      '#b3261e',
  redDeep:  '#7a1a15',
  redLight: '#e8998f',
  paper:    '#f7f4ec',
  paperDeep:'#efe9db',
  white:    '#fffdf9',
  border:   '#ddd6c2',
  text:     '#1b1a16',
  muted:    '#6b6558',
}
const SERIF = "'Charter', 'Iowan Old Style', Georgia, 'Times New Roman', serif"
const SANS  = "'Inter', system-ui, sans-serif"

// ─── Sample data ─────────────────────────────────────────────────────────────
const SAMPLE = {
  founder: {
    name:        'Arjun Mehta',
    photo:       null,                  // placeholder initials used when null
    title:       'Business Strategy Consultant',
    credentials: ['MBA, IIM Ahmedabad', 'Ex-McKinsey', '18 Years Experience'],
    tagline:     'I help mid-market founders scale past ₹10 Cr — without hiring a C-suite.',
    bio:         'After a decade advising Fortune 500s, I chose to work exclusively with ambitious Indian founders who are ready to professionalise and grow. My clients have collectively raised ₹120 Cr in funding and doubled revenue within 18 months of engagement.',
    location:    'Mumbai · Bangalore · Remote',
    phone:       '+91 98200 00000',
    email:       'arjun@mehta-advisory.in',
    calLink:     '#book',
  },
  stats: [
    { number: '48+', label: 'Founders Advised' },
    { number: '₹120 Cr', label: 'Capital Raised by Clients' },
    { number: '2×', label: 'Avg Revenue Growth' },
    { number: '18 Yrs', label: 'Industry Experience' },
  ],
  forWho: [
    { icon: TrendingUp, title: 'Scaling Founders',    desc: 'Revenue between ₹2–15 Cr and ready for the next inflection point.' },
    { icon: Users,      title: 'Family Business Heirs', desc: 'Second-generation owners modernising legacy operations.' },
    { icon: Target,     title: 'Pivot-Stage Startups', desc: 'Funded teams re-finding product-market fit before Series A.' },
  ],
  process: [
    { step: '01', title: 'Discovery Sprint',   desc: 'A focused 3-hour deep-dive into your P&L, team structure, and growth blockers. You leave with a prioritised bottleneck map.' },
    { step: '02', title: 'Strategy Blueprint', desc: 'I build a 90-day playbook covering positioning, pricing, operations, and the one metric that matters most for your stage.' },
    { step: '03', title: 'Execution Partnership', desc: 'Weekly 1-on-1s, async Loom reviews, and direct intros to investors and operators in my network.' },
  ],
  offers: [
    {
      name:        'Clarity Call',
      price:       '₹5,000',
      duration:    '60 min',
      type:        'One-time',
      description: 'A single, structured session to diagnose one critical business challenge. You get a clear action plan before we hang up.',
      includes:    ['Pre-call questionnaire', 'Live strategy session', 'Written summary + next steps'],
      cta:         'Book a Call',
      highlight:   false,
    },
    {
      name:        'Strategy Sprint',
      price:       '₹75,000',
      duration:    '2 Weeks',
      type:        'Project',
      description: 'For founders who need a decisive roadmap. Two weeks of intensive work: diagnostics, benchmarking, and a full written strategy deck.',
      includes:    ['Business audit', '3 working sessions', 'Growth roadmap deck', 'Competitor analysis', '30-day follow-up call'],
      cta:         'Start a Sprint',
      highlight:   true,
    },
    {
      name:        'Advisory Retainer',
      price:       '₹60,000',
      duration:    'per month',
      type:        'Ongoing',
      description: 'Your on-call strategic partner. Monthly sprints, weekly check-ins, and unlimited async questions — I\'m in your corner every step.',
      includes:    ['Weekly 45-min 1-on-1', 'Unlimited async Loom', 'Board / investor deck reviews', 'Warm intros to network', 'Priority response < 4 hrs'],
      cta:         'Apply for Retainer',
      highlight:   false,
    },
  ],
  caseStudies: [
    {
      client:  'D2C Skincare Brand',
      result:  'Revenue 2.1× in 9 months',
      detail:  'Repositioned from mass-market to premium segment, rebuilt pricing architecture, and helped close a ₹3 Cr seed round.',
      sector:  'Consumer / D2C',
    },
    {
      client:  'Logistics SaaS',
      result:  'Churn cut by 40%',
      detail:  'Identified misalignment between product tiers and customer segments. Redesigned onboarding and introduced a success check-in programme.',
      sector:  'B2B SaaS',
    },
    {
      client:  'Family-Owned FMCG',
      result:  'Entered 3 new states in 6 months',
      detail:  'Mapped distribution gaps, negotiated key channel partnerships, and built a 5-person field sales team from scratch.',
      sector:  'FMCG / Distribution',
    },
  ],
  testimonials: [
    { name: 'Priya Sharma', role: 'Founder, NourishRoots', rating: 5, quote: 'Arjun helped me see my business the way an investor would — and we closed our round in 8 weeks.' },
    { name: 'Vikram Nair',  role: 'CEO, LogiLink',        rating: 5, quote: 'The clarity I got in the first session was more than I\'d gained from two years of reading strategy books.' },
    { name: 'Sunita Patel', role: 'MD, Patel Spices Ltd', rating: 5, quote: 'He knows the Indian market inside-out. Practical, direct, and always available when it matters.' },
  ],
  faqs: [
    { q: 'Do you work with early-stage startups?',           a: 'My sweet spot is ₹2–15 Cr revenue. For pre-revenue startups, I recommend the Clarity Call first to assess fit.' },
    { q: 'How are retainer sessions delivered?',             a: 'All sessions are on Google Meet. I work with founders across India and internationally — timezone is never a barrier.' },
    { q: 'Can I start with a sprint and move to retainer?',  a: 'Absolutely. Most retainer clients start with a Sprint. It lets us both assess fit before a longer commitment.' },
    { q: 'Do you sign NDAs?',                                a: 'Yes, always. A mutual NDA is standard before any work begins.' },
    { q: 'What industries do you specialise in?',            a: 'D2C, B2B SaaS, FMCG, family-owned businesses, and professional services. I\'ve worked across 14 sectors in total.' },
  ],
  scope: {
    included: [
      'Direct strategic advisory and 1-on-1 sparring sessions with founders',
      'Written growth roadmaps, pricing models, and strategy decks',
      'Async Loom / email reviews between scheduled meetings',
      'Warm intros to trusted operators and investor network',
    ],
    notIncluded: [
      'Day-to-day tactical execution or operational management',
      'Direct hands-on copywriting, ad campaign setup, or design production',
      'Interim full-time management or board member fiduciary liability',
    ],
  },
}

// ─── payloadToData — maps wizard payload → SAMPLE shape (unchanged) ──────────
function payloadToData(payload) {
  if (!payload) return SAMPLE
  const biz  = payload.business   || {}
  const pos  = payload.positioning || {}
  const prf  = payload.proof      || {}
  const fd   = payload.frontDoor  || {}
  const know = payload.knowledge  || {}
  const off  = payload.offers     || {}

  const o = (v, fb) => (v && String(v).trim() ? v : fb)
  const a = (v, fb) => (Array.isArray(v) && v.filter(Boolean).length ? v.filter(Boolean) : fb)

  const owner = biz.owner || {}

  const mappedOffers = (off.tiers || [])
    .filter(t => t?.name)
    .map((t, i) => {
      const pInr = t.prices?.INR ?? t.priceInr
      const pUsd = t.prices?.USD ?? t.priceUsd
      return {
        name:        t.name,
        price:       pInr ? `₹${Number(pInr).toLocaleString('en-IN')}` : (pUsd ? `$${pUsd}` : SAMPLE.offers[i]?.price || ''),
        duration:    t.duration || '',
        type:        t.tier === 'recurring' ? 'Ongoing' : t.tier === 'front_door' ? 'One-time' : 'Project',
        description: t.summary || SAMPLE.offers[i]?.description || '',
        includes:    typeof t.deliverables === 'string'
          ? t.deliverables.split('\n').filter(Boolean)
          : Array.isArray(t.deliverables) ? t.deliverables.filter(Boolean) : (SAMPLE.offers[i]?.includes || []),
        cta:         i === 0 ? 'Book a Call' : i === 1 ? 'Get Started' : 'Apply',
        highlight:   off.mostBought === t.tier,
      }
    })

  const mappedProcess = (know.process || [])
    .filter(s => s?.title)
    .map((s, i) => ({
      step: String(i + 1).padStart(2, '0'),
      title: s.title,
      desc:  s.detail || '',
    }))

  const mappedFaqs = (know.faqs || [])
    .filter(f => f?.question && f?.answer)
    .map(f => ({ q: f.question, a: f.answer }))

  const mappedTestimonials = (prf.testimonials || [])
    .filter(t => t?.quote)
    .map(t => ({ name: t.name || '', role: t.role || '', rating: 5, quote: t.quote }))

  const mappedCaseStudies = (prf.caseStudies || [])
    .filter(c => c?.client || c?.result || c?.detail || c?.whatYouDid)
    .map(c => ({ client: c.client || '', result: c.result || '', detail: c.detail || c.whatYouDid || '', sector: c.sector || '' }))

  const credentials = a(prf.credentials, SAMPLE.founder.credentials)

  const tagline = pos.buyer && pos.outcome
    ? `I help ${pos.buyer} get ${pos.outcome}${pos.fear ? `, without ${pos.fear}` : ''}.`
    : o(biz.tagline, SAMPLE.founder.tagline)

  return {
    founder: {
      name:        o(owner.name, SAMPLE.founder.name),
      photo:       owner.photoUrl || null,
      title:       o(owner.role, SAMPLE.founder.title),
      credentials: credentials,
      tagline:     tagline,
      bio:         o(pos.credibility || pos.alreadyTried, SAMPLE.founder.bio),
      location:    o(`${biz.city || ''}${biz.country && biz.country !== 'India' ? ' · ' + biz.country : ''}`.trim(), SAMPLE.founder.location),
      phone:       o(owner.whatsapp, SAMPLE.founder.phone),
      email:       o(owner.email, SAMPLE.founder.email),
      calLink:     fd.bookingUrl || '#contact',
    },
    stats: [
      prf.yearsExperience ? { number: `${prf.yearsExperience}+`, label: 'Years Experience' } : SAMPLE.stats[3],
      prf.clientsServed   ? { number: `${prf.clientsServed}+`,   label: 'Clients Served'   } : SAMPLE.stats[0],
      ...(prf.results || []).filter(r => r?.number).slice(0, 2).map(r => ({ number: r.number, label: r.label })),
    ].slice(0, 4),
    forWho: [
      ...(pos.forWho || []).filter(Boolean).slice(0, 3).map(s => ({ icon: Target, title: '', desc: s })),
    ].length ? (pos.forWho || []).filter(Boolean).slice(0, 3).map(s => ({ icon: Target, title: s.split(' ').slice(0, 3).join(' '), desc: s }))
      : SAMPLE.forWho,
    process: mappedProcess.length ? mappedProcess : SAMPLE.process,
    offers:  mappedOffers.length  ? mappedOffers  : SAMPLE.offers,
    caseStudies: mappedCaseStudies.length ? mappedCaseStudies : SAMPLE.caseStudies,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:    mappedFaqs.length    ? mappedFaqs    : SAMPLE.faqs,
    scope: {
      included: a(know.included, SAMPLE.scope.included),
      notIncluded: a(know.notIncluded, SAMPLE.scope.notIncluded),
    },
    invitation: fd.invitation || '',
  }
}

// ─── Section mark — replaces the repeated all-caps eyebrow pill ─────────────
// A margin-numbered memo section header. Encodes position in the document
// rather than decorating each section identically.
function SectionMark({ n, children, dark }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="text-sm font-bold flex-shrink-0" style={{ color: T.red, fontFamily: SANS }}>§{n}</span>
      <h2 className="text-3xl md:text-4xl leading-tight" style={{ color: dark ? T.white : T.text, fontFamily: SERIF }}>{children}</h2>
    </div>
  )
}

// ─── Growth chart — hand-built SVG trajectory, the hero's visual anchor ─────
function GrowthChart() {
  return (
    <svg viewBox="0 0 420 220" className="w-full h-auto" role="img" aria-label="Illustrative revenue growth trajectory">
      <defs>
        <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.red} stopOpacity="0.18" />
          <stop offset="100%" stopColor={T.red} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* baseline grid ticks */}
      {[40, 90, 140, 190].map((y, i) => (
        <line key={i} x1="10" y1={y} x2="410" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* area under curve */}
      <path
        d="M20,178 L80,158 L140,138 L200,108 L260,78 L320,48 L390,22 L390,200 L20,200 Z"
        fill="url(#chartFade)"
      />
      {/* trajectory line */}
      <path
        d="M20,178 L80,158 L140,138 L200,108 L260,78 L320,48 L390,22"
        fill="none" stroke={T.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* "today" marker */}
      <circle cx="140" cy="138" r="5" fill={T.paper} stroke={T.red} strokeWidth="2.5" />
      <text x="140" y="158" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.55)" fontFamily={SANS}>Today</text>
      {/* projected marker */}
      <circle cx="390" cy="22" r="5" fill={T.red} />
      <text x="352" y="14" textAnchor="start" fontSize="11" fill={T.redLight} fontFamily={SANS}>18 months</text>
    </svg>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  const f = D.founder
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'rgba(20,23,29,0.94)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="leading-tight">
          <p className="font-semibold text-white text-base" style={{ fontFamily: SERIF }}>{f.name}</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Strategy Advisory</p>
        </div>
        <div className="hidden md:flex items-center gap-7 text-sm">
          {[['#exhibits', 'Exhibits'], ['#offers', 'Engagement'], ['#book', 'Contact']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</a>
          ))}
        </div>
        <a href="#book" className="px-5 py-2 rounded font-semibold text-sm transition-all hover:opacity-90" style={{ background: T.red, color: '#fff' }}>
          Book a Call
        </a>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const D = useData()
  const f = D.founder
  return (
    <section style={{ background: T.ink }} className="pt-28 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div>
            <p className="text-sm mb-5" style={{ color: T.redLight }}>Prepared for growth-stage founders</p>
            <h1 className="text-4xl md:text-5xl leading-[1.15] mb-6 text-white" style={{ fontFamily: SERIF }}>
              {f.tagline}
            </h1>
            <p className="text-base leading-relaxed mb-9 max-w-lg" style={{ color: 'rgba(255,255,255,0.62)' }}>
              {f.bio}
            </p>
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <a href={f.calLink} className="inline-flex items-center gap-2 px-6 py-3.5 rounded font-semibold text-sm transition-all hover:opacity-90" style={{ background: T.red, color: '#fff' }}>
                <Calendar className="w-4 h-4" /> Book a Strategy Call
              </a>
              <a href="#exhibits" className="inline-flex items-center gap-1.5 text-sm font-semibold border-b pb-0.5 transition-opacity hover:opacity-70" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                Read the case exhibits <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {f.location}<br />Accepting 3 new clients this quarter
            </p>
          </div>

          {/* Chart + signature block */}
          <div>
            <div className="rounded-lg border p-5 mb-5" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <GrowthChart />
            </div>
            <div className="flex items-start gap-4 px-1">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: T.inkSoft, color: T.redLight, border: `1px solid ${T.red}` }}>
                {f.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{f.name}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.credentials.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats — inline row, not a card grid */}
        <div className="mt-16 pt-10 grid grid-cols-2 md:grid-cols-4 gap-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {D.stats.map((s, i) => (
            <div key={i}>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: T.redLight, fontFamily: SERIF }}>{s.number}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── §1 Who this is for — a criteria list, not identical cards ──────────────
function ForWhoSection() {
  const D = useData()
  return (
    <section style={{ background: T.paper }} className="py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionMark n="1">Who this is for</SectionMark>
        <p className="text-base mb-10 max-w-lg" style={{ color: T.muted }}>My work is not for everyone — and that's the point. Here's who I partner with.</p>
        <div className="grid md:grid-cols-3 gap-x-8 gap-y-10">
          {D.forWho.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="pt-5" style={{ borderTop: `2px solid ${T.text}` }}>
              <Icon className="w-5 h-5 mb-4" style={{ color: T.red }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: T.text, fontFamily: SERIF }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── §2 How it works — annotated procedure, not circle badges ──────────────
function ProcessSection() {
  const D = useData()
  return (
    <section className="py-20" style={{ background: T.white }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionMark n="2">How the engagement runs</SectionMark>
        <div className="mt-10 relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: T.border }} />
          <div className="space-y-10">
            {D.process.map(({ step, title, desc }, i) => (
              <div key={i} className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2" style={{ borderColor: T.red, background: T.white }} />
                <p className="text-xs font-bold mb-1.5" style={{ color: T.red, fontFamily: SANS }}>§2.{i + 1}</p>
                <h3 className="text-lg font-semibold mb-2" style={{ color: T.text, fontFamily: SERIF }}>{title}</h3>
                <p className="text-sm leading-relaxed max-w-lg" style={{ color: T.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── §3 Ways to engage — a ledger, not three identical price cards ─────────
function OffersSection() {
  const D = useData()
  return (
    <section style={{ background: T.paper }} className="py-20" id="offers">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionMark n="3">Ways to engage</SectionMark>
        <p className="text-base mb-10 max-w-lg" style={{ color: T.muted }}>Start small or go deep — every option is scoped to deliver a measurable outcome.</p>

        <div className="border-t" style={{ borderColor: T.text }}>
          {D.offers.map((o, i) => (
            <div key={i}
              className="grid md:grid-cols-[1.4fr_1fr_1.6fr_auto] gap-4 md:gap-8 items-start py-7 border-b relative"
              style={{ borderColor: T.border, paddingLeft: o.highlight ? '1rem' : 0 }}>
              {o.highlight && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: T.red }} />}

              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: o.highlight ? T.red : T.muted }}>
                  {o.type}{o.highlight ? ' · Recommended' : ''}
                </p>
                <h3 className="text-xl font-semibold" style={{ color: T.text, fontFamily: SERIF }}>{o.name}</h3>
              </div>

              <div>
                <p className="text-2xl font-bold" style={{ color: T.text, fontFamily: SERIF }}>{o.price}</p>
                <p className="text-xs" style={{ color: T.muted }}>{o.duration}</p>
              </div>

              <div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: T.muted }}>{o.description}</p>
                <ul className="space-y-1.5">
                  {o.includes.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: T.text }}>
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: T.red }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <a href="#book" className="self-center justify-self-start md:justify-self-end whitespace-nowrap px-5 py-2.5 rounded font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: o.highlight ? T.red : 'transparent', color: o.highlight ? '#fff' : T.text, border: o.highlight ? 'none' : `1px solid ${T.text}` }}>
                {o.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Scope Boundaries: Included & Not Included */}
        {D.scope && (D.scope.included?.length > 0 || D.scope.notIncluded?.length > 0) && (
          <div className="mt-12 p-6 rounded-lg border grid md:grid-cols-2 gap-8" style={{ borderColor: T.border, background: T.white }}>
            {D.scope.included?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: T.text, fontFamily: SANS }}>
                  <CheckCircle className="w-4 h-4" style={{ color: T.red }} />
                  What is always included
                </h4>
                <ul className="space-y-2.5">
                  {D.scope.included.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm" style={{ color: T.muted }}>
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.red }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {D.scope.notIncluded?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: T.muted, fontFamily: SANS }}>
                  <XCircle className="w-4 h-4 text-gray-400" />
                  What is not included (scope boundary)
                </h4>
                <ul className="space-y-2.5">
                  {D.scope.notIncluded.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm" style={{ color: T.muted }}>
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── §4 Selected exhibits — stacked, alternating, not a card grid ──────────
function CaseStudiesSection() {
  const D = useData()
  return (
    <section className="py-20" style={{ background: T.white }} id="exhibits">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionMark n="4">Selected exhibits</SectionMark>
        <p className="text-base mb-14 max-w-lg" style={{ color: T.muted }}>Real outcomes for real businesses, shared with client permission.</p>

        <div className="space-y-14">
          {D.caseStudies.map((c, i) => {
            const letter = String.fromCharCode(65 + i)
            const flip = i % 2 === 1
            return (
              <div key={i} className={`grid md:grid-cols-[auto_1fr] gap-6 items-start ${flip ? 'md:[direction:rtl]' : ''}`}>
                <div className="flex md:flex-col items-baseline md:items-start gap-3 md:gap-1" style={{ direction: 'ltr' }}>
                  <span className="text-4xl font-bold" style={{ WebkitTextStroke: `1.5px ${T.text}`, color: 'transparent', fontFamily: SERIF }}>
                    {letter}
                  </span>
                  <FileText className="w-4 h-4 hidden md:block" style={{ color: T.red }} />
                </div>
                <div style={{ direction: 'ltr' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: T.red, letterSpacing: '0.04em' }}>{c.sector}</p>
                  <p className="text-xs mb-1" style={{ color: T.muted }}>{c.client}</p>
                  <h3 className="text-2xl font-semibold mb-3" style={{ color: T.text, fontFamily: SERIF }}>{c.result}</h3>
                  <p className="text-sm leading-relaxed max-w-xl" style={{ color: T.muted }}>{c.detail}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Intro video — styled as an attached appendix, not a floating video card */}
        <div className="mt-16 rounded-lg border p-6 flex flex-col sm:flex-row items-center gap-6" style={{ borderColor: T.border, background: T.paper }}>
          <button className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105" style={{ background: T.red }}>
            <Play className="w-5 h-5 ml-0.5 text-white" />
          </button>
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: T.text }}>Appendix — a 3-minute introduction</p>
            <p className="text-xs" style={{ color: T.muted }}>Paste a YouTube link in Settings → Brand → Intro Video to replace this.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── §5 In their own words — inline testimony, not a card grid ────────────
function TestimonialsSection() {
  const D = useData()
  return (
    <section style={{ background: T.ink }} className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionMark n="5" dark>In their own words</SectionMark>
        <div className="mt-10 space-y-10">
          {D.testimonials.map((t, i) => (
            <div key={i} className="pb-10 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <Quote className="w-5 h-5 mb-3" style={{ color: T.red }} />
              <p className="text-lg md:text-xl leading-relaxed mb-4" style={{ color: '#fff', fontFamily: SERIF }}>"{t.quote}"</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.role}</p>
                <div className="flex gap-0.5 ml-2">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3 h-3 fill-current" style={{ color: T.redLight }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── §6 FAQ — rule-separated list, not bordered cards ──────────────────────
function FAQSection() {
  const D = useData()
  const [open, setOpen] = useState(null)
  return (
    <section className="py-20" style={{ background: T.paper }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionMark n="6">Questions before we start</SectionMark>
        <div className="mt-8">
          {D.faqs.map((f, i) => (
            <div key={i} className="border-b" style={{ borderColor: T.border }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-center py-5 text-left font-semibold text-sm" style={{ color: T.text }}>
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`} style={{ color: T.red }} />
              </button>
              {open === i && (
                <div className="pb-5 text-sm leading-relaxed max-w-lg" style={{ color: T.muted }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── §7 Closing — a signature block, not a generic CTA banner ──────────────
function InvitationSection() {
  const D = useData()
  const f = D.founder
  return (
    <section style={{ background: T.ink }} className="py-24" id="book">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <PenTool className="w-6 h-6 mx-auto mb-6" style={{ color: T.red }} />
        <h2 className="text-3xl md:text-4xl mb-5 text-white" style={{ fontFamily: SERIF }}>{D.invitation || 'Ready to scale with clarity?'}</h2>
        <p className="text-base mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>I take on a maximum of 5 retainer clients at any time.</p>
        <p className="text-sm font-semibold mb-10" style={{ color: T.redLight }}>3 spots remaining this quarter</p>
        <a href={f.calLink} className="inline-flex items-center gap-2 px-8 py-4 rounded font-semibold text-base transition-all hover:opacity-90" style={{ background: T.red, color: '#fff' }}>
          <Calendar className="w-5 h-5" /> Book a Free Discovery Call
        </a>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          <a href={`tel:${f.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
            <Phone className="w-4 h-4" style={{ color: T.red }} /> {f.phone}
          </a>
          <a href={`mailto:${f.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
            <Mail className="w-4 h-4" style={{ color: T.red }} /> {f.email}
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function TemplateFooter() {
  const D = useData()
  const f = D.founder
  return (
    <footer style={{ background: T.ink, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <p className="font-semibold text-lg text-white mb-1" style={{ fontFamily: SERIF }}>{f.name}</p>
            <p className="text-sm mb-4" style={{ color: T.redLight }}>{f.title}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Independent strategy advisor helping Indian founders scale past ₹10 Cr.<br />Based in {f.location}.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-4" style={{ color: T.redLight }}>Quick Links</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {[['#exhibits','Exhibits'],['#offers','Engagement'],['#book','Contact'],['#','Privacy Policy'],['#','Terms of Engagement']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold mb-4" style={{ color: T.redLight }}>Get in Touch</p>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <li><a href={`mailto:${f.email}`} className="hover:text-white transition-colors">{f.email}</a></li>
              <li><a href={`tel:${f.phone}`} className="hover:text-white transition-colors">{f.phone}</a></li>
              <li>{f.location}</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>
          <span>© {new Date().getFullYear()} {f.name}. All rights reserved.</span>
          <Link href="/templates" className="hover:text-white transition-colors">← Browse all templates on OPC Genie</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConsultantAdvisorTemplate({ data }) {
  const resolved = payloadToData(data)
  return (
    <DataCtx.Provider value={resolved}>
      <div className="min-h-screen" style={{ fontFamily: SANS }}>
        <TemplateNav />
        <HeroSection />
        <ForWhoSection />
        <ProcessSection />
        <OffersSection />
        <CaseStudiesSection />
        <TestimonialsSection />
        <FAQSection />
        <InvitationSection />
        <TemplateFooter />
      </div>
    </DataCtx.Provider>
  )
}