/**
 * wizard-schema.js
 *
 * Single source of truth for the setup-wizard / Genie data structure.
 *
 * USAGE
 * ─────
 * import { WIZARD_SCHEMA, applyProgrammaticDefaults } from '@/lib/wizard-schema'
 *
 * WIZARD_SCHEMA   — the full blank template, mirroring DEFAULT_STATE in setup-wizard/page.js
 *                   and the LLM skeletons in chat_routes.py. Pass this to the LLM as the
 *                   skeleton it must fill so both the backend prompt and the frontend wizard
 *                   always share the same shape.
 *
 * applyProgrammaticDefaults(prefill, userInput)
 *                 — fills every field that the LLM cannot generate from user input
 *                   (social links, YouTube video slot, FAQ section, etc.) with sensible
 *                   placeholder values so the site is always complete even on first save.
 *                   User-supplied or LLM-supplied values are NEVER overwritten.
 *
 * RULE: any field that the LLM CAN generate from user input must be left as "" here.
 *       Any field that the LLM CANNOT generate (URLs, account-specific links, dummy
 *       media) must have a placeholder here so the site is never broken.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Full blank schema (mirrors DEFAULT_STATE in setup-wizard/page.js exactly)
// ─────────────────────────────────────────────────────────────────────────────
export const WIZARD_SCHEMA = {
  start: {
    description: '',
    businessType: 'consulting',
    market: 'india',
    language: 'en',
  },

  identity: {
    brandName: '',
    tagline: '',
    city: '',
    country: 'India',
    logoUrl: '',
    timezone: 'Asia/Kolkata',
    ownerName: '',
    ownerRole: '',
    email: '',
    whatsapp: '',
    photoUrl: '',
  },

  positioning: {
    buyer: '',
    problem: '',
    outcome: '',
    timeframe: '',
    fear: '',
    alreadyTried: '',
    credibility: '',
    forWho: ['', '', ''],
    notFor: ['', ''],
    nicheScore: { pain: 3, budget: 3, reach: 3, repeat: 3, cred: 3 },
  },

  offers: {
    tiers: [
      { tier: 'front_door', name: '', summary: '', deliverables: '', duration: '', priceInr: '', priceUsd: '' },
      { tier: 'core',       name: '', summary: '', deliverables: '', duration: '', priceInr: '', priceUsd: '' },
      { tier: 'recurring',  name: '', summary: '', deliverables: '', duration: '', priceInr: '', priceUsd: '' },
    ],
    product: { enabled: false, name: '', summary: '', link: '', priceInr: '', priceUsd: '' },
    mostBought: 'core',
    paymentTerms: '50_50',
    revisionRounds: '2',
    priceDisplay: 'show',
  },

  proof: {
    yearsExperience: '',
    clientsServed: '',
    credentials: [''],
    results: [],
    caseStudies: [
      { client: '', result: '', whatYouDid: '', detail: '', sector: '' },
      { client: '', result: '', whatYouDid: '', detail: '', sector: '' },
    ],
    testimonials: [],
  },

  frontDoor: {
    primaryCta: 'book_call',
    bookingUrl: '',
    ctaLabel: '',
    invitation: '',
    responseTime: 'Within 1 business day',
    workingHours: '',
    channels: { form: true, whatsapp: true, email: true, booking: true },
    formQuestions: [
      'What does your business do?',
      'What problem do you want solved?',
      'When do you need it done?',
    ],
  },

  knowledge: {
    process: [
      { title: 'Short call', detail: '' },
      { title: 'Fixed proposal', detail: '' },
      { title: 'Delivery', detail: '' },
      { title: 'Walkthrough & handover', detail: '' },
    ],
    included: [''],
    notIncluded: [''],
    refundPolicy: '',
    toolsUsed: '',
    faqs: [],
    /** YouTube video explaining the product / service. LLM cannot generate this. */
    introVideo: {
      url: '',
      title: '',
    },
  },

  brand: {
    style: 'minimal',
    tone: 'plain',
    primaryColor: '#2563eb',
    referenceSite: '',
    avoidWords: '',
  },

  agents: {
    enabled: ['blog', 'social', 'email', 'landing', 'facebook', 'proposals'],
    autonomy: 'draft_only',
    guardrails: {
      onlyListedPrices: true,
      noDeadlines: true,
      noInventedFacts: true,
      logEveryRun: true,
    },
    monthlySpendCap: '',
    facebook: { goal: '', monthlyBudget: '', audience: '', competitorsToAvoid: '' },
  },

  payments: {
    gateways: ['razorpay', 'upi'],
    structure: 'sole_proprietor',
    legalName: '',
    gstRegistered: 'no',
    gstin: '',
    exportClients: 'no',
    lutFiled: 'no',
    invoicePrefix: 'INV-',
    legalPages: { terms: true, privacy: true, refund: true },
  },

  channels: {
    social: {
      linkedin: '',
      instagram: '',
      facebook: '',
      youtube: '',
      x: '',
      googleBusiness: '',
    },
    mainPlatform: 'linkedin',
    cadence: 'weekly',
    newsletter: false,
    contentTopics: ['', '', ''],
    publishedWork: [],
  },

  site: {
    subdomain: '',
    customDomain: '',
    notifyEmail: '',
    analyticsId: '',
  },

  template: {
    sectionId: '',
    slug: '',
  },

  template_data: {},
}

// ─────────────────────────────────────────────────────────────────────────────
// Programmatic defaults — values the LLM cannot or should not generate.
// These are placeholder / dummy values that make the site complete on first
// save and that the user can replace later from /setup-wizard.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SOCIAL_LINKS = {
  linkedin: 'https://linkedin.com/in/yourprofile',
  instagram: 'https://instagram.com/yourhandle',
  facebook: 'https://facebook.com/yourpage',
  youtube: 'https://youtube.com/@yourchannel',
  x: 'https://x.com/yourhandle',
  googleBusiness: '',
}

const DEFAULT_INTRO_VIDEO = {
  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  title: 'Watch: How I Can Help You',
}

const DEFAULT_FAQS = [
  {
    question: 'How do I get started?',
    answer: 'Simply reach out through the contact form or book a free discovery call. I will respond within 1 business day.',
  },
  {
    question: 'What does the process look like?',
    answer: 'We start with a short call to understand your needs, then I send a fixed proposal. After approval, I deliver the work and walk you through it.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes — if you are not satisfied within the first milestone, I will revise the work or issue a refund. See the full refund policy below.',
  },
  {
    question: 'How long does a typical project take?',
    answer: 'Most engagements are scoped and delivered within 2–4 weeks, depending on complexity. The timeline is always agreed upfront.',
  },
  {
    question: 'Can I contact you outside business hours?',
    answer: 'You can leave a message any time. I check messages during working hours and respond within 1 business day.',
  },
]

/**
 * isBlank — true when a value is "effectively empty" (empty string, empty
 * array, empty object, or an array of empty strings).
 */
function isBlank(v) {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0 || v.every(x => isBlank(x))
  if (typeof v === 'object') return Object.keys(v).length === 0
  return false
}

function getIn(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

function setIn(obj, path, value) {
  const keys = path.split('.')
  if (keys.length === 0) return value
  const [k, ...rest] = keys
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj || {}) }
  clone[k] = rest.length === 0 ? value : setIn(obj ? obj[k] : undefined, rest.join('.'), value)
  return clone
}

/**
 * applyProgrammaticDefaults
 *
 * Takes the LLM-generated prefill and applies programmatic placeholder values
 * for any field that:
 *   (a) the LLM cannot generate (social URLs, YouTube embed, etc.), OR
 *   (b) MUST NOT be blank for the site to be coherent (FAQ section).
 *
 * Rules:
 * - Never overwrites a non-blank value already in prefill.
 * - Dummy data is clearly placeholder text the user can update from their dashboard.
 * - FAQ section: always has at least DEFAULT_FAQS if LLM left it empty.
 * - Social links: always have placeholder URLs so footer renders correctly.
 * - introVideo: always has a placeholder YouTube embed URL.
 *
 * @param {object} prefill  — LLM-generated partial wizard state
 * @param {object} [userInput] — raw user intake values (basics, answers, etc.)
 * @returns {object} — new object (prefill is not mutated)
 */
export function applyProgrammaticDefaults(prefill, userInput = {}) {
  let out = { ...prefill }

  // ── 1. Social media links ─────────────────────────────────────────────────
  // All platforms must have at least a placeholder so the footer always renders.
  // User-supplied links from the intake form (links.linkedin, links.instagram)
  // already win because they were merged before this function is called.
  const social = { ...(getIn(out, 'channels.social') || {}) }
  let socialChanged = false
  for (const [platform, placeholder] of Object.entries(DEFAULT_SOCIAL_LINKS)) {
    if (isBlank(social[platform]) && placeholder) {
      social[platform] = placeholder
      socialChanged = true
    }
  }
  if (socialChanged) {
    out = setIn(out, 'channels.social', social)
  }

  // ── 2. YouTube intro video ────────────────────────────────────────────────
  // knowledge.introVideo is a new field (not in old drafts). Always seed it.
  const introVideo = getIn(out, 'knowledge.introVideo') || {}
  if (isBlank(introVideo.url)) {
    out = setIn(out, 'knowledge.introVideo', {
      url: isBlank(introVideo.url) ? DEFAULT_INTRO_VIDEO.url : introVideo.url,
      title: isBlank(introVideo.title) ? DEFAULT_INTRO_VIDEO.title : introVideo.title,
    })
  }

  // ── 3. FAQ section ────────────────────────────────────────────────────────
  // Must never be blank. If LLM produced FAQs, keep them. Otherwise use defaults.
  const faqs = getIn(out, 'knowledge.faqs') || []
  const validFaqs = faqs.filter(f => f && f.question && f.answer)
  if (validFaqs.length === 0) {
    out = setIn(out, 'knowledge.faqs', DEFAULT_FAQS)
  }

  // ── 4. Process steps — fill blank details with sensible copy ─────────────
  const process = getIn(out, 'knowledge.process') || []
  if (process.length === 0) {
    out = setIn(out, 'knowledge.process', [
      { title: 'Discovery call', detail: 'A short free call to understand your needs and goals.' },
      { title: 'Proposal', detail: 'A fixed-scope written proposal with timeline and price.' },
      { title: 'Delivery', detail: 'I do the work and keep you updated throughout.' },
      { title: 'Handover', detail: 'I walk you through everything and answer your questions.' },
    ])
  } else {
    // Fill any blank detail fields
    const filledProcess = process.map(step => ({
      ...step,
      detail: isBlank(step.detail) ? `We complete this step together efficiently.` : step.detail,
    }))
    out = setIn(out, 'knowledge.process', filledProcess)
  }

  // ── 5. Offer tiers — if any price is blank, insert a "contact for price" ──
  // (only for tiers that have a name — unnamed tiers are just unused slots)
  const tiers = getIn(out, 'offers.tiers') || []
  const market = getIn(out, 'start.market') || 'india'
  const filledTiers = tiers.map(tier => {
    if (!tier.name || tier.name.trim() === '') return tier
    const needsInr = market !== 'global' && isBlank(tier.priceInr)
    const needsUsd = market !== 'india' && isBlank(tier.priceUsd)
    return {
      ...tier,
      priceInr: needsInr ? '0' : tier.priceInr,
      priceUsd: needsUsd ? '0' : tier.priceUsd,
    }
  })
  out = setIn(out, 'offers.tiers', filledTiers)

  // ── 6. CTA label — if blank, derive from primaryCta ──────────────────────
  if (isBlank(getIn(out, 'frontDoor.ctaLabel'))) {
    const cta = getIn(out, 'frontDoor.primaryCta') || 'book_call'
    const ctaLabels = {
      book_call: 'Book a Free Call',
      whatsapp: 'Message on WhatsApp',
      form: 'Get in Touch',
      email: 'Email Me',
    }
    out = setIn(out, 'frontDoor.ctaLabel', ctaLabels[cta] || 'Get in Touch')
  }

  // ── 7. Invitation — fill if blank ─────────────────────────────────────────
  if (isBlank(getIn(out, 'frontDoor.invitation'))) {
    out = setIn(out, 'frontDoor.invitation', 'Ready to get started? Reach out and I\'ll respond within 1 business day.')
  }

  // ── 8. refundPolicy — fill if blank ──────────────────────────────────────
  if (isBlank(getIn(out, 'knowledge.refundPolicy'))) {
    out = setIn(out, 'knowledge.refundPolicy', 'If you are not satisfied after the first milestone, I will revise the work or provide a full refund — no questions asked.')
  }

  // ── 9. included / notIncluded ─────────────────────────────────────────────
  const included = (getIn(out, 'knowledge.included') || []).filter(s => s && s.trim())
  if (included.length === 0) {
    out = setIn(out, 'knowledge.included', ['All work as described in the proposal', 'Regular progress updates', 'Final walkthrough and handover'])
  }
  const notIncluded = (getIn(out, 'knowledge.notIncluded') || []).filter(s => s && s.trim())
  if (notIncluded.length === 0) {
    out = setIn(out, 'knowledge.notIncluded', ['Ongoing maintenance unless specified', 'Third-party tool costs'])
  }

  return out
}
