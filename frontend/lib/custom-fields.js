// frontend/lib/custom-fields.js
// Layer 3 of the template data model: business-specific fields a consultant adds
// on top of the generic core and the template's typed fields.
//
// Two kinds:
//   1. custom form questions  -> prescreen.custom_fields[]   (asked to the visitor)
//   2. extras                 -> extras[] on destinations, services, stories
//                                (label/value pairs shown as a details list)
//
// Mirrored on the server in backend/app/services/study_abroad_rules.py.
// Keep the two in sync when changing limits, types or the blocklist.

export const MAX_CUSTOM_FIELDS = 12;
export const MAX_EXTRAS = 8;
export const MAX_OPTIONS = 20;

export const CUSTOM_FIELD_TYPES = [
  'text',
  'long_text',
  'number',
  'select',
  'multi_select',
  'date',
  'checkbox',
  'url',
];

const FREE_ENTRY_TYPES = ['text', 'long_text', 'number'];
const KEY_RE = /^x_[a-z0-9_]{1,40}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// V1 has no secure document or identity storage, so free-entry questions that
// ask for these are refused. A yes/no checkbox such as "I hold a valid passport"
// is fine because it collects no identifying number.
export const BLOCKED_LABEL_PATTERNS = [
  /passport/i,
  /national\s*id/i,
  /aadh?aa?r/i,
  /\bpan\b/i,
  /\bssn\b/i,
  /social\s*security/i,
  /bank\s*(account|details|statement)/i,
  /account\s*number/i,
  /card\s*number/i,
  /credit\s*card/i,
  /debit\s*card/i,
  /\bcvv\b/i,
  /\biban\b/i,
  /\bpassword\b/i,
  /\botp\b/i,
  /driving\s*licen[cs]e/i,
  /tax\s*(id|number)/i,
];

export function isBlockedLabel(label) {
  return BLOCKED_LABEL_PATTERNS.some((re) => re.test(String(label || '')));
}

export function keyFromLabel(label) {
  const base = String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return `x_${base || 'field'}`;
}

export function optionList(def) {
  return (def?.options || []).map((o) =>
    typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value }
  );
}

/**
 * Validate the consultant's custom question definitions.
 * @returns {{ok: boolean, errors: {index: number, message: string}[]}}
 */
export function validateCustomFieldDefs(defs, { reservedKeys = [] } = {}) {
  const errors = [];
  if (defs == null) return { ok: true, errors };
  if (!Array.isArray(defs)) return { ok: false, errors: [{ index: -1, message: 'Custom fields must be a list.' }] };
  if (defs.length > MAX_CUSTOM_FIELDS) {
    errors.push({ index: -1, message: `Use at most ${MAX_CUSTOM_FIELDS} custom questions.` });
  }
  const seen = new Set();
  defs.forEach((d, i) => {
    const add = (message) => errors.push({ index: i, message });
    if (!d || typeof d !== 'object') return add('Invalid question.');
    if (!KEY_RE.test(d.key || '')) add('Key must start with x_ and use lowercase letters, numbers and underscores.');
    else if (seen.has(d.key)) add('Key is used twice.');
    else if (reservedKeys.includes(d.key)) add('Key clashes with a built-in field.');
    seen.add(d.key);
    const label = String(d.label || '').trim();
    if (!label) add('Question text is required.');
    if (label.length > 120) add('Question text is too long (120 characters maximum).');
    if (!CUSTOM_FIELD_TYPES.includes(d.type)) add('Unsupported answer type.');
    if (FREE_ENTRY_TYPES.includes(d.type) && isBlockedLabel(label)) {
      add('This question asks for identity or payment details. Collect those later through a secure channel, not this form.');
    }
    if (d.type === 'select' || d.type === 'multi_select') {
      const opts = d.options || [];
      if (!Array.isArray(opts) || opts.length < 2 || opts.length > MAX_OPTIONS) {
        add(`Provide between 2 and ${MAX_OPTIONS} options.`);
      } else if (opts.some((o) => typeof o !== 'string' || !o.trim() || o.length > 80)) {
        add('Each option must be text of 80 characters or fewer.');
      }
    }
    if (d.show_when != null) {
      const sw = d.show_when;
      const ok = sw && typeof sw.field === 'string' && (('equals' in sw) !== ('includes' in sw));
      if (!ok) add('show_when needs a field and either equals or includes.');
    }
  });
  return { ok: errors.length === 0, errors };
}

/** Whether a custom question should be shown, given the current answers. */
export function isVisible(def, ctx = {}) {
  const sw = def?.show_when;
  if (!sw) return true;
  const v = ctx[sw.field];
  if ('includes' in sw) return Array.isArray(v) ? v.includes(sw.includes) : v === sw.includes;
  if ('equals' in sw) return v === sw.equals || (v != null && String(v) === String(sw.equals));
  return true;
}

function isEmpty(v) {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

/**
 * Validate the visitor's answers to the custom questions.
 * Hidden questions (show_when) are skipped and dropped from `clean`.
 * @returns {{ok: boolean, errors: Record<string,string>, clean: Record<string, any>}}
 */
export function validateCustomAnswers(defs, answers, ctx = {}) {
  const errors = {};
  const clean = {};
  const a = answers || {};
  const context = { ...ctx, ...a };
  (defs || []).forEach((d) => {
    if (!isVisible(d, context)) return;
    const v = a[d.key];
    if (isEmpty(v) || (d.type === 'checkbox' && v === false)) {
      if (d.required) errors[d.key] = d.type === 'checkbox' ? 'Please tick this box to continue.' : 'This answer is required.';
      return;
    }
    switch (d.type) {
      case 'text':
        if (typeof v !== 'string' || v.length > 200) return void (errors[d.key] = 'Use 200 characters or fewer.');
        clean[d.key] = v.trim();
        break;
      case 'long_text':
        if (typeof v !== 'string' || v.length > 2000) return void (errors[d.key] = 'Use 2000 characters or fewer.');
        clean[d.key] = v.trim();
        break;
      case 'number':
        if (typeof v !== 'number' || !Number.isFinite(v)) return void (errors[d.key] = 'Enter a number.');
        clean[d.key] = v;
        break;
      case 'select':
        if (!(d.options || []).includes(v)) return void (errors[d.key] = 'Choose one of the options.');
        clean[d.key] = v;
        break;
      case 'multi_select':
        if (!Array.isArray(v) || v.some((x) => !(d.options || []).includes(x))) {
          return void (errors[d.key] = 'Choose from the listed options.');
        }
        clean[d.key] = v;
        break;
      case 'date':
        if (typeof v !== 'string' || !DATE_RE.test(v) || Number.isNaN(Date.parse(v))) {
          return void (errors[d.key] = 'Enter a valid date.');
        }
        clean[d.key] = v;
        break;
      case 'checkbox':
        clean[d.key] = v === true;
        break;
      case 'url':
        try {
          const u = new URL(String(v));
          if (!['http:', 'https:'].includes(u.protocol)) throw new Error('protocol');
          clean[d.key] = u.toString();
        } catch {
          errors[d.key] = 'Enter a web address starting with http:// or https://.';
        }
        break;
      default:
        break;
    }
  });
  return { ok: Object.keys(errors).length === 0, errors, clean };
}

/** Clean extras: label/value pairs, trimmed, capped. */
export function normalizeExtras(extras) {
  if (!Array.isArray(extras)) return [];
  return extras
    .filter((e) => e && typeof e.label === 'string' && typeof e.value === 'string')
    .map((e) => ({ label: e.label.trim().slice(0, 80), value: e.value.trim().slice(0, 300) }))
    .filter((e) => e.label && e.value)
    .slice(0, MAX_EXTRAS);
}
