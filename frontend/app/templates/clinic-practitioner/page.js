'use client'

/**
 * Template 9 — Clinic / Practitioner
 * Section: Local & Trade Businesses
 * Theme: Local · Medical Blue #0369a1 + Lavender #7c3aed
 *
 * DESIGN CONCEPT: "The Trusted Clinic"
 * ─────────────────────────────────────────────────────────────────────────────
 * Healthcare and wellness practitioners need more than a website — they need
 * a trust platform. This template is built around:
 *
 *  • A clean HERO with doctor/practitioner photo slot + immediate booking CTA
 *  • A CREDENTIALS WALL — degrees, registrations, affiliations, years active
 *  • A SPECIALITIES grid — conditions treated / services offered with brief desc
 *  • A "HOW IT WORKS" 3-step consultation flow — simple, reassuring
 *  • A TESTIMONIALS section — patient experience quotes (no medical claims)
 *  • An APPOINTMENTS section — working hours, modes (in-person / online / home visit)
 *  • A STICKY WhatsApp / phone bar for instant booking
 *  • An extensive FAQ section — the most visited section for healthcare
 *  • A footer with registration numbers, disclaimer, and address
 *
 * DATA MAP — user_site_settings keys:
 *  general   → business_name, tagline, location, phone, whatsapp, email, reg_number
 *  brand     → primary_color, logo_url
 *  hero      → headline, subheadline, cta_text, photo_url, clinic_name
 *  about     → doctor_name, qualifications[], bio, experience_years, languages[]
 *  specialities → items[] { name, description, icon_key }
 *  proof     → testimonials[] { name, quote, rating, condition_type }
 *  contact   → booking_url, whatsapp_number, hours[], modes[]
 *  faq       → items[] { question, answer }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import {
  Phone, MessageCircle, MapPin, Star, ChevronDown, CheckCircle,
  ArrowRight, Shield, Clock, Award, Users, Heart,
  ChevronLeft, ChevronRight, ChevronUp, Calendar, Stethoscope,
  GraduationCap, BadgeCheck, Video, Home, Building2,
  Activity, Clipboard, FileText, UserCheck, FlaskConical,
  Brain, Bone, Eye, Baby, Leaf, Pill, HeartPulse, Microscope
} from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  blue:         '#0369a1',
  blueDark:     '#024b73',
  blueDeep:     '#012e47',
  blueLight:    '#0284c7',
  bluePale:     '#f0f8ff',
  blueMid:      '#e0f2fe',
  lavender:     '#7c3aed',
  lavLight:     '#8b5cf6',
  lavPale:      '#f5f3ff',
  white:        '#ffffff',
  ink:          '#0c1929',
  text:         '#0f172a',
  textMid:      '#1e3a5f',
  muted:        '#475569',
  border:       '#bae6fd',
  borderLight:  '#e0f2fe',
  bg:           '#f8fbff',
  card:         '#ffffff',
  gray:         '#f1f5f9',
  grayText:     '#64748b',
  green:        '#059669',
  greenPale:    '#ecfdf5',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  clinic: {
    name:          'Dr. Kavita Sharma',
    title:         'MBBS, MD (Internal Medicine), FRCP (London)',
    clinicName:    'Sharma Wellness Clinic',
    tagline:       'Comprehensive internal medicine & preventive care in South Delhi',
    city:          'New Delhi',
    area:          'Defence Colony',
    phone:         '+91 98112 34567',
    whatsapp:      '9811234567',
    email:         'appointments@sharmawellness.in',
    established:   '2008',
    experience:    '18',
    regNumber:     'DMC/R/8342',
    gst:           '07AABCS5678B1ZX',
    languages:     ['English', 'Hindi', 'Punjabi'],
    consultations: '22,000+',
    rating:        4.9,
    reviews:       870,
    photo:         null, // placeholder — AI fills this
  },
  credentials: [
    { icon: GraduationCap, label: 'MBBS · MD · FRCP',      sub: 'Lady Hardinge + AIIMS + London' },
    { icon: BadgeCheck,    label: 'DMC Reg. #8342',         sub: 'Delhi Medical Council' },
    { icon: Award,        label: '18 Years Experience',     sub: '22,000+ consultations' },
    { icon: Users,        label: '4.9★ Patient Rating',     sub: '870 verified reviews' },
  ],
  specialities: [
    {
      icon:  HeartPulse,
      name:  'Cardiac Risk Assessment',
      desc:  'Complete heart health workup — ECG, lipid panel, blood pressure management, and lifestyle counselling to reduce your 10-year cardiac risk.',
      color: '#dc2626',
    },
    {
      icon:  Activity,
      name:  'Diabetes Management',
      desc:  'Personalised HbA1c targets, CGM interpretation, medication review, and diet planning for Type 1, Type 2, and pre-diabetic patients.',
      color: T.blue,
    },
    {
      icon:  Leaf,
      name:  'Preventive Health Packages',
      desc:  'Annual health check packages tailored by age and risk profile. Early detection, vaccination schedules, and wellness planning.',
      color: T.green,
    },
    {
      icon:  Brain,
      name:  'Stress & Sleep Disorders',
      desc:  'Evidence-based assessment and management of chronic stress, anxiety-linked symptoms, insomnia, and fatigue syndromes.',
      color: T.lavender,
    },
    {
      icon:  Microscope,
      name:  'Thyroid & Hormonal Health',
      desc:  'Thyroid function interpretation, hormone panel review, PCOS management, and endocrine coordination for complex cases.',
      color: '#0891b2',
    },
    {
      icon:  Pill,
      name:  'Medication Review & Polypharmacy',
      desc:  'For patients on 4+ medications — structured review for interactions, de-prescribing, and simplified regimens. Especially for seniors.',
      color: '#d97706',
    },
  ],
  process: [
    { step: '01', icon: Calendar, title: 'Book an Appointment',      desc: 'Call, WhatsApp, or book online. Choose in-clinic, video, or home visit. Confirmation within 30 minutes.' },
    { step: '02', icon: Clipboard, title: 'Share Medical History',   desc: 'Fill a brief pre-visit form. Bring or upload past reports. Doctor reviews before your slot to maximise consultation time.' },
    { step: '03', icon: Stethoscope, title: 'Consultation',          desc: 'Unhurried 20–30 min slot. Thorough assessment, plain-language explanation, investigation order if needed.' },
    { step: '04', icon: FileText,  title: 'Prescription & Follow-up', desc: 'Digital prescription sent to WhatsApp. Clear follow-up plan. Nurse available on WhatsApp for post-visit questions.' },
  ],
  hours: [
    { day: 'Mon – Fri',  time: '9:00 AM – 1:00 PM & 4:00 PM – 7:00 PM' },
    { day: 'Saturday',   time: '9:00 AM – 2:00 PM' },
    { day: 'Sunday',     time: 'By appointment only (Video consults)' },
  ],
  modes: [
    { icon: Building2,     label: 'In-Clinic',      sub: 'Defence Colony, South Delhi',    available: true },
    { icon: Video,         label: 'Video Consult',   sub: 'Google Meet · Encrypted',        available: true },
    { icon: Home,          label: 'Home Visit',      sub: 'South Delhi (select pincodes)',  available: true },
  ],
  testimonials: [
    { name: 'Sunita Agarwal',  condition: 'Diabetes Management',       rating: 5, text: 'Dr. Sharma actually listens. She spent 35 minutes understanding my lifestyle before changing my medication. My HbA1c went from 9.2 to 6.8 in 6 months. Extraordinary doctor.' },
    { name: 'Vikram Bose',     condition: 'Cardiac Risk Assessment',    rating: 5, text: 'I came in for routine check-up and left with a full picture of my heart health. She caught borderline cholesterol I had been ignoring. The report was comprehensive and the advice was practical.' },
    { name: 'Meena Kulkarni',  condition: 'Thyroid & Hormonal Health',  rating: 5, text: 'After years of being told "your thyroid is fine", Dr. Sharma looked at my free T3 and reverse T3 and found the issue. Finally feel like myself again. She gave me her time and real answers.' },
    { name: 'Rajat Verma',     condition: 'Preventive Health Package',  rating: 5, text: 'The annual health check was the most thorough I\'ve ever had. She explained every reading in plain language, not medical jargon. Knew more about my body after an hour than 10 years of "you\'re fine" reports.' },
  ],
  faqs: [
    {
      q: 'What is the typical waiting time for an appointment?',
      a: 'New patient appointments are available within 2–3 working days. For urgent concerns, same-day slots are kept available — call or WhatsApp before 10 AM. Follow-up patients are typically seen the same or next day.',
    },
    {
      q: 'Do you offer video consultations for patients outside Delhi?',
      a: 'Yes — video consultations are available for patients across India. You will receive a secure Google Meet link 30 minutes before your slot. All prescriptions are issued digitally and comply with MCI telemedicine guidelines.',
    },
    {
      q: 'What should I bring to my first appointment?',
      a: 'Please bring all previous reports (blood tests, scans, ECGs), your current medication list, health insurance card, and a list of symptoms or questions. Sending these on WhatsApp beforehand is even better — it gives Dr. Sharma time to review before your visit.',
    },
    {
      q: 'Does the clinic accept health insurance?',
      a: 'We are empanelled with Mediassist, Star Health, ICICI Lombard, HDFC Ergo, and most major TPAs. Please confirm your TPA before booking. We also issue detailed invoices with ICD codes for self-reimbursement.',
    },
    {
      q: 'How are prescriptions and reports shared?',
      a: 'Prescriptions are sent digitally to your WhatsApp or email — signed with the doctor\'s digital signature. Investigation reports are shared as PDFs via WhatsApp within 2–4 hours of receipt from the lab. Everything is stored securely.',
    },
    {
      q: 'Are home visits available?',
      a: 'Yes, home visits are available for senior patients, post-surgical follow-ups, and mobility-limited patients within Defence Colony, Greater Kailash, Lajpat Nagar, and Vasant Vihar. WhatsApp to check availability and fee.',
    },
    {
      q: 'What is the consultation fee?',
      a: 'In-clinic consultation: ₹800 (new) / ₹500 (follow-up within 30 days). Video consult: ₹700. Home visit: ₹1,500–₹2,500 depending on area. Fees may vary for complex cases requiring extended time. GST invoice provided for all consultations.',
    },
    {
      q: 'Do you prescribe for chronic conditions managed elsewhere?',
      a: 'Yes, for established patients. For new patients requesting prescription-only visits, a brief consultation (even by video) is required to ensure safety and continuity. We do not prescribe controlled substances without an in-person evaluation.',
    },
  ],
  fees: [
    { type: 'New Patient (In-Clinic)',    price: '₹800',   duration: '25–30 min' },
    { type: 'Follow-up (In-Clinic)',      price: '₹500',   duration: '15–20 min' },
    { type: 'Video Consultation',         price: '₹700',   duration: '20–25 min' },
    { type: 'Home Visit',                 price: '₹1,500+',duration: '30–45 min' },
    { type: 'Annual Health Package',      price: '₹3,500', duration: 'Full workup' },
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
  const td   = payload.template_data || {}
  const owner = biz.owner || {}
  const o = (v, fb) => (v && String(v).trim() ? v : fb)
  const a = (v, fb) => (Array.isArray(v) && v.filter(Boolean).length ? v.filter(Boolean) : fb)
  const mappedProcess = (know.process || []).filter(s => s?.title).map((s, i) => ({
    step: String(i + 1).padStart(2, '0'),
    icon: SAMPLE.process[i]?.icon || null,
    title: s.title,
    desc:  s.detail || '',
  }))
  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer).map(f => ({ q: f.question, a: f.answer }))
  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote).map(t => ({ name: t.name || '', role: t.role || '', rating: 5, quote: t.quote }))
  const mappedFees = (payload.offers?.tiers || []).filter(t => t?.name).map((t, i) => {
    const pInr = t.prices?.INR ?? t.priceInr
    const pUsd = t.prices?.USD ?? t.priceUsd
    return {
      name:   t.name,
      price:  pInr ? `₹${Number(pInr).toLocaleString('en-IN')}` : (pUsd ? `$${pUsd}` : SAMPLE.fees[i]?.price || ''),
      desc:   t.summary || SAMPLE.fees[i]?.desc || '',
      detail: Array.isArray(t.deliverables) ? t.deliverables.join(', ') : (t.deliverables || SAMPLE.fees[i]?.detail || ''),
    }
  })
  const specialitiesArr = Array.isArray(td.specialities) ? td.specialities.filter(Boolean).map(s => ({ icon: SAMPLE.specialities[0]?.icon || null, name: s, desc: '', color: SAMPLE.specialities[0]?.color || '' })) : null
  return {
    clinic: {
      name:       o(td.clinic_name || biz.brandName, SAMPLE.clinic.name),
      doctor:     o(owner.name, SAMPLE.clinic.doctor),
      title:      o(td.doctor_title || owner.role, SAMPLE.clinic.title),
      tagline:    o(biz.tagline, SAMPLE.clinic.tagline),
      about:      o(pos.credibility, SAMPLE.clinic.about),
      location:   o(`${biz.city || ''}${biz.country && biz.country !== 'India' ? ', ' + biz.country : ''}`.trim(), SAMPLE.clinic.location),
      phone:      o(owner.whatsapp, SAMPLE.clinic.phone),
      email:      o(owner.email, SAMPLE.clinic.email),
      whatsapp:   o(owner.whatsapp, SAMPLE.clinic.whatsapp),
      regNumber:  td.reg_number || SAMPLE.clinic.regNumber,
      languages:  td.languages || SAMPLE.clinic.languages,
      rating:     td.rating || SAMPLE.clinic.rating,
      reviews:    td.total_reviews || SAMPLE.clinic.reviews,
      consultations: td.consultations || SAMPLE.clinic.consultations,
      bookingUrl: fd.bookingUrl || '#booking',
    },
    credentials: a(prf.credentials, SAMPLE.credentials),
    specialities: specialitiesArr && specialitiesArr.length ? specialitiesArr : SAMPLE.specialities,
    fees:         mappedFees.length ? mappedFees : SAMPLE.fees,
    process:      mappedProcess.length ? mappedProcess : SAMPLE.process,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    modes:        SAMPLE.modes,
    hours:        SAMPLE.hours,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
  }
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
      style={{ background: T.blue }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 text-white" />
    </button>
  )
}

// ─── WhatsApp sticky button ───────────────────────────────────────────────────
function WhatsAppSticky() {
  const D = useData()
  const c = D.clinic
  return (
    <a
      href={`https://wa.me/${c.whatsapp}?text=Hi Dr. Sharma, I would like to book an appointment.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all hover:scale-105"
      style={{ background: '#25d366', color: '#fff' }}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="font-bold text-sm">Book Appointment</span>
    </a>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData(); const c = D.clinic
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-md"
      style={{ background: 'rgba(255,255,255,0.97)', borderColor: T.borderLight }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.blue }}>
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm leading-tight" style={{ color: T.text }}>{c.clinicName}</p>
            <p className="text-[10px] leading-tight" style={{ color: T.muted }}>{c.name} · {c.area}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-5 text-sm">
          {[['#specialities','Specialities'],['#appointment','Appointments'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-opacity hover:opacity-60" style={{ color: T.grayText }}>{label}</a>
          ))}
        </div>
        <a href={`tel:${c.phone}`}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: T.blue }}>
          <Phone className="w-4 h-4" /> Book Now
        </a>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const D = useData(); const c = D.clinic
  return (
    <section className="relative pt-14 overflow-hidden" style={{
      background: `linear-gradient(145deg, ${T.blueDeep} 0%, ${T.blueDark} 40%, #013557 70%, #01263e 100%)`,
      minHeight: '90vh',
    }}>

      {/* Subtle dot matrix bg */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Lavender glow accent */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
        style={{ background: T.lavender }} />

      {/* Floating credential chips — decorative */}
      {[
        { text: 'MBBS · MD',        top: '20%', left: '62%', delay: '0s'   },
        { text: 'FRCP London',      top: '42%', left: '78%', delay: '0.5s' },
        { text: 'DMC Reg. #8342',   top: '62%', left: '68%', delay: '1s'   },
        { text: '18 yrs experience',top: '25%', left: '82%', delay: '1.5s' },
      ].map((chip, i) => (
        <div
          key={i}
          className="absolute hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
          style={{
            top: chip.top, left: chip.left,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            animation: `floatChip 4s ease-in-out ${chip.delay} infinite`,
          }}
        >
          <BadgeCheck className="w-3.5 h-3.5" style={{ color: T.blueLight }} />
          {chip.text}
        </div>
      ))}

      <style>{`
        @keyframes floatChip {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full flex items-center min-h-[calc(90vh-3.5rem)]">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">

          {/* Left — copy */}
          <div>
            {/* Specialty pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold mb-6"
              style={{ borderColor: 'rgba(125,211,252,0.3)', color: '#7dd3fc', background: 'rgba(125,211,252,0.06)' }}>
              <MapPin className="w-3.5 h-3.5" />
              {c.area}, {c.city} · Internal Medicine & Preventive Care
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] mb-4">
              {c.name}
            </h1>
            <p className="text-lg font-medium mb-3" style={{ color: '#93c5fd' }}>{c.title}</p>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {c.tagline}. {c.consultations} consultations over {c.experience} years — with the time and attention every patient deserves.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-10">
              <a href={`https://wa.me/${c.whatsapp}?text=Hi Dr. Sharma, I would like to book an appointment.`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-black text-base transition-all hover:opacity-90 shadow-lg"
                style={{ background: '#25d366', color: '#fff' }}>
                <MessageCircle className="w-5 h-5" /> Book on WhatsApp
              </a>
              <a href={`tel:${c.phone}`}
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-black text-base border transition-all hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                <Phone className="w-5 h-5" /> {c.phone}
              </a>
            </div>

            {/* Quick trust row */}
            <div className="flex flex-wrap gap-5">
              {[
                c.consultations + ' Consultations',
                c.rating + '★ Patient Rating',
                c.experience + ' Years Experience',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: '#7dd3fc' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right — doctor photo placeholder */}
          <div className="hidden lg:flex justify-center items-end">
            <div className="relative">
              {/* Photo container */}
              <div className="w-72 h-80 rounded-3xl overflow-hidden border-4 flex items-center justify-center"
                style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
                {/* If photo_url: replace this div with <img src={photo_url} /> */}
                <div className="text-center px-6">
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: 'rgba(125,211,252,0.1)', border: '2px dashed rgba(125,211,252,0.25)' }}>
                    <UserCheck className="w-10 h-10" style={{ color: 'rgba(125,211,252,0.5)' }} />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">{c.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Photo goes here</p>
                </div>
              </div>
              {/* Floating rating badge */}
              <div className="absolute -bottom-4 -left-4 px-4 py-3 rounded-2xl shadow-xl"
                style={{ background: T.white, border: `1px solid ${T.borderLight}` }}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: '#f59e0b' }} />
                    ))}
                  </div>
                  <span className="font-black text-sm" style={{ color: T.text }}>{c.rating}</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>{c.reviews} verified reviews</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ─── Credentials wall ─────────────────────────────────────────────────────────
function CredentialsWall() {
  return (
    <section style={{ background: T.blue }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {useData().credentials.map(({ icon: Icon, label, sub }, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-5 border-r border-b last:border-r-0"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
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

// ─── Specialities grid ────────────────────────────────────────────────────────
function SpecialitiesSection() {
  return (
    <section id="specialities" className="py-20" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.blue }}>Areas of expertise</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Specialities & conditions treated</h2>
          <p className="mt-3 text-base leading-relaxed" style={{ color: T.muted }}>
            Each speciality area draws on rigorous training and a 20-minute minimum consultation time — so nothing gets missed.
          </p>
        </div>

        {/* 3-column grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useData().specialities.map(({ icon: Icon, name, desc, color }, i) => (
            <div key={i}
              className="group p-6 rounded-2xl border bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-200"
              style={{ borderColor: T.borderLight }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}14` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: T.text }}>{name}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer note */}
        <p className="mt-6 text-xs text-center" style={{ color: T.grayText }}>
          Not seeing your concern? <a href={`https://wa.me/${useData().clinic.whatsapp}?text=I have a question about a condition`} className="underline" style={{ color: T.blue }}>WhatsApp for a quick check</a> — if it falls outside scope, we'll refer you to the right specialist.
        </p>
      </div>
    </section>
  )
}

// ─── Consultation fee table ───────────────────────────────────────────────────
function FeesSection() {
  return (
    <section className="py-20" style={{ background: T.white }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.blue }}>Transparent pricing</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Consultation fees</h2>
          <p className="mt-2 text-base" style={{ color: T.muted }}>
            No hidden charges. GST invoice for every consultation. Insurance TPA billing available.
          </p>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: T.borderLight }}>
          {/* Header */}
          <div className="grid grid-cols-12 px-6 py-3 text-xs font-bold uppercase tracking-widest border-b"
            style={{ background: T.blue, color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="col-span-6">Type</span>
            <span className="col-span-3 text-right">Fee</span>
            <span className="col-span-3 text-right">Duration</span>
          </div>
          {useData().fees.map((f, i) => (
            <div key={i}
              className="grid grid-cols-12 px-6 py-4 border-b last:border-0 items-center hover:bg-blue-50 transition-colors"
              style={{ borderColor: T.borderLight }}>
              <div className="col-span-6">
                <p className="font-semibold text-sm" style={{ color: T.text }}>{f.type}</p>
              </div>
              <div className="col-span-3 text-right">
                <span className="font-black text-sm" style={{ color: T.blue }}>{f.price}</span>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: T.lavPale, color: T.lavender }}>{f.duration}</span>
              </div>
            </div>
          ))}
          {/* Footer note */}
          <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ background: T.blueMid }}>
            <p className="text-sm" style={{ color: T.textMid }}>Insurance empanelled: Mediassist · Star Health · ICICI Lombard · HDFC Ergo</p>
            <a href={`https://wa.me/${useData().clinic.whatsapp}?text=I would like to confirm insurance coverage`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
              style={{ background: T.blue }}>
              <MessageCircle className="w-4 h-4" /> Confirm Insurance
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works — consultation flow ────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.blue }}>Simple process</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>From booking to prescription — in 4 steps</h2>
        </div>

        <div className="relative">
          {/* Connector — desktop */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5" style={{ background: T.borderLight }} />

          <div className="grid md:grid-cols-4 gap-6">
            {useData().process.map(({ step, icon: Icon, title, desc }, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-sm border-4"
                  style={{
                    background: i % 2 === 0 ? T.blue : T.lavender,
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

// ─── Patient testimonials ─────────────────────────────────────────────────────
function TestimonialsSection() {
  const data = useData()
  const [active, setActive] = useState(0)

  const navigate = (dir) => {
    setActive(prev => (prev + dir + data.testimonials.length) % data.testimonials.length)
  }

  const t = data.testimonials[active]

  return (
    <section id="reviews" className="py-20" style={{ background: T.blueDeep }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#93c5fd' }}>Patient experiences</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {data.clinic.reviews} reviews · {data.clinic.rating}★ average
            </h2>
          </div>
          <div className="flex gap-2">
            {[[-1, ChevronLeft], [1, ChevronRight]].map(([dir, Icon], i) => (
              <button key={i} onClick={() => navigate(dir)}
                className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:border-blue-400"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Review card */}
        <div className="rounded-2xl p-8 border mb-6" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex gap-1 mb-5">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" style={{ color: '#f59e0b' }} />
            ))}
          </div>
          <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-6">"{t.text}"</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm"
                style={{ background: T.blue, color: '#fff' }}>
                {t.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Patient</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Heart className="w-3 h-3" /> {t.condition}
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex gap-2">
          {useData().testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: active === i ? '#93c5fd' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Appointments — hours + modes ─────────────────────────────────────────────
function AppointmentSection() {
  const D = useData(); const c = D.clinic
  return (
    <section id="appointment" className="py-20" style={{ background: T.white }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.blue }}>Clinic hours</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Book your appointment</h2>
          <p className="mt-3 text-base" style={{ color: T.muted }}>In-clinic, video, or home visit — choose what works for you.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: hours + modes */}
          <div className="space-y-5">
            {/* Consultation modes */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: T.borderLight }}>
              <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest border-b"
                style={{ background: T.blueMid, color: T.blue, borderColor: T.borderLight }}>
                Consultation Modes
              </div>
              {useData().modes.map(({ icon: Icon, label, sub, available }, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
                  style={{ borderColor: T.borderLight }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: T.bluePale }}>
                    <Icon className="w-5 h-5" style={{ color: T.blue }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: T.text }}>{label}</p>
                    <p className="text-xs" style={{ color: T.muted }}>{sub}</p>
                  </div>
                  {available && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: T.greenPale, color: T.green }}>Available</span>
                  )}
                </div>
              ))}
            </div>

            {/* Working hours */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: T.borderLight }}>
              <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest border-b"
                style={{ background: T.blueMid, color: T.blue, borderColor: T.borderLight }}>
                Working Hours
              </div>
              {useData().hours.map(({ day, time }, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b last:border-0"
                  style={{ borderColor: T.borderLight }}>
                  <span className="font-semibold text-sm" style={{ color: T.text }}>{day}</span>
                  <span className="text-sm" style={{ color: T.muted }}>{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: booking card */}
          <div className="rounded-2xl border p-7" style={{ borderColor: T.borderLight, background: T.bluePale }}>
            <h3 className="font-black text-xl mb-2" style={{ color: T.text }}>Ready to book?</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: T.muted }}>
              WhatsApp to check slot availability instantly. Calls answered 9 AM – 7 PM on weekdays.
            </p>
            <div className="space-y-3">
              <a href={`https://wa.me/${c.whatsapp}?text=Hi Dr. Sharma, I would like to book an appointment.`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 shadow"
                style={{ background: '#25d366' }}>
                <MessageCircle className="w-5 h-5" /> Book on WhatsApp
              </a>
              <a href={`tel:${c.phone}`}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-bold text-sm border transition-all hover:bg-blue-50"
                style={{ borderColor: T.border, color: T.blue }}>
                <Phone className="w-5 h-5" /> Call {c.phone}
              </a>
              <a href={`mailto:${c.email}`}
                className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl font-medium text-sm transition-all hover:underline"
                style={{ color: T.grayText }}>
                Or email {c.email}
              </a>
            </div>

            {/* Languages */}
            <div className="mt-6 pt-5 border-t" style={{ borderColor: T.border }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.muted }}>Languages spoken</p>
              <div className="flex flex-wrap gap-2">
                {c.languages.map((lang, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: T.lavPale, color: T.lavender }}>{lang}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Address strip */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 rounded-2xl border"
          style={{ borderColor: T.borderLight, background: T.blueMid }}>
          <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: T.blue }} />
          <div>
            <p className="font-bold text-sm" style={{ color: T.text }}>{c.clinicName}</p>
            <p className="text-sm" style={{ color: T.muted }}>{c.area}, {c.city} — WhatsApp for exact address & parking guidance</p>
          </div>
          <a href={`https://wa.me/${c.whatsapp}?text=Can you send me the clinic address?`}
            target="_blank" rel="noopener noreferrer"
            className="sm:ml-auto flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs text-white"
            style={{ background: T.blue }}>
            Get Directions <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ — extensive, healthcare-specific ─────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" className="py-20" style={{ background: T.bg }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.blue }}>Everything you need to know</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Frequently asked questions</h2>
          <p className="mt-3 text-base" style={{ color: T.muted }}>
            Can't find the answer here? WhatsApp — the clinic team responds within 2 hours on working days.
          </p>
        </div>
        <div className="space-y-3">
          {useData().faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.borderLight }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.blueMid : T.white }}>
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  style={{ color: T.blue }} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed"
                  style={{ color: T.muted, background: T.blueMid }}>
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

// ─── CTA / Booking banner ─────────────────────────────────────────────────────
function CTASection() {
  const D = useData()
  const c = D.clinic
  return (
    <section className="py-20"
      style={{ background: `linear-gradient(135deg, ${T.blueDeep} 0%, ${T.blueDark} 50%, #0c2f50 100%)` }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#93c5fd' }}>Take the first step</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Your health deserves<br />proper time and attention.
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Every slot is 20–30 minutes. Bring your questions — there are no silly ones. WhatsApp to find the first available slot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={`https://wa.me/${c.whatsapp}?text=Hi Dr. Sharma, I would like to book an appointment.`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-black text-base transition-all hover:opacity-90 shadow-lg"
                style={{ background: '#25d366', color: '#fff' }}>
                <MessageCircle className="w-5 h-5" /> Book on WhatsApp
              </a>
              <a href={`tel:${c.phone}`}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-black text-base border transition-all hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                <Phone className="w-5 h-5" /> Call {c.phone}
              </a>
            </div>
          </div>
          {/* Assurance card */}
          <div className="rounded-2xl p-7 border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="font-bold text-white mb-5 text-sm">What to expect at every visit:</p>
            <ul className="space-y-4">
              {[
                'Minimum 20-minute consultation — never rushed',
                'Plain-language explanation of every finding',
                'Digital prescription on WhatsApp within the hour',
                'Follow-up available via WhatsApp for 7 days post-visit',
                'GST invoice for every consultation — insurance-ready',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#7dd3fc' }} />
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
  const D = useData(); const c = D.clinic
  return (
    <footer style={{ background: T.ink, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.blue }}>
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white">{c.clinicName}</span>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{c.name}</p>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {c.title}
            </p>
            <div className="text-xs space-y-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <p>DMC Reg: {c.regNumber}</p>
              <p>GST: {c.gst}</p>
              <p>{c.area}, {c.city}</p>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#93c5fd' }}>Clinic</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {[['#specialities','Specialities'],['#how-it-works','How It Works'],['#appointment','Appointments'],['#reviews','Patient Reviews'],['#faq','FAQ'],['#','Privacy Policy']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#93c5fd' }}>Contact</p>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <li><a href={`tel:${c.phone}`} className="hover:text-white transition-colors">{c.phone}</a></li>
              <li><a href={`mailto:${c.email}`} className="hover:text-white transition-colors">{c.email}</a></li>
              <li>{c.area}, {c.city}</li>
            </ul>
            <a href={`https://wa.me/${c.whatsapp}?text=Hi Dr. Sharma, I would like to book an appointment.`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: '#25d366' }}>
              <MessageCircle className="w-4 h-4" /> Book Appointment
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 p-4 rounded-xl text-xs leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)' }}>
          <strong style={{ color: 'rgba(255,255,255,0.3)' }}>Medical Disclaimer:</strong> The information on this website is for general informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis, treatment, or health decisions. In case of a medical emergency, please call 112 or visit the nearest emergency department.
        </div>

        <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
          <span>© {new Date().getFullYear()} {c.clinicName}. All rights reserved. DMC Reg: {c.regNumber}</span>
          <Link href="/templates" className="hover:text-white transition-colors">← Browse all templates on OPC Genie</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClinicPractitionerTemplate({ data }) {
  const D = payloadToData(data)
  return (
    <DataCtx.Provider value={D}>
    <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <TemplateNav />
      <HeroSection />
      <CredentialsWall />
      <SpecialitiesSection />
      <FeesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <AppointmentSection />
      <FAQSection />
      <CTASection />
      <TemplateFooter />
      <WhatsAppSticky />
      <ScrollToTop />
    </div>
    </DataCtx.Provider>
  )
}
