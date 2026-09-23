// frontend/lib/template-manifests.js
// ------------------------------------------------------------------
// Single source of truth for how the founder admin (/dashboard/site)
// is assembled for each business model + template.
//
//   MODULES             every admin screen that exists, built once
//   TEMPLATE_MANIFESTS  per template: which modules, in which groups,
//                       which overview widgets, which words to use
//   getManifest(slug)   manifest for a template, or the core default
//
// To support a new profession: add its modules to MODULES (and the
// component to components/site-admin/moduleRegistry.js), then add a
// manifest entry below. Templates without an entry get CORE_MANIFEST.
// ------------------------------------------------------------------

// kind: 'native'  → a full admin screen in components/site-admin/modules
//       'wizard'  → a summary of saved wizard answers + an edit link to that wizard step
export const MODULES = {
  // ── Core: every business ─────────────────────────────────────
  overview:    { label: 'Overview',            icon: 'LayoutDashboard', kind: 'native' },
  enquiries:   { label: 'Enquiries',           icon: 'Inbox',           kind: 'native' },
  positioning: { label: 'Who you help',        icon: 'Target',          kind: 'wizard', wizardStep: 3 },
  offers:      { label: 'Offers & pricing',    icon: 'Layers',          kind: 'wizard', wizardStep: 4 },
  proof:       { label: 'Proof & reviews',     icon: 'Award',           kind: 'wizard', wizardStep: 5 },
  contact:     { label: 'Contact & booking',   icon: 'DoorOpen',        kind: 'wizard', wizardStep: 6 },
  faq:         { label: 'FAQ & policies',      icon: 'BookOpen',        kind: 'wizard', wizardStep: 7 },
  brand:       { label: 'Brand & style',       icon: 'Palette',         kind: 'wizard', wizardStep: 8 },
  agents:      { label: 'AI team',             icon: 'Bot',             kind: 'wizard', wizardStep: 9 },
  payments:    { label: 'Payments & GST',      icon: 'Wallet',          kind: 'wizard', wizardStep: 10 },
  social:      { label: 'Social & content',    icon: 'Share2',          kind: 'wizard', wizardStep: 11 },
  domain:      { label: 'Website address',     icon: 'Globe',           kind: 'wizard', wizardStep: 12 },

  // ── Travel (travel-host) ─────────────────────────────────────
  trips:              { label: 'Trips',             labelKey: 'items', icon: 'Map',           kind: 'native' },
  'trip-calendar':    { label: 'Calendar',          icon: 'CalendarDays', kind: 'native' },
  bookings:           { label: 'Bookings',          icon: 'Ticket',       kind: 'native', badge: 'pendingBookings' },
  'booking-settings': { label: 'Booking settings',  icon: 'Settings2',    kind: 'native' },

  // ── Tutor / Trainer / Creative Coach (tutor-training) ─────────
  classes:        { label: 'Classes',       labelKey: 'items', icon: 'GraduationCap',  kind: 'native' },
  'class-videos': { label: 'Class videos',  icon: 'Video',          kind: 'native' },
  availability:   { label: 'Weekly schedule', icon: 'CalendarClock', kind: 'native' },
}

// Words shown in the admin. Templates override what they need.
const DEFAULT_WORDS = {
  item: 'Offer', items: 'Offers',
  customer: 'Client', customers: 'Clients',
  booking: 'Enquiry', bookings: 'Enquiries',
}

const CORE_NAV = [
  { group: 'Sales',        modules: ['enquiries'] },
  { group: 'Your website', modules: ['positioning', 'offers', 'proof', 'contact', 'faq', 'brand'] },
  { group: 'Business',     modules: ['payments', 'agents', 'social', 'domain'] },
]

export const CORE_MANIFEST = {
  slug: null,
  name: 'Your website',
  words: DEFAULT_WORDS,
  nav: CORE_NAV,
  overview: {
    widgets: ['enquiries.open'],
    checklist: ['core.positioning', 'core.tier1', 'core.proof', 'core.contact'],
  },
  capabilities: [],
}

export const TEMPLATE_MANIFESTS = {
  'travel-host': {
    slug: 'travel-host',
    section: 'experiences-travel',
    name: 'Travel Creator & Tour Organiser',
    accent: '#0B4F55',
    words: {
      item: 'Trip', items: 'Trips',
      customer: 'Traveller', customers: 'Travellers',
      booking: 'Booking', bookings: 'Bookings',
    },
    nav: [
      { group: 'Your trips',   modules: ['trips', 'trip-calendar', 'bookings', 'booking-settings'] },
      { group: 'Sales',        modules: ['enquiries'] },
      { group: 'Your website', modules: ['positioning', 'offers', 'proof', 'faq', 'brand'] },
      { group: 'Business',     modules: ['payments', 'agents', 'social', 'domain'] },
    ],
    overview: {
      widgets: ['travel.nextDeparture', 'travel.seatsSold', 'travel.pendingBookings', 'enquiries.open'],
      checklist: ['travel.publishedTrip', 'travel.departure', 'travel.policy', 'travel.gstin', 'core.proof'],
    },
    // Data sources the shell should load for this template
    capabilities: ['travel'],
    // Extra wizard questions for this template (same format as TEMPLATE_CATALOGUE.extraFields)
    wizardFields: [
      { group: 'template_data', key: 'subscribers',        label: 'YouTube subscribers (e.g. 240000)', hint: 'Shown in the hero only if you fill it', type: 'text', step: 5 },
      { group: 'template_data', key: 'trips_led',          label: 'Group trips led so far',            hint: 'Only if you have counted',            type: 'text', step: 5 },
      { group: 'template_data', key: 'travellers_hosted',  label: 'Travellers hosted so far',          hint: 'Only if you have counted',            type: 'text', step: 5 },
      { group: 'template_data', key: 'countries_visited',  label: 'Countries you have filmed in',      hint: 'Optional',                            type: 'text', step: 5 },
      { group: 'template_data', key: 'tourism_registration', label: 'Tourism registration number',    hint: 'State tourism / Ministry of Tourism, if registered', type: 'text', step: 10 },
    ],
  },

  'tutor-training': {
    slug: 'tutor-training',
    section: 'local-trade',
    name: 'Tutor / Trainer / Creative Coach',
    accent: '#24352B',
    words: {
      item: 'Class', items: 'Classes',
      customer: 'Student', customers: 'Students',
      booking: 'Booking', bookings: 'Bookings',
    },
    nav: [
      { group: 'Your classes',  modules: ['classes', 'class-videos', 'availability', 'bookings', 'booking-settings'] },
      { group: 'Sales',         modules: ['enquiries'] },
      { group: 'Your website',  modules: ['positioning', 'offers', 'proof', 'faq', 'brand'] },
      { group: 'Business',      modules: ['payments', 'agents', 'social', 'domain'] },
    ],
    overview: {
      widgets: ['tutor.upcomingClasses', 'tutor.pendingBookings', 'tutor.classesThisWeek', 'enquiries.open'],
      checklist: ['tutor.publishedClass', 'tutor.availability', 'tutor.meetLink', 'core.proof'],
    },
    capabilities: ['tutor'],
    wizardFields: [
      { group: 'template_data', key: 'teaching_since_year', label: 'Teaching since (year)',              hint: 'e.g. 2016',                                    type: 'text',       step: 2 },
      { group: 'template_data', key: 'primary_subjects',    label: 'Main subjects / skills you teach',   hint: 'One per line — shown as tags in your hero',    type: 'stringlist', step: 2 },
      { group: 'template_data', key: 'age_groups',          label: 'Age groups you teach',                hint: 'Select all that apply',
        type: 'multichoice', step: 2,
        options: [
          { value: 'kids',   label: 'Kids (5–12)' },
          { value: 'teens',  label: 'Teens (13–17)' },
          { value: 'adults', label: 'Adults' },
        ],
      },
      { group: 'template_data', key: 'teaching_formats',    label: 'How you teach',                       hint: 'Select all that apply',
        type: 'multichoice', step: 6,
        options: [
          { value: 'one_on_one',  label: '1-on-1' },
          { value: 'small_group', label: 'Small group' },
          { value: 'workshop',    label: 'Workshops' },
        ],
      },
      { group: 'template_data', key: 'students_taught',     label: 'Students taught so far',              hint: 'Only if you have counted',                     type: 'text',       step: 5 },
      { group: 'template_data', key: 'rating',               label: 'Average student rating (e.g. 4.9)',  hint: 'Shown next to your photo',                     type: 'text',       step: 5 },
      { group: 'template_data', key: 'total_reviews',        label: 'Total reviews (e.g. 86)',             hint: 'Shown next to the rating',                     type: 'text',       step: 5 },
      { group: 'template_data', key: 'certifications',       label: 'Certifications & qualifications',     hint: 'One per line',                                 type: 'stringlist', step: 5 },
      { group: 'template_data', key: 'languages_taught',     label: 'Languages you teach in',              hint: 'Comma-separated, e.g. English, Hindi',         type: 'text',       step: 2 },
    ],
  },
}

// Display names for templates that use the core admin (no manifest of their own yet).
// Keep in step with TEMPLATE_CATALOGUE in app/setup-wizard/page.js.
const TEMPLATE_NAMES = {
  'consultant-advisor': 'Consultant / Advisor',
  'coach-mentor': 'Coach / Mentor',
  'freelancer-creative': 'Freelancer / Creative',
  'agency-of-one': 'Agency-of-One',
  'course-creator': 'Course Creator / Educator',
  'author-speaker': 'Author / Speaker',
  'newsletter-community': 'Newsletter / Community Builder',
  'local-service-pro': 'Local Service Pro',
  'clinic-practitioner': 'Clinic / Practitioner',
  'tutor-training': 'Tutor / Trainer / Creative Coach',
  'digital-product-seller': 'Digital Product Seller',
}

// Manifest for a template slug. Unknown or empty → core manifest,
// named after the template so the header still reads correctly.
export function getManifest(slug, templateName) {
  const m = slug && TEMPLATE_MANIFESTS[slug]
  if (m) return { ...CORE_MANIFEST, ...m, words: { ...DEFAULT_WORDS, ...m.words } }
  return { ...CORE_MANIFEST, slug: slug || null, name: templateName || TEMPLATE_NAMES[slug] || CORE_MANIFEST.name }
}

// Module ids enabled for a manifest (overview is always first).
export function enabledModules(manifest) {
  return ['overview', ...manifest.nav.flatMap((g) => g.modules)]
}

export function moduleLabel(id, manifest) {
  const m = MODULES[id]
  if (!m) return id
  if (m.labelKey && manifest?.words?.[m.labelKey]) return manifest.words[m.labelKey]
  return m.label
}

// URL for a module inside the admin.
export function moduleHref(id) {
  return id === 'overview' ? '/dashboard/site' : `/dashboard/site/${id}`
}