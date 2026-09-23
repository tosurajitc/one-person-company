// frontend/lib/travel-api.js
// One interface, two implementations:
//   createRemoteTravelApi() → talks to FastAPI (/api/public-travel/*, /api/my-site/travel/*)
//   createLocalTravelApi(seed) → in-memory store for /templates/travel-host demo and previews
import { BLANK_TRAVEL_SETTINGS, depositPerTraveller, priceFor, seatsLeft, uid } from './travel-schema';

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch (_) { /* storage unavailable */ }
  return headers;
}

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    credentials: 'include', // sends the `token` cookie too
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* empty body */ }
  if (!res.ok) {
    const message = data?.detail
      ? (typeof data.detail === 'string' ? data.detail : data.detail.map?.((d) => d.msg).join(', '))
      : `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function createRemoteTravelApi() {
  return {
    mode: 'remote',
    // Public
    getPublicTravel: (siteSlug) => request('GET', `/api/public-travel/${encodeURIComponent(siteSlug)}`),
    requestBooking: (siteSlug, body) => request('POST', `/api/public-travel/${encodeURIComponent(siteSlug)}/bookings`, body),
    // Owner (logged-in founder)
    listPackages: () => request('GET', '/api/my-site/travel/packages'),
    savePackage: (pkg) => (pkg.serverId
      ? request('PUT', `/api/my-site/travel/packages/${pkg.serverId}`, pkg)
      : request('POST', '/api/my-site/travel/packages', pkg)),
    deletePackage: (pkg) => request('DELETE', `/api/my-site/travel/packages/${pkg.serverId}`),
    getSettings: () => request('GET', '/api/my-site/travel/settings'),
    saveSettings: (settings) => request('PUT', '/api/my-site/travel/settings', settings),
    listBookings: () => request('GET', '/api/my-site/travel/bookings'),
    updateBooking: (id, patch) => request('PATCH', `/api/my-site/travel/bookings/${id}`, patch),
    // General trip question → existing AI Sales Desk inbox (enquiry_routes.py).
    // Align field names with your POST /api/enquiries schema if they differ.
    sendEnquiry: (siteSlug, body) => request('POST', '/api/enquiries', { site_slug: siteSlug, source: 'travel-host', ...body }),
    subscribe: () => () => {},
  };
}

// In-memory implementation. Mirrors the backend rules so the demo behaves like production.
export function createLocalTravelApi(seed = {}) {
  let state = {
    packages: JSON.parse(JSON.stringify(seed.packages || [])),
    settings: { ...BLANK_TRAVEL_SETTINGS, ...(seed.settings || {}) },
    bookings: JSON.parse(JSON.stringify(seed.bookings || [])),
  };
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn(snapshot()));
  const snapshot = () => JSON.parse(JSON.stringify(state));
  const ok = (v) => Promise.resolve(JSON.parse(JSON.stringify(v)));

  return {
    mode: 'local',
    snapshot,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    getPublicTravel: () => ok({
      settings: state.settings,
      packages: state.packages.filter((p) => p.status === 'published'),
    }),

    requestBooking(_slug, body) {
      const pkg = state.packages.find((p) => p.id === body.packageId);
      const dep = pkg?.departures.find((d) => d.id === body.departureId);
      if (!pkg || !dep) return Promise.reject(new Error('This departure is no longer available.'));
      if (!state.settings.bookingEnabled || !pkg.bookingEnabled || !dep.bookingEnabled || dep.status !== 'open') {
        return Promise.reject(new Error('Online booking is closed for this departure. Send an enquiry instead.'));
      }
      const travellers = Math.max(1, Number(body.travellers) || 1);
      if (seatsLeft(dep) < travellers) {
        return Promise.reject(new Error(`Only ${seatsLeft(dep)} seat(s) left on this date.`));
      }
      const perPerson = priceFor(pkg, dep, body.sharing);
      const booking = {
        id: uid('bk'),
        packageId: pkg.id,
        packageTitle: pkg.title,
        departureId: dep.id,
        startDate: dep.startDate,
        name: body.name, phone: body.phone, email: body.email,
        travellers, sharing: body.sharing, notes: body.notes || '',
        perPersonPrice: perPerson,
        totalAmount: perPerson * travellers,
        depositAmount: (depositPerTraveller(pkg, perPerson, state.settings) || 0) * travellers,
        status: 'requested',
        createdAt: new Date().toISOString(),
      };
      dep.seatsHeld = (dep.seatsHeld || 0) + travellers;
      state.bookings.unshift(booking);
      emit();
      return ok({ booking, paymentRequired: false });
    },

    listPackages: () => ok(state.packages),
    savePackage(pkg) {
      const i = state.packages.findIndex((p) => p.id === pkg.id);
      if (i >= 0) state.packages[i] = JSON.parse(JSON.stringify(pkg));
      else state.packages.push(JSON.parse(JSON.stringify(pkg)));
      emit();
      return ok(pkg);
    },
    deletePackage(pkg) {
      const hasBookings = state.bookings.some((b) => b.packageId === pkg.id && b.status !== 'cancelled');
      if (hasBookings) {
        // Same rule as the backend: never delete a package with live bookings — archive it.
        const p = state.packages.find((x) => x.id === pkg.id);
        if (p) p.status = 'archived';
        emit();
        return ok({ archived: true });
      }
      state.packages = state.packages.filter((p) => p.id !== pkg.id);
      emit();
      return ok({ deleted: true });
    },
    getSettings: () => ok(state.settings),
    saveSettings(settings) { state.settings = { ...state.settings, ...settings }; emit(); return ok(state.settings); },
    listBookings: () => ok(state.bookings),
    sendEnquiry(_slug, body) {
      state.enquiries = [{ id: uid('enq'), ...body, createdAt: new Date().toISOString() }, ...(state.enquiries || [])];
      emit();
      return ok({ received: true });
    },
    updateBooking(id, patch) {
      const b = state.bookings.find((x) => x.id === id);
      if (!b) return Promise.reject(new Error('Booking not found.'));
      const pkg = state.packages.find((p) => p.id === b.packageId);
      const dep = pkg?.departures.find((d) => d.id === b.departureId);
      const from = b.status; const to = patch.status || from;
      if (dep && from !== to) {
        const holding = (s) => s === 'requested';
        const booked = (s) => s === 'deposit_paid' || s === 'confirmed';
        if (holding(from)) dep.seatsHeld = Math.max(0, (dep.seatsHeld || 0) - b.travellers);
        if (booked(from)) dep.seatsBooked = Math.max(0, (dep.seatsBooked || 0) - b.travellers);
        if (holding(to)) dep.seatsHeld = (dep.seatsHeld || 0) + b.travellers;
        if (booked(to)) dep.seatsBooked = (dep.seatsBooked || 0) + b.travellers;
      }
      Object.assign(b, patch);
      emit();
      return ok(b);
    },
  };
}