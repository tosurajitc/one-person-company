'use client'

import Link from 'next/link'
import {
  ArrowRight, CheckCircle, Star, ChevronDown, Phone, Mail,
  ExternalLink, Figma, Code2, Layers, Zap, Monitor, Play,
  Instagram, Twitter, Linkedin, MousePointer2, Download, Package
} from 'lucide-react'
import { useState, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  violet:      '#6d28d9',
  violetDark:  '#4c1d95',
  violetLight: '#a78bfa',
  lime:        '#a3e635',
  limeDark:    '#65a30d',
  limeLight:   '#d9f99d',
  black:       '#0d0d0d',
  surface:     '#111111',
  card:        '#1a1a1a',
  border:      '#2a2a2a',
  text:        '#f5f5f5',
  muted:       '#a0a0a0',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  founder: {
    name:      'Aryan Kapoor',
    title:     'Brand Designer & Creative Director',
    tagline:   'I design brands that make people stop scrolling.',
    bio:       "I've spent 8 years building visual identities for D2C brands, funded startups, and solo founders who know their work deserves to look as good as it actually is. My process is fast, opinionated, and built for founders who hate boring.",
    skills:    ['Brand Identity', 'UI / UX Design', 'Motion & Animation', 'Webflow Development'],
    location:  'Bangalore · Remote Worldwide',
    phone:     '+91 96300 00000',
    email:     'aryan@kapoordesign.studio',
    calLink:   '#enquire',
    youtube:   null,
    social:    { instagram: '#', twitter: '#', linkedin: '#' },
  },
  stats: [
    { number: '80+', label: 'Brands Designed' },
    { number: '8 Yrs', label: 'Experience' },
    { number: '4.9★', label: 'Avg Client Rating' },
    { number: '< 2 wk', label: 'Typical Turnaround' },
  ],
  portfolio: [
    { title: 'NourishBox Rebrand',    category: 'Brand Identity',      tags: ['Logo', 'Packaging', 'Guideline'], color: '#1a1a2e' },
    { title: 'Finflux Dashboard',     category: 'UI / UX Design',      tags: ['Figma', 'Design System', 'Prototype'], color: '#0f3460' },
    { title: 'Zestea Launch Campaign',category: 'Motion & Animation',   tags: ['After Effects', 'Reels', 'Ads'], color: '#16213e' },
    { title: 'Bloom Studio Website',  category: 'Webflow Development',  tags: ['Webflow', 'CMS', 'SEO'], color: '#1b1b2f' },
    { title: 'Katha Books Identity',  category: 'Brand Identity',       tags: ['Logo', 'Typography', 'Merch'], color: '#2d1b69' },
    { title: 'Playful App UI Kit',    category: 'UI / UX Design',       tags: ['Design System', 'Components'], color: '#1c0536' },
  ],
  services: [
    {
      icon:  Layers,
      title: 'Brand Identity',
      desc:  'Logo, colour palette, typography, brand guidelines — everything you need to look consistent everywhere.',
      tags:  ['Logo Design', 'Brand Guide', 'Stationery'],
    },
    {
      icon:  Monitor,
      title: 'UI / UX Design',
      desc:  'High-fidelity product screens, design systems, and interactive prototypes that developers actually enjoy building from.',
      tags:  ['Figma', 'Prototype', 'Design System'],
    },
    {
      icon:  Zap,
      title: 'Motion & Content',
      desc:  'Animated brand intros, social reels, and ad creatives that stop thumbs mid-scroll.',
      tags:  ['After Effects', 'Reels', 'Ad Creatives'],
    },
    {
      icon:  Code2,
      title: 'Webflow Development',
      desc:  'Pixel-perfect no-code websites with CMS, animations, and SEO baked in from the start.',
      tags:  ['Webflow', 'CMS', 'SEO'],
    },
  ],
  process: [
    { step: '01', title: 'Project Brief',    desc: 'Fill in a short brief — your business, goals, and what good looks like for you. I review and respond within 24 hours.' },
    { step: '02', title: 'Discovery & Mood', desc: 'A focused call to align on direction. I send a mood board and creative brief for your sign-off before a pixel is made.' },
    { step: '03', title: 'Design & Deliver', desc: 'I work fast and share progress as I go. Most projects are done in 1–2 weeks with 2 rounds of revisions included.' },
  ],
  offers: [
    {
      name:        'Brand Starter',
      price:       '₹25,000',
      duration:    '5 days',
      type:        'Package',
      description: 'Logo, colour palette, and a one-page brand guide. Everything you need to launch looking polished.',
      includes:    ['3 logo concepts', 'Chosen direction refined', 'Colour + typography guide', 'Final files (SVG, PNG, PDF)'],
      cta:         'Get Started',
      highlight:   false,
    },
    {
      name:        'Full Brand Identity',
      price:       '₹75,000',
      duration:    '2 weeks',
      type:        'Signature',
      description: 'Complete visual identity — logo, brand guide, stationery, social templates, and a Webflow landing page.',
      includes:    ['Everything in Brand Starter', '20+ brand guideline pages', 'Social media templates', 'Business cards + letterhead', 'Webflow 1-pager'],
      cta:         'Book This Project',
      highlight:   true,
    },
    {
      name:        'Design Retainer',
      price:       '₹35,000',
      duration:    'per month',
      type:        'Ongoing',
      description: 'Your design team of one. Ad creatives, pitch decks, social posts, and UI tweaks — all handled on-demand.',
      includes:    ['Up to 30 design hours/month', 'Same-day turnaround on small tasks', 'Shared Figma workspace', 'Monthly design review call'],
      cta:         'Apply for Retainer',
      highlight:   false,
    },
  ],
  digitalProduct: {
    enabled: true,
    name: 'Figma Design System & UI Starter Kit',
    summary: 'A production-ready UI kit with 200+ components, auto-layout tokens, and light/dark modes for fast prototyping.',
    link: '#buy-kit',
    price: '₹1,999',
  },
  testimonials: [
    {
      name:   'Sneha Rawat',
      role:   'Founder, NourishBox',
      rating: 5,
      quote:  "Aryan didn\u2019t just design a logo \u2014 he understood our brand soul. We went from generic to genuinely premium overnight.",
      result: 'Brand refresh led to 3\u00d7 increase in DTC conversions',
    },
    {
      name:   'Karan Mehta',
      role:   'CEO, Finflux',
      rating: 5,
      quote:  "The design system he built has saved our dev team weeks every sprint. Absolute clarity in every component.",
      result: 'Dashboard redesign shipped in 11 days',
    },
    {
      name:   'Ria Desai',
      role:   'Creative Director, Zestea',
      rating: 5,
      quote:  "Fast, clean, and he actually pushes back when you\u2019re about to make a bad creative decision. That\u2019s rare.",
      result: 'Launch campaign reel hit 2.4M organic views',
    },
  ],
  faqs: [
    { q: 'How does the project enquiry work?',         a: 'Fill the enquiry form with your brief. I respond within 24 hours with a timeline and quote. No discovery call needed upfront.' },
    { q: 'Do you work with early-stage startups?',     a: 'Yes \u2014 a significant portion of my clients are pre-revenue or recently funded. Good design isn\u2019t a luxury, it\u2019s leverage.' },
    { q: 'What tools do you use?',                     a: 'Figma for UI/UX and brand work, After Effects + Premiere for motion, Webflow for no-code sites, Notion for project management.' },
    { q: 'How many revisions are included?',           a: 'Two rounds on every project. Additional rounds are billed at \u20b93,500/hr. Most projects land first-time within 2 rounds.' },
    { q: 'Can I see more portfolio work?',             a: 'Yes \u2014 the portfolio above shows a selection. DM me on Instagram or send an email and I\u2019ll share the full deck.' },
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
  const ch   = payload.channels   || {}
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
    type:        t.tier === 'recurring' ? 'Retainer' : t.tier === 'front_door' ? 'Package' : 'Project',
    description: t.summary || SAMPLE.offers[i]?.description || '',
    includes:    typeof t.deliverables === 'string' ? t.deliverables.split('\n').filter(Boolean) : Array.isArray(t.deliverables) ? t.deliverables.filter(Boolean) : (SAMPLE.offers[i]?.includes || []),
    cta:         SAMPLE.offers[i]?.cta || 'Get Started',
    highlight:   off.mostBought === t.tier,
  }))
  const mappedProcess = (know.process || []).filter(s => s?.title).map((s, i) => ({ step: String(i + 1).padStart(2, '0'), title: s.title, desc: s.detail || '' }))
  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer).map(f => ({ q: f.question, a: f.answer }))
  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote).map(t => ({ name: t.name || '', role: t.role || '', rating: 5, quote: t.quote, result: t.result || '' }))
  const social = ch.social || {}
  return {
    founder: {
      name:     o(owner.name, SAMPLE.founder.name),
      title:    o(owner.role, SAMPLE.founder.title),
      tagline:  tagline,
      bio:      o(pos.credibility, SAMPLE.founder.bio),
      skills:   a(prf.credentials, SAMPLE.founder.skills),
      location: o(`${biz.city || ''}${biz.country && biz.country !== 'India' ? ' · ' + biz.country : ''}`.trim(), SAMPLE.founder.location),
      phone:    o(owner.whatsapp, SAMPLE.founder.phone),
      email:    o(owner.email, SAMPLE.founder.email),
      calLink:  fd.bookingUrl || '#enquire',
      social:   { instagram: social.instagram || '#', twitter: social.x || '#', linkedin: social.linkedin || '#' },
    },
    stats:        SAMPLE.stats,
    portfolio:    SAMPLE.portfolio,
    services:     SAMPLE.services,
    process:      mappedProcess.length ? mappedProcess : SAMPLE.process,
    offers:       mappedOffers.length ? mappedOffers : SAMPLE.offers,
    digitalProduct: off.product?.name ? {
      enabled: Boolean(off.product.enabled !== false),
      name: off.product.name,
      summary: off.product.summary || '',
      link: off.product.link || '#buy-kit',
      price: off.product.priceInr ? `₹${Number(off.product.priceInr).toLocaleString('en-IN')}` : (off.product.priceUsd ? `$${off.product.priceUsd}` : SAMPLE.digitalProduct.price),
    } : SAMPLE.digitalProduct,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <span
      className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border"
      style={{ color: T.lime, borderColor: T.limeDark, background: 'rgba(163,230,53,0.08)' }}
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
      style={{ background: 'rgba(13,13,13,0.95)', borderColor: T.border }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="font-black text-lg" style={{ color: T.text }}>
          {D.founder.name}
          <span className="font-normal text-sm ml-2" style={{ color: T.muted }}>Studio</span>
        </span>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {[['#portfolio', 'Work'], ['#services', 'Services'], ['#enquire', 'Enquire']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-colors hover:opacity-70" style={{ color: T.muted }}>
              {label}
            </a>
          ))}
        </div>
        <a
          href="#enquire"
          className="px-5 py-2 rounded-lg font-bold text-sm transition-all hover:opacity-90"
          style={{ background: T.lime, color: T.black }}
        >
          Start a Project
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
    <section style={{ background: T.black }} className="pt-28 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-20" style={{ background: T.violet }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left copy */}
          <div>
            {/* Skills pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {f.skills.map((s, i) => (
                <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ borderColor: T.border, color: T.muted, background: T.card }}>
                  {s}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6" style={{ color: T.text }}>
              {f.tagline}
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: T.muted }}>
              {f.bio}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#portfolio"
                className="inline-flex items-center px-7 py-3.5 rounded-lg font-bold text-base transition-all hover:opacity-90"
                style={{ background: T.lime, color: T.black }}
              >
                View My Work <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              <a
                href="#enquire"
                className="inline-flex items-center px-7 py-3.5 rounded-lg font-bold text-base border transition-all hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: T.border, color: T.text }}
              >
                Start a Project
              </a>
            </div>
            <div className="flex items-center gap-4 mt-6">
              {[
                [Instagram, f.social.instagram],
                [Twitter,   f.social.twitter],
                [Linkedin,  f.social.linkedin],
              ].map(([Icon, href], i) => (
                <a key={i} href={href} className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all hover:border-violet-500" style={{ borderColor: T.border, color: T.muted }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
              <span className="text-xs ml-2" style={{ color: T.muted }}>{f.location}</span>
            </div>
          </div>

          {/* Right — avatar + stats */}
          <div className="flex flex-col items-center gap-6">
            {/* Avatar */}
            <div
              className="w-44 h-44 rounded-2xl flex items-center justify-center text-5xl font-black border-2"
              style={{ borderColor: T.violet, background: T.card, color: T.violetLight }}
            >
              {f.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: T.text }}>{f.name}</p>
              <p className="text-sm" style={{ color: T.muted }}>{f.title}</p>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {useData().stats.map((s, i) => (
                <div key={i} className="rounded-xl p-4 text-center border" style={{ background: T.card, borderColor: T.border }}>
                  <div className="text-2xl font-black" style={{ color: T.lime }}>{s.number}</div>
                  <div className="text-xs mt-1" style={{ color: T.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Video placeholder ── */}
        <div className="mt-16">
          <p className="text-center text-sm font-semibold mb-4" style={{ color: T.muted }}>
            Watch: My process — from brief to brand in under 3 minutes
          </p>
          <div
            className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center"
            style={{ background: T.card, borderColor: T.border, aspectRatio: '16/9' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer transition-transform hover:scale-105"
                  style={{ background: T.violet }}
                >
                  <Play className="w-8 h-8 ml-1" style={{ color: T.text }} />
                </div>
                <p className="text-sm font-medium" style={{ color: T.muted }}>Your intro video goes here</p>
                <p className="text-xs mt-1" style={{ color: '#444' }}>Paste a YouTube link in Settings → Brand → Intro Video</p>
              </div>
            </div>
            <div
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(109,40,217,0.2)', color: T.violetLight, border: `1px solid ${T.violet}` }}
            >
              ▶ 3 min process
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Portfolio grid ───────────────────────────────────────────────────────────
function PortfolioSection() {
  return (
    <section id="portfolio" className="py-24" style={{ background: T.surface }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <SectionLabel>Selected Work</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>
              Things I have built
            </h2>
          </div>
          <a href="#enquire" className="hidden sm:inline-flex items-center text-sm font-semibold gap-1.5" style={{ color: T.lime }}>
            Start a project <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {useData().portfolio.map((p, i) => (
            <div
              key={i}
              className="group relative rounded-2xl overflow-hidden border cursor-pointer"
              style={{ borderColor: T.border, background: p.color, aspectRatio: '4/3' }}
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: T.lime }}>{p.category}</p>
                <p className="font-bold text-base text-white mb-2">{p.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((tag, j) => (
                    <span key={j} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: '#e5e5e5' }}>{tag}</span>
                  ))}
                </div>
              </div>
              {/* Always-visible category label */}
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', color: T.muted }}>{p.category}</span>
              </div>
              {/* Initials placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black opacity-10 select-none" style={{ color: T.violetLight }}>
                  {p.title.split(' ').slice(0, 2).map(w => w[0]).join('')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Services ─────────────────────────────────────────────────────────────────
function ServicesSection() {
  return (
    <section id="services" className="py-24" style={{ background: T.black }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>What I Do</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Services</h2>
          <p className="mt-3 text-base" style={{ color: T.muted }}>
            Pick one or combine — most clients start with brand, then layer on UI or motion.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {useData().services.map(({ icon: Icon, title, desc, tags }, i) => (
            <div key={i} className="rounded-2xl p-7 border group hover:border-violet-700 transition-colors" style={{ background: T.card, borderColor: T.border }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(109,40,217,0.15)' }}>
                <Icon className="w-6 h-6" style={{ color: T.violetLight }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: T.text }}>{title}</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: T.muted }}>{desc}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, j) => (
                  <span key={j} className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ borderColor: T.border, color: T.muted }}>{tag}</span>
                ))}
              </div>
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
    <section className="py-24" style={{ background: T.surface }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Fast. Collaborative. Delivered.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useData().process.map(({ step, title, desc }, i) => (
            <div key={i} className="rounded-2xl p-7 border relative" style={{ background: T.card, borderColor: T.border }}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg mb-5"
                style={{ background: 'rgba(163,230,53,0.1)', color: T.lime, border: `1px solid rgba(163,230,53,0.3)` }}
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
    <section className="py-24" style={{ background: T.violetDark }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black text-white">Pick your package</h2>
          <p className="mt-3 text-base" style={{ color: T.violetLight }}>
            Transparent pricing. No surprise invoices.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useData().offers.map((o, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-7 border flex flex-col ${o.highlight ? 'ring-2 ring-lime-400' : ''}`}
              style={{
                background: o.highlight ? T.black : 'rgba(0,0,0,0.3)',
                borderColor: o.highlight ? T.lime : 'rgba(163,230,53,0.15)',
              }}
            >
              {o.highlight && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                  style={{ background: T.lime, color: T.black }}
                >
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: T.violetLight }}>{o.type}</p>
                <h3 className="text-xl font-black mb-1 text-white">{o.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black" style={{ color: T.lime }}>{o.price}</span>
                  <span className="text-sm" style={{ color: T.violetLight }}>/ {o.duration}</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: T.violetLight }}>{o.description}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {o.includes.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-white">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.lime }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#enquire"
                className="mt-auto block text-center py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90"
                style={{
                  background: o.highlight ? T.lime : 'rgba(163,230,53,0.12)',
                  color: o.highlight ? T.black : T.lime,
                  border: o.highlight ? 'none' : `1px solid rgba(163,230,53,0.3)`,
                }}
              >
                {o.cta} <ArrowRight className="inline w-4 h-4 ml-1" />
              </a>
            </div>
          ))}
        </div>

        {/* Digital Product / Asset Download */}
        {useData().digitalProduct?.enabled && useData().digitalProduct?.name && (
          <div className="mt-14 max-w-3xl mx-auto rounded-2xl p-6 md:p-8 border flex flex-col md:flex-row items-center justify-between gap-6"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(163,230,53,0.3)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(163,230,53,0.15)', color: T.lime }}>
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'rgba(163,230,53,0.2)', color: T.lime }}>
                  Digital Asset
                </span>
                <h3 className="text-lg font-black text-white mt-1">{useData().digitalProduct.name}</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: T.violetLight }}>{useData().digitalProduct.summary}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto justify-between md:justify-end">
              <span className="text-2xl font-black" style={{ color: T.lime }}>{useData().digitalProduct.price}</span>
              <a
                href={useData().digitalProduct.link || '#buy-kit'}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs transition-all hover:opacity-90 whitespace-nowrap"
                style={{ background: T.lime, color: T.black }}
              >
                <Download className="w-3.5 h-3.5" />
                Get Asset
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section className="py-24" style={{ background: T.black }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Client Love</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>What clients say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useData().testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl p-7 border flex flex-col" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" style={{ color: '#f59e0b' }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed italic mb-5 flex-1" style={{ color: T.muted }}>"{t.quote}"</p>
              <div
                className="rounded-lg px-3 py-2 text-xs font-semibold mb-5"
                style={{ background: 'rgba(163,230,53,0.08)', color: T.lime, border: `1px solid rgba(163,230,53,0.2)` }}
              >
                ✦ {t.result}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{ background: T.violetDark, color: T.violetLight }}
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
    <section className="py-24" style={{ background: T.surface }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Quick answers</h2>
        </div>
        <div className="space-y-3">
          {useData().faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.card : T.black }}
              >
                {f.q}
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  style={{ color: T.lime }}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.muted, background: T.card }}>
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
  const D = useData()
  const f = D.founder
  return (
    <section id="enquire" className="py-24 relative overflow-hidden" style={{ background: T.black }}>
      {/* Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-3xl opacity-15" style={{ background: T.violet }} />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center font-black text-xl border-2"
          style={{ borderColor: T.violet, background: T.card, color: T.violetLight }}
        >
          {f.name.split(' ').map(n => n[0]).join('')}
        </div>
        <SectionLabel>Start a Project</SectionLabel>
        <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: T.text }}>
          Got a project in mind?
        </h2>
        <p className="text-base mb-2" style={{ color: T.muted }}>
          Tell me what you need. I respond within 24 hours with a quote and timeline.
        </p>
        <p className="text-sm font-semibold mb-10" style={{ color: T.lime }}>
          ✦ Currently booking projects for Q3 2025 &mdash; 2 slots remaining
        </p>
        <a
          href={`mailto:${f.email}`}
          className="inline-flex items-center justify-center px-10 py-4 rounded-lg font-bold text-base transition-all hover:opacity-90 shadow-xl mb-10"
          style={{ background: T.lime, color: T.black }}
        >
          <Mail className="w-5 h-5 mr-2" /> Send a Project Brief
        </a>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm" style={{ color: T.muted }}>
          <a href={`tel:${f.phone}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <Phone className="w-4 h-4" style={{ color: T.lime }} /> {f.phone}
          </a>
          <a href={`mailto:${f.email}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <Mail className="w-4 h-4" style={{ color: T.lime }} /> {f.email}
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
    <footer style={{ background: '#0a0a0a', borderTop: `1px solid ${T.border}` }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="font-black text-xl mb-1" style={{ color: T.text }}>{f.name}</p>
            <p className="text-sm mb-4" style={{ color: T.lime }}>{f.title}</p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: T.muted }}>
              Brand design, UI/UX, motion & Webflow development for founders who
              refuse to look generic. {f.location}.
            </p>
            <div className="flex items-center gap-3">
              {[['Instagram', f.social.instagram], ['Twitter', f.social.twitter], ['LinkedIn', f.social.linkedin]].map(([name, href]) => (
                <a key={name} href={href} className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:border-violet-500" style={{ borderColor: T.border, color: T.muted }}>
                  {name}
                </a>
              ))}
            </div>
          </div>
          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.lime }}>Quick Links</p>
            <ul className="space-y-2 text-sm" style={{ color: T.muted }}>
              {[['#portfolio','Portfolio'],['#services','Services'],['#enquire','Start a Project'],['#','Privacy Policy'],['#','Project Terms']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.lime }}>Contact</p>
            <ul className="space-y-3 text-sm" style={{ color: T.muted }}>
              <li><a href={`mailto:${f.email}`} className="hover:text-white transition-colors">{f.email}</a></li>
              <li><a href={`tel:${f.phone}`} className="hover:text-white transition-colors">{f.phone}</a></li>
              <li>{f.location}</li>
            </ul>
            <a
              href={`mailto:${f.email}`}
              className="inline-flex items-center mt-5 px-5 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-90"
              style={{ background: T.lime, color: T.black }}
            >
              Send a Project Brief
            </a>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderTop: `1px solid ${T.border}`, color: T.muted }}>
          <span>© {new Date().getFullYear()} {f.name}. All rights reserved.</span>
          <Link href="/templates" className="inline-flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: T.muted }}>
            ← Browse all templates on OPC Genie
          </Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FreelancerCreativeTemplate({ data }) {
  const resolved = payloadToData(data)
  return (
    <DataCtx.Provider value={resolved}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <TemplateNav />
        <HeroSection />
        <PortfolioSection />
        <ServicesSection />
        <ProcessSection />
        <OffersSection />
        <TestimonialsSection />
        <FAQSection />
        <EnquirySection />
        <TemplateFooter />
      </div>
    </DataCtx.Provider>
  )
}
