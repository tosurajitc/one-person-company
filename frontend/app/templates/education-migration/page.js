'use client'

/**
 * Template 13 — Physical / Artisan (Photography)
 * Section: Product & Commerce
 * Theme: Warm · Earthy Brown #78350f + Linen #f6efe3
 *
 * DESIGN CONCEPT: "The Contact Sheet"
 * ─────────────────────────────────────────────────────────────────────────────
 * Photography clients aren't buying a service, they're buying a way of
 * seeing — so this template is built around the medium itself rather than a
 * generic "artisan shop" layout:
 *
 *  • The hero is a CONTACT SHEET — an asymmetric grid of numbered frames on
 *    a dark "negative" background, one frame enlarged, echoing how a
 *    photographer actually reviews a shoot
 *  • Sections alternate between dark "negative" and warm "print" backgrounds
 *    instead of one flat colour throughout — a rhythm borrowed from the
 *    darkroom, not a generic section-stripe pattern
 *  • A long-form STORY section carries the founder's own voice — artisans
 *    sell trust in a point of view, not just a deliverable
 *  • A GALLERY grid stands in for a portfolio, grouped by shoot type
 *  • SESSION PACKAGES replace a generic price list — duration, deliverables,
 *    and what's actually included in each booking
 *  • A working CUSTOM ORDER FORM posts real enquiries (session type, date,
 *    location, message) instead of only a WhatsApp link
 *  • Client notes are styled as handwritten thank-yous, not review cards
 *  • AI tools are reframed for a photographer's actual admin — inquiry
 *    replies, shot-list planning, gallery captions
 *
 * DATA MAP — user_site_settings keys:
 *  general    → business_name, tagline, city, phone, whatsapp, email
 *  brand      → primary_color, logo_url
 *  hero       → headline, subheadline, cta_text
 *  about      → founder_name, story, philosophy_quote, years_experience
 *  offers     → packages[] { title, description, price, duration, deliverables[] }
 *  proof      → testimonials[] { name, role, quote, rating }, results[] { label, number }
 *  knowledge  → faqs[] { question, answer }
 *  contact    → enquiry_endpoint, whatsapp_number, booking_url
 *  agents     → agents[] { id, title, role, badge, description, samplePrompts, ratePerMinute, currency }
 *
 *  PROPOSED NEW template_data FIELDS (photography / artisan specific —
 *  flagging for the template-fields table):
 *    - gallery_categories[]  { name, frame_count, caption }
 *    - featured_in[]         publications / press mentions
 *    - session_locations[]   cities or regions served
 *    - travel_radius, turnaround_days
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import {
  Camera, Aperture, Heart, MapPin, Calendar, Mail, Phone, MessageCircle,
  Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowRight,
  CheckCircle, Feather, Users, Award, Clock, Send, Sparkles, PenTool,
  Quote, Film, ImageIcon,
} from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Icon lookups (code-owned) ────────────────────────────────────────────────
const AGENT_ICON_MAP = {
  'inquiry-reply':   MessageCircle,
  'shot-list':       Camera,
  'gallery-caption': PenTool,
  'pricing-guide':   Quote,
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

  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer)
    .map(f => ({ q: f.question, a: f.answer }))

  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote)
    .map(t => ({ name: t.name || '', role: t.role || '', rating: 5, text: t.quote }))

  const wizardOffers = Array.isArray(off.items) ? off.items : Array.isArray(off) ? off : []
  const mappedPackages = wizardOffers.filter(x => x?.title).map(x => ({
    name:         x.title,
    price:        x.price ? `₹${x.price}` : 'Enquire',
    duration:     x.duration || '',
    deliverables: Array.isArray(x.deliverables) ? x.deliverables : [],
  }))
  const packages = mappedPackages.length ? mappedPackages : SAMPLE.packages

  const mappedAgents = Array.isArray(payload.agents) ? payload.agents.filter(a => a?.title).map(a => ({
    id:            a.id,
    title:         a.title,
    role:          a.role || '',
    badge:         a.badge || null,
    description:   a.description || '',
    samplePrompts: (a.samplePrompts || []).slice(0, 2),
    ratePerMinute: a.ratePerMinute ?? 0,
    currency:      a.currency || '₹',
    icon:          AGENT_ICON_MAP[a.id] || AGENT_ICON_FALLBACK,
  })) : SAMPLE.agents

  return {
    business: {
      name:         o(biz.brandName, SAMPLE.business.name),
      founder:      o(biz.ownerName || owner.name, SAMPLE.business.founder),
      tagline:      o(biz.tagline, SAMPLE.business.tagline),
      story:        o(pos.credibility, SAMPLE.business.story),
      philosophy:   o(td.philosophy_quote, SAMPLE.business.philosophy),
      city:         o(`${biz.city || ''}`.trim(), SAMPLE.business.city),
      phone:        o(owner.whatsapp, SAMPLE.business.phone),
      email:        o(owner.email, SAMPLE.business.email),
      whatsapp:     o(owner.whatsapp, SAMPLE.business.whatsapp),
      years:        td.years_experience || SAMPLE.business.years,
      sessionsShot: td.sessions_shot || SAMPLE.business.sessionsShot,
      rating:       prf.results?.find(r => r?.label?.toLowerCase().includes('rating'))?.number || SAMPLE.business.rating,
      reviews:      SAMPLE.business.reviews,
      turnaround:   td.turnaround_days || SAMPLE.business.turnaround,
      featuredIn:   Array.isArray(td.featured_in) && td.featured_in.length ? td.featured_in : SAMPLE.business.featuredIn,
      toolsUsed:    o(know.toolsUsed, SAMPLE.business.toolsUsed),
      enquiryUrl:   fd.bookingUrl || '#enquire',
    },
    gallery:      SAMPLE.gallery,
    packages,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
    agents:       mappedAgents,
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  ink:       '#1c1712',
  inkSoft:   '#2b2117',
  clay:      '#8a4a26',
  clayDeep:  '#5c3016',
  clayLight: '#c17a45',
  linen:     '#f6efe3',
  linenDeep: '#ece1cd',
  cream:     '#fbf7f0',
  text:      '#241f19',
  muted:     '#8a7f6c',
  border:    '#e2d5bd',
  white:     '#ffffff',
  grayText:  '#6b6255',
}
const SERIF = "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
const SANS  = "'Inter', system-ui, sans-serif"

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  business: {
    name:         'Moss & Light',
    founder:      'Kavya Iyer',
    tagline:      'Documentary wedding and portrait photography, shot the way it actually happened',
    story:        "I don't direct my couples into poses they'll forget by the reception. I follow the day — the nervous hands before the ceremony, the uncle who cries during the speeches, the walk back to the car at 1am. Ten years in, that's still the only kind of photograph I want to make.",
    philosophy:   'The best photograph is the one nobody noticed being taken.',
    city:         'Goa',
    phone:        '+91 98450 33221',
    whatsapp:     '9845033221',
    email:        'hello@mossandlight.in',
    years:        '10',
    sessionsShot: '180+',
    rating:       4.9,
    reviews:      94,
    turnaround:   '6 weeks',
    featuredIn:   ['WedMeGood', 'Vogue India Weddings', 'Junebug Weddings'],
    toolsUsed:    'Sony A7 IV & Leica Q2, 35mm f/1.4 GM, 85mm f/1.4, Kodak Portra 400 Film Stock',
  },
  gallery: [
    { category: 'Weddings',   frames: 62, span: 'lg' },
    { category: 'Elopements', frames: 24, span: 'md' },
    { category: 'Portraits',  frames: 41, span: 'md' },
    { category: 'Editorial',  frames: 18, span: 'sm' },
    { category: 'Engagements',frames: 33, span: 'sm' },
  ],
  packages: [
    {
      name: 'Elopement Coverage', price: '₹45,000', duration: '4 hours',
      deliverables: ['1 photographer', '150+ edited images', 'Private online gallery', '4-week delivery'],
    },
    {
      name: 'Half-Day Wedding', price: '₹85,000', duration: '6 hours',
      deliverables: ['1 photographer', '400+ edited images', 'Engagement session included', 'Private online gallery', '6-week delivery'],
    },
    {
      name: 'Full-Day Wedding', price: '₹1,45,000', duration: '10 hours',
      deliverables: ['2 photographers', '800+ edited images', 'Engagement session included', 'Printed 30-page album', '6-week delivery'],
    },
  ],
  testimonials: [
    { name: 'Ritika & Arjun', role: 'Married, March 2026', rating: 5, text: "We flipped through the gallery and cried, twice. Kavya caught things we didn't even know happened — our grandmothers holding hands during the vows." },
    { name: 'Simran Bhatia',  role: 'Portrait session',     rating: 5, text: "I hate having my photo taken and somehow forgot the camera was even there after twenty minutes. That's the whole magic of it." },
    { name: 'The Kapoor Family', role: 'Elopement, Udaipur', rating: 5, text: 'No forced poses, no standing around waiting for the "perfect angle." Just two very good hours that turned into photographs we\'ll have forever.' },
  ],
  faqs: [
    { q: 'How far in advance should we book?',        a: 'Wedding dates are typically booked 6–9 months ahead, especially for peak season (Oct–Feb). Elopements and portrait sessions can often be arranged with 3–4 weeks notice.' },
    { q: 'Do you travel outside Goa?',                 a: 'Yes — I shoot across India and occasionally destination weddings abroad. Travel and stay are quoted separately based on location.' },
    { q: 'What if it rains on the day?',               a: "It's happened, more than once, and some of my favourite images came from it. We adapt the shot list on the day rather than cancel or reschedule for weather." },
    { q: 'How long until we get our photos?',          a: 'A curated online gallery is delivered within 6 weeks of the shoot. A sneak peek of 15–20 images usually goes out within 72 hours.' },
    { q: 'Is a deposit required to book?',              a: 'A 30% non-refundable deposit secures your date, with the balance due two weeks before the shoot. This is outlined in the booking agreement sent after enquiry.' },
  ],
  agents: [
    {
      id: 'inquiry-reply', title: 'Inquiry Reply Assistant', role: 'Booking Correspondence Helper', badge: 'Popular',
      description: 'Paste in a couple\'s enquiry and get a warm, personal reply draft in your voice — availability, next steps, and a gentle nudge toward booking.',
      samplePrompts: ['Draft a reply to a couple asking about March availability', 'Write a follow-up to someone who went quiet after pricing'],
      ratePerMinute: 8, currency: '₹',
    },
    {
      id: 'shot-list', title: 'Shot List Planner', role: 'Session Planning Assistant', badge: null,
      description: "Turn a client's must-have list and family details into an organised shot list, timed against the day's actual schedule.",
      samplePrompts: ['Build a shot list for a 6-hour wedding with a blended family', 'What golden-hour window works for a 4pm ceremony in October?'],
      ratePerMinute: 8, currency: '₹',
    },
    {
      id: 'gallery-caption', title: 'Gallery Caption Writer', role: 'Portfolio & Blog Assistant', badge: null,
      description: 'Write the blog post or gallery introduction for a recent shoot, in your storytelling voice, from a few notes about the day.',
      samplePrompts: ['Write a blog intro for Ritika & Arjun\'s wedding gallery', 'Draft an Instagram caption for this elopement set'],
      ratePerMinute: 8, currency: '₹',
    },
    {
      id: 'pricing-guide', title: 'Investment Guide Assistant', role: 'Pricing Conversation Helper', badge: null,
      description: 'Get a clear, non-awkward way to explain your pricing and what\'s included, for the client who asks "why does it cost that much?"',
      samplePrompts: ['How do I explain the difference between my two wedding packages?', 'A client wants a discount — how do I respond kindly but firmly?'],
      ratePerMinute: 8, currency: '₹',
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
      style={{ background: T.clay }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 text-white" />
    </button>
  )
}

// ─── Sticky enquire button ─────────────────────────────────────────────────────
function EnquireSticky() {
  return (
    <a href="#enquire"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-xl transition-all hover:scale-105"
      style={{ background: T.clay, color: '#fff' }}>
      <Feather className="w-4 h-4" />
      <span className="font-bold text-sm">Check Your Date</span>
    </a>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  const b = D.business
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-md"
      style={{ background: 'rgba(28,23,18,0.85)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Aperture className="w-5 h-5" style={{ color: T.clayLight }} />
          <span className="font-medium text-base tracking-wide text-white" style={{ fontFamily: SERIF }}>{b.name}</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {[['#gallery','Gallery'],['#packages','Packages'],['#story','Story']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-opacity hover:opacity-60" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</a>
          ))}
        </div>
        <a href="#enquire"
          className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all hover:opacity-90 flex-shrink-0 border"
          style={{ borderColor: T.clayLight, color: T.clayLight }}>
          Enquire
        </a>
      </div>
    </nav>
  )
}

// ─── Hero — the contact sheet ─────────────────────────────────────────────────
function HeroSection() {
  const D = useData()
  const b = D.business

  const frames = [
    { n: '004', span: 'row-span-2 col-span-2', grad: `linear-gradient(160deg, ${T.clay}, ${T.clayDeep})`, delay: 0 },
    { n: '011', span: '', grad: `linear-gradient(160deg, ${T.clayLight}, ${T.clay})`, delay: 90 },
    { n: '014', span: '', grad: `linear-gradient(160deg, #3d2f21, ${T.inkSoft})`, delay: 180 },
    { n: '019', span: 'col-span-2', grad: `linear-gradient(160deg, ${T.clayDeep}, #241a10)`, delay: 270 },
    { n: '023', span: '', grad: `linear-gradient(160deg, ${T.clayLight}, #a8683c)`, delay: 360 },
    { n: '027', span: '', grad: `linear-gradient(160deg, ${T.inkSoft}, ${T.clayDeep})`, delay: 450 },
  ]

  return (
    <section className="relative pt-16 overflow-hidden" style={{ background: T.ink }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `radial-gradient(circle, #fff 0.5px, transparent 0.5px)`,
        backgroundSize: '5px 5px',
      }} />
      <style>{`
        @keyframes frameIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .frame-in { animation: frameIn 0.8s ease both; }
      `}</style>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-14 items-center">
          <div>
            <p className="text-xs tracking-[0.15em] mb-6" style={{ color: T.clayLight, fontFamily: SANS }}>
              {b.city} · Documentary Photography · Est. {2026 - Number(b.years)}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-[3.3rem] leading-[1.12] mb-6 text-white" style={{ fontFamily: SERIF }}>
              We don't stage<br />your story.<br />
              <span style={{ color: T.clayLight, fontStyle: 'italic' }}>We follow it.</span>
            </h1>
            <p className="text-base leading-relaxed mb-9 max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {b.tagline}. {b.sessionsShot} sessions shot, {b.years} years in, still chasing the unposed moment over the perfect one.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#enquire"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full font-semibold text-base transition-all hover:opacity-90"
                style={{ background: T.clay, color: '#fff' }}>
                Check Your Date <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#gallery"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full font-semibold text-base border transition-all hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                View the Gallery
              </a>
            </div>
          </div>

          {/* Contact sheet grid */}
          <div className="grid grid-cols-3 grid-rows-2 gap-2.5 h-[380px] lg:h-[440px]">
            {frames.map((f, i) => (
              <div key={i}
                className={`frame-in relative rounded-sm overflow-hidden border border-white/10 ${f.span}`}
                style={{ background: f.grad, animationDelay: `${f.delay}ms` }}>
                <span className="absolute top-2 left-2.5 text-[10px] tracking-wide" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: SANS }}>
                  Fr. {f.n}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats strip (print / light rhythm) ──────────────────────────────────────
function StatsSection() {
  const D = useData()
  const b = D.business
  const stats = [
    { label: 'Sessions shot', value: b.sessionsShot },
    { label: 'Years behind the camera', value: b.years },
    { label: `Reviews · ${b.rating}★`, value: b.reviews },
    { label: 'Gallery delivery', value: b.turnaround },
  ]
  return (
    <section style={{ background: T.linen }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="px-6 py-8 border-r border-b last:border-r-0 lg:last:border-r-0" style={{ borderColor: T.border }}>
              <p className="text-3xl" style={{ color: T.clayDeep, fontFamily: SERIF }}>{s.value}</p>
              <p className="text-xs mt-1.5" style={{ color: T.muted }}>{s.label}</p>
            </div>
          ))}
        </div>
        {b.featuredIn?.length > 0 && (
          <div className="py-6 flex flex-wrap items-center gap-x-8 gap-y-2 border-t" style={{ borderColor: T.border }}>
            <span className="text-xs" style={{ color: T.muted }}>Featured in</span>
            {b.featuredIn.map((f, i) => (
              <span key={i} className="text-sm" style={{ color: T.clayDeep, fontFamily: SERIF, fontStyle: 'italic' }}>{f}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Story / philosophy ──────────────────────────────────────────────────────
function StorySection() {
  const D = useData()
  const b = D.business
  return (
    <section id="story" className="py-24" style={{ background: T.cream }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Quote className="w-8 h-8 mb-6" style={{ color: T.clayLight }} />
        <p className="text-2xl md:text-3xl leading-relaxed mb-10" style={{ color: T.text, fontFamily: SERIF, fontStyle: 'italic' }}>
          {b.philosophy}
        </p>
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-lg" style={{ background: T.clay, fontFamily: SERIF }}>
            {b.founder.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-base leading-relaxed mb-4" style={{ color: T.grayText }}>{b.story}</p>
            <p className="text-sm font-semibold" style={{ color: T.text }}>{b.founder}</p>
            <p className="text-xs" style={{ color: T.muted }}>Founder & lead photographer, {b.name}</p>
            {b.toolsUsed && (
              <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs" style={{ borderColor: T.border, color: T.muted }}>
                <Camera className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span><strong>Craft & Gear:</strong> {b.toolsUsed}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Gallery grid ─────────────────────────────────────────────────────────────
function GallerySection() {
  const D = useData()
  const spanClass = { lg: 'sm:col-span-2 sm:row-span-2', md: 'sm:row-span-2', sm: '' }
  return (
    <section id="gallery" className="py-24" style={{ background: T.ink }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs tracking-[0.15em] mb-3" style={{ color: T.clayLight }}>Portfolio</p>
          <h2 className="text-3xl md:text-4xl text-white" style={{ fontFamily: SERIF }}>A few kinds of stories we tell</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 auto-rows-[160px]">
          {D.gallery.map((g, i) => (
            <div key={i}
              className={`relative rounded-sm overflow-hidden border border-white/10 flex items-end p-5 ${spanClass[g.span] || ''}`}
              style={{ background: `linear-gradient(165deg, ${i % 2 === 0 ? T.clay : T.clayDeep}, ${T.inkSoft})` }}>
              <div>
                <p className="text-lg text-white" style={{ fontFamily: SERIF, fontStyle: 'italic' }}>{g.category}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{g.frames} frames</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Session packages ─────────────────────────────────────────────────────────
function PackagesSection() {
  const D = useData()
  return (
    <section id="packages" className="py-24" style={{ background: T.linen }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs tracking-[0.15em] mb-3" style={{ color: T.clay }}>Session packages</p>
          <h2 className="text-3xl md:text-4xl" style={{ color: T.text, fontFamily: SERIF }}>Choose how much of the day we cover</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {D.packages.map((pkg, i) => (
            <div key={i} className="rounded-2xl p-7 border flex flex-col" style={{ borderColor: T.border, background: T.white }}>
              <p className="text-xl mb-1" style={{ color: T.text, fontFamily: SERIF }}>{pkg.name}</p>
              <p className="text-xs mb-5" style={{ color: T.muted }}>{pkg.duration}</p>
              <p className="text-3xl mb-6" style={{ color: T.clayDeep, fontFamily: SERIF }}>{pkg.price}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {pkg.deliverables.map((d, di) => (
                  <li key={di} className="flex items-start gap-2.5 text-sm" style={{ color: T.text }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.clay }} />
                    {d}
                  </li>
                ))}
              </ul>
              <a href="#enquire"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: T.clay, color: '#fff' }}>
                Enquire About This
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Custom order / enquiry form — real controlled form ──────────────────────
function EnquiryFormSection() {
  const D = useData()
  const b = D.business
  const [form, setForm] = useState({ name: '', email: '', phone: '', sessionType: '', date: '', location: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    setStatus('sending')
    try {
      const res = await fetch('/api/enquiries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'custom_order_form', business: b.name }),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', phone: '', sessionType: '', date: '', location: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <section id="enquire" className="py-24" style={{ background: T.cream }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-[0.15em] mb-3" style={{ color: T.clay }}>Custom enquiry</p>
          <h2 className="text-3xl md:text-4xl mb-3" style={{ color: T.text, fontFamily: SERIF }}>Tell us about your day</h2>
          <p className="text-sm" style={{ color: T.muted }}>We reply within 24 hours with availability and a tailored quote.</p>
        </div>

        {status === 'success' ? (
          <div className="rounded-2xl border p-10 text-center" style={{ borderColor: T.border, background: T.white }}>
            <CheckCircle className="w-10 h-10 mx-auto mb-4" style={{ color: T.clay }} />
            <p className="text-lg mb-2" style={{ color: T.text, fontFamily: SERIF }}>Got it — thank you.</p>
            <p className="text-sm" style={{ color: T.muted }}>We'll be in touch within 24 hours to talk through your date.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border p-8 space-y-5" style={{ borderColor: T.border, background: T.white }}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Your name</label>
                <input required value={form.name} onChange={update('name')} type="text"
                  className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: T.border, '--tw-ring-color': T.clayLight }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Email</label>
                <input required value={form.email} onChange={update('email')} type="email"
                  className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: T.border }} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Phone / WhatsApp</label>
                <input value={form.phone} onChange={update('phone')} type="tel"
                  className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: T.border }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Session type</label>
                <select value={form.sessionType} onChange={update('sessionType')}
                  className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: T.border }}>
                  <option value="">Select one</option>
                  {D.packages.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
                  <option value="Something else">Something else</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Preferred date</label>
                <input value={form.date} onChange={update('date')} type="date"
                  className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: T.border }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Location</label>
                <input value={form.location} onChange={update('location')} type="text" placeholder="City or venue"
                  className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: T.border }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Tell us about your day</label>
              <textarea value={form.message} onChange={update('message')} rows={4}
                className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ borderColor: T.border }} />
            </div>

            {status === 'error' && (
              <p className="text-sm" style={{ color: '#b91c1c' }}>Something went wrong sending that — try again, or WhatsApp us directly below.</p>
            )}

            <button type="submit" disabled={status === 'sending'}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: T.clay, color: '#fff' }}>
              <Send className="w-4 h-4" /> {status === 'sending' ? 'Sending...' : 'Send Enquiry'}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-6" style={{ color: T.muted }}>
          Prefer WhatsApp?{' '}
          <a href={`https://wa.me/${b.whatsapp}?text=Hi! I'd like to enquire about a session.`}
            target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: T.clayDeep }}>
            Message us directly
          </a>
        </p>
      </div>
    </section>
  )
}

// ─── Client notes ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const D = useData()
  return (
    <section className="py-24" style={{ background: T.linen }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs tracking-[0.15em] mb-3" style={{ color: T.clay }}>Notes from clients</p>
          <h2 className="text-3xl md:text-4xl" style={{ color: T.text, fontFamily: SERIF }}>{D.business.reviews} stories, {D.business.rating}★ average</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {D.testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl p-7 border" style={{ borderColor: T.border, background: T.white }}>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-current" style={{ color: T.clayLight }} />
                ))}
              </div>
              <p className="text-base leading-relaxed mb-5" style={{ color: T.text, fontFamily: SERIF, fontStyle: 'italic' }}>"{t.text}"</p>
              <p className="text-sm font-semibold" style={{ color: T.text }}>{t.name}</p>
              <p className="text-xs" style={{ color: T.muted }}>{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── AI Studio Tools — shared AgentsSection pattern ──────────────────────────
function AgentsSection() {
  const D = useData()
  if (!D.agents?.length) return null
  return (
    <section className="py-24" style={{ background: T.cream }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs tracking-[0.15em] mb-3" style={{ color: T.clay }}>Behind the scenes</p>
          <h2 className="text-3xl md:text-4xl mb-3" style={{ color: T.text, fontFamily: SERIF }}>AI tools for the studio's admin side</h2>
          <p className="text-base max-w-2xl" style={{ color: T.muted }}>Help with the parts that aren't shooting — replies, planning, captions — priced separately.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {D.agents.map((agent) => {
            const Icon = agent.icon || AGENT_ICON_FALLBACK
            return (
              <div key={agent.id} className="rounded-2xl border p-5 flex flex-col justify-between" style={{ borderColor: T.border, background: T.white }}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: T.linen }}>
                      <Icon className="w-5 h-5" style={{ color: T.clay }} />
                    </div>
                    {agent.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: T.linenDeep, color: T.clayDeep }}>{agent.badge}</span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold mb-1" style={{ color: T.clay }}>{agent.role}</p>
                  <h3 className="text-base mb-2" style={{ color: T.text, fontFamily: SERIF }}>{agent.title}</h3>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: T.muted }}>{agent.description}</p>
                  {agent.samplePrompts?.[0] && (
                    <p className="text-xs italic mb-4" style={{ color: T.grayText }}>"{agent.samplePrompts[0]}"</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: T.border }}>
                  <span className="text-xs font-bold" style={{ color: T.clayDeep }}>{agent.currency}{agent.ratePerMinute}/min</span>
                  <button className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: T.clay }}>
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
    <section className="py-24" style={{ background: T.linen }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs tracking-[0.15em] mb-3" style={{ color: T.clay }}>Good to know</p>
          <h2 className="text-3xl md:text-4xl" style={{ color: T.text, fontFamily: SERIF }}>Questions before you book</h2>
        </div>
        <div className="space-y-3">
          {D.faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.cream : T.white }}>
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`} style={{ color: T.clay }} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.muted, background: T.cream }}>{f.a}</div>
              )}
            </div>
          ))}
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
              <Aperture className="w-5 h-5" style={{ color: T.clayLight }} />
              <span className="text-base text-white" style={{ fontFamily: SERIF }}>{b.name}</span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{b.tagline}.</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{b.city}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.1em] mb-4" style={{ color: T.clayLight }}>Explore</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {[['#gallery','Gallery'],['#packages','Packages'],['#story','Story'],['#','Print & Licensing']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-[0.1em] mb-4" style={{ color: T.clayLight }}>Contact</p>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <li><a href={`mailto:${b.email}`} className="hover:text-white transition-colors">{b.email}</a></li>
              <li><a href={`tel:${b.phone}`} className="hover:text-white transition-colors">{b.phone}</a></li>
            </ul>
            <a href={`https://wa.me/${b.whatsapp}?text=Hi! I'd like to enquire about a session.`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:opacity-90"
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
export default function EducationMigrationTemplate({ data }) {
  const value = payloadToData(data)
  return (
    <DataCtx.Provider value={value}>
      <div className="min-h-screen" style={{ fontFamily: SANS }}>
        <TemplateNav />
        <HeroSection />
        <StatsSection />
        <StorySection />
        <GallerySection />
        <PackagesSection />
        <EnquiryFormSection />
        <TestimonialsSection />
        <AgentsSection />
        <FAQSection />
        <TemplateFooter />
        <EnquireSticky />
        <ScrollToTop />
      </div>
    </DataCtx.Provider>
  )
}