'use client';

// frontend/components/home-vastu/HomeVastuSite.js
// Public site for an interior designer, interior architect or Vastu consultant.
// One job: turn a visitor into a consultation request. Everything after the request happens offline.
//
// Look: dark orange gradients (ember to burnt sienna to amber) on sandstone, arch-shaped photo frames,
// Cormorant Garamond headings with Jost body text, and one memorable element, the interactive Vastu wheel.
//
// Props:
//   payload   site_build_payload (schema 2.0). Omit to render SAMPLE data.
//   siteSlug  the founder site's slug (needed to submit requests). Falls back to payload.site_slug.
//   demo      force demo mode (never calls the backend). Defaults to true when no payload is given.
//
// Rules enforced in code, not just in copy:
//   - the title "Architect" appears only with a Council of Architecture registration number
//   - projects and client stories render only with recorded consent, and only the parts the client allowed
//   - an availability note older than three months is hidden
//   - Vastu is always presented as a traditional system, never as a promise of any result
//   - credentials are the adviser's own declared details; the site never shows a "verified by us" badge

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  SAMPLE_PAYLOAD,
  CREDENTIAL_KINDS,
  PRESCREEN_GROUPS,
  GROUP_ORDER,
  ADVISER_PHOTO,
  PROJECT_PHOTO,
  mergeTemplateData,
  getPrescreenFields,
  getDisclaimers,
  rulesFor,
  displayRole,
  displayName,
  isStale,
  isVisibleProject,
  isVisibleStory,
  formatDate,
  imageCandidates,
} from '@/lib/home-vastu-schema';
import { validateCustomAnswers, isVisible, optionList } from '@/lib/custom-fields';
import { submitConsultRequest, buildSubmitBody } from '@/lib/study-migration-api';

/* ------------------------------------------------------------------ */
/* Icons (inline, stroke style, matched to a topic by key and title)   */
/* ------------------------------------------------------------------ */

const ICONS = {
  sofa: '<path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5H3z"/><path d="M6 17v2M18 17v2"/>',
  kitchen: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16"/><path d="M8 6h.01M12 6h.01"/><circle cx="12" cy="15" r="3"/>',
  bed: '<path d="M3 18V7"/><path d="M3 14h18v4"/><path d="M21 18v-4a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="11" r="2"/>',
  diya: '<path d="M4 14c0 3 3.5 5 8 5s8-2 8-5z"/><path d="M12 4c2 2.5 2 4.5 0 6-2-1.5-2-3.5 0-6z"/><path d="M8 14l-2-2M16 14l2-2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-.7-1.6-.7-2.6c0-1 .8-1.4 1.7-1.4H17a4 4 0 0 0 4-4c0-4-4-8-9-8z"/><path d="M7.5 11h.01M9.5 7.5h.01M14 7h.01"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  tools: '<path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  brush: '<path d="M18 3l3 3-9 9-3-3z"/><path d="M9 12c-3 0-4 2-4 4 0 1.5-1 2-2 3 3 1 7 .5 8-3"/>',
  house: '<path d="M3 11l9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M10 21v-6h4v6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4 2 4 5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.7"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
};

// Most specific first. An owner can also set `icon` on a service to pick one directly.
const ICON_RULES = [
  [/pooja|puja|mandir|temple|diya/i, 'diya'],
  [/kitchen|wardrobe|modular/i, 'kitchen'],
  [/online|video|remote/i, 'video'],
  [/colou?r|paint|palette/i, 'palette'],
  [/light|lamp/i, 'bulb'],
  [/floor.?plan|layout|before you buy|blueprint/i, 'ruler'],
  [/adjust|correct|remed|tweak|fix/i, 'tools'],
  [/review|audit/i, 'compass'],
  [/renovat|refresh|makeover/i, 'brush'],
  [/office|shop|commercial/i, 'briefcase'],
  [/bed/i, 'bed'],
  [/vastu/i, 'compass'],
  [/full|home|interior|living|sofa/i, 'sofa'],
];

export function iconFor(item) {
  if (item && item.icon && ICONS[item.icon]) return item.icon;
  const hay = `${item?.key || ''} ${item?.title || ''}`;
  const hit = ICON_RULES.find(([re]) => re.test(hay));
  return hit ? hit[1] : 'house';
}

function Icon({ name, className }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.house }} />;
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
    disclaimers: getDisclaimers(td),
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
    .replace(/^(ar\.?|architect)\s+/i, '')
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
const credLine = (c) => `${c.issuing_body}${c.number ? `, number ${c.number}` : ''}${c.valid_until ? `, valid until ${formatDate(c.valid_until)}` : ''}`;

// Soft highlight that follows the pointer on cards.
const trackPointer = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

// Tries each candidate address in order and reports when all have failed. The first attempt is also checked once
// on mount, because a server-rendered <img> can fail before React attaches its error handler.
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

// A photo inside a frame. Falls back to a warm tint with an icon, and in demo mode says which file it looked for.
function Photo({ url, spec, icon = 'image', alt = '', eager }) {
  const { isDemo } = useData();
  const list = imageCandidates(url);
  const img = useImageChain(list);
  const ok = !img.exhausted;
  return (
    <div className="hv-photo">
      {ok ? (
        <img key={img.src} ref={img.ref} src={img.src} alt={alt} width={spec?.width} height={spec?.height} loading={eager ? 'eager' : 'lazy'} onError={img.onError} />
      ) : (
        <div className="hv-ph" aria-hidden="true">
          <Icon name={icon} />
          {isDemo && (
            <span>
              {list.length ? `No image found at ${list[0]}. Save it as frontend/public${list[0]}` : 'No photo address set'}
              {spec ? `. ${spec.width} × ${spec.height} px.` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export default function HomeVastuSite({ payload, siteSlug, demo }) {
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

  const { td, knowledge, rules } = data;
  const projects = td.projects.filter(isVisibleProject);
  const stories = rules.allowStories ? td.success_stories.filter(isVisibleStory) : [];
  const showVastu = td.vastu.enabled;
  const vastuFirst = td.practice.focus === 'vastu';
  const hasFaq = (knowledge.faqs || []).some((f) => f && f.q && f.a);

  const nav = [
    td.services.length ? { id: 'services', label: 'Services' } : null,
    showVastu ? { id: 'vastu', label: 'Vastu' } : null,
    { id: 'process', label: 'Process' },
    projects.length ? { id: 'projects', label: 'Projects' } : null,
    stories.length ? { id: 'stories', label: 'Stories' } : null,
    { id: 'about', label: 'About' },
    hasFaq ? { id: 'faq', label: 'Questions' } : null,
  ].filter(Boolean);

  const servicesBlock = td.services.length > 0 && <Services />;
  const vastuBlock = showVastu && <VastuWheel />;

  return (
    <DataCtx.Provider value={ctx}>
      <div className="hv-root" id="top">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@400;500;600;700&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {isDemo && (
          <div className="hv-demo" role="note">
            Sample site. Every name, number and registration here is fictional, and nothing you type is sent anywhere.
            {rules.summary ? ` Compliance profile: ${rules.name}. ${rules.summary}` : ''}
          </div>
        )}
        <Header nav={nav} />
        <main>
          <Hero />
          {vastuFirst ? vastuBlock : servicesBlock}
          {vastuFirst ? servicesBlock : vastuBlock}
          <Process />
          {projects.length > 0 && <Projects projects={projects} />}
          {stories.length > 0 && <Stories stories={stories} />}
          <About />
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
/* Header and hero                                                     */
/* ------------------------------------------------------------------ */

function Header({ nav }) {
  const { business, frontDoor, openBooking } = useData();
  const [open, setOpen] = useState(false);
  return (
    <header className="hv-header hv-dark">
      <div className="hv-wrap hv-header-row">
        <a href="#top" className="hv-brand">
          <span className="hv-mono" aria-hidden="true">
            {initials(business.name)}
          </span>
          <span className="hv-brand-name">{business.name}</span>
        </a>
        <button type="button" className="hv-menu-btn" aria-expanded={open} aria-controls="hv-nav" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Menu'}
        </button>
        <nav id="hv-nav" className={`hv-nav${open ? ' is-open' : ''}`} aria-label="Main">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <button
            type="button"
            className="hv-btn hv-btn-primary"
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

// Faint Vastu wheel line art behind the hero copy.
function WheelArt() {
  const rays = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg className="hv-wheel-art" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="200" cy="200" r="190" />
        <circle cx="200" cy="200" r="150" />
        <circle cx="200" cy="200" r="70" />
        {rays.map((a) => (
          <line key={a} x1="200" y1="200" x2={200 + 190 * Math.sin((a * Math.PI) / 180)} y2={200 - 190 * Math.cos((a * Math.PI) / 180)} />
        ))}
      </g>
    </svg>
  );
}

function HeroBg({ url }) {
  const list = imageCandidates(url);
  const img = useImageChain(list);
  return (
    <div className="hv-hero-bg" aria-hidden="true">
      {!img.exhausted && <img key={img.src} ref={img.ref} src={img.src} alt="" onError={img.onError} />}
      <WheelArt />
    </div>
  );
}

function Hero() {
  const { business, positioning, frontDoor, td, proof, openBooking } = useData();
  const main = td.credentials[0];
  const person = displayName(business.founder_name || business.name, td);
  const role = displayRole(td);
  const note = td.availability.note && !isStale(td.availability.as_of) ? td.availability : null;
  const stats = (proof.stats || []).filter((s) => s && s.label && s.value).slice(0, 2);
  const strip = [
    main ? { icon: 'shield', label: kindLabel(main.kind), value: main.number || main.issuing_body } : null,
    ...stats.map((s) => ({ icon: 'house', label: s.label, value: s.value })),
    business.response_time ? { icon: 'clock', label: 'Response', value: business.response_time } : null,
  ]
    .filter(Boolean)
    .slice(0, 4);
  return (
    <section className="hv-hero hv-dark" aria-labelledby="hv-h1">
      <HeroBg url={td.media.hero_url} />
      <div className="hv-wrap hv-hero-grid">
        <div className="hv-hero-copy">
          <h1 id="hv-h1">{positioning.headline || business.name}</h1>
          {positioning.subheadline && <p className="hv-lede">{positioning.subheadline}</p>}
          <div className="hv-actions">
            <button type="button" className="hv-btn hv-btn-primary" onClick={() => openBooking()}>
              {frontDoor.cta_label || 'Book a consultation'}
            </button>
            {td.vastu.enabled ? (
              <a className="hv-btn hv-btn-ghost" href="#vastu">
                Explore the Vastu wheel
              </a>
            ) : (
              <a className="hv-btn hv-btn-ghost" href="#process">
                See how we work
              </a>
            )}
          </div>
          {note && (
            <p className="hv-avail">
              <span className="hv-dot" aria-hidden="true" />
              {note.note} <span className="hv-avail-date">As of {formatDate(note.as_of)}.</span>
            </p>
          )}
        </div>

        <aside className="hv-plaque" aria-label="Adviser details">
          <div className="hv-arch hv-arch-adviser">
            <Photo url={business.founder_photo_url} spec={ADVISER_PHOTO} icon="users" eager />
          </div>
          <p className="hv-plaque-name">{person}</p>
          <p className="hv-plaque-role">{role}</p>
          {main && (
            <p className="hv-plaque-line">
              {kindLabel(main.kind)}. {credLine(main)}
            </p>
          )}
          {main?.verify_url && (
            <a className="hv-plaque-link" href={main.verify_url} target="_blank" rel="noopener noreferrer">
              Check on the official register
            </a>
          )}
        </aside>
      </div>
      {strip.length > 0 && (
        <div className="hv-wrap hv-strip">
          {strip.map((s) => (
            <div key={s.label} className="hv-strip-item">
              <span className="hv-strip-ico">
                <Icon name={s.icon} />
              </span>
              <span>
                <span className="hv-strip-label">{s.label}</span>
                <strong>{s.value}</strong>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Services (main conversion surface)                                  */
/* ------------------------------------------------------------------ */

const GROUP_LABEL = { interior: 'Interior design', vastu: 'Vastu' };

function Services() {
  const { td, openBooking } = useData();
  return (
    <section className="hv-section hv-sand hv-services" id="services" aria-labelledby="hv-svc-h">
      <div className="hv-wrap">
        <div className="hv-sec-head">
          <h2 id="hv-svc-h">How we can help</h2>
          <p className="hv-lede-sm">Choose the topic closest to your home. We will start the conversation there.</p>
        </div>
        <div className="hv-bento">
          {td.services.map((s) => (
            <article key={s.key || s.title} className="hv-tile" onMouseMove={trackPointer}>
              <span className="hv-ico">
                <Icon name={iconFor(s)} />
              </span>
              {GROUP_LABEL[s.group] && <span className="hv-tag">{GROUP_LABEL[s.group]}</span>}
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              {(s.included || []).length > 0 && (
                <ul className="hv-ticks">
                  {s.included.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              )}
              <button type="button" className="hv-link" onClick={() => openBooking({ need: s.key || s.title })}>
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
/* Vastu wheel                                                         */
/* ------------------------------------------------------------------ */

const CX = 200;
const CY = 200;
const R_OUT = 168;
const R_IN = 66;
const pt = (r, a) => {
  const t = (a * Math.PI) / 180;
  return [CX + r * Math.sin(t), CY - r * Math.cos(t)];
};
const f = (n) => n.toFixed(2);
function segPath(a) {
  const a1 = a - 22.5 + 1.2;
  const a2 = a + 22.5 - 1.2;
  const [x1, y1] = pt(R_OUT, a1);
  const [x2, y2] = pt(R_OUT, a2);
  const [x3, y3] = pt(R_IN, a2);
  const [x4, y4] = pt(R_IN, a1);
  return `M${f(x1)} ${f(y1)} A${R_OUT} ${R_OUT} 0 0 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${R_IN} ${R_IN} 0 0 0 ${f(x4)} ${f(y4)}Z`;
}

function VastuWheel() {
  const { td, disclaimers, openBooking } = useData();
  const v = td.vastu;
  const [sel, setSel] = useState('NE');
  const zone = v.zones.find((z) => z.key === sel) || v.zones[0];
  const vastuKey = td.services.find((s) => s.group === 'vastu');
  const onKey = (key) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSel(key);
    }
  };
  const disc = disclaimers.vastu;
  return (
    <section className="hv-section hv-dark hv-vastu" id="vastu" aria-labelledby="hv-vastu-h">
      <div className="hv-wrap hv-vastu-grid">
        <div className="hv-wheel-wrap">
          <svg className="hv-wheel" viewBox="0 0 400 400" role="group" aria-label="Vastu direction wheel. Choose a direction to see what we look at.">
            <defs>
              <linearGradient id="hv-wheel-sel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFB766" />
                <stop offset="1" stopColor="#E8611A" />
              </linearGradient>
            </defs>
            <circle cx={CX} cy={CY} r="186" fill="none" stroke="rgba(245,154,74,.28)" strokeWidth="1" />
            <circle cx={CX} cy={CY} r="180" fill="none" stroke="rgba(245,154,74,.14)" strokeWidth="1" strokeDasharray="2 6" />
            {v.zones
              .filter((z) => z.angle !== null)
              .map((z) => {
                const on = z.key === sel;
                const [lx, ly] = pt(117, z.angle);
                return (
                  <g
                    key={z.key}
                    className={`hv-seg${on ? ' is-on' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={on}
                    aria-label={z.label}
                    onClick={() => setSel(z.key)}
                    onKeyDown={onKey(z.key)}
                  >
                    <path d={segPath(z.angle)} fill={on ? 'url(#hv-wheel-sel)' : undefined} />
                    <text x={f(lx)} y={f(ly)} textAnchor="middle" dominantBaseline="central">
                      {z.code}
                    </text>
                  </g>
                );
              })}
            {(() => {
              const c = v.zones.find((z) => z.key === 'C');
              if (!c) return null;
              const on = sel === 'C';
              return (
                <g className={`hv-seg hv-seg-c${on ? ' is-on' : ''}`} role="button" tabIndex={0} aria-pressed={on} aria-label={c.label} onClick={() => setSel('C')} onKeyDown={onKey('C')}>
                  <circle cx={CX} cy={CY} r={R_IN - 10} fill={on ? 'url(#hv-wheel-sel)' : undefined} />
                  <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central">
                    Centre
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        <div>
          <h2 id="hv-vastu-h">Vastu, explained without fear</h2>
          <p className="hv-lede-sm">{v.intro}</p>
          <div className="hv-zone" aria-live="polite">
            <h3>
              {zone.label}
              {zone.code !== 'C' ? ` (${zone.code})` : ''}
            </h3>
            <p className="hv-zone-sub">What we look at here</p>
            <ul className="hv-ticks">
              {zone.areas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            {zone.note && <p className="hv-zone-note">{zone.note}</p>}
            <button
              type="button"
              className="hv-btn hv-btn-primary"
              onClick={() => openBooking({ need: vastuKey ? vastuKey.key || vastuKey.title : '', note: `Vastu question about the ${zone.label} of my home` })}
            >
              Ask us about this direction
            </button>
          </div>
          {v.note && <p className="hv-muted">{v.note}</p>}
          {disc && <p className="hv-fine">{disc}</p>}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Process                                                             */
/* ------------------------------------------------------------------ */

function Process() {
  const { td, openBooking } = useData();
  return (
    <section className="hv-section hv-sand2" id="process" aria-labelledby="hv-proc-h">
      <div className="hv-wrap hv-proc-grid">
        <div>
          <h2 id="hv-proc-h">What happens after you send a request</h2>
          <ol className="hv-steps">
            {td.journey_steps.map((s, i) => (
              <li key={s.key || i}>
                <span className="hv-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span>
                  <strong>{s.label}</strong>
                  <span className="hv-muted">{s.description}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="hv-ready hv-dark">
          <h3>Helpful to have ready</h3>
          <ul className="hv-ticks">
            {td.checklist.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="hv-fine">Do not have these yet? No problem. We will guide you on the call.</p>
          <button type="button" className="hv-btn hv-btn-primary" onClick={() => openBooking()}>
            Start with a request
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Projects (consent-gated)                                            */
/* ------------------------------------------------------------------ */

function ProjectCard({ p }) {
  const [before, setBefore] = useState(false);
  const scope = p.consent_scope || [];
  const showName = scope.includes('name') && p.client_first_name;
  const meta = [p.city, p.bhk, p.area_sqft ? `${Number(p.area_sqft).toLocaleString('en-IN')} sq ft` : '', p.style, p.duration_text].filter(Boolean);
  return (
    <figure className="hv-project">
      <div className="hv-arch">
        <Photo url={before && p.before_url ? p.before_url : p.image_url} spec={PROJECT_PHOTO} icon="sofa" alt={p.title} />
        {p.before_url && (
          <button type="button" className="hv-toggle" aria-pressed={before} onClick={() => setBefore((b) => !b)}>
            {before ? 'Show after' : 'Show before'}
          </button>
        )}
      </div>
      <figcaption>
        <strong>{p.title}</strong>
        {p.summary && <span className="hv-muted">{p.summary}</span>}
        {meta.length > 0 && <span className="hv-meta">{meta.join(' · ')}</span>}
        {showName && <span className="hv-muted">For {p.client_first_name}</span>}
      </figcaption>
    </figure>
  );
}

const TAG_LABEL = { living: 'Living', kitchen: 'Kitchen', bedroom: 'Bedroom', pooja: 'Pooja room', full_home: 'Full home', bathroom: 'Bathroom', study: 'Study' };

function Projects({ projects }) {
  const { openBooking } = useData();
  const tags = [...new Set(projects.flatMap((p) => p.tags || []))];
  const [tag, setTag] = useState('all');
  const list = tag === 'all' ? projects : projects.filter((p) => (p.tags || []).includes(tag));
  return (
    <section className="hv-section hv-sand" id="projects" aria-labelledby="hv-proj-h">
      <div className="hv-wrap">
        <div className="hv-sec-head">
          <h2 id="hv-proj-h">Homes we have designed</h2>
          <p className="hv-muted">Shared with each client’s permission. Every home is different, and yours will be too.</p>
        </div>
        {tags.length > 1 && (
          <div className="hv-tabs" role="group" aria-label="Filter projects">
            {['all', ...tags].map((t) => (
              <button key={t} type="button" className="hv-tab" aria-pressed={tag === t} onClick={() => setTag(t)}>
                {t === 'all' ? 'All' : TAG_LABEL[t] || t}
              </button>
            ))}
          </div>
        )}
        <div className="hv-projects">
          {list.map((p) => (
            <ProjectCard key={p.key || p.title} p={p} />
          ))}
        </div>
        <div className="hv-center">
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => openBooking()}>
            Tell us about your home
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stories (consent-gated, hidden for registered architects)           */
/* ------------------------------------------------------------------ */

function Stories({ stories }) {
  return (
    <section className="hv-section hv-sand2" id="stories" aria-labelledby="hv-story-h">
      <div className="hv-wrap">
        <h2 id="hv-story-h">Client words</h2>
        <p className="hv-muted hv-intro">Shared with each client’s permission. Every home is different, and your experience may differ.</p>
        <div className="hv-stories">
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
              <figure key={`${s.first_name}-${i}`} className="hv-story">
                <blockquote>{s.quote}</blockquote>
                <figcaption>
                  <strong>{showName ? s.first_name : 'A client'}</strong>
                  {facts.length > 0 && (
                    <dl className="hv-facts">
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
/* About and credentials                                               */
/* ------------------------------------------------------------------ */

function About() {
  const { business, positioning, td, disclaimers } = useData();
  const years = business.year_started ? new Date().getFullYear() - Number(business.year_started) : null;
  const forWho = Array.isArray(positioning.for_who) ? positioning.for_who : positioning.for_who ? [positioning.for_who] : [];
  return (
    <section className="hv-section hv-sand" id="about" aria-labelledby="hv-about-h">
      <div className="hv-wrap hv-two">
        <div>
          <h2 id="hv-about-h">About and credentials</h2>
          {paragraphs(business.about).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <dl className="hv-facts">
            {years > 0 && (
              <div>
                <dt>In practice since</dt>
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
              <ul className="hv-ticks hv-ticks-dark">
                {forWho.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="hv-ledger hv-dark">
          <h3>Registration and membership</h3>
          {td.credentials.length === 0 ? (
            <p>{disclaimers.role || 'No registration details have been added yet.'}</p>
          ) : (
            <ul className="hv-creds">
              {td.credentials.map((c, i) => (
                <li key={`${c.kind}-${c.number}-${i}`}>
                  <strong>{kindLabel(c.kind)}</strong>
                  <span>{credLine(c)}</span>
                  {c.verify_url && (
                    <a href={c.verify_url} target="_blank" rel="noopener noreferrer">
                      Check on the official register
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="hv-notice">
            <p>{disclaimers.general}</p>
            {disclaimers.vastu && <p>{disclaimers.vastu}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function Faq() {
  const { knowledge, openBooking } = useData();
  const faqs = (knowledge.faqs || []).filter((f) => f && f.q && f.a);
  return (
    <section className="hv-section hv-sand2" id="faq" aria-labelledby="hv-faq-h">
      <div className="hv-wrap hv-faq-grid">
        <div>
          <h2 id="hv-faq-h">Questions we are often asked</h2>
          <p className="hv-muted">Cannot find your question? Send us a request and we will answer it on the call.</p>
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => openBooking()}>
            Ask us directly
          </button>
        </div>
        <div className="hv-faq">
          {faqs.map((q) => (
            <details key={q.q}>
              <summary>{q.q}</summary>
              <p>{q.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Contact and consultation request                                    */
/* ------------------------------------------------------------------ */

function Book() {
  const { business, td } = useData();
  const next = td.journey_steps.slice(1, 4);
  return (
    <section className="hv-section hv-dark hv-book" id="book" aria-labelledby="hv-book-h">
      <div className="hv-wrap">
        <div className="hv-book-card">
          <div className="hv-book-side">
            <h2 id="hv-book-h">Request a consultation</h2>
            <p className="hv-lede-sm">Tell us about your home and we will call you to confirm a time.</p>
            <ul className="hv-contact">
              {business.phone && (
                <li>
                  <span className="hv-strip-ico">
                    <Icon name="phone" />
                  </span>
                  <a href={telHref(business.phone)}>{business.phone}</a>
                </li>
              )}
              {business.whatsapp && (
                <li>
                  <span className="hv-strip-ico">
                    <Icon name="chat" />
                  </span>
                  <a href={waHref(business.whatsapp)} target="_blank" rel="noopener noreferrer">
                    WhatsApp {business.whatsapp}
                  </a>
                </li>
              )}
              {business.email && (
                <li>
                  <span className="hv-strip-ico">
                    <Icon name="mail" />
                  </span>
                  <a href={`mailto:${business.email}`}>{business.email}</a>
                </li>
              )}
              {business.hours && (
                <li>
                  <span className="hv-strip-ico">
                    <Icon name="clock" />
                  </span>
                  <span>{business.hours}</span>
                </li>
              )}
              {business.address && (
                <li>
                  <span className="hv-strip-ico">
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
                <ol className="hv-next">
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
  const id = `hv-f-${def.key}`;
  const errId = `${id}-err`;
  const opts = optionList(def);
  const req = def.required ? <span className="hv-req"> (required)</span> : null;
  const wide = WIDE_TYPES.includes(def.type) ? ' is-wide' : '';
  const err = error ? (
    <p className="hv-error" id={errId}>
      {error}
    </p>
  ) : null;
  const common = { id, name: def.key, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errId : undefined };

  if (def.type === 'checkbox') {
    return (
      <div className="hv-field is-wide">
        <label className="hv-check">
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
      <fieldset className={`hv-field hv-fieldset-inner${wide}`} id={id} aria-describedby={error ? errId : undefined}>
        <legend>
          {def.label}
          {req}
        </legend>
        <div className="hv-pills">
          {opts.map((o) => (
            <label key={o.value} className="hv-pill">
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
      <fieldset className={`hv-field hv-fieldset-inner${wide}`} id={id} aria-describedby={error ? errId : undefined}>
        <legend>
          {def.label}
          {req}
        </legend>
        <div className="hv-pills">
          {[
            ['yes', 'Yes'],
            ['no', 'No'],
          ].map(([v, l]) => (
            <label key={v} className="hv-pill">
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
    <div className={`hv-field${wide}`}>
      <label htmlFor={id}>
        {def.label}
        {req}
      </label>
      {def.type === 'long_text' ? (
        <textarea {...common} className="hv-input" rows={4} maxLength={2000} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : def.type === 'select' ? (
        <select {...common} className="hv-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
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
          className="hv-input"
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
  const { td, business, slug, isDemo, prefill } = useData();
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

  // "Talk to us about this" and similar buttons elsewhere on the page.
  useEffect(() => {
    if (!prefill.nonce) return;
    setProfile((p) => {
      const next = { ...p };
      if (prefill.need) {
        const cur = Array.isArray(p.need) ? p.need : [];
        if (!cur.includes(prefill.need)) next.need = [...cur, prefill.need];
      }
      if (prefill.note && !p.message) next.message = prefill.note;
      return next;
    });
  }, [prefill]);

  const isShown = (fd) => {
    if (!fd.showIf) return true;
    const cur = profile[fd.showIf.key];
    if (fd.showIf.anyOf) return Array.isArray(cur) && cur.some((x) => fd.showIf.anyOf.includes(x));
    return cur === fd.showIf.equals;
  };
  const shown = builtIn.filter(isShown);
  const ctx = { ...profile, ...custom };
  const visibleCustom = customDefs.filter((d) => isVisible(d, ctx));
  const setP = (key) => (v) => setProfile((p) => ({ ...p, [key]: v }));
  const setC = (key) => (v) => setCustom((p) => ({ ...p, [key]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};

    const cleanProfile = {};
    shown.forEach((fd) => {
      const v = profile[fd.key];
      if (isEmptyVal(v)) {
        if (fd.required) errs[fd.key] = 'This answer is required.';
        return;
      }
      if (fd.type === 'email' && !EMAIL_RE.test(String(v).trim())) {
        errs[fd.key] = 'Enter a valid email address.';
        return;
      }
      if (fd.type === 'tel' && digits(v).length < 10) {
        errs[fd.key] = 'Enter a mobile number with at least 10 digits.';
        return;
      }
      cleanProfile[fd.key] = typeof v === 'string' ? v.trim() : v;
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
      if (shown.some((fd) => errs[fd.key] && !PRIMARY_GROUPS.includes(fd.group))) setMoreOpen(true);
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
      <div className="hv-form hv-done" ref={doneRef} tabIndex={-1} role="status">
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
  const grouped = GROUP_ORDER.map((g) => ({ g, fields: shown.filter((fd) => fd.group === g) })).filter((x) => x.fields.length > 0);
  const primary = grouped.filter((x) => PRIMARY_GROUPS.includes(x.g));
  const secondary = grouped.filter((x) => !PRIMARY_GROUPS.includes(x.g));
  const renderGroup = ({ g, fields }) => (
    <fieldset className="hv-fs" key={g}>
      <legend>{PRESCREEN_GROUPS[g]}</legend>
      <div className="hv-grid2">
        {fields.map((fd) => (
          <Field key={fd.key} def={fd} value={profile[fd.key]} onChange={setP(fd.key)} error={errors[fd.key]} />
        ))}
      </div>
    </fieldset>
  );

  return (
    <form className="hv-form" noValidate onSubmit={onSubmit} aria-labelledby="hv-book-h">
      {(errorList.length > 0 || serverMsg) && (
        <div className="hv-error-summary" ref={summaryRef} tabIndex={-1} role="alert">
          <strong>{serverMsg || 'Please fix the following before sending.'}</strong>
          {errorList.length > 0 && (
            <ul>
              {errorList.map(([k, m]) => (
                <li key={k}>
                  <a href={`#hv-f-${k}`}>{m}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {primary.map(renderGroup)}

      <fieldset className="hv-fs">
        <legend>When should we call you?</legend>
        <div className="hv-grid2">
          <div className="hv-field">
            <label htmlFor="hv-f-date">Preferred date (optional)</label>
            <input id="hv-f-date" className="hv-input" type="date" min={minDate || undefined} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <fieldset className="hv-field hv-fieldset-inner">
            <legend>Time of day</legend>
            <div className="hv-pills">
              {TIME_PARTS.map(([v, l]) => (
                <label key={l} className="hv-pill">
                  <input type="radio" name="part_of_day" checked={part === v} onChange={() => setPart(v)} />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </fieldset>

      {secondary.length > 0 && (
        <details className="hv-more" open={moreOpen} onToggle={(e) => setMoreOpen(e.currentTarget.open)}>
          <summary>Add more detail (optional, helps us prepare)</summary>
          {secondary.map(renderGroup)}
        </details>
      )}

      {visibleCustom.length > 0 && (
        <fieldset className="hv-fs">
          <legend>A few more questions</legend>
          <div className="hv-grid2">
            {visibleCustom.map((d) => (
              <Field key={d.key} def={{ ...d, options: d.options }} value={custom[d.key]} onChange={setC(d.key)} error={errors[d.key]} />
            ))}
          </div>
        </fieldset>
      )}

      <div className="hv-hp" aria-hidden="true">
        <label htmlFor="hv-f-website">Leave this field empty</label>
        <input id="hv-f-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>

      <div className="hv-field">
        <label className="hv-check">
          <input id="hv-f-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={errors.consent ? true : undefined} />
          <span>
            I agree that {business.name} may store and use the details I have entered to respond to my request. I have read the{' '}
            <a href={privacyHref} {...(policies.privacy?.url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              privacy policy
            </a>
            . (required)
          </span>
        </label>
        {errors.consent && <p className="hv-error">{errors.consent}</p>}
      </div>

      <button type="submit" className="hv-btn hv-btn-primary hv-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending request' : 'Send consultation request'}
      </button>
      <p className="hv-muted">Please do not share your full address, ID numbers or bank details here. We will tell you how to share plans and photos securely later.</p>
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
    ['refund', 'Refund policy'],
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
    <section className="hv-section hv-sand" id="policies" aria-labelledby="hv-pol-h">
      <div className="hv-wrap">
        <h2 id="hv-pol-h">Policies and complaints</h2>
        <div className="hv-faq">
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
          <p className="hv-complaints">
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
  const { business, disclaimers, td } = useData();
  const entries = policyEntries(td);
  return (
    <footer className="hv-footer hv-dark">
      <div className="hv-wrap">
        <p>
          <strong>{business.name}</strong>
          {business.city ? `, ${business.city}` : ''}
        </p>
        <p className="hv-footer-note">{disclaimers.general}</p>
        {disclaimers.vastu && <p className="hv-footer-note">{disclaimers.vastu}</p>}
        {entries.length > 0 && (
          <nav className="hv-links" aria-label="Policies">
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
/* Styles (scoped to .hv-root). Dark orange gradient on sandstone.     */
/* ------------------------------------------------------------------ */

const CSS = `
.hv-root{--ember:#140A05;--sienna:#7A2306;--terra:#C2410C;--amber:#F59A4A;--amber-l:#FFCB94;--sand:#FBF3E8;--sand2:#F4E6D3;--line:#E7D5BE;--ink:#2A1810;--muted:#6A5546;--soft:#D9C3AE;--link:#A8380A;--dline:rgba(245,154,74,.32);
  --grad:linear-gradient(135deg,#4A1503 0%,#9A3208 45%,#DB6A1E 100%);
  --grad-dark:linear-gradient(120deg,#140A05 0%,#3A1204 55%,#7A2306 100%);
  --grad-cta:linear-gradient(135deg,#FFB766 0%,#F0761F 100%);
  --shadow-s:0 1px 2px rgba(60,25,8,.08),0 4px 14px rgba(60,25,8,.07);--shadow-m:0 20px 46px -20px rgba(60,25,8,.45);
  font-family:'Jost',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--sand);line-height:1.65;font-size:1.0625rem;min-height:100vh}
.hv-root *,.hv-root *::before,.hv-root *::after{box-sizing:border-box}
.hv-root h1,.hv-root h2,.hv-root h3,.hv-root h4{font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-weight:600;line-height:1.08;letter-spacing:-0.005em;margin:0 0 .75rem;color:var(--ink)}
.hv-root h1{font-size:clamp(2.6rem,5.6vw,4.4rem)}
.hv-root h2{font-size:clamp(2.1rem,4vw,3.1rem)}
.hv-root h3{font-size:1.55rem;margin-top:1.75rem}
.hv-root p{margin:0 0 1rem;max-width:68ch}
.hv-root a{color:var(--link);text-underline-offset:3px}
.hv-root a:hover{color:var(--ember)}
.hv-root :focus-visible{outline:3px solid var(--terra);outline-offset:2px}
.hv-wrap{max-width:1140px;margin:0 auto;padding:0 1.25rem;position:relative}
.hv-root .hv-muted{color:var(--muted);font-size:.98rem}
.hv-root .hv-lede{font-size:1.28rem;color:#F1DFCB;max-width:34rem}
.hv-root .hv-lede-sm{font-size:1.12rem;color:var(--muted)}
.hv-root .hv-intro{margin-bottom:1.5rem}
.hv-root .hv-fine{font-size:.9rem;color:var(--soft);margin-top:1.2rem}
.hv-root .hv-center{display:flex;justify-content:center;margin-top:2.5rem}
.hv-sec-head{max-width:44rem}

/* dark surfaces */
.hv-dark{background:var(--ember);color:#F1E4D3}
.hv-root .hv-dark h1,.hv-root .hv-dark h2,.hv-root .hv-dark h3{color:#fff}
.hv-root .hv-dark a:not(.hv-btn){color:var(--amber-l)}
.hv-root .hv-dark a:not(.hv-btn):hover{color:#fff}
.hv-root .hv-dark .hv-lede-sm,.hv-root .hv-dark .hv-muted{color:var(--soft)}
.hv-dark :focus-visible{outline-color:var(--amber-l)}
.hv-root .hv-dark .hv-form h3{color:var(--ink)}
.hv-root .hv-dark .hv-form a:not(.hv-btn){color:var(--link)}
.hv-root .hv-dark .hv-form .hv-muted{color:var(--muted)}
.hv-root .hv-dark .hv-form .hv-error-summary a{color:#7A1F16}
.hv-root .hv-header a.hv-brand{color:#fff}

.hv-demo{background:#241108;color:var(--amber-l);padding:.55rem 1rem;font-size:.92rem;font-weight:600;text-align:center;border-bottom:1px solid var(--dline)}

/* buttons */
.hv-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:.6rem 1.55rem;border-radius:999px;border:1.5px solid transparent;font:600 1rem 'Jost',system-ui,sans-serif;cursor:pointer;text-decoration:none;transition:filter .15s,box-shadow .15s,transform .15s,background .15s,color .15s,border-color .15s}
.hv-root .hv-btn-primary{background:var(--grad-cta);color:#140A05;box-shadow:0 12px 28px -14px rgba(240,118,31,.95)}
.hv-root .hv-btn-primary:hover{filter:brightness(1.06);transform:translateY(-1px);color:#140A05}
.hv-btn-primary:disabled{opacity:.6;cursor:progress;transform:none}
.hv-root .hv-btn-ghost{background:transparent;color:var(--ember);border-color:var(--ember)}
.hv-root .hv-btn-ghost:hover{background:var(--ember);color:var(--amber-l)}
.hv-root .hv-dark .hv-btn-ghost{color:var(--amber-l);border-color:var(--amber)}
.hv-root .hv-dark .hv-btn-ghost:hover{background:rgba(245,154,74,.18);color:#fff}
.hv-actions{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:1.75rem}

/* header */
.hv-header{position:sticky;top:0;z-index:30;background:var(--grad-dark);border-bottom:1px solid var(--dline);box-shadow:0 8px 28px -16px rgba(0,0,0,.7)}
.hv-header-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:76px}
.hv-brand{display:inline-flex;align-items:center;gap:.8rem;text-decoration:none;min-width:0}
.hv-mono{flex:none;width:2.7rem;height:2.7rem;border-radius:999px 999px 10px 10px;background:var(--grad-cta);color:#140A05;display:grid;place-items:center;font:700 1.1rem 'Cormorant Garamond',Georgia,serif}
.hv-brand-name{font:600 1.45rem 'Cormorant Garamond',Georgia,serif;line-height:1.1}
.hv-nav{display:flex;align-items:center;gap:1.4rem}
.hv-nav a{white-space:nowrap}
.hv-root .hv-nav a:not(.hv-btn){color:#F6E7D4;text-decoration:none;font-weight:500;padding:.35rem 0;background:linear-gradient(var(--amber),var(--amber)) left bottom/0 2px no-repeat;transition:background-size .25s,color .2s}
.hv-root .hv-nav a:not(.hv-btn):hover{color:#fff;background-size:100% 2px}
.hv-nav .hv-btn{min-height:44px;padding:.4rem 1.25rem;white-space:nowrap}
.hv-menu-btn{display:none;min-height:44px;padding:.4rem 1rem;border:1.5px solid var(--amber);border-radius:999px;background:transparent;color:var(--amber-l);font:600 .95rem 'Jost',sans-serif;cursor:pointer}

/* hero */
.hv-hero{position:relative;padding:5rem 0 0;background:var(--grad-dark)}
.hv-hero-bg{position:absolute;inset:0;overflow:hidden;background:var(--grad)}
.hv-hero-bg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hv-hero-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,rgba(20,10,5,.94) 0%,rgba(74,21,3,.82) 42%,rgba(154,50,8,.55) 78%,rgba(219,106,30,.4) 100%)}
.hv-wheel-art{position:absolute;z-index:1;right:-6%;top:50%;width:min(720px,80vw);transform:translateY(-50%);color:rgba(255,203,148,.16)}
.hv-hero-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:3.5rem;align-items:center;margin-bottom:3.5rem;z-index:2}
.hv-avail{display:flex;align-items:center;gap:.6rem;margin:1.4rem 0 0;color:#F6E7D4;font-weight:500;font-size:.98rem}
.hv-avail-date{color:var(--soft);font-size:.9rem}
.hv-dot{flex:none;width:.6rem;height:.6rem;border-radius:50%;background:var(--amber);box-shadow:0 0 0 5px rgba(245,154,74,.25)}
.hv-plaque{justify-self:end;width:100%;max-width:340px;text-align:center}
.hv-arch{position:relative;border-radius:999px 999px 26px 26px;overflow:hidden;background:var(--grad)}
.hv-arch-adviser{aspect-ratio:4 / 5;border:2px solid rgba(255,203,148,.55);box-shadow:0 0 0 9px rgba(245,154,74,.14),0 34px 60px -30px rgba(0,0,0,.9)}
.hv-photo{position:absolute;inset:0}
.hv-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 25%;display:block}
.hv-ph{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;padding:2rem 1.4rem;text-align:center;background:linear-gradient(160deg,#F7D9BC,#E9A877);color:#7A2306}
.hv-ph svg{width:2.4rem;height:2.4rem;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.hv-ph span{font-size:.82rem;font-weight:600;line-height:1.35}
.hv-root .hv-plaque-name{font:600 1.9rem 'Cormorant Garamond',Georgia,serif;color:#fff;margin:1.4rem 0 .1rem}
.hv-root .hv-plaque-role{color:var(--amber-l);margin:0 0 .6rem;font-weight:500}
.hv-root .hv-plaque-line{margin:0 auto .3rem;color:#E8D5BF;font-size:.95rem}
.hv-plaque-link{font-weight:600;font-size:.95rem}

/* trust strip overlapping into the next section */
.hv-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:-2.75rem;z-index:3}
.hv-strip-item{display:flex;align-items:center;gap:.9rem;background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:20px;padding:1rem 1.15rem;box-shadow:var(--shadow-m)}
.hv-strip-item>span:last-child{display:grid;line-height:1.35;min-width:0}
.hv-strip-label{font-size:.85rem;color:var(--muted);font-weight:500}
.hv-strip-ico{flex:none;width:2.6rem;height:2.6rem;border-radius:999px 999px 10px 10px;background:var(--grad);display:grid;place-items:center}
.hv-strip-ico svg{width:1.2rem;height:1.2rem;stroke:#FFE6C9;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}

/* sections */
.hv-section{padding:5.5rem 0;position:relative}
.hv-hero+.hv-section{padding-top:calc(5.5rem + 2.75rem)}
.hv-sand{background:var(--sand)}
.hv-sand2{background:linear-gradient(180deg,var(--sand2),#F0DEC6)}

/* services: bento tiles with topic icons */
.hv-bento{display:grid;grid-template-columns:repeat(6,1fr);gap:1.1rem;margin-top:2.25rem;grid-auto-flow:dense}
.hv-tile{grid-column:span 2;position:relative;isolation:isolate;overflow:hidden;display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:26px;padding:1.6rem;box-shadow:var(--shadow-s);transition:transform .28s,border-color .28s,box-shadow .28s}
.hv-tile::before{content:'';position:absolute;inset:0;z-index:-1;background:radial-gradient(340px circle at var(--mx,75%) var(--my,0%),rgba(245,154,74,.26),transparent 62%);opacity:.4;transition:opacity .3s}
.hv-tile:hover{transform:translateY(-4px);border-color:var(--amber);box-shadow:var(--shadow-m)}
.hv-tile:hover::before{opacity:1}
.hv-tile:nth-child(5n+1),.hv-tile:nth-child(5n+2){grid-column:span 3}
.hv-tile:last-child:nth-child(5n+1),.hv-tile:last-child:nth-child(5n+3){grid-column:span 6}
.hv-tile:last-child:nth-child(5n+4){grid-column:span 4}
.hv-root .hv-tile h3{margin:0 0 .5rem;font-size:1.6rem}
.hv-root .hv-tile p{color:var(--muted);font-size:1rem;max-width:none}
.hv-ico{width:3.3rem;height:3.3rem;border-radius:999px 999px 14px 14px;background:var(--grad);color:#FFE6C9;display:grid;place-items:center;margin-bottom:.9rem;flex:none;box-shadow:0 14px 26px -14px rgba(154,50,8,.9);transition:transform .35s}
.hv-tile:hover .hv-ico{transform:translateY(-3px) scale(1.06)}
.hv-ico svg{width:1.6rem;height:1.6rem;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.hv-tag{position:absolute;top:1.5rem;right:1.5rem;font-size:.8rem;font-weight:600;color:var(--sienna);background:#FDE7D0;border-radius:999px;padding:.15rem .7rem}
.hv-ticks{list-style:none;margin:.2rem 0 1rem;padding:0;display:grid;gap:.4rem}
.hv-ticks li{position:relative;padding-left:1.5rem;font-size:.98rem}
.hv-ticks li::before{content:'';position:absolute;left:.15rem;top:.42em;width:.34rem;height:.62rem;border:solid var(--amber);border-width:0 2px 2px 0;transform:rotate(45deg)}
.hv-ticks-dark li::before,.hv-tile .hv-ticks li::before{border-color:var(--terra)}
.hv-link{margin-top:auto;padding:1rem 0 0;align-self:flex-start;background:none;border:0;color:var(--link);font:600 1rem 'Jost',sans-serif;cursor:pointer;text-decoration:underline;text-decoration-color:rgba(168,56,10,.35);text-underline-offset:6px;transition:color .2s,text-decoration-color .2s}
.hv-link:hover{color:var(--ember);text-decoration-color:var(--terra)}

/* vastu wheel */
.hv-vastu{background:radial-gradient(48rem 26rem at 0% 0%,rgba(219,106,30,.30),transparent 62%),radial-gradient(40rem 24rem at 100% 100%,rgba(154,50,8,.35),transparent 62%),var(--grad-dark)}
.hv-vastu-grid{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:3.5rem;align-items:center}
.hv-wheel-wrap{max-width:470px;width:100%;justify-self:center}
.hv-wheel{width:100%;height:auto;display:block;filter:drop-shadow(0 30px 40px rgba(0,0,0,.45))}
.hv-seg{cursor:pointer;outline:none}
.hv-seg path,.hv-seg circle{fill:rgba(245,154,74,.10);stroke:rgba(245,154,74,.5);stroke-width:1;transition:fill .2s,stroke .2s}
.hv-seg:hover path,.hv-seg:hover circle{fill:rgba(245,154,74,.24)}
.hv-seg.is-on path,.hv-seg.is-on circle{stroke:#FFE0BC}
.hv-seg:focus-visible path,.hv-seg:focus-visible circle{stroke:#fff;stroke-width:2.5}
.hv-seg text{font:600 15px 'Jost',sans-serif;fill:#F6E7D4;pointer-events:none;letter-spacing:.02em}
.hv-seg.is-on text{fill:#140A05}
.hv-seg-c text{font-size:14px}
.hv-zone{background:rgba(255,255,255,.06);border:1px solid var(--dline);border-radius:26px;padding:1.6rem 1.7rem;margin-top:1.5rem;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.hv-zone h3{margin-top:0;font-size:1.9rem}
.hv-root .hv-zone-sub{color:var(--amber-l);font-weight:600;margin:0 0 .5rem}
.hv-root .hv-zone-note{color:#F1DFCB;font-style:italic;margin:.2rem 0 1.2rem}
.hv-zone .hv-ticks li::before{border-color:var(--amber)}

/* process */
.hv-proc-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:3rem;align-items:start}
.hv-steps{list-style:none;margin:1.75rem 0 0;padding:0;display:grid;gap:.9rem}
.hv-steps li{display:flex;gap:1rem;align-items:flex-start;background:#fff;border:1px solid var(--line);border-radius:20px;padding:1rem 1.2rem;box-shadow:var(--shadow-s)}
.hv-steps li>span:last-child{display:grid;gap:.1rem}
.hv-num{flex:none;width:2.6rem;height:2.6rem;border-radius:999px 999px 10px 10px;background:var(--grad);color:#FFE6C9;display:grid;place-items:center;font:700 1.2rem 'Cormorant Garamond',Georgia,serif}
.hv-ready{border:1px solid var(--dline);border-radius:26px;padding:1.8rem;background:var(--grad-dark);box-shadow:var(--shadow-m)}
.hv-ready h3{margin-top:0}
.hv-ready .hv-ticks li::before{border-color:var(--amber)}

/* projects */
.hv-tabs{display:flex;flex-wrap:wrap;gap:.55rem;margin:1.75rem 0 0}
.hv-tab{min-height:42px;padding:.35rem 1.1rem;border:1.5px solid #D9BFA0;border-radius:999px;background:#fff;color:var(--ink);font:600 .95rem 'Jost',sans-serif;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.hv-tab:hover{border-color:var(--terra)}
.hv-tab[aria-pressed="true"]{background:var(--ember);border-color:var(--ember);color:var(--amber-l)}
.hv-projects{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:2rem 1.5rem;margin-top:2rem}
.hv-project{margin:0}
.hv-project .hv-arch{aspect-ratio:4 / 5;box-shadow:var(--shadow-m);transition:transform .3s}
.hv-project:hover .hv-arch{transform:translateY(-4px)}
.hv-project figcaption{display:grid;gap:.25rem;padding:1rem .4rem 0}
.hv-project figcaption strong{font:600 1.45rem 'Cormorant Garamond',Georgia,serif;line-height:1.15}
.hv-meta{font-size:.9rem;color:var(--terra);font-weight:600}
.hv-toggle{position:absolute;left:50%;bottom:1rem;transform:translateX(-50%);z-index:2;min-height:38px;padding:.3rem 1.1rem;border:0;border-radius:999px;background:rgba(20,10,5,.82);color:var(--amber-l);font:600 .9rem 'Jost',sans-serif;cursor:pointer;backdrop-filter:blur(4px)}
.hv-toggle:hover{background:var(--ember);color:#fff}

/* stories, about, facts */
.hv-stories{display:grid;gap:1.75rem}
.hv-story{margin:0;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:2.25rem;padding:2rem;background:#fff;border:1px solid var(--line);border-radius:28px;box-shadow:var(--shadow-m)}
.hv-story blockquote{margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(1.5rem,2.6vw,2rem);line-height:1.25;font-weight:600}
.hv-story blockquote::before{content:'\\201C';display:block;font-size:5.5rem;line-height:.6;color:var(--amber);margin-bottom:.5rem}
.hv-story .hv-facts>div{grid-template-columns:100px 1fr}
.hv-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:3.5rem;align-items:start}
.hv-two>div>:first-child{margin-top:0}
.hv-facts{margin:1rem 0;display:grid;gap:.6rem}
.hv-facts>div{display:grid;grid-template-columns:minmax(120px,190px) 1fr;gap:1rem;padding-bottom:.6rem;border-bottom:1px solid var(--line)}
.hv-facts dt{color:var(--muted);font-size:.97rem}
.hv-facts dd{margin:0;font-weight:500}
.hv-ledger{border:1px solid var(--dline);border-radius:28px;padding:1.9rem;background:var(--grad-dark);box-shadow:var(--shadow-m)}
.hv-ledger>h3:first-child{margin-top:0;color:var(--amber-l)}
.hv-creds{list-style:none;margin:0 0 1rem;padding:0;display:grid;gap:1rem}
.hv-creds li{display:grid;gap:.15rem;padding:.25rem 0 .25rem 1rem;border-left:3px solid var(--amber)}
.hv-notice{margin-top:1.4rem;padding-top:1rem;border-top:1px solid var(--dline)}
.hv-root .hv-notice p{margin-bottom:.5rem;font-size:.94rem;color:var(--soft)}
.hv-root .hv-notice p:last-child{margin-bottom:0}

/* faq and policies */
.hv-faq-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.4fr);gap:3.5rem;align-items:start}
.hv-faq-grid>div:first-child{position:sticky;top:110px}
.hv-faq{display:grid;gap:.8rem;max-width:780px}
.hv-faq details{background:#fff;border:1px solid var(--line);border-radius:20px;padding:1rem 1.25rem;transition:box-shadow .2s,border-color .2s}
.hv-faq details:hover,.hv-faq details[open]{border-color:var(--amber)}
.hv-faq details[open]{box-shadow:var(--shadow-s)}
.hv-faq summary{cursor:pointer;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:1rem;align-items:center;font-size:1.05rem}
.hv-faq summary::-webkit-details-marker{display:none}
.hv-faq summary::after{content:'+';flex:none;width:2rem;height:2rem;border-radius:999px 999px 8px 8px;background:var(--grad);color:#FFE6C9;display:grid;place-items:center;font-weight:600;line-height:1}
.hv-faq details[open] summary::after{content:'\\2212'}
.hv-root .hv-faq p{margin:.7rem 0 0}
.hv-links{display:flex;flex-wrap:wrap;gap:.4rem 1.5rem}
.hv-root .hv-complaints{margin-top:1.5rem}

/* booking: one split card, dark contact panel and sandstone form */
.hv-book{background:radial-gradient(46rem 24rem at 6% 0%,rgba(219,106,30,.32),transparent 62%),radial-gradient(40rem 22rem at 100% 100%,rgba(154,50,8,.35),transparent 62%),var(--grad-dark)}
.hv-book-card{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.4fr);border-radius:36px;overflow:hidden;border:1px solid var(--dline);box-shadow:0 44px 90px -34px rgba(0,0,0,.95)}
.hv-book-side{padding:2.6rem 2.25rem;background:linear-gradient(180deg,#1E0D05,#120804)}
.hv-book-side h2{font-size:clamp(2rem,3.2vw,2.6rem)}
.hv-contact{list-style:none;margin:1.5rem 0 2rem;padding:0;display:grid;gap:.9rem}
.hv-contact li{display:flex;gap:.85rem;align-items:center;font-weight:500}
.hv-contact .hv-strip-ico{width:2.4rem;height:2.4rem;background:rgba(245,154,74,.14);border:1px solid var(--dline)}
.hv-contact .hv-strip-ico svg{stroke:var(--amber-l)}
.hv-book-side h3{font-size:1.4rem;color:var(--amber-l)}
.hv-next{margin:.5rem 0 0;padding-left:1.2rem;color:#E8D5BF}
.hv-next li{margin-bottom:.3rem}
.hv-next li::marker{color:var(--amber);font-weight:700}
.hv-form{background:var(--sand);color:var(--ink);padding:2.4rem 2.4rem 2rem;min-width:0}
.hv-fs{border:0;margin:0 0 1.7rem;padding:0;min-width:0}
.hv-fs>legend{font:600 1.7rem 'Cormorant Garamond',Georgia,serif;padding:0;margin-bottom:1rem;color:var(--ink);float:left;width:100%}
.hv-fs>legend+*{clear:both}
.hv-grid2{display:grid;grid-template-columns:1fr 1fr;gap:1rem 1.1rem}
.hv-field{margin:0;min-width:0}
.hv-field.is-wide{grid-column:1 / -1}
.hv-field>label{display:block;font-weight:600;margin-bottom:.3rem;font-size:.98rem}
.hv-fieldset-inner{border:0;padding:0}
.hv-fieldset-inner>legend{font:600 .98rem 'Jost',sans-serif;padding:0 0 .4rem;float:none}
.hv-req{font-weight:400;color:var(--muted)}
.hv-input{width:100%;min-height:50px;padding:.55rem .85rem;border:1.5px solid #D6BFA3;border-radius:14px;background:#fff;font:inherit;color:var(--ink);transition:border-color .15s,box-shadow .15s}
.hv-input:focus{border-color:var(--terra);box-shadow:0 0 0 4px rgba(245,154,74,.32);outline:none}
textarea.hv-input{min-height:110px}
.hv-input[aria-invalid="true"]{border-color:#B3241A}
.hv-pills{display:flex;flex-wrap:wrap;gap:.55rem}
.hv-pill{position:relative;display:inline-block}
.hv-pill input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;margin:0}
.hv-pill span{display:inline-flex;align-items:center;min-height:44px;padding:.4rem 1.05rem;border:1.5px solid #D6BFA3;border-radius:999px;background:#fff;font-weight:500;font-size:.96rem;transition:background .15s,border-color .15s,color .15s}
.hv-pill:hover span{border-color:var(--terra)}
.hv-pill input:checked+span{background:var(--grad);border-color:transparent;color:#fff}
.hv-pill input:focus-visible+span{outline:3px solid var(--terra);outline-offset:2px}
.hv-check{display:flex;gap:.65rem;align-items:flex-start;font-weight:500;min-height:32px}
.hv-check input{margin-top:.35rem;width:18px;height:18px;flex:none;accent-color:var(--terra)}
.hv-root .hv-error{color:#B3241A;font-size:.94rem;font-weight:600;margin:.3rem 0 0}
.hv-error-summary{border:1.5px solid #D9776D;background:#FFF0EE;border-radius:14px;padding:.9rem 1.1rem;margin-bottom:1.25rem;color:#7A1F16}
.hv-error-summary ul{margin:.4rem 0 0;padding-left:1.1rem}
.hv-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.hv-submit{width:100%;margin:1.1rem 0 1rem;min-height:56px;font-size:1.08rem}
.hv-done h3{margin-top:0}
.hv-more{border-top:1px solid var(--line);margin:0 0 1.5rem;padding-top:.9rem}
.hv-more>summary{cursor:pointer;font:600 1rem 'Jost',sans-serif;color:var(--link);padding:.3rem 0}
.hv-more>summary+*{margin-top:1rem}

/* footer */
.hv-footer{padding:3rem 0;border-top:1px solid var(--dline);background:linear-gradient(180deg,#140A05,#0A0503)}
.hv-root .hv-footer p{max-width:70ch;color:var(--soft)}
.hv-root .hv-footer p strong{color:#fff}
.hv-root .hv-footer-note{font-size:.95rem}

/* responsive */
@media (max-width:1100px){
  .hv-menu-btn{display:inline-flex;align-items:center}
  .hv-nav{display:none;position:absolute;left:0;right:0;top:100%;background:#140A05;border-bottom:1px solid var(--dline);padding:1rem 1.25rem 1.25rem;flex-direction:column;align-items:flex-start;gap:.9rem;box-shadow:0 22px 40px -18px rgba(0,0,0,.9)}
  .hv-nav.is-open{display:flex}
}
@media (max-width:980px){
  .hv-bento{grid-template-columns:repeat(2,1fr)}
  .hv-bento .hv-tile:nth-child(n){grid-column:auto}
  .hv-bento .hv-tile:nth-child(n):last-child:nth-child(odd){grid-column:1 / -1}
}
@media (max-width:900px){
  .hv-hero{padding-top:3rem}
  .hv-hero-grid,.hv-two,.hv-book-card,.hv-story,.hv-faq-grid,.hv-vastu-grid,.hv-proc-grid{grid-template-columns:1fr}
  .hv-hero-grid{gap:2.5rem}
  .hv-plaque{justify-self:center}
  .hv-faq-grid>div:first-child{position:static}
  .hv-section{padding:3.75rem 0}
  .hv-hero+.hv-section{padding-top:calc(3.75rem + 2.75rem)}
  .hv-wheel-art{width:120vw;right:-40%}
}
@media (max-width:600px){
  .hv-bento{grid-template-columns:1fr}
  .hv-bento .hv-tile:nth-child(n),.hv-bento .hv-tile:nth-child(n):last-child:nth-child(odd){grid-column:auto}
  .hv-grid2{grid-template-columns:1fr}
  .hv-form{padding:1.5rem 1.25rem}
  .hv-book-side{padding:1.75rem 1.4rem}
  .hv-facts>div{grid-template-columns:1fr;gap:.1rem}
  .hv-brand-name{font-size:1.2rem}
  .hv-story{padding:1.25rem}
  .hv-ledger{padding:1.3rem}
  .hv-tag{position:static;align-self:flex-start;margin-bottom:.5rem}
}
@media (prefers-reduced-motion:reduce){
  .hv-root *{transition:none!important;scroll-behavior:auto!important}
  .hv-tile:hover,.hv-tile:hover .hv-ico,.hv-btn:hover,.hv-project:hover .hv-arch{transform:none!important}
}
`;
