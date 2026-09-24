'use client';

// frontend/components/tax-insurance/TaxInsuranceSite.js
// Public site for a tax consultant (CA, GST/tax practitioner, tax advocate) or an insurance adviser
// (agent, POSP, corporate agent, broker). One job: turn a visitor into a consultation request.
// Everything after the request happens offline, so the site never tries to run the engagement.
//
// Look: black and gold. Black hero and services, ivory reading sections, a gold notice band,
// and one split booking card (dark contact panel + ivory form).
//
// Props:
//   payload   site_build_payload (schema 2.0). Omit to render SAMPLE data.
//   siteSlug  the founder site's slug (needed to submit requests). Falls back to payload.site_slug.
//   demo      force demo mode (never calls the backend). Defaults to true when no payload is given.
//
// Rules enforced in code, not just in copy:
//   - the regulator profile (ICAI, Bar Council, IRDAI) switches success stories and claim stats on or off,
//     and this template never shows fees at all
//   - success stories render only with recorded consent, and only the parts the client allowed
//   - policy and escalation links appear only when the owner has filled them in
//   - credentials are the adviser's own declared details with a link to the official register;
//     the site never shows a "verified by us" badge
//   - statutory dates always show when they were last checked

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  SAMPLE_PAYLOAD,
  PRACTICE_TYPES,
  CREDENTIAL_KINDS,
  PRESCREEN_GROUPS,
  GROUP_ORDER,
  ADVISER_PHOTO,
  STALE_AFTER_MONTHS,
  mergeTemplateData,
  getPrescreenFields,
  getDisclaimers,
  rulesFor,
  isTax,
  isStale,
  isVisibleStory,
  formatDate,
  imageCandidates,
} from '@/lib/tax-insurance-schema';
import { validateCustomAnswers, isVisible, optionList } from '@/lib/custom-fields';
import { submitConsultRequest, buildSubmitBody } from '@/lib/study-migration-api';

/* ------------------------------------------------------------------ */
/* Icons (inline, stroke style, matched to a topic by key and title)   */
/* ------------------------------------------------------------------ */

const ICONS = {
  document: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
  chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l4-4 3 3 5-6"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5"/><path d="M12 18h.01"/>',
  scales: '<path d="M12 4v16"/><path d="M6 20h12"/><path d="M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0z"/><path d="M19 7l-3 7a3 3 0 0 0 6 0z"/>',
  building: '<path d="M4 21V5l8-2v18"/><path d="M12 9h8v12"/><path d="M2 21h20"/><path d="M8 9h.01M8 13h.01M8 17h.01M16 13h.01M16 17h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M12 9v4M10 11h4"/>',
  car: '<path d="M4 15v-3l2-5h12l2 5v3"/><path d="M3 15h18v3H3z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/>',
  house: '<path d="M3 11l9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M10 21v-6h4v6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  lifebuoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 13l2 2 4-4"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4 2 4 5"/>',
  plane: '<path d="M21 4L3 11l6 2 2 6z"/><path d="M9 13l12-9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
};

// Most specific first. An owner can also set `icon` on a service to pick one directly.
const ICON_RULES = [
  [/notice|scrutiny|demand|dispute/i, 'alert'],
  [/appeal|litigation|tribunal/i, 'scales'],
  [/gst|indirect/i, 'percent'],
  [/capital|esop|invest|share|mutual/i, 'chart'],
  [/\bnri\b|foreign|overseas|cross-border|abroad/i, 'globe'],
  [/setup|incorporat|company|\bllp\b|\broc\b|startup|registration/i, 'building'],
  [/audit|account|bookkeep|payroll/i, 'calculator'],
  [/return|\bitr\b|income tax|filing|tax plan/i, 'document'],
  [/claim/i, 'lifebuoy'],
  [/review|gap|portfolio/i, 'clipboard'],
  [/marriage|wedding|married/i, 'heart'],
  [/life|term|protect/i, 'shield'],
  [/health|medical|hospital/i, 'heart'],
  [/motor|vehicle|\bcar\b/i, 'car'],
  [/home|house|property|loan/i, 'house'],
  [/travel/i, 'plane'],
  [/parent|senior|family|child|baby/i, 'users'],
  [/business|group|sme|employee|office/i, 'briefcase'],
];

export function iconFor(item) {
  if (item && item.icon && ICONS[item.icon]) return item.icon;
  const hay = `${item?.key || ''} ${item?.title || ''}`;
  const hit = ICON_RULES.find(([re]) => re.test(hay));
  return hit ? hit[1] : 'document';
}

function Icon({ name, className }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.document }} />;
}

/* ------------------------------------------------------------------ */
/* Data mapping                                                        */
/* ------------------------------------------------------------------ */

export function payloadToData(payload) {
  const p = payload || {};
  const td = mergeTemplateData(p.template_data);
  return {
    business: { ...(p.business || {}) },
    positioning: { ...(p.positioning || {}) },
    proof: { stats: [], partners: [], ...(p.proof || {}) },
    frontDoor: { ...(p.frontDoor || {}) },
    knowledge: { faqs: [], ...(p.knowledge || {}) },
    td,
    rules: rulesFor(td),
    tax: isTax(td),
    siteSlug: p.site_slug || p.slug || '',
  };
}

export const SAMPLE = payloadToData(SAMPLE_PAYLOAD);

const DataCtx = createContext({ ...SAMPLE, slug: '', isDemo: true, openBooking: () => {}, prefill: { need: '', note: '', nonce: 0 } });
const useData = () => useContext(DataCtx);

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const PRIMARY_GROUPS = ['contact', 'need'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initials = (name) =>
  String(name || '')
    .replace(/^CA\s+/i, '')
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

const paragraphs = (text) => String(text || '').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
const digits = (s) => String(s || '').replace(/[^\d]/g, '');
const telHref = (s) => `tel:${String(s || '').replace(/[^+\d]/g, '')}`;
const waHref = (s) => {
  const d = digits(s);
  return `https://wa.me/${d.length === 10 ? `91${d}` : d}`;
};
const isEmptyVal = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const kindLabel = (k) => CREDENTIAL_KINDS.find((x) => x.value === k)?.label || k;

// Soft highlight that follows the pointer on the service tiles.
const trackPointer = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export default function TaxInsuranceSite({ payload, siteSlug, demo }) {
  const isDemo = demo ?? !payload;
  const data = useMemo(() => (payload ? payloadToData(payload) : SAMPLE), [payload]);
  const slug = siteSlug || data.siteSlug || '';
  const [prefill, setPrefill] = useState({ need: '', note: '', nonce: 0 });

  const openBooking = useCallback((opts = {}) => {
    setPrefill((p) => ({ need: opts.need || '', note: opts.note || '', nonce: p.nonce + 1 }));
    if (typeof document === 'undefined') return;
    const el = document.getElementById('book');
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, []);

  const ctx = useMemo(() => ({ ...data, slug, isDemo, openBooking, prefill }), [data, slug, isDemo, openBooking, prefill]);

  const { td, knowledge, rules, tax } = data;
  const stories = rules.allowStories ? td.success_stories.filter(isVisibleStory) : [];
  const showNotice = tax && td.notice_help.enabled;
  const showDeadlines = tax && td.deadlines.length > 0;
  const showClaims = !tax && (td.claims_help.steps.length > 0 || td.claims_help.helpline);
  const showLife = !tax && td.life_events.length > 0;
  const hasFaq = (knowledge.faqs || []).some((f) => f && f.q && f.a) || td.resources.length > 0;

  const nav = [
    td.services.length ? { id: 'services', label: 'Services' } : null,
    showNotice ? { id: 'notice', label: 'Notices' } : null,
    showLife ? { id: 'life', label: 'Life events' } : null,
    showDeadlines ? { id: 'deadlines', label: 'Due dates' } : null,
    showClaims ? { id: 'claims', label: 'Claims help' } : null,
    { id: 'credentials', label: 'About' },
    stories.length ? { id: 'stories', label: 'Stories' } : null,
    hasFaq ? { id: 'faq', label: 'Questions' } : null,
  ].filter(Boolean);

  return (
    <DataCtx.Provider value={ctx}>
      <div className="ti-root" id="top">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700;800&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {isDemo && (
          <div className="ti-demo" role="note">
            Sample site. Every name, number and registration here is fictional, and nothing you type is sent anywhere.
            {rules.summary ? ` Compliance profile: ${rules.name}. ${rules.summary}` : ''}
          </div>
        )}
        <TopBar />
        <Header nav={nav} />
        <main>
          <Hero />
          <Journey />
          {td.services.length > 0 && <Services />}
          {showNotice && <NoticeBand />}
          {showLife && <LifeEvents />}
          {showDeadlines && <Deadlines />}
          {showClaims && <Claims />}
          <Credentials />
          {stories.length > 0 && <Stories stories={stories} />}
          {hasFaq && <Faq />}
          <Book />
          <Policies />
        </main>
        <Footer />
      </div>
    </DataCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar, header and hero                                            */
/* ------------------------------------------------------------------ */

function TopBar() {
  const { business } = useData();
  if (!business.phone && !business.whatsapp && !business.hours) return null;
  return (
    <div className="ti-topbar ti-dark">
      <div className="ti-wrap ti-topbar-row">
        <span className="ti-topbar-group">
          {business.phone && (
            <a href={telHref(business.phone)}>
              <Icon name="phone" />
              {business.phone}
            </a>
          )}
          {business.whatsapp && (
            <a href={waHref(business.whatsapp)} target="_blank" rel="noopener noreferrer">
              <Icon name="chat" />
              WhatsApp
            </a>
          )}
        </span>
        {business.hours && (
          <span className="ti-topbar-hours">
            <Icon name="clock" />
            {business.hours}
          </span>
        )}
      </div>
    </div>
  );
}

function Header({ nav }) {
  const { business, frontDoor, openBooking } = useData();
  const [open, setOpen] = useState(false);
  return (
    <header className="ti-header ti-dark">
      <div className="ti-wrap ti-header-row">
        <a href="#top" className="ti-brand">
          <span className="ti-mono" aria-hidden="true">
            {initials(business.name)}
          </span>
          <span className="ti-brand-name">{business.name}</span>
        </a>
        <button type="button" className="ti-menu-btn" aria-expanded={open} aria-controls="ti-nav" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Menu'}
        </button>
        <nav id="ti-nav" className={`ti-nav${open ? ' is-open' : ''}`} aria-label="Main">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <button
            type="button"
            className="ti-btn ti-btn-primary"
            onClick={() => {
              setOpen(false);
              openBooking();
            }}
          >
            {frontDoor.cta_label || 'Book a consultation'}
          </button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const { business, positioning, frontDoor, td, tax, openBooking } = useData();
  const main = td.credentials[0];
  const langs = business.languages || [];
  const strip = [
    main ? { icon: 'shield', label: kindLabel(main.kind), value: main.number } : null,
    langs.length ? { icon: 'globe', label: 'Languages', value: langs.join(', ') } : null,
    business.response_time ? { icon: 'clock', label: 'Response', value: business.response_time } : null,
  ].filter(Boolean);
  return (
    <section className="ti-hero ti-dark" aria-labelledby="ti-h1">
      <div className="ti-wrap ti-hero-grid">
        <div className="ti-hero-copy">
          <h1 id="ti-h1">{positioning.headline || business.name}</h1>
          {positioning.subheadline && <p className="ti-lede">{positioning.subheadline}</p>}
          <div className="ti-actions">
            <button type="button" className="ti-btn ti-btn-primary" onClick={() => openBooking()}>
              {frontDoor.cta_label || 'Book a consultation'}
            </button>
            {tax && td.notice_help.enabled ? (
              <button type="button" className="ti-btn ti-btn-ghost" onClick={() => openBooking({ need: 'notice' })}>
                I have received a notice
              </button>
            ) : !tax ? (
              <button type="button" className="ti-btn ti-btn-ghost" onClick={() => openBooking({ need: 'review' })}>
                Review my existing cover
              </button>
            ) : (
              <a className="ti-btn ti-btn-ghost" href="#credentials">
                See registration details
              </a>
            )}
          </div>
        </div>
        <CredentialCard />
      </div>
      {strip.length > 0 && (
        <div className="ti-wrap ti-strip">
          {strip.map((s) => (
            <div key={s.label} className="ti-strip-item">
              <span className="ti-strip-ico">
                <Icon name={s.icon} />
              </span>
              <span>
                <span className="ti-strip-label">{s.label}</span>
                <strong>{s.value}</strong>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Owner photo in a rounded square (1:1 source). Falls back to initials when there is no photo,
// the address is unsafe, or every file attempt fails to load.
function useImageChain(candidates) {
  const ref = useRef(null);
  const key = candidates.join('|');
  const [state, setState] = useState({ key, i: 0 });
  const i = state.key === key ? state.i : 0;
  const advance = useCallback(
    () =>
      setState((s) => {
        const cur = s.key === key ? s.i : 0;
        return cur === i ? { key, i: cur + 1 } : s;
      }),
    [key, i]
  );
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { ref, src: candidates[i], exhausted: i >= candidates.length, onError: advance };
}

function AdviserPhoto({ url, name }) {
  const { isDemo } = useData();
  const img = useImageChain(imageCandidates(url));
  const show = !img.exhausted;
  return (
    <div className="ti-photo-wrap">
      <div className="ti-photo" aria-hidden="true">
        {show ? (
          <img key={img.src} ref={img.ref} src={img.src} alt="" width={ADVISER_PHOTO.width} height={ADVISER_PHOTO.height} onError={img.onError} />
        ) : (
          <span className="ti-photo-initials">{initials(name)}</span>
        )}
      </div>
      {!show && isDemo && <p className="ti-photo-note">Photo 1:1, 600 × 600 px</p>}
    </div>
  );
}

function CredentialCard() {
  const { business, td } = useData();
  const main = td.credentials[0];
  const role = PRACTICE_TYPES.find((p) => p.value === td.practice.type)?.label || '';
  const person = business.founder_name || business.name;
  const more = td.credentials.length - 1;
  return (
    <aside className="ti-plaque" aria-label="Adviser registration details">
      <AdviserPhoto url={business.founder_photo_url} name={person} />
      <p className="ti-plaque-name">{person}</p>
      {role && <p className="ti-plaque-role">{role}</p>}
      {main ? (
        <p className="ti-plaque-line">
          {kindLabel(main.kind)}, {main.issuing_body}. Number {main.number}
          {main.valid_until ? `, valid until ${formatDate(main.valid_until)}` : ''}
        </p>
      ) : (
        <p className="ti-plaque-line">Registration details have not been added yet.</p>
      )}
      {(main?.verify_url || more > 0) && (
        <div className="ti-plaque-links">
          {main?.verify_url ? (
            <a href={main.verify_url} target="_blank" rel="noopener noreferrer">
              Check on the official register
            </a>
          ) : null}
          {more > 0 ? <a href="#credentials">{more} more listed below</a> : null}
        </div>
      )}
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Journey                                                             */
/* ------------------------------------------------------------------ */

function Journey() {
  const { td, tax } = useData();
  return (
    <section className="ti-section" aria-labelledby="ti-journey-h">
      <div className="ti-wrap">
        <h2 id="ti-journey-h">{tax ? 'What happens after you send a request' : 'How we work with you'}</h2>
        <ol className="ti-steps4">
          {td.journey_steps.map((s, idx) => (
            <li key={s.key || idx}>
              <span className="ti-num" aria-hidden="true">
                {idx + 1}
              </span>
              <h3>{s.label}</h3>
              <p>{s.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Services (main conversion surface)                                  */
/* ------------------------------------------------------------------ */

function Services() {
  const { td, openBooking } = useData();
  return (
    <section className="ti-section ti-dark ti-services" id="services" aria-labelledby="ti-svc-h">
      <div className="ti-wrap">
        <div className="ti-sec-head">
          <h2 id="ti-svc-h">How we can help</h2>
          <p className="ti-lede-sm">Choose the topic closest to your situation. We will start the conversation there.</p>
        </div>
        <div className="ti-bento">
          {td.services.map((s) => (
            <article key={s.key || s.title} className="ti-tile" onMouseMove={trackPointer}>
              <span className="ti-ico">
                <Icon name={iconFor(s)} />
              </span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              {(s.included || []).length > 0 && (
                <ul className="ti-ticks">
                  {s.included.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              )}
              <button type="button" className="ti-link" onClick={() => openBooking({ need: s.key || s.title })}>
                Talk to us about this
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tax: notice help and due dates                                      */
/* ------------------------------------------------------------------ */

function NoticeBand() {
  const { td, openBooking } = useData();
  const n = td.notice_help;
  return (
    <section className="ti-section ti-gold" id="notice" aria-labelledby="ti-notice-h">
      <div className="ti-wrap ti-band-inner">
        <div>
          <span className="ti-ico ti-ico-black">
            <Icon name="alert" />
          </span>
          <h2 id="ti-notice-h">{n.headline}</h2>
          <p className="ti-lede-sm">{n.body}</p>
          <button type="button" className="ti-btn ti-btn-primary" onClick={() => openBooking({ need: 'notice' })}>
            {n.button_label}
          </button>
        </div>
        <ol className="ti-steps-list">
          {(n.steps || []).map((s) => (
            <li key={s}>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Deadlines() {
  const { td } = useData();
  const rows = td.deadlines;
  const anyStale = rows.some((r) => isStale(r.last_verified));
  return (
    <section className="ti-section ti-ivory2" id="deadlines" aria-labelledby="ti-dl-h">
      <div className="ti-wrap">
        <h2 id="ti-dl-h">Key due dates</h2>
        <div className="ti-scroll">
          <table className="ti-table">
            <thead>
              <tr>
                <th scope="col">What</th>
                <th scope="col">Due</th>
                <th scope="col">Applies to</th>
                <th scope="col">Last checked</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.label}-${i}`}>
                  <td>{r.label}</td>
                  <td>{r.when}</td>
                  <td>{r.applies_to}</td>
                  <td className={isStale(r.last_verified) ? 'is-stale' : ''}>{r.last_verified ? formatDate(r.last_verified) : 'Not checked'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`ti-checked${anyStale ? ' is-stale' : ''}`}>
          {anyStale
            ? `Some dates were checked more than ${STALE_AFTER_MONTHS} months ago. Confirm them with us before you rely on them.`
            : 'The government can extend or change due dates at short notice. Confirm the date for your own case before you rely on it.'}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Insurance: life events and claims help                              */
/* ------------------------------------------------------------------ */

function LifeEvents() {
  const { td, openBooking } = useData();
  return (
    <section className="ti-section ti-ivory2" id="life" aria-labelledby="ti-life-h">
      <div className="ti-wrap">
        <h2 id="ti-life-h">What is changing in your life?</h2>
        <div className="ti-tiles">
          {td.life_events.map((ev) => (
            <button key={ev.key || ev.title} type="button" className="ti-life" onClick={() => openBooking({ note: `Situation: ${ev.title}` })}>
              <span className="ti-ico">
                <Icon name={iconFor(ev)} />
              </span>
              <span>
                <strong>{ev.title}</strong>
                <span className="ti-muted">{ev.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Claims() {
  const { td, rules } = useData();
  const c = td.claims_help;
  const e = td.policies.escalation || {};
  const ladder = [
    e.insurer_note ? { label: 'Write to the insurer’s grievance officer', text: e.insurer_note } : null,
    (e.irdai_url || '').trim() ? { label: 'Escalate to IRDAI', url: e.irdai_url, linkText: 'Open the IRDAI grievance portal' } : null,
    (e.ombudsman_url || '').trim() ? { label: 'Approach the Insurance Ombudsman', url: e.ombudsman_url, linkText: 'Find your Ombudsman office' } : null,
  ].filter(Boolean);
  const stats = rules.allowClaimStats ? td.claim_stats.filter((s) => s && s.label && s.value) : [];
  return (
    <section className="ti-section" id="claims" aria-labelledby="ti-claims-h">
      <div className="ti-wrap ti-two">
        <div>
          <h2 id="ti-claims-h">If you need to make a claim</h2>
          <ol className="ti-steps-list">
            {(c.steps || []).map((s) => (
              <li key={s.label}>
                <span>
                  <strong>{s.label}.</strong> {s.description}
                </span>
              </li>
            ))}
          </ol>
          {c.helpline && (
            <div className="ti-helpline ti-dark">
              <span className="ti-strip-ico">
                <Icon name="phone" />
              </span>
              <span>
                <span className="ti-strip-label">Our own helpline{c.hours ? `, ${c.hours}` : ''}</span>
                <a href={telHref(c.helpline)}>{c.helpline}</a>
              </span>
            </div>
          )}
          {c.note && <p className="ti-muted">{c.note}</p>}
          {stats.length > 0 && (
            <dl className="ti-facts">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>
                    {s.value}
                    {s.source_note ? <span className="ti-muted"> ({s.source_note})</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        {ladder.length > 0 && (
          <div className="ti-ledger ti-dark">
            <h3>If a claim is rejected or delayed</h3>
            <ol className="ti-steps-list">
              {ladder.map((s) => (
                <li key={s.label}>
                  <span>
                    <strong>{s.label}.</strong> {s.text || ''}
                    {s.url && (
                      <>
                        {' '}
                        <a href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.linkText}
                        </a>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Credentials and about                                               */
/* ------------------------------------------------------------------ */

function Credentials() {
  const { business, positioning, td, tax } = useData();
  const disc = getDisclaimers(td);
  const years = business.year_started ? new Date().getFullYear() - Number(business.year_started) : null;
  const forWho = Array.isArray(positioning.for_who) ? positioning.for_who : positioning.for_who ? [positioning.for_who] : [];
  return (
    <section className="ti-section ti-ivory2" id="credentials" aria-labelledby="ti-cred-h">
      <div className="ti-wrap ti-two">
        <div>
          <h2 id="ti-cred-h">About and credentials</h2>
          {paragraphs(business.about).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <dl className="ti-facts">
            {years > 0 && (
              <div>
                <dt>{tax ? 'In practice since' : 'Advising since'}</dt>
                <dd>
                  {business.year_started} ({years} years)
                </dd>
              </div>
            )}
            {(business.languages || []).length > 0 && (
              <div>
                <dt>Languages</dt>
                <dd>{business.languages.join(', ')}</dd>
              </div>
            )}
            {td.service_areas.length > 0 && (
              <div>
                <dt>Serving</dt>
                <dd>{td.service_areas.join(', ')}</dd>
              </div>
            )}
          </dl>
          {forWho.length > 0 && (
            <>
              <h3>Who we work with</h3>
              <ul className="ti-ticks ti-ticks-dark">
                {forWho.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="ti-ledger ti-dark">
          <h3>Registration and membership</h3>
          {td.credentials.length === 0 ? (
            <p>No registration details have been added yet.</p>
          ) : (
            <ul className="ti-creds">
              {td.credentials.map((c, i) => (
                <li key={`${c.number}-${i}`}>
                  <strong>{kindLabel(c.kind)}</strong>
                  <span>
                    {c.issuing_body}, number {c.number}
                    {c.valid_until ? `, valid until ${formatDate(c.valid_until)}` : ''}
                  </span>
                  {c.verify_url && (
                    <a href={c.verify_url} target="_blank" rel="noopener noreferrer">
                      Check on the official register
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!tax && td.insurers.length > 0 && (
            <div className="ti-callout">
              <strong>Disclosure: insurers we are tied up with</strong>
              <p>{td.insurers.join(', ')}</p>
            </div>
          )}
          <div className="ti-notice">
            <p>{disc.general}</p>
            {disc.domain && <p>{disc.domain}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Success stories (consent-gated, hidden by the regulator profile)    */
/* ------------------------------------------------------------------ */

function Stories({ stories }) {
  return (
    <section className="ti-section" id="stories" aria-labelledby="ti-story-h">
      <div className="ti-wrap">
        <h2 id="ti-story-h">Client stories</h2>
        <p className="ti-muted ti-intro">Shared with each client’s permission. Every case is different, and your outcome may differ.</p>
        <div className="ti-stories">
          {stories.map((s, i) => {
            const scope = s.consent_scope || [];
            const showName = scope.includes('name');
            const showOutcome = scope.includes('outcome');
            const facts = [];
            if (showOutcome) {
              if (s.service) facts.push(['Service', s.service]);
              if (s.year) facts.push(['Year', String(s.year)]);
              if (s.outcome) facts.push(['Outcome', s.outcome]);
            }
            return (
              <figure key={`${s.first_name}-${i}`} className="ti-story">
                <blockquote>{s.quote}</blockquote>
                <figcaption>
                  <strong>{showName ? s.first_name : 'A client'}</strong>
                  {facts.length > 0 && (
                    <dl className="ti-facts">
                      {facts.map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ and guides                                                      */
/* ------------------------------------------------------------------ */

function Faq() {
  const { td, knowledge, openBooking } = useData();
  const faqs = (knowledge.faqs || []).filter((f) => f && f.q && f.a);
  return (
    <section className="ti-section" id="faq" aria-labelledby="ti-faq-h">
      <div className="ti-wrap ti-faq-grid">
        <div>
          <h2 id="ti-faq-h">Questions we are often asked</h2>
          <p className="ti-muted">Cannot find your question? Send us a request and we will answer it on the call.</p>
          <button type="button" className="ti-btn ti-btn-ghost" onClick={() => openBooking()}>
            Ask us directly
          </button>
        </div>
        <div>
          {faqs.length > 0 && (
            <div className="ti-faq">
              {faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          )}
          {td.resources.length > 0 && (
            <>
              <h3 className="ti-gap">Guides</h3>
              <ul className="ti-resources">
                {td.resources.map((r, i) => {
                  const stale = r.last_verified && isStale(r.last_verified);
                  return (
                    <li key={`${r.title}-${i}`}>
                      {r.body ? (
                        <details>
                          <summary>{r.title}</summary>
                          <p>{r.body}</p>
                        </details>
                      ) : (
                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                          {r.title}
                        </a>
                      )}
                      {r.last_verified && (
                        <span className={`ti-muted${stale ? ' is-stale' : ''}`}>
                          Checked {formatDate(r.last_verified)}.{stale ? ' Confirm with us before relying on it.' : ''}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Contact and consultation request                                    */
/* ------------------------------------------------------------------ */

function Book() {
  const { business, td, tax } = useData();
  const next = td.journey_steps.slice(1);
  return (
    <section className="ti-section ti-dark ti-book" id="book" aria-labelledby="ti-book-h">
      <div className="ti-wrap">
        <div className="ti-book-card">
          <div className="ti-book-side">
            <h2 id="ti-book-h">Request a consultation</h2>
            <p className="ti-lede-sm">
              {tax
                ? 'Tell us what you need and we will call you to confirm a time.'
                : 'Tell us who you would like to protect and we will call you to confirm a time.'}
            </p>
            <ul className="ti-contact">
              {business.phone && (
                <li>
                  <span className="ti-strip-ico">
                    <Icon name="phone" />
                  </span>
                  <a href={telHref(business.phone)}>{business.phone}</a>
                </li>
              )}
              {business.whatsapp && (
                <li>
                  <span className="ti-strip-ico">
                    <Icon name="chat" />
                  </span>
                  <a href={waHref(business.whatsapp)} target="_blank" rel="noopener noreferrer">
                    WhatsApp {business.whatsapp}
                  </a>
                </li>
              )}
              {business.email && (
                <li>
                  <span className="ti-strip-ico">
                    <Icon name="mail" />
                  </span>
                  <a href={`mailto:${business.email}`}>{business.email}</a>
                </li>
              )}
              {business.hours && (
                <li>
                  <span className="ti-strip-ico">
                    <Icon name="clock" />
                  </span>
                  <span>{business.hours}</span>
                </li>
              )}
              {business.address && (
                <li>
                  <span className="ti-strip-ico">
                    <Icon name="pin" />
                  </span>
                  <span>
                    {business.address}
                    {business.map_url ? (
                      <>
                        {' '}
                        <a href={business.map_url} target="_blank" rel="noopener noreferrer">
                          Open in maps
                        </a>
                      </>
                    ) : null}
                  </span>
                </li>
              )}
            </ul>
            {next.length > 0 && (
              <>
                <h3>What happens next</h3>
                <ol className="ti-next">
                  {next.map((s) => (
                    <li key={s.key || s.label}>{s.label}</li>
                  ))}
                </ol>
              </>
            )}
          </div>
          <ConsultForm />
        </div>
      </div>
    </section>
  );
}

const WIDE_TYPES = ['multi_select', 'yes_no', 'long_text'];

function Field({ def, value, onChange, error }) {
  const id = `ti-f-${def.key}`;
  const errId = `${id}-err`;
  const opts = optionList(def);
  const req = def.required ? <span className="ti-req"> (required)</span> : null;
  const wide = WIDE_TYPES.includes(def.type) ? ' is-wide' : '';
  const err = error ? (
    <p className="ti-error" id={errId}>
      {error}
    </p>
  ) : null;
  const common = { id, name: def.key, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errId : undefined };

  if (def.type === 'checkbox') {
    return (
      <div className="ti-field is-wide">
        <label className="ti-check">
          <input type="checkbox" {...common} checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>
            {def.label}
            {req}
          </span>
        </label>
        {err}
      </div>
    );
  }
  if (def.type === 'multi_select') {
    const cur = Array.isArray(value) ? value : [];
    return (
      <fieldset className={`ti-field ti-fieldset-inner${wide}`} id={id} aria-describedby={error ? errId : undefined}>
        <legend>
          {def.label}
          {req}
        </legend>
        <div className="ti-pills">
          {opts.map((o) => (
            <label key={o.value} className="ti-pill">
              <input
                type="checkbox"
                checked={cur.includes(o.value)}
                onChange={(e) => onChange(e.target.checked ? [...cur, o.value] : cur.filter((x) => x !== o.value))}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        {err}
      </fieldset>
    );
  }
  if (def.type === 'yes_no') {
    return (
      <fieldset className={`ti-field ti-fieldset-inner${wide}`} id={id} aria-describedby={error ? errId : undefined}>
        <legend>
          {def.label}
          {req}
        </legend>
        <div className="ti-pills">
          {[
            ['yes', 'Yes'],
            ['no', 'No'],
          ].map(([v, l]) => (
            <label key={v} className="ti-pill">
              <input type="radio" name={def.key} checked={value === v} onChange={() => onChange(v)} />
              <span>{l}</span>
            </label>
          ))}
        </div>
        {err}
      </fieldset>
    );
  }
  return (
    <div className={`ti-field${wide}`}>
      <label htmlFor={id}>
        {def.label}
        {req}
      </label>
      {def.type === 'long_text' ? (
        <textarea {...common} className="ti-input" rows={4} maxLength={2000} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : def.type === 'select' ? (
        <select {...common} className="ti-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose one</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          className="ti-input"
          type={def.type === 'number' ? 'number' : def.type === 'text' || def.type === 'long_text' ? 'text' : def.type}
          inputMode={def.type === 'number' ? 'numeric' : undefined}
          autoComplete={def.autoComplete}
          maxLength={def.type === 'text' ? 200 : undefined}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {err}
    </div>
  );
}

const TIME_PARTS = [
  ['', 'Any time'],
  ['morning', 'Morning'],
  ['afternoon', 'Afternoon'],
  ['evening', 'Evening'],
];

function ConsultForm() {
  const { td, business, slug, isDemo, prefill, tax } = useData();
  const builtIn = useMemo(() => getPrescreenFields(td), [td]);
  const customDefs = td.prescreen.custom_fields || [];
  const policies = td.policies;

  const [date, setDate] = useState('');
  const [part, setPart] = useState('');
  const [minDate, setMinDate] = useState('');
  const [profile, setProfile] = useState({});
  const [custom, setCustom] = useState({});
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState({});
  const [moreOpen, setMoreOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [serverMsg, setServerMsg] = useState('');
  const [result, setResult] = useState(null);
  const summaryRef = useRef(null);
  const doneRef = useRef(null);

  const timezone = business.timezone || 'Asia/Kolkata';

  useEffect(() => {
    const d = new Date();
    setMinDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }, []);

  // "Talk to us about this", "I have received a notice" and similar buttons elsewhere on the page.
  useEffect(() => {
    if (!prefill.nonce) return;
    setProfile((p) => {
      const next = { ...p };
      if (prefill.need) {
        const cur = Array.isArray(p.need) ? p.need : [];
        if (!cur.includes(prefill.need)) next.need = [...cur, prefill.need];
        if (prefill.need === 'notice') next.notice_received = 'yes';
      }
      if (prefill.note && !p.message) next.message = prefill.note;
      return next;
    });
  }, [prefill]);

  const shown = builtIn.filter((f) => !f.showIf || profile[f.showIf.key] === f.showIf.equals);
  const ctx = { ...profile, ...custom };
  const visibleCustom = customDefs.filter((d) => isVisible(d, ctx));
  const setP = (key) => (v) => setProfile((p) => ({ ...p, [key]: v }));
  const setC = (key) => (v) => setCustom((p) => ({ ...p, [key]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};

    const cleanProfile = {};
    shown.forEach((f) => {
      let v = profile[f.key];
      if (isEmptyVal(v)) {
        if (f.required) errs[f.key] = 'This answer is required.';
        return;
      }
      if (f.type === 'email' && !EMAIL_RE.test(String(v).trim())) {
        errs[f.key] = 'Enter a valid email address.';
        return;
      }
      if (f.type === 'tel' && digits(v).length < 10) {
        errs[f.key] = 'Enter a mobile number with at least 10 digits.';
        return;
      }
      cleanProfile[f.key] = typeof v === 'string' ? v.trim() : v;
    });

    const customIn = {};
    visibleCustom.forEach((d) => {
      let v = custom[d.key];
      if (d.type === 'number' && !isEmptyVal(v)) v = Number(v);
      customIn[d.key] = v;
    });
    const cv = validateCustomAnswers(customDefs, customIn, cleanProfile);
    Object.assign(errs, cv.errors);
    if (!consent) errs.consent = 'Tick the box to confirm you agree.';

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (shown.some((f) => errs[f.key] && !PRIMARY_GROUPS.includes(f.group))) setMoreOpen(true);
      setStatus('idle');
      setTimeout(() => summaryRef.current && summaryRef.current.focus(), 0);
      return;
    }

    setStatus('sending');
    setServerMsg('');
    // One simple consultation request. The adviser confirms how and when directly with the person.
    const body = buildSubmitBody({
      siteSlug: slug,
      typeKey: 'consultation',
      mode: cleanProfile.contact_channel || '',
      preferred: { date, part_of_day: part },
      timezone,
      profile: cleanProfile,
      custom: cv.clean,
      policyVersion: policies.version,
      honeypot: hp,
    });
    const res = await submitConsultRequest({ body, demo: isDemo });
    if (res.ok) {
      setResult(res);
      setStatus('done');
      setTimeout(() => doneRef.current && doneRef.current.focus(), 0);
    } else {
      setStatus('error');
      setServerMsg(res.message);
      if (res.fieldErrors) setErrors(res.fieldErrors);
      setTimeout(() => summaryRef.current && summaryRef.current.focus(), 0);
    }
  }

  if (status === 'done') {
    const bookingUrl = td.integrations.booking_url;
    return (
      <div className="ti-form ti-done" ref={doneRef} tabIndex={-1} role="status">
        <h3>{result?.demo ? 'Sample request received' : 'We have your request'}</h3>
        {result?.demo ? (
          <p>This is a sample site, so nothing was sent.</p>
        ) : (
          <>
            <p>
              Keep this reference: <strong>{result.ref}</strong>
            </p>
            <p>{business.name} will review your details and get in touch to confirm a time.</p>
          </>
        )}
        {bookingUrl && (
          <p>
            Prefer to pick a slot yourself?{' '}
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              Open the booking calendar
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  const errorList = Object.entries(errors);
  const privacyHref = policies.privacy?.url || '#policies';
  const grouped = GROUP_ORDER.map((g) => ({ g, fields: shown.filter((f) => f.group === g) })).filter((x) => x.fields.length > 0);
  const primary = grouped.filter((x) => PRIMARY_GROUPS.includes(x.g));
  const secondary = grouped.filter((x) => !PRIMARY_GROUPS.includes(x.g));
  const renderGroup = ({ g, fields }) => (
    <fieldset className="ti-fs" key={g}>
      <legend>{PRESCREEN_GROUPS[g]}</legend>
      <div className="ti-grid2">
        {fields.map((f) => (
          <Field key={f.key} def={f} value={profile[f.key]} onChange={setP(f.key)} error={errors[f.key]} />
        ))}
      </div>
    </fieldset>
  );

  return (
    <form className="ti-form" noValidate onSubmit={onSubmit} aria-labelledby="ti-book-h">
      {(errorList.length > 0 || serverMsg) && (
        <div className="ti-error-summary" ref={summaryRef} tabIndex={-1} role="alert">
          <strong>{serverMsg || 'Please fix the following before sending.'}</strong>
          {errorList.length > 0 && (
            <ul>
              {errorList.map(([k, m]) => (
                <li key={k}>
                  <a href={`#ti-f-${k}`}>{m}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {primary.map(renderGroup)}

      <fieldset className="ti-fs">
        <legend>When should we call you?</legend>
        <div className="ti-grid2">
          <div className="ti-field">
            <label htmlFor="ti-f-date">Preferred date (optional)</label>
            <input id="ti-f-date" className="ti-input" type="date" min={minDate || undefined} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <fieldset className="ti-field ti-fieldset-inner">
            <legend>Time of day</legend>
            <div className="ti-pills">
              {TIME_PARTS.map(([v, l]) => (
                <label key={l} className="ti-pill">
                  <input type="radio" name="part_of_day" checked={part === v} onChange={() => setPart(v)} />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </fieldset>

      {secondary.length > 0 && (
        <details className="ti-more" open={moreOpen} onToggle={(e) => setMoreOpen(e.currentTarget.open)}>
          <summary>Add more detail (optional, helps us prepare)</summary>
          {secondary.map(renderGroup)}
        </details>
      )}

      {visibleCustom.length > 0 && (
        <fieldset className="ti-fs">
          <legend>A few more questions</legend>
          <div className="ti-grid2">
            {visibleCustom.map((d) => (
              <Field key={d.key} def={{ ...d, options: d.options }} value={custom[d.key]} onChange={setC(d.key)} error={errors[d.key]} />
            ))}
          </div>
        </fieldset>
      )}

      <div className="ti-hp" aria-hidden="true">
        <label htmlFor="ti-f-website">Leave this field empty</label>
        <input id="ti-f-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>

      <div className="ti-field">
        <label className="ti-check">
          <input id="ti-f-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={errors.consent ? true : undefined} />
          <span>
            I agree that {business.name} may store and use the details I have entered to respond to my request. I have read the{' '}
            <a href={privacyHref} {...(policies.privacy?.url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              privacy policy
            </a>
            . (required)
          </span>
        </label>
        {errors.consent && <p className="ti-error">{errors.consent}</p>}
      </div>

      <button type="submit" className="ti-btn ti-btn-primary ti-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending request' : 'Send consultation request'}
      </button>
      <p className="ti-muted">
        Please do not include PAN, Aadhaar, bank details, passwords or OTPs
        {tax ? '' : ', or medical details'}. We will tell you how to share documents securely later.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Policies and footer                                                 */
/* ------------------------------------------------------------------ */

function policyEntries(td) {
  const p = td.policies || {};
  return [
    ['privacy', 'Privacy policy'],
    ['refund', 'Fee-refund policy'],
    ['cancellation', 'Cancellation policy'],
    ['retention', 'How long we keep your information'],
  ]
    .map(([key, label]) => ({ key, label, url: (p[key]?.url || '').trim(), body: (p[key]?.body || '').trim() }))
    .filter((e) => e.url || e.body);
}

function Policies() {
  const { td } = useData();
  const entries = policyEntries(td);
  const g = td.policies?.grievance || {};
  const hasGrievance = (g.email || g.phone || '').trim();
  if (entries.length === 0 && !hasGrievance) return null;
  return (
    <section className="ti-section ti-ivory2" id="policies" aria-labelledby="ti-pol-h">
      <div className="ti-wrap">
        <h2 id="ti-pol-h">Policies and complaints</h2>
        <div className="ti-faq">
          {entries.map((e) => (
            <details key={e.key}>
              <summary>{e.label}</summary>
              {e.body && <p>{e.body}</p>}
              {e.url && (
                <p>
                  <a href={e.url} target="_blank" rel="noopener noreferrer">
                    Read the full policy
                  </a>
                </p>
              )}
            </details>
          ))}
        </div>
        {hasGrievance && (
          <p className="ti-complaints">
            <strong>Complaints:</strong> contact {g.name || 'us'}
            {g.email ? (
              <>
                {' '}
                at <a href={`mailto:${g.email}`}>{g.email}</a>
              </>
            ) : null}
            {g.phone ? (
              <>
                {' '}
                or <a href={telHref(g.phone)}>{g.phone}</a>
              </>
            ) : null}
            .
          </p>
        )}
      </div>
    </section>
  );
}

function Footer() {
  const { business, td } = useData();
  const disc = getDisclaimers(td);
  const entries = policyEntries(td);
  return (
    <footer className="ti-footer ti-dark">
      <div className="ti-wrap">
        <p>
          <strong>{business.name}</strong>
          {business.city ? `, ${business.city}` : ''}
        </p>
        <p className="ti-footer-note">{disc.general}</p>
        {disc.domain && <p className="ti-footer-note">{disc.domain}</p>}
        {entries.length > 0 && (
          <nav className="ti-links" aria-label="Policies">
            {entries.map((e) => (
              <a key={e.key} href={e.url || '#policies'} {...(e.url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {e.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Styles (scoped to .ti-root). Black and gold.                        */
/* ------------------------------------------------------------------ */

const CSS = `
.ti-root{--black:#0A0A0B;--char:#141416;--gold:#C9A24B;--gold-l:#EAD592;--gold-d:#7A5E1C;--ivory:#FBF8F1;--ivory2:#F3EDDF;--line:#E4DCC8;--ink:#141414;--muted:#5B5648;--soft:#B9B3A3;--dline:rgba(201,162,75,.30);
  --gold-grad:linear-gradient(135deg,#F3DE9F 0%,#C9A24B 48%,#A98130 100%);
  --shadow-s:0 1px 2px rgba(20,16,4,.08),0 4px 14px rgba(20,16,4,.06);--shadow-m:0 18px 44px -18px rgba(20,16,4,.4);
  font-family:'Manrope',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--ivory);line-height:1.65;font-size:1.0625rem;min-height:100vh}
.ti-root *,.ti-root *::before,.ti-root *::after{box-sizing:border-box}
.ti-root h1,.ti-root h2,.ti-root h3,.ti-root h4{font-family:'Fraunces',Georgia,'Times New Roman',serif;font-weight:600;line-height:1.12;letter-spacing:-0.01em;margin:0 0 .75rem;color:var(--ink)}
.ti-root h1{font-size:clamp(2.3rem,5vw,3.75rem)}
.ti-root h2{font-size:clamp(1.8rem,3.5vw,2.6rem)}
.ti-root h3{font-size:1.3rem;margin-top:1.75rem}
.ti-root p{margin:0 0 1rem;max-width:68ch}
.ti-root a{color:var(--gold-d);text-underline-offset:3px}
.ti-root a:hover{color:var(--black)}
.ti-root :focus-visible{outline:3px solid var(--gold-d);outline-offset:2px}
.ti-wrap{max-width:1140px;margin:0 auto;padding:0 1.25rem;position:relative}
.ti-root .ti-muted{color:var(--muted);font-size:.97rem}
.ti-root .ti-lede{font-size:1.22rem;color:#D8D2C2;max-width:34rem}
.ti-root .ti-lede-sm{font-size:1.1rem;color:var(--muted)}
.ti-root .ti-intro{margin-bottom:1.5rem}
.ti-root .ti-gap{margin-top:2.5rem}
.ti-scroll{overflow-x:auto}
.ti-sec-head{max-width:44rem}

/* dark surfaces */
.ti-dark{background:var(--black);color:#EDE8DA}
.ti-root .ti-dark h1,.ti-root .ti-dark h2,.ti-root .ti-dark h3{color:#fff}
.ti-root .ti-dark a:not(.ti-btn){color:var(--gold-l)}
.ti-root .ti-dark a:not(.ti-btn):hover{color:#fff}
.ti-root .ti-dark .ti-lede-sm,.ti-root .ti-dark .ti-muted{color:var(--soft)}
.ti-dark :focus-visible{outline-color:var(--gold-l)}
.ti-root .ti-dark .ti-form h3{color:var(--ink)}
.ti-root .ti-dark .ti-form a:not(.ti-btn){color:var(--gold-d)}
.ti-root .ti-dark .ti-form a:not(.ti-btn):hover{color:var(--black)}
.ti-root .ti-dark .ti-form .ti-muted{color:var(--muted)}
.ti-root .ti-dark .ti-form .ti-error-summary a{color:#7A1F16}
.ti-root .ti-header a.ti-brand{color:#fff}

.ti-demo{background:#141416;color:var(--gold-l);padding:.55rem 1rem;font-size:.92rem;font-weight:600;text-align:center;border-bottom:1px solid var(--dline)}

/* buttons */
.ti-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:.6rem 1.5rem;border-radius:999px;border:1.5px solid transparent;font:700 1rem 'Manrope',system-ui,sans-serif;cursor:pointer;text-decoration:none;transition:filter .15s,box-shadow .15s,transform .15s,background .15s,color .15s,border-color .15s}
.ti-root .ti-btn-primary{background:var(--gold-grad);color:#0A0A0B;box-shadow:0 10px 26px -12px rgba(201,162,75,.9)}
.ti-root .ti-btn-primary:hover{filter:brightness(1.07);transform:translateY(-1px);color:#0A0A0B}
.ti-btn-primary:disabled{opacity:.6;cursor:progress;transform:none}
.ti-root .ti-btn-ghost{background:transparent;color:var(--ink);border-color:var(--ink)}
.ti-root .ti-btn-ghost:hover{background:var(--ink);color:var(--gold-l)}
.ti-root .ti-dark .ti-btn-ghost{color:var(--gold-l);border-color:var(--gold)}
.ti-root .ti-dark .ti-btn-ghost:hover{background:rgba(201,162,75,.16);color:#fff;border-color:var(--gold-l)}
.ti-actions{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:1.75rem}

/* top bar and header */
.ti-topbar{background:#000;border-bottom:1px solid var(--dline);font-size:.88rem}
.ti-topbar-row{display:flex;justify-content:space-between;align-items:center;gap:1rem;min-height:38px;color:var(--soft)}
.ti-topbar-group{display:flex;gap:1.4rem;flex-wrap:wrap}
.ti-topbar a,.ti-topbar-hours{display:inline-flex;align-items:center;gap:.45rem;text-decoration:none;font-weight:600}
.ti-topbar svg{width:15px;height:15px;stroke:var(--gold);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ti-header{position:sticky;top:0;z-index:30;background:rgba(10,10,11,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--dline)}
.ti-header-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:74px}
.ti-brand{display:inline-flex;align-items:center;gap:.8rem;text-decoration:none;min-width:0}
.ti-root a.ti-brand{color:#fff}
.ti-mono{flex:none;width:2.6rem;height:2.6rem;border-radius:50%;background:var(--gold-grad);color:#0A0A0B;display:grid;place-items:center;font:700 1rem 'Fraunces',Georgia,serif;box-shadow:0 0 0 3px rgba(201,162,75,.25)}
.ti-brand-name{font:600 1.12rem 'Fraunces',Georgia,serif;line-height:1.2;letter-spacing:-0.005em}
.ti-nav{display:flex;align-items:center;gap:1.4rem}
.ti-nav a{white-space:nowrap}
.ti-root .ti-nav a:not(.ti-btn){color:#E9E3D2;text-decoration:none;font-weight:600;font-size:.98rem;padding:.35rem 0;background:linear-gradient(var(--gold),var(--gold)) left bottom/0 2px no-repeat;transition:background-size .25s,color .2s}
.ti-root .ti-nav a:not(.ti-btn):hover{color:#fff;background-size:100% 2px}
.ti-nav .ti-btn{min-height:44px;padding:.4rem 1.25rem;white-space:nowrap}
.ti-menu-btn{display:none;min-height:44px;padding:.4rem 1rem;border:1.5px solid var(--gold);border-radius:999px;background:transparent;color:var(--gold-l);font:700 .95rem 'Manrope',sans-serif;cursor:pointer}

/* hero */
.ti-hero{position:relative;padding:4.5rem 0 0;
  background:radial-gradient(55rem 28rem at 88% -8%,rgba(201,162,75,.30),transparent 62%),radial-gradient(38rem 22rem at -8% 108%,rgba(201,162,75,.14),transparent 62%),linear-gradient(180deg,#0A0A0B 0%,#121214 100%)}
.ti-hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:3.5rem;align-items:center;margin-bottom:3.25rem}
.ti-plaque{justify-self:end;width:100%;max-width:390px;background:linear-gradient(160deg,#1B1B1F,#0F0F11);border:1px solid var(--dline);border-radius:28px;padding:1.4rem;text-align:center;box-shadow:0 34px 70px -34px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,255,255,.06)}
.ti-photo-wrap{display:flex;flex-direction:column;align-items:center}
.ti-photo{position:relative;width:100%;aspect-ratio:1 / 1;border-radius:20px;overflow:hidden;background:var(--gold-grad);color:#0A0A0B;display:flex;align-items:center;justify-content:center;font:600 4.2rem 'Fraunces',Georgia,serif}
.ti-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 28%}
.ti-photo-initials{line-height:1}
.ti-root .ti-photo-note{margin:.6rem 0 0;font-size:.85rem;color:var(--soft);max-width:none}
.ti-root .ti-plaque-name{font:600 1.55rem 'Fraunces',Georgia,serif;color:#fff;margin:1.1rem 0 .15rem}
.ti-root .ti-plaque-role{color:var(--gold-l);margin:0 0 .7rem;font-weight:600}
.ti-root .ti-plaque-line{margin:0 auto .3rem;color:#D8D2C2;font-size:.97rem}
.ti-plaque-links{display:flex;flex-wrap:wrap;justify-content:center;gap:.2rem 1.1rem;margin-top:.6rem;font-weight:700;font-size:.95rem}

/* trust strip overlapping into the next section */
.ti-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;margin-bottom:-2.75rem;z-index:3}
.ti-strip-item{display:flex;align-items:center;gap:.9rem;background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:18px;padding:1rem 1.15rem;box-shadow:var(--shadow-m)}
.ti-strip-item>span:last-child{display:grid;line-height:1.35;min-width:0}
.ti-strip-label{font-size:.85rem;color:var(--muted);font-weight:600}
.ti-strip-ico{flex:none;width:2.6rem;height:2.6rem;border-radius:50%;background:var(--black);display:grid;place-items:center}
.ti-strip-ico svg{width:1.2rem;height:1.2rem;stroke:var(--gold-l);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}

/* sections */
.ti-section{padding:5rem 0;position:relative}
.ti-hero+.ti-section{padding-top:calc(5rem + 2.75rem)}
.ti-ivory2{background:var(--ivory2)}

/* journey */
.ti-steps4{list-style:none;margin:2rem 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:1.25rem}
.ti-steps4 li{background:#fff;border:1px solid var(--line);border-radius:22px;padding:1.5rem;box-shadow:var(--shadow-s)}
.ti-root .ti-steps4 h3{margin:0 0 .4rem;font-size:1.18rem}
.ti-root .ti-steps4 p{margin:0;color:var(--muted);font-size:.98rem}
.ti-num{width:2.7rem;height:2.7rem;border-radius:50%;background:var(--black);color:var(--gold-l);display:grid;place-items:center;font:600 1.15rem 'Fraunces',Georgia,serif;margin-bottom:1rem;box-shadow:0 0 0 4px rgba(201,162,75,.28)}

/* services: bento tiles with topic icons */
.ti-services{background:radial-gradient(50rem 26rem at 100% 0%,rgba(201,162,75,.16),transparent 60%),var(--black)}
.ti-bento{display:grid;grid-template-columns:repeat(6,1fr);gap:1.1rem;margin-top:2.25rem;grid-auto-flow:dense}
.ti-tile{grid-column:span 2;position:relative;isolation:isolate;overflow:hidden;display:flex;flex-direction:column;background:linear-gradient(160deg,#1A1A1E,#111113);border:1px solid var(--dline);border-radius:26px;padding:1.6rem;transition:transform .28s,border-color .28s,box-shadow .28s}
.ti-tile::before{content:'';position:absolute;inset:0;z-index:-1;background:radial-gradient(340px circle at var(--mx,75%) var(--my,0%),rgba(201,162,75,.24),transparent 62%);opacity:.5;transition:opacity .3s}
.ti-tile:hover{transform:translateY(-4px);border-color:rgba(201,162,75,.75);box-shadow:0 26px 54px -26px rgba(201,162,75,.5)}
.ti-tile:hover::before{opacity:1}
.ti-tile:nth-child(5n+1),.ti-tile:nth-child(5n+2){grid-column:span 3}
.ti-tile:last-child:nth-child(5n+1),.ti-tile:last-child:nth-child(5n+3){grid-column:span 6}
.ti-tile:last-child:nth-child(5n+4){grid-column:span 4}
.ti-root .ti-tile h3{margin:0 0 .5rem;font-size:1.32rem;color:#fff}
.ti-root .ti-tile p{color:#CFC9B9;font-size:.99rem;max-width:none}
.ti-ico{width:3.3rem;height:3.3rem;border-radius:17px;background:var(--gold-grad);color:#0A0A0B;display:grid;place-items:center;margin-bottom:1rem;flex:none;box-shadow:0 12px 26px -12px rgba(201,162,75,.95);transition:transform .35s}
.ti-tile:hover .ti-ico{transform:rotate(-7deg) scale(1.07)}
.ti-ico svg{width:1.65rem;height:1.65rem;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.ti-ico-black{background:var(--black);color:var(--gold-l);box-shadow:0 12px 26px -14px rgba(0,0,0,.8)}
.ti-ticks{list-style:none;margin:.2rem 0 1rem;padding:0;display:grid;gap:.4rem}
.ti-ticks li{position:relative;padding-left:1.5rem;font-size:.97rem}
.ti-ticks li::before{content:'';position:absolute;left:.15rem;top:.42em;width:.34rem;height:.62rem;border:solid var(--gold);border-width:0 2px 2px 0;transform:rotate(45deg)}
.ti-ticks-dark li::before{border-color:var(--gold-d)}
.ti-link{margin-top:auto;padding:1rem 0 0;align-self:flex-start;background:none;border:0;color:var(--gold-l);font:700 .98rem 'Manrope',sans-serif;cursor:pointer;text-decoration:underline;text-decoration-color:rgba(234,213,146,.4);text-underline-offset:6px;transition:color .2s,text-decoration-color .2s}
.ti-link:hover{color:#fff;text-decoration-color:var(--gold-l)}

/* notice band */
.ti-gold{background:var(--gold-grad);color:#0A0A0B}
.ti-root .ti-gold h2{color:#0A0A0B}
.ti-root .ti-gold .ti-lede-sm{color:#2A2413}
.ti-root .ti-gold .ti-btn-primary{background:#0A0A0B;color:var(--gold-l);box-shadow:0 12px 26px -14px rgba(0,0,0,.8)}
.ti-root .ti-gold .ti-btn-primary:hover{background:#000;color:#fff}
.ti-band-inner{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:3rem;align-items:center}
.ti-steps-list{--dot:var(--black);counter-reset:st;list-style:none;margin:0 0 1.25rem;padding:0;display:grid;gap:.8rem}
.ti-steps-list li{counter-increment:st;display:flex;gap:.9rem;align-items:flex-start;background:rgba(255,255,255,.78);border:1px solid rgba(20,20,20,.12);border-radius:16px;padding:.9rem 1.1rem;color:var(--ink)}
.ti-steps-list li::before{content:counter(st);flex:none;width:2rem;height:2rem;border-radius:50%;background:var(--dot);color:var(--gold-l);display:grid;place-items:center;font-weight:800}

/* two-column blocks and facts */
.ti-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:3.5rem;align-items:start}
.ti-two>div>:first-child{margin-top:0}
.ti-facts{margin:1rem 0;display:grid;gap:.6rem}
.ti-facts>div{display:grid;grid-template-columns:minmax(120px,190px) 1fr;gap:1rem;padding-bottom:.6rem;border-bottom:1px solid var(--line)}
.ti-facts dt{color:var(--muted);font-size:.97rem}
.ti-facts dd{margin:0;font-weight:600}

/* life events */
.ti-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(270px,100%),1fr));gap:1rem;margin-top:2rem}
.ti-life{display:flex;gap:1rem;align-items:flex-start;text-align:left;background:#fff;border:1px solid var(--line);border-radius:20px;padding:1.2rem;cursor:pointer;font:inherit;color:var(--ink);transition:transform .22s,border-color .22s,box-shadow .22s}
.ti-life:hover{transform:translateY(-3px);border-color:var(--gold);box-shadow:var(--shadow-m)}
.ti-life .ti-ico{width:3rem;height:3rem;border-radius:15px;margin:0;background:var(--black);color:var(--gold-l);box-shadow:none}
.ti-life>span:last-child{display:grid;gap:.15rem}

/* due dates */
.ti-table{border-collapse:separate;border-spacing:0;width:100%;font-size:.97rem;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-top:1.5rem}
.ti-table th,.ti-table td{text-align:left;padding:.8rem 1rem;border-bottom:1px solid var(--line);vertical-align:top}
.ti-table th{background:var(--black);color:var(--gold-l);font-weight:700}
.ti-table tr:last-child td{border-bottom:0}
.ti-root .ti-checked{margin-top:1.25rem;font-size:.97rem;color:var(--muted)}
.ti-root .is-stale{color:#A3361F}
.ti-root .ti-checked.is-stale{background:#FBE3DC;border-radius:12px;padding:.7rem 1rem;font-weight:600}

/* claims and credentials */
.ti-helpline{display:flex;align-items:center;gap:1rem;border-radius:18px;padding:1rem 1.25rem;margin:1.25rem 0}
.ti-helpline>span:last-child{display:grid;line-height:1.35}
.ti-helpline .ti-strip-label{color:var(--soft)}
.ti-helpline a{font-weight:800;font-size:1.2rem;text-decoration:none}
.ti-ledger{border:1px solid var(--dline);border-radius:26px;padding:1.8rem 1.9rem;background:linear-gradient(160deg,#18181B,#0B0B0C);box-shadow:var(--shadow-m)}
.ti-ledger>h3:first-child{margin-top:0;color:var(--gold-l)}
.ti-ledger .ti-steps-list li{background:rgba(255,255,255,.05);border-color:var(--dline);color:#EDE8DA}
.ti-ledger .ti-steps-list li::before{background:var(--gold-grad);color:#0A0A0B}
.ti-creds{list-style:none;margin:0 0 1rem;padding:0;display:grid;gap:1rem}
.ti-creds li{display:grid;gap:.15rem;padding:.25rem 0 .25rem 1rem;border-left:3px solid var(--gold)}
.ti-callout{background:rgba(201,162,75,.12);border:1px solid var(--dline);border-radius:16px;padding:1rem 1.2rem;margin:1.25rem 0}
.ti-root .ti-callout p{margin:.25rem 0 0;color:#D8D2C2}
.ti-notice{margin-top:1.4rem;padding-top:1rem;border-top:1px solid var(--dline)}
.ti-root .ti-notice p{margin-bottom:.5rem;font-size:.94rem;color:var(--soft)}
.ti-root .ti-notice p:last-child{margin-bottom:0}

/* stories */
.ti-stories{display:grid;gap:1.75rem}
.ti-story{margin:0;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:2.25rem;padding:2rem;background:#fff;border:1px solid var(--line);border-radius:26px;box-shadow:var(--shadow-m)}
.ti-story blockquote{margin:0;font-family:'Fraunces',Georgia,serif;font-size:clamp(1.25rem,2.4vw,1.65rem);line-height:1.35;font-weight:500}
.ti-story blockquote::before{content:'\\201C';display:block;font-size:5rem;line-height:.7;color:var(--gold);margin-bottom:.4rem}
.ti-story .ti-facts>div{grid-template-columns:110px 1fr}

/* faq and policies */
.ti-faq-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.4fr);gap:3.5rem;align-items:start}
.ti-faq-grid>div:first-child{position:sticky;top:110px}
.ti-resources{list-style:none;margin:1rem 0 0;padding:0;display:grid;gap:1rem}
.ti-resources li{display:grid;gap:.15rem}
.ti-resources summary,.ti-faq summary{cursor:pointer;font-weight:700}
.ti-faq{display:grid;gap:.8rem;max-width:780px}
.ti-faq details{background:#fff;border:1px solid var(--line);border-radius:18px;padding:1rem 1.25rem;transition:box-shadow .2s,border-color .2s}
.ti-faq details:hover{border-color:var(--gold)}
.ti-faq details[open]{box-shadow:var(--shadow-s);border-color:var(--gold)}
.ti-faq summary{list-style:none;display:flex;justify-content:space-between;gap:1rem;align-items:center;font-size:1.05rem}
.ti-faq summary::-webkit-details-marker{display:none}
.ti-faq summary::after{content:'+';flex:none;width:2rem;height:2rem;border-radius:50%;background:var(--black);color:var(--gold-l);display:grid;place-items:center;font-weight:700;line-height:1}
.ti-faq details[open] summary::after{content:'\\2212'}
.ti-root .ti-faq p{margin:.7rem 0 0}
.ti-links{display:flex;flex-wrap:wrap;gap:.4rem 1.5rem}
.ti-root .ti-complaints{margin-top:1.5rem}

/* booking: one split card, dark contact panel and ivory form */
.ti-book{background:radial-gradient(46rem 24rem at 6% 0%,rgba(201,162,75,.24),transparent 62%),radial-gradient(40rem 22rem at 100% 100%,rgba(201,162,75,.12),transparent 62%),var(--black)}
.ti-book-card{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.4fr);border-radius:34px;overflow:hidden;border:1px solid var(--dline);box-shadow:0 44px 90px -34px rgba(0,0,0,.95)}
.ti-book-side{padding:2.6rem 2.25rem;background:linear-gradient(180deg,#151517,#0C0C0D)}
.ti-book-side h2{font-size:clamp(1.7rem,3vw,2.2rem)}
.ti-contact{list-style:none;margin:1.5rem 0 2rem;padding:0;display:grid;gap:.9rem}
.ti-contact li{display:flex;gap:.85rem;align-items:center;font-weight:600}
.ti-contact .ti-strip-ico{background:rgba(201,162,75,.14);border:1px solid var(--dline);width:2.4rem;height:2.4rem}
.ti-book-side h3{font-size:1.1rem;color:var(--gold-l)}
.ti-next{margin:.5rem 0 0;padding-left:1.2rem;color:#D8D2C2}
.ti-next li{margin-bottom:.3rem}
.ti-next li::marker{color:var(--gold);font-weight:700}
.ti-form{background:var(--ivory);color:var(--ink);padding:2.4rem 2.4rem 2rem;min-width:0}
.ti-fs{border:0;margin:0 0 1.7rem;padding:0;min-width:0}
.ti-fs>legend{font:600 1.3rem 'Fraunces',Georgia,serif;padding:0;margin-bottom:1rem;color:var(--ink);float:left;width:100%}
.ti-fs>legend+*{clear:both}
.ti-grid2{display:grid;grid-template-columns:1fr 1fr;gap:1rem 1.1rem}
.ti-field{margin:0;min-width:0}
.ti-field.is-wide{grid-column:1 / -1}
.ti-field>label{display:block;font-weight:700;margin-bottom:.3rem;font-size:.98rem}
.ti-fieldset-inner{border:0;padding:0}
.ti-fieldset-inner>legend{font:700 .98rem 'Manrope',sans-serif;padding:0 0 .4rem;float:none}
.ti-req{font-weight:500;color:var(--muted)}
.ti-input{width:100%;min-height:50px;padding:.55rem .85rem;border:1.5px solid #CFC5AB;border-radius:14px;background:#fff;font:inherit;color:var(--ink);transition:border-color .15s,box-shadow .15s}
.ti-input:focus{border-color:var(--gold-d);box-shadow:0 0 0 4px rgba(201,162,75,.3);outline:none}
textarea.ti-input{min-height:110px}
.ti-input[aria-invalid="true"]{border-color:#B3241A}
.ti-pills{display:flex;flex-wrap:wrap;gap:.55rem}
.ti-pill{position:relative;display:inline-block}
.ti-pill input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;margin:0}
.ti-pill span{display:inline-flex;align-items:center;min-height:44px;padding:.4rem 1.05rem;border:1.5px solid #CFC5AB;border-radius:999px;background:#fff;font-weight:600;font-size:.96rem;transition:background .15s,border-color .15s,color .15s}
.ti-pill:hover span{border-color:var(--gold-d)}
.ti-pill input:checked+span{background:var(--black);border-color:var(--black);color:var(--gold-l)}
.ti-pill input:focus-visible+span{outline:3px solid var(--gold-d);outline-offset:2px}
.ti-check{display:flex;gap:.65rem;align-items:flex-start;font-weight:500;min-height:32px}
.ti-check input{margin-top:.35rem;width:18px;height:18px;flex:none;accent-color:var(--black)}
.ti-root .ti-error{color:#B3241A;font-size:.94rem;font-weight:600;margin:.3rem 0 0}
.ti-error-summary{border:1.5px solid #D9776D;background:#FFF0EE;border-radius:14px;padding:.9rem 1.1rem;margin-bottom:1.25rem;color:#7A1F16}
.ti-error-summary ul{margin:.4rem 0 0;padding-left:1.1rem}
.ti-root .ti-error-summary a{color:#7A1F16}
.ti-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.ti-submit{width:100%;margin:1.1rem 0 1rem;min-height:56px;font-size:1.08rem}
.ti-done h3{margin-top:0}
.ti-more{border-top:1px solid var(--line);margin:0 0 1.5rem;padding-top:.9rem}
.ti-more>summary{cursor:pointer;font:700 1rem 'Manrope',sans-serif;color:var(--gold-d);padding:.3rem 0}
.ti-more>summary+*{margin-top:1rem}

/* footer */
.ti-footer{padding:3rem 0;border-top:1px solid var(--dline);background:linear-gradient(180deg,#0C0C0D,#000)}
.ti-root .ti-footer p{max-width:70ch;color:var(--soft)}
.ti-root .ti-footer p strong{color:#fff}
.ti-root .ti-footer-note{font-size:.95rem}

/* responsive */
@media (max-width:1100px){
  .ti-menu-btn{display:inline-flex;align-items:center}
  .ti-nav{display:none;position:absolute;left:0;right:0;top:100%;background:#0A0A0B;border-bottom:1px solid var(--dline);padding:1rem 1.25rem 1.25rem;flex-direction:column;align-items:flex-start;gap:.9rem;box-shadow:0 22px 40px -18px rgba(0,0,0,.9)}
  .ti-nav.is-open{display:flex}
}
@media (max-width:980px){
  .ti-bento{grid-template-columns:repeat(2,1fr)}
  .ti-bento .ti-tile:nth-child(n){grid-column:auto}
  .ti-bento .ti-tile:nth-child(n):last-child:nth-child(odd){grid-column:1 / -1}
}
@media (max-width:900px){
  .ti-hero{padding-top:3rem}
  .ti-hero-grid,.ti-two,.ti-book-card,.ti-story,.ti-faq-grid,.ti-band-inner{grid-template-columns:1fr}
  .ti-hero-grid{gap:2.25rem}
  .ti-plaque{justify-self:center}
  .ti-faq-grid>div:first-child{position:static}
  .ti-section{padding:3.5rem 0}
  .ti-hero+.ti-section{padding-top:calc(3.5rem + 2.75rem)}
  .ti-topbar-hours{display:none}
}
@media (max-width:600px){
  .ti-bento{grid-template-columns:1fr}
  .ti-bento .ti-tile:nth-child(n),.ti-bento .ti-tile:nth-child(n):last-child:nth-child(odd){grid-column:auto}
  .ti-grid2{grid-template-columns:1fr}
  .ti-form{padding:1.5rem 1.25rem}
  .ti-book-side{padding:1.75rem 1.4rem}
  .ti-facts>div{grid-template-columns:1fr;gap:.1rem}
  .ti-brand-name{font-size:1rem}
  .ti-story{padding:1.25rem}
  .ti-ledger{padding:1.3rem}
}
@media (prefers-reduced-motion:reduce){
  .ti-root *{transition:none!important;scroll-behavior:auto!important}
  .ti-tile:hover,.ti-tile:hover .ti-ico,.ti-btn:hover,.ti-life:hover{transform:none!important}
}
`;