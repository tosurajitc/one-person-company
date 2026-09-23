/**
 * Trip Architect — schema, sample data, validation, wizard mapping
 * Sibling to lib/travel-schema.js — do not edit that file, this is additive.
 *
 * Consumed by:
 *  - components/travel/TripArchitectSite.js   (payloadToData reads this shape)
 *  - app/templates/trip-architect/page.js     (gallery demo uses SAMPLE_PAYLOAD)
 *  - app/setup-wizard/page.js                 (trip-architect step reads FIELD
 *    definitions below, writes back via mapWizardStateToSiteBuildPayload)
 *  - components/site-admin/modules/TripArchitectModules.js (reads/writes
 *    template_data + offers through the same shape)
 *
 * Nothing here talks to the network — see lib/trip-architect-api.js for that.
 */

export const TEMPLATE_SLUG = 'trip-architect'

// ─── Enumerations ──────────────────────────────────────────────────────────────

export const DATE_MODES = [
  { id: 'fixed',    label: 'Fixed dates' },
  { id: 'flexible', label: 'Flexible window' },
]

export const PACE_OPTIONS = [
  { id: 'relaxed',  label: 'Relaxed',  description: 'Few stops, long stays, lots of unscheduled time' },
  { id: 'balanced', label: 'Balanced', description: 'A mix of planned activities and free time each day' },
  { id: 'packed',   label: 'Packed',   description: 'Maximise what gets seen, minimal downtime' },
]
export const PACE_LABELS = Object.fromEntries(PACE_OPTIONS.map(p => [p.id, p.label]))

export const BUDGET_BANDS = [
  { id: 'under_75k',   label: 'Under ₹75,000',        min: 0,       max: 75000 },
  { id: '75k_150k',    label: '₹75,000 – ₹1,50,000',  min: 75000,   max: 150000 },
  { id: '150k_300k',   label: '₹1,50,000 – ₹3,00,000', min: 150000,  max: 300000 },
  { id: 'over_300k',   label: 'Above ₹3,00,000',       min: 300000,  max: null },
]

export const REQUEST_STATUSES = [
  { id: 'new',         label: 'New' },
  { id: 'researching', label: 'Researching' },
  { id: 'proposed',    label: 'Proposed' },
  { id: 'confirmed',   label: 'Confirmed' },
  { id: 'completed',   label: 'Completed' },
  { id: 'archived',    label: 'Archived' },
]

export const TRIP_OPTION_CATEGORIES = [
  { id: 'stay',      label: 'Stay' },
  { id: 'transport', label: 'Transport' },
  { id: 'guide',     label: 'Guide' },
  { id: 'activity',  label: 'Activity' },
]

// ─── Trip brief form field definitions (drives the public intake form) ───────
// Kept here so the wizard preview, the public form, and any future admin
// "requests" table column config all read the same field list.

export const TRIP_BRIEF_FIELDS = [
  { id: 'name',           label: 'Your name',        type: 'text',     required: true },
  { id: 'email',          label: 'Email',            type: 'email',    required: true },
  { id: 'phone',          label: 'Phone / WhatsApp', type: 'tel',      required: false },
  { id: 'destinations',   label: 'Destination(s)',   type: 'text',     required: false },
  { id: 'dateMode',       label: 'Dates',            type: 'select',   required: true, options: DATE_MODES },
  { id: 'startDate',      label: 'Start date / window', type: 'text',  required: false },
  { id: 'endDate',        label: 'End date',         type: 'date',     required: false },
  { id: 'travellerCount', label: 'Travellers',       type: 'number',   required: false, min: 1 },
  { id: 'pace',           label: 'Pace',             type: 'select',   required: false, options: PACE_OPTIONS },
  { id: 'budget',         label: 'Total budget',     type: 'text',     required: false },
  { id: 'message',        label: 'Interests / dietary / accessibility needs', type: 'textarea', required: false },
]

// ─── Default planning tiers (used when a founder has no offers yet) ──────────

export const DEFAULT_PLANNING_TIERS = [
  {
    tier: 'consult',
    title: 'Planning Consult',
    duration: '90-minute session',
    price: 6500,
    deliverables: [
      'One structured call',
      'Destination and route shortlist',
      'Written summary within 48 hours',
      'No booking support',
    ],
  },
  {
    tier: 'full_itinerary',
    title: 'Full Itinerary',
    duration: '5-day turnaround',
    price: 28000,
    deliverables: [
      'Day-by-day plan with timings',
      '2–3 compared options per stay/transfer',
      'Contacts, vouchers and maps',
      'One round of revisions',
    ],
  },
  {
    tier: 'itinerary_plus_support',
    title: 'Itinerary + On-Trip Support',
    duration: '5-day turnaround + travel dates',
    price: 42000,
    deliverables: [
      'Everything in Full Itinerary',
      'WhatsApp support during travel',
      'Real-time changes if plans shift',
      'Emergency contact list',
    ],
  },
]

// ─── Default / blank template_data (a fresh trip-architect site before setup) ─

export const DEFAULT_TEMPLATE_DATA = {
  specialties: [],
  sample_itineraries: [],
  trips_planned: '',
  avg_proposal_days: '',
  planning_approach: '',
  philosophy_quote: '',
  years_experience: '',
  hero_image_url: '',
}

// ─── Sample itineraries (demo / gallery use) ──────────────────────────────────

export const SAMPLE_ITINERARIES = [
  { destination: 'Rajasthan, Royal Circuit',    waypoints: 8, days: 12, style: 'Forts & palaces',            image_url: '' },
  { destination: 'Kerala, Backwaters & Hills',  waypoints: 6, days: 9,  style: 'Houseboats & tea estates',    image_url: '' },
  { destination: 'Himachal, Mountain Loop',     waypoints: 5, days: 8,  style: 'Trek & monastery towns',      image_url: '' },
  { destination: 'Goa, Slow Coastal',           waypoints: 4, days: 6,  style: 'Beaches & food',              image_url: '' },
  { destination: 'Northeast, Meghalaya & Assam',waypoints: 5, days: 9,  style: 'Living roots & tea gardens',  image_url: '' },
]

// ─── Full sample payload (schema 2.0 shape) — used by ?sample=ca-style demo ───
// Same top-level shape site_build_routes.py persists and TripArchitectSite.js's
// payloadToData() reads: business / positioning / proof / frontDoor / knowledge
// / offers / template_data / agents.

export const SAMPLE_PAYLOAD = {
  business: {
    brandName: 'Meridian & Co.',
    ownerName: 'Rhea Menon',
    tagline: "Bespoke trip planning for people who don't want a template holiday",
    city: 'Bengaluru',
    owner: {
      name: 'Rhea Menon',
      email: 'hello@meridianco.in',
      whatsapp: '9845011223',
    },
  },
  positioning: {
    credibility: "Most itineraries are built backwards, from what a hotel wants to sell you. I build them forwards, from how you actually want to spend a day — how much walking, how much rest, how much wandering off-plan. I've planned journeys the length of India, from Ladakh's high passes to Kerala's backwaters, and the brief is always the same: fewer stops, better ones, and a plan that survives contact with real life.",
  },
  proof: {
    testimonials: [
      { name: 'Nikhil & Fara',    role: 'Rajasthan, 12 days',   quote: 'We told Rhea we hate rushing and she built a trip with almost no early mornings. First holiday in years we came back rested instead of needing another one.' },
      { name: 'Priyanka Suresh',  role: 'Himachal, solo', quote: 'The itinerary had a backup plan for every single day. The Manali–Spiti road closed for a day and I never once had to think — it was already re-routed.' },
      { name: 'The Devan Family', role: 'Kerala, with kids',  quote: "Every lodge was checked for what a 6-year-old could actually handle. No generic 'family-friendly' label — she'd actually called and asked." },
    ],
    results: [
      { label: 'Average rating', number: 4.9 },
    ],
  },
  frontDoor: {
    bookingUrl: '#brief',
  },
  knowledge: {
    faqs: [
      { question: 'How far ahead should we get in touch?', answer: 'For a full itinerary, 6–8 weeks before travel gives the best availability. Slower or peak-season routes (Rajasthan in winter, Northeast in autumn) benefit from 3+ months.' },
      { question: 'Do you book the flights and hotels for us?', answer: 'I research, compare and shortlist everything, and hand you ready-to-book options with contacts and prices. You hold the bookings directly — no markup, and you keep full control of cancellations.' },
      { question: 'What if our plans change mid-trip?', answer: "That's exactly what the On-Trip Support tier covers. One weather day, one closed trail, one changed flight — I re-route the plan same-day, not after you're back." },
      { question: 'Is a deposit required?', answer: 'A 50% deposit confirms the booking slot for your planning window, with the balance due on delivery of the itinerary. This is outlined in the brief confirmation.' },
    ],
  },
  offers: {
    items: DEFAULT_PLANNING_TIERS.map(t => ({
      title: t.title,
      price: t.price,
      duration: t.duration,
      deliverables: t.deliverables,
    })),
  },
  template_data: {
    specialties: ['Rajasthan', 'Kerala', 'Himachal', 'Goa', 'Northeast India'],
    sample_itineraries: SAMPLE_ITINERARIES,
    trips_planned: '210+',
    avg_proposal_days: '5 days',
    years_experience: '9',
    philosophy_quote: 'A good itinerary has room to change its mind.',
    planning_approach: 'On-ground contacts across 20+ Indian states, real-time rail and road data, and a working relationship with every homestay, driver and guide on the shortlist — not just a listings page.',
    hero_image_url: '', // populate once a real, licensed photo of the founder's flagship region exists
  },
  agents: [
    {
      id: 'traveller-reply', title: 'Brief Reply Assistant', role: 'Intake Correspondence Helper', badge: 'Popular',
      description: "Paste in a traveller's brief and get a warm, specific reply draft — clarifying questions, availability, and next steps, in your voice.",
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

// ─── Validation: public trip brief form ───────────────────────────────────────
// Mirrors what the backend will re-validate server-side; this is the client-side
// pre-flight check so the form can show inline errors before it ever calls
// POST /api/trip-architect/requests.

export function validateTripBrief(values) {
  const errors = {}

  if (!values.name || !values.name.trim()) errors.name = 'Enter your name.'
  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email.'

  if (values.dateMode === 'fixed') {
    if (values.startDate && values.endDate && new Date(values.endDate) < new Date(values.startDate)) {
      errors.endDate = 'End date is before the start date.'
    }
  }

  if (values.travellerCount !== '' && values.travellerCount != null) {
    const n = Number(values.travellerCount)
    if (!Number.isFinite(n) || n < 1) errors.travellerCount = 'Enter at least 1 traveller.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// ─── Validation: founder's site is ready to publish ───────────────────────────
// Checked before /api/sites/build accepts a trip-architect payload as complete
// (server re-validates independently — this lets the wizard flag gaps early).

export function validateFounderTemplateData(templateData, offers) {
  const errors = []

  if (!templateData?.specialties?.length) {
    errors.push('Add at least one specialty (region or trip style) so travellers know what you plan.')
  }
  if (!templateData?.planning_approach || !templateData.planning_approach.trim()) {
    errors.push('Describe your planning approach in a line or two.')
  }
  const items = Array.isArray(offers?.items) ? offers.items : []
  if (!items.length) {
    errors.push('Add at least one planning package before publishing.')
  }

  return { valid: errors.length === 0, errors }
}

// ─── applyProgrammaticDefaults ─────────────────────────────────────────────────
// Same contract as frontend/lib/wizard-schema.js's applyProgrammaticDefaults:
// fills gaps the Genie prefill left empty, never overwrites a value the user
// or the LLM already supplied.

export function applyProgrammaticDefaults(prefill = {}, userInput = {}) {
  const result = { ...prefill }

  result.offers = result.offers || {}
  const hasOffers = Array.isArray(result.offers.items) && result.offers.items.length > 0
  if (!hasOffers) {
    result.offers.items = DEFAULT_PLANNING_TIERS.map(t => ({
      title: t.title,
      price: t.price,
      duration: t.duration,
      deliverables: t.deliverables,
    }))
  }

  result.knowledge = result.knowledge || {}
  if (!Array.isArray(result.knowledge.faqs) || result.knowledge.faqs.length === 0) {
    result.knowledge.faqs = SAMPLE_PAYLOAD.knowledge.faqs
  }

  result.template_data = { ...DEFAULT_TEMPLATE_DATA, ...(result.template_data || {}) }
  if (!result.template_data.specialties?.length && Array.isArray(userInput.specialties)) {
    result.template_data.specialties = userInput.specialties
  }

  if (!Array.isArray(result.agents) || result.agents.length === 0) {
    result.agents = SAMPLE_PAYLOAD.agents
  }

  return result
}

// ─── mapWizardStateToSiteBuildPayload ──────────────────────────────────────────
// Converts the setup wizard's in-progress state (core sections + the
// trip-architect-specific step) into the payload shape POST /api/sites/build
// expects, and that TripArchitectSite.js's payloadToData() reads back.

export function mapWizardStateToSiteBuildPayload(wizardState = {}) {
  const {
    general = {}, brand = {}, hero = {}, about = {},
    offers = {}, proof = {}, knowledge = {}, contact = {},
    tripArchitect = {}, // the template-specific wizard step
  } = wizardState

  return {
    business: {
      brandName: general.business_name || '',
      ownerName: about.founder_name || '',
      tagline: hero.headline || general.tagline || '',
      city: general.city || '',
      owner: {
        name: about.founder_name || '',
        email: general.email || '',
        whatsapp: general.whatsapp || general.phone || '',
      },
    },
    positioning: {
      credibility: about.story || '',
    },
    proof: {
      testimonials: proof.testimonials || [],
      results: proof.results || [],
    },
    frontDoor: {
      bookingUrl: contact.booking_url || '#brief',
    },
    knowledge: {
      faqs: knowledge.faqs || [],
    },
    offers: {
      items: Array.isArray(offers.items) && offers.items.length ? offers.items
        : DEFAULT_PLANNING_TIERS.map(t => ({ title: t.title, price: t.price, duration: t.duration, deliverables: t.deliverables })),
    },
    template_data: {
      specialties: tripArchitect.specialties || [],
      sample_itineraries: tripArchitect.sample_itineraries || [],
      trips_planned: tripArchitect.trips_planned || '',
      avg_proposal_days: tripArchitect.avg_proposal_days || '',
      years_experience: about.years_experience || '',
      philosophy_quote: tripArchitect.philosophy_quote || about.philosophy_quote || '',
      planning_approach: tripArchitect.planning_approach || '',
    },
    agents: wizardState.agents || SAMPLE_PAYLOAD.agents,
  }
}