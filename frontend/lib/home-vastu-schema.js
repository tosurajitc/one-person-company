// frontend/lib/home-vastu-schema.js
// Schema, defaults, compliance rules and sample data for the Home Interior and Vastu template.
//
// Goal of the site: turn a visitor into a consultation request. Everything after that happens offline.
//
// Rules enforced in code:
//   - the word "Architect" shows only when the owner has entered a Council of Architecture registration number
//   - client projects and stories render only with recorded consent
//   - an availability note older than STALE_AFTER_MONTHS is hidden, so a site never shows old scarcity
//   - Vastu is always presented as a traditional system, never as a promise of any result
//
// All names, numbers, dates and claims come from the owner. Nothing here is generated.

export const STALE_AFTER_MONTHS = 3;
export const ADVISER_PHOTO = { width: 800, height: 1000 }; // 4:5, shown in an arch frame
export const PROJECT_PHOTO = { width: 1000, height: 1250 }; // 4:5, shown in an arch frame
export const HERO_PHOTO = { width: 1920, height: 1080 };

/* ------------------------------------------------------------------ */
/* Practice types and regulator profiles                               */
/* ------------------------------------------------------------------ */

export const PRACTICE_TYPES = [
  { value: 'interior_designer', label: 'Interior designer', regulator: 'none' },
  { value: 'interior_architect', label: 'Interior architect', regulator: 'coa' },
  { value: 'vastu_consultant', label: 'Vastu consultant', regulator: 'none' },
  { value: 'design_build', label: 'Design and build studio', regulator: 'none' },
];

// Conservative defaults. Confirm the Council of Architecture's Professional Conduct Regulations before relaxing.
export const REGULATOR_RULES = {
  coa: {
    name: 'Council of Architecture',
    allowStories: false,
    summary: 'The title "Architect" shows only with a CoA registration number. Client testimonials are switched off until the Council’s conduct rules are confirmed.',
  },
  none: {
    name: 'No statutory regulator for this title',
    allowStories: true,
    summary: '',
  },
};

export const practiceInfo = (td) => PRACTICE_TYPES.find((p) => p.value === td?.practice?.type) || PRACTICE_TYPES[0];
export const rulesFor = (td) => REGULATOR_RULES[practiceInfo(td).regulator] || REGULATOR_RULES.none;

export const hasCoa = (td) => (td?.credentials || []).some((c) => c.kind === 'coa_registration' && String(c.number || '').trim());

// Only a registered architect may be called one. Everyone else is styled as an interior designer.
export function displayRole(td) {
  const info = practiceInfo(td);
  if (info.value === 'interior_architect') return hasCoa(td) ? 'Interior architect' : 'Interior designer';
  return info.label;
}

// Strips a leading "Ar." or "Architect" from a name when there is no CoA registration number.
export function displayName(name, td) {
  const n = String(name || '').trim();
  return hasCoa(td) ? n : n.replace(/^(ar\.?|architect)\s+/i, '');
}

export const CREDENTIAL_KINDS = [
  { value: 'coa_registration', label: 'Council of Architecture registration' },
  { value: 'iiid_membership', label: 'Institute of Indian Interior Designers membership' },
  { value: 'iia_membership', label: 'Indian Institute of Architects membership' },
  { value: 'design_qualification', label: 'Design degree or diploma' },
  { value: 'vastu_certification', label: 'Vastu training or certification (declared by the adviser)' },
  { value: 'gstin', label: 'GST registration' },
  { value: 'other', label: 'Other membership or registration' },
];

export const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Other'];

export const PRESCREEN_GROUPS = {
  contact: 'Your details',
  need: 'About your home',
  background: 'A little more detail',
};
export const GROUP_ORDER = ['contact', 'need', 'background'];

/* ------------------------------------------------------------------ */
/* Formatting and small helpers                                        */
/* ------------------------------------------------------------------ */

export function formatDate(v) {
  if (!v) return '';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? `${v}T00:00:00` : v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// No date counts as stale.
export function isStale(v) {
  if (!v) return true;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? `${v}T00:00:00` : v);
  if (Number.isNaN(d.getTime())) return true;
  const limit = new Date();
  limit.setMonth(limit.getMonth() - STALE_AFTER_MONTHS);
  return d < limit;
}

// Projects and stories show only with recorded consent.
export const isVisibleProject = (p) => !!(p && p.title && p.consent_recorded === true);
export function isVisibleStory(s) {
  return !!(s && s.quote && s.consent_recorded === true && Array.isArray(s.consent_scope) && s.consent_scope.length > 0);
}

// Only https:// or same-site paths (for example /templates/home-interior-vastu/adviser, served from
// frontend/public/templates/home-interior-vastu). The address you set is tried first, then other common
// extensions and upper-case variants, because Linux and Docker servers are case-sensitive while Windows is not.
const IMAGE_EXTS = ['.jpeg', '.jpg', '.webp', '.png', '.JPEG', '.JPG'];
export function imageCandidates(url) {
  const u = String(url || '').trim();
  if (!u) return [];
  const safe = /^https:\/\//i.test(u) || (u.startsWith('/') && !u.startsWith('//'));
  if (!safe) return [];
  const m = u.match(/^(.*?)(\.(?:jpe?g|png|webp))(\?.*)?$/i);
  if (m) return [u, ...IMAGE_EXTS.map((e) => `${m[1]}${e}${m[3] || ''}`).filter((x) => x !== u)];
  return IMAGE_EXTS.map((e) => `${u}${e}`);
}

/* ------------------------------------------------------------------ */
/* Vastu wheel defaults                                                */
/* ------------------------------------------------------------------ */

// Neutral "areas we look at" lists. The owner can replace any of them. The heading in the UI says these are
// traditional Vastu practice shared as guidance, not a promise of any result.
export const VASTU_ZONES = [
  { key: 'N', code: 'N', label: 'North', angle: 0, areas: ['Main entrance', 'Windows and open space', 'Living room'] },
  { key: 'NE', code: 'NE', label: 'North-East', angle: 45, areas: ['Pooja room', 'Entrance', 'Water sources and open space'] },
  { key: 'E', code: 'E', label: 'East', angle: 90, areas: ['Main door', 'Living room', 'Morning light and windows'] },
  { key: 'SE', code: 'SE', label: 'South-East', angle: 135, areas: ['Kitchen', 'Electrical points and appliances', 'Utility area'] },
  { key: 'S', code: 'S', label: 'South', angle: 180, areas: ['Bedrooms', 'Storage', 'Ventilation'] },
  { key: 'SW', code: 'SW', label: 'South-West', angle: 225, areas: ['Master bedroom', 'Heavy furniture and storage', 'Overall balance of the plan'] },
  { key: 'W', code: 'W', label: 'West', angle: 270, areas: ['Dining area', 'Study or home office', 'Children’s rooms'] },
  { key: 'NW', code: 'NW', label: 'North-West', angle: 315, areas: ['Guest room', 'Garage or parking', 'Utility and store rooms'] },
  { key: 'C', code: 'C', label: 'Centre', angle: null, areas: ['What sits at the centre of the home', 'Staircase, toilets and heavy structures', 'Openness and light'] },
];

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const JOURNEY = [
  { key: 'request', label: 'Send your request', description: 'Tell us about your home and what you would like. It takes about two minutes.' },
  { key: 'call', label: 'We get in touch', description: 'We call or message you to confirm a time that suits you.' },
  { key: 'review', label: 'Site visit or plan review', description: 'We look at your home or your floor plan and listen to how your family lives.' },
  { key: 'concept', label: 'Ideas and notes', description: 'You receive design ideas and, if you asked for it, Vastu notes explained in plain language.' },
  { key: 'next', label: 'Proposal and next steps', description: 'If we are a good fit, we agree the scope, timeline and cost with you in writing.' },
];

const CHECKLIST = [
  'A floor plan or a rough sketch',
  'A few photos of the rooms',
  'The direction your main door faces, if you know it',
  'Your possession or move-in date',
  'A rough budget range, if you have one',
];

const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

export function mergeTemplateData(input) {
  const t = obj(input);
  const v = obj(t.vastu);
  const zonesIn = arr(v.zones);
  return {
    practice: { type: 'interior_designer', focus: 'both', ...obj(t.practice) },
    media: { hero_url: '', ...obj(t.media) },
    credentials: arr(t.credentials),
    service_areas: arr(t.service_areas),
    availability: { note: '', as_of: '', ...obj(t.availability) },
    services: arr(t.services),
    vastu: {
      enabled: true,
      intro:
        'Vastu is a traditional system for how a home is arranged. We use it as guidance alongside structure, budget and the way your family lives, and we explain every suggestion in plain language.',
      note: '',
      ...v,
      zones: VASTU_ZONES.map((z) => {
        const o = zonesIn.find((x) => x && x.key === z.key) || {};
        return { ...z, ...o, areas: arr(o.areas).length ? o.areas : z.areas };
      }),
    },
    journey_steps: arr(t.journey_steps).length ? t.journey_steps : JOURNEY,
    checklist: arr(t.checklist).length ? t.checklist : CHECKLIST,
    projects: arr(t.projects),
    success_stories: arr(t.success_stories),
    prescreen: { custom_fields: [], ...obj(t.prescreen) },
    integrations: { booking_url: '', ...obj(t.integrations) },
    policies: { version: '1', grievance: {}, ...obj(t.policies) },
  };
}

/* ------------------------------------------------------------------ */
/* Enquiry form fields                                                 */
/* ------------------------------------------------------------------ */

const opt = (list) => list.map((x) => (typeof x === 'string' ? { value: x, label: x } : x));

const CONTACT_PREF = opt([
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Phone call' },
  { value: 'email', label: 'Email' },
]);
const PROPERTY_TYPE = opt(['Apartment or flat', 'Villa or independent house', 'Plot or new construction', 'Shop, office or other commercial space']);
const PROPERTY_STATUS = opt(['Planning to buy', 'Under construction', 'Possession soon', 'Already living here', 'Renovating a rented home']);
const BHK = opt(['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK or more', 'Not applicable']);
const AREA = opt(['Below 600 sq ft', '600 to 1,000 sq ft', '1,000 to 1,500 sq ft', '1,500 to 2,500 sq ft', 'Above 2,500 sq ft', 'Not sure']);
const FACING = opt(['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West', 'Not sure']);
const BUDGET = opt(['Below ₹5 lakh', '₹5 to 10 lakh', '₹10 to 20 lakh', '₹20 to 40 lakh', 'Above ₹40 lakh', 'Prefer to discuss']);
const TIMELINE = opt(['Within 1 month', '1 to 3 months', '3 to 6 months', 'Just exploring']);
const ROOMS = opt(['Living room', 'Kitchen', 'Master bedroom', 'Other bedrooms', 'Pooja room', 'Bathrooms', 'Study or home office', 'Balcony']);
const STYLES = opt(['Contemporary', 'Traditional Indian', 'Minimal', 'Modern classic', 'Warm and earthy', 'Not sure yet']);

export function getPrescreenFields(td) {
  const services = arr(td.services);
  const needOptions = services.map((s) => ({ value: s.key || s.title, label: s.title }));
  needOptions.push({ value: 'not_sure', label: 'Not sure yet' });
  const vastuKeys = services.filter((s) => s.group === 'vastu').map((s) => s.key || s.title);

  return [
    { key: 'full_name', label: 'Full name', type: 'text', required: true, group: 'contact', autoComplete: 'name' },
    { key: 'phone', label: 'Mobile number', type: 'tel', required: true, group: 'contact', autoComplete: 'tel' },
    { key: 'email', label: 'Email address', type: 'email', required: false, group: 'contact', autoComplete: 'email' },
    { key: 'city', label: 'City', type: 'text', required: true, group: 'contact', autoComplete: 'address-level2' },
    { key: 'preferred_language', label: 'Language you are comfortable in', type: 'select', required: false, group: 'contact', options: opt(LANGUAGES) },
    { key: 'contact_channel', label: 'Best way to reach you', type: 'select', required: false, group: 'contact', options: CONTACT_PREF },

    { key: 'need', label: 'What would you like help with?', type: 'multi_select', required: true, group: 'need', options: needOptions },
    { key: 'property_type', label: 'Type of property', type: 'select', required: true, group: 'need', options: PROPERTY_TYPE },
    { key: 'property_status', label: 'Where are you in the journey?', type: 'select', required: false, group: 'need', options: PROPERTY_STATUS },
    { key: 'bhk', label: 'Size of home', type: 'select', required: false, group: 'need', options: BHK },
    { key: 'carpet_area', label: 'Carpet area', type: 'select', required: false, group: 'need', options: AREA },
    {
      key: 'main_door_facing',
      label: 'Direction the main door faces, if you know it',
      type: 'select',
      required: false,
      group: 'need',
      options: FACING,
      ...(vastuKeys.length ? { showIf: { key: 'need', anyOf: vastuKeys } } : {}),
    },

    { key: 'rooms', label: 'Rooms you are thinking about', type: 'multi_select', required: false, group: 'background', options: ROOMS },
    { key: 'styles', label: 'Styles you like', type: 'multi_select', required: false, group: 'background', options: STYLES },
    { key: 'budget_band', label: 'Rough budget for the project', type: 'select', required: false, group: 'background', options: BUDGET },
    { key: 'start_timeline', label: 'When would you like to start?', type: 'select', required: false, group: 'background', options: TIMELINE },
    { key: 'has_floor_plan', label: 'Do you have a floor plan?', type: 'yes_no', required: false, group: 'background' },
    { key: 'message', label: 'Anything else we should know?', type: 'long_text', required: false, group: 'background' },
  ];
}

/* ------------------------------------------------------------------ */
/* Disclaimers                                                         */
/* ------------------------------------------------------------------ */

export function getDisclaimers(td) {
  return {
    general:
      'Design suggestions are guidance for your home and are finalised only after a site visit or a review of your plans. Timelines and costs depend on the scope agreed in writing.',
    vastu: td?.vastu?.enabled
      ? 'Vastu is a traditional system of belief. We share it as guidance and do not promise health, wealth or any other result.'
      : '',
    role: practiceInfo(td).value === 'interior_architect' && !hasCoa(td) ? 'Registration details have not been added yet.' : '',
  };
}

/* ------------------------------------------------------------------ */
/* Compliance check (for the owner dashboard and the build endpoint)   */
/* ------------------------------------------------------------------ */

const P_GUARANTEE = /\b(guarantee[sd]?|assured|ensures?)\b[^.]{0,40}\b(prosperity|wealth|success|health|peace|marriage|promotion|results?|luck|money)/i;
const P_FEAR = /\bdosh(?:a|as)?\b[^.]{0,60}\b(death|die|divorce|illness|disease|accident|loss|bankrupt|misfortune|separation)|\b(?:will|can|may)\s+(?:cause|bring|lead to)\b[^.]{0,40}\b(death|divorce|illness|loss|misfortune|accident)/i;
const P_CURE = /\b(cure[sd]?|heal[sd]?)\b|\bremov(?:e|es|ing)\s+all\s+(?:negative|bad)\s+energy|\b100\s?%\s?vastu|\bscientifically\s+proven\b/i;
const P_SUPERLATIVE = /\b(best|top(?![- ]up)|leading|number\s?one|no\.?\s?1|#1|premier|finest|most trusted)\b/i;
const P_TIEUP = /\b(authori[sz]ed|official)\s+(dealer|partner|distributor)\b/i;
const P_ARCHITECT = /\barchitect\b|\bAr\.\s/i;

const SKIP_KEY = /(url|email|phone|whatsapp|number|date|key|kind|type|slug|version|currency|consent|issuing|timezone|angle|code|group|as_of|tags|category)$/i;

function collect(node, path, out) {
  if (typeof node === 'string') {
    if (node.trim()) out.push([path, node]);
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => collect(v, `${path}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => {
      if (!SKIP_KEY.test(k)) collect(v, path ? `${path}.${k}` : k, out);
    });
  }
}

// Returns a list of things the owner should review. It flags, it never rewrites.
export function complianceIssues(payload) {
  const p = obj(payload);
  const td = mergeTemplateData(p.template_data);
  const texts = [];
  collect({ positioning: p.positioning, about: obj(p.business).about, founder: obj(p.business).founder_name, faqs: obj(p.knowledge).faqs, td }, '', texts);
  const issues = [];
  const add = (path, text, rule, message) => issues.push({ path, snippet: text.slice(0, 120), rule, message });
  texts.forEach(([path, text]) => {
    if (P_GUARANTEE.test(text)) add(path, text, 'guarantee', 'Do not promise health, wealth, success or other results.');
    if (P_FEAR.test(text)) add(path, text, 'fear', 'Avoid wording that links a Vastu defect to death, illness, divorce or loss.');
    if (P_CURE.test(text)) add(path, text, 'cure', 'Avoid "cure", "100% Vastu" and "scientifically proven" claims.');
    if (P_SUPERLATIVE.test(text)) add(path, text, 'superlative', 'Avoid "best", "top" or "leading" style claims.');
    if (P_TIEUP.test(text)) add(path, text, 'tieup', 'Only claim a dealer or partner tie-up you can show on request.');
    if (!hasCoa(td) && P_ARCHITECT.test(text)) add(path, text, 'architect', 'The title "Architect" needs a Council of Architecture registration number.');
  });
  return issues;
}

/* ------------------------------------------------------------------ */
/* Sample data (all fictional)                                         */
/* ------------------------------------------------------------------ */

const IMG = '/templates/home-interior-vastu';

const SAMPLE_SERVICES = [
  { key: 'full_home', group: 'interior', title: 'Full-home interiors', description: 'A complete plan for every room, from layout and materials to lighting and finishing.', included: ['Space planning and layouts', 'Material and colour palette', '3D views before you decide'] },
  { key: 'kitchen', group: 'interior', title: 'Modular kitchen and wardrobes', description: 'Storage that fits how your family cooks, dresses and lives.', included: ['Layout for daily use', 'Storage and appliance planning', 'Site-measured drawings'] },
  { key: 'pooja', group: 'interior', title: 'Pooja room design', description: 'A quiet, well-lit space for prayer, designed to suit your home and your traditions.', included: ['Wall unit or corner designs', 'Lighting and storage', 'Ventilation for lamps and incense'] },
  { key: 'colour_light', group: 'interior', title: 'Colour and lighting advice', description: 'A focused session to refresh a home without a full renovation.', included: ['Colour palette for each room', 'Lighting layers and fittings', 'Furniture and decor pointers'] },
  { key: 'vastu_review', group: 'vastu', title: 'Vastu review of your home', description: 'We walk through your home and explain what a traditional Vastu reading would note.', included: ['Room-by-room notes', 'Explained in plain language', 'Priorities ranked by effort'] },
  { key: 'vastu_plan', group: 'vastu', title: 'Floor-plan Vastu check before you buy or build', description: 'Share the plan and we tell you what to look at before you commit.', included: ['Entrance and layout notes', 'Questions to ask the builder', 'Works from a plan or PDF'] },
  { key: 'vastu_fix', group: 'vastu', title: 'Practical Vastu adjustments', description: 'Small, reversible changes to furniture, use of rooms and decor, without breaking walls.', included: ['Options that need no construction', 'Costed before you decide'] },
  { key: 'online', group: 'interior', title: 'Online consultation', description: 'For homes in other cities or for a first conversation before a visit.', included: ['Video call with your floor plan', 'Notes shared after the call'] },
];

const SAMPLE_ZONES = [
  { key: 'NE', note: 'In our reviews we look closely at the entrance and the pooja room here.' },
];

export const SAMPLE_PAYLOAD_DESIGNER = {
  site_slug: 'sample-interiors',
  business: {
    name: 'Sundara Living',
    founder_name: 'Ananya Rao',
    founder_photo_url: `${IMG}/adviser`,
    city: 'Hyderabad',
    phone: '+91 80000 22222',
    whatsapp: '+91 90000 22222',
    email: 'hello@sundara.example',
    hours: 'Monday to Saturday, 10:00 to 19:00',
    timezone: 'Asia/Kolkata',
    address: '21 Sample Avenue, Jubilee Hills, Hyderabad 500033',
    map_url: '',
    about:
      'We design homes that feel calm and personal, and we look at Vastu with you when you want it.\n\nEvery project starts with a conversation about how your family lives, so the design fits you and not a catalogue.',
    languages: ['English', 'Hindi', 'Telugu'],
    year_started: 2016,
    response_time: 'We call back within one working day.',
  },
  positioning: {
    headline: 'Homes that feel calm, designed with care and with Vastu in mind.',
    subheadline: 'Tell us about your home. We call you, look at your plan and explain what we would do, in plain language.',
    for_who: ['Families moving into a new home', 'Owners planning a renovation', 'Buyers who want a Vastu opinion on a plan first'],
  },
  proof: {
    stats: [
      { label: 'Homes completed', value: '60', source_note: 'our own records, as of September 2026' },
      { label: 'Cities served', value: '3', source_note: '' },
    ],
    partners: [],
  },
  frontDoor: { cta_label: 'Book a consultation' },
  knowledge: {
    faqs: [
      { q: 'Do you make me follow Vastu?', a: 'No. Vastu is your choice. If you want it, we explain each suggestion and what it would involve, and you decide.' },
      { q: 'Do I need to break walls for Vastu?', a: 'Not necessarily. Many suggestions are about how rooms are used and furnished. We tell you clearly which ones involve construction.' },
      { q: 'Can you help with a rented home?', a: 'Yes. We focus on furniture, lighting, colour and storage that you can take with you.' },
      { q: 'What do I need for the first call?', a: 'A floor plan or a rough sketch and a few photos help. If you do not have them yet, we will guide you.' },
      { q: 'Should I send my address or documents in the form?', a: 'No. City and a few details are enough. We tell you how to share plans and photos securely after we speak.' },
    ],
  },
  template_data: {
    practice: { type: 'interior_designer', focus: 'both' },
    media: { hero_url: `${IMG}/hero` },
    credentials: [
      { kind: 'iiid_membership', issuing_body: 'IIID', number: 'M-00000 (sample)', valid_until: '', verify_url: '' },
      { kind: 'vastu_certification', issuing_body: 'Sample Vastu Institute', number: '', valid_until: '', verify_url: '' },
      { kind: 'gstin', issuing_body: 'GST portal', number: '36AAAAA0000A1Z5 (sample)', valid_until: '', verify_url: '' },
    ],
    service_areas: ['Hyderabad', 'Secunderabad', 'Online across India'],
    availability: { note: 'Now booking projects that start in November.', as_of: '2026-09-15' },
    services: SAMPLE_SERVICES,
    vastu: { enabled: true, zones: SAMPLE_ZONES },
    projects: [
      { key: 'p1', title: 'A calm three-bedroom family home', city: 'Hyderabad', tags: ['full_home', 'living'], bhk: '3 BHK', area_sqft: 1650, style: 'Warm and earthy', duration_text: '14 weeks', image_url: `${IMG}/project-1`, before_url: `${IMG}/project-1-before`, summary: 'Open living and dining, a built-in pooja unit and storage in every room.', consent_recorded: true, consent_scope: ['photo'] },
      { key: 'p2', title: 'A compact kitchen, planned for daily cooking', city: 'Secunderabad', tags: ['kitchen'], bhk: '2 BHK', area_sqft: 1100, style: 'Contemporary', duration_text: '5 weeks', image_url: `${IMG}/project-2`, before_url: '', summary: 'A U-shaped layout with deep drawers and a tall pantry.', consent_recorded: true, consent_scope: ['photo'] },
      { key: 'p3', title: 'A quiet pooja room for a new flat', city: 'Hyderabad', tags: ['pooja'], bhk: '3 BHK', area_sqft: 1400, style: 'Traditional Indian', duration_text: '3 weeks', image_url: `${IMG}/project-3`, before_url: '', summary: 'A carved wall unit with concealed lighting and storage.', consent_recorded: true, consent_scope: ['photo'] },
    ],
    success_stories: [
      { first_name: 'Meena', quote: 'They listened first and explained every suggestion. We never felt rushed or scared into anything.', consent_recorded: true, consent_scope: ['name', 'outcome'], service: 'Full-home interiors', year: 2026, outcome: 'Moved in on schedule' },
    ],
    policies: {
      version: '1',
      privacy: { url: '', body: 'We use the details you send only to respond to your request and to deliver work you engage us for. We do not sell your information.' },
      retention: { url: '', body: 'We keep enquiry details for 12 months unless you become a client.' },
      grievance: { name: 'Ananya Rao', email: 'grievance@sundara.example', phone: '' },
    },
  },
};

// Same site as a registered architect: shows the title, hides testimonials.
export const SAMPLE_PAYLOAD_ARCHITECT = {
  ...SAMPLE_PAYLOAD_DESIGNER,
  site_slug: 'sample-architect',
  business: { ...SAMPLE_PAYLOAD_DESIGNER.business, name: 'Kaveri Design Studio', founder_name: 'Ar. Kaveri Nair', city: 'Bengaluru', address: '8 Sample Road, Indiranagar, Bengaluru 560038' },
  positioning: { ...SAMPLE_PAYLOAD_DESIGNER.positioning, headline: 'Interiors planned with an architect’s eye, and Vastu when you want it.' },
  template_data: {
    ...SAMPLE_PAYLOAD_DESIGNER.template_data,
    practice: { type: 'interior_architect', focus: 'both' },
    credentials: [
      { kind: 'coa_registration', issuing_body: 'Council of Architecture', number: 'CA/0000/00000 (sample)', valid_until: '', verify_url: '' },
      { kind: 'iia_membership', issuing_body: 'IIA', number: 'A-00000 (sample)', valid_until: '', verify_url: '' },
    ],
  },
};

export const SAMPLE_PAYLOAD = SAMPLE_PAYLOAD_DESIGNER;
