// frontend/lib/travel-schema.js
// Travel Creator & Tour Organiser template (slug: "travel-host")
//
// This file adds a `travel` block on top of the existing schema 2.0 wizard payload.
// Mandatory schema 2.0 fields (brand, positioning, offers.tiers Tier 1, contact) are
// still read from the wizard payload — see fromWizardPayload() below. If your key names
// in lib/wizard-schema.js differ, change them ONLY in fromWizardPayload().

export const TRAVEL_TEMPLATE = {
  slug: 'travel-host',
  sectionId: 'experiences-travel',
  name: 'Travel Creator & Tour Organiser',
  palette: 'Lagoon + Sunset',
};

// ─── Enumerations ────────────────────────────────────────────────────────────
export const REGIONS = [
  { value: 'india', label: 'India' },
  { value: 'international', label: 'International' },
];

export const TRIP_TYPES = [
  { value: 'group', label: 'Group tour' },
  { value: 'weekend', label: 'Weekend getaway' },
  { value: 'trek', label: 'Trek / adventure' },
  { value: 'women-only', label: 'Women-only' },
  { value: 'pilgrimage', label: 'Pilgrimage' },
  { value: 'custom', label: 'Private / custom' },
];

export const DIFFICULTY = [
  { value: 'easy', label: 'Easy', hint: 'Suitable for all ages' },
  { value: 'moderate', label: 'Moderate', hint: 'Some walking, 3–5 km a day' },
  { value: 'challenging', label: 'Challenging', hint: 'High altitude or long treks' },
];

export const SHARING = [
  { value: 'twin', label: 'Twin sharing', priceKey: 'priceTwin' },
  { value: 'triple', label: 'Triple sharing', priceKey: 'priceTriple' },
  { value: 'single', label: 'Single room', priceKey: 'priceSingle' },
];

export const PACKAGE_STATUS = ['draft', 'published', 'archived'];
export const DEPARTURE_STATUS = ['open', 'closed', 'cancelled'];
export const BOOKING_STATUS = ['requested', 'deposit_paid', 'confirmed', 'cancelled'];

export const BOOKING_STATUS_LABEL = {
  requested: 'Requested',
  deposit_paid: 'Deposit paid',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

// ─── Blank records (used by the admin forms) ────────────────────────────────
export const BLANK_TRAVEL_SETTINGS = {
  bookingEnabled: true,          // master switch for the whole site
  depositMode: 'percent',        // 'percent' | 'fixed'
  depositValue: 20,              // 20% or ₹ amount
  holdMinutes: 30,               // seats held while a traveller pays the deposit
  balanceDueDays: 21,            // balance due N days before departure
  currency: 'INR',
  gstin: '',
  tourismRegistration: '',       // e.g. state tourism / Ministry of Tourism registration no.
  insuranceIncluded: false,
  cancellationPolicy: [
    { daysBefore: 45, refundPercent: 90 },
    { daysBefore: 30, refundPercent: 50 },
    { daysBefore: 15, refundPercent: 0 },
  ],
  bookingTerms: '',
};

export const BLANK_HOST = {
  youtubeUrl: '',
  featuredVideoId: '',  // YouTube video id, e.g. "dQw4w9WgXcQ"
  subscribers: null,    // only shown if the founder enters it
  countriesVisited: null,
  tripsLed: null,
  travellersHosted: null,
  bio: '',
  photo: '',
};

export const blankItineraryDay = (day = 1) => ({ day, title: '', description: '', stay: '', meals: '' });

export const blankDeparture = () => ({
  id: uid('dep'),
  startDate: '',
  seatsTotal: 16,
  seatsBooked: 0,
  seatsHeld: 0,
  priceOverride: null,
  status: 'open',
  bookingEnabled: true,
});

export const blankPackage = () => ({
  id: uid('pkg'),
  slug: '',
  title: '',
  destination: '',
  region: 'india',
  tripType: 'group',
  durationDays: 5,
  durationNights: 4,
  startCity: '',
  priceTwin: null,
  priceTriple: null,
  priceSingle: null,
  depositOverride: null,  // ₹ per traveller; overrides site setting when set
  difficulty: 'easy',
  minAge: null,
  groupSizeMax: 16,
  coverImage: '',
  youtubeVideoId: '',
  summary: '',
  highlights: [],
  itinerary: [blankItineraryDay(1)],
  inclusions: [],
  exclusions: [],
  stayType: '',
  transport: '',
  visaSupport: false,
  status: 'draft',
  bookingEnabled: true,
  sortOrder: 0,
  departures: [],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export function formatINR(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '';
  return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', opts);
}

export function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function departureEnd(pkg, dep) {
  return addDays(dep.startDate, Math.max(0, (pkg.durationDays || 1) - 1));
}

export function seatsLeft(dep) {
  return Math.max(0, (dep.seatsTotal || 0) - (dep.seatsBooked || 0) - (dep.seatsHeld || 0));
}

export function isDepartureBookable(pkg, dep, settings, today = toISODate(new Date())) {
  return Boolean(
    settings?.bookingEnabled &&
    pkg.status === 'published' &&
    pkg.bookingEnabled &&
    dep.status === 'open' &&
    dep.bookingEnabled &&
    dep.startDate > today &&
    seatsLeft(dep) > 0
  );
}

export function priceFor(pkg, dep, sharing = 'twin') {
  if (dep?.priceOverride) return Number(dep.priceOverride);
  const key = SHARING.find((s) => s.value === sharing)?.priceKey || 'priceTwin';
  return pkg[key] ? Number(pkg[key]) : null;
}

export function lowestPrice(pkg) {
  const prices = [pkg.priceTriple, pkg.priceTwin, pkg.priceSingle, ...(pkg.departures || []).map((d) => d.priceOverride)]
    .filter((p) => p !== null && p !== undefined && p !== '')
    .map(Number);
  return prices.length ? Math.min(...prices) : null;
}

export function depositPerTraveller(pkg, perPersonPrice, settings) {
  if (pkg.depositOverride) return Number(pkg.depositOverride);
  if (!perPersonPrice) return null;
  if (settings?.depositMode === 'fixed') return Number(settings.depositValue || 0);
  return Math.round((perPersonPrice * Number(settings?.depositValue || 0)) / 100);
}

export function upcomingDepartures(packages, settings, { onlyBookable = false } = {}) {
  const today = toISODate(new Date());
  const rows = [];
  (packages || [])
    .filter((p) => p.status === 'published')
    .forEach((pkg) => {
      (pkg.departures || []).forEach((dep) => {
        if (dep.status === 'cancelled' || !dep.startDate || dep.startDate <= today) return;
        const bookable = isDepartureBookable(pkg, dep, settings, today);
        if (onlyBookable && !bookable) return;
        rows.push({ pkg, dep, bookable, left: seatsLeft(dep) });
      });
    });
  return rows.sort((a, b) => a.dep.startDate.localeCompare(b.dep.startDate));
}

// ─── Adapter: schema 2.0 wizard payload → template data ─────────────────────
// Mandatory fields come from the existing wizard; `travel` is the new block.
export function fromWizardPayload(payload = {}) {
  const brand = payload.brand || payload.business || {};
  const positioning = payload.positioning || {};
  const contact = payload.contact || {};
  const tiers = payload.offers?.tiers || [];
  const travel = payload.travel || {};

  return {
    brand: {
      name: brand.name || brand.businessName || '',
      tagline: brand.tagline || '',
      logo: brand.logo || '',
      city: brand.city || contact.city || '',
    },
    positioning: {
      headline: positioning.headline || positioning.oneLiner || '',
      forWho: positioning.forWho || positioning.audience || '',
      outcome: positioning.outcome || positioning.promise || '',
    },
    tiers: tiers.map((t) => ({
      tier: t.tier || t.id || '',
      name: t.name || t.title || '',
      price: t.price ?? null,
      priceLabel: t.priceLabel || '',
      description: t.description || t.summary || '',
      deliverables: t.deliverables || [],
      cta: t.cta || '',
      isHighlighted: Boolean(t.isHighlighted || t.highlighted),
    })),
    proof: {
      testimonials: payload.proof?.testimonials || [],
      stats: payload.proof?.stats || [],
    },
    faq: payload.faq || payload.faqs || [],
    contact: {
      email: contact.email || '',
      phone: contact.phone || '',
      whatsapp: contact.whatsapp || contact.phone || '',
      address: contact.address || '',
    },
    social: payload.social || payload.socialLinks || {},
    legal: payload.legal || {},
    host: { ...BLANK_HOST, ...(travel.host || {}) },
    settings: { ...BLANK_TRAVEL_SETTINGS, ...(travel.settings || {}) },
    packages: travel.packages || [],
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────
// Returns { errors: [...], warnings: [...] }. Errors block publishing.
export function validateTravelSite(data) {
  const errors = [];
  const warnings = [];

  // Mandatory schema 2.0 fields
  if (!data?.brand?.name) errors.push('Business name is required.');
  if (!data?.positioning?.headline) errors.push('Positioning headline is required.');
  if (!data?.tiers?.length) errors.push('At least one offer tier (Tier 1) is required.');
  if (!data?.contact?.email && !data?.contact?.phone) errors.push('Add an email or phone number so travellers can reach you.');

  // Travel-specific
  const published = (data?.packages || []).filter((p) => p.status === 'published');
  if (!published.length) errors.push('Publish at least one travel package.');
  published.forEach((p) => errors.push(...validatePackage(p).map((e) => `${p.title || 'Untitled package'}: ${e}`)));

  const s = data?.settings || {};
  if (s.bookingEnabled) {
    if (!s.cancellationPolicy?.length) errors.push('Online booking needs a cancellation policy.');
    if (!(Number(s.depositValue) > 0)) errors.push('Set a deposit amount or percentage for online booking.');
  }
  if (!s.gstin) warnings.push('GSTIN is empty. Tour packages usually attract GST; check with your CA.');
  if (published.some((p) => p.region === 'international')) {
    warnings.push('International packages: TCS rules on overseas tour packages may apply. Check with your CA.');
  }
  return { errors, warnings };
}

export function validatePackage(p) {
  const errs = [];
  if (!p.title?.trim()) errs.push('title is required');
  if (!p.destination?.trim()) errs.push('destination is required');
  if (!(Number(p.durationDays) > 0)) errs.push('duration (days) must be at least 1');
  if (!(Number(p.priceTwin) > 0)) errs.push('twin-sharing price is required');
  if (!p.itinerary?.some((d) => d.title?.trim())) errs.push('add at least one itinerary day');
  (p.departures || []).forEach((d) => {
    if (!d.startDate) errs.push('every departure needs a start date');
    if (!(Number(d.seatsTotal) > 0)) errs.push('every departure needs seats');
    if (Number(d.seatsBooked) > Number(d.seatsTotal)) errs.push(`departure ${d.startDate}: booked seats exceed total`);
  });
  return errs;
}

// ─── Sample data (used by /templates/travel-host and ?sample=travel) ────────
// All numbers are illustrative sample content, not claims about a real person.
function futureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return toISODate(d);
}

export const TRAVEL_SAMPLE = {
  brand: { name: 'Roam with Riya', tagline: 'Small-group trips from the channel', logo: '', city: 'Pune' },
  positioning: {
    headline: 'Travel the routes you watched on the channel, with me leading the group.',
    forWho: 'First-time group travellers, solo women and working professionals who want a planned trip without the tourist-bus feel.',
    outcome: 'Small groups of 12–16, local stays, and every day planned so you only have to show up.',
  },
  tiers: [
    { tier: 'front_door', name: 'Free trip-planning guide', price: 0, description: 'My packing list, budget sheet and visa checklist, sent on WhatsApp.', deliverables: ['Packing list', 'Budget planner', 'Visa checklist'], cta: 'Get the guide' },
    { tier: 'core', name: 'Group departures', price: 18500, priceLabel: 'from', description: 'Fixed-date small-group trips across India and abroad, led by me or a trained trip lead.', deliverables: ['Stays and transfers', 'Daily plan', 'Trip lead on ground'], cta: 'See departures', isHighlighted: true },
    { tier: 'recurring', name: 'Private & custom trips', price: null, priceLabel: 'on request', description: 'Family, friends or company offsites planned around your dates.', deliverables: ['Custom itinerary', 'Dedicated planner'], cta: 'Plan a private trip' },
  ],
  proof: {
    testimonials: [
      { quote: 'I went solo and came back with eleven friends. Every hotel was exactly what the video showed.', name: 'Ananya K.', detail: 'Meghalaya, March' },
      { quote: 'The daily WhatsApp briefings made it easy for my parents. They want to do Vietnam next.', name: 'Rohit S.', detail: 'Rajasthan, December' },
    ],
    stats: [],
  },
  faq: [
    { q: 'Can I join if I am travelling solo?', a: 'Yes. Most travellers join solo. We pair same-gender roommates on twin sharing, or you can pick a single room.' },
    { q: 'How does the deposit work?', a: 'You pay a deposit to hold your seat. The balance is due 21 days before departure. Refunds follow the cancellation policy on each trip.' },
    { q: 'Are flights included?', a: 'Domestic trips start from the first city listed. Flights to that city are not included unless the trip page says so.' },
    { q: 'Is travel insurance included?', a: 'Not by default. We strongly recommend it and can share options.' },
  ],
  contact: { email: 'trips@roamwithriya.in', phone: '+91 98200 00000', whatsapp: '+91 98200 00000', address: 'Pune, Maharashtra' },
  social: { youtube: 'https://youtube.com/@roamwithriya', instagram: 'https://instagram.com/roamwithriya' },
  legal: {},
  host: {
    ...BLANK_HOST,
    youtubeUrl: 'https://youtube.com/@roamwithriya',
    featuredVideoId: '',
    subscribers: 240000,
    countriesVisited: 23,
    tripsLed: 41,
    travellersHosted: 520,
    bio: 'I started filming weekend trips from Pune in 2019. Viewers kept asking to come along, so in 2023 I started leading small groups on the same routes.',
  },
  settings: { ...BLANK_TRAVEL_SETTINGS, gstin: '27ABCDE1234F1Z5' },
  packages: [
    {
      ...blankPackage(), id: 'pkg_spiti', slug: 'spiti-valley-road-trip', title: 'Spiti Valley road trip', coverImage: '/templates/travel-host/spiti-valley.jpeg', destination: 'Spiti, Himachal Pradesh', region: 'india', tripType: 'trek',
      durationDays: 8, durationNights: 7, startCity: 'Manali', priceTwin: 28500, priceTriple: 26500, priceSingle: 36500,
      difficulty: 'challenging', minAge: 14, groupSizeMax: 14, status: 'published', sortOrder: 1,
      summary: 'High passes, monasteries and village homestays on the classic Manali–Kaza loop.',
      highlights: ['Chandratal lake campsite', 'Key monastery at sunrise', 'Homestay dinner in Langza'],
      itinerary: [
        { day: 1, title: 'Arrive in Manali', description: 'Meet the group, trip briefing and acclimatisation walk.', stay: 'Hotel', meals: 'Dinner' },
        { day: 2, title: 'Manali to Chandratal', description: 'Cross Atal Tunnel and Kunzum Pass. Evening at the lake.', stay: 'Camps', meals: 'B, L, D' },
        { day: 3, title: 'Chandratal to Kaza', description: 'Drive along the Spiti river with stops at Losar.', stay: 'Hotel', meals: 'B, D' },
        { day: 4, title: 'Key, Kibber and Chicham', description: 'Monastery visit and Asia\'s high suspension bridge.', stay: 'Hotel', meals: 'B, D' },
        { day: 5, title: 'Langza, Hikkim, Komic', description: 'Fossil village and the world\'s highest post office.', stay: 'Homestay', meals: 'B, D' },
        { day: 6, title: 'Kaza to Tabo', description: 'Ancient mud-walled monastery and Dhankar lake hike.', stay: 'Homestay', meals: 'B, D' },
        { day: 7, title: 'Tabo to Kalpa', description: 'Kinnaur valley and apple orchards.', stay: 'Hotel', meals: 'B, D' },
        { day: 8, title: 'Departure', description: 'Drive to Shimla. Trip ends by evening.', stay: '', meals: 'B' },
      ],
      inclusions: ['7 nights stay', 'Tempo traveller for the full route', 'Breakfast and dinner', 'Inner-line permits', 'Trip lead and driver'],
      exclusions: ['Travel to Manali', 'Lunch on most days', 'Personal expenses'],
      stayType: 'Hotels, lakeside camps and homestays', transport: 'Tempo traveller',
      departures: [
        { ...blankDeparture(), id: 'dep_sp1', startDate: futureDate(20), seatsTotal: 14, seatsBooked: 11 },
        { ...blankDeparture(), id: 'dep_sp2', startDate: futureDate(48), seatsTotal: 14, seatsBooked: 4 },
      ],
    },
    {
      ...blankPackage(), id: 'pkg_vietnam', slug: 'vietnam-north-to-south', title: 'Vietnam, north to south', coverImage: '/templates/travel-host/vietnam.jpeg', destination: 'Hanoi to Ho Chi Minh City', region: 'international', tripType: 'group',
      durationDays: 10, durationNights: 9, startCity: 'Hanoi', priceTwin: 89000, priceTriple: 84000, priceSingle: 112000,
      difficulty: 'easy', minAge: 8, groupSizeMax: 16, status: 'published', sortOrder: 2, visaSupport: true,
      summary: 'Ha Long Bay overnight cruise, Hoi An lanterns and Mekong delta villages.',
      highlights: ['Overnight Ha Long Bay cruise', 'Hoi An old town by night', 'Mekong delta boat day'],
      itinerary: [
        { day: 1, title: 'Arrive in Hanoi', description: 'Airport pickup, old quarter food walk.', stay: 'Hotel', meals: 'Dinner' },
        { day: 2, title: 'Ha Long Bay cruise', description: 'Board the overnight cruise, kayaking in the bay.', stay: 'Cruise cabin', meals: 'B, L, D' },
        { day: 3, title: 'Back to Hanoi, fly to Da Nang', description: 'Morning tai chi on deck, evening flight.', stay: 'Hotel', meals: 'B' },
        { day: 4, title: 'Hoi An', description: 'Tailor street, lantern boats and a cooking class.', stay: 'Hotel', meals: 'B, L' },
        { day: 5, title: 'Ba Na Hills', description: 'Golden Bridge and cable car.', stay: 'Hotel', meals: 'B' },
        { day: 6, title: 'Fly to Ho Chi Minh City', description: 'War Remnants Museum and Ben Thanh market.', stay: 'Hotel', meals: 'B' },
        { day: 7, title: 'Cu Chi tunnels', description: 'Half-day tunnel visit, free evening.', stay: 'Hotel', meals: 'B' },
        { day: 8, title: 'Mekong delta', description: 'Boat ride through floating markets and villages.', stay: 'Homestay', meals: 'B, L, D' },
        { day: 9, title: 'Free day', description: 'Shopping or optional spa.', stay: 'Hotel', meals: 'B' },
        { day: 10, title: 'Departure', description: 'Airport drop.', stay: '', meals: 'B' },
      ],
      inclusions: ['9 nights stay', 'Two internal flights', 'Ha Long Bay cruise', 'Visa assistance', 'Trip lead from India'],
      exclusions: ['International flights', 'Visa fee', 'Travel insurance', 'Tips'],
      stayType: '4-star hotels, one cruise night, one homestay', transport: 'Private coach and internal flights',
      departures: [
        { ...blankDeparture(), id: 'dep_vn1', startDate: futureDate(35), seatsTotal: 16, seatsBooked: 9 },
        { ...blankDeparture(), id: 'dep_vn2', startDate: futureDate(76), seatsTotal: 16, seatsBooked: 2, priceOverride: 94000 },
      ],
    },
    {
      ...blankPackage(), id: 'pkg_gokarna', slug: 'gokarna-weekend', title: 'Gokarna beach weekend', coverImage: '/templates/travel-host/gokarna.jpeg', destination: 'Gokarna, Karnataka', region: 'india', tripType: 'weekend',
      durationDays: 3, durationNights: 2, startCity: 'Pune', priceTwin: 8500, priceTriple: 7900, priceSingle: 10900,
      difficulty: 'moderate', minAge: 16, groupSizeMax: 18, status: 'published', sortOrder: 3,
      summary: 'Beach-to-beach trek, sunset at Paradise beach and a cliffside camp.',
      highlights: ['Half Moon to Paradise beach trek', 'Cliff camp with bonfire'],
      itinerary: [
        { day: 1, title: 'Overnight bus from Pune', description: 'Meet at Swargate, sleeper bus.', stay: 'Bus', meals: '' },
        { day: 2, title: 'Beach trek', description: 'Om, Half Moon and Paradise beaches on foot.', stay: 'Cliff camp', meals: 'B, D' },
        { day: 3, title: 'Mahabaleshwar temple and return', description: 'Morning temple visit, return bus.', stay: '', meals: 'B' },
      ],
      inclusions: ['Sleeper bus both ways', 'One night camp', 'Breakfast and dinner', 'Trek lead'],
      exclusions: ['Lunches', 'Water sports'],
      stayType: 'Cliffside tents', transport: 'AC sleeper bus',
      departures: [
        { ...blankDeparture(), id: 'dep_gk1', startDate: futureDate(9), seatsTotal: 18, seatsBooked: 18 },
        { ...blankDeparture(), id: 'dep_gk2', startDate: futureDate(23), seatsTotal: 18, seatsBooked: 6 },
        { ...blankDeparture(), id: 'dep_gk3', startDate: futureDate(51), seatsTotal: 18, seatsBooked: 0 },
      ],
    },
    {
      ...blankPackage(), id: 'pkg_kerala', slug: 'kerala-women-only', title: 'Kerala backwaters, women-only', coverImage: '/templates/travel-host/kerala-backwaters.jpeg', destination: 'Kochi, Munnar, Alleppey', region: 'india', tripType: 'women-only',
      durationDays: 6, durationNights: 5, startCity: 'Kochi', priceTwin: 32000, priceTriple: 29500, priceSingle: 41000,
      difficulty: 'easy', minAge: 18, groupSizeMax: 12, status: 'published', sortOrder: 4,
      summary: 'Tea estates, a houseboat night and Fort Kochi art walks with an all-women group.',
      highlights: ['Private houseboat night', 'Tea estate walk in Munnar'],
      itinerary: [
        { day: 1, title: 'Fort Kochi', description: 'Art walk and Kathakali show.', stay: 'Heritage hotel', meals: 'Dinner' },
        { day: 2, title: 'Drive to Munnar', description: 'Waterfalls on the way, spice garden.', stay: 'Resort', meals: 'B, D' },
        { day: 3, title: 'Munnar tea estates', description: 'Estate walk and tea tasting.', stay: 'Resort', meals: 'B, D' },
        { day: 4, title: 'Alleppey houseboat', description: 'Overnight on the backwaters.', stay: 'Houseboat', meals: 'B, L, D' },
        { day: 5, title: 'Marari beach', description: 'Slow beach day and ayurvedic massage (optional).', stay: 'Beach resort', meals: 'B, D' },
        { day: 6, title: 'Departure', description: 'Drop at Kochi airport.', stay: '', meals: 'B' },
      ],
      inclusions: ['5 nights stay', 'Private AC vehicle', 'Houseboat with all meals', 'Woman trip lead'],
      exclusions: ['Flights to Kochi', 'Massages and optional activities'],
      stayType: 'Heritage hotel, resorts, houseboat', transport: 'Private AC vehicle',
      departures: [
        { ...blankDeparture(), id: 'dep_kl1', startDate: futureDate(40), seatsTotal: 12, seatsBooked: 5 },
      ],
    },
  ],
};