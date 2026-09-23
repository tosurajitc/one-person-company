'use client'

/**
 * Template 8 — Local Service Pro
 * Section: Local & Trade Businesses
 * Theme: Local · Forest Green #166534 + Saffron #f97316
 *
 * DESIGN CONCEPT: "Neighbourhood Expert"
 * ─────────────────────────────────────────────────────────────────────────────
 * Most local service websites look the same — boring header, stock photo,
 * a phone number. This template breaks that pattern with:
 *
 *  • A full-bleed MAP-STYLE hero with locality pins — signals hyper-local presence
 *  • A "Why locals trust us" TRUST WALL — GST badge, year established, review count
 *  • A SERVICE MENU grid — like a restaurant menu, scannable and price-transparent
 *  • A floating WhatsApp sticky button — the #1 CTA for local Indian services
 *  • A "HOW IT WORKS" timeline — horizontal scroll on mobile
 *  • A TESTIMONIALS carousel with locality label ("Andheri West · 2 weeks ago")
 *  • A COVERAGE MAP section — lists every area served as a tag cloud
 *  • An FAQ built around local objections (GST, payment, visits, guarantees)
 *
 * DATA MAP — user_site_settings keys:
 *  general   → business_name, tagline, location, phone, whatsapp, email, gst_number
 *  brand     → primary_color, logo_url
 *  hero      → headline, subheadline, cta_text, hero_image_url
 *  about     → founder_name, story, years_experience, team_size
 *  offers    → offers[] { title, description, price, duration, type }
 *  proof     → testimonials[] { name, role, quote, rating, locality }
 *  contact   → booking_url, whatsapp_number, form_enabled, trust_badges[]
 *  faq       → items[] { question, answer }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import {
  Phone, MessageCircle, MapPin, Star, ChevronDown, CheckCircle,
  ArrowRight, Shield, Clock, Award, Wrench, Users, ThumbsUp,
  ChevronLeft, ChevronRight, ChevronUp, Calendar, Zap, IndianRupee,
  BadgeCheck, Home, Building2, Hammer
} from 'lucide-react'
import { useState, useEffect, useRef, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── payloadToData ────────────────────────────────────────────────────────────
function payloadToData(payload) {
  if (!payload) return SAMPLE
  const biz  = payload.business   || {}
  const pos  = payload.positioning || {}
  const prf  = payload.proof      || {}
  const fd   = payload.frontDoor  || {}
  const know = payload.knowledge  || {}
  const off  = payload.offers     || {}
  const td   = payload.template_data || {}
  const owner = biz.owner || {}
  const o = (v, fb) => (v && String(v).trim() ? v : fb)
  const mappedProcess = (know.process || []).filter(s => s?.title).map((s, i) => ({
    step: String(i + 1).padStart(2, '0'),
    icon: SAMPLE.process[i]?.icon || null,
    title: s.title,
    desc:  s.detail || '',
  }))
  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer).map(f => ({ q: f.question, a: f.answer }))
  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote).map(t => ({ name: t.name || '', role: t.role || '', rating: 5, quote: t.quote, job: t.result || '' }))
  return {
    business: {
      name:      o(biz.brandName, SAMPLE.business.name),
      tagline:   o(biz.tagline, SAMPLE.business.tagline),
      desc:      o(pos.credibility, SAMPLE.business.desc),
      phone:     o(owner.whatsapp, SAMPLE.business.phone),
      email:     o(owner.email, SAMPLE.business.email),
      whatsapp:  o(owner.whatsapp, SAMPLE.business.whatsapp),
      location:  o(`${biz.city || ''}${biz.country && biz.country !== 'India' ? ', ' + biz.country : ''}`.trim(), SAMPLE.business.location),
      areas:     Array.isArray(td.service_areas) ? td.service_areas : SAMPLE.business.areas,
      jobsDone:  td.jobs_done || SAMPLE.business.jobsDone,
      rating:    prf.results?.find(r => r?.label?.toLowerCase().includes('rating'))?.number || SAMPLE.business.rating,
      reviews:   SAMPLE.business.reviews,
      bookingUrl: fd.bookingUrl || '#contact',
    },
    badges:       SAMPLE.badges,
    services:     SAMPLE.services,
    process:      mappedProcess.length ? mappedProcess : SAMPLE.process,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  forest:       '#0f5028',
  forestDark:   '#0a3a1c',
  forestLight:  '#156b38',
  forestPale:   '#f0fdf4',
  saffron:      '#f97316',
  saffronDark:  '#ea580c',
  saffronLight: '#fb923c',
  saffronPale:  '#fff7ed',
  white:        '#ffffff',
  ink:          '#0c1f0e',
  text:         '#1a2e1b',
  muted:        '#4b7155',
  border:       '#bbf7d0',
  bg:           '#f8fffe',
  card:         '#ffffff',
  gray:         '#f1f5f9',
  grayText:     '#64748b',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  business: {
    name:         'FixItRight Home Services',
    tagline:      'Mumbai\'s most trusted plumbing, electrical & carpentry service',
    type:         'Home Services',
    city:         'Mumbai',
    areas:        ['Andheri', 'Bandra', 'Juhu', 'Versova', 'Lokhandwala', 'Oshiwara', 'Goregaon', 'Malad', 'Borivali', 'Kandivali', 'Jogeshwari', 'Vile Parle'],
    phone:        '+91 98200 12345',
    whatsapp:     '9820012345',
    email:        'hello@fixitright.in',
    established:  '2011',
    gst:          '27AABCF1234A1Z5',
    teamSize:     '12',
    jobsDone:     '8,400+',
    rating:       4.8,
    reviews:      1240,
    response:     '< 90 min',
  },
  badges: [
    { icon: BadgeCheck, label: 'GST Registered',      sub: '27AABCF1234A1Z5' },
    { icon: Shield,     label: 'Insured & Bonded',     sub: 'All work guaranteed' },
    { icon: Award,      label: 'Since 2011',           sub: '14 years in business' },
    { icon: ThumbsUp,   label: '4.8★ on Google',       sub: '1,240 reviews' },
  ],
  services: [
    {
      category: 'Plumbing',
      icon:     Wrench,
      color:    T.forest,
      items: [
        { name: 'Tap / Faucet Repair',       price: '₹299',   duration: '30–60 min' },
        { name: 'Pipe Leak Fix',              price: '₹499',   duration: '1–2 hrs'   },
        { name: 'Water Heater Installation', price: '₹799',   duration: '1–2 hrs'   },
        { name: 'Drain Cleaning (Jetting)',  price: '₹999',   duration: '1–3 hrs'   },
        { name: 'Full Bathroom Plumbing',    price: '₹4,999+',duration: 'Half day'  },
      ],
    },
    {
      category: 'Electrical',
      icon:     Zap,
      color:    T.saffron,
      items: [
        { name: 'Switch / Socket Repair',    price: '₹249',   duration: '30 min'    },
        { name: 'Fan Installation',          price: '₹399',   duration: '30–45 min' },
        { name: 'MCB / Fuse Replacement',    price: '₹499',   duration: '45–60 min' },
        { name: 'Wiring (per room)',          price: '₹2,499', duration: '2–4 hrs'   },
        { name: 'AC Power Point Setup',      price: '₹699',   duration: '1 hr'      },
      ],
    },
    {
      category: 'Carpentry',
      icon:     Hammer,
      color:    '#92400e',
      items: [
        { name: 'Door / Hinge Repair',       price: '₹349',   duration: '30–60 min' },
        { name: 'Furniture Assembly',        price: '₹599',   duration: '1–3 hrs'   },
        { name: 'Wardrobe Installation',     price: '₹1,499', duration: '2–4 hrs'   },
        { name: 'False Ceiling Work',        price: '₹8,999+',duration: '1–2 days'  },
        { name: 'Custom Shelving',           price: '₹2,999+',duration: 'Half–1 day'},
      ],
    },
  ],
  process: [
    { step: '01', icon: MessageCircle, title: 'WhatsApp or Call',     desc: 'Tell us what needs fixing. Send a photo for faster diagnosis. We confirm in under 15 minutes.' },
    { step: '02', icon: Calendar,      title: 'Book a Slot',           desc: 'Same day or next day slots available. Morning, afternoon, or evening — you choose.' },
    { step: '03', icon: BadgeCheck,    title: 'Technician Arrives',    desc: 'Uniformed, verified technician with tools. You get their name and photo before arrival.' },
    { step: '04', icon: CheckCircle,   title: 'Job Done. Invoice Sent',desc: 'Work completed, tested, and signed off. GST invoice sent to WhatsApp or email immediately.' },
  ],
  testimonials: [
    { name: 'Rajesh Sharma',   area: 'Andheri West',  time: '3 days ago',  rating: 5, text: 'Booked at 9am, technician arrived by 11. Pipe leak fixed in 45 minutes. Transparent pricing, no surprises. Will use again.' },
    { name: 'Priya Mehta',     area: 'Bandra West',   time: '1 week ago',  rating: 5, text: 'The electrician was thorough and professional. He actually explained what was wrong before starting. First time I understood my own wiring.' },
    { name: 'Suresh Nair',     area: 'Juhu',          time: '2 weeks ago', rating: 5, text: 'Got the wardrobe assembled in 2 hours. Clean work, no damage to walls. Reasonable rate and GST bill provided on the spot.' },
    { name: 'Anita Desai',     area: 'Lokhandwala',   time: '3 weeks ago', rating: 4, text: 'Responsive on WhatsApp, came the same afternoon. Minor delay but the work quality was excellent. Would recommend.' },
  ],
  faqs: [
    { q: 'Do you provide a GST invoice?',               a: 'Yes — every job comes with a GST invoice sent to your WhatsApp or email immediately after work is completed. Our GSTIN: 27AABCF1234A1Z5.' },
    { q: 'What areas of Mumbai do you cover?',          a: 'We cover Andheri, Bandra, Juhu, Versova, Lokhandwala, Oshiwara, Goregaon, Malad, Borivali, Kandivali, Jogeshwari, and Vile Parle. WhatsApp us to confirm your pincode.' },
    { q: 'How quickly can a technician arrive?',        a: 'For urgent jobs, we aim to arrive within 90 minutes. Scheduled slots are available same-day or next-day, morning to evening.' },
    { q: 'Are your technicians verified and insured?',  a: 'All our technicians are background-verified, trained, and covered under our workmanship guarantee. If the fix doesn\'t hold, we redo it free within 30 days.' },
    { q: 'What payment methods do you accept?',         a: 'UPI (GPay, PhonePe, Paytm), cash, and card. Payment is only collected after the job is completed and you are satisfied.' },
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
      style={{ background: T.forest }}
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
      href={`https://wa.me/${D.business.whatsapp}?text=Hi! I need help with a home service job.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all hover:scale-105"
      style={{ background: '#25d366', color: '#fff' }}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="font-bold text-sm">WhatsApp Us</span>
    </a>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  const b = D.business
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-md"
      style={{ background: 'rgba(255,255,255,0.97)', borderColor: T.border }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.forest }}>
            <Home className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm leading-tight" style={{ color: T.text }}>{b.name}</p>
            <p className="text-[10px] leading-tight" style={{ color: T.muted }}>{b.city} · Est. {b.established}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-5 text-sm">
          {[['#services','Services'],['#how-it-works','How It Works'],['#reviews','Reviews']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-opacity hover:opacity-60" style={{ color: T.grayText }}>{label}</a>
          ))}
        </div>
        <a href={`tel:${b.phone}`}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: T.forest }}>
          <Phone className="w-4 h-4" /> Call Now
        </a>
      </div>
    </nav>
  )
}

// ─── Hero — map-style with locality pins ─────────────────────────────────────
function HeroSection() {
  const D = useData()
  const b = D.business
  return (
    <section className="relative pt-14 overflow-hidden min-h-[92vh] flex items-center" style={{ background: `linear-gradient(160deg, #020d05 0%, #051a0a 35%, ${T.forestDark} 70%, #0d3d1c 100%)` }}>

      {/* Pseudo map grid — subtle dot pattern suggesting a map */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Warm saffron glow bottom-right */}
      <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full blur-3xl opacity-15" style={{ background: T.saffron }} />

      {/* Floating locality pin cards — decorative */}
      {[
        { area: 'Andheri', top: '18%',  left: '62%',  delay: '0s' },
        { area: 'Bandra',  top: '38%',  left: '75%',  delay: '0.4s' },
        { area: 'Juhu',    top: '60%',  left: '65%',  delay: '0.8s' },
        { area: 'Malad',   top: '22%',  left: '82%',  delay: '1.2s' },
      ].map((pin, i) => (
        <div
          key={i}
          className="absolute hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg text-xs font-bold"
          style={{
            top: pin.top, left: pin.left,
            background: 'rgba(255,255,255,0.95)',
            color: T.forest,
            border: `1px solid ${T.border}`,
            animation: `pulse 3s ease-in-out ${pin.delay} infinite`,
          }}
        >
          <MapPin className="w-3 h-3" style={{ color: T.saffron }} />
          {pin.area}
        </div>
      ))}

      <style>{`@keyframes pulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-2xl">
          {/* Location pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold mb-6"
            style={{ borderColor: 'rgba(249,115,22,0.4)', color: T.saffronLight, background: 'rgba(249,115,22,0.08)' }}>
            <MapPin className="w-3.5 h-3.5" />
            Serving {b.city} — {b.areas.slice(0,4).join(' · ')} & more
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] mb-5">
            Home repairs,<br />
            <span style={{ color: T.saffron }}>done right.</span><br />
            <span className="text-3xl sm:text-4xl font-black" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Same day. Guaranteed.
            </span>
          </h1>

          <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {b.tagline}. {b.jobsDone} jobs done since {b.established} — every one backed by our 30-day workmanship guarantee.
          </p>

          {/* Dual CTA */}
          <div className="flex flex-wrap gap-4 mb-10">
            <a href={`https://wa.me/${b.whatsapp}?text=Hi! I need help with a home service job.`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-black text-base transition-all hover:opacity-90 shadow-lg"
              style={{ background: '#25d366', color: '#fff' }}>
              <MessageCircle className="w-5 h-5" /> Book on WhatsApp
            </a>
            <a href={`tel:${b.phone}`}
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-black text-base border transition-all hover:bg-white hover:bg-opacity-5"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              <Phone className="w-5 h-5" /> {b.phone}
            </a>
          </div>

          {/* Quick trust row */}
          <div className="flex flex-wrap gap-5">
            {[
              { label: b.jobsDone + ' Jobs Done' },
              { label: b.rating + '★ Rating (' + b.reviews + ' reviews)' },
              { label: b.response + ' Response' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <CheckCircle className="w-4 h-4" style={{ color: T.saffron }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Trust wall ───────────────────────────────────────────────────────────────
function TrustWallSection() {
  const D = useData()
  const b = D.business
  return (
    <section style={{ background: T.forest }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {useData().badges.map(({ icon: Icon, label, sub }, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-5 border-r border-b last:border-r-0"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">{label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Service menu ─────────────────────────────────────────────────────────────
function ServicesSection() {
  const [activeTab, setActiveTab] = useState(0)
  const D = useData()
  const b = D.business
  const cat = useData().services[activeTab]

  return (
    <section id="services" className="py-20" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.forest }}>What we fix</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Service menu & pricing</h2>
          <p className="mt-2 text-base" style={{ color: T.muted }}>
            Transparent rates. No surprise charges. GST included.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-3 mb-7 overflow-x-auto pb-1">
          {useData().services.map((s, i) => {
            const Icon = s.icon
            return (
              <button key={i} onClick={() => setActiveTab(i)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm flex-shrink-0 border transition-all"
                style={{
                  background: activeTab === i ? s.color : T.white,
                  color: activeTab === i ? '#fff' : T.grayText,
                  borderColor: activeTab === i ? s.color : T.border,
                }}>
                <Icon className="w-4 h-4" /> {s.category}
              </button>
            )
          })}
        </div>

        {/* Service rows — menu style */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
          {/* Header */}
          <div className="grid grid-cols-12 px-6 py-3 text-xs font-bold uppercase tracking-widest border-b"
            style={{ background: cat.color, color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="col-span-6">Service</span>
            <span className="col-span-3 text-right">From</span>
            <span className="col-span-3 text-right">Time</span>
          </div>
          {cat.items.map((item, i) => (
            <div key={i}
              className="grid grid-cols-12 px-6 py-4 border-b last:border-0 items-center hover:bg-green-50 transition-colors cursor-pointer group"
              style={{ borderColor: T.border }}>
              <div className="col-span-6">
                <p className="font-semibold text-sm group-hover:text-green-800 transition-colors" style={{ color: T.text }}>{item.name}</p>
              </div>
              <div className="col-span-3 text-right">
                <span className="font-black text-sm" style={{ color: T.forest }}>{item.price}</span>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: T.saffronPale, color: T.saffronDark }}>{item.duration}</span>
              </div>
            </div>
          ))}
          {/* Footer CTA */}
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: T.forestPale }}>
            <p className="text-sm" style={{ color: T.muted }}>Don't see your job? WhatsApp us for a custom quote.</p>
            <a href={`https://wa.me/${D.business.whatsapp}?text=I need a quote for ${cat.category} work`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
              style={{ background: '#25d366' }}>
              <MessageCircle className="w-4 h-4" /> Get a Quote
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How it works — horizontal timeline ──────────────────────────────────────
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20" style={{ background: T.white }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.forest }}>Simple process</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>From booking to done — in 4 steps</h2>
        </div>

        {/* Timeline — horizontal on desktop, vertical on mobile */}
        <div className="relative">
          {/* Connector line — desktop */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5" style={{ background: T.border }} />

          <div className="grid md:grid-cols-4 gap-6">
            {useData().process.map(({ step, icon: Icon, title, desc }, i) => (
              <div key={i} className="relative flex flex-col items-center text-center md:items-center">
                {/* Step circle */}
                <div className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-sm border-4"
                  style={{
                    background: i % 2 === 0 ? T.forest : T.saffron,
                    borderColor: T.white,
                  }}>
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

// ─── Testimonials with locality label ────────────────────────────────────────
function ReviewsSection() {
  const data = useData()
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState(1)

  const navigate = (dir) => {
    setDirection(dir)
    setActive(prev => (prev + dir + data.testimonials.length) % data.testimonials.length)
  }

  const t = data.testimonials[active]

  return (
    <section id="reviews" className="py-20" style={{ background: T.forestDark }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.saffron }}>What customers say</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {data.business.reviews} reviews · {data.business.rating}★ average
            </h2>
          </div>
          {/* Nav arrows */}
          <div className="flex gap-2">
            {[[-1, ChevronLeft], [1, ChevronRight]].map(([dir, Icon], i) => (
              <button key={i} onClick={() => navigate(dir)}
                className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:border-green-400"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Review card */}
        <div className="rounded-2xl p-8 border mb-6" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Stars */}
          <div className="flex gap-1 mb-5">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" style={{ color: T.saffron }} />
            ))}
          </div>
          <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-6">"{t.text}"</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm"
                style={{ background: T.forest, color: '#fff' }}>
                {t.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.area} · {t.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(249,115,22,0.12)', color: T.saffronLight, border: '1px solid rgba(249,115,22,0.2)' }}>
              <MapPin className="w-3 h-3" /> {t.area}
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex gap-2">
          {useData().testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: active === i ? T.saffron : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Coverage area tag cloud ──────────────────────────────────────────────────
function CoverageSection() {
  const D = useData()
  const b = D.business
  return (
    <section className="py-16" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.forest }}>Service Area</p>
            <h2 className="text-2xl font-black" style={{ color: T.text }}>We cover all of</h2>
            <h2 className="text-4xl font-black" style={{ color: T.forest }}>{b.city}</h2>
            <p className="text-sm mt-2" style={{ color: T.muted }}>Not sure if we reach you?<br />WhatsApp your pincode.</p>
            <a href={`https://wa.me/${b.whatsapp}?text=Do you cover pincode `}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: '#25d366' }}>
              <MessageCircle className="w-4 h-4" /> Check my area
            </a>
          </div>
          {/* Area tag cloud */}
          <div className="flex flex-wrap gap-2 flex-1">
            {b.areas.map((area, i) => (
              <span key={i}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm border"
                style={{ background: T.white, borderColor: T.border, color: T.forest }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: T.saffron }} />
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState(null)
  const D = useData()
  const b = D.business
  return (
    <section className="py-20" style={{ background: T.white }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.forest }}>Before you book</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Common questions</h2>
        </div>
        <div className="space-y-3">
          {useData().faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.forestPale : T.white }}>
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`} style={{ color: T.forest }} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.muted, background: T.forestPale }}>
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

// ─── Booking CTA ──────────────────────────────────────────────────────────────
function BookingSection() {
  const D = useData()
  const b = D.business
  return (
    <section id="book" className="py-20"
      style={{ background: `linear-gradient(135deg, ${T.forestDark} 0%, ${T.forest} 60%, ${T.forestLight} 100%)` }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.saffronLight }}>Book a service</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Ready to get it fixed?
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
              WhatsApp us a photo of the problem. We'll confirm availability and send a technician — often the same day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={`https://wa.me/${b.whatsapp}?text=Hi! I need help with a home service job.`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-black text-base transition-all hover:opacity-90 shadow-lg"
                style={{ background: '#25d366', color: '#fff' }}>
                <MessageCircle className="w-5 h-5" /> Book on WhatsApp
              </a>
              <a href={`tel:${b.phone}`}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-black text-base border transition-all hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                <Phone className="w-5 h-5" /> Call {b.phone}
              </a>
            </div>
          </div>
          {/* Trust card */}
          <div className="rounded-2xl p-7 border" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="font-bold text-white mb-5 text-sm">Every booking includes:</p>
            <ul className="space-y-4">
              {[
                'Named technician with photo ID — sent before arrival',
                'Transparent quote before work starts — no surprise bills',
                'GST invoice on completion — WhatsApp or email',
                '30-day workmanship guarantee — free redo if it fails',
                'UPI / Cash / Card payment — only after you are satisfied',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.saffron }} />
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.forest }}>
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white">{b.name}</span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {b.tagline}. Est. {b.established}.
            </p>
            <div className="text-xs space-y-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <p>GST: {b.gst}</p>
              <p>{b.city}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.saffron }}>Services</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {useData().services.map(s => (
                <li key={s.category}><a href="#services" className="hover:text-white transition-colors">{s.category}</a></li>
              ))}
              {[['#how-it-works','How It Works'],['#reviews','Customer Reviews'],['#','Privacy Policy']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.saffron }}>Contact</p>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <li><a href={`tel:${b.phone}`} className="hover:text-white transition-colors">{b.phone}</a></li>
              <li><a href={`mailto:${b.email}`} className="hover:text-white transition-colors">{b.email}</a></li>
              <li>{b.city}</li>
            </ul>
            <a href={`https://wa.me/${b.whatsapp}?text=Hi! I need help with a home service job.`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: '#25d366' }}>
              <MessageCircle className="w-4 h-4" /> WhatsApp Us
            </a>
          </div>
        </div>
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
          <span>© {new Date().getFullYear()} {b.name}. All rights reserved. GST: {b.gst}</span>
          <Link href="/templates" className="hover:text-white transition-colors">← Browse all templates on OPC Genie</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LocalServiceProTemplate({ data }) {
  const value = payloadToData(data)
  return (
    <DataCtx.Provider value={value}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <TemplateNav />
        <HeroSection />
        <TrustWallSection />
        <ServicesSection />
        <HowItWorksSection />
        <ReviewsSection />
        <CoverageSection />
        <FAQSection />
        <BookingSection />
        <TemplateFooter />
        <WhatsAppSticky />
        <ScrollToTop />
      </div>
    </DataCtx.Provider>
  )
}
