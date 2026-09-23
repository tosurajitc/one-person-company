'use client'

/**
 * Template — Trip Architect (Personal Travel Planning)
 * Section: Services / Travel
 * Theme: The Boarding Pass · Deep Plum #241a35 + Marigold #f2952e + Peacock #0f8a86
 *
 * DESIGN CONCEPT: "The Boarding Pass"
 * ─────────────────────────────────────────────────────────────────────────────
 * Revision note: this replaces the earlier "Route Map / Cartographer's Desk"
 * pass, which read as formal and consultant-like. Same content, same data,
 * same sections — warmer, more vivid, and built around actual travel-document
 * shapes instead of a planner's map:
 *
 *  • The hero's route map now lives inside a tilted, die-cut BOARDING PASS
 *    card — a perforated divider with cut-out notches separates a destination
 *    "stub" from the route itself, floating over a soft marigold/olive glow
 *    on a deep plum backdrop.
 *  • Sections alternate between deep "plum" backgrounds and warm "sand"
 *    backgrounds — same rhythm as before, recoloured.
 *  • Stats are passport-STAMP badges — circular, independently tilted — rather
 *    than a flat bordered grid.
 *  • Sample itineraries are styled as TICKET STUBS (dashed tear-line + notch
 *    cutouts), each tagged with a colour cycling through the palette.
 *  • Client notes stay postcards (unchanged structural idea), recoloured
 *    with alternating washi-tape corners instead of one flat accent.
 *  • Planning packages get a colour-blocked header band per tier instead of
 *    identical white cards, so the eye can tell them apart at a glance.
 *
 * TOKEN SYSTEM
 *  Color   dark #241a35 · darkDeep #170f24 · marigold #f2952e · marigoldLight #ffc069
 *          · olive #0f8a86 · rust #e0447a (sparing highlight) · sand #fdf2df
 *  Type    Display/headline: Space Grotesk (geometric, contemporary, confident
 *          at large sizes) · Body/UI: Inter — same body face as before, new
 *          display pairing for a livelier, less corporate headline voice
 *  Layout  Hero splits text (left) against a tilted boarding-pass card (right);
 *          alternating plum/sand section rhythm down the page; circular stamp
 *          badges and ticket-stub cards replace the flat bordered-grid layout
 *  Principle  Every shape is a real travel-document artefact — boarding pass,
 *             passport stamp, ticket stub, postcard — vivid and tactile, not
 *             a generic rounded-card grid with a gradient wash for decoration
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
 *  PROPOSED NEW template_data FIELDS (trip-architect specific —
 *  flagging for the template-fields table):
 *    - specialties[]        regions/trip styles the founder plans (e.g. "Rajasthan", "Slow travel")
 *    - sample_itineraries[] { destination, waypoints, days, style, image_url }
 *    - hero_pins[]          { label, sub, image_url } — the 3 pinned photo cards in the
 *                            hero corkboard; falls back to text-only color cards if unset
 *    - trips_planned, avg_proposal_days
 *    - planning_approach     one line on tools/process (scouting, local contacts, etc.)
 *    - hero_image_url        real, licensed photo for the hero backdrop (optional —
 *                            template renders correctly with plain plum if unset)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import {
  Compass, MapPin, Route, Plane, Mountain, Globe, CalendarDays, Users,
  Wallet, MessageCircle, Star, ChevronDown, ChevronUp, ArrowRight, CheckCircle,
  Sparkles, PenTool, Quote, Send, Mail, Phone, Backpack, Navigation,
} from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Icon lookups (code-owned) ────────────────────────────────────────────────
const AGENT_ICON_MAP = {
  'traveller-reply':  MessageCircle,
  'itinerary-draft':  Route,
  'options-compare':  Navigation,
  'budget-planner':   Wallet,
}
const AGENT_ICON_FALLBACK = Sparkles

const PACE_LABELS = { relaxed: 'Relaxed', balanced: 'Balanced', packed: 'Packed' }

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
    .map(t => ({ name: t.name || '', role: t.role || '', text: t.quote }))

  const wizardOffers = Array.isArray(off.items) ? off.items : Array.isArray(off) ? off : []
  const mappedPackages = wizardOffers.filter(x => x?.title).map(x => ({
    name:         x.title,
    price:        x.price ? `₹${x.price}` : 'Enquire',
    duration:     x.duration || '',
    deliverables: Array.isArray(x.deliverables) ? x.deliverables : [],
  }))
  const packages = mappedPackages.length ? mappedPackages : SAMPLE.packages

  const mappedItineraries = Array.isArray(td.sample_itineraries) && td.sample_itineraries.length
    ? td.sample_itineraries
    : SAMPLE.itineraries

  const mappedPins = Array.isArray(td.hero_pins) && td.hero_pins.length
    ? td.hero_pins.map(p => ({ label: p.label || '', sub: p.sub || '', imageUrl: p.image_url || '' }))
    : SAMPLE.pins

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
      name:            o(biz.brandName, SAMPLE.business.name),
      founder:         o(biz.ownerName || owner.name, SAMPLE.business.founder),
      tagline:         o(biz.tagline, SAMPLE.business.tagline),
      story:           o(pos.credibility, SAMPLE.business.story),
      philosophy:      o(td.philosophy_quote, SAMPLE.business.philosophy),
      city:            o(`${biz.city || ''}`.trim(), SAMPLE.business.city),
      phone:           o(owner.whatsapp, SAMPLE.business.phone),
      email:           o(owner.email, SAMPLE.business.email),
      whatsapp:        o(owner.whatsapp, SAMPLE.business.whatsapp),
      years:           td.years_experience || SAMPLE.business.years,
      tripsPlanned:    td.trips_planned || SAMPLE.business.tripsPlanned,
      rating:          prf.results?.find(r => r?.label?.toLowerCase().includes('rating'))?.number || SAMPLE.business.rating,
      reviews:         SAMPLE.business.reviews,
      turnaround:      td.avg_proposal_days || SAMPLE.business.turnaround,
      specialties:     Array.isArray(td.specialties) && td.specialties.length ? td.specialties : SAMPLE.business.specialties,
      planningApproach: o(td.planning_approach, SAMPLE.business.planningApproach),
      heroImageUrl:    o(td.hero_image_url, SAMPLE.business.heroImageUrl),
      enquiryUrl:      fd.bookingUrl || '#brief',
    },
    itineraries:  mappedItineraries,
    pins:         mappedPins,
    packages,
    testimonials: mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:         mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
    agents:       mappedAgents,
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  dark:           '#3b2417',
  darkDeep:       '#1e120a',
  darkSoft:       '#4f3020',
  marigold:       '#f2952e',
  marigoldLight:  '#ffc069',
  olive:          '#7c8a4e',
  oliveLight:     '#a3b378',
  rust:           '#b5502e',
  rustLight:      '#d97b52',
  sand:           '#fbeed9',
  sandDeep:       '#f2dcb0',
  cream:          '#fff8ee',
  text:           '#2a1f19',
  muted:          '#8c7c6b',
  border:         '#e8d3a8',
  white:          '#ffffff',
  grayText:       '#6b5c4e',
}
const DISPLAY = "'Space Grotesk', 'Avenir Next', 'Helvetica Neue', system-ui, sans-serif"
const SANS  = "'Inter', system-ui, sans-serif"
const ACCENTS = [T.marigold, T.olive, T.rust] // cycled across itineraries, postcards, agent chips

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  business: {
    name:             'Meridian & Co.',
    founder:          'Rhea Menon',
    tagline:          'Bespoke trip planning for people who don\'t want a template holiday',
    story:            "Most itineraries are built backwards, from what a hotel wants to sell you. I build them forwards, from how you actually want to spend a day — how much walking, how much rest, how much wandering off-plan. I've planned journeys the length of India, from Ladakh's high passes to Kerala's backwaters, and the brief is always the same: fewer stops, better ones, and a plan that survives contact with real life.",
    philosophy:       'A good itinerary has room to change its mind.',
    city:             'Bengaluru',
    phone:            '+91 98450 11223',
    whatsapp:         '9845011223',
    email:            'hello@meridianco.in',
    years:            '9',
    tripsPlanned:     '210+',
    rating:           4.9,
    reviews:          88,
    turnaround:       '5 days',
    specialties:      ['Rajasthan', 'Kerala', 'Himachal', 'Goa', 'Northeast India'],
    planningApproach: 'On-ground contacts across 20+ Indian states, real-time rail and road data, and a working relationship with every homestay, driver and guide on the shortlist — not just a listings page.',
    heroImageUrl:     '', // set via template_data.hero_image_url once a real photo exists — see comment above HeroSection
  },
  pins: [
    { label: 'Jaipur',  sub: 'Day 1 of 12', imageUrl: '/templates/trip-architect/jaipur.jpeg' },
    { label: 'Jodhpur', sub: 'Day 4 of 12', imageUrl: '/templates/trip-architect/jodhpur.jpeg' },
    { label: 'Udaipur', sub: 'Day 6 of 12', imageUrl: '/templates/trip-architect/udaipur.jpeg' },
  ],

  itineraries: [
    { destination: 'Rajasthan, Royal Circuit',    waypoints: 8, days: 12, style: 'Forts & palaces',            image_url: '/templates/trip-architect/route-rajasthan.png' },
    { destination: 'Kerala, Backwaters & Hills',  waypoints: 6, days: 9,  style: 'Houseboats & tea estates',    image_url: '/templates/trip-architect/route-kerala.png' },
    { destination: 'Himachal, Mountain Loop',     waypoints: 5, days: 8,  style: 'Trek & monastery towns',      image_url: '/templates/trip-architect/route-himachal.png' },
    { destination: 'Goa, Slow Coastal',           waypoints: 4, days: 6,  style: 'Beaches & food',              image_url: '/templates/trip-architect/route-goa.png' },
    { destination: 'Northeast, Meghalaya & Assam',waypoints: 5, days: 9,  style: 'Living roots & tea gardens',  image_url: '/templates/trip-architect/route-northeast.png' },
  ],
  
  packages: [
    {
      name: 'AI Consultancy', price: '₹10 / min', duration: 'Create your own itinerary',
      deliverables: [
        'Live 1-on-1 AI-assisted planning session',
        'Billed per minute — pay only for time used',
        'Destination & route brainstorming',
        'Budget breakdown guidance',
        'Accommodation & transport shortlisting',
        'Instant answers to any travel query',
        'Session summary notes shared after call',
        'No minimum session length',
      ],
    },
    {
      name: 'India Trip Plan', price: '₹199', duration: 'Single-day delivery',
      deliverables: [
        'Flat-fee, no hidden charges',
        'Full day-by-day itinerary for India trips',
        'Best routes & transport options included',
        'Hotel & stay recommendations for every stop',
        'Local food, experiences & tips',
        'Budget estimate with cost breakdown',
        'Delivered within 1 business day',
        'One round of minor revisions',
      ],
    },
    {
      name: 'International Trip Plan', price: '₹4,999', duration: '3-day turnaround',
      deliverables: [
        'Complete multi-destination itinerary',
        'Visa requirements & entry checklist',
        'Flights strategy & best booking windows',
        'Day-by-day plan with timings & alternatives',
        '2–3 compared hotel options per destination',
        'Local transport & transfers guide',
        'Currency, SIM & travel essentials checklist',
        'Emergency contacts & travel insurance tips',
        'One full round of revisions',
      ],
    },
  ],
  testimonials: [
    { name: 'Nikhil & Fara',       role: 'Rajasthan, 12 days',      text: 'We told Rhea we hate rushing and she built a trip with almost no early mornings. First holiday in years we came back rested instead of needing another one.' },
    { name: 'Priyanka Suresh',     role: 'Himachal, solo',   text: 'The itinerary had a backup plan for every single day. The Manali–Spiti road closed for a day and I never once had to think — it was already re-routed.' },
    { name: 'The Devan Family',    role: 'Kerala, with kids',    text: "Every lodge was checked for what a 6-year-old could actually handle. No generic 'family-friendly' label — she'd actually called and asked." },
  ],
  faqs: [
    { q: 'How far ahead should we get in touch?',        a: 'For a full itinerary, 6–8 weeks before travel gives the best availability. Slower or peak-season routes (Rajasthan in winter, Northeast in autumn) benefit from 3+ months.' },
    { q: 'Do you book the flights and hotels for us?',   a: "I research, compare and shortlist everything, and hand you ready-to-book options with contacts and prices. You hold the bookings directly — no markup, and you keep full control of cancellations." },
    { q: 'What if our plans change mid-trip?',           a: "That's exactly what the On-Trip Support tier covers. One weather day, one closed trail, one changed flight — I re-route the plan same-day, not after you're back." },
    { q: 'Is a deposit required?',                        a: 'A 50% deposit confirms the booking slot for your planning window, with the balance due on delivery of the itinerary. This is outlined in the brief confirmation.' },
    { q: 'What if we only want a second opinion on a plan we\'ve already made?', a: 'That\'s a Planning Consult — bring your draft plan and we\'ll spend the session stress-testing it against your actual pace and budget.' },
  ],
  agents: [
    {
      id: 'traveller-reply', title: 'Brief Reply Assistant', role: 'Intake Correspondence Helper', badge: 'Popular',
      description: 'Paste in a traveller\'s brief and get a warm, specific reply draft — clarifying questions, availability, and next steps, in your voice.',
      samplePrompts: ['Draft a reply to a family asking about a Kerala trip in December', 'Write a follow-up to a brief that went quiet after the quote'],
      ratePerMinute: 8, currency: '₹',
    },
    {
      id: 'itinerary-draft', title: 'Itinerary Drafting Assistant', role: 'Day-by-Day Planning Helper', badge: null,
      description: "Turn a traveller's brief and your route notes into a structured day-by-day draft — timings, rest windows, and contingency options included.",
      samplePrompts: ['Draft a 9-day Kerala route for two relaxed travellers', 'Add a monsoon backup to Day 4 of this Munnar itinerary'],
      ratePerMinute: 8, currency: '₹',
    },
    {
      id: 'options-compare', title: 'Options Comparison Assistant', role: 'Stay & Transfer Helper', badge: null,
      description: 'Lay out two or three hotel, transfer or guide options side by side with price, inclusions and cancellation terms, ready to send.',
      samplePrompts: ['Compare these three ryokan options for a family of four', 'Summarise cancellation terms across these transfer quotes'],
      ratePerMinute: 8, currency: '₹',
    },
    {
      id: 'budget-planner', title: 'Budget Breakdown Assistant', role: 'Costing Helper', badge: null,
      description: 'Build a clear budget breakdown by category — stays, transport, food, activities, buffer — from your raw cost notes.',
      samplePrompts: ['Break this Rajasthan trip down into a per-day budget', 'How do I explain the contingency buffer line to a client?'],
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
      style={{ background: T.marigold }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 text-white" />
    </button>
  )
}

// ─── Sticky brief button ───────────────────────────────────────────────────────
function BriefSticky() {
  return (
    <a href="#brief"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-xl transition-all hover:scale-105"
      style={{ background: T.marigold, color: '#fff' }}>
      <Compass className="w-4 h-4" />
      <span className="font-bold text-sm">Start Your Brief</span>
    </a>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  const b = D.business
  return (
    <div className="fixed top-0 left-0 right-0 z-40 pt-3 px-4">
      <nav className="max-w-5xl mx-auto rounded-full backdrop-blur-md shadow-lg"
        style={{ background: 'rgba(36,26,53,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5" style={{ color: T.marigoldLight }} />
            <span className="font-medium text-base tracking-wide text-white" style={{ fontFamily: DISPLAY }}>{b.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            {[['#itineraries','Sample routes'],['#packages','Planning packages'],['#story','Approach']].map(([href, label]) => (
              <a key={href} href={href} className="font-medium transition-opacity hover:opacity-60" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</a>
            ))}
          </div>
          <a href="#brief"
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all hover:opacity-90 flex-shrink-0"
            style={{ background: T.marigold, color: '#fff' }}>
            Start a brief
          </a>
        </div>
      </nav>
    </div>
  )
}

// ─── Hero — the pinboard ────────────────────────────────────────────────────
function PinBoard() {
  const D = useData()
  const pins = D.pins
  const [hovered, setHovered] = useState(null)
  const tilts = ['-6deg', '4deg', '-3deg']

  return (
    <div className="flex items-start justify-center lg:justify-end flex-wrap pt-6">
      {pins.map((pin, i) => {
        const isHovered = hovered === i
        const accent = ACCENTS[i % ACCENTS.length]
        return (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
            role="img"
            aria-label={`${pin.label}, ${pin.sub}`}
            className={`relative w-48 sm:w-56 h-64 sm:h-80 rounded-2xl overflow-hidden cursor-pointer outline-none transition-transform duration-300 ease-out ${i > 0 ? '-ml-10 sm:-ml-14' : ''} ${i % 2 === 1 ? 'mt-10' : ''}`}
            style={{
              transform: `rotate(${isHovered ? '0deg' : tilts[i % tilts.length]}) scale(${isHovered ? 1.08 : 1})`,
              zIndex: isHovered ? 50 : i,
              boxShadow: isHovered ? '0 26px 50px rgba(0,0,0,0.45)' : '0 10px 26px rgba(0,0,0,0.3)',
              backgroundImage: pin.imageUrl
                ? `linear-gradient(180deg, rgba(30,18,10,0.05) 35%, rgba(30,18,10,0.88) 100%), url(${pin.imageUrl})`
                : `linear-gradient(160deg, ${accent}, ${T.darkDeep})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* pushpin */}
            <span className="absolute top-3.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10" style={{ background: T.marigoldLight, borderColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }} />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-bold text-lg sm:text-xl leading-tight" style={{ fontFamily: DISPLAY }}>{pin.label}</p>
              <p className="text-white/85 text-xs mt-0.5">{pin.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HeroSection() {
  const D = useData()
  const b = D.business
  return (
    <section className="relative pt-24 pb-16 lg:pb-24 overflow-hidden" style={{ background: T.dark }}>
      {/* Backdrop photo — set business.heroImageUrl (template_data.hero_image_url) once a
          real, licensed photo of the founder's flagship region exists. A dark gradient
          sits over it so the white headline stays legible on any image. Falls back to
          plain plum (no <img>, no network request) when unset. */}
      {b.heroImageUrl ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(23,15,36,0.72), rgba(23,15,36,0.92)), url(${b.heroImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
      ) : (
        // Contained colour glow behind the boarding-pass card only — not a full-page
        // gradient wash — so the vivid palette reads as a deliberate spotlight, not decoration.
        <div className="absolute right-0 top-0 w-[60%] h-full opacity-40 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 60% 40%, ${T.olive}, transparent 60%), radial-gradient(ellipse at 80% 70%, ${T.marigold}, transparent 55%)`,
        }} aria-hidden="true" />
      )}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-14 items-center">
          <div>
            <p className="text-xs tracking-[0.1em] mb-6 font-semibold" style={{ color: T.marigoldLight, fontFamily: SANS }}>
              {b.city} · Trip Planning · {b.tripsPlanned} trips planned
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-[3.3rem] leading-[1.1] mb-6 text-white font-medium" style={{ fontFamily: DISPLAY }}>
              We don't hand you<br />a template holiday.
            </h1>
            <p className="text-base leading-relaxed mb-9 max-w-md" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {b.tagline}. {b.years} years planning routes across {b.specialties.slice(0, 3).join(', ')} and beyond —
              built from your actual pace, budget and interests, not a package.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#brief"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full font-semibold text-base transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: T.marigold, color: '#fff' }}>
                Start Your Brief <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#itineraries"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full font-semibold text-base border-2 transition-all hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: T.oliveLight, color: T.oliveLight }}>
                See Sample Routes
              </a>
            </div>
          </div>

          <PinBoard />
        </div>
      </div>
    </section>
  )
}

// ─── Stats strip ──────────────────────────────────────────────────────────────
function StatsSection() {
  const D = useData()
  const b = D.business
  const stats = [
    { label: 'Trips planned', value: b.tripsPlanned, tilt: '-4deg' },
    { label: 'Years planning routes', value: b.years, tilt: '3deg' },
    { label: `Reviews · ${b.rating}★`, value: b.reviews, tilt: '-2deg' },
    { label: 'Proposal turnaround', value: b.turnaround, tilt: '4deg' },
  ]
  return (
    <section style={{ background: T.sand }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-center w-full aspect-square rounded-full mx-auto max-w-[150px]"
              style={{
                background: T.white,
                border: `2.5px solid ${ACCENTS[i % ACCENTS.length]}`,
                transform: `rotate(${s.tilt})`,
              }}>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: T.dark, fontFamily: DISPLAY }}>{s.value}</p>
              <p className="text-[10px] sm:text-xs mt-1 px-3 leading-tight" style={{ color: T.muted }}>{s.label}</p>
            </div>
          ))}
        </div>
        {b.specialties?.length > 0 && (
          <div className="mt-12 pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t" style={{ borderColor: T.border }}>
            <span className="text-xs" style={{ color: T.muted }}>Plans routes across</span>
            {b.specialties.map((f, i) => (
              <span key={i} className="text-sm flex items-center gap-1.5 font-medium" style={{ color: T.dark, fontFamily: DISPLAY }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: ACCENTS[i % ACCENTS.length] }} /> {f}
              </span>
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
        <Quote className="w-8 h-8 mb-6" style={{ color: T.marigold }} />
        <p className="text-2xl md:text-3xl leading-relaxed mb-10 font-medium" style={{ color: T.text, fontFamily: DISPLAY }}>
          {b.philosophy}
        </p>
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-lg font-bold"
            style={{ background: `linear-gradient(135deg, ${T.marigold}, ${T.rust})`, fontFamily: DISPLAY }}>
            {b.founder.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-base leading-relaxed mb-4" style={{ color: T.grayText }}>{b.story}</p>
            <p className="text-sm font-semibold" style={{ color: T.text }}>{b.founder}</p>
            <p className="text-xs" style={{ color: T.muted }}>Founder & trip architect, {b.name}</p>
            {b.planningApproach && (
              <div className="mt-4 pt-4 border-t flex items-start gap-2 text-xs" style={{ borderColor: T.border, color: T.muted }}>
                <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.olive }} />
                <span><strong>How we plan:</strong> {b.planningApproach}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Sample itineraries ────────────────────────────────────────────────────────
function ItinerariesSection() {
  const D = useData()
  const spanClass = { lg: 'sm:col-span-2 sm:row-span-2', md: 'sm:row-span-2', sm: '' }
  const sizes = ['lg', 'md', 'md', 'md', 'md']
  return (
    <section id="itineraries" className="py-24" style={{ background: T.dark }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs tracking-[0.1em] mb-3 font-semibold" style={{ color: T.marigoldLight }}>Sample routes</p>
          <h2 className="text-3xl md:text-4xl text-white font-medium" style={{ fontFamily: DISPLAY }}>A few journeys we've mapped out</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 auto-rows-[170px]">
          {D.itineraries.map((it, i) => {
            const accent = ACCENTS[i % ACCENTS.length]
            return (
              <div key={i}
                className={`relative rounded-2xl overflow-hidden flex flex-col justify-end p-5 transition-transform hover:-translate-y-1 ${spanClass[sizes[i] || 'sm']}`}
                style={
                  it.image_url
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(23,15,36,0.15), rgba(23,15,36,0.88)), url(${it.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: `inset 0 0 0 2px ${accent}55`,
                      }
                    : {
                        background: `linear-gradient(155deg, ${T.darkSoft}, ${T.darkDeep})`,
                        boxShadow: `inset 0 0 0 2px ${accent}55`,
                      }
                }>
                <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                  style={{ background: accent }}>
                  {it.style}
                </span>
                <div className="border-t border-dashed pt-3" style={{ borderColor: 'rgba(255,255,255,0.25)' }}>
                  <p className="text-lg text-white font-medium" style={{ fontFamily: DISPLAY }}>{it.destination}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{it.waypoints} waypoints · {it.days} days</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Planning packages ─────────────────────────────────────────────────────────
function PackagesSection() {
  const D = useData()
  return (
    <section id="packages" className="py-24" style={{ background: T.sand }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs tracking-[0.1em] mb-3 font-semibold" style={{ color: T.marigold }}>Planning packages</p>
          <h2 className="text-3xl md:text-4xl font-medium" style={{ color: T.text, fontFamily: DISPLAY }}>Choose how much of the planning we take on</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {D.packages.map((pkg, i) => {
            const accent = ['#6B3A2A', '#1B4332', '#1B2A4A'][i] ?? ACCENTS[i % ACCENTS.length]
            return (
              <div key={i} className="rounded-2xl overflow-hidden flex flex-col shadow-sm" style={{ background: T.white }}>
                <div className="px-7 py-6" style={{ background: accent }}>
                  <p className="text-xl text-white font-medium" style={{ fontFamily: DISPLAY }}>{pkg.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{pkg.duration}</p>
                </div>
                <div className="p-7 flex flex-col flex-1">
                  <p className="text-3xl mb-6 font-medium" style={{ color: T.dark, fontFamily: DISPLAY }}>{pkg.price}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {pkg.deliverables.map((d, di) => (
                      <li key={di} className="flex items-start gap-2.5 text-sm" style={{ color: T.text }}>
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <a href="#brief"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
                    style={{ background: T.dark, color: '#fff' }}>
                    Start With This
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Trip brief form — real controlled form ───────────────────────────────────
function TripBriefFormSection() {
  const D = useData()
  const b = D.business
  const [form, setForm] = useState({
    name: '', email: '', phone: '', destinations: '', dateMode: 'fixed', startDate: '', endDate: '',
    travellerCount: '', pace: 'balanced', budget: '', message: '',
  })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    setStatus('sending')
    try {
      const res = await fetch('/api/trip-architect/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'trip_brief_form', business: b.name, site_slug: D.slug || '' }),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', phone: '', destinations: '', dateMode: 'fixed', startDate: '', endDate: '', travellerCount: '', pace: 'balanced', budget: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <section id="brief" className="py-24" style={{ background: T.cream }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-[0.1em] mb-3 font-semibold" style={{ color: T.marigold }}>Trip brief</p>
          <h2 className="text-3xl md:text-4xl mb-3 font-medium" style={{ color: T.text, fontFamily: DISPLAY }}>Tell us where you want to go</h2>
          <p className="text-sm" style={{ color: T.muted }}>We reply within {b.turnaround} with a route shortlist and a quote.</p>
        </div>

        {status === 'success' ? (
          <div className="rounded-2xl p-10 text-center shadow-sm" style={{ background: T.white }}>
            <CheckCircle className="w-10 h-10 mx-auto mb-4" style={{ color: T.olive }} />
            <p className="text-lg mb-2 font-medium" style={{ color: T.text, fontFamily: DISPLAY }}>Brief received — thank you.</p>
            <p className="text-sm" style={{ color: T.muted }}>We'll be in touch within {b.turnaround} with a first pass at your route.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-5 shadow-sm" style={{ background: T.white }}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Your name</label>
                <input required value={form.name} onChange={update('name')} type="text"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors"
                  style={{ borderColor: T.border }}
                  onFocus={(e) => e.target.style.borderColor = T.olive}
                  onBlur={(e) => e.target.style.borderColor = T.border} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Email</label>
                <input required value={form.email} onChange={update('email')} type="email"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors"
                  style={{ borderColor: T.border }}
                  onFocus={(e) => e.target.style.borderColor = T.olive}
                  onBlur={(e) => e.target.style.borderColor = T.border} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Phone / WhatsApp</label>
                <input value={form.phone} onChange={update('phone')} type="tel"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors"
                  style={{ borderColor: T.border }}
                  onFocus={(e) => e.target.style.borderColor = T.olive}
                  onBlur={(e) => e.target.style.borderColor = T.border} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Destination(s)</label>
                <input value={form.destinations} onChange={update('destinations')} type="text" placeholder="e.g. Rajasthan, or 'somewhere in the hills in May'"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors"
                  style={{ borderColor: T.border }}
                  onFocus={(e) => e.target.style.borderColor = T.olive}
                  onBlur={(e) => e.target.style.borderColor = T.border} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Dates</label>
                <select value={form.dateMode} onChange={update('dateMode')}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none bg-white transition-colors"
                  style={{ borderColor: T.border }}>
                  <option value="fixed">Fixed dates</option>
                  <option value="flexible">Flexible window</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Travellers</label>
                <input value={form.travellerCount} onChange={update('travellerCount')} type="number" min="1" placeholder="2"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors"
                  style={{ borderColor: T.border }}
                  onFocus={(e) => e.target.style.borderColor = T.olive}
                  onBlur={(e) => e.target.style.borderColor = T.border} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Pace</label>
                <select value={form.pace} onChange={update('pace')}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none bg-white transition-colors"
                  style={{ borderColor: T.border }}>
                  {Object.entries(PACE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {form.dateMode === 'fixed' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Start date</label>
                    <input value={form.startDate} onChange={update('startDate')} type="date"
                      className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors" style={{ borderColor: T.border }}
                      onFocus={(e) => e.target.style.borderColor = T.olive}
                      onBlur={(e) => e.target.style.borderColor = T.border} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>End date</label>
                    <input value={form.endDate} onChange={update('endDate')} type="date"
                      className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors" style={{ borderColor: T.border }}
                      onFocus={(e) => e.target.style.borderColor = T.olive}
                      onBlur={(e) => e.target.style.borderColor = T.border} />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Rough window</label>
                  <input value={form.startDate} onChange={update('startDate')} type="text" placeholder="e.g. sometime in March, 10–12 days"
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors" style={{ borderColor: T.border }}
                    onFocus={(e) => e.target.style.borderColor = T.olive}
                    onBlur={(e) => e.target.style.borderColor = T.border} />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Total budget</label>
                <input value={form.budget} onChange={update('budget')} type="text" placeholder="₹1,50,000 for two"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors" style={{ borderColor: T.border }}
                  onFocus={(e) => e.target.style.borderColor = T.olive}
                  onBlur={(e) => e.target.style.borderColor = T.border} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>Anything else — interests, dietary or accessibility needs</label>
              <textarea value={form.message} onChange={update('message')} rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none resize-none transition-colors"
                style={{ borderColor: T.border }}
                onFocus={(e) => e.target.style.borderColor = T.olive}
                onBlur={(e) => e.target.style.borderColor = T.border} />
            </div>

            {status === 'error' && (
              <p className="text-sm" style={{ color: '#b91c1c' }}>Something went wrong sending that — try again, or WhatsApp us directly below.</p>
            )}

            <button type="submit" disabled={status === 'sending'}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: T.marigold, color: '#fff' }}>
              <Send className="w-4 h-4" /> {status === 'sending' ? 'Sending...' : 'Send Brief'}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-6" style={{ color: T.muted }}>
          Prefer WhatsApp?{' '}
          <a href={`https://wa.me/${b.whatsapp}?text=Hi! I'd like to start planning a trip.`}
            target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: T.olive }}>
            Message us directly
          </a>
        </p>
      </div>
    </section>
  )
}

// ─── Postcards (testimonials) ──────────────────────────────────────────────────
function PostcardsSection() {
  const D = useData()
  const tilts = ['-1.5deg', '1deg', '-0.75deg']
  return (
    <section className="py-24" style={{ background: T.sand }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs tracking-[0.1em] mb-3 font-semibold" style={{ color: T.marigold }}>Postcards from travellers</p>
          <h2 className="text-3xl md:text-4xl font-medium" style={{ color: T.text, fontFamily: DISPLAY }}>{D.business.reviews} trips, {D.business.rating}★ average</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {D.testimonials.map((t, i) => (
            <div key={i} className="relative rounded-xl p-7 border-2 border-dashed shadow-sm"
              style={{ borderColor: T.border, background: T.white, transform: `rotate(${tilts[i % 3]})` }}>
              <div className="absolute -top-3 -right-3 w-9 h-9 rounded-sm flex items-center justify-center rotate-6"
                style={{ background: ACCENTS[i % ACCENTS.length] }}>
                <Plane className="w-4 h-4 text-white" />
              </div>
              <p className="text-base leading-relaxed mb-5" style={{ color: T.text, fontFamily: DISPLAY }}>"{t.text}"</p>
              <div className="pt-4 border-t" style={{ borderColor: T.border }}>
                <p className="text-sm font-semibold" style={{ color: T.text }}>{t.name}</p>
                <p className="text-xs" style={{ color: T.muted }}>{t.role}</p>
              </div>
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
          <p className="text-xs tracking-[0.1em] mb-3 font-semibold" style={{ color: T.marigold }}>Behind the scenes</p>
          <h2 className="text-3xl md:text-4xl mb-3 font-medium" style={{ color: T.text, fontFamily: DISPLAY }}>AI tools for the planning admin</h2>
          <p className="text-base max-w-2xl" style={{ color: T.muted }}>Help with the parts that aren't the route itself — replies, drafting, comparing, costing — priced separately.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {D.agents.map((agent, i) => {
            const Icon = agent.icon || AGENT_ICON_FALLBACK
            const accent = ACCENTS[i % ACCENTS.length]
            return (
              <div key={agent.id} className="rounded-2xl p-5 flex flex-col justify-between shadow-sm" style={{ background: T.white }}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${accent}1a` }}>
                      <Icon className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    {agent.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: T.rust }}>{agent.badge}</span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold mb-1" style={{ color: accent }}>{agent.role}</p>
                  <h3 className="text-base mb-2 font-medium" style={{ color: T.text, fontFamily: DISPLAY }}>{agent.title}</h3>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: T.muted }}>{agent.description}</p>
                  {agent.samplePrompts?.[0] && (
                    <p className="text-xs italic mb-4" style={{ color: T.grayText }}>"{agent.samplePrompts[0]}"</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: T.border }}>
                  <span className="text-xs font-bold" style={{ color: T.dark }}>{agent.currency}{agent.ratePerMinute}/min</span>
                  <button className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: accent }}>
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
    <section className="py-24" style={{ background: T.sand }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs tracking-[0.1em] mb-3 font-semibold" style={{ color: T.marigold }}>Good to know</p>
          <h2 className="text-3xl md:text-4xl font-medium" style={{ color: T.text, fontFamily: DISPLAY }}>Questions before you start a brief</h2>
        </div>
        <div className="space-y-3">
          {D.faqs.map((f, i) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-sm" style={{ background: T.white }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.cream : T.white }}>
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`} style={{ color: T.marigold }} />
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
    <footer style={{ background: T.darkDeep, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Compass className="w-5 h-5" style={{ color: T.marigoldLight }} />
              <span className="text-base text-white font-medium" style={{ fontFamily: DISPLAY }}>{b.name}</span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{b.tagline}.</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{b.city}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.08em] mb-4" style={{ color: T.marigoldLight }}>Explore</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {[['#itineraries','Sample routes'],['#packages','Planning packages'],['#story','Approach'],['#brief','Start a brief']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-[0.08em] mb-4" style={{ color: T.marigoldLight }}>Contact</p>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <li><a href={`mailto:${b.email}`} className="hover:text-white transition-colors">{b.email}</a></li>
              <li><a href={`tel:${b.phone}`} className="hover:text-white transition-colors">{b.phone}</a></li>
            </ul>
            <a href={`https://wa.me/${b.whatsapp}?text=Hi! I'd like to start planning a trip.`}
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
export default function TripArchitectTemplate({ data, slug }) {
  const value = { ...payloadToData(data), slug: slug || data?.slug || data?.business?.slug || '' }
  return (
    <DataCtx.Provider value={value}>
      <div className="min-h-screen" style={{ fontFamily: SANS }}>
        <TemplateNav />
        <HeroSection />
        <StatsSection />
        <StorySection />
        <ItinerariesSection />
        <PackagesSection />
        <TripBriefFormSection />
        <PostcardsSection />
        <AgentsSection />
        <FAQSection />
        <TemplateFooter />
        <BriefSticky />
        <ScrollToTop />
      </div>
    </DataCtx.Provider>
  )
}