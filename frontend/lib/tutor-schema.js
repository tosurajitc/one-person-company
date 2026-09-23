// frontend/lib/tutor-schema.js
// Shared shape + small pure helpers for the tutor-training template.
// Mirrors the conventions in travel-schema.js so travel-api.js-style dual
// (remote/local) API modules and admin editors can be written the same way.

export const CATEGORY_META = {
  academic:         { label: 'Academic Tutoring',   icon: 'BookOpen',    color: '#3B6B4E' },
  music:            { label: 'Music',                icon: 'Music',       color: '#B8862B' },
  art_design:       { label: 'Art & Design',          icon: 'Palette',     color: '#A3503B' },
  dance:            { label: 'Dance',                 icon: 'Sparkles',    color: '#8A4E8C' },
  languages:        { label: 'Languages',             icon: 'Languages',   color: '#2C6E8E' },
  coding_tech:      { label: 'Coding & Tech',         icon: 'Code2',       color: '#3D5A80' },
  test_prep:        { label: 'Test Prep',             icon: 'GraduationCap', color: '#6B5B3E' },
  fitness_wellness: { label: 'Fitness & Wellness',    icon: 'HeartPulse',  color: '#4E7D5C' },
  other:            { label: 'Other Skills',          icon: 'Star',        color: '#5C5C52' },
};

export const FORMAT_META = {
  one_on_one:  { label: '1-on-1', hint: 'Personal, fully tailored' },
  small_group: { label: 'Small group', hint: 'A handful of students together' },
  workshop:    { label: 'Workshop', hint: 'A one-off masterclass or session' },
};

export const LEVEL_META = {
  beginner:     { label: 'Beginner' },
  intermediate: { label: 'Intermediate' },
  advanced:     { label: 'Advanced' },
  all_levels:   { label: 'All levels' },
};

export const AGE_GROUP_META = {
  kids:   { label: 'Kids (5–12)' },
  teens:  { label: 'Teens (13–17)' },
  adults: { label: 'Adults' },
};

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_LABELS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const BLANK_TUTOR_SETTINGS = {
  meetPlatform: 'google_meet',
  defaultMeetLink: '',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  bookingEnabled: true,
  holdMinutes: 20,
  bufferMinutes: 10,
  advanceBookingDays: 21,
  minNoticeHours: 6,
  responseTimePromise: 'Within a few hours',
  cancellationPolicy: 'Free to reschedule up to 12 hours before class. Trial classes cannot be rescheduled more than once.',
};

let seq = 0;
export function uid(prefix = 'id') {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}`;
}

export function formatMoney(v, currency = 'INR') {
  if (v == null) return null;
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
  return `${symbol}${Number(v).toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN')}`;
}

// A single line summarising a subject's price for a card: "₹1,200 / class · Trial ₹0"
export function priceLine(subject, currency = 'INR') {
  const parts = [];
  if (subject.price != null) parts.push(`${formatMoney(subject.price, currency)} / class`);
  else parts.push('Price on enquiry');
  if (subject.trialAvailable) {
    parts.push(subject.trialPrice ? `Trial ${formatMoney(subject.trialPrice, currency)}` : 'Free trial');
  }
  if (subject.packageClasses && subject.packagePrice) {
    parts.push(`${subject.packageClasses}-class pack ${formatMoney(subject.packagePrice, currency)}`);
  }
  return parts.join(' · ');
}

// Minutes between two "HH:MM" strings.
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
export function durationLabel(minutes) {
  if (minutes % 60 === 0) return `${minutes / 60} hr${minutes > 60 ? 's' : ''}`;
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}
export function slotLabel(startTime, endTime) {
  const fmt = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };
  return `${fmt(startTime)} – ${fmt(endTime)}`;
}

// Groups a flat availability window list by weekday for the timetable editor/grid.
export function windowsByWeekday(windows) {
  const byDay = Array.from({ length: 7 }, () => []);
  (windows || []).forEach((w) => {
    if (w.weekday >= 0 && w.weekday <= 6) byDay[w.weekday].push(w);
  });
  byDay.forEach((list) => list.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)));
  return byDay;
}

// Maps setup-wizard `template_data` (from TEMPLATE_CATALOGUE extraFields) plus the core
// wizard payload onto the initial hero/bio content shown before the teacher adds real
// subjects/videos in the dashboard. Real subjects, videos and availability always come
// from their own admin modules, not the wizard.
export function fromWizardPayload(payload) {
  const td = payload?.template_data || {};
  const owner = payload?.business?.owner || {};
  return {
    brandName: payload?.business?.brandName || '',
    tagline: payload?.business?.tagline || '',
    ownerName: owner.name || '',
    ownerPhotoUrl: owner.photoUrl || null,
    teachingSince: td.teaching_since_year || null,
    primarySubjects: td.primary_subjects || [],
    ageGroups: td.age_groups || [],
    formats: td.teaching_formats || [],
    studentsTaught: td.students_taught || null,
    rating: td.rating || null,
    totalReviews: td.total_reviews || null,
    certifications: td.certifications || [],
    languagesTaught: td.languages_taught || '',
    credibility: payload?.positioning?.credibility || '',
    sentence: payload?.positioning?.sentence || '',
    testimonials: payload?.proof?.testimonials || [],
    faqs: payload?.knowledge?.faqs || [],
    invitation: payload?.frontDoor?.invitation || '',
    primaryColor: payload?.brand?.primaryColor || '#24352B',
  };
}
