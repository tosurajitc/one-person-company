'use client'

import Link from 'next/link'
import {
  ArrowRight, CheckCircle, Star, ChevronDown, Phone, Mail,
  Play, Briefcase, LayoutGrid, RefreshCw, Layers, BarChart2,
  Globe, Clock, Repeat, Package, Zap, Shield
} from 'lucide-react'
import { useState, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  slate:      '#334155',
  slateDark:  '#1e293b',
  slateLight: '#64748b',
  cyan:       '#06b6d4',
  cyanDark:   '#0891b2',
  cyanLight:  '#67e8f9',
  cyanPale:   '#ecfeff',
  white:      '#ffffff',
  bg:         '#f8fafc',
  card:       '#ffffff',
  border:     '#e2e8f0',
  text:       '#0f172a',
  muted:      '#64748b',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  founder: {
    name:        'Rohan Singhania',
    title:       'Growth & Operations Specialist',
    tagline:     'The output of a full agency. The accountability of one person.',
    bio:         "I run a focused practice that does exactly what a 10-person growth agency does — strategy, execution, reporting — without the bloat, the hand-offs, or the account manager in the middle. One point of contact. Everything delivered.",
    credentials: ['Ex-VP Growth, Razorpay', 'B2B & D2C · 11 Years', 'Google & Meta Certified'],
    location:    'Delhi NCR · Remote India-wide',
    phone:       '+91 95100 00000',
    email:       'rohan@singhaniaops.com',
    calLink:     '#enquire',
    youtube:     null,
  },
  stats: [
    { number: '35+', label: 'Brands Scaled' },
    { number: '11 Yrs', label: 'Growth Experience' },
    { number: '₹80 Cr', label: 'Ad Spend Managed' },
    { number: '3.8×', label: 'Avg ROAS Delivered' },
  ],
  deliverables: [
    { icon: BarChart2, title: 'Growth Strategy',      desc: 'Channel mix, funnel architecture, and a 90-day sprint roadmap built around your revenue target.' },
    { icon: Globe,     title: 'Paid Media Execution', desc: 'Meta, Google, LinkedIn — full setup, creative testing, bidding, and weekly performance reports.' },
    { icon: Layers,    title: 'CRO & Landing Pages',  desc: 'A/B tested landing pages, checkout flow fixes, and conversion copy that moves the needle.' },
    { icon: RefreshCw, title: 'Retention & CRM',      desc: 'Email sequences, WhatsApp flows, and loyalty systems that turn one-time buyers into repeat revenue.' },
    { icon: BarChart2, title: 'Analytics & BI',       desc: 'GA4, Mixpanel, or custom Looker dashboards — you always know exactly what your numbers mean.' },
    { icon: Briefcase, title: 'Fractional CMO',       desc: 'Attend your leadership meetings, align teams, and own the marketing function end-to-end as your part-time CMO.' },
  ],
  process: [
    { step: '01', title: 'Audit & Brief',   desc: 'I audit your current funnel, ad accounts, and analytics in 48 hours and deliver a written assessment with quick wins.' },
    { step: '02', title: 'Sprint Planning', desc: 'Together we prioritise the highest-leverage activities for the next 90 days. You approve the plan before work begins.' },
    { step: '03', title: 'Execute & Report', desc: 'Weekly async updates, monthly strategy reviews, and a shared dashboard so you always see what is happening and why.' },
  ],
  offers: [
    {
      name:        'Growth Audit',
      price:       '₹15,000',
      duration:    '48 hrs',
      type:        'One-time',
      description: 'A written audit of your funnel, ad accounts, and analytics. You get a prioritised list of fixes and a 90-day opportunity map.',
      includes:    ['Funnel & conversion audit', 'Ad account review', 'Analytics health check', 'Written report + recommendations'],
      cta:         'Order an Audit',
      highlight:   false,
    },
    {
      name:        '90-Day Growth Sprint',
      price:       '₹1,20,000',
      duration:    '3 months',
      type:        'Project',
      description: 'Three months of focused execution — strategy, paid media, CRO, and reporting. One deliverable ladder, one accountable person.',
      includes:    ['Growth strategy + roadmap', 'Full paid media management', 'Landing page builds (up to 3)', 'Weekly reports + monthly review', 'Dedicated Slack channel'],
      cta:         'Start a Sprint',
      highlight:   true,
    },
    {
      name:        'Fractional CMO',
      price:       '₹80,000',
      duration:    'per month',
      type:        'Retainer',
      description: 'Your part-time growth lead. I own the full marketing function — strategy, team management, vendor oversight, and board-level reporting.',
      includes:    ['Weekly leadership sync', 'Full team & vendor oversight', 'Board / investor reporting', 'Hiring & agency briefs', 'On-call Slack access'],
      cta:         'Apply for Retainer',
      highlight:   false,
    },
  ],
  caseStudies: [
    {
      client:  'D2C Supplements Brand',
      result:  'Revenue 3.2× in 90 days',
      detail:  'Rebuilt Meta ad structure from scratch, launched a new landing page, and introduced post-purchase email flow. ROAS went from 1.8× to 4.6×.',
      metric:  'ROAS: 1.8× → 4.6×',
      sector:  'D2C / Health',
    },
    {
      client:  'B2B SaaS — HR Tech',
      result:  'CAC cut by 38%',
      detail:  'Rebuilt LinkedIn lead gen campaigns, introduced a content-led SEO strategy, and rebuilt the demo-booking funnel with a 2-step qualification form.',
      metric:  'CAC: ₹12,400 → ₹7,700',
      sector:  'B2B SaaS',
    },
    {
      client:  'Quick Commerce Startup',
      result:  'First 10,000 orders in 6 weeks',
      detail:  'Designed the full launch playbook — influencer seeding, Google Performance Max, and a referral loop. Hit 10k orders 3 weeks ahead of schedule.',
      metric:  'CAC: ₹190 at scale',
      sector:  'Quick Commerce',
    },
  ],
  testimonials: [
    {
      name:   'Aditya Sharma',
      role:   'Founder, HealthFirst D2C',
      rating: 5,
      quote:  "Rohan thinks like a founder, not a vendor. He came in, identified the real bottleneck in 48 hours, and fixed it before we even signed the full retainer.",
      result: '3.2\u00d7 revenue in one quarter',
    },
    {
      name:   'Pooja Nair',
      role:   'CEO, HRFlow SaaS',
      rating: 5,
      quote:  "I hired two agencies before Rohan. Neither could explain what they were doing or why. With him, I finally understand my own growth numbers.",
      result: 'CAC down 38%, pipeline up 2\u00d7',
    },
    {
      name:   'Kabir Malhotra',
      role:   'Co-founder, ZipQ Commerce',
      rating: 5,
      quote:  "He built our entire launch playbook and executed it himself. No briefing delays, no re-work. Just results, ahead of schedule.",
      result: '10,000 orders in 6 weeks',
    },
  ],
  faqs: [
    { q: 'What makes this different from hiring an agency?',        a: "You work directly with me \u2014 not a junior account manager. There\u2019s no handoff, no briefing lag, and I\u2019m accountable for results personally." },
    { q: 'Do you work with pre-revenue startups?',                  a: "My sweet spot is brands with some traction \u2014 typically \u20b91 Cr+ ARR or \u20b950L+ in monthly ad spend. For earlier-stage, the Growth Audit is the right starting point." },
    { q: 'Which ad platforms do you manage?',                       a: "Meta (Facebook + Instagram), Google (Search, Shopping, Performance Max), LinkedIn, and YouTube. I also work with programmatic DSPs for larger budgets." },
    { q: 'How do you report on results?',                           a: "Weekly async Loom updates + a live Looker Studio dashboard you can check any time. Monthly we do a 60-minute strategy review on Google Meet." },
    { q: 'Can I start with the audit and then move to the sprint?', a: "Absolutely \u2014 and most clients do. The audit becomes the brief for the sprint, so there\u2019s zero onboarding lag when we kick off." },
  ],
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
    type:        t.tier === 'recurring' ? 'Ongoing' : t.tier === 'front_door' ? 'One-time' : 'Project',
    description: t.summary || SAMPLE.offers[i]?.description || '',
    includes:    typeof t.deliverables === 'string' ? t.deliverables.split('\n').filter(Boolean) : Array.isArray(t.deliverables) ? t.deliverables.filter(Boolean) : (SAMPLE.offers[i]?.includes || []),
    cta:         SAMPLE.offers[i]?.cta || 'Get Started',
    highlight:   off.mostBought === t.tier,
  }))
  const mappedProcess = (know.process || []).filter(s => s?.title).map((s, i) => ({ step: String(i + 1).padStart(2, '0'), title: s.title, desc: s.detail || '' }))
  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer).map(f => ({ q: f.question, a: f.answer }))
  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote).map(t => ({ name: t.name || '', role: t.role || '', rating: 5, quote: t.quote }))
  const mappedCaseStudies = (prf.caseStudies || []).filter(c => c?.client || c?.result).map(c => ({ client: c.client || '', result: c.result || '', detail: c.whatYouDid || '', sector: '' }))
  return {
    founder: {
      name:        o(owner.name, SAMPLE.founder.name),
      title:       o(owner.role, SAMPLE.founder.title),
      tagline:     tagline,
      bio:         o(pos.credibility, SAMPLE.founder.bio),
      credentials: a(prf.credentials, SAMPLE.founder.credentials),
      location:    o(`${biz.city || ''}${biz.country && biz.country !== 'India' ? ' · ' + biz.country : ''}`.trim(), SAMPLE.founder.location),
      phone:       o(owner.whatsapp, SAMPLE.founder.phone),
      email:       o(owner.email, SAMPLE.founder.email),
      calLink:     fd.bookingUrl || '#contact',
    },
    stats:        SAMPLE.stats,
    deliverables: SAMPLE.deliverables,
    process:      mappedProcess.length ? mappedProcess : SAMPLE.process,
    offers:       mappedOffers.length ? mappedOffers : SAMPLE.offers,
    caseStudies:  mappedCaseStudies.length ? mappedCaseStudies : SAMPLE.caseStudies,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children, onDark }) {
  return (
    <span
      className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border"
      style={
        onDark
          ? { color: T.cyanLight, borderColor: T.cyanDark, background: 'rgba(6,182,212,0.1)' }
          : { color: T.cyan, borderColor: '#bae6fd', background: T.cyanPale }
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
      style={{ background: 'rgba(248,250,252,0.97)', borderColor: T.border }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="font-black text-lg" style={{ color: T.text }}>
          {D.founder.name}
          <span className="font-normal text-sm ml-2" style={{ color: T.muted }}>· Growth & Ops</span>
        </span>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {[['#deliverables', 'What I Do'], ['#offers', 'Packages'], ['#enquire', 'Enquire']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-colors hover:opacity-60" style={{ color: T.muted }}>
              {label}
            </a>
          ))}
        </div>
        <a
          href="#enquire"
          className="px-5 py-2 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: T.slate }}
        >
          Start a Project
        </a>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const D = useData(); const f = D.founder
  return (
    <section style={{ background: T.slateDark }} className="pt-28 pb-20 relative overflow-hidden">
      {/* Cyan accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: T.cyan }} />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 text-sm font-medium"
              style={{ borderColor: 'rgba(6,182,212,0.4)', color: T.cyanLight, background: 'rgba(6,182,212,0.08)' }}
            >
              <Shield className="w-4 h-4" />
              {f.credentials[0]} · {f.credentials[2]}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              {f.tagline}
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#94a3b8' }}>
              {f.bio}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#offers"
                className="inline-flex items-center px-7 py-3.5 rounded-lg font-bold text-base transition-all hover:opacity-90"
                style={{ background: T.cyan, color: T.slateDark }}
              >
                See Packages <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              <a
                href="#deliverables"
                className="inline-flex items-center px-7 py-3.5 rounded-lg font-bold text-base border transition-all hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#e2e8f0' }}
              >
                What I Deliver
              </a>
            </div>
            <p className="text-sm mt-6" style={{ color: '#64748b' }}>
              {f.location} · Available for new projects from July 2025
            </p>
          </div>

          {/* Right — avatar + stats */}
          <div className="flex flex-col items-center gap-6">
            <div
              className="w-44 h-44 rounded-2xl flex items-center justify-center text-5xl font-black border-2"
              style={{ borderColor: T.cyan, background: 'rgba(6,182,212,0.08)', color: T.cyan }}
            >
              {f.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{f.name}</p>
              <p className="text-sm" style={{ color: T.cyanLight }}>{f.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {useData().stats.map((s, i) => (
                <div key={i} className="rounded-xl p-4 text-center border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="text-2xl font-black" style={{ color: T.cyan }}>{s.number}</div>
                  <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Video placeholder ── */}
        <div className="mt-16">
          <p className="text-center text-sm font-semibold mb-4" style={{ color: '#94a3b8' }}>
            Watch: How I run a full growth function as one person
          </p>
          <div
            className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', aspectRatio: '16/9' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer transition-transform hover:scale-105"
                  style={{ background: T.cyan }}
                >
                  <Play className="w-8 h-8 ml-1" style={{ color: T.slateDark }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>Your intro video goes here</p>
                <p className="text-xs mt-1" style={{ color: '#475569' }}>Paste a YouTube link in Settings → Brand → Intro Video</p>
              </div>
            </div>
            <div
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(6,182,212,0.15)', color: T.cyanLight, border: `1px solid ${T.cyanDark}` }}
            >
              ▶ 4 min overview
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Deliverables ladder ──────────────────────────────────────────────────────
function DeliverablesSection() {
  return (
    <section id="deliverables" className="py-24" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>What I Deliver</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>
            Full-stack growth. Zero hand-offs.
          </h2>
          <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: T.muted }}>
            Every service is executed by me directly — not briefed out to a subcontractor you never meet.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useData().deliverables.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="rounded-2xl p-7 border group hover:border-cyan-400 transition-colors" style={{ background: T.card, borderColor: T.border }}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: T.cyanPale }}
              >
                <Icon className="w-6 h-6" style={{ color: T.cyan }} />
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>
            Audit. Plan. Execute. Report.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* connector */}
          <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-px" style={{ background: T.border }} />
          {useData().process.map(({ step, title, desc }, i) => (
            <div key={i} className="rounded-2xl p-7 border relative text-center" style={{ background: T.bg, borderColor: T.border }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base mx-auto mb-5 border-2"
                style={{ borderColor: T.cyan, color: T.cyan, background: T.white }}
              >
                {step}
              </div>
              <h3 className="font-bold text-base mb-3" style={{ color: T.text }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Offers ───────────────────────────────────────────────────────────────────
function OffersSection() {
  return (
    <section id="offers" className="py-24" style={{ background: T.slateDark }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel onDark>Packages</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black text-white">Transparent pricing. No surprises.</h2>
          <p className="mt-3 text-base" style={{ color: '#94a3b8' }}>
            Start with an audit, scale to a sprint, own the retainer.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useData().offers.map((o, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-7 border flex flex-col ${o.highlight ? 'ring-2' : ''}`}
              style={{
                background: o.highlight ? T.white : 'rgba(255,255,255,0.04)',
                borderColor: o.highlight ? T.cyan : 'rgba(255,255,255,0.08)',
                ringColor: T.cyan,
              }}
            >
              {o.highlight && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                  style={{ background: T.cyan, color: T.slateDark }}
                >
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: o.highlight ? T.muted : '#94a3b8' }}>{o.type}</p>
                <h3 className="text-xl font-black mb-1" style={{ color: o.highlight ? T.text : T.white }}>{o.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black" style={{ color: T.cyan }}>{o.price}</span>
                  <span className="text-sm" style={{ color: o.highlight ? T.muted : '#94a3b8' }}>/ {o.duration}</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: o.highlight ? T.muted : '#94a3b8' }}>{o.description}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {o.includes.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: o.highlight ? T.text : '#e2e8f0' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.cyan }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#enquire"
                className="mt-auto block text-center py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90"
                style={{
                  background: o.highlight ? T.cyan : 'rgba(6,182,212,0.12)',
                  color: o.highlight ? T.slateDark : T.cyanLight,
                  border: o.highlight ? 'none' : `1px solid rgba(6,182,212,0.25)`,
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

// ─── Case Studies ─────────────────────────────────────────────────────────────
function CaseStudiesSection() {
  return (
    <section className="py-24" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Case Studies</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Results I have driven</h2>
          <p className="mt-3 text-base" style={{ color: T.muted }}>Numbers from real campaigns, shared with client permission.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useData().caseStudies.map((c, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border" style={{ borderColor: T.border }}>
              <div className="h-1.5 w-full" style={{ background: T.cyan }} />
              <div className="p-6" style={{ background: T.card }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: T.muted }}>{c.sector}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: T.cyanPale, color: T.cyanDark }}>{c.metric}</span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: T.muted }}>{c.client}</p>
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

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section className="py-24" style={{ background: T.white }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Client Voices</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>What founders say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useData().testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl p-7 border flex flex-col" style={{ background: T.bg, borderColor: T.border }}>
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" style={{ color: '#f59e0b' }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed italic mb-5 flex-1" style={{ color: T.muted }}>"{t.quote}"</p>
              <div className="rounded-lg px-3 py-2 text-xs font-semibold mb-5" style={{ background: T.cyanPale, color: T.cyanDark }}>
                ✦ {t.result}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: T.slateDark, color: T.cyan }}>
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
    <section className="py-24" style={{ background: T.bg }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Common questions</h2>
        </div>
        <div className="space-y-3">
          {useData().faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.cyanPale : T.white }}
              >
                {f.q}
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  style={{ color: T.cyan }}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.muted, background: T.cyanPale }}>
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

// ─── Enquiry / CTA ────────────────────────────────────────────────────────────
function EnquirySection() {
  const D = useData(); const f = D.founder
  return (
    <section id="enquire" className="py-24" style={{ background: T.slateDark }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center font-black text-xl border-2"
          style={{ borderColor: T.cyan, background: 'rgba(6,182,212,0.08)', color: T.cyan }}
        >
          {f.name.split(' ').map(n => n[0]).join('')}
        </div>
        <SectionLabel onDark>Start a Project</SectionLabel>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
          Ready to scale with precision?
        </h2>
        <p className="text-base mb-2" style={{ color: '#94a3b8' }}>
          Start with the Growth Audit — it pays for itself in the first week.
        </p>
        <p className="text-sm font-semibold mb-10" style={{ color: T.cyanLight }}>
          ✦ Taking on 2 new projects for Q3 2025
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <a
            href={f.calLink}
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-bold text-base transition-all hover:opacity-90"
            style={{ background: T.cyan, color: T.slateDark }}
          >
            Order a Growth Audit
          </a>
          <a
            href={`mailto:${f.email}`}
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-bold text-base border transition-all hover:bg-white hover:bg-opacity-5"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#e2e8f0' }}
          >
            <Mail className="w-5 h-5 mr-2" /> Send a Brief
          </a>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm" style={{ color: '#64748b' }}>
          <a href={`tel:${f.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
            <Phone className="w-4 h-4" style={{ color: T.cyan }} /> {f.phone}
          </a>
          <a href={`mailto:${f.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
            <Mail className="w-4 h-4" style={{ color: T.cyan }} /> {f.email}
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function TemplateFooter() {
  const D = useData(); const f = D.founder
  return (
    <footer style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="font-black text-xl text-white mb-1">{f.name}</p>
            <p className="text-sm mb-4" style={{ color: T.cyanLight }}>{f.title}</p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#64748b' }}>
              Growth strategy and paid media execution for Indian brands ready to scale.
              Based in {f.location}.
            </p>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
              <span style={{ color: T.cyan }}>✦</span> Available for new projects from July 2025
            </div>
          </div>
          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.cyan }}>Quick Links</p>
            <ul className="space-y-2 text-sm" style={{ color: '#64748b' }}>
              {[['#deliverables','What I Deliver'],['#offers','Packages & Pricing'],['#enquire','Start a Project'],['#','Privacy Policy'],['#','Engagement Terms']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.cyan }}>Get in Touch</p>
            <ul className="space-y-3 text-sm" style={{ color: '#64748b' }}>
              <li><a href={`mailto:${f.email}`} className="hover:text-white transition-colors">{f.email}</a></li>
              <li><a href={`tel:${f.phone}`} className="hover:text-white transition-colors">{f.phone}</a></li>
              <li>{f.location}</li>
            </ul>
            <a
              href="#enquire"
              className="inline-flex items-center mt-5 px-5 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-90"
              style={{ background: T.cyan, color: T.slateDark }}
            >
              Order a Growth Audit
            </a>
          </div>
        </div>
        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}
        >
          <span>© {new Date().getFullYear()} {f.name}. All rights reserved.</span>
          <Link href="/templates" className="hover:text-white transition-colors" style={{ color: '#475569' }}>
            ← Browse all templates on OPC Genie
          </Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AgencyOfOneTemplate({ data }) {
  const resolved = payloadToData(data)
  return (
    <DataCtx.Provider value={resolved}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <TemplateNav />
        <HeroSection />
        <DeliverablesSection />
        <ProcessSection />
        <OffersSection />
        <CaseStudiesSection />
        <TestimonialsSection />
        <FAQSection />
        <EnquirySection />
        <TemplateFooter />
      </div>
    </DataCtx.Provider>
  )
}
