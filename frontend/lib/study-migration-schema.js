// frontend/lib/study-migration-schema.js
// Data model for the "Study abroad and migration consultant" template (V1).
//
// Three layers:
//   1. Generic core   business, positioning, proof, frontDoor, knowledge, offers, agents
//                     (standard wizard shape; this template only reads it)
//   2. Template data  payload.template_data  (typed and validated here)
//   3. Custom fields  prescreen.custom_fields + extras[]  (see ./custom-fields.js)
//
// ASSUMPTION: the inner field names of layer 1 are inferred from the template checklist.
// Compare with WIZARD_SCHEMA in frontend/lib/wizard-schema.js before wiring.
//
// Server mirror of the rules: backend/app/services/study_abroad_rules.py

import {
  validateCustomFieldDefs,
  normalizeExtras,
  optionList,
} from './custom-fields';

export const TEMPLATE_SLUG = 'study-abroad-consultant';
// ASSUMPTION: section ids look like 'local-trade' in user_site_settings. Confirm the real id.
export const TEMPLATE_SECTION = 'service-based';
export const STALE_AFTER_MONTHS = 6;

/* ------------------------------------------------------------------ */
/* Reference lists                                                     */
/* ------------------------------------------------------------------ */

export const PRACTICE_TYPES = [
  { value: 'education', label: 'Education counselling only' },
  { value: 'education_and_migration', label: 'Education counselling and migration advice' },
];

export const CREDENTIAL_KINDS = [
  { value: 'licence', label: 'Licence' },
  { value: 'membership', label: 'Membership' },
  { value: 'certification', label: 'Certification' },
  { value: 'partner_status', label: 'Partner status' },
];

export const CONSULT_MODES = [
  { value: 'online', label: 'Online' },
  { value: 'video', label: 'Video call' },
  { value: 'phone', label: 'Phone call' },
  { value: 'office', label: 'At the office' },
];

export const COUNTRIES = [
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
];

export function countryName(d) {
  if (!d) return '';
  if (d.country_name) return d.country_name;
  return COUNTRIES.find((c) => c.code === d.country_code)?.name || d.country_code || '';
}

// Destination card photo. The card shows it at 4:3. Keep the subject near the centre
// (the card crops slightly on some screens) and put no text inside the image.
// Files live in frontend/public/templates/study-migration/ and are named by lower-case
// country code (ca.jpg, au.jpg, ...). A destination can override with its own `image_url`.
export const DESTINATION_IMAGE = { ratio: '4 / 3', width: 1200, height: 900, dir: '/templates/study-migration' };

// Only https:// addresses or paths starting with a single "/" may be used as image sources.
export function isSafeImageUrl(u) {
  return /^(https:\/\/|\/(?!\/))/i.test(String(u || '').trim());
}

// The adviser's photo, shown as a circle in the hero. Square 1:1, head and shoulders, face centred.
// The owner's photo goes in business.founder_photo_url. Demo file: public/templates/study-migration/sample-adviser.jpg
export const ADVISER_PHOTO = { ratio: '1 / 1', width: 600, height: 600, dir: '/templates/study-migration' };

// Files in the platform image folder may be saved as .jpg, .jpeg, .webp or .png (lower-case extension).
// The site tries them in this order and uses the first one that exists.
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'webp', 'png'];

// Addresses to try, in order, for an image. Only files in our own image folder get the extension fallback;
// any other address (an owner's own https:// URL, for example) is used exactly as given.
export function imageCandidates(src) {
  const s = String(src || '').trim();
  if (!s || !isSafeImageUrl(s)) return [];
  const m = s.startsWith(`${DESTINATION_IMAGE.dir}/`) && s.match(/^(.*)\.(jpe?g|png|webp)$/);
  if (!m) return [s];
  return [s, ...IMAGE_EXTENSIONS.map((e) => `${m[1]}.${e}`).filter((x) => x !== s)];
}

export function destinationImageSrc(d) {
  const own = String(d?.image_url || '').trim();
  if (own && isSafeImageUrl(own)) return own;
  const code = String(d?.country_code || '').toLowerCase();
  return code ? `${DESTINATION_IMAGE.dir}/${code}.jpg` : '';
}

// Fixed service keys; the consultant may edit titles and text, and add extras.
export const SERVICE_CATALOG = [
  { key: 'counselling', title: 'Career and course counselling', description: 'A structured conversation about your goals, marks and budget, so the shortlist starts from your situation.' },
  { key: 'shortlist', title: 'University and course shortlist', description: 'A short list of courses and institutions that fit your profile, with costs and intakes laid out side by side.' },
  { key: 'applications', title: 'Admission applications', description: 'Help completing and submitting applications, and keeping track of deadlines.' },
  { key: 'sop_lor', title: 'SOP and LOR guidance', description: 'Feedback on your statement of purpose and guidance for your referees.' },
  { key: 'scholarship', title: 'Scholarship search', description: 'Finding scholarships and funding options you may be eligible to apply for.' },
  { key: 'visa_docs', title: 'Visa documentation', description: 'A checklist and review of the documents needed for your visa application.' },
  { key: 'interview_prep', title: 'Interview preparation', description: 'Practice sessions for university and visa interviews.' },
  { key: 'accommodation', title: 'Accommodation guidance', description: 'Options and practical advice for finding a place to live.' },
  { key: 'pre_departure', title: 'Pre-departure guidance', description: 'What to pack, arrange and expect before you travel.' },
];

export function serviceFromCatalog(key) {
  const s = SERVICE_CATALOG.find((x) => x.key === key);
  return s ? { ...s, included: [], extras: [] } : null;
}

export const DEFAULT_JOURNEY_STEPS = [
  { key: 'enquiry', label: 'Enquiry', description: 'You send a request with a short profile. Nothing is shared with third parties without your permission.' },
  { key: 'prescreen', label: 'Pre-screening', description: 'We read your profile before we speak, so the first call is spent on your questions.' },
  { key: 'consultation', label: 'Consultation', description: 'A conversation about your goals, options, timeline and budget.' },
  { key: 'assessment', label: 'Profile assessment', description: 'We review your academics, test scores and finances against the options you are considering.' },
  { key: 'shortlist', label: 'Shortlist', description: 'A short list of courses and institutions with costs, intakes and deadlines.' },
  { key: 'application', label: 'Application', description: 'Applications are prepared, checked and submitted, and each deadline is tracked.' },
  { key: 'offer', label: 'Offer', description: 'You compare offers and decide what to accept.' },
  { key: 'visa', label: 'Visa', description: 'Documents are checked and prepared for your visa application.' },
  { key: 'departure', label: 'Pre-departure', description: 'Practical preparation before you travel.' },
];

export const DEFAULT_DISCLAIMER = {
  education:
    'We provide education counselling and application support. Admission, scholarship and visa decisions are made by institutions and government authorities, and no outcome can be promised.',
  migration:
    'Immigration advice is regulated in many countries. Where the law requires it, advice on immigration matters may only be given by an authorised representative. Check the registration details on this page against the official register.',
};

/* ------------------------------------------------------------------ */
/* Pre-screening form (built-in fields)                                */
/* ------------------------------------------------------------------ */

export const PRESCREEN_GROUPS = {
  contact: 'About you',
  education: 'Education',
  goals: 'Where and what you want to study',
  english_test: 'English test',
  work: 'Work experience',
  funding: 'Funding',
  history: 'History',
};
export const GROUP_ORDER = ['contact', 'education', 'goals', 'english_test', 'work', 'funding', 'history'];

const o = (...pairs) => pairs.map(([value, label]) => ({ value, label }));

// `locked`: cannot be hidden or made optional.
// date_of_birth is off by default: collect it later, at portal stage, unless the business needs it now.
export const PRESCREEN_FIELDS = [
  { key: 'full_name', group: 'contact', label: 'Full name', type: 'text', locked: true, required: true, enabled: true, autoComplete: 'name' },
  { key: 'email', group: 'contact', label: 'Email', type: 'email', locked: true, required: true, enabled: true, autoComplete: 'email' },
  { key: 'phone', group: 'contact', label: 'Phone or WhatsApp number', type: 'tel', required: true, enabled: true, autoComplete: 'tel' },
  { key: 'city', group: 'contact', label: 'City', type: 'text', required: false, enabled: true, autoComplete: 'address-level2' },
  { key: 'nationality', group: 'contact', label: 'Nationality', type: 'text', required: false, enabled: true },
  { key: 'date_of_birth', group: 'contact', label: 'Date of birth', type: 'date', required: false, enabled: false, autoComplete: 'bday' },

  { key: 'current_level', group: 'education', label: 'Current education level', type: 'select', required: false, enabled: true,
    options: o(['class_12', 'Class 12 or equivalent'], ['diploma', 'Diploma'], ['bachelors', "Bachelor's degree"], ['masters', "Master's degree"], ['other', 'Other']) },
  { key: 'graduation_year', group: 'education', label: 'Year of graduation or expected graduation', type: 'number', required: false, enabled: true },
  { key: 'marks', group: 'education', label: 'Marks, percentage or CGPA', type: 'text', required: false, enabled: true },
  { key: 'backlogs_or_gaps', group: 'education', label: 'Backlogs or study gaps', type: 'select', required: false, enabled: true,
    options: o(['none', 'None'], ['backlogs', 'Backlogs'], ['gap', 'Study gap'], ['both', 'Backlogs and a study gap']) },

  { key: 'target_countries', group: 'goals', label: 'Countries you are considering', type: 'multi_select', required: true, enabled: true, optionsFrom: 'destinations' },
  { key: 'degree_level', group: 'goals', label: 'Degree level', type: 'select', required: false, enabled: true,
    options: o(['diploma', 'Diploma'], ['bachelors', "Bachelor's"], ['masters', "Master's"], ['phd', 'PhD'], ['not_sure', 'Not sure yet']) },
  { key: 'field_of_study', group: 'goals', label: 'Field or course of interest', type: 'text', required: false, enabled: true },
  { key: 'intended_intake', group: 'goals', label: 'Intended intake (for example, Fall 2027)', type: 'text', required: false, enabled: true },

  { key: 'test_type', group: 'english_test', label: 'English test', type: 'select', required: false, enabled: true,
    options: o(['ielts', 'IELTS'], ['pte', 'PTE'], ['toefl', 'TOEFL'], ['duolingo', 'Duolingo'], ['other', 'Other'], ['none_yet', 'Not taken yet']) },
  { key: 'test_status', group: 'english_test', label: 'Test status', type: 'select', required: false, enabled: true,
    options: o(['not_started', 'Not started'], ['booked', 'Booked'], ['taken', 'Taken']) },
  { key: 'test_score', group: 'english_test', label: 'Score, if taken', type: 'text', required: false, enabled: true },

  { key: 'years_experience', group: 'work', label: 'Years of work experience', type: 'number', required: false, enabled: true },
  { key: 'work_field', group: 'work', label: 'Field of work', type: 'text', required: false, enabled: true },

  { key: 'budget_range', group: 'funding', label: 'Yearly budget for tuition and living', type: 'text', required: false, enabled: true },
  { key: 'funding_source', group: 'funding', label: 'Main source of funds', type: 'select', required: false, enabled: true,
    options: o(['self_family', 'Self or family'], ['education_loan', 'Education loan'], ['scholarship', 'Scholarship'], ['employer', 'Employer'], ['other', 'Other']) },
  { key: 'scholarship_expected', group: 'funding', label: 'Do you expect to need a scholarship?', type: 'yes_no', required: false, enabled: true },

  { key: 'prior_visa_refusal', group: 'history', label: 'Has a visa application of yours ever been refused?', type: 'yes_no', required: false, enabled: true },
  { key: 'applying_with_dependants', group: 'history', label: 'Will a partner or children apply with you?', type: 'yes_no', required: false, enabled: true },
];

export const BUILTIN_FIELD_KEYS = PRESCREEN_FIELDS.map((f) => f.key);

/** Built-in pre-screen fields that are switched on for this site, with options resolved. */
export function getPrescreenFields(td) {
  const cfg = td?.prescreen?.fields || {};
  const destOptions = (td?.destinations || [])
    .filter((d) => d.country_code)
    .map((d) => ({ value: d.country_code, label: countryName(d) }));
  destOptions.push({ value: 'OTHER', label: 'Other or not sure yet' });
  return PRESCREEN_FIELDS.map((def) => {
    const c = cfg[def.key] || {};
    const enabled = def.locked ? true : c.enabled ?? def.enabled;
    const required = def.locked ? def.required : c.required ?? def.required;
    const options = def.optionsFrom === 'destinations' ? destOptions : def.options;
    return { ...def, enabled, required, options };
  }).filter((f) => f.enabled);
}

export { optionList };

/* ------------------------------------------------------------------ */
/* Default template data                                               */
/* ------------------------------------------------------------------ */

const EMPTY_POLICY = { url: '', body: '' };

export const DEFAULT_TEMPLATE_DATA = {
  practice: { type: 'education', authorisation_statement: '' },
  credentials: [], // { kind, issuing_body, number, country, valid_until, verify_url }
  disclaimer: { education: '', migration: '' }, // empty = use DEFAULT_DISCLAIMER; text can be edited, never removed
  destinations: [], // see SAMPLE_PAYLOAD for the shape (optional image_url overrides the default photo)
  destinations_more: { enabled: true, note: '' }, // the closing "And more" card; note = optional own wording
  services: [], // { key, title, description, included[], extras[] }
  consultation_types: [
    // Editable starter. Duration, modes and fee are the consultant's own commitments.
    { key: 'discovery', title: 'Discovery call', duration_min: 15, modes: ['phone', 'video'], fee: null, payment_url: '', payment_note: '', booking_url: '', requires_prescreen: true },
  ],
  journey_steps: DEFAULT_JOURNEY_STEPS,
  success_stories: [],
  resources: [], // { type, title, url, body, last_verified }
  policies: {
    version: '',
    privacy: { ...EMPTY_POLICY },
    refund: { ...EMPTY_POLICY },
    cancellation: { ...EMPTY_POLICY },
    retention: { ...EMPTY_POLICY },
    grievance: { name: '', email: '', phone: '' },
  },
  prescreen: { fields: {}, custom_fields: [] },
  integrations: { booking_url: '', webhook_url: '', notify_email: '' },
};

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(base, over) {
  if (!isPlainObject(base) || !isPlainObject(over)) return over === undefined ? base : over;
  const out = { ...base };
  Object.keys(over).forEach((k) => {
    out[k] = isPlainObject(base[k]) && isPlainObject(over[k]) ? deepMerge(base[k], over[k]) : over[k];
  });
  return out;
}

/** Fill gaps with defaults. Lists are replaced, not merged. Never overwrites consultant values. */
export function mergeTemplateData(td) {
  const merged = deepMerge(DEFAULT_TEMPLATE_DATA, isPlainObject(td) ? td : {});
  ['credentials', 'destinations', 'services', 'success_stories', 'resources'].forEach((k) => {
    if (!Array.isArray(merged[k])) merged[k] = [];
  });
  if (!Array.isArray(merged.consultation_types) || merged.consultation_types.length === 0) {
    merged.consultation_types = DEFAULT_TEMPLATE_DATA.consultation_types;
  }
  if (!Array.isArray(merged.journey_steps) || merged.journey_steps.length === 0) {
    merged.journey_steps = DEFAULT_JOURNEY_STEPS;
  }
  merged.destinations = merged.destinations.map((d) => ({ ...d, extras: normalizeExtras(d.extras) }));
  merged.services = merged.services.map((s) => ({ ...s, extras: normalizeExtras(s.extras) }));
  return merged;
}

/** Call from the wizard's applyProgrammaticDefaults so template_data always has a complete shape. */
export function applyStudyAbroadDefaults(td) {
  return mergeTemplateData(td);
}

export function isMigration(td) {
  return td?.practice?.type === 'education_and_migration';
}

export function getDisclaimers(td) {
  const d = td?.disclaimer || {};
  return {
    general: (d.education || '').trim() || DEFAULT_DISCLAIMER.education,
    migration: isMigration(td) ? (d.migration || '').trim() || DEFAULT_DISCLAIMER.migration : '',
    authorisation: isMigration(td) ? (td?.practice?.authorisation_statement || '').trim() : '',
  };
}

/* ------------------------------------------------------------------ */
/* Formatting and dates                                                */
/* ------------------------------------------------------------------ */

export function formatMoney(amount, currency) {
  if (amount == null || amount === '' || Number.isNaN(Number(amount))) return '';
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: currency || 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 }).format(Number(amount));
  } catch {
    return `${currency || ''} ${Number(amount).toLocaleString('en')}`.trim();
  }
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function monthsSince(iso, now = new Date()) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return Infinity;
  return (now.getUTCFullYear() - d.getUTCFullYear()) * 12 + (now.getUTCMonth() - d.getUTCMonth()) - (now.getUTCDate() < d.getUTCDate() ? 1 : 0);
}

export function isStale(iso, months = STALE_AFTER_MONTHS, now = new Date()) {
  if (!iso) return true;
  return monthsSince(iso, now) >= months;
}

export function isVisibleStory(s) {
  return !!(s && s.consent_confirmed === true && Array.isArray(s.consent_scope) && s.consent_scope.length > 0);
}

/* ------------------------------------------------------------------ */
/* Honesty rules: no promised outcomes                                 */
/* ------------------------------------------------------------------ */

const OBJ =
  '(?:visas?|admissions?|pr|permanent\\s+residen(?:ce|cy)|approvals?|scholarships?|jobs?|success|offer\\s+letters?|study\\s+permits?)';
const BANNED = [
  new RegExp(`\\b(?:guarantee[ds]?|guaranteeing|assured|assure[ds]?|promise[ds]?)\\s+(?:a\\s+|an\\s+|the\\s+|your\\s+|you\\s+)?${OBJ}\\b`, 'i'),
  /\b(?:100\s*%|hundred\s+percent)\s*(?:visa|admission|success|approval|guarantee|placement|pr)\b/i,
  /\bsure[\s-]?shot\b/i,
  /\bno\s+risk\s+of\s+(?:refusal|rejection)\b/i,
  /\b(?:visa|admission|pr)\s+(?:is\s+)?(?:guaranteed|assured|certain)\b/i,
];
const NEGATION = /\b(?:not|never|cannot|can't|cant|don't|dont|doesn't|doesnt|won't|wont|no|without|neither|nor)\b/i;

/** Returns matched phrases. Sentences that are questions, or that negate the promise, are allowed. */
export function findBannedPhrases(text) {
  if (typeof text !== 'string' || !text) return [];
  const hits = [];
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  sentences.forEach((sentence) => {
    if (sentence.trim().endsWith('?')) return;
    BANNED.forEach((re) => {
      const m = re.exec(sentence);
      if (!m) return;
      const before = sentence.slice(Math.max(0, m.index - 40), m.index);
      if (NEGATION.test(before)) return;
      hits.push(m[0].trim());
    });
  });
  return hits;
}

function walkStrings(value, path, visit) {
  if (typeof value === 'string') return visit(path, value);
  if (Array.isArray(value)) return value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, visit));
  if (isPlainObject(value)) Object.keys(value).forEach((k) => walkStrings(value[k], path ? `${path}.${k}` : k, visit));
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Validation (run on save and before publish)                         */
/* ------------------------------------------------------------------ */

const hasPolicy = (p) => !!(p && ((p.url || '').trim() || (p.body || '').trim()));

/**
 * @returns {{errors: {path:string,message:string}[], warnings: {path:string,message:string}[]}}
 *   errors block publishing; warnings are shown to the owner.
 */
export function validateTemplateData(input, now = new Date(), business = null) {
  const td = mergeTemplateData(input);
  const errors = [];
  const warnings = [];
  const err = (path, message) => errors.push({ path, message });
  const warn = (path, message) => warnings.push({ path, message });

  // Adviser photo (lives in the generic business block, so it is passed in separately)
  if (business && business.founder_photo_url && !isSafeImageUrl(business.founder_photo_url)) {
    err('business.founder_photo_url', 'Use an https:// address or a path starting with a single /.');
  }

  // Credentials
  if (td.credentials.length === 0) err('credentials', 'Add at least one licence, registration or membership so visitors can check who you are.');
  td.credentials.forEach((c, i) => {
    if (!CREDENTIAL_KINDS.some((k) => k.value === c.kind)) err(`credentials[${i}].kind`, 'Choose a credential type.');
    if (!(c.issuing_body || '').trim()) err(`credentials[${i}].issuing_body`, 'Enter who issued this.');
    if (!(c.number || '').trim()) err(`credentials[${i}].number`, 'Enter the registration or membership number.');
    if (c.valid_until && Number.isNaN(Date.parse(c.valid_until))) err(`credentials[${i}].valid_until`, 'Enter a valid date.');
    if (c.valid_until && Date.parse(c.valid_until) < now.getTime()) warn(`credentials[${i}].valid_until`, 'This credential has expired. Renew it or remove it.');
    if (!c.verify_url) warn(`credentials[${i}].verify_url`, 'Add a link to the official register so visitors can check this.');
  });

  // Migration mode
  if (isMigration(td)) {
    if (!(td.practice.authorisation_statement || '').trim()) {
      err('practice.authorisation_statement', 'Migration advice needs a statement of who is authorised to give it and where.');
    }
    if (!td.credentials.some((c) => c.kind === 'licence')) {
      err('credentials', 'Migration advice needs at least one licence or authorisation entry.');
    }
  }

  // Policies
  const p = td.policies;
  if (!hasPolicy(p.privacy)) err('policies.privacy', 'Add a privacy policy (link or text).');
  if (!hasPolicy(p.refund)) err('policies.refund', 'Add a fee-refund policy (link or text).');
  if (!hasPolicy(p.cancellation)) err('policies.cancellation', 'Add a cancellation policy (link or text).');
  if (!((p.grievance?.email || '').trim() || (p.grievance?.phone || '').trim())) {
    err('policies.grievance', 'Add a grievance contact (email or phone).');
  }
  if (!hasPolicy(p.retention)) warn('policies.retention', 'Add a document-retention note before you start collecting documents.');

  // Consultation types
  td.consultation_types.forEach((t, i) => {
    if (!(t.key || '').trim() || !(t.title || '').trim()) err(`consultation_types[${i}]`, 'Each session needs a key and a title.');
    if (t.fee && !(Number(t.fee.amount) > 0 && (t.fee.currency || '').trim())) {
      err(`consultation_types[${i}].fee`, 'A fee needs an amount above zero and a currency. Leave it empty for a free session.');
    }
    (t.modes || []).forEach((m) => {
      if (!CONSULT_MODES.some((x) => x.value === m)) err(`consultation_types[${i}].modes`, `Unknown mode: ${m}`);
    });
  });

  // Destinations and resources must say when they were last checked
  td.destinations.forEach((d, i) => {
    if (!d.country_code) err(`destinations[${i}].country_code`, 'Choose a country.');
    if (d.image_url && !isSafeImageUrl(d.image_url)) {
      err(`destinations[${i}].image_url`, 'Use an https:// address or a path starting with a single /.');
    }
    if (!d.last_verified || Number.isNaN(Date.parse(d.last_verified))) {
      err(`destinations[${i}].last_verified`, 'Enter the date you last checked this information.');
    } else if (isStale(d.last_verified, STALE_AFTER_MONTHS, now)) {
      warn(`destinations[${i}].last_verified`, `Last checked more than ${STALE_AFTER_MONTHS} months ago. The site will ask visitors to confirm details with you.`);
    }
  });
  td.resources.forEach((r, i) => {
    if (r.last_verified && isStale(r.last_verified, STALE_AFTER_MONTHS, now)) {
      warn(`resources[${i}].last_verified`, 'Last checked more than 6 months ago.');
    }
  });

  // Success stories
  td.success_stories.forEach((s, i) => {
    if (s.consent_confirmed === true) {
      if (!s.consent_date || Number.isNaN(Date.parse(s.consent_date))) err(`success_stories[${i}].consent_date`, 'Record the date the student gave permission.');
      if (!Array.isArray(s.consent_scope) || s.consent_scope.length === 0) err(`success_stories[${i}].consent_scope`, 'Record what the student allowed you to publish (name, photo, outcome).');
    } else {
      warn(`success_stories[${i}]`, 'No recorded permission, so this story will not appear on the site.');
    }
  });

  // Custom question definitions
  const cf = validateCustomFieldDefs(td.prescreen.custom_fields, { reservedKeys: BUILTIN_FIELD_KEYS });
  cf.errors.forEach((e) => err(`prescreen.custom_fields${e.index >= 0 ? `[${e.index}]` : ''}`, e.message));

  // Integrations
  const wh = (td.integrations.webhook_url || '').trim();
  if (wh && !/^https:\/\//i.test(wh)) err('integrations.webhook_url', 'The webhook address must start with https://.');

  // No promised outcomes anywhere
  walkStrings(td, '', (path, text) => {
    findBannedPhrases(text).forEach((phrase) => {
      err(path, `Remove "${phrase}". Outcomes cannot be promised.`);
    });
  });

  if (td.destinations.length === 0) warn('destinations', 'No destinations yet. Visitors will not see country information.');
  return { errors, warnings };
}

/* ------------------------------------------------------------------ */
/* Wizard mapping                                                      */
/* ------------------------------------------------------------------ */

// ASSUMPTION: the wizard state uses the standard block names from the template checklist.
// The real wizard-schema.js may differ; adjust here, nowhere else.
export function mapWizardStateToSiteBuildPayload(state) {
  const s = state || {};
  return {
    schema_version: '2.0',
    template: { slug: TEMPLATE_SLUG, sectionId: TEMPLATE_SECTION },
    business: s.business || {},
    positioning: s.positioning || {},
    proof: s.proof || {},
    frontDoor: s.frontDoor || {},
    knowledge: s.knowledge || {},
    offers: s.offers || {},
    agents: s.agents || {},
    template_data: applyStudyAbroadDefaults(s.template_data),
  };
}

/* ------------------------------------------------------------------ */
/* Sample data (fictional; used by the gallery demo)                   */
/* ------------------------------------------------------------------ */

export const SAMPLE_PAYLOAD = {
  schema_version: '2.0',
  template: { slug: TEMPLATE_SLUG, sectionId: TEMPLATE_SECTION },
  business: {
    name: 'Meridian Study Advisors',
    tagline: 'Study-abroad counselling for students and parents',
    founder_name: 'Anita Rao',
    founder_photo_url: '/templates/study-migration/sample-adviser.jpg',
    about:
      'Anita started advising students after helping her own cousins through the application process. The practice is small on purpose: every student works with the same adviser from first call to departure.\n\nSessions are held in English, Hindi and Marathi.',
    city: 'Pune',
    country: 'IN',
    languages: ['English', 'Hindi', 'Marathi'],
    phone: '+91 00000 00000',
    whatsapp: '+91 00000 00000',
    email: 'hello@example.com',
    hours: 'Monday to Saturday, 10:00 to 18:00',
    timezone: 'Asia/Kolkata',
    address: 'Sample address, Pune',
    map_url: '',
    year_started: 2014,
    response_time: 'We reply to every request within one working day.',
  },
  positioning: {
    headline: 'Study abroad with an adviser whose credentials you can check',
    subheadline:
      'Tell us about your profile, choose a session, and we will map the route from shortlist to departure with you.',
    for_who: [
      'Students planning a bachelor’s or master’s degree abroad',
      'Parents who want to understand the process before committing',
      'Graduates comparing countries and intakes',
    ],
    differentiators: [],
  },
  proof: {
    stats: [
      { label: 'Years advising students', value: '12', source_note: 'Practice started in 2014' },
      { label: 'Countries we advise on', value: '4', source_note: '' },
    ],
    partners: ['Sample University of Technology', 'Northgate College (sample)', 'Riverside Institute (sample)'],
    testimonials: [],
  },
  frontDoor: { cta_label: 'Book a consultation', cta_action: 'consult' },
  knowledge: {
    faqs: [
      {
        q: 'Can you promise admission or a visa?',
        a: 'No. Institutions and government authorities make those decisions. We do not guarantee admission, scholarships or visa outcomes. We help you prepare a complete and accurate application.',
      },
      {
        q: 'What should I prepare before the first call?',
        a: 'Fill in the short profile on this page. Have your latest marks, your English test result if you have one, and a rough yearly budget to hand.',
      },
      {
        q: 'Do I need to upload documents to book?',
        a: 'No. This form collects a profile only. We ask for documents later, once we have agreed how to work together.',
      },
    ],
  },
  offers: { tiers: [] },
  agents: {},
  template_data: {
    practice: {
      type: 'education_and_migration',
      authorisation_statement:
        'Sample text: immigration advice is given only by Anita Rao, who holds the licence listed above. Replace this with your own authorisation details.',
    },
    credentials: [
      { kind: 'licence', issuing_body: 'Sample Immigration Advisers Council', number: 'SAMPLE-000000', country: 'CA', valid_until: '2027-03-31', verify_url: '' },
      { kind: 'membership', issuing_body: 'Sample Association of Education Counsellors', number: 'SAMPLE-EC-0000', country: 'IN', valid_until: '', verify_url: '' },
    ],
    destinations: [
      {
        country_code: 'CA',
        headline: 'Diplomas and degrees with structured co-op options',
        intakes: [
          { name: 'Fall', month: 'September', apply_by: 'Early in the same year' },
          { name: 'Winter', month: 'January', apply_by: 'Around the previous September' },
        ],
        popular_courses: ['Business analytics', 'Computer science', 'Nursing', 'Hospitality management'],
        eligibility_summary: 'Sample text. Requirements vary by institution and programme, so we check them for the courses on your shortlist.',
        cost_estimate: { currency: 'CAD', tuition_min: 18000, tuition_max: 35000, living_min: 15000, living_max: 22000, note: 'Sample figures per year.' },
        scholarships: ['Institution merit awards (varies by college)'],
        visa_summary: 'Sample text. Study permit rules and processing times change often. We confirm the current requirements with you before you apply.',
        post_study_pathway: 'Sample text. Post-study work options depend on the programme and current rules.',
        partner_institutions: ['Northgate College (sample)'],
        last_verified: '2026-08-20',
        extras: [{ label: 'Typical response time from institutions', value: 'Sample: 4 to 8 weeks' }],
      },
      {
        country_code: 'AU',
        headline: 'Research-led universities and vocational pathways',
        intakes: [
          { name: 'Semester 1', month: 'February', apply_by: 'Around the previous October' },
          { name: 'Semester 2', month: 'July', apply_by: 'Around the previous April' },
        ],
        popular_courses: ['Engineering', 'Information technology', 'Health sciences'],
        eligibility_summary: 'Sample text. English test scores and academic requirements depend on the course.',
        cost_estimate: { currency: 'AUD', tuition_min: 22000, tuition_max: 45000, living_min: 24000, living_max: 30000, note: 'Sample figures per year.' },
        scholarships: [],
        visa_summary: 'Sample text. Confirm current rules before applying.',
        post_study_pathway: '',
        partner_institutions: ['Sample University of Technology'],
        last_verified: '2026-08-20',
        extras: [],
      },
      {
        country_code: 'GB',
        headline: 'One-year master’s degrees and three-year bachelor’s degrees',
        intakes: [{ name: 'September', month: 'September', apply_by: 'Applications open the previous autumn' }],
        popular_courses: ['Management', 'Data science', 'Law', 'Design'],
        eligibility_summary: 'Sample text.',
        cost_estimate: { currency: 'GBP', tuition_min: 14000, tuition_max: 30000, living_min: 12000, living_max: 18000, note: 'Sample figures per year.' },
        scholarships: ['Chevening-style government awards (check current availability)'],
        visa_summary: 'Sample text.',
        post_study_pathway: '',
        partner_institutions: [],
        last_verified: '2026-09-01',
        extras: [],
      },
      {
        // Deliberately older than six months, to show the "confirm with us" notice.
        country_code: 'DE',
        headline: 'Low or no tuition at public universities, with language requirements',
        intakes: [
          { name: 'Winter semester', month: 'October', apply_by: 'Often mid-year' },
          { name: 'Summer semester', month: 'April', apply_by: 'Often in the winter before' },
        ],
        popular_courses: ['Mechanical engineering', 'Computer science'],
        eligibility_summary: 'Sample text.',
        cost_estimate: { currency: 'EUR', tuition_min: 0, tuition_max: 3000, living_min: 11000, living_max: 14000, note: 'Sample figures per year.' },
        scholarships: [],
        visa_summary: 'Sample text.',
        post_study_pathway: '',
        partner_institutions: [],
        last_verified: '2026-01-10',
        extras: [],
      },
      {
        country_code: 'US',
        headline: 'A wide range of degrees and campus styles',
        intakes: [
          { name: 'Fall', month: 'August', apply_by: 'Often the previous autumn' },
          { name: 'Spring', month: 'January', apply_by: 'Often the previous summer' },
        ],
        popular_courses: ['Computer science', 'Business', 'Public health'],
        eligibility_summary: 'Sample text. Requirements differ widely between institutions.',
        cost_estimate: { currency: 'USD', tuition_min: 20000, tuition_max: 55000, living_min: 14000, living_max: 20000, note: 'Sample figures per year.' },
        scholarships: ['Institution merit awards (vary by university)'],
        visa_summary: 'Sample text. Confirm current requirements before applying.',
        post_study_pathway: 'Sample text. Work options depend on the programme and current rules.',
        partner_institutions: [],
        last_verified: '2026-09-02',
        extras: [],
      },
      {
        country_code: 'IE',
        headline: 'English-speaking, compact and close to Europe',
        intakes: [
          { name: 'September', month: 'September', apply_by: 'Applications open the previous autumn' },
          { name: 'January', month: 'January', apply_by: 'Often the previous September' },
        ],
        popular_courses: ['Data analytics', 'Finance', 'Pharmacology'],
        eligibility_summary: 'Sample text.',
        cost_estimate: { currency: 'EUR', tuition_min: 12000, tuition_max: 30000, living_min: 10000, living_max: 14000, note: 'Sample figures per year.' },
        scholarships: [],
        visa_summary: 'Sample text.',
        post_study_pathway: '',
        partner_institutions: [],
        last_verified: '2026-08-25',
        extras: [],
      },
      {
        country_code: 'NZ',
        headline: 'Practical, supportive study environments',
        intakes: [
          { name: 'Semester 1', month: 'February', apply_by: 'Around the previous October' },
          { name: 'Semester 2', month: 'July', apply_by: 'Around the previous April' },
        ],
        popular_courses: ['Agriculture and environment', 'Tourism management', 'Nursing'],
        eligibility_summary: 'Sample text.',
        cost_estimate: { currency: 'NZD', tuition_min: 22000, tuition_max: 38000, living_min: 18000, living_max: 22000, note: 'Sample figures per year.' },
        scholarships: [],
        visa_summary: 'Sample text.',
        post_study_pathway: '',
        partner_institutions: [],
        last_verified: '2026-08-28',
        extras: [],
      },
    ],
    services: [
      { ...serviceFromCatalog('counselling'), included: ['One-to-one conversation', 'Written summary of options'], extras: [] },
      serviceFromCatalog('shortlist'),
      serviceFromCatalog('applications'),
      serviceFromCatalog('sop_lor'),
      serviceFromCatalog('visa_docs'),
      serviceFromCatalog('pre_departure'),
    ],
    consultation_types: [
      { key: 'discovery', title: 'Discovery call', duration_min: 15, modes: ['phone', 'video'], fee: null, payment_url: '', payment_note: '', booking_url: '', requires_prescreen: true },
      { key: 'assessment', title: 'Profile assessment', duration_min: 45, modes: ['video', 'office'], fee: { amount: 1500, currency: 'INR' }, payment_url: '', payment_note: 'Sample fee.', booking_url: '', requires_prescreen: true },
      { key: 'parents', title: 'Parents session', duration_min: 30, modes: ['video', 'office'], fee: null, payment_url: '', payment_note: '', booking_url: '', requires_prescreen: true },
    ],
    success_stories: [
      {
        first_name: 'Sample student A',
        destination: 'CA',
        course: 'Business analytics (postgraduate diploma)',
        university: 'Northgate College (sample)',
        intake_year: 2025,
        scholarship: '',
        outcome: 'Received an offer and started in the Fall intake.',
        quote: 'The shortlist compared costs and intakes side by side, so my parents and I could decide together.',
        photo_url: '',
        consent_confirmed: true,
        consent_date: '2026-06-02',
        consent_scope: ['outcome'],
        extras: [],
      },
      {
        first_name: 'Sample student B',
        destination: 'AU',
        course: 'Information technology',
        university: 'Sample University of Technology',
        intake_year: 2026,
        scholarship: 'Partial tuition award',
        outcome: 'Received an offer with a partial tuition award.',
        quote: 'I knew what documents to prepare before the first call, which saved weeks.',
        photo_url: '',
        consent_confirmed: true,
        consent_date: '2026-07-11',
        consent_scope: ['name', 'outcome'],
        extras: [],
      },
      {
        // No recorded permission: this story must not render.
        first_name: 'Sample student C',
        destination: 'GB',
        course: 'Data science',
        university: '',
        intake_year: 2026,
        scholarship: '',
        outcome: '',
        quote: 'This story has no recorded permission and stays hidden.',
        photo_url: '',
        consent_confirmed: false,
        consent_date: '',
        consent_scope: [],
        extras: [],
      },
    ],
    resources: [
      { type: 'document_guide', title: 'What to gather before your first consultation', url: '', body: 'Latest mark sheets, your English test result if you have one, a rough yearly budget, and a list of countries you are considering. Sample text.', last_verified: '2026-08-20' },
      { type: 'webinar', title: 'Parents’ evening: understanding the process (sample)', url: 'https://example.com/webinar', body: '', last_verified: '2026-08-20' },
    ],
    policies: {
      version: 'sample-2026-09',
      privacy: { url: '', body: 'Sample text. We use the details you send only to respond to your request and to advise you. We do not share them with institutions or partners without your permission. Replace this with your own privacy policy.' },
      refund: { url: '', body: 'Sample text. Replace with your fee-refund policy.' },
      cancellation: { url: '', body: 'Sample text. Replace with your cancellation and rescheduling policy.' },
      retention: { url: '', body: 'Sample text. Replace with how long you keep client information.' },
      grievance: { name: 'Anita Rao', email: 'grievance@example.com', phone: '' },
    },
    prescreen: {
      fields: { date_of_birth: { enabled: false } },
      custom_fields: [
        { key: 'x_referral_source', label: 'How did you hear about us?', type: 'select', options: ['Friend or family', 'Search', 'Social media', 'Event or webinar', 'Other'], required: false },
        { key: 'x_parent_attending', label: 'A parent or guardian will join the session', type: 'checkbox', required: false },
        { key: 'x_canada_program', label: 'Which programme in Canada interests you?', type: 'text', required: false, show_when: { field: 'target_countries', includes: 'CA' } },
      ],
    },
    integrations: { booking_url: '', webhook_url: '', notify_email: '' },
  },
};