// frontend/lib/tutor-api.js
// One interface, two implementations:
//   createRemoteTutorApi() → talks to FastAPI (/api/public-tutor/*, /api/my-site/tutor/*)
//   createLocalTutorApi(seed) → in-memory store for /templates/tutor-training demo + previews
import { BLANK_TUTOR_SETTINGS, uid } from './tutor-schema';

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
    credentials: 'include',
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

export function createRemoteTutorApi() {
  return {
    mode: 'remote',
    // Public
    getPublicTutor: (siteSlug) => request('GET', `/api/public-tutor/${encodeURIComponent(siteSlug)}`),
    getAvailability: (siteSlug, subjectId, days = 14) =>
      request('GET', `/api/public-tutor/${encodeURIComponent(siteSlug)}/availability?subjectId=${subjectId}&days=${days}`),
    requestBooking: (siteSlug, body) => request('POST', `/api/public-tutor/${encodeURIComponent(siteSlug)}/bookings`, body),
    // Owner (logged-in teacher)
    listSubjects: () => request('GET', '/api/my-site/tutor/subjects'),
    saveSubject: (s) => (s.serverId
      ? request('PUT', `/api/my-site/tutor/subjects/${s.serverId}`, s)
      : request('POST', '/api/my-site/tutor/subjects', s)),
    deleteSubject: (s) => request('DELETE', `/api/my-site/tutor/subjects/${s.serverId}`),
    listVideos: () => request('GET', '/api/my-site/tutor/videos'),
    addVideo: (v) => request('POST', '/api/my-site/tutor/videos', v),
    deleteVideo: (v) => request('DELETE', `/api/my-site/tutor/videos/${v.serverId}`),
    listAvailability: () => request('GET', '/api/my-site/tutor/availability'),
    saveAvailability: (windows) => request('PUT', '/api/my-site/tutor/availability', { windows }),
    getSettings: () => request('GET', '/api/my-site/tutor/settings'),
    saveSettings: (settings) => request('PUT', '/api/my-site/tutor/settings', settings),
    listBookings: () => request('GET', '/api/my-site/tutor/bookings'),
    updateBooking: (id, patch) => request('PATCH', `/api/my-site/tutor/bookings/${id}`, patch),
    // General question → existing AI Sales Desk inbox (enquiry_routes.py)
    sendEnquiry: (siteSlug, body) => request('POST', '/api/enquiries', { site_slug: siteSlug, source: 'tutor-training', ...body }),
    subscribe: () => () => {},
  };
}

// In-memory implementation for the /templates/tutor-training demo page.
export function createLocalTutorApi(seed = {}) {
  let state = {
    subjects: JSON.parse(JSON.stringify(seed.subjects || [])),
    videos: JSON.parse(JSON.stringify(seed.videos || [])),
    availability: JSON.parse(JSON.stringify(seed.availability || [])),
    settings: { ...BLANK_TUTOR_SETTINGS, ...(seed.settings || {}) },
    bookings: JSON.parse(JSON.stringify(seed.bookings || [])),
  };
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn(snapshot()));
  const snapshot = () => JSON.parse(JSON.stringify(state));
  const ok = (v) => Promise.resolve(JSON.parse(JSON.stringify(v)));

  function toMinutes(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
  function fromMinutes(mins) { const h = Math.floor(mins / 60) % 24; const m = mins % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }

  function slotsForDate(dateStr, durationMinutes) {
    const weekday = (new Date(dateStr + 'T00:00:00').getDay() + 6) % 7; // Mon=0
    const windows = state.availability.filter((w) => w.weekday === weekday && w.isActive);
    const occupied = state.bookings
      .filter((b) => b.classDate === dateStr && (b.status === 'confirmed' || b.status === 'requested'))
      .map((b) => [toMinutes(b.startTime) - (state.settings.bufferMinutes || 0), toMinutes(b.endTime) + (state.settings.bufferMinutes || 0)]);
    const slots = [];
    windows.forEach((w) => {
      let cursor = toMinutes(w.startTime);
      const end = toMinutes(w.endTime);
      while (cursor + durationMinutes <= end) {
        const slotEnd = cursor + durationMinutes;
        const blocked = occupied.some(([oStart, oEnd]) => cursor < oEnd && oStart < slotEnd);
        if (!blocked) slots.push({ startTime: fromMinutes(cursor), endTime: fromMinutes(slotEnd) });
        cursor = slotEnd;
      }
    });
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return {
    mode: 'local',
    snapshot,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    getPublicTutor: () => ok({
      settings: state.settings,
      subjects: state.subjects.filter((s) => s.status === 'published'),
      videos: state.videos,
    }),

    getAvailability(_slug, subjectId, days = 14) {
      const subject = state.subjects.find((s) => s.id === subjectId);
      if (!subject) return Promise.reject(new Error('Class not found.'));
      const out = [];
      const today = new Date();
      for (let i = 0; i < days; i += 1) {
        const d = new Date(today); d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const slots = slotsForDate(dateStr, subject.durationMinutes);
        if (slots.length) out.push({ date: dateStr, slots });
      }
      return ok({ days: out });
    },

    requestBooking(_slug, body) {
      const subject = state.subjects.find((s) => s.id === body.subjectId);
      if (!subject) return Promise.reject(new Error('Class not found.'));
      const slots = slotsForDate(body.classDate, subject.durationMinutes);
      const match = slots.find((s) => s.startTime === body.startTime);
      if (!match) return Promise.reject(new Error('That time was just taken. Please pick another slot.'));
      const price = body.isTrial ? (subject.trialPrice || 0) : (subject.price || 0);
      const booking = {
        id: uid('bk'), subjectId: subject.id, subjectTitle: subject.title,
        studentName: body.studentName, phone: body.phone, email: body.email, notes: body.notes || '',
        classDate: body.classDate, startTime: match.startTime, endTime: match.endTime,
        isTrial: !!body.isTrial, price,
        status: 'requested', meetLink: null,
        createdAt: new Date().toISOString(),
      };
      state.bookings.unshift(booking);
      emit();
      return ok({ booking, payment: null });
    },

    listSubjects: () => ok(state.subjects),
    saveSubject(s) {
      const i = state.subjects.findIndex((x) => x.id === s.id);
      if (i >= 0) state.subjects[i] = JSON.parse(JSON.stringify(s));
      else state.subjects.push(JSON.parse(JSON.stringify({ ...s, id: s.id || uid('subj') })));
      emit();
      return ok(s);
    },
    deleteSubject(s) {
      const hasBookings = state.bookings.some((b) => b.subjectId === s.id && b.status !== 'cancelled');
      if (hasBookings) {
        const found = state.subjects.find((x) => x.id === s.id);
        if (found) found.status = 'archived';
        emit();
        return ok({ archived: true });
      }
      state.subjects = state.subjects.filter((x) => x.id !== s.id);
      emit();
      return ok({ deleted: true });
    },
    listVideos: () => ok(state.videos),
    addVideo(v) { const withId = { ...v, id: uid('vid') }; state.videos.push(withId); emit(); return ok(withId); },
    deleteVideo(v) { state.videos = state.videos.filter((x) => x.id !== v.id); emit(); return ok({ deleted: true }); },
    listAvailability: () => ok(state.availability),
    saveAvailability(windows) { state.availability = JSON.parse(JSON.stringify(windows)); emit(); return ok(state.availability); },
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
      Object.assign(b, patch);
      emit();
      return ok(b);
    },
  };
}
