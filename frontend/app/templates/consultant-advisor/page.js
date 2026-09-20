'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, Star, ChevronDown, Phone, Mail, Calendar, Award, TrendingUp, Users, Clock, BookOpen, Shield, Target, BarChart2, ChevronRight, Play } from 'lucide-react'
import { useState, createContext, useContext } from 'react'

// ─── Data context — sections read live data when provided, SAMPLE otherwise ──
const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Theme tokens ────────────────────────────────────────────────────────────
const T = {
  navy:      '#1e3a5f',
  navyDark:  '#142840',
  gold:      '#c9a84c',
  goldLight: '#f0d98a',
  cream:     '#faf8f4',
  border:    '#e8e3d8',
  text:      '#1a1a2e',
  muted:     '#5c5c6e',
}

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
}

// ─── payloadToData — maps wizard payload → SAMPLE shape ──────────────────────
// Only overrides fields where the payload has real content.
// Falls back to SAMPLE for anything not yet filled in by the user.
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
    .map((t, i) => ({
      name:        t.name,
      price:       t.priceInr ? `₹${Number(t.priceInr).toLocaleString('en-IN')}` : (t.priceUsd ? `$${t.priceUsd}` : SAMPLE.offers[i]?.price || ''),
      duration:    t.duration || '',
      type:        t.tier === 'recurring' ? 'Ongoing' : t.tier === 'front_door' ? 'One-time' : 'Project',
      description: t.summary || SAMPLE.offers[i]?.description || '',
      includes:    typeof t.deliverables === 'string'
        ? t.deliverables.split('\n').filter(Boolean)
        : Array.isArray(t.deliverables) ? t.deliverables.filter(Boolean) : (SAMPLE.offers[i]?.includes || []),
      cta:         i === 0 ? 'Book a Call' : i === 1 ? 'Get Started' : 'Apply',
      highlight:   off.mostBought === t.tier,
    }))

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
    .filter(c => c?.client || c?.result)
    .map(c => ({ client: c.client || '', result: c.result || '', detail: c.whatYouDid || '', sector: '' }))

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
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border" style={{ color: T.gold, borderColor: T.gold, background: '#fff8e8' }}>
      {children}
    </span>
  )
}

function Divider() {
  return <div className="w-12 h-1 rounded-full my-4" style={{ background: T.gold }} />
}

// Hero
function HeroSection() {
  const D = useData()
  const f = D.founder
  return (
    <section style={{ background: T.navy }} className="relative overflow-hidden pt-28 pb-20">
      {/* subtle grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 text-sm font-medium" style={{ borderColor: T.goldLight, color: T.goldLight, background: 'rgba(201,168,76,0.1)' }}>
              <Award className="w-4 h-4" />
              {f.credentials[0]} · {f.credentials[1]}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              {f.tagline}
            </h1>
            <p className="text-lg leading-relaxed mb-8" style={{ color: '#c7d2e0' }}>
              {f.bio}
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={f.calLink} className="inline-flex items-center px-7 py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90" style={{ background: T.gold, color: T.navyDark }}>
                <Calendar className="w-5 h-5 mr-2" /> Book a Strategy Call
              </a>
              <a href="#case-studies" className="inline-flex items-center px-7 py-3.5 rounded-xl font-bold text-base border transition-all hover:bg-white hover:bg-opacity-10" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                View Case Studies <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
            <div className="flex items-center gap-2 mt-6 text-sm" style={{ color: '#c7d2e0' }}>
              <CheckCircle className="w-4 h-4" style={{ color: T.gold }} />
              {f.location} · Accepting 3 new clients this quarter
            </div>
          </div>
          {/* Right — avatar + stats */}
          <div className="flex flex-col items-center gap-8">
            {/* Avatar placeholder */}
            <div className="w-44 h-44 rounded-full border-4 flex items-center justify-center text-5xl font-black" style={{ borderColor: T.gold, background: T.navyDark, color: T.gold }}>
              {f.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{f.name}</p>
              <p style={{ color: T.goldLight }} className="text-sm">{f.title}</p>
            </div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {D.stats.map((s, i) => (
                <div key={i} className="rounded-xl p-4 text-center border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-2xl font-black" style={{ color: T.gold }}>{s.number}</div>
                  <div className="text-xs mt-1" style={{ color: '#c7d2e0' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Video placeholder ── */}
        <div className="mt-16">
          <p className="text-center text-sm font-semibold mb-4" style={{ color: '#c7d2e0' }}>
            Watch: How I help founders break through growth plateaus
          </p>
          <div
            className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', aspectRatio: '16/9' }}
          >
            {/* Thumbnail area */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer transition-transform hover:scale-105"
                  style={{ background: T.gold }}
                >
                  <Play className="w-8 h-8 ml-1" style={{ color: T.navyDark }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#c7d2e0' }}>Your intro video goes here</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(199,210,224,0.5)' }}>Paste a YouTube link in Settings → Brand → Intro Video</p>
              </div>
            </div>
            {/* Corner badge */}
            <div
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(201,168,76,0.15)', color: T.goldLight, border: `1px solid ${T.gold}` }}
            >
              ▶ 3 min intro
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// For Who
function ForWhoSection() {
  const D = useData()
  return (
    <section style={{ background: T.cream }} className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <SectionLabel>Who I Work With</SectionLabel>
        <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: T.text }}>Built for a specific kind of founder</h2>
        <p className="text-lg mb-14" style={{ color: T.muted }}>My work is not for everyone — and that's the point. Here's who I partner with.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {D.forWho.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="rounded-2xl p-8 border text-left" style={{ background: '#fff', borderColor: T.border }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: T.navy }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: T.text }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Process
function ProcessSection() {
  const D = useData()
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>A structured path to clarity</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* connector line — desktop only */}
          <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px" style={{ background: T.border, top: '2.5rem' }} />
          {D.process.map(({ step, title, desc }, i) => (
            <div key={i} className="relative rounded-2xl p-8 border" style={{ background: T.cream, borderColor: T.border }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg mb-5 border-2" style={{ borderColor: T.gold, color: T.gold, background: '#fff' }}>
                {step}
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ color: T.text }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Offer Ladder
function OffersSection() {
  const D = useData()
  return (
    <section style={{ background: T.navy }} className="py-24" id="offers">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Ways to Work Together</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black text-white">Choose your engagement</h2>
          <p className="mt-3 text-base" style={{ color: '#c7d2e0' }}>Start small or go deep — every option is designed to deliver measurable impact.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {D.offers.map((o, i) => (
            <div key={i} className={`relative rounded-2xl p-8 border flex flex-col ${o.highlight ? 'ring-2' : ''}`} style={{ background: o.highlight ? '#fff' : 'rgba(255,255,255,0.05)', borderColor: o.highlight ? T.gold : 'rgba(255,255,255,0.12)', ringColor: T.gold }}>
              {o.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold" style={{ background: T.gold, color: T.navyDark }}>
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: o.highlight ? T.muted : '#c7d2e0' }}>{o.type}</p>
                <h3 className="text-xl font-black mb-1" style={{ color: o.highlight ? T.text : '#fff' }}>{o.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black" style={{ color: T.gold }}>{o.price}</span>
                  <span className="text-sm" style={{ color: o.highlight ? T.muted : '#c7d2e0' }}>/ {o.duration}</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: o.highlight ? T.muted : '#c7d2e0' }}>{o.description}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {o.includes.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: o.highlight ? T.text : '#e2e8f0' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.gold }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#book" className="mt-auto block text-center py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90" style={{ background: T.gold, color: T.navyDark }}>
                {o.cta} <ArrowRight className="inline w-4 h-4 ml-1" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Case Studies
function CaseStudiesSection() {
  const D = useData()
  return (
    <section className="py-24 bg-white" id="case-studies">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Case Studies</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Results I've helped create</h2>
          <p className="mt-3 text-base" style={{ color: T.muted }}>Real outcomes for real businesses. All details shared with client permission.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {D.caseStudies.map((c, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border" style={{ borderColor: T.border }}>
              <div className="px-6 py-4 font-semibold text-sm" style={{ background: T.navy, color: T.goldLight }}>
                {c.sector}
              </div>
              <div className="p-6" style={{ background: T.cream }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: T.muted }}>{c.client}</p>
                <p className="text-xl font-black mb-3" style={{ color: T.text }}>{c.result}</p>
                <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Testimonials
function TestimonialsSection() {
  const D = useData()
  return (
    <section style={{ background: T.cream }} className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Client Voices</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>What founders say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {D.testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl p-8 bg-white border" style={{ borderColor: T.border }}>
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" style={{ color: T.gold }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed italic mb-6" style={{ color: T.muted }}>"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: T.navy, color: T.gold }}>
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{t.name}</p>
                  <p className="text-xs" style={{ color: T.muted }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ
function FAQSection() {
  const D = useData()
  const [open, setOpen] = useState(null)
  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Common questions</h2>
        </div>
        <div className="space-y-3">
          {D.faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm" style={{ color: T.text, background: open === i ? T.cream : '#fff' }}>
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`} style={{ color: T.gold }} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.muted, background: T.cream }}>
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

// Invitation / Final CTA
function InvitationSection() {
  const D = useData()
  const f = D.founder
  return (
    <section style={{ background: T.navy }} className="py-24" id="book">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center border-2" style={{ borderColor: T.gold, background: T.navyDark, color: T.gold, fontSize: '1.25rem', fontWeight: 900 }}>
          {f.name.split(' ').map(n => n[0]).join('')}
        </div>
        <SectionLabel>Let's Talk</SectionLabel>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
          Ready to scale with clarity?
        </h2>
        <p className="text-base mb-4" style={{ color: '#c7d2e0' }}>
          I take on a maximum of 5 retainer clients at any time.<br />
          <span style={{ color: T.goldLight }} className="font-semibold">3 spots remaining this quarter.</span>
        </p>
        <p className="text-sm mb-10" style={{ color: '#8fa3b8' }}>No obligations — the first call is a conversation, not a sales pitch.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <a href={f.calLink} className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-base transition-all hover:opacity-90" style={{ background: T.gold, color: T.navyDark }}>
            <Calendar className="w-5 h-5 mr-2" /> Book a Free Discovery Call
          </a>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm" style={{ color: '#8fa3b8' }}>
          <a href={`tel:${f.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
            <Phone className="w-4 h-4" style={{ color: T.gold }} /> {f.phone}
          </a>
          <a href={`mailto:${f.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
            <Mail className="w-4 h-4" style={{ color: T.gold }} /> {f.email}
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Template nav bar ─────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  const f = D.founder
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md" style={{ background: 'rgba(30,58,95,0.97)', borderColor: 'rgba(255,255,255,0.1)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="font-black text-white text-lg">{f.name} <span className="font-normal text-sm" style={{ color: '#c7d2e0' }}>· Advisory</span></span>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {[['#case-studies', 'Case Studies'], ['#offers', 'Work Together'], ['#book', 'Contact']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-colors hover:opacity-70" style={{ color: '#c7d2e0' }}>{label}</a>
          ))}
        </div>
        <a href="#book" className="px-5 py-2 rounded-lg font-bold text-sm transition-all hover:opacity-90" style={{ background: T.gold, color: T.navyDark }}>
          Book a Call
        </a>
      </div>
    </nav>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function TemplateFooter() {
  const D = useData()
  const f = D.founder
  return (
    <footer style={{ background: T.navyDark, borderTop: `1px solid rgba(255,255,255,0.08)` }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="font-black text-xl text-white mb-1">{f.name}</p>
            <p className="text-sm mb-4" style={{ color: T.goldLight }}>{f.title}</p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#8fa3b8' }}>
              Independent strategy advisor helping Indian founders scale past ₹10 Cr.
              Based in {f.location}.
            </p>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#8fa3b8' }}>
              <span style={{ color: T.gold }}>✦</span> Available for new engagements
            </div>
          </div>
          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.gold }}>Quick Links</p>
            <ul className="space-y-2 text-sm" style={{ color: '#8fa3b8' }}>
              {[['#case-studies','Case Studies'],['#offers','Work Together'],['#book','Book a Call'],['#','Privacy Policy'],['#','Terms of Engagement']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.gold }}>Get in Touch</p>
            <ul className="space-y-3 text-sm" style={{ color: '#8fa3b8' }}>
              <li><a href={`mailto:${f.email}`} className="hover:text-white transition-colors">{f.email}</a></li>
              <li><a href={`tel:${f.phone}`} className="hover:text-white transition-colors">{f.phone}</a></li>
              <li>{f.location}</li>
            </ul>
            <a
              href={f.calLink}
              className="inline-flex items-center mt-5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: T.gold, color: T.navyDark }}
            >
              Book a Strategy Call
            </a>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: '#8fa3b8' }}>
          <span>© {new Date().getFullYear()} {f.name}. All rights reserved.</span>
          <Link href="/templates" className="inline-flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: '#8fa3b8' }}>
            ← Browse all templates on OPC Genie
          </Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// `data` prop: when rendered from /[username] this is the live wizard payload.
// When browsed standalone at /templates/consultant-advisor it is undefined,
// so payloadToData(undefined) returns SAMPLE — the preview is unchanged.
export default function ConsultantAdvisorTemplate({ data }) {
  const resolved = payloadToData(data)
  return (
    <DataCtx.Provider value={resolved}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
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
