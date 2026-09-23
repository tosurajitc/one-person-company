/**
 * Civil / Architectural Consultation template — API wrapper
 * ---------------------------------------------------------------
 * Demo mode NEVER touches the backend (template gallery previews).
 *
 * What exists today:
 *   submitEnquiry  → POST /api/enquiries (listed in AGENTS.md). Check the request
 *                    body against enquiry_routes.py before going live; adjust
 *                    the field names in toEnquiryBody() if they differ.
 *
 * What does NOT exist yet (planned; see INTEGRATION.md, step 5):
 *   listDeliverables / actOnDeliverable → /api/civil-arch/deliverables/*
 *   These are owner/client-scoped and need auth. In demo mode they resolve locally.
 */

const wait = ms => new Promise(r => setTimeout(r, ms))

function toEnquiryBody(form, siteSlug) {
  return {
    site_slug: siteSlug || null,
    name: form.name,
    email: form.email || null,
    phone: form.phone || null,
    message: form.message || '',
    source: 'civil-architect-consultant',
    meta: {
      intent: form.intent || null,
      project_type: form.projectType || null,
      location: form.location || null,
      stage: form.stage || null,
      answers: form.answers || {},
    },
  }
}

export async function submitEnquiry(form, { demo = false, siteSlug } = {}) {
  if (demo) { await wait(600); return { ok: true, demo: true } }
  const res = await fetch('/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toEnquiryBody(form, siteSlug)),
  })
  if (!res.ok) throw new Error(`Enquiry failed (${res.status})`)
  return { ok: true, demo: false, data: await res.json().catch(() => ({})) }
}

// Client actions: approve | changes | question | acknowledge | download
export async function actOnDeliverable(id, action, note, { demo = false, token } = {}) {
  if (demo) { await wait(250); return { ok: true, demo: true } }
  const res = await fetch(`/api/civil-arch/deliverables/${id}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ action, note: note || null }),
  })
  if (!res.ok) throw new Error(`Action failed (${res.status})`)
  return { ok: true, demo: false }
}
