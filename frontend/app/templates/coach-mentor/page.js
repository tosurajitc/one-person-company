'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, Star, ChevronDown, Phone, Mail, Calendar, Heart, Smile, Sunrise, Zap, Leaf, BookOpen, MessageCircle, Users, Play } from 'lucide-react'
import { useState, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  terra:      '#c2693e',
  terraDark:  '#9c4f2a',
  terraLight: '#e8916a',
  cream:      '#fdf6ec',
  creamDark:  '#f5e8d0',
  sand:       '#e8d5b7',
  white:      '#ffffff',
  text:       '#2d1f14',
  muted:      '#6b5344',
  border:     '#e0c9ae',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  founder: {
    name:      'Priya Verma',
    title:     'Life & Career Transformation Coach',
    tagline:   'You already have everything you need. I help you trust it.',
    story:     'After burning out at 34 as a senior marketing director, I spent two years rebuilding my life from the inside out. Today I coach high-achieving women through the same journey — from overwhelm and self-doubt to clarity, confidence, and careers they genuinely love.',
    credentials: ['ICF Certified PCC Coach', '500+ hours coached', 'Ex-Head of Marketing, Unilever India'],
    location:   'Pune · Online Worldwide',
    phone:      '+91 97300 00000',
    email:      'priya@vermacoaching.in',
    calLink:    '#book',
    instagram:  '#',
  },
  transformation: {
    before: ["Feel stuck but don\u2019t know why", 'Say yes when you mean no', 'Chase goals that feel hollow', 'Doubt yourself constantly'],
    after:  ['Move forward with clear intention', 'Set boundaries without guilt', 'Pursue what actually matters to you', 'Trust your own judgment'],
  },
  forWho: [
    { icon: Sunrise, title: 'Career Crossroads',    desc: "You\u2019re successful on paper but unfulfilled. You want permission to want something different." },
    { icon: Zap,     title: 'Burnout Recovery',      desc: "You\u2019ve given everything to your job and there\u2019s nothing left. Time to rebuild on your own terms." },
    { icon: Heart,   title: 'Life After a Big Change', desc: "Divorce, relocation, redundancy \u2014 you\u2019re ready to rediscover who you are now." },
  ],
  process: [
    { step: '01', title: 'Chemistry Call',      desc: "A free 30-minute conversation to see if we\u2019re a good fit. No pressure, no pitch \u2014 just honest dialogue." },
    { step: '02', title: 'Deep-Dive Session',   desc: 'A 90-minute foundation session where we map your values, blockers, and the one shift that changes everything.' },
    { step: '03', title: 'Ongoing Coaching',    desc: 'Bi-weekly sessions, voice-note check-ins, and a private journal space — support that meets you where you are.' },
  ],
  offers: [
    {
      name:        'Single Session',
      price:       '₹4,500',
      duration:    '60 min',
      type:        'One-time',
      description: "A focused coaching session to work through one specific challenge \u2014 a decision, a conversation, or a mental block you can\u2019t shake.",
      includes:    ['Pre-session reflection prompts', '60-min Zoom session', 'Voice-note follow-up within 48 hrs'],
      cta:         'Book a Session',
      highlight:   false,
    },
    {
      name:        '3-Month Journey',
      price:       '₹42,000',
      duration:    '3 months',
      type:        'Signature Programme',
      description: 'My core coaching container. Six bi-weekly sessions plus ongoing support — deep enough to create real, lasting change.',
      includes:    ['6 × 60-min sessions', 'WhatsApp voice support', 'Reflection workbooks', 'Private journal access', 'Emergency session if needed'],
      cta:         'Begin the Journey',
      highlight:   true,
    },
    {
      name:        'VIP Day',
      price:       '₹18,000',
      duration:    '1 day',
      type:        'Intensive',
      description: 'A full day together — in-person or virtual. We go deep, move fast, and you leave with absolute clarity and a concrete 90-day plan.',
      includes:    ['4-hour intensive session', 'Personalised action plan', '2 follow-up calls (30 min each)', 'Unlimited WhatsApp for 2 weeks'],
      cta:         'Book Your VIP Day',
      highlight:   false,
    },
  ],
  testimonials: [
    {
      name:   'Ananya Krishnan',
      role:   'Product Manager → Startup Founder',
      rating: 5,
      quote:  "Three months with Priya gave me more clarity than three years of therapy. She has this gift for asking the question you\u2019ve been avoiding.",
      result: 'Left corporate, launched her own studio',
    },
    {
      name:   'Meera Joshi',
      role:   'Senior Engineer, returned from sabbatical',
      rating: 5,
      quote:  "I came in completely burnt out. I left with a plan, energy, and \u2014 for the first time in years \u2014 genuine excitement about what\u2019s next.",
      result: 'Negotiated a 4-day week and a 30% raise',
    },
    {
      name:   'Reena Shah',
      role:   'HR Director navigating divorce',
      rating: 5,
      quote:  'Priya holds space unlike anyone I\'ve ever met. She doesn\'t fix you — she helps you realise you were never broken.',
      result: 'Rebuilt confidence, started dating again at 41',
    },
  ],
  faqs: [
    { q: "What\u2019s the difference between coaching and therapy?",     a: "Therapy explores the past to heal wounds. Coaching works from the present toward the future \u2014 it\u2019s action-oriented, forward-focused, and assumes you\u2019re already capable." },
    { q: 'Do you coach men too?',                                    a: 'My practice is currently women-only. I work with women aged 28\u201355 navigating career transitions and life changes.' },
    { q: 'How do sessions work?',                                    a: 'All sessions are on Zoom. You get a private link, a reminder 24 hours before, and a recording if you want it.' },
    { q: "What if I can\u2019t afford the 3-month programme?",           a: 'Start with a single session. Many clients begin there before committing to the full journey. Payment plans are available for the 3-month programme.' },
    { q: 'How quickly will I see results?',                         a: 'Most clients report a meaningful shift within the first two sessions. Deep change takes time — but momentum starts on Day 1.' },
  ],
}

// ─── payloadToData — maps wizard payload → SAMPLE shape ──────────────────────
function payloadToData(payload) {
  if (!payload) return SAMPLE
  const biz  = payload.business   || {}
  const pos  = payload.positioning || {}
  const prf  = payload.proof      || {}
  const fd   = payload.frontDoor  || {}
  const know = payload.knowledge  || {}
  const off  = payload.offers     || {}
  const owner = biz.owner || {}
  const o = (v, fb) => (v && String(v).trim() ? v : fb)
  const a = (v, fb) => (Array.isArray(v) && v.filter(Boolean).length ? v.filter(Boolean) : fb)
  const tagline = pos.buyer && pos.outcome
    ? `I help ${pos.buyer} get ${pos.outcome}${pos.fear ? `, without ${pos.fear}` : ''}.`
    : o(biz.tagline, SAMPLE.founder.tagline)
  const mappedOffers = (off.tiers || []).filter(t => t?.name).map((t, i) => ({
    name:        t.name,
    price:       t.priceInr ? `₹${Number(t.priceInr).toLocaleString('en-IN')}` : (t.priceUsd ? `$${t.priceUsd}` : SAMPLE.offers[i]?.price || ''),
    duration:    t.duration || '',
    type:        t.tier === 'recurring' ? 'Ongoing' : t.tier === 'front_door' ? 'One-time' : 'Programme',
    description: t.summary || SAMPLE.offers[i]?.description || '',
    includes:    typeof t.deliverables === 'string' ? t.deliverables.split('\n').filter(Boolean) : Array.isArray(t.deliverables) ? t.deliverables.filter(Boolean) : (SAMPLE.offers[i]?.includes || []),
    cta:         SAMPLE.offers[i]?.cta || 'Book a Session',
    highlight:   off.mostBought === t.tier,
  }))
  const mappedProcess = (know.process || []).filter(s => s?.title).map((s, i) => ({ step: String(i + 1).padStart(2, '0'), title: s.title, desc: s.detail || '' }))
  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer).map(f => ({ q: f.question, a: f.answer }))
  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote).map(t => ({ name: t.name || '', role: t.role || '', rating: 5, quote: t.quote, result: t.result || '' }))
  const mappedForWho = (pos.forWho || []).filter(Boolean).slice(0, 3).map(s => ({ icon: Heart, title: s.split(' ').slice(0, 3).join(' '), desc: s }))
  return {
    founder: {
      name:        o(owner.name, SAMPLE.founder.name),
      title:       o(owner.role, SAMPLE.founder.title),
      tagline:     tagline,
      story:       o(pos.credibility, SAMPLE.founder.story),
      credentials: a(prf.credentials, SAMPLE.founder.credentials),
      location:    o(`${biz.city || ''}${biz.country && biz.country !== 'India' ? ' · ' + biz.country : ''}`.trim(), SAMPLE.founder.location),
      phone:       o(owner.whatsapp, SAMPLE.founder.phone),
      email:       o(owner.email, SAMPLE.founder.email),
      calLink:     fd.bookingUrl || '#book',
      instagram:   '#',
    },
    transformation: SAMPLE.transformation,
    forWho:       mappedForWho.length ? mappedForWho : SAMPLE.forWho,
    process:      mappedProcess.length ? mappedProcess : SAMPLE.process,
    offers:       mappedOffers.length ? mappedOffers : SAMPLE.offers,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children, light }) {
  return (
    <span
      className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border"
      style={
        light
          ? { color: T.creamDark, borderColor: 'rgba(253,246,236,0.4)', background: 'rgba(253,246,236,0.1)' }
          : { color: T.terra, borderColor: T.sand, background: T.cream }
      }
    >
      {children}
    </span>
  )
}

// ─── Template nav ─────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
      style={{ background: 'rgba(253,246,236,0.96)', borderColor: T.border }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="font-black text-lg" style={{ color: T.text }}>
          {D.founder.name}
          <span className="font-normal text-sm ml-2" style={{ color: T.muted }}>Coaching</span>
        </span>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {[['#transformation', 'The Journey'], ['#offers', 'Work With Me'], ['#book', 'Book a Call']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-colors hover:opacity-70" style={{ color: T.muted }}>
              {label}
            </a>
          ))}
        </div>
        <a
          href="#book"
          className="px-5 py-2 rounded-full font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: T.terra }}
        >
          Free Chemistry Call
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
    <section style={{ background: T.cream }} className="pt-28 pb-20 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: T.terraLight }} />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-10" style={{ background: T.terra }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 text-sm font-medium"
              style={{ borderColor: T.sand, color: T.muted, background: T.white }}
            >
              <Leaf className="w-4 h-4" style={{ color: T.terra }} />
              {f.credentials[0]} · {f.credentials[2]}
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6" style={{ color: T.text }}>
              {f.tagline}
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: T.muted }}>
              {f.story}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={f.calLink}
                className="inline-flex items-center px-7 py-3.5 rounded-full font-bold text-base text-white transition-all hover:opacity-90"
                style={{ background: T.terra }}
              >
                <Calendar className="w-5 h-5 mr-2" /> Book a Free Call
              </a>
              <a
                href="#transformation"
                className="inline-flex items-center px-7 py-3.5 rounded-full font-bold text-base border transition-all hover:bg-white"
                style={{ borderColor: T.sand, color: T.text }}
              >
                See the Journey <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
            <p className="text-sm mt-5" style={{ color: T.muted }}>
              ✦ No-pressure conversation · 30 minutes · completely free
            </p>
          </div>

          {/* Avatar + credential cards */}
          <div className="flex flex-col items-center gap-6">
            <div
              className="w-48 h-48 rounded-full flex items-center justify-center text-6xl font-black border-4"
              style={{ borderColor: T.terra, background: T.creamDark, color: T.terra }}
            >
              {f.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: T.text }}>{f.name}</p>
              <p className="text-sm" style={{ color: T.muted }}>{f.title}</p>
              <p className="text-xs mt-1" style={{ color: T.terraLight }}>{f.location}</p>
            </div>
            {/* Social proof pill */}
            <div
              className="flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium"
              style={{ background: T.white, borderColor: T.border, color: T.muted }}
            >
              <div className="flex -space-x-1">
                {['AK', 'MJ', 'RS'].map(i => (
                  <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white" style={{ background: T.terra }}>{i}</div>
                ))}
              </div>
              <span><strong style={{ color: T.text }}>120+ women</strong> transformed</span>
            </div>
          </div>
        </div>

        {/* ── Video placeholder ── */}
        <div className="mt-14">
          <p className="text-center text-sm font-semibold mb-4" style={{ color: T.muted }}>
            Watch: My story, and how coaching can change yours
          </p>
          <div
            className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center"
            style={{ background: T.creamDark, borderColor: T.border, aspectRatio: '16/9' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer transition-transform hover:scale-105"
                  style={{ background: T.terra }}
                >
                  <Play className="w-8 h-8 ml-1 text-white" />
                </div>
                <p className="text-sm font-medium" style={{ color: T.muted }}>Your intro video goes here</p>
                <p className="text-xs mt-1" style={{ color: T.sand }}>Paste a YouTube link in Settings → Brand → Intro Video</p>
              </div>
            </div>
            {/* Corner badge */}
            <div
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(194,105,62,0.12)', color: T.terra, border: `1px solid ${T.sand}` }}
            >
              ▶ 4 min intro
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Transformation (Before / After) ─────────────────────────────────────────
function TransformationSection() {
  const D = useData()
  const { before, after } = D.transformation
  return (
    <section id="transformation" className="py-24" style={{ background: T.white }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>The Transformation</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>
            From this… to this
          </h2>
          <p className="mt-3 text-base" style={{ color: T.muted }}>
            These aren't abstract outcomes. They're the words my clients use.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="rounded-2xl p-8 border" style={{ background: '#fdf4f0', borderColor: '#f3d0c0' }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: '#c0614b' }}>Before coaching</p>
            <ul className="space-y-3">
              {before.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: T.muted }}>
                  <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: '#f3d0c0', color: '#c0614b' }}>✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* After */}
          <div className="rounded-2xl p-8 border" style={{ background: '#f2faf0', borderColor: '#b8e0b0' }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: '#3a7d34' }}>After coaching</p>
            <ul className="space-y-3">
              {after.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: T.text }}>
                  <CheckCircle className="mt-0.5 w-5 h-5 flex-shrink-0" style={{ color: '#3a7d34' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── For Who ──────────────────────────────────────────────────────────────────
function ForWhoSection() {
  return (
    <section style={{ background: T.cream }} className="py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <SectionLabel>Is This For You?</SectionLabel>
        <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: T.text }}>
          I work with women at a turning point
        </h2>
        <p className="text-base mb-14" style={{ color: T.muted }}>
          You don't have to have it all figured out. You just need to be ready.
        </p>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {useData().forWho.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="rounded-2xl p-7 border" style={{ background: T.white, borderColor: T.border }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5" style={{ background: T.creamDark }}>
                <Icon className="w-6 h-6" style={{ color: T.terra }} />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: T.text }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Process ──────────────────────────────────────────────────────────────────
function ProcessSection() {
  return (
    <section className="py-24" style={{ background: T.white }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>
            Simple. Personal. Yours.
          </h2>
        </div>
        <div className="relative">
          {/* vertical connector */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-px" style={{ background: T.sand }} />
          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 gap-8">
            {useData().process.map(({ step, title, desc }, i) => (
              <div key={i} className="relative rounded-2xl p-7 border text-center" style={{ background: T.cream, borderColor: T.border }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg mx-auto mb-5 border-2"
                  style={{ borderColor: T.terra, color: T.terra, background: T.white }}
                >
                  {step}
                </div>
                <h3 className="font-bold text-base mb-3" style={{ color: T.text }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Offers ───────────────────────────────────────────────────────────────────
function OffersSection() {
  return (
    <section id="offers" className="py-24" style={{ background: T.terra }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel light>Ways to Work Together</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black text-white">Choose your path</h2>
          <p className="mt-3 text-base" style={{ color: 'rgba(253,246,236,0.8)' }}>
            Every option is designed around you — not a rigid curriculum.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useData().offers.map((o, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-7 border flex flex-col ${o.highlight ? 'ring-2 ring-white' : ''}`}
              style={{
                background: o.highlight ? T.white : 'rgba(253,246,236,0.08)',
                borderColor: o.highlight ? T.white : 'rgba(253,246,236,0.2)',
              }}
            >
              {o.highlight && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                  style={{ background: T.creamDark, color: T.terraDark }}
                >
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: o.highlight ? T.muted : 'rgba(253,246,236,0.6)' }}>
                  {o.type}
                </p>
                <h3 className="text-xl font-black mb-1" style={{ color: o.highlight ? T.text : T.white }}>
                  {o.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black" style={{ color: o.highlight ? T.terra : T.creamDark }}>{o.price}</span>
                  <span className="text-sm" style={{ color: o.highlight ? T.muted : 'rgba(253,246,236,0.7)' }}>/ {o.duration}</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: o.highlight ? T.muted : 'rgba(253,246,236,0.85)' }}>
                {o.description}
              </p>
              <ul className="space-y-2 mb-8 flex-1">
                {o.includes.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: o.highlight ? T.text : 'rgba(253,246,236,0.9)' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: o.highlight ? T.terra : T.creamDark }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#book"
                className="mt-auto block text-center py-3 rounded-full font-bold text-sm transition-all hover:opacity-90"
                style={{
                  background: o.highlight ? T.terra : 'rgba(253,246,236,0.15)',
                  color: o.highlight ? T.white : T.white,
                  border: o.highlight ? 'none' : '1px solid rgba(253,246,236,0.3)',
                }}
              >
                {o.cta} <ArrowRight className="inline w-4 h-4 ml-1" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section className="py-24" style={{ background: T.cream }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Client Stories</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>
            In their own words
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useData().testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl p-7 border flex flex-col" style={{ background: T.white, borderColor: T.border }}>
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" style={{ color: '#f59e0b' }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed italic mb-5 flex-1" style={{ color: T.muted }}>"{t.quote}"</p>
              {/* Result pill */}
              <div className="rounded-lg px-3 py-2 text-xs font-semibold mb-5" style={{ background: '#fdf0e8', color: T.terra }}>
                ✦ {t.result}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: T.creamDark, color: T.terra }}
                >
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

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState(null)
  return (
    <section className="py-24" style={{ background: T.white }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Questions</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Things people often ask</h2>
        </div>
        <div className="space-y-3">
          {useData().faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.cream : T.white }}
              >
                {f.q}
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  style={{ color: T.terra }}
                />
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

// ─── Invitation / CTA ─────────────────────────────────────────────────────────
function InvitationSection() {
  const D = useData()
  const f = D.founder
  return (
    <section id="book" className="py-24 relative overflow-hidden" style={{ background: T.cream }}>
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-20" style={{ background: T.terraLight }} />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center border-2 font-black text-xl"
          style={{ borderColor: T.terra, background: T.creamDark, color: T.terra }}
        >
          {f.name.split(' ').map(n => n[0]).join('')}
        </div>
        <SectionLabel>Let's Connect</SectionLabel>
        <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: T.text }}>
          The first step is just a conversation
        </h2>
        <p className="text-base mb-2" style={{ color: T.muted }}>
          A free 30-minute Chemistry Call. No agenda, no sales pitch.
        </p>
        <p className="text-sm font-semibold mb-10" style={{ color: T.terra }}>
          ✦ Currently accepting 4 new clients for Q3 2025
        </p>
        <a
          href={f.calLink}
          className="inline-flex items-center justify-center px-10 py-4 rounded-full font-bold text-base text-white transition-all hover:opacity-90 shadow-lg mb-10"
          style={{ background: T.terra }}
        >
          <Calendar className="w-5 h-5 mr-2" /> Book Your Free Chemistry Call
        </a>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm" style={{ color: T.muted }}>
          <a href={`tel:${f.phone}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <Phone className="w-4 h-4" style={{ color: T.terra }} /> {f.phone}
          </a>
          <a href={`mailto:${f.email}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <Mail className="w-4 h-4" style={{ color: T.terra }} /> {f.email}
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
    <footer style={{ background: T.creamDark, borderTop: `1px solid ${T.border}` }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="font-black text-xl mb-1" style={{ color: T.text }}>{f.name}</p>
            <p className="text-sm mb-4" style={{ color: T.terra }}>{f.title}</p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: T.muted }}>
              Life & career transformation coaching for women navigating change.
              Fully online · {f.location}.
            </p>
            <div className="flex items-center gap-2 text-sm" style={{ color: T.muted }}>
              <span style={{ color: T.terra }}>✦</span> Accepting new clients for Q3 2025
            </div>
          </div>
          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.terra }}>Quick Links</p>
            <ul className="space-y-2 text-sm" style={{ color: T.muted }}>
              {[['#transformation','The Journey'],['#offers','Work With Me'],['#book','Free Chemistry Call'],['#','Privacy Policy'],['#','Coaching Agreement']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:opacity-70 transition-opacity">{label}</a></li>
              ))}
            </ul>
          </div>
          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.terra }}>Connect</p>
            <ul className="space-y-3 text-sm" style={{ color: T.muted }}>
              <li><a href={`mailto:${f.email}`} className="hover:opacity-70 transition-opacity">{f.email}</a></li>
              <li><a href={`tel:${f.phone}`} className="hover:opacity-70 transition-opacity">{f.phone}</a></li>
              <li>{f.location}</li>
            </ul>
            <a
              href={f.calLink}
              className="inline-flex items-center mt-5 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: T.terra }}
            >
              Book Free Chemistry Call
            </a>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderTop: `1px solid ${T.border}`, color: T.muted }}>
          <span>© {new Date().getFullYear()} {f.name}. All rights reserved.</span>
          <Link href="/templates" className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity" style={{ color: T.muted }}>
            ← Browse all templates on OPC Genie
          </Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// `data` prop: when rendered from /[username] this is the live wizard payload.
// When browsed standalone at /templates/coach-mentor it is undefined,
// so payloadToData(undefined) returns SAMPLE — the preview is unchanged.
export default function CoachMentorTemplate({ data }) {
  const resolved = payloadToData(data)
  return (
    <DataCtx.Provider value={resolved}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <TemplateNav />
        <HeroSection />
        <TransformationSection />
        <ForWhoSection />
        <ProcessSection />
        <OffersSection />
        <TestimonialsSection />
        <FAQSection />
        <InvitationSection />
        <TemplateFooter />
      </div>
    </DataCtx.Provider>
  )
}
