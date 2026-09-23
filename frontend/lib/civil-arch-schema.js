/**
 * Civil / Architectural Consultation template — schema
 * ---------------------------------------------------------------
 * Slug: civil-architect-consultant   Section: service-based
 *
 * Standard wizard groups (business, positioning, proof, frontDoor, knowledge,
 * offers, agents) are read as-is. Everything specific to this template lives in
 * `template_data` and is declared in CIVIL_ARCH_WIZARD_FIELDS below, which plugs
 * straight into TEMPLATE_CATALOGUE.extraFields in setup-wizard/page.js.
 *
 * The wizard's ExtraFieldsForStep supports only: text, stringlist, multichoice.
 * Repeating records (projects, starting fees) are therefore stored as
 * stringlists in pipe format: "a | b | c". parseProjects / parseFees read them.
 */

// ── Enums ────────────────────────────────────────────────────────
export const PROJECT_CATEGORIES = [
  { value: 'residential', label: 'Residential homes' },
  { value: 'renovation',  label: 'Apartments & renovations' },
  { value: 'villa',       label: 'Villas & farmhouses' },
  { value: 'commercial',  label: 'Commercial offices & retail' },
  { value: 'hospitality', label: 'Hospitality, homestays, resorts & cafés' },
  { value: 'interiors',   label: 'Interiors' },
  { value: 'structural',  label: 'Structural / civil projects' },
  { value: 'landscape',   label: 'Landscape & outdoor spaces' },
]

export const PROJECT_STATUSES = [
  { value: 'completed',          label: 'Completed' },
  { value: 'under-construction', label: 'Under construction' },
]

export const PRICING_MODELS = [
  { value: 'fixed_online',    label: 'Fixed-price online consultation' },
  { value: 'starting_fees',   label: 'Starting fees by project type' },
  { value: 'custom_proposal', label: 'Request a custom project proposal' },
]

export const DELIVERY_MODES = [
  { value: 'onsite', label: 'On-site visits' },
  { value: 'remote', label: 'Remote / online' },
]

export const PORTAL_FEATURES = [
  { value: 'documents', label: 'Secure document uploads & version history' },
  { value: 'approvals', label: 'Client approval workflow' },
]

export const DELIVERABLE_TYPES = [
  { value: 'site',       label: 'Site photos & survey' },
  { value: 'concept',    label: 'Concept layout' },
  { value: 'arch',       label: 'Architectural drawing' },
  { value: 'structural', label: 'Structural drawing' },
  { value: 'services',   label: 'Electrical, plumbing, HVAC & fire coordination' },
  { value: '3d',         label: '3D image / walkthrough' },
]

// ── Wizard extra fields (drop into TEMPLATE_CATALOGUE.extraFields) ──
export const CIVIL_ARCH_WIZARD_FIELDS = [
  // Step 2 — identity & credentials
  { group: 'template_data', key: 'education',        label: 'Educational qualifications', hint: 'One per line — degree, institution and year if you like', type: 'stringlist', step: 2 },
  { group: 'template_data', key: 'council_reg',      label: 'Architect council registration no. (if applicable)', hint: 'e.g. CA/2011/12345', type: 'text', step: 2 },
  { group: 'template_data', key: 'engineer_creds',   label: 'Civil / structural engineering credentials (if applicable)', hint: 'e.g. M.Tech Structural Engineering; Chartered Engineer (India)', type: 'text', step: 2 },
  { group: 'template_data', key: 'philosophy',       label: 'Design / engineering philosophy', hint: 'One or two sentences in your own words', type: 'text', step: 2 },
  { group: 'template_data', key: 'service_cities',   label: 'Cities, districts or states you serve', hint: 'One per line', type: 'stringlist', step: 2 },
  { group: 'template_data', key: 'hero_image',       label: 'Hero banner image URL', hint: 'Your 3D render or a completed-project photo. Square works (shown beside the headline) and 16:9 works (full-width banner). Leave blank for a plain wireframe backdrop.', type: 'text', step: 2 },

  // Step 4 — offers & pricing models
  { group: 'template_data', key: 'project_categories', label: 'Project types you take on', hint: 'Controls the filters on your Projects section', type: 'multichoice', step: 4, options: PROJECT_CATEGORIES },
  { group: 'template_data', key: 'pricing_models',     label: 'How you show fees', hint: 'Pick any. You never have to publish full project fees.', type: 'multichoice', step: 4, options: PRICING_MODELS },
  { group: 'template_data', key: 'starting_fees',      label: 'Starting fees by project type', hint: 'Format: Project type | starting fee — e.g. Residential plan | from ₹X per sq ft', type: 'stringlist', step: 4 },

  // Step 5 — projects
  { group: 'template_data', key: 'projects', label: 'Projects to show', hint: 'Format: Title | category | Location | completed or under-construction | image URL (optional). Categories: residential, renovation, villa, commercial, hospitality, interiors, structural, landscape', type: 'stringlist', step: 5 },

  // Step 6 — how clients work with you
  { group: 'template_data', key: 'delivery_modes',  label: 'How you consult', hint: 'Select all that apply', type: 'multichoice', step: 6, options: DELIVERY_MODES },
  { group: 'template_data', key: 'portal_features', label: 'Client portal features', hint: 'Shown as a preview on your site; clients sign in to use them', type: 'multichoice', step: 6, options: PORTAL_FEATURES },
]

// ── Default FAQ topics ─────────────────────────────────────────────
// Generic, number-free guidance so a new site is never empty. The owner's own
// FAQs (knowledge.faqs) always come first and can replace these in the dashboard.
// {city} is replaced with the first service city, or "your city".
export const DEFAULT_FAQS = [
  { q: 'How do I plan a house-construction budget?',
    a: 'Start with the total you can commit, then split it into design and approvals, structure, finishes, services, and a contingency for surprises. Decide your must-haves before you price anything. A detailed estimate prepared before construction begins is the most reliable way to check the plan against the budget.' },
  { q: 'Architect or civil engineer: whom should I hire?',
    a: 'An architect shapes how the building works, feels and uses the plot. A civil or structural engineer makes sure it stands safely and is built to specification. Most houses need both, and it helps when they coordinate from the start.' },
  { q: 'What documents do I need before designing a house?',
    a: 'Bring the sale deed or title papers, the latest property tax receipt, any survey or plot sketch, and site photos. If you have a local-authority map or previous approved plan, bring that too. Your consultant will tell you what else is needed for your plot.' },
  { q: 'What should I ask before buying a plot?',
    a: 'Ask about clear title, permitted use, road access, the shape and slope of the land, drainage, and whether utilities are available. Have a professional look at the plot before you pay a booking amount.' },
  { q: 'What are the common mistakes in home renovation?',
    a: 'Starting demolition before the scope is fixed, ignoring what the walls and slabs carry, hiding plumbing or wiring changes, and skipping a written scope with the contractor. A short assessment before you begin avoids most of these.' },
  { q: 'How does a BOQ reduce cost surprises?',
    a: 'A Bill of Quantities lists every item of work with its quantity. Contractors then quote against the same list, so quotes can be compared fairly and changes are easy to price during construction.' },
  { q: 'How do I select a contractor?',
    a: 'Ask for recent completed work you can visit, talk to their past clients, and get quotes against the same drawings and BOQ. Prefer a clear written scope and payment schedule over the lowest number.' },
  { q: 'What is the building-plan approval checklist for {city}?',
    a: 'Approval requirements differ by city and state, and they change. Your consultant will confirm the current list for {city} with the local authority before submission, so you are not working from an outdated checklist.' },
  { q: 'How many site visits are needed during construction?',
    a: 'It depends on the size of the project and how much of the work is critical, such as foundations, slabs and services. Agree the visit plan at the start, tied to construction stages rather than a fixed calendar.' },
  { q: 'Any tips for planning a farmhouse, homestay or rental property?',
    a: 'Begin with how the property will be used and who will use it. Plan access, water, power and maintenance early, and keep guest or tenant areas easy to run. Rules for stays and rentals vary by place, so check them before you design.' },
]

// ── Deliverables used by the portal preview (sample only) ─────────
export const SAMPLE_DELIVERABLES = [
  {
    id: 'd1', type: 'concept', title: 'Ground and first floor concept layout', status: 'awaiting',
    versions: [
      { v: 'A', date: '2 Mar', note: 'First concept from your brief' },
      { v: 'B', date: '14 Mar', note: 'Stair moved; kitchen opens to the courtyard' },
    ],
    log: [],
  },
  {
    id: 'd2', type: 'structural', title: 'Foundation and column layout', status: 'awaiting',
    versions: [{ v: 'A', date: '20 Mar', note: 'Issued by the structural engineer' }],
    log: [],
  },
  {
    id: 'd3', type: '3d', title: 'Front elevation walkthrough', status: 'approved',
    versions: [{ v: 'A', date: '9 Mar', note: 'Video link shared' }],
    log: [{ who: 'Client', text: 'Approved' }],
  },
]

// ── Parsers for pipe-format stringlists ────────────────────────────
const CAT_ALIASES = {
  residential: 'residential', home: 'residential', homes: 'residential', house: 'residential',
  renovation: 'renovation', apartment: 'renovation', apartments: 'renovation',
  villa: 'villa', villas: 'villa', farmhouse: 'villa', farmhouses: 'villa',
  commercial: 'commercial', office: 'commercial', retail: 'commercial',
  hospitality: 'hospitality', homestay: 'hospitality', resort: 'hospitality', cafe: 'hospitality', café: 'hospitality',
  interiors: 'interiors', interior: 'interiors',
  structural: 'structural', civil: 'structural',
  landscape: 'landscape', outdoor: 'landscape',
}
const normCat = s => CAT_ALIASES[(s || '').trim().toLowerCase()] || 'residential'
const normStatus = s => (/under|ongoing|progress/i.test(s || '') ? 'under-construction' : 'completed')

export function parseProjects(list) {
  return (Array.isArray(list) ? list : [])
    .map(line => String(line || '').split('|').map(s => s.trim()))
    .filter(p => p[0])
    .map(p => ({ title: p[0], category: normCat(p[1]), location: p[2] || '', status: normStatus(p[3]), image: p[4] || '' }))
}

export function parseFees(list) {
  return (Array.isArray(list) ? list : [])
    .map(line => String(line || '').split('|').map(s => s.trim()))
    .filter(p => p[0] && p[1])
    .map(p => ({ type: p[0], fee: p[1] }))
}

// ── Prefill defaults (call on wizard prefill / template change) ────
export function applyProgrammaticDefaults(prefill = {}) {
  const td = { ...(prefill.template_data || {}) }
  const empty = v => !Array.isArray(v) || v.filter(Boolean).length === 0
  if (empty(td.project_categories)) td.project_categories = PROJECT_CATEGORIES.map(c => c.value)
  if (empty(td.pricing_models))     td.pricing_models = ['custom_proposal']
  if (empty(td.delivery_modes))     td.delivery_modes = ['onsite']
  if (empty(td.portal_features))    td.portal_features = []
  return { ...prefill, template_data: td }
}

// ── Sample payload (demo / gallery only — fictional business) ──────
export const SAMPLE_PAYLOAD = {
  schemaVersion: '2.0',
  templateSlug: 'civil-architect-consultant',
  site: { market: 'india', currencies: ['INR'] },
  business: {
    brandName: 'Nair & Associates',
    tagline: 'Plan your home with clarity.',
    city: 'Kochi', country: 'India',
    description: 'Architecture and civil consultation for homes, renovations and small commercial spaces.',
    owner: { name: 'Arjun Nair', role: 'Architect & Civil Consultant', photoUrl: null, email: 'hello@example.com', whatsapp: '+91 98765 43210' },
  },
  positioning: {
    sentence: 'I help first-time home builders in Kerala plan a house they can afford and build without surprises.',
    credibility: 'I have spent 14 years designing homes and supervising their construction. I like to settle the plan, the drawings and the estimate before a single brick is ordered, so the site stays calm.',
  },
  offers: {
    priceDisplay: 'show',
    tiers: [
      { tier: 'front_door', name: '60-minute plot and plan review', summary: 'Bring your plot details and ideas. You leave with a clear next-steps note.',
        duration: 'One video call', deliverables: ['Plot assessment', 'Room-planning advice', 'Written next-steps note'], priceInr: 2500, priceUsd: null, highlight: false },
    ],
  },
  proof: {
    yearsExperience: 14, clientsServed: 120,
    testimonials: [{ name: 'Sample client', role: 'Homeowner', quote: 'The drawings and estimate were ready before work began, and the site never stalled for a decision.' }],
    results: [], caseStudies: [],
  },
  frontDoor: {
    primaryAction: 'enquiry_form', bookingUrl: null, buttonLabel: 'Book a consultation',
    responseTime: 'Within 1 business day', workingHours: 'Mon–Sat, 10am–6pm IST',
    formQuestions: ['What is the plot size and location?'],
  },
  knowledge: {
    process: [
      { title: 'Consultation', detail: 'We review your plot, budget and brief.' },
      { title: 'Concept and plan', detail: 'Layouts you can mark up and approve.' },
      { title: 'Drawings and estimate', detail: 'Detailed drawings with a BOQ.' },
      { title: 'Site support', detail: 'Visits at the stages that matter.' },
    ],
    faqs: [],
  },
  channels: { social: { linkedin: 'https://linkedin.com/', instagram: 'https://instagram.com/' } },
  template_data: {
    hero_image: '/images/civil-hero-3d.jpeg',
    education: ['B.Arch, sample university', 'M.Tech Structural Engineering, sample institute'],
    council_reg: 'CA/0000/00000',
    engineer_creds: 'Chartered Engineer (sample)',
    philosophy: 'A good house is decided on paper first: how the family lives, how the light moves, and what the budget can carry.',
    service_cities: ['Kochi', 'Ernakulam district', 'Thrissur'],
    project_categories: PROJECT_CATEGORIES.map(c => c.value),
    pricing_models: ['fixed_online', 'starting_fees', 'custom_proposal'],
    starting_fees: ['Residential plan | sample: from ₹X per sq ft', 'Renovation design | sample: from ₹X per project', 'Commercial fit-out | on request'],
    projects: [
      'Courtyard house | residential | Kochi | completed',
      'Third-floor apartment refit | renovation | Kakkanad | completed',
      'Riverside farmhouse | villa | Aluva | under-construction',
      'Corner café and bakery | hospitality | Fort Kochi | completed',
      'Two-storey office | commercial | Edappally | under-construction',
      'Living and dining interiors | interiors | Thrissur | completed',
      'Retaining wall and drainage | structural | Munnar | completed',
      'Garden and pool deck | landscape | Kochi | completed',
    ],
    delivery_modes: ['onsite', 'remote'],
    portal_features: ['documents', 'approvals'],
  },
}