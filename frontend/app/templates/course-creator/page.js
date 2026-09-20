'use client'

import Link from 'next/link'
import {
  ArrowRight, CheckCircle, Star, ChevronDown, Play, Mail, Phone,
  Calendar, BookOpen, Clock, Users, Award, Zap, Video, FileText,
  MessageCircle, ChevronRight, Globe, ChevronUp, Lock, Unlock
} from 'lucide-react'
import { useState, useEffect, useRef, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  teal:       '#0f766e',
  tealDark:   '#115e59',
  tealLight:  '#14b8a6',
  tealPale:   '#f0fdfa',
  amber:      '#f59e0b',
  amberDark:  '#d97706',
  amberLight: '#fcd34d',
  amberPale:  '#fffbeb',
  white:      '#ffffff',
  ink:        '#0c1a19',
  text:       '#134e4a',
  muted:      '#5f8785',
  border:     '#99f6e4',
  bg:         '#f0fdfa',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  founder: {
    name:        'Divya Menon',
    title:       'Data Analytics Educator & Career Coach',
    tagline:     'From spreadsheets to job offers — I teach working professionals to become data analysts in 12 weeks.',
    bio:         "I spent 6 years as a senior data analyst at Amazon and PhonePe before I realised that teaching was what I was actually meant to do. My students are mid-career professionals — not college kids — and my courses are built around getting them hired, not just certified.",
    credentials: ['Ex-Senior Analyst, Amazon & PhonePe', '2,400+ students enrolled', 'Avg salary jump: ₹8L after course'],
    location:    'Bangalore · Online Worldwide',
    phone:       '+91 94000 00000',
    email:       'divya@datawithdivya.in',
    calLink:     '#enrol',
    youtube:     null,
  },
  stats: [
    { number: '2,400+', label: 'Students Enrolled' },
    { number: '94%',    label: 'Placement Rate' },
    { number: '12 Wks', label: 'To Job-Ready' },
    { number: '4.9★',   label: 'Average Rating' },
  ],
  nextCohort: {
    date:     'August 4, 2025',
    seats:    8,
    deadline: 'July 28, 2025',
  },
  curriculum: [
    {
      week:    'Weeks 1–2',
      title:   'Foundations',
      lessons: ['Excel & Google Sheets mastery', 'Data types, cleaning & transformation', 'Statistical thinking for non-statisticians'],
      tag:     'Free preview available',
    },
    {
      week:    'Weeks 3–5',
      title:   'SQL & Databases',
      lessons: ['SQL from zero to advanced queries', 'Joins, subqueries, window functions', 'Real business datasets from Indian companies'],
      tag:     null,
    },
    {
      week:    'Weeks 6–8',
      title:   'Visualisation',
      lessons: ['Power BI end-to-end', 'Tableau fundamentals + dashboards', 'Storytelling with data for business stakeholders'],
      tag:     null,
    },
    {
      week:    'Weeks 9–11',
      title:   'Python for Analysts',
      lessons: ['Pandas, NumPy, and Matplotlib', 'Exploratory data analysis projects', 'Building a portfolio-ready analysis report'],
      tag:     null,
    },
    {
      week:    'Week 12',
      title:   'Career Sprint',
      lessons: ['Resume & LinkedIn overhaul', 'Mock interviews with industry panel', 'Job referrals through Divya\'s network'],
      tag:     'Placement support included',
    },
  ],
  courses: [
    {
      title:    'Data Analytics Bootcamp',
      subtitle: 'The flagship 12-week programme',
      level:    'Beginner → Job-Ready',
      duration: '12 weeks · 80+ hrs content',
      students: '1,800+ enrolled',
      rating:   4.9,
      reviews:  312,
      price:    '₹24,999',
      tags:     ['SQL', 'Power BI', 'Python', 'Tableau'],
      status:   'enrolling',
      badge:    'Most Popular',
    },
    {
      title:    'SQL for Data Analysis',
      subtitle: 'From zero to advanced in 4 weeks',
      level:    'Beginner',
      duration: '4 weeks · 28 hrs content',
      students: '3,200+ enrolled',
      rating:   4.8,
      reviews:  540,
      price:    '₹4,999',
      tags:     ['MySQL', 'PostgreSQL', 'Window Functions'],
      status:   'open',
      badge:    null,
    },
    {
      title:    'Power BI Masterclass',
      subtitle: 'Build dashboards that get you hired',
      level:    'Intermediate',
      duration: '3 weeks · 18 hrs content',
      students: '980+ enrolled',
      rating:   4.9,
      reviews:  187,
      price:    '₹3,499',
      tags:     ['Power BI', 'DAX', 'Data Modelling'],
      status:   'open',
      badge:    null,
    },
    {
      title:    'Python for Analysts',
      subtitle: 'Pandas, NumPy & real projects',
      level:    'Intermediate',
      duration: '5 weeks · 32 hrs content',
      students: '620+ enrolled',
      rating:   4.8,
      reviews:  98,
      price:    '₹5,999',
      tags:     ['Python', 'Pandas', 'NumPy', 'Matplotlib'],
      status:   'open',
      badge:    null,
    },
    {
      title:    'Excel & Sheets Mastery',
      subtitle: 'The analyst foundation every professional needs',
      level:    'Beginner',
      duration: '2 weeks · 12 hrs content',
      students: '4,100+ enrolled',
      rating:   4.7,
      reviews:  810,
      price:    'Free',
      tags:     ['Excel', 'Google Sheets', 'Pivot Tables'],
      status:   'free',
      badge:    'Free',
    },
    {
      title:    'Career Accelerator Workshop',
      subtitle: 'Resume, LinkedIn & mock interviews',
      level:    'All levels',
      duration: '1 day live workshop',
      students: 'Next batch: Aug 10',
      rating:   5.0,
      reviews:  64,
      price:    '₹1,999',
      tags:     ['Resume', 'LinkedIn', 'Interview Prep'],
      status:   'upcoming',
      badge:    'Live',
    },
  ],
  offers: [
    {
      name:        'Self-Paced Access',
      price:       '₹8,999',
      duration:    'Lifetime access',
      type:        'Recorded',
      description: 'All video lessons, projects, and resources. Learn at your own pace with community access included.',
      includes:    ['60+ hours of recorded lessons', 'All projects & datasets', 'Community forum access', 'Certificate of completion'],
      cta:         'Enrol Now',
      highlight:   false,
    },
    {
      name:        'Live Cohort',
      price:       '₹24,999',
      duration:    '12 weeks',
      type:        'Live + Recorded',
      description: 'Learn live with a small cohort. Weekly sessions, personal feedback, mock interviews, and job placement support.',
      includes:    ['Everything in Self-Paced', 'Weekly live sessions (3 hrs)', 'Personal feedback on projects', 'Mock interview panel', 'Placement support + referrals', '1-year community access'],
      cta:         'Join August Cohort',
      highlight:   true,
    },
    {
      name:        '1-on-1 Mentorship',
      price:       '₹6,000',
      duration:    'per session',
      type:        'Private',
      description: 'Personalised sessions for career pivots, interview prep, or getting unstuck on a specific skill.',
      includes:    ['60-min personalised session', 'Custom learning plan', 'Project review & feedback', 'Follow-up resources'],
      cta:         'Book a Session',
      highlight:   false,
    },
  ],
  testimonials: [
    {
      name:   'Ravi Kumar',
      role:   'Ex-Sales Executive → Data Analyst, Swiggy',
      rating: 5,
      quote:  "I had zero technical background. In 12 weeks, Divya took me from Excel basics to writing complex SQL queries and building dashboards. I got the Swiggy offer 3 weeks after the course ended.",
      jump:   '₹5.2L → ₹13.8L CTC',
    },
    {
      name:   'Neha Agarwal',
      role:   'Finance Manager → Business Analyst, Razorpay',
      rating: 5,
      quote:  "What makes Divya different is that she teaches you to think like an analyst, not just use tools. That mindset shift is what got me the job.",
      jump:   '₹9L → ₹18L CTC',
    },
    {
      name:   'Saurabh Tiwari',
      role:   'Fresher → Data Analyst, CRED',
      rating: 5,
      quote:  "The mock interview sessions were brutal — in the best way. When the real CRED interview came, it felt easy.",
      jump:   'First job: ₹12L CTC',
    },
  ],
  faqs: [
    { q: 'Do I need a technical background?',                a: 'Absolutely not. My most successful students came from sales, finance, HR, and operations. I teach everything from scratch.' },
    { q: 'How many hours per week does the live cohort need?', a: 'Expect 8–10 hours/week: 3 hours of live sessions, 3–4 hours of self-study, and 2–3 hours of project work.' },
    { q: 'What tools will I learn?',                         a: 'Excel, SQL (MySQL + PostgreSQL), Power BI, Tableau, and Python (Pandas, NumPy). All tools have free tiers — no paid software required.' },
    { q: 'Is the placement support guaranteed?',             a: 'I provide referrals and mock interview prep, but I cannot guarantee an offer. What I can tell you is that 94% of cohort students who completed all projects received an offer within 90 days.' },
    { q: 'Can I pay in instalments?',                        a: 'Yes — the Live Cohort can be split into 2 payments. EMI via Razorpay is also available at checkout.' },
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
    type:        t.tier === 'recurring' ? 'Monthly' : t.tier === 'front_door' ? 'Starter' : 'Full Course',
    description: t.summary || SAMPLE.offers[i]?.description || '',
    includes:    typeof t.deliverables === 'string' ? t.deliverables.split('\n').filter(Boolean) : Array.isArray(t.deliverables) ? t.deliverables.filter(Boolean) : (SAMPLE.offers[i]?.includes || []),
    cta:         SAMPLE.offers[i]?.cta || 'Enrol Now',
    highlight:   off.mostBought === t.tier,
  }))
  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer).map(f => ({ q: f.question, a: f.answer }))
  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote).map(t => ({ name: t.name || '', role: t.role || '', rating: 5, quote: t.quote, result: t.result || '' }))
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
      calLink:     fd.bookingUrl || '#enrol',
    },
    stats:        SAMPLE.stats,
    curriculum:   SAMPLE.curriculum,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    offers:       mappedOffers.length ? mappedOffers : SAMPLE.offers,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
    nextCohort:   SAMPLE.nextCohort,
    courses:      SAMPLE.courses,
  }
}

// ─── Reading-progress bar ─────────────────────────────────────────────────────
function ProgressBar() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setPct(total > 0 ? (scrolled / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1" style={{ background: 'rgba(15,118,110,0.15)' }}>
      <div className="h-full transition-all duration-100" style={{ width: `${pct}%`, background: T.amber }} />
    </div>
  )
}

// ─── Template nav ─────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  const { nextCohort } = D
  return (
    <nav
      className="fixed top-1 left-0 right-0 z-50 backdrop-blur-md"
      style={{ background: 'rgba(240,253,250,0.97)', borderBottom: `1px solid ${T.border}` }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <span className="font-black text-base" style={{ color: T.teal }}>
          {D.founder.name}
          <span className="font-normal text-xs ml-2 hidden sm:inline" style={{ color: T.muted }}>Data Analytics Course</span>
        </span>
        {/* Cohort urgency pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border" style={{ background: T.amberPale, borderColor: T.amberLight, color: T.amberDark }}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          Next cohort: {nextCohort.date} · {nextCohort.seats} seats left
        </div>
        <a
          href="#enrol"
          className="px-4 py-2 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: T.teal }}
        >
          Enrol Now
        </a>
      </div>
    </nav>
  )
}

// ─── Hero — full-width centred editorial layout ───────────────────────────────
function HeroSection() {
  const D = useData(); const f = D.founder
  const { nextCohort } = D
  return (
    <section style={{ background: T.ink }} className="relative overflow-hidden pt-24 pb-0">
      {/* Amber top rule */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: T.amber }} />

      {/* Large background numeral */}
      <div
        className="absolute right-0 top-8 text-[20rem] font-black leading-none select-none pointer-events-none opacity-[0.04]"
        style={{ color: T.tealLight }}
      >
        01
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-20">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold mb-8 uppercase tracking-widest"
          style={{ borderColor: 'rgba(20,184,166,0.3)', color: T.tealLight, background: 'rgba(20,184,166,0.07)' }}>
          <BookOpen className="w-3.5 h-3.5" /> {f.credentials[1]} · {f.credentials[0]}
        </div>

        {/* Headline — editorial large type */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] mb-8 text-white max-w-4xl mx-auto">
          {f.tagline}
        </h1>

        <p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
          {f.bio}
        </p>

        {/* Cohort urgency banner */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-4 rounded-2xl border mb-10"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.amber }} />
            <span className="text-sm font-bold" style={{ color: T.amberLight }}>Next Live Cohort: {nextCohort.date}</span>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: T.amber, color: T.ink }}>
            {nextCohort.seats} seats remaining · Closes {nextCohort.deadline}
          </span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <a
            href="#enrol"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-black text-base transition-all hover:opacity-90"
            style={{ background: T.amber, color: T.ink }}
          >
            Join August Cohort <ArrowRight className="w-5 h-5 ml-2" />
          </a>
          <a
            href="#curriculum"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-base border transition-all hover:bg-white hover:bg-opacity-5"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#e2e8f0' }}
          >
            See Curriculum
          </a>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {useData().stats.map((s, i) => (
            <div key={i} className="py-6 text-center" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div className="text-3xl font-black" style={{ color: T.amber }}>{s.number}</div>
              <div className="text-xs mt-1" style={{ color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Video placeholder — full-width at base of hero ── */}
      <div style={{ background: T.tealDark }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-center text-sm font-semibold mb-4" style={{ color: T.tealLight }}>
            Watch: What you will learn and what your career looks like after
          </p>
          <div
            className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center"
            style={{ background: T.tealDark, borderColor: 'rgba(20,184,166,0.2)', aspectRatio: '16/9' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer transition-transform hover:scale-105"
                  style={{ background: T.amber }}
                >
                  <Play className="w-8 h-8 ml-1" style={{ color: T.ink }} />
                </div>
                <p className="text-sm font-medium" style={{ color: T.tealLight }}>Your intro video goes here</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(20,184,166,0.5)' }}>Paste a YouTube link in Settings → Brand → Intro Video</p>
              </div>
            </div>
            <div
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(245,158,11,0.15)', color: T.amberLight, border: `1px solid rgba(245,158,11,0.3)` }}
            >
              ▶ 5 min overview
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Curriculum — horizontal tab layout ──────────────────────────────────────
function CurriculumSection() {
  const [active, setActive] = useState(0)
  const cur = useData().curriculum[active]
  return (
    <section id="curriculum" className="py-24" style={{ background: T.white }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial section heading */}
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: T.border }}>02</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.teal }}>What you will learn</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>12-week curriculum</h2>
            <p className="mt-2 text-base" style={{ color: T.muted }}>Every week is a building block. By Week 12 you have a portfolio, interview skills, and a network.</p>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
          {useData().curriculum.map((c, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: active === i ? T.teal : T.bg,
                color: active === i ? '#fff' : T.muted,
                border: `1px solid ${active === i ? T.teal : T.border}`,
              }}
            >
              {c.week}
            </button>
          ))}
        </div>

        {/* Active module card */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
          <div className="flex items-center justify-between px-7 py-5 border-b" style={{ background: T.teal, borderColor: 'rgba(255,255,255,0.1)' }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: T.tealLight }}>{cur.week}</p>
              <h3 className="text-xl font-black text-white">{cur.title}</h3>
            </div>
            {cur.tag && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: T.amber, color: T.ink }}>
                {cur.tag}
              </span>
            )}
          </div>
          <div className="px-7 py-6" style={{ background: T.tealPale }}>
            <ul className="space-y-3">
              {cur.lessons.map((lesson, j) => (
                <li key={j} className="flex items-start gap-3 text-base" style={{ color: T.text }}>
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: T.teal }} />
                  {lesson}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-between mt-4 text-sm" style={{ color: T.muted }}>
          <button
            onClick={() => setActive(Math.max(0, active - 1))}
            disabled={active === 0}
            className="flex items-center gap-1 disabled:opacity-30 hover:opacity-70 transition-opacity"
            style={{ color: T.teal }}
          >
            ← Previous module
          </button>
          <span>{active + 1} / {useData().curriculum.length}</span>
          <button
            onClick={() => setActive(Math.min(useData().curriculum.length - 1, active + 1))}
            disabled={active === useData().curriculum.length - 1}
            className="flex items-center gap-1 disabled:opacity-30 hover:opacity-70 transition-opacity"
            style={{ color: T.teal }}
          >
            Next module →
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials — editorial blockquote style ────────────────────────────────
function TestimonialsSection() {
  const [active, setActive] = useState(0)
  const t = useData().testimonials[active]
  return (
    <section className="py-24" style={{ background: T.ink }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial heading */}
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: 'rgba(255,255,255,0.04)' }}>03</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.tealLight }}>Student outcomes</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Real people. Real jobs.</h2>
          </div>
        </div>

        {/* Large blockquote */}
        <div className="relative">
          <div
            className="text-7xl font-black leading-none absolute -top-4 -left-2 select-none"
            style={{ color: T.amber, opacity: 0.3 }}
          >
            "
          </div>
          <blockquote className="pl-8 pr-4">
            <p className="text-2xl md:text-3xl font-semibold leading-snug text-white mb-8">
              {t.quote}
            </p>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base"
                  style={{ background: T.teal, color: '#fff' }}
                >
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>{t.role}</p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-full font-bold text-sm" style={{ background: T.amber, color: T.ink }}>
                ↑ {t.jump}
              </div>
            </div>
          </blockquote>
        </div>

        {/* Switcher dots */}
        <div className="flex items-center gap-3 mt-10 pl-8">
          {useData().testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: active === i ? T.amber : 'rgba(255,255,255,0.2)' }}
            />
          ))}
          <span className="text-xs ml-2" style={{ color: '#64748b' }}>
            {active + 1} of {useData().testimonials.length} stories
          </span>
        </div>
      </div>
    </section>
  )
}

// ─── Offers ───────────────────────────────────────────────────────────────────
function OffersSection() {
  return (
    <section id="enrol" className="py-24" style={{ background: T.bg }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial heading */}
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: T.border }}>04</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.teal }}>Enrolment</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Choose how you learn</h2>
            <p className="mt-2 text-base" style={{ color: T.muted }}>All tiers include lifetime access to recordings after the cohort ends.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {useData().offers.map((o, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border flex flex-col overflow-hidden ${o.highlight ? 'ring-2' : ''}`}
              style={{
                background: o.highlight ? T.teal : T.white,
                borderColor: o.highlight ? T.teal : T.border,
                ringColor: T.teal,
              }}
            >
              {/* Top amber strip on highlight */}
              {o.highlight && <div className="h-1" style={{ background: T.amber }} />}
              <div className="p-7 flex flex-col flex-1">
                {o.highlight && (
                  <span className="inline-block text-xs font-bold mb-3 px-3 py-1 rounded-full self-start"
                    style={{ background: T.amber, color: T.ink }}>
                    Recommended
                  </span>
                )}
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: o.highlight ? T.tealLight : T.muted }}>{o.type}</p>
                <h3 className="text-xl font-black mb-1" style={{ color: o.highlight ? '#fff' : T.text }}>{o.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black" style={{ color: o.highlight ? T.amberLight : T.teal }}>{o.price}</span>
                  <span className="text-sm" style={{ color: o.highlight ? T.tealLight : T.muted }}>/ {o.duration}</span>
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: o.highlight ? '#a7f3d0' : T.muted }}>{o.description}</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {o.includes.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: o.highlight ? '#ccfbf1' : T.text }}>
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: o.highlight ? T.amberLight : T.teal }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className="mt-auto block text-center py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                  style={{
                    background: o.highlight ? T.amber : T.tealPale,
                    color: o.highlight ? T.ink : T.teal,
                    border: o.highlight ? 'none' : `1px solid ${T.border}`,
                  }}
                >
                  {o.cta} <ArrowRight className="inline w-4 h-4 ml-1" />
                </a>
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: '#f1f5f9' }}>05</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.teal }}>Common questions</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Before you enrol</h2>
          </div>
        </div>
        <div className="space-y-3">
          {useData().faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.tealPale : T.white }}
              >
                {f.q}
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  style={{ color: T.teal }}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.muted, background: T.tealPale }}>
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

// ─── Final CTA ────────────────────────────────────────────────────────────────
function CTASection() {
  const D = useData(); const f = D.founder
  const { nextCohort } = D
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: T.teal }}>
      {/* Large background numeral */}
      <div
        className="absolute right-0 bottom-0 text-[18rem] font-black leading-none select-none pointer-events-none opacity-[0.06]"
        style={{ color: '#fff' }}
      >
        06
      </div>
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.tealLight }}>Limited seats</p>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
          Your data career starts<br />on August 4.
        </h2>
        <p className="text-base mb-2" style={{ color: '#a7f3d0' }}>
          {nextCohort.seats} seats left in the next live cohort. Enrolment closes {nextCohort.deadline}.
        </p>
        <p className="text-sm font-semibold mb-10" style={{ color: T.amberLight }}>
          ✦ 94% placement rate · Average salary jump of ₹8L
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <a
            href="#"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-black text-base transition-all hover:opacity-90 shadow-xl"
            style={{ background: T.amber, color: T.ink }}
          >
            Join August Cohort — ₹24,999
          </a>
          <a
            href={`mailto:${f.email}`}
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-bold text-base border transition-all hover:bg-white hover:bg-opacity-10"
            style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
          >
            <Mail className="w-5 h-5 mr-2" /> Ask a Question
          </a>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm" style={{ color: 'rgba(167,243,208,0.7)' }}>
          <span>{f.phone}</span>
          <span>{f.email}</span>
          <span>{f.location}</span>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function TemplateFooter() {
  const D = useData(); const f = D.founder
  return (
    <footer style={{ background: T.ink, borderTop: `1px solid rgba(255,255,255,0.06)` }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="font-black text-xl text-white mb-1">{f.name}</p>
            <p className="text-sm mb-4" style={{ color: T.tealLight }}>{f.title}</p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#64748b' }}>
              Practical data analytics education for working professionals ready to change careers.
              {f.location}.
            </p>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
              <span style={{ color: T.amber }}>✦</span> {D.nextCohort.seats} seats left · August cohort
            </div>
          </div>
          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.amber }}>Quick Links</p>
            <ul className="space-y-2 text-sm" style={{ color: '#64748b' }}>
              {[['#curriculum','Curriculum'],['#enrol','Enrolment & Pricing'],['#','Refund Policy'],['#','Privacy Policy'],['#','Student Login']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.amber }}>Contact</p>
            <ul className="space-y-3 text-sm" style={{ color: '#64748b' }}>
              <li><a href={`mailto:${f.email}`} className="hover:text-white transition-colors">{f.email}</a></li>
              <li><a href={`tel:${f.phone}`} className="hover:text-white transition-colors">{f.phone}</a></li>
              <li>{f.location}</li>
            </ul>
            <a
              href="#enrol"
              className="inline-flex items-center mt-5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: T.amber, color: T.ink }}
            >
              Enrol Now
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

// ─── Available Courses ────────────────────────────────────────────────────────
function CoursesSection() {
  const statusStyle = (status) => {
    if (status === 'enrolling') return { bg: T.amber,     text: T.ink,       label: 'Enrolling Now' }
    if (status === 'free')      return { bg: '#22c55e',   text: '#fff',       label: 'Free' }
    if (status === 'upcoming')  return { bg: T.tealLight, text: T.ink,        label: 'Live Upcoming' }
    return                             { bg: T.tealPale,  text: T.teal,       label: 'Open' }
  }

  return (
    <section id="courses" className="py-24" style={{ background: T.white }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial heading */}
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: '#f1f5f9' }}>03</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.teal }}>All Courses</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>
              Browse every course
            </h2>
            <p className="mt-2 text-base" style={{ color: T.muted }}>
              From free foundations to the full 12-week bootcamp — there is a starting point for every level.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useData().courses.map((c, i) => {
            const s = statusStyle(c.status)
            return (
              <div
                key={i}
                className="rounded-2xl border flex flex-col overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                style={{ borderColor: T.border, background: T.white }}
              >
                {/* Top colour bar */}
                <div className="h-1.5 w-full" style={{ background: c.status === 'free' ? '#22c55e' : c.status === 'enrolling' ? T.amber : T.teal }} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Badge row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: T.tealPale, color: T.teal }}>
                      {c.level}
                    </span>
                    {c.badge && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>
                        {c.badge}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-base mb-1" style={{ color: T.text }}>{c.title}</h3>
                  <p className="text-sm mb-4" style={{ color: T.muted }}>{c.subtitle}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs mb-4" style={{ color: T.muted }}>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.duration}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.students}</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`w-3.5 h-3.5 ${j < Math.floor(c.rating) ? 'fill-current' : 'opacity-20'}`} style={{ color: T.amber }} />
                      ))}
                    </div>
                    <span className="text-xs font-bold" style={{ color: T.amberDark }}>{c.rating}</span>
                    <span className="text-xs" style={{ color: T.muted }}>({c.reviews} reviews)</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {c.tags.map((tag, j) => (
                      <span key={j} className="text-[11px] font-semibold px-2 py-0.5 rounded-full border" style={{ borderColor: T.border, color: T.muted }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Price + CTA */}
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xl font-black" style={{ color: c.status === 'free' ? '#16a34a' : T.teal }}>{c.price}</span>
                    <a
                      href="#enrol"
                      className="inline-flex items-center px-4 py-2 rounded-lg font-bold text-xs transition-all hover:opacity-90"
                      style={{ background: s.bg, color: s.text }}
                    >
                      {s.label} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
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
      className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:opacity-90"
      style={{ background: T.teal }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 text-white" />
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CourseCreatorTemplate({ data }) {
  const resolved = payloadToData(data)
  return (
    <DataCtx.Provider value={resolved}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ProgressBar />
        <TemplateNav />
        <HeroSection />
        <CurriculumSection />
        <CoursesSection />
        <TestimonialsSection />
        <OffersSection />
        <FAQSection />
        <CTASection />
        <TemplateFooter />
        <ScrollToTop />
      </div>
    </DataCtx.Provider>
  )
}
