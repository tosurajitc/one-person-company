// frontend/lib/tax-insurance-schema.js
// Schema, defaults, compliance rules and sample data for the Tax / Insurance consultant template.
//
// Goal of the site: turn a visitor into a consultation request. Everything after that happens offline.
//
// Key idea: `practice.type` decides a regulator profile (icai | bar | irdai | none). The profile switches
// sections on or off IN CODE (fees, success stories, claim stats), it is not left to the copy.
//
// All figures, licence numbers, dates and stats come from the owner. Nothing here is generated.

export const STALE_AFTER_MONTHS = 6; // statutory dates and rules change often
export const ADVISER_PHOTO = { width: 600, height: 600 };

/* ------------------------------------------------------------------ */
/* Practice types and regulator profiles                               */
/* ------------------------------------------------------------------ */

export const PRACTICE_TYPES = [
  { value: 'ca_firm', label: 'Chartered Accountant', domain: 'tax', regulator: 'icai' },
  { value: 'tax_practitioner', label: 'Tax and GST practitioner', domain: 'tax', regulator: 'none' },
  { value: 'tax_advocate', label: 'Advocate (tax matters)', domain: 'tax', regulator: 'bar' },
  { value: 'insurance_agent', label: 'Insurance agent', domain: 'insurance', regulator: 'irdai' },
  { value: 'insurance_posp', label: 'Point-of-sale person (POSP)', domain: 'insurance', regulator: 'irdai' },
  { value: 'insurance_corporate_agent', label: 'Corporate agent', domain: 'insurance', regulator: 'irdai' },
  { value: 'insurance_broker', label: 'Insurance broker', domain: 'insurance', regulator: 'irdai' },
];

// Conservative defaults. Check the current ICAI website guidelines, Bar Council rules and IRDAI advertising
// regulations before relaxing anything here, and have a compliance professional confirm the text.
export const REGULATOR_RULES = {
  icai: {
    name: 'ICAI',
    allowFees: false,
    allowStories: false,
    allowClaimStats: false,
    allowSuperlatives: false,
    summary: 'Fees, client stories and "best" style claims are switched off to follow ICAI website guidelines.',
  },
  bar: {
    name: 'Bar Council',
    allowFees: false,
    allowStories: false,
    allowClaimStats: false,
    allowSuperlatives: false,
    summary: 'Fees, client stories and comparative claims are switched off because of limits on soliciting.',
  },
  irdai: {
    name: 'IRDAI',
    allowFees: false,
    allowStories: false,
    allowClaimStats: true,
    allowSuperlatives: false,
    summary: 'Premiums, plan comparisons, fees and client stories are switched off. The licence number is always shown.',
  },
  none: {
    name: 'No professional regulator',
    allowFees: true,
    allowStories: true,
    allowClaimStats: false,
    allowSuperlatives: false,
    summary: '',
  },
};

export const practiceInfo = (td) => PRACTICE_TYPES.find((p) => p.value === td?.practice?.type) || PRACTICE_TYPES[0];
export const rulesFor = (td) => REGULATOR_RULES[practiceInfo(td).regulator] || REGULATOR_RULES.none;
export const isTax = (td) => practiceInfo(td).domain === 'tax';
export const isInsurance = (td) => practiceInfo(td).domain === 'insurance';

export const CREDENTIAL_KINDS = [
  { value: 'icai_membership', label: 'ICAI membership' },
  { value: 'icai_firm', label: 'ICAI firm registration' },
  { value: 'gst_practitioner', label: 'GST practitioner enrolment' },
  { value: 'tax_return_preparer', label: 'Tax return preparer registration' },
  { value: 'bar_enrolment', label: 'Bar Council enrolment' },
  { value: 'irdai_agent', label: 'IRDAI agent licence' },
  { value: 'irdai_posp', label: 'POSP certification' },
  { value: 'irdai_corporate_agent', label: 'IRDAI corporate agent registration' },
  { value: 'irdai_broker', label: 'IRDAI broker licence' },
  { value: 'other', label: 'Other registration or membership' },
];

export const CONSULT_MODES = [
  { value: 'phone', label: 'Phone call' },
  { value: 'video', label: 'Video call' },
  { value: 'whatsapp', label: 'WhatsApp call' },
  { value: 'in_person', label: 'In person at the office' },
];

export const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Other'];

export const PRESCREEN_GROUPS = {
  contact: 'Your details',
  need: 'What you need help with',
  background: 'A little more detail',
};
export const GROUP_ORDER = ['contact', 'need', 'background'];

/* ------------------------------------------------------------------ */
/* Formatting and small helpers                                        */
/* ------------------------------------------------------------------ */

export function formatMoney(amount, currency = 'INR') {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency || 'INR'} ${n}`;
  }
}

export function formatDate(v) {
  if (!v) return '';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? `${v}T00:00:00` : v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// No date counts as stale: an undated rule or deadline should not read as checked.
export function isStale(v) {
  if (!v) return true;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? `${v}T00:00:00` : v);
  if (Number.isNaN(d.getTime())) return true;
  const limit = new Date();
  limit.setMonth(limit.getMonth() - STALE_AFTER_MONTHS);
  return d < limit;
}

// A story renders only with recorded consent and at least one allowed part.
export function isVisibleStory(s) {
  return !!(s && s.quote && s.consent_recorded === true && Array.isArray(s.consent_scope) && s.consent_scope.length > 0);
}

// Only https:// or same-site paths (for example /templates/tax-consultant/sample-ca, served from frontend/public/templates/tax-consultant).
// The address you set is tried first, then other common extensions and upper-case variants, because Linux and
// Docker servers are case-sensitive while Windows is not.
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
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const JOURNEY_TAX = [
  { key: 'request', label: 'Send your request', description: 'Choose a session and tell us what you need. It takes about two minutes.' },
  { key: 'call', label: 'We get in touch', description: 'We review your request and call or message you to confirm a time.' },
  { key: 'discuss', label: 'A short discussion', description: 'We understand your situation, explain what is involved and what we would need from you.' },
  { key: 'next', label: 'Next steps with you', description: 'If we are a good fit, we agree the scope and the way forward with you directly.' },
];

const JOURNEY_INSURANCE = [
  { key: 'request', label: 'Tell us who you are covering', description: 'Choose a session and share a few details. It takes about two minutes.' },
  { key: 'call', label: 'We get in touch', description: 'We call or message you to confirm a time that suits your family.' },
  { key: 'review', label: 'Review your needs', description: 'We look at what you have, what is missing and what matters most to you.' },
  { key: 'decide', label: 'Decide in your own time', description: 'We explain your options plainly. There is no pressure to decide on the call.' },
];

const NOTICE_STEPS = [
  'Read the notice and note the last date to respond.',
  'Keep the notice and the related returns and documents together.',
  'Tell us the notice type and deadline. We will call you first.',
];

const CLAIM_STEPS = [
  { label: 'Inform the insurer or TPA', description: 'Use the number on your policy or health card. Do this as early as you can.' },
  { label: 'Keep your documents ready', description: 'Policy copy, ID, hospital or garage papers, and any doctor or police reports.' },
  { label: 'Call us', description: 'We help you fill forms, track the claim and follow up with the insurer.' },
];

const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

export function mergeTemplateData(input) {
  const t = obj(input);
  const p = obj(t.policies);
  const domain = practiceInfo(t).domain;
  return {
    practice: { type: 'ca_firm', ...obj(t.practice) },
    credentials: arr(t.credentials),
    insurers: arr(t.insurers),
    service_areas: arr(t.service_areas),
    services: arr(t.services),
    journey_steps: arr(t.journey_steps).length ? t.journey_steps : domain === 'tax' ? JOURNEY_TAX : JOURNEY_INSURANCE,
    life_events: arr(t.life_events),
    deadlines: arr(t.deadlines),
    notice_help: {
      enabled: false,
      headline: 'Received a notice? Do not ignore it.',
      body: 'Notices carry a last date to respond. Tell us what you received and we will explain what to expect.',
      button_label: 'Tell us about my notice',
      steps: NOTICE_STEPS,
      ...obj(t.notice_help),
    },
    claims_help: { steps: CLAIM_STEPS, helpline: '', hours: '', note: '', ...obj(t.claims_help) },
    claim_stats: arr(t.claim_stats),
    success_stories: arr(t.success_stories),
    resources: arr(t.resources),
    prescreen: { custom_fields: [], ...obj(t.prescreen) },
    integrations: { booking_url: '', ...obj(t.integrations) },
    policies: { version: '1', escalation: {}, grievance: {}, ...p },
  };
}

/* ------------------------------------------------------------------ */
/* Enquiry form fields                                                 */
/* ------------------------------------------------------------------ */

const opt = (list) => list.map((x) => (typeof x === 'string' ? { value: x, label: x } : x));

const INCOME_BANDS = opt(['Below ₹5 lakh', '₹5 to 10 lakh', '₹10 to 25 lakh', '₹25 to 50 lakh', 'Above ₹50 lakh', 'Prefer not to say']);
const TURNOVER_BANDS = opt(['Not applicable', 'Below ₹20 lakh', '₹20 lakh to 1 crore', '₹1 to 5 crore', '₹5 to 50 crore', 'Above ₹50 crore']);
const TAXPAYER = opt(['Salaried', 'Business owner', 'Professional or freelancer', 'NRI', 'Senior citizen', 'HUF', 'Firm or LLP', 'Company']);
const INCOME_SOURCES = opt(['Salary', 'Business or profession', 'Capital gains (shares, mutual funds, property)', 'Rent', 'Foreign income or assets', 'Interest and dividends', 'ESOPs']);
const COVER_FOR = opt(['Myself', 'Spouse or partner', 'Children', 'Parents', 'My business or employees']);
const CITY_TIER = opt(['Metro city', 'Other large city', 'Smaller town or rural']);
const EXISTING_COVER = opt(['None yet', 'Only through my employer', 'Individual policies', 'Both employer and individual']);
const CONTACT_PREF = opt([
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Phone call' },
  { value: 'email', label: 'Email' },
]);

export function getPrescreenFields(td) {
  const tax = isTax(td);
  const svcOptions = arr(td.services).map((s) => ({ value: s.key || s.title, label: s.title }));
  const has = (v) => svcOptions.some((o) => o.value === v);
  if (tax && td.notice_help?.enabled && !has('notice')) svcOptions.push({ value: 'notice', label: 'A notice I have received' });
  if (!tax && !has('review')) svcOptions.push({ value: 'review', label: 'A review of my existing policies' });
  svcOptions.push({ value: 'not_sure', label: 'Not sure yet' });

  const contact = [
    { key: 'full_name', label: 'Full name', type: 'text', required: true, group: 'contact', autoComplete: 'name' },
    { key: 'phone', label: 'Mobile number', type: 'tel', required: true, group: 'contact', autoComplete: 'tel' },
    { key: 'email', label: 'Email address', type: 'email', required: false, group: 'contact', autoComplete: 'email' },
    { key: 'city', label: 'City', type: 'text', required: false, group: 'contact', autoComplete: 'address-level2' },
    { key: 'preferred_language', label: 'Language you are comfortable in', type: 'select', required: false, group: 'contact', options: opt(LANGUAGES) },
    { key: 'contact_channel', label: 'Best way to reach you', type: 'select', required: false, group: 'contact', options: CONTACT_PREF },
  ];

  if (tax) {
    return [
      ...contact,
      { key: 'need', label: 'What do you need help with?', type: 'multi_select', required: true, group: 'need', options: svcOptions },
      { key: 'taxpayer_type', label: 'Who is this for?', type: 'select', required: true, group: 'need', options: TAXPAYER },
      { key: 'notice_received', label: 'Have you received a notice?', type: 'yes_no', required: false, group: 'need' },
      { key: 'notice_deadline', label: 'Last date to respond, if printed on the notice', type: 'date', required: false, group: 'need', showIf: { key: 'notice_received', equals: 'yes' } },
      { key: 'income_sources', label: 'Income sources', type: 'multi_select', required: false, group: 'background', options: INCOME_SOURCES },
      { key: 'turnover_band', label: 'Yearly turnover (if you run a business)', type: 'select', required: false, group: 'background', options: TURNOVER_BANDS },
      { key: 'gst_registered', label: 'Are you registered under GST?', type: 'yes_no', required: false, group: 'background' },
      { key: 'message', label: 'Anything else we should know?', type: 'long_text', required: false, group: 'background' },
    ];
  }

  return [
    ...contact,
    { key: 'need', label: 'What are you looking for?', type: 'multi_select', required: true, group: 'need', options: svcOptions },
    { key: 'cover_for', label: 'Who needs cover?', type: 'multi_select', required: true, group: 'need', options: COVER_FOR },
    { key: 'ages', label: 'Ages of the people to be covered', type: 'text', required: false, group: 'need' },
    { key: 'income_band', label: 'Household income (yearly)', type: 'select', required: false, group: 'background', options: INCOME_BANDS },
    { key: 'existing_cover', label: 'Cover you already have', type: 'select', required: false, group: 'background', options: EXISTING_COVER },
    { key: 'has_loans', label: 'Do you have a home or other loan?', type: 'yes_no', required: false, group: 'background' },
    { key: 'city_tier', label: 'Where do you live?', type: 'select', required: false, group: 'background', options: CITY_TIER },
    { key: 'renewal_date', label: 'Renewal date of an existing policy, if any', type: 'date', required: false, group: 'background' },
    { key: 'message', label: 'Anything else we should know? (please leave out medical details, we will discuss them on the call)', type: 'long_text', required: false, group: 'background' },
  ];
}

/* ------------------------------------------------------------------ */
/* Disclaimers                                                         */
/* ------------------------------------------------------------------ */

export function getDisclaimers(td) {
  const info = practiceInfo(td);
  const lic = arr(td.credentials).find((c) => c.kind === 'irdai_agent' || c.kind === 'irdai_corporate_agent' || c.kind === 'irdai_broker' || c.kind === 'irdai_posp');
  if (info.domain === 'tax') {
    return {
      general:
        'The information on this site is general and is not advice on your own case. Outcomes depend on your facts and on the law at the time. We do not promise refunds, tax savings or particular results.',
      domain:
        info.regulator === 'icai'
          ? 'This website gives information about the firm and its services. It is not an advertisement or a solicitation, and no professional relationship begins until an engagement is agreed in writing.'
          : 'A professional relationship begins only when we agree the scope of work with you in writing.',
    };
  }
  return {
    general:
      'Insurance is the subject matter of solicitation. Benefits, premiums and terms are set by the insurer and are stated in the policy document, so please read it before you buy. We do not guarantee claim outcomes and we do not offer rebates.',
    domain: `Beware of spurious phone calls and fictitious offers.${lic ? ` ${lic.issuing_body} ${lic.number}.` : ''}`,
  };
}

/* ------------------------------------------------------------------ */
/* Compliance check (for the owner dashboard and the build endpoint)   */
/* ------------------------------------------------------------------ */

const P_GUARANTEE = /\b(guarantee[sd]?|assured)\b[^.]{0,30}\b(refund|return|approval|claim|saving|result|settlement)/i;
const P_TOO_GOOD = /\bzero[- ]tax\b|\bnotice[- ]proof\b|\brefund in \d+\s*(hours?|days?)\b|\btax[- ]free returns?\b|\b100\s?%\s?(safe|legal|refund|claim|settlement)\b/i;
const P_SUPERLATIVE = /\b(best|top(?![- ]up)|leading|number\s?one|no\.?\s?1|#1|premier|finest|most trusted)\b/i;
const P_FEE = /(₹|\brs\.?|\binr)\s?\d|\bfree of charge\b|\bprofessional fees?\b|\bfees? (start|from)\b/i;
const P_PREMIUM = /\bpremiums?\b|₹\s?\d[\d,]*\s?(\/|per)\s?(day|month|year)|\bcheapest\b|\bdiscount\b|\brebate\b/i;

const SKIP_KEY = /(url|email|phone|whatsapp|number|date|key|kind|type|slug|version|currency|amount|modes|consent|issuing|timezone)$/i;

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
  const rules = rulesFor(td);
  const texts = [];
  collect({ positioning: p.positioning, about: obj(p.business).about, faqs: obj(p.knowledge).faqs, td }, '', texts);
  const issues = [];
  const add = (path, text, rule, message) => issues.push({ path, snippet: text.slice(0, 120), rule, message });
  texts.forEach(([path, text]) => {
    if (P_GUARANTEE.test(text)) add(path, text, 'guarantee', 'Do not promise refunds, approvals, savings or claim outcomes.');
    if (P_TOO_GOOD.test(text)) add(path, text, 'too_good', 'This claim cannot be backed up. Remove it.');
    if (!rules.allowSuperlatives && P_SUPERLATIVE.test(text)) add(path, text, 'superlative', 'Avoid "best", "top" or "leading" style claims.');
    if (!rules.allowFees && P_FEE.test(text)) add(path, text, 'fee', `Fees should not be mentioned under ${rules.name} rules.`);
    if (practiceInfo(td).regulator === 'irdai' && P_PREMIUM.test(text)) add(path, text, 'premium', 'Avoid premiums, costs and discounts in your own site copy.');
  });
  return issues;
}

/* ------------------------------------------------------------------ */
/* Sample data (all fictional)                                         */
/* ------------------------------------------------------------------ */

export const SAMPLE_PAYLOAD_TAX = {
  site_slug: 'sample-ca',
  business: {
    name: 'Iyer & Associates, Chartered Accountants',
    founder_name: 'CA Meera Iyer',
    founder_photo_url: '/templates/tax-consultant/sample-ca',
    city: 'Bengaluru',
    phone: '+91 80000 00000',
    whatsapp: '+91 90000 00000',
    email: 'hello@iyer-ca.example',
    hours: 'Monday to Saturday, 10:00 to 18:00',
    timezone: 'Asia/Kolkata',
    address: '12 Sample Road, Indiranagar, Bengaluru 560038',
    map_url: '',
    about:
      'We help salaried professionals, freelancers and small businesses stay on the right side of income tax and GST.\n\nEvery new enquiry starts with a short call, so you know what is involved before you decide anything.',
    languages: ['English', 'Hindi', 'Kannada', 'Tamil'],
    year_started: 2011,
    response_time: 'We call back within one working day.',
  },
  positioning: {
    headline: 'Income tax and GST handled by a Chartered Accountant you can check.',
    subheadline: 'Tell us what you need. We call you, understand your situation and explain the way forward.',
    for_who: ['Salaried professionals with capital gains or ESOPs', 'Freelancers and small businesses', 'NRIs with income or assets in India'],
  },
  proof: { stats: [], partners: [] },
  frontDoor: { cta_label: 'Book a consultation' },
  knowledge: {
    faqs: [
      { q: 'How do I get started?', a: 'Send the request form on this page. We call you to understand your situation and explain what is involved.' },
      { q: 'What documents will I need?', a: 'It depends on the work. On the first call we tell you exactly what to gather, so you do not have to guess.' },
      { q: 'Do I have to visit the office?', a: 'No. Most work is done by phone, video and secure document sharing. You are welcome to visit if you prefer.' },
      { q: 'Should I send my PAN, Aadhaar or passwords in the form?', a: 'No. Please do not. We will tell you how to share documents securely once we have spoken.' },
    ],
  },
  template_data: {
    practice: { type: 'ca_firm' },
    credentials: [
      { kind: 'icai_membership', issuing_body: 'ICAI', number: '123456 (sample)', valid_until: '', verify_url: '' },
      { kind: 'icai_firm', issuing_body: 'ICAI', number: '000000S (sample)', valid_until: '', verify_url: '' },
    ],
    service_areas: ['Bengaluru', 'Online across India'],
    services: [
      { key: 'itr', title: 'Income tax returns', description: 'Filing for salaried people, professionals and businesses, with the right form and regime for your situation.', included: ['Salary, rent and interest income', 'Freelance and business income', 'Advance tax planning'] },
      { key: 'capital_gains', title: 'Capital gains and ESOPs', description: 'Shares, mutual funds, property and employee stock options, reported correctly.', included: ['Gains and losses summary', 'Foreign assets and income reporting', 'Planning before you sell'] },
      { key: 'gst', title: 'GST registration and returns', description: 'Registration, monthly and annual returns, and help when the portal shows a mismatch.', included: ['Registration and amendments', 'Regular returns', 'Export and refund support'] },
      { key: 'notice', title: 'Notices and appeals', description: 'We read the notice, explain what it asks and what the process looks like.', included: ['Income tax and GST notices', 'Reply drafting', 'Appeal support'] },
      { key: 'business_setup', title: 'Business setup and compliance', description: 'Private limited, LLP or one-person company, plus Udyam and yearly filings.', included: ['Choosing a structure', 'Registration', 'Yearly filings and bookkeeping'] },
      { key: 'nri', title: 'NRI and cross-border tax', description: 'Income in India, remittances and reporting of overseas assets.', included: ['Residential status check', 'Remittance paperwork', 'Return filing'] },
    ],
    deadlines: [
      { label: 'Income tax return, individuals without audit', when: '31 July', applies_to: 'Most salaried people and freelancers', last_verified: '2026-09-01' },
      { label: 'Income tax return, cases needing audit', when: '31 October', applies_to: 'Businesses and professionals with audit', last_verified: '2026-09-01' },
      { label: 'Advance tax instalments', when: '15 June, 15 September, 15 December, 15 March', applies_to: 'Anyone with tax to pay beyond TDS', last_verified: '2026-09-01' },
      { label: 'GST return GSTR-3B', when: '20th of every month (regular monthly filers)', applies_to: 'GST-registered businesses', last_verified: '2026-09-01' },
    ],
    notice_help: { enabled: true },
    resources: [],
    policies: {
      version: '1',
      privacy: { url: '', body: 'We use the details you send only to respond to your request and to deliver work you engage us for. We do not sell your information.' },
      retention: { url: '', body: 'We keep enquiry details for 12 months unless you become a client.' },
      grievance: { name: 'Meera Iyer', email: 'grievance@iyer-ca.example', phone: '' },
    },
  },
};

export const SAMPLE_PAYLOAD_INSURANCE = {
  site_slug: 'sample-insurance',
  business: {
    name: 'Protect & Plan Advisory',
    founder_name: 'Arjun Mehta',
    founder_photo_url: '/templates/tax-consultant/sample-insurance',
    city: 'Pune',
    phone: '+91 80000 11111',
    whatsapp: '+91 90000 11111',
    email: 'hello@protectplan.example',
    hours: 'Monday to Saturday, 10:00 to 19:00',
    timezone: 'Asia/Kolkata',
    address: '5 Sample Lane, Kothrud, Pune 411038',
    map_url: '',
    about:
      'I help families work out what cover they need, what they already have and what is missing.\n\nI am there when it matters most, at claim time, to help with forms and follow-up.',
    languages: ['English', 'Hindi', 'Marathi'],
    year_started: 2014,
    response_time: 'I call back within one working day.',
  },
  positioning: {
    headline: 'Insurance explained plainly by a licensed adviser, and help when you claim.',
    subheadline: 'Tell us who you want to protect. We call you, review what you have and explain your options with no pressure.',
    for_who: ['Young families and first-time buyers', 'Parents planning for senior-citizen cover', 'Small business owners'],
  },
  proof: { stats: [], partners: [] },
  frontDoor: { cta_label: 'Book a free review' },
  knowledge: {
    faqs: [
      { q: 'What happens on the first call?', a: 'We ask a few questions about your family and what you already have. You will not be asked to buy anything on that call.' },
      { q: 'Will you ask about medical conditions?', a: 'Only on the call, and only what is needed. Please do not put medical details in the form.' },
      { q: 'Can you help me with a claim on a policy I bought elsewhere?', a: 'We can guide you on the process. Tell us the policy type and insurer when you call.' },
    ],
  },
  template_data: {
    practice: { type: 'insurance_agent' },
    credentials: [{ kind: 'irdai_agent', issuing_body: 'IRDAI', number: 'AG-DEMO-0001 (sample)', valid_until: '2028-03-31', verify_url: '' }],
    insurers: ['Sample Life Insurance Co. Ltd.', 'Sample Health Insurance Co. Ltd.'],
    service_areas: ['Pune', 'Online across India'],
    services: [
      { key: 'life', title: 'Life and term protection', description: 'Work out how much cover your family would need if your income stopped.', included: ['Needs analysis', 'Loan-linked cover', 'Nominee and paperwork help'] },
      { key: 'health', title: 'Health cover for the family', description: 'Family floater, top-up and cover for senior parents, explained clearly.', included: ['Waiting periods and exclusions explained', 'Portability guidance', 'Renewal reminders'] },
      { key: 'motor_home', title: 'Motor and home', description: 'Cover for your vehicle and your home, checked for gaps.', included: ['Renewal review', 'Add-ons explained'] },
      { key: 'business', title: 'Business and group cover', description: 'Shop, office, stock and employee cover for small businesses.', included: ['Risk walk-through', 'Group health for staff'] },
      { key: 'claims', title: 'Claims assistance', description: 'Help with forms, documents and follow-up when you need to claim.', included: ['Cashless and reimbursement guidance', 'Follow-up with the insurer or TPA'] },
      { key: 'review', title: 'Review of your existing policies', description: 'Put all your policies on one page and see what is covered and what is not.', included: ['Gap check', 'Renewal calendar'] },
    ],
    life_events: [
      { key: 'marriage', title: 'Getting married', description: 'Start with the right cover for two people.' },
      { key: 'child', title: 'A new baby', description: 'Protect your income and plan for hospital costs.' },
      { key: 'home_loan', title: 'Taking a home loan', description: 'Make sure the loan does not become your family’s burden.' },
      { key: 'parents', title: 'Parents turning 60', description: 'Understand your options for senior-citizen health cover.' },
      { key: 'business', title: 'Starting a business', description: 'Cover for premises, stock and people.' },
    ],
    claims_help: {
      helpline: '+91 80000 11111',
      hours: 'Monday to Saturday, 10:00 to 19:00',
      note: 'For emergencies, contact the hospital and insurer helpline first, then call us.',
    },
    claim_stats: [{ label: 'Claims we have helped with', value: '120 in the last three years', source_note: 'our own records' }],
    resources: [],
    policies: {
      version: '1',
      privacy: { url: '', body: 'We use the details you send only to respond to your request. We do not sell your information.' },
      retention: { url: '', body: 'We keep enquiry details for 12 months unless you become a client.' },
      grievance: { name: 'Arjun Mehta', email: 'grievance@protectplan.example', phone: '' },
      escalation: {
        insurer_note: 'Write to the insurer’s grievance officer first and keep the reference number.',
        irdai_url: 'https://bimabharosa.irdai.gov.in',
        ombudsman_url: 'https://www.cioins.co.in',
      },
    },
  },
};

export const SAMPLE_PAYLOAD = SAMPLE_PAYLOAD_TAX;