'use client'

import Link from 'next/link'
import {
  ArrowRight, CheckCircle, Star, ChevronDown, Play, Mail, Phone,
  Calendar, BookOpen, Mic, Award, Globe, FileText, Download,
  Quote, ExternalLink, MapPin, Twitter, Linkedin, Instagram, Clock
} from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  // Primary accent — dark burnt orange
  burg:       '#c2440a',        // rich burnt orange — buttons & accents
  burgDark:   '#7c2d00',        // deep mahogany orange
  burgMid:    '#e05a1a',        // warm mid-orange
  burgLight:  '#fdba74',        // soft peach-orange
  // Light backgrounds — warm ivory & peach tints
  blush:      '#fff7f0',        // barely-there peach
  blushDark:  '#ffe8d6',        // warm peach
  rose:       '#fb923c',        // bright orange accent
  cream:      '#fffcf9',        // warm near-white
  white:      '#ffffff',
  // Text — deep espresso brown (warm, readable)
  text:       '#1c0a00',
  muted:      '#7c4010',
  mutedLight: '#c08050',
  border:     '#ffd4aa',
  bg:         '#fff8f2',
  gold:       '#d97706',        // amber gold
  goldLight:  '#fef3c7',
  // Gradients — rich dark orange, editorial warmth
  gradHero:   'linear-gradient(135deg, #431407 0%, #92400e 45%, #c2440a 100%)',
  gradPress:  'linear-gradient(135deg, #292524 0%, #7c2d00 50%, #b45309 100%)',
  gradFooter: 'linear-gradient(160deg, #1c0a00 0%, #78350f 60%, #b45309 100%)',
  gradCTA:    'linear-gradient(135deg, #c2440a 0%, #ea580c 50%, #fb923c 100%)',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  author: {
    name:      'Nandita Krishnamurthy',
    title:     'Author · Leadership Coach · Keynote Speaker',
    tagline:   'Writing and speaking about the inner life of ambitious women.',
    bio:       'Nandita is the bestselling author of three books on leadership, identity, and the psychology of high achievement. A former IAS officer and Harvard fellow, she now speaks at corporate events, women\'s leadership summits, and universities across India and Southeast Asia.',
    credentials: [
      'Harvard Kennedy School Fellow',
      'Ex-IAS Officer, Karnataka Cadre',
      '3× Bestselling Author',
      'TEDx Speaker, Bangalore 2023',
    ],
    location:  'Bangalore, India · Speaks worldwide',
    phone:     '+91 98450 00000',
    email:     'bookings@nanditak.com',
    agent:     'speaking@nanditaagency.com',
    social:    { twitter: '#', linkedin: '#', instagram: '#' },
    youtube:   null,
  },
  books: [
    {
      title:     'The Quiet Ambitious',
      subtitle:  'Why the most powerful women you know say almost nothing',
      year:      '2023',
      publisher: 'HarperCollins India',
      tag:       'Bestseller · 40,000+ copies',
      desc:      'A landmark book on how introverted, deeply competent women navigate power in organisations that reward visibility. Part memoir, part research, entirely necessary.',
      awards:    ['Tata Lit Live Long List 2023', 'Crossword Book Award Nominee'],
    },
    {
      title:     'Permission to Lead',
      subtitle:  'A practical guide for women stepping into authority',
      year:      '2021',
      publisher: 'Penguin India',
      tag:       '2nd Edition · 28,000 copies',
      desc:      'The book that started the conversation. A no-nonsense manual for women who have been told they are ready but still feel they are not.',
      awards:    ['Business Standard Top 10 Business Books 2021'],
    },
    {
      title:     'After the IAS',
      subtitle:  'Reflections on service, power, and reinvention',
      year:      '2019',
      publisher: 'Rupa Publications',
      tag:       'Memoir',
      desc:      'A candid memoir of twelve years in the civil services — the bureaucracy, the breakthroughs, the burnout, and the decision to walk away at the top.',
      awards:    [],
    },
  ],
  talks: [
    {
      title:    'The Quiet Ambitious: Leading Without Performing',
      duration: '45–60 min',
      audience: 'Corporate · ERGs · Women\'s Summits',
      desc:     'Why the loudest person in the room is rarely the most effective leader — and what quiet ambition looks like at the highest levels.',
    },
    {
      title:    'Permission to Lead: Closing the Confidence-Competence Gap',
      duration: '30–45 min',
      audience: 'Universities · Young Professionals',
      desc:     'A research-backed keynote on why talented women hold themselves back — and the three internal shifts that change everything.',
    },
    {
      title:    'Reinvention at the Top: When Success No Longer Fits',
      duration: '45 min · Workshop available',
      audience: 'Senior Leaders · C-Suite',
      desc:     'For executives navigating identity and purpose after the title, the exit, or the pivot. The most personal talk Nandita gives.',
    },
    {
      title:    'What the IAS Taught Me About Managing Chaos',
      duration: '30 min',
      audience: 'Operations · Government · Startups',
      desc:     'Practical lessons from 12 years running districts in crisis — decision-making under pressure, resource constraints, and keeping teams intact.',
    },
  ],
  press: [
    { name: 'The Hindu',        quote: 'One of the most important voices in Indian leadership writing today.' },
    { name: 'Forbes India',     quote: 'Her talks leave audiences changed, not just informed.' },
    { name: 'Economic Times',   quote: 'Nandita fills the gap between self-help and serious nonfiction.' },
    { name: 'Scroll.in',        quote: 'Rare clarity. Rarer courage.' },
  ],
  endorsements: [
    {
      name:  'Kiran Mazumdar-Shaw',
      title: 'Executive Chairperson, Biocon',
      quote: '"The Quiet Ambitious is the book I wish I had had at 35. It names something every high-achieving woman feels but rarely admits."',
    },
    {
      name:  'Falguni Nayar',
      title: 'Founder & CEO, Nykaa',
      quote: '"Nandita speaks from lived experience, not theory. That is what makes her so effective — on the page and on the stage."',
    },
    {
      name:  'Sucheta Dalal',
      title: 'Founding Editor, MoneyLife',
      quote: '"Permission to Lead should be mandatory reading for every organisation serious about women in leadership."',
    },
  ],
  speakingFees: [
    { type: 'Keynote (45–60 min)',     fee: 'From ₹3,50,000',  note: 'India-based events' },
    { type: 'Workshop (Half-day)',     fee: 'From ₹5,00,000',  note: 'Up to 50 participants' },
    { type: 'International Keynote',   fee: 'On enquiry',       note: 'Includes travel & accommodation' },
    { type: 'University / Non-profit', fee: 'Concessional',     note: 'Select engagements only' },
  ],
  faqs: [
    { q: 'How far in advance should I book?',                  a: 'Nandita\'s calendar fills 3–4 months in advance for keynotes. For workshops, 6–8 weeks is the minimum. Reach out as early as possible.' },
    { q: 'Does she customise talks for our organisation?',     a: 'Yes — every engagement includes a 30-minute pre-event call to tailor the talk to your audience, theme, and outcomes.' },
    { q: 'What formats does she speak in?',                    a: 'Keynotes, panel moderation, fireside chats, half-day and full-day workshops, and virtual sessions. All formats available.' },
    { q: 'Can we order books for attendees?',                  a: 'Bulk orders for events are available through HarperCollins India directly. Nandita is happy to sign copies when attending in person.' },
    { q: 'Is a media kit available?',                          a: 'Yes — high-resolution photos, biography in 3 lengths, and a speaker one-sheet are available on request. Email bookings@nanditak.com.' },
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
  const owner = biz.owner || {}
  const o = (v, fb) => (v && String(v).trim() ? v : fb)
  const a = (v, fb) => (Array.isArray(v) && v.filter(Boolean).length ? v.filter(Boolean) : fb)
  const tagline = pos.buyer && pos.outcome
    ? `I help ${pos.buyer} get ${pos.outcome}${pos.fear ? `, without ${pos.fear}` : ''}.`
    : o(biz.tagline, SAMPLE.author.tagline)
  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer).map(f => ({ q: f.question, a: f.answer }))
  return {
    author: {
      name:        o(owner.name, SAMPLE.author.name),
      title:       o(owner.role, SAMPLE.author.title),
      tagline:     tagline,
      bio:         o(pos.credibility, SAMPLE.author.bio),
      credentials: a(prf.credentials, SAMPLE.author.credentials),
      location:    o(`${biz.city || ''}${biz.country && biz.country !== 'India' ? ' · ' + biz.country : ''}`.trim(), SAMPLE.author.location),
      phone:       o(owner.whatsapp, SAMPLE.author.phone),
      email:       o(owner.email, SAMPLE.author.email),
      bookingUrl:  fd.bookingUrl || '#contact',
      twitter:     SAMPLE.author.twitter,
      linkedin:    SAMPLE.author.linkedin,
      instagram:   SAMPLE.author.instagram,
    },
    books:        SAMPLE.books,
    talks:        SAMPLE.talks,
    speakingFees: SAMPLE.speakingFees,
    press:        SAMPLE.press,
    endorsements: SAMPLE.endorsements,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
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
    <div className="fixed top-0 left-0 right-0 z-[60] h-1" style={{ background: T.blushDark }}>
      <div className="h-full transition-all duration-100" style={{ width: `${pct}%`, background: T.burg }} />
    </div>
  )
}

// ─── Template nav ─────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  return (
    <nav
      className="fixed top-1 left-0 right-0 z-50 backdrop-blur-md border-b"
      style={{ background: 'rgba(253,248,246,0.97)', borderColor: T.border }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <span className="font-black text-base" style={{ color: T.burg }}>
          {D.author.name}
        </span>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {[['#books','Books'],['#speaking','Speaking'],['#press','Press'],['#booking','Book Nandita']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-opacity hover:opacity-60" style={{ color: T.muted }}>
              {label}
            </a>
          ))}
        </div>
        <a
          href="#booking"
          className="px-4 py-2 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: T.burg }}
        >
          Book a Talk
        </a>
      </div>
    </nav>
  )
}

// ─── Hero — author splash layout ─────────────────────────────────────────────
function HeroSection() {
  const D = useData(); const a = D.author
  return (
    <section style={{ background: T.gradHero }} className="relative overflow-hidden pt-20 pb-0">
      {/* Decorative blush gradient sweep */}
      <div className="absolute inset-0 opacity-10" style={{
        background: 'radial-gradient(ellipse 80% 60% at 60% 100%, #fce7f3, transparent)'
      }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 min-h-[80vh] items-end">

          {/* Left — copy */}
          <div className="py-20 pr-0 lg:pr-16 flex flex-col justify-center">
            {/* Credential ribbon */}
            <div className="flex flex-wrap gap-2 mb-8">
              {a.credentials.slice(0, 2).map((c, i) => (
                <span key={i} className="text-xs font-bold px-3 py-1 rounded-full border"
                  style={{ borderColor: 'rgba(252,165,165,0.3)', color: T.burgLight, background: 'rgba(127,29,29,0.3)' }}>
                  {c}
                </span>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(252,165,165,0.6)' }}>
              {a.title}
            </p>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.05] mb-6">
              {a.tagline}
            </h1>
            <p className="text-base leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {a.bio}
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <a href="#books"
                className="inline-flex items-center px-6 py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90"
                style={{ background: T.burg, color: '#fff' }}>
                <BookOpen className="w-4 h-4 mr-2" /> Explore the Books
              </a>
              <a href="#booking"
                className="inline-flex items-center px-6 py-3 rounded-lg font-bold text-sm border transition-all hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                <Mic className="w-4 h-4 mr-2" /> Book a Talk
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              {[[Twitter, a.social.twitter], [Linkedin, a.social.linkedin], [Instagram, a.social.instagram]].map(([Icon, href], i) => (
                <a key={i} href={href}
                  className="w-9 h-9 rounded-lg border flex items-center justify-center transition-all hover:bg-white hover:bg-opacity-5"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
              <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{a.location}</span>
            </div>
          </div>

          {/* Right — book stack visual */}
          <div className="hidden lg:flex items-end justify-center gap-4 pb-0 pt-20 relative">
            {useData().books.map((b, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-t-lg overflow-hidden shadow-2xl"
                style={{
                  width: i === 0 ? '160px' : '120px',
                  height: i === 0 ? '240px' : '190px',
                  background: `hsl(${350 - i * 15}, 50%, ${18 + i * 6}%)`,
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginBottom: i === 1 ? '24px' : '0',
                  transform: i === 1 ? 'rotate(-2deg)' : i === 2 ? 'rotate(2deg)' : 'none',
                }}
              >
                <div className="h-full flex flex-col justify-between p-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(252,165,165,0.5)' }}>
                      {b.publisher}
                    </p>
                    <p className="font-black text-white leading-tight text-sm">{b.title}</p>
                  </div>
                  <p className="text-[9px] font-semibold" style={{ color: 'rgba(252,165,165,0.6)' }}>{b.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Video placeholder ── */}
        <div className="border-t pb-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="py-10">
            <p className="text-center text-sm font-semibold mb-4" style={{ color: 'rgba(252,165,165,0.6)' }}>
              Watch: Nandita at TEDx Bangalore — "The Quiet Ambitious"
            </p>
            <div
              className="relative w-full rounded-2xl overflow-hidden border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)', aspectRatio: '16/9' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer transition-transform hover:scale-105 border-2"
                    style={{ background: 'transparent', borderColor: T.burg }}
                  >
                    <Play className="w-8 h-8 ml-1" style={{ color: T.burgLight }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(252,165,165,0.6)' }}>Your TEDx or keynote video goes here</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(252,165,165,0.3)' }}>Paste a YouTube link in Settings → Brand → Intro Video</p>
                </div>
              </div>
              <div
                className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(127,29,29,0.4)', color: T.burgLight, border: '1px solid rgba(127,29,29,0.6)' }}
              >
                ▶ TEDx Talk
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Books showcase ───────────────────────────────────────────────────────────
function BooksSection() {
  const [active, setActive] = useState(0)
  const book = useData().books[active]
  return (
    <section id="books" className="py-24" style={{ background: T.cream }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial heading */}
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: T.blushDark }}>01</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.burg }}>Published Works</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>The books</h2>
          </div>
        </div>

        {/* Book selector tabs */}
        <div className="flex flex-wrap gap-3 mb-10">
          {useData().books.map((b, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="px-5 py-2.5 rounded-lg text-sm font-bold border transition-all"
              style={{
                background: active === i ? T.burg : T.white,
                color: active === i ? '#fff' : T.muted,
                borderColor: active === i ? T.burg : T.border,
              }}
            >
              {b.title}
            </button>
          ))}
        </div>

        {/* Active book detail */}
        <div className="grid md:grid-cols-3 gap-8 rounded-2xl overflow-hidden border" style={{ borderColor: T.border }}>
          {/* Book spine visual */}
          <div
            className="flex items-center justify-center p-10 min-h-[260px]"
            style={{ background: T.gradHero }}
          >
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(252,165,165,0.5)' }}>
                {book.publisher} · {book.year}
              </p>
              <p className="font-black text-white text-xl leading-tight mb-2">{book.title}</p>
              <p className="text-xs italic" style={{ color: T.burgLight }}>{book.subtitle}</p>
              <div className="mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold" style={{ background: T.burg, color: '#fff' }}>
                {book.tag}
              </div>
            </div>
          </div>
          {/* Description + awards */}
          <div className="md:col-span-2 p-8" style={{ background: T.white }}>
            <p className="text-base leading-relaxed mb-6" style={{ color: T.muted }}>{book.desc}</p>
            {book.awards.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.burg }}>Awards & Recognition</p>
                <ul className="space-y-2">
                  {book.awards.map((a, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: T.muted }}>
                      <Award className="w-4 h-4 flex-shrink-0" style={{ color: T.gold }} /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <a href="#" className="inline-flex items-center px-5 py-2.5 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90" style={{ background: T.burg }}>
                Order on Amazon <ExternalLink className="w-4 h-4 ml-2" />
              </a>
              <a href="#" className="inline-flex items-center px-5 py-2.5 rounded-lg font-bold text-sm border transition-all hover:bg-gray-50" style={{ borderColor: T.border, color: T.muted }}>
                Bulk / Events Order <Download className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Speaking topics ──────────────────────────────────────────────────────────
function SpeakingSection() {
  const [open, setOpen] = useState(0)
  return (
    <section id="speaking" className="py-24" style={{ background: T.white }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: '#fef2f2' }}>02</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.burg }}>Keynotes & Workshops</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Speaking topics</h2>
            <p className="mt-2 text-base" style={{ color: T.muted }}>
              Each talk is tailored to your audience. Click to expand.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {useData().talks.map((t, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between px-6 py-5 text-left"
                style={{ background: open === i ? T.blush : T.white }}
              >
                <div className="flex-1 pr-4">
                  <p className="font-bold text-base" style={{ color: T.text }}>{t.title}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    <span className="text-xs" style={{ color: T.muted }}>
                      <Clock className="w-3 h-3 inline mr-1" />{t.duration}
                    </span>
                    <span className="text-xs" style={{ color: T.muted }}>
                      <Globe className="w-3 h-3 inline mr-1" />{t.audience}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  style={{ color: T.burg }}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1" style={{ background: T.blush }}>
                  <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{t.desc}</p>
                  <a href="#booking" className="inline-flex items-center mt-4 text-sm font-bold" style={{ color: T.burg }}>
                    Enquire about this talk <ArrowRight className="w-4 h-4 ml-1.5" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Fees table */}
        <div className="mt-14 rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
          <div className="px-7 py-4 border-b" style={{ background: T.burg, borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="font-bold text-white text-sm">Speaking Fees</p>
          </div>
          {useData().speakingFees.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-7 py-4 border-b last:border-0 text-sm"
              style={{ borderColor: T.border, background: i % 2 === 0 ? T.white : T.cream }}
            >
              <span style={{ color: T.text }}>{f.type}</span>
              <div className="text-right">
                <span className="font-bold" style={{ color: T.burg }}>{f.fee}</span>
                <span className="block text-xs" style={{ color: T.muted }}>{f.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Press & endorsements ────────────────────────────────────────────────────
function PressSection() {
  return (
    <section id="press" className="py-24" style={{ background: T.gradPress }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: 'rgba(255,255,255,0.04)' }}>03</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.burgLight }}>In the media</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Press & Endorsements</h2>
          </div>
        </div>

        {/* Press quotes strip */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {useData().press.map((p, i) => (
            <div key={i} className="rounded-xl p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: T.burgLight }}>{p.name}</p>
              <p className="text-sm italic leading-relaxed text-white opacity-80">"{p.quote}"</p>
            </div>
          ))}
        </div>

        {/* Endorsements — large blockquotes */}
        <div className="space-y-8">
          {useData().endorsements.map((e, i) => (
            <div key={i} className="relative pl-8 border-l-4" style={{ borderColor: T.burg }}>
              <Quote className="absolute -left-2 -top-1 w-5 h-5" style={{ color: T.burg }} />
              <p className="text-lg md:text-xl font-semibold text-white leading-relaxed mb-4">
                {e.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm" style={{ background: T.burg, color: '#fff' }}>
                  {e.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{e.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{e.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Media kit CTA */}
        <div className="mt-14 rounded-2xl border p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <p className="font-bold text-white mb-1">Media Kit available on request</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Hi-res photos, biography (3 lengths), speaker one-sheet, and book cover artwork.
            </p>
          </div>
          <a href={`mailto:${useData().author.email}`}
            className="flex-shrink-0 inline-flex items-center px-6 py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90"
            style={{ background: T.burg, color: '#fff' }}>
            <Download className="w-4 h-4 mr-2" /> Request Media Kit
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState(null)
  return (
    <section className="py-24" style={{ background: T.cream }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6 mb-14">
          <span className="text-8xl font-black leading-none select-none" style={{ color: T.blushDark }}>04</span>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.burg }}>Booking FAQs</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Before you enquire</h2>
          </div>
        </div>
        <div className="space-y-3">
          {useData().faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.blush : T.white }}
              >
                {f.q}
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  style={{ color: T.burg }}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.muted, background: T.blush }}>
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

// ─── Booking CTA ─────────────────────────────────────────────────────────────
function BookingSection() {
  const D = useData(); const a = D.author
  return (
    <section id="booking" className="py-24" style={{ background: T.gradCTA }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left — copy */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.burgLight }}>Enquiries & Bookings</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              Invite Nandita to your stage.
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Whether it is a keynote at your leadership summit, a workshop for your senior women, or a fireside chat at your conference — Nandita brings a room to a different place.
            </p>
            <div className="space-y-3 mb-8">
              {[
                { label: 'Speaking enquiries', value: a.email, href: `mailto:${a.email}` },
                { label: 'Agent / international', value: a.agent, href: `mailto:${a.agent}` },
                { label: 'Direct line', value: a.phone, href: `tel:${a.phone}` },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider w-36 pt-0.5" style={{ color: T.burgLight }}>{item.label}</span>
                  <a href={item.href} className="text-sm font-semibold text-white hover:opacity-70 transition-opacity">{item.value}</a>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <MapPin className="w-4 h-4" style={{ color: T.burgLight }} />
              {a.location}
            </div>
          </div>

          {/* Right — enquiry guide */}
          <div className="rounded-2xl p-8 border" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="font-bold text-white mb-6">When you reach out, include:</p>
            <ul className="space-y-4">
              {[
                'Event name and date (or tentative date)',
                'Audience — size, seniority, industry',
                'Topic preference or theme',
                'Format — keynote / workshop / panel / virtual',
                'Location and budget range',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.burgLight }} />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${a.email}`}
              className="mt-8 block text-center py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: T.white, color: T.burg }}
            >
              <Mail className="inline w-4 h-4 mr-2" /> Send a Booking Enquiry
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function TemplateFooter() {
  const D = useData(); const a = D.author
  return (
    <footer style={{ background: T.gradFooter, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="font-black text-xl text-white mb-1">{a.name}</p>
            <p className="text-sm mb-4" style={{ color: T.burgLight }}>{a.title}</p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Author of three bestselling books on leadership and ambition.
              Speaker at corporate summits, universities, and women's leadership events.
            </p>
            <div className="flex items-center gap-2">
              {[[Twitter, a.social.twitter], [Linkedin, a.social.linkedin], [Instagram, a.social.instagram]].map(([Icon, href], i) => (
                <a key={i} href={href}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:border-red-800"
                  style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.burgLight }}>Quick Links</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {[['#books','Books'],['#speaking','Speaking Topics'],['#press','Press & Endorsements'],['#booking','Book a Talk'],['#','Privacy Policy']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.burgLight }}>Bookings & Media</p>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <li><a href={`mailto:${a.email}`} className="hover:text-white transition-colors">{a.email}</a></li>
              <li><a href={`mailto:${a.agent}`} className="hover:text-white transition-colors">{a.agent}</a></li>
              <li><a href={`tel:${a.phone}`} className="hover:text-white transition-colors">{a.phone}</a></li>
            </ul>
            <a
              href={`mailto:${a.email}`}
              className="inline-flex items-center mt-5 px-5 py-2.5 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: T.burg }}
            >
              <Mic className="w-4 h-4 mr-2" /> Book a Talk
            </a>
          </div>
        </div>
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}
        >
          <span>© {new Date().getFullYear()} {a.name}. All rights reserved.</span>
          <Link href="/templates" className="hover:text-white transition-colors">
            ← Browse all templates on OPC Genie
          </Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuthorSpeakerTemplate({ data }) {
  const resolved = payloadToData(data)
  return (
    <DataCtx.Provider value={resolved}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ProgressBar />
        <TemplateNav />
        <HeroSection />
        <BooksSection />
        <SpeakingSection />
        <PressSection />
        <FAQSection />
        <BookingSection />
        <TemplateFooter />
      </div>
    </DataCtx.Provider>
  )
}
