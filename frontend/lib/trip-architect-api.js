/**
 * Trip Architect — API layer
 * Sibling to lib/travel-api.js — do not edit that file, this is additive.
 *
 * Talks to:
 *  - GET  /api/sites/public/{slug}              (existing, shared across all templates)
 *  - POST /api/trip-architect/requests           (public — the trip brief form)
 *  - GET  /api/trip-architect/requests           (owner — pipeline list)
 *  - PATCH /api/trip-architect/requests/{id}      (owner — status/field updates)
 *  - POST /api/trip-architect/requests/{id}/options   (owner — compared options)
 *  - PUT  /api/trip-architect/requests/{id}/itinerary (owner — day-by-day save)
 *  - GET  /api/trip-architect/share/{token}       (public — traveller-facing itinerary view)
 *
 * next.config.js already rewrites /api/* to the backend, so every call here
 * uses a relative path — no base URL to configure per environment.
 */

import { SAMPLE_PAYLOAD, SAMPLE_ITINERARIES } from './trip-architect-schema'

// ─── Auth + fetch plumbing ─────────────────────────────────────────────────────
// Matches the split described in AGENTS.md: middleware.js reads the `token`
// cookie for route protection; AuthContext.js reads `auth_token` from
// localStorage for in-app calls. We send both — cookie via `credentials:
// 'include'`, header via localStorage — so a request is authenticated
// whichever one is currently in sync.

function getAuthToken() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem('auth_token')
  } catch {
    return null
  }
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function apiFetch(path, { method = 'GET', body, params } = {}) {
  let url = path
  if (params && Object.keys(params).length) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    if (qs) url += (path.includes('?') ? '&' : '?') + qs
  }

  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    throw new ApiError('Network error reaching the server.', 0, null)
  }

  let data = null
  const text = await res.text()
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }

  if (!res.ok) {
    const message = (data && typeof data === 'object' && data.detail) || `Request failed (${res.status})`
    throw new ApiError(message, res.status, data)
  }

  return data
}

// ─── Demo mode ──────────────────────────────────────────────────────────────
// The template gallery (/templates/trip-architect) and any preview link with
// no real founder behind it should never hit the backend for site data, and
// should never actually submit a brief. isDemoSlug() is the single check
// everything below defers to.

export function isDemoSlug(slug) {
  return !slug || slug === 'demo' || slug === 'preview' || slug === 'trip-architect'
}

// ─── Public site data ──────────────────────────────────────────────────────────

/**
 * Fetch a founder's published site payload for the public-facing page.
 * Falls back to SAMPLE_PAYLOAD (marked isDemo: true) for demo slugs, and
 * also falls back on a network/404 failure so a broken backend degrades to
 * a working demo rather than a blank page.
 */
export async function getPublicTripArchitectSite(slug) {
  if (isDemoSlug(slug)) {
    return { ...SAMPLE_PAYLOAD, isDemo: true }
  }
  try {
    const data = await apiFetch(`/api/sites/public/${encodeURIComponent(slug)}`)
    return { ...data, isDemo: false }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) throw err
    // Network or 5xx — degrade to demo data rather than break the page.
    return { ...SAMPLE_PAYLOAD, isDemo: true, fetchError: err.message }
  }
}

// ─── Public: trip brief intake ─────────────────────────────────────────────────

/**
 * Submit a traveller's trip brief. In demo mode this resolves without
 * calling the backend, so the gallery preview's form works without
 * spamming real founders' inboxes.
 */
export async function submitTripBrief(payload, { slug } = {}) {
  if (isDemoSlug(slug)) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { success: true, demo: true }
  }
  return apiFetch('/api/trip-architect/requests', { method: 'POST', body: payload })
}

// ─── Owner: pipeline ────────────────────────────────────────────────────────────

/**
 * List the founder's trip requests, optionally filtered by status.
 * Returns SAMPLE data shaped as a pipeline in demo mode so the admin
 * preview has something to show before any real requests exist.
 */
export async function getFounderTripRequests({ status, page = 1, pageSize = 20 } = {}) {
  return apiFetch('/api/trip-architect/requests', {
    params: { status, page, page_size: pageSize },
  })
}

export async function getTripRequest(id) {
  return apiFetch(`/api/trip-architect/requests/${encodeURIComponent(id)}`)
}

/** Partial update — most commonly a status move on the pipeline board. */
export async function updateTripRequest(id, patch) {
  return apiFetch(`/api/trip-architect/requests/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: patch,
  })
}

// ─── Owner: compared options ───────────────────────────────────────────────────

/**
 * Log a stay/transport/guide/activity option against a request so two or
 * three can be compared instead of forcing a single choice.
 * option: { category, title, provider_contact, price, inclusions[], cancellation_terms, is_recommended }
 */
export async function addTripOption(requestId, option) {
  return apiFetch(`/api/trip-architect/requests/${encodeURIComponent(requestId)}/options`, {
    method: 'POST',
    body: option,
  })
}

export async function updateTripOption(requestId, optionId, patch) {
  return apiFetch(`/api/trip-architect/requests/${encodeURIComponent(requestId)}/options/${encodeURIComponent(optionId)}`, {
    method: 'PATCH',
    body: patch,
  })
}

export async function deleteTripOption(requestId, optionId) {
  return apiFetch(`/api/trip-architect/requests/${encodeURIComponent(requestId)}/options/${encodeURIComponent(optionId)}`, {
    method: 'DELETE',
  })
}

// ─── Owner: itinerary builder ──────────────────────────────────────────────────

/**
 * Save the full day-by-day itinerary for a request in one call.
 * days: [{ day_number, title, sightseeing_order[], travel_time_notes,
 *          rest_time_notes, entry_fees, meal_suggestions,
 *          estimated_food_spend, local_transport_notes, contingency_notes }]
 */
export async function saveTripItinerary(requestId, days) {
  return apiFetch(`/api/trip-architect/requests/${encodeURIComponent(requestId)}/itinerary`, {
    method: 'PUT',
    body: { days },
  })
}

/** Generates (or re-fetches) the shareable link for a confirmed itinerary. */
export async function getItineraryShareLink(requestId) {
  return apiFetch(`/api/trip-architect/requests/${encodeURIComponent(requestId)}/share-link`, {
    method: 'POST',
  })
}

// ─── Public: shared itinerary view ─────────────────────────────────────────────

/**
 * Read-only itinerary view for the traveller, by share token — no auth.
 * Falls back to a sample itinerary in demo mode so the preview page has
 * something to render.
 */
export async function getSharedItinerary(token) {
  if (!token || token === 'demo') {
    return {
      isDemo: true,
      business: SAMPLE_PAYLOAD.business,
      destination: SAMPLE_ITINERARIES[0].destination,
      days: [],
    }
  }
  return apiFetch(`/api/trip-architect/share/${encodeURIComponent(token)}`)
}