'use client'

/**
 * Template 9 — Tutor / Training Centre
 * Section: Local & Trade Businesses
 * Theme: Warm · Sunflower #ca8a04 + Sky #0ea5e9
 *
 * DESIGN CONCEPT: "The Report Card"
 * ─────────────────────────────────────────────────────────────────────────────
 * Parents choosing a tuition centre are buying trust in someone else's hands
 * on their child's future. This template leans into that with:
 *
 *  • A hero built around outcomes (pass rate, avg. improvement) not slogans
 *  • A TRUST WALL — faculty experience, batch size cap, results, since-year
 *  • A SUBJECT GRID by class level — like a school prospectus, scannable
 *  • A BATCH TIMETABLE — the thing every parent actually needs to decide
 *  • A "HOW ENROLMENT WORKS" 4-step process ending in a free trial class
 *  • A TESTIMONIALS carousel labelled by parent + child's class ("Parent, Class 8")
 *  • An AI STUDY TOOLS section — doubt-clearing & progress-tracking add-ons
 *  • An FAQ built around parent objections (fees, missed classes, trial, refunds)
 *
 * DATA MAP — user_site_settings keys:
 *  general   → institute_name, tagline, location, phone, whatsapp, email
 *  brand     → primary_color, logo_url
 *  hero      → headline, subheadline, cta_text, hero_image_url
 *  about     → director_name, story, years_experience, faculty_count
 *  offers    → offers[] { title, description, price, duration, type }
 *  proof     → testimonials[] { name, role, quote, rating }, results[] { label, number }
 *  contact   → trial_class_url, whatsapp_number, form_enabled
 *  faq       → items[] { question, answer }
 *  agents    → agents[] { id, title, role, badge, description, samplePrompts, ratePerMinute, currency }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import {
  Phone, MessageCircle, MapPin, Star, ChevronDown, CheckCircle,
  ArrowRight, Shield, Clock, Award, Users, ThumbsUp, GraduationCap,
  ChevronLeft, ChevronRight, ChevronUp, Calendar, BadgeCheck, BookOpen,
  Sparkles, TrendingUp, FileCheck, ClipboardCheck, UserCheck, CalendarDays,
  School, PenTool, Target, Brain, MessagesSquare,
} from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Icon lookups (code-owned, never sent from the wizard) ───────────────────
const AGENT_ICON_MAP = {
  'doubt-clearing':    MessagesSquare,
  'study-plan':        Target,
  'weak-topic':        Brain,
  'progress-digest':   FileCheck,
}
const AGENT_ICON_FALLBACK = Sparkles

// ─── payloadToData ────────────────────────────────────────────────────────────
function payloadToData(payload) {
  if (!payload) return SAMPLE
  const biz   = payload.business      || {}
  const pos   = payload.positioning   || {}
  const prf   = payload.proof         || {}
  const fd    = payload.frontDoor     || {}
  const know  = payload.knowledge     || {}
  const off   = payload.offers        || {}
  const td    = payload.template_data || {}
  const owner = biz.owner || {}
  const o = (v, fb) => (v && String(v).trim() ? v : fb)

  const mappedProcess = (know.process || []).filter(s => s?.title).map((s, i) => ({
    step:  String(i + 1).padStart(2, '0'),
    icon:  SAMPLE.process[i]?.icon || null,
    title: s.title,
    desc:  s.detail || '',
  }))

  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer)
    .map(f => ({ q: f.question, a: f.answer }))

  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote)
    .map(t => ({ name: t.name || '', role: t.role || 'Parent', rating: 5, text: t.quote }))

  // Offers → a single "Our Programs" subject group when the wizard supplies them;
  // otherwise keep the richer class-level sample grid for the live preview.
  const wizardOffers = Array.isArray(off.items) ? off.items : Array.isArray(off) ? off : []
  const mappedSubjects = wizardOffers.filter(x => x?.title).map(x => ({
    name:     x.title,
    price:    x.price ? `₹${x.price}` : 'Contact us',
    duration: x.duration || 'Flexible batches',
  }))
  const subjectGroups = mappedSubjects.length
    ? [{ level: 'Our Programs', icon: BookOpen, color: T.sunflower, items: mappedSubjects }]
    : SAMPLE.subjectGroups

  const mappedAgents = Array.isArray(payload.agents) ? payload.agents.filter(a => a?.title).map(a => ({
    id:             a.id,
    title:          a.title,
    role:           a.role || '',
    badge:          a.badge || null,
    description:    a.description || '',
    samplePrompts:  (a.samplePrompts || []).slice(0, 2),
    ratePerMinute:  a.ratePerMinute ?? 0,
    currency:       a.currency || '₹',
    icon:           AGENT_ICON_MAP[a.id] || AGENT_ICON_FALLBACK,
  })) : SAMPLE.agents

  return {
    business: {
      name:        o(biz.brandName, SAMPLE.business.name),
      tagline:     o(biz.tagline, SAMPLE.business.tagline),
      desc:        o(pos.credibility, SAMPLE.business.desc),
      phone:       o(owner.whatsapp, SAMPLE.business.phone),
      email:       o(owner.email, SAMPLE.business.email),
      whatsapp:    o(owner.whatsapp, SAMPLE.business.whatsapp),
      location:    o(`${biz.city || ''}${biz.country && biz.country !== 'India' ? ', ' + biz.country : ''}`.trim(), SAMPLE.business.location),
      established: o(td.established, SAMPLE.business.established),
      faculty:     td.faculty_count || SAMPLE.business.faculty,
      students:    td.students_enrolled || SAMPLE.business.students,
      passRate:    td.pass_rate || SAMPLE.business.passRate,
      improvement: td.avg_improvement || SAMPLE.business.improvement,
      rating:      prf.results?.find(r => r?.label?.toLowerCase().includes('rating'))?.number || SAMPLE.business.rating,
      reviews:     SAMPLE.business.reviews,
      trialUrl:    fd.bookingUrl || '#trial',
    },
    badges:        SAMPLE.badges,
    subjectGroups,
    process:       mappedProcess.length ? mappedProcess : SAMPLE.process,
    batches:       SAMPLE.batches,
    testimonials:  mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:          mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
    agents:        mappedAgents,
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  sunflower:      '#a16207',
  sunflowerDark:  '#78350f',
  sunflowerLight: '#eab308',
  sunflowerPale:  '#fefce8',
  sky:            '#0284c7',
  skyDark:        '#075985',
  skyLight:       '#38bdf8',
  skyPale:        '#f0f9ff',
  white:          '#ffffff',
  ink:            '#1c1917',
  text:           '#292524',
  muted:          '#78716c',
  border:         '#fde68a',
  bg:             '#fffdf7',
  card:           '#ffffff',
  gray:           '#f5f5f4',
  grayText:       '#64748b',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  business: {
    name:         'BrightMinds Learning Centre',
    tagline:      "Pune's most trusted CBSE & ICSE tuition — small batches, real understanding",
    city:         'Pune',
    phone:        '+91 98220 45678',
    whatsapp:     '9822045678',
    email:        'hello@brightminds.in',
    established:  '2015',
    faculty:      '9',
    students:     '450+',
    passRate:     '96%',
    improvement:  '+22%',
    rating:       4.9,
    reviews:      380,
    response:     'Same day',
  },
  badges: [
    { icon: BadgeCheck, label: 'Since 2015',            sub: '10 years teaching' },
    { icon: Users,      label: 'Max 12 per batch',       sub: 'Never a crowded class' },
    { icon: TrendingUp, label: '96% Pass Rate',          sub: 'Board results, verified' },
    { icon: ThumbsUp,   label: '4.9★ from Parents',      sub: '380 reviews' },
  ],
  subjectGroups: [
    {
      level: 'Primary · Class 1–5', icon: School, color: T.sunflower,
      items: [
        { name: 'Maths Foundation',        price: '₹1,800/mo', duration: '2 classes/wk' },
        { name: 'English Reading & Writing', price: '₹1,800/mo', duration: '2 classes/wk' },
        { name: 'EVS + Science Starter',   price: '₹1,600/mo', duration: '2 classes/wk' },
      ],
    },
    {
      level: 'Middle · Class 6–8', icon: BookOpen, color: T.sky,
      items: [
        { name: 'Maths',                   price: '₹2,200/mo', duration: '3 classes/wk' },
        { name: 'Science (Phy/Chem/Bio)',  price: '₹2,400/mo', duration: '3 classes/wk' },
        { name: 'English & Social Studies',price: '₹2,000/mo', duration: '2 classes/wk' },
      ],
    },
    {
      level: 'Secondary · Class 9–10', icon: GraduationCap, color: '#92400e',
      items: [
        { name: 'Maths (Board Focus)',     price: '₹3,200/mo', duration: '4 classes/wk' },
        { name: 'Science (Board Focus)',   price: '₹3,200/mo', duration: '4 classes/wk' },
        { name: 'All-Subject Batch',       price: '₹7,999/mo', duration: '6 days/wk' },
      ],
    },
    {
      level: 'Senior Secondary · Class 11–12', icon: Award, color: '#0369a1',
      items: [
        { name: 'Physics / Chemistry / Maths', price: '₹3,800/mo', duration: '4 classes/wk each' },
        { name: 'Biology',                  price: '₹3,600/mo', duration: '4 classes/wk' },
        { name: 'Full PCM / PCB Batch',     price: '₹9,999/mo', duration: '6 days/wk' },
      ],
    },
  ],
  process: [
    { step: '01', icon: CalendarDays,   title: 'Book a Trial Class',     desc: 'Pick any subject and batch slot. The first class is free — no commitment, no card needed.' },
    { step: '02', icon: ClipboardCheck, title: 'Quick Assessment',        desc: 'A short diagnostic during the trial shows us exactly where your child stands, not just their grade.' },
    { step: '03', icon: UserCheck,      title: 'Right Batch Placement',   desc: 'We place your child in the batch that matches their level — never just their age or class.' },
    { step: '04', icon: TrendingUp,     title: 'Learn & Track Progress',  desc: 'Weekly topics, monthly tests, and a progress note sent to you after every test — no surprises at report card time.' },
  ],
  batches: [
    { day: 'Mon · Wed · Fri', time: '4:00 PM – 5:30 PM', subject: 'Class 9–10 Maths',  seatsLeft: 3 },
    { day: 'Tue · Thu · Sat', time: '5:00 PM – 6:30 PM', subject: 'Class 9–10 Science', seatsLeft: 5 },
    { day: 'Mon · Wed · Fri', time: '6:00 PM – 7:30 PM', subject: 'Class 11–12 PCM',   seatsLeft: 2 },
    { day: 'Saturday',        time: '10:00 AM – 1:00 PM', subject: 'Weekend Batch (6–8)', seatsLeft: 6 },
  ],
  testimonials: [
    { name: 'Deepa Kulkarni', role: 'Parent, Class 8',   rating: 5, text: "My son actually enjoys Maths now — that alone was worth it. The monthly progress notes mean I'm never guessing where he stands." },
    { name: 'Sanjay Rao',     role: 'Parent, Class 10',  rating: 5, text: 'Board year and the batch size never went above 10. The teachers know exactly which topics my daughter struggles with, and it shows in her test scores.' },
    { name: 'Meera Iyer',     role: 'Parent, Class 6',   rating: 5, text: 'We tried two other centres before this one. The difference is they actually call if my child misses a class — nobody else did that.' },
    { name: 'Arjun Nair',     role: 'Parent, Class 12',  rating: 4, text: "Physics faculty is excellent, genuinely improved his problem-solving. Only wish there were more weekend slots, but we made it work." },
  ],
  faqs: [
    { q: 'Is the first class really free?',                    a: 'Yes — every new student gets one full trial class at no cost, in the actual batch they would join. No card details needed to book it.' },
    { q: 'What happens if my child misses a class?',           a: 'We send a WhatsApp note the same evening and offer a makeup slot within the week wherever possible. For test-week absences, we schedule a one-on-one catch-up.' },
    { q: 'How do you decide which batch my child joins?',      a: "Not just by class or age — the trial-class assessment places your child with students at a similar level, so lessons never feel too fast or too slow." },
    { q: 'Do you offer a refund if we discontinue?',            a: 'Fees are billed monthly, not annually, so you can stop anytime with no lock-in. Any amount paid for unused classes in the current month is refunded.' },
    { q: 'Is teaching online, offline, or both?',               a: 'All batches are in-person at our centre. We share notes and recorded topic summaries on WhatsApp for revision, but live classes are on-site.' },
  ],
  agents: [
    {
      id: 'doubt-clearing', title: 'Doubt-Clearing Chat', role: 'Homework & Doubt Assistant', badge: 'Popular',
      description: 'Your child can ask a question about tonight\'s homework and get a step-by-step explanation, any evening — not just during class hours.',
      samplePrompts: ['Explain how to factorise this quadratic', 'Why does this chemical equation not balance?'],
      ratePerMinute: 5, currency: '₹',
    },
    {
      id: 'study-plan', title: 'Personalised Study Plan', role: 'Exam Prep Planner', badge: null,
      description: 'A week-by-week revision plan built around your child\'s actual test scores and the weeks left before the exam.',
      samplePrompts: ['Build a 6-week plan for the Class 10 Science board exam', 'Adjust my plan — I lost 3 days to a cold'],
      ratePerMinute: 5, currency: '₹',
    },
    {
      id: 'weak-topic', title: 'Weak-Topic Analyser', role: 'Test Performance Coach', badge: null,
      description: "Upload a marked test paper and get a plain-language breakdown of exactly which concepts need another look before the next one.",
      samplePrompts: ['Why did I lose marks in this trigonometry question?', 'Which topics should I revise before the next unit test?'],
      ratePerMinute: 5, currency: '₹',
    },
    {
      id: 'progress-digest', title: 'Parent Progress Digest', role: 'Monthly Summary Assistant', badge: null,
      description: 'A plain-English monthly summary for parents — attendance, test trend, and one thing to focus on at home, sent straight to WhatsApp.',
      samplePrompts: ["Summarise this month's tests in one paragraph for a parent", 'What should we focus on at home this month?'],
      ratePerMinute: 5, currency: '₹',
    },
  ],
}

// ─── Scroll to top ────────────────────────────────────────────────────────────
function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  if (!visible) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
      style={{ background: T.sunflower }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 text-white" />
    </button>
  )
}

// ─── WhatsApp sticky button ───────────────────────────────────────────────────
function WhatsAppSticky() {
  const D = useData()
  return (
    <a
      href={`https://wa.me/${D.business.whatsapp}?text=Hi! I'd like to book a free trial class.`}
      target="_blank" rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all hover:scale-105"
      style={{ background: '#25d366', color: '#fff' }}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="font-bold text-sm">Book Trial Class</span>
    </a>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  const b = D.business
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-md"
      style={{ background: 'rgba(255,253,247,0.97)', borderColor: T.border }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.sunflower }}>
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm leading-tight" style={{ color: T.text }}>{b.name}</p>
            <p className="text-[10px] leading-tight" style={{ color: T.muted }}>{b.city} · Est. {b.established}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-5 text-sm">
          {[['#subjects','Subjects'],['#batches','Batch Timings'],['#reviews','Parent Reviews']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-opacity hover:opacity-60" style={{ color: T.grayText }}>{label}</a>
          ))}
        </div>
        <a href={b.trialUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: T.sunflower }}>
          Free Trial Class
        </a>
      </div>
    </nav>
  )
}

// ─── Hero — outcomes-led, parent-facing ──────────────────────────────────────
function HeroSection() {
  const D = useData()
  const b = D.business
  return (
    <section className="relative pt-14 overflow-hidden" style={{ background: `linear-gradient(160deg, ${T.sunflowerPale} 0%, #fffdf7 45%, ${T.skyPale} 100%)` }}>
      <div className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-40 -translate-y-1/3 translate-x-1/4" style={{ background: T.sunflowerLight }} />
      <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full blur-3xl opacity-30 translate-y-1/3 -translate-x-1/4" style={{ background: T.skyLight }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold mb-6"
              style={{ borderColor: T.border, color: T.sunflowerDark, background: T.white }}>
              <MapPin className="w-3.5 h-3.5" /> Serving {b.city} · {b.faculty} teachers
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[3.4rem] font-black leading-[1.08] mb-5" style={{ color: T.text }}>
              Tuition that shows up<br />
              in the <span style={{ color: T.sunflower }}>report card,</span><br />
              not just the marketing.
            </h1>

            <p className="text-base leading-relaxed mb-8 max-w-lg" style={{ color: T.muted }}>
              {b.tagline}. Batches capped at 12, monthly progress notes for every parent, and a free trial class before you commit to anything.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <a href={`https://wa.me/${b.whatsapp}?text=Hi! I'd like to book a free trial class.`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-black text-base transition-all hover:opacity-90 shadow-lg"
                style={{ background: '#25d366', color: '#fff' }}>
                <MessageCircle className="w-5 h-5" /> Book Free Trial
              </a>
              <a href={`tel:${b.phone}`}
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-black text-base border transition-all hover:bg-white"
                style={{ borderColor: T.border, color: T.text, background: 'rgba(255,255,255,0.6)' }}>
                <Phone className="w-5 h-5" /> {b.phone}
              </a>
            </div>
          </div>

          {/* Outcome stat card */}
          <div className="rounded-3xl p-7 shadow-xl border" style={{ background: T.white, borderColor: T.border }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-5" style={{ color: T.muted }}>Results, not promises</p>
            <div className="grid grid-cols-2 gap-5">
              {[
                { value: b.passRate,    label: 'Board pass rate', color: T.sunflower },
                { value: b.improvement, label: 'Avg. score improvement', color: T.sky },
                { value: b.students,    label: 'Students taught', color: T.sunflower },
                { value: b.rating + '★', label: `From ${b.reviews} parents`, color: T.sky },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: T.bg }}>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: T.muted }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Trust wall ───────────────────────────────────────────────────────────────
function TrustWallSection() {
  const D = useData()
  return (
    <section style={{ background: T.sunflowerDark }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {D.badges.map(({ icon: Icon, label, sub }, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-5 border-r border-b last:border-r-0"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">{label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Subject grid — tabbed by class level ────────────────────────────────────
function SubjectsSection() {
  const [activeTab, setActiveTab] = useState(0)
  const D = useData()
  const group = D.subjectGroups[activeTab]

  return (
    <section id="subjects" className="py-20" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.sunflower }}>What we teach</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Subjects & fees, by class</h2>
          <p className="mt-2 text-base" style={{ color: T.muted }}>Every fee is monthly. No annual lock-in, no hidden charges.</p>
        </div>

        <div className="flex gap-3 mb-7 overflow-x-auto pb-1">
          {D.subjectGroups.map((g, i) => {
            const Icon = g.icon
            return (
              <button key={i} onClick={() => setActiveTab(i)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm flex-shrink-0 border transition-all"
                style={{
                  background: activeTab === i ? g.color : T.white,
                  color: activeTab === i ? '#fff' : T.grayText,
                  borderColor: activeTab === i ? g.color : T.border,
                }}>
                <Icon className="w-4 h-4" /> {g.level}
              </button>
            )
          })}
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
          <div className="grid grid-cols-12 px-6 py-3 text-xs font-bold uppercase tracking-widest border-b"
            style={{ background: group.color, color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="col-span-6">Subject</span>
            <span className="col-span-3 text-right">Fee</span>
            <span className="col-span-3 text-right">Schedule</span>
          </div>
          {group.items.map((item, i) => (
            <div key={i}
              className="grid grid-cols-12 px-6 py-4 border-b last:border-0 items-center hover:bg-yellow-50 transition-colors"
              style={{ borderColor: T.border }}>
              <div className="col-span-6"><p className="font-semibold text-sm" style={{ color: T.text }}>{item.name}</p></div>
              <div className="col-span-3 text-right"><span className="font-black text-sm" style={{ color: T.sunflower }}>{item.price}</span></div>
              <div className="col-span-3 text-right">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: T.skyPale, color: T.skyDark }}>{item.duration}</span>
              </div>
            </div>
          ))}
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: T.sunflowerPale }}>
            <p className="text-sm" style={{ color: T.muted }}>Not sure which batch fits? WhatsApp us your child's class and current marks.</p>
            <a href={`https://wa.me/${D.business.whatsapp}?text=I'd like batch advice for ${group.level}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
              style={{ background: '#25d366' }}>
              <MessageCircle className="w-4 h-4" /> Ask Us
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How enrolment works ──────────────────────────────────────────────────────
function HowItWorksSection() {
  const D = useData()
  return (
    <section className="py-20" style={{ background: T.white }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.sunflower }}>Getting started</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>From trial class to first report card</h2>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5" style={{ background: T.border }} />
          <div className="grid md:grid-cols-4 gap-6">
            {D.process.map(({ step, icon: Icon, title, desc }, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-sm border-4"
                  style={{ background: i % 2 === 0 ? T.sunflower : T.sky, borderColor: T.white }}>
                  <Icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-white"
                    style={{ background: T.text, color: '#fff' }}>{step}</div>
                </div>
                <h3 className="font-black text-base mb-2" style={{ color: T.text }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Batch timetable — the niche section ─────────────────────────────────────
function BatchScheduleSection() {
  const D = useData()
  return (
    <section id="batches" className="py-20" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.sky }}>This week's openings</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Current batch timings</h2>
          </div>
          <p className="text-sm" style={{ color: T.muted }}>Seats update in real time — WhatsApp to confirm before visiting.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {D.batches.map((batch, i) => {
            const low = batch.seatsLeft <= 3
            return (
              <div key={i} className="rounded-2xl border p-5 flex items-center justify-between gap-4"
                style={{ background: T.white, borderColor: T.border }}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: T.skyPale }}>
                    <Calendar className="w-5 h-5" style={{ color: T.sky }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{batch.subject}</p>
                    <p className="text-xs mt-1" style={{ color: T.muted }}>{batch.day} · {batch.time}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: low ? '#fef2f2' : T.sunflowerPale, color: low ? '#b91c1c' : T.sunflowerDark }}>
                  {batch.seatsLeft} seats left
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function ReviewsSection() {
  const [active, setActive] = useState(0)
  const D = useData()
  const navigate = (dir) => setActive(prev => (prev + dir + D.testimonials.length) % D.testimonials.length)
  const t = D.testimonials[active]

  return (
    <section id="reviews" className="py-20" style={{ background: T.sunflowerDark }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.skyLight }}>What parents say</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">{D.business.reviews} reviews · {D.business.rating}★ average</h2>
          </div>
          <div className="flex gap-2">
            {[[-1, ChevronLeft], [1, ChevronRight]].map(([dir, Icon], i) => (
              <button key={i} onClick={() => navigate(dir)}
                className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-8 border mb-6" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
          <div className="flex gap-1 mb-5">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" style={{ color: T.skyLight }} />
            ))}
          </div>
          <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-6">"{t.text}"</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm" style={{ background: T.sunflowerLight, color: T.ink }}>
              {t.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{t.name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.role}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {D.testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className="w-2 h-2 rounded-full transition-all"
              style={{ background: active === i ? T.skyLight : 'rgba(255,255,255,0.25)' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── AI Study Tools — shared AgentsSection pattern ───────────────────────────
function AgentsSection() {
  const D = useData()
  if (!D.agents?.length) return null
  return (
    <section className="py-20" style={{ background: T.white }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.sky }}>Between classes</p>
          <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ color: T.text }}>AI study tools for enrolled students</h2>
          <p className="text-base max-w-2xl" style={{ color: T.muted }}>Add-on help for homework nights and exam weeks — priced separately, no subscription required.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {D.agents.map((agent) => {
            const Icon = agent.icon || AGENT_ICON_FALLBACK
            return (
              <div key={agent.id} className="rounded-2xl border p-5 flex flex-col justify-between" style={{ borderColor: T.border, background: T.bg }}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: T.skyPale }}>
                      <Icon className="w-5 h-5" style={{ color: T.sky }} />
                    </div>
                    {agent.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: T.sunflowerPale, color: T.sunflowerDark }}>
                        {agent.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: T.sky }}>{agent.role}</p>
                  <h3 className="font-black text-sm mb-2" style={{ color: T.text }}>{agent.title}</h3>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: T.muted }}>{agent.description}</p>
                  {agent.samplePrompts?.[0] && (
                    <p className="text-xs italic mb-4" style={{ color: T.grayText }}>"{agent.samplePrompts[0]}"</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: T.border }}>
                  <span className="text-xs font-bold" style={{ color: T.sunflower }}>{agent.currency}{agent.ratePerMinute}/min</span>
                  <button className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: T.sky }}>
                    Try it <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState(null)
  const D = useData()
  return (
    <section className="py-20" style={{ background: T.bg }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.sunflower }}>Before you enrol</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Questions parents ask</h2>
        </div>
        <div className="space-y-3">
          {D.faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.sunflowerPale : T.white }}>
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`} style={{ color: T.sunflower }} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.muted, background: T.sunflowerPale }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Booking CTA ──────────────────────────────────────────────────────────────
function BookingSection() {
  const D = useData()
  const b = D.business
  return (
    <section id="trial" className="py-20" style={{ background: `linear-gradient(135deg, ${T.sunflowerDark} 0%, ${T.sunflower} 60%, ${T.sunflowerLight} 100%)` }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.skyLight }}>Book a trial class</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">See how your child learns here — free.</h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
              WhatsApp us your child's class and subject. We'll confirm a trial slot within 24 hours — no fee, no obligation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={`https://wa.me/${b.whatsapp}?text=Hi! I'd like to book a free trial class.`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-black text-base transition-all hover:opacity-90 shadow-lg"
                style={{ background: '#25d366', color: '#fff' }}>
                <MessageCircle className="w-5 h-5" /> Book on WhatsApp
              </a>
              <a href={`tel:${b.phone}`}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-black text-base border transition-all hover:bg-white hover:bg-opacity-10"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                <Phone className="w-5 h-5" /> Call {b.phone}
              </a>
            </div>
          </div>
          <div className="rounded-2xl p-7 border" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}>
            <p className="font-bold text-white mb-5 text-sm">Every trial class includes:</p>
            <ul className="space-y-4">
              {[
                'One full live class in the actual batch, free of cost',
                'A short diagnostic so we place your child correctly',
                'A same-day call with the subject teacher afterward',
                'Fee structure and batch options explained clearly',
                'No card, no lock-in — decide only after the trial',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.skyLight }} />
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

// ─── Footer ───────────────────────────────────────────────────────────────────
function TemplateFooter() {
  const D = useData()
  const b = D.business
  return (
    <footer style={{ background: T.ink, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.sunflower }}>
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white">{b.name}</span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{b.tagline}. Est. {b.established}.</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{b.city}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.skyLight }}>Learn More</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {[['#subjects','Subjects & Fees'],['#batches','Batch Timings'],['#reviews','Parent Reviews'],['#','Privacy Policy']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.skyLight }}>Contact</p>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <li><a href={`tel:${b.phone}`} className="hover:text-white transition-colors">{b.phone}</a></li>
              <li><a href={`mailto:${b.email}`} className="hover:text-white transition-colors">{b.email}</a></li>
              <li>{b.city}</li>
            </ul>
            <a href={`https://wa.me/${b.whatsapp}?text=Hi! I'd like to book a free trial class.`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: '#25d366' }}>
              <MessageCircle className="w-4 h-4" /> WhatsApp Us
            </a>
          </div>
        </div>
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
          <span>© {new Date().getFullYear()} {b.name}. All rights reserved.</span>
          <Link href="/templates" className="hover:text-white transition-colors">← Browse all templates on OPC Genie</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TutorTrainingCentreTemplate({ data }) {
  const value = payloadToData(data)
  return (
    <DataCtx.Provider value={value}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <TemplateNav />
        <HeroSection />
        <TrustWallSection />
        <SubjectsSection />
        <HowItWorksSection />
        <BatchScheduleSection />
        <ReviewsSection />
        <AgentsSection />
        <FAQSection />
        <BookingSection />
        <TemplateFooter />
        <WhatsAppSticky />
        <ScrollToTop />
      </div>
    </DataCtx.Provider>
  )
}