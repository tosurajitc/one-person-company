// frontend/lib/study-migration-api.js
// Fetch wrapper for study-abroad consultation requests.
//
// Demo mode (used by /templates/study-abroad-consultant) NEVER calls the backend.
// Public route:  POST /api/study-consult/submit
// Owner routes:  GET /api/study-consult/mine, GET/PATCH /api/study-consult/{id}

const BASE = '/api/study-consult';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* storage unavailable: rely on the token cookie */
  }
  return headers;
}

function messageFrom(data, fallback) {
  const d = data?.detail;
  if (typeof d === 'string') return d;
  if (d && typeof d.message === 'string') return d.message;
  return fallback;
}

/** Build the body the server expects. `website` is the honeypot: it must stay empty. */
export function buildSubmitBody({ siteSlug, typeKey, mode, preferred, timezone, profile, custom, policyVersion, honeypot }) {
  return {
    site_slug: siteSlug,
    consultation_type: typeKey,
    mode: mode || null,
    preferred_window: preferred && (preferred.date || preferred.part_of_day) ? preferred : null,
    timezone: timezone || null,
    profile: profile || {},
    custom: custom || {},
    consent: { accepted: true, policy_version: policyVersion || '' },
    website: honeypot || '',
  };
}

/**
 * @returns {Promise<{ok: true, ref: string, demo?: boolean} | {ok: false, status?: number, message: string, fieldErrors?: Record<string,string>}>}
 */
export async function submitConsultRequest({ body, demo = false }) {
  if (demo) {
    await sleep(600);
    return { ok: true, demo: true, ref: 'DEMO-0000' };
  }
  try {
    const res = await fetch(`${BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON error body */
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: messageFrom(data, 'We could not send your request. Please try again, or contact us directly using the details on this page.'),
        fieldErrors: data?.detail?.field_errors,
      };
    }
    return { ok: true, ref: data?.ref || '' };
  } catch {
    return { ok: false, message: 'We could not reach the server. Check your connection and try again.' };
  }
}

/* ---------------------------- owner side ---------------------------- */

async function ownerFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new Error(messageFrom(data, `Request failed (${res.status}).`));
  return data;
}

export function listConsultRequests({ status, limit = 50, offset = 0, demo = false } = {}) {
  if (demo) return Promise.resolve({ items: [], total: 0 });
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status) q.set('status', status);
  return ownerFetch(`/mine?${q.toString()}`);
}

export function getConsultRequest(id, { demo = false } = {}) {
  if (demo) return Promise.resolve(null);
  return ownerFetch(`/${encodeURIComponent(id)}`);
}

export function updateConsultRequest(id, patch, { demo = false } = {}) {
  if (demo) return Promise.resolve({ ...patch, id });
  return ownerFetch(`/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export const CONSULT_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'consultation_booked', label: 'Consultation booked' },
  { value: 'closed', label: 'Closed' },
];
