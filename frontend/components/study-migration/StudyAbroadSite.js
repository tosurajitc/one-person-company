'use client';

// frontend/components/study-migration/StudyAbroadSite.js
// Public site for a study-abroad / migration consultant (V1).
//
// Concept: an adviser you can check. The hero shows the adviser's circular photo with a few plain lines
// (name, practice, licence and number), and the route from enquiry to departure is visible before anyone commits.
// Look: soft pale sections, one medium brand blue, hairline borders and gentle shadows.
// Destination cards carry a 4:3 photo (placeholder until the photo exists).
//
// Props:
//   payload   site_build_payload (schema 2.0). Omit to render SAMPLE data.
//   siteSlug  the founder site's slug (needed to submit requests). Falls back to payload.site_slug.
//   demo      force demo mode (never calls the backend). Defaults to true when no payload is given.
//
// Trust rules enforced here (not just in copy):
//   - success stories render only with recorded consent, and only the parts the student allowed
//   - policy links appear only when the owner has filled them in
//   - credentials are shown as the adviser's own declared details with a link to the
//     official register; the site never displays a "verified by us" badge

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  SAMPLE_PAYLOAD,
  PRACTICE_TYPES,
  CREDENTIAL_KINDS,
  CONSULT_MODES,
  PRESCREEN_GROUPS,
  GROUP_ORDER,
  mergeTemplateData,
  getPrescreenFields,
  getDisclaimers,
  countryName,
  isMigration,
  isStale,
  isVisibleStory,
  formatMoney,
  formatDate,
  STALE_AFTER_MONTHS,
  DESTINATION_IMAGE,
  ADVISER_PHOTO,
  destinationImageSrc,
  imageCandidates,
} from '@/lib/study-migration-schema';
import { validateCustomAnswers, isVisible, optionList } from '@/lib/custom-fields';
import { submitConsultRequest, buildSubmitBody } from '@/lib/study-migration-api';

/* ------------------------------------------------------------------ */
/* Data mapping                                                        */
/* ------------------------------------------------------------------ */

export function payloadToData(payload) {
  const p = payload || {};
  return {
    business: { ...(p.business || {}) },
    positioning: { ...(p.positioning || {}) },
    proof: { stats: [], partners: [], ...(p.proof || {}) },
    frontDoor: { ...(p.frontDoor || {}) },
    knowledge: { faqs: [], ...(p.knowledge || {}) },
    offers: p.offers || {},
    agents: p.agents || {},
    td: mergeTemplateData(p.template_data),
    siteSlug: p.site_slug || p.slug || '',
  };
}

export const SAMPLE = payloadToData(SAMPLE_PAYLOAD);

const DataCtx = createContext({ ...SAMPLE, slug: '', isDemo: true, openBooking: () => {}, prefill: { typeKey: '', country: '', nonce: 0 } });
const useData = () => useContext(DataCtx);

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

// Groups always shown; the rest sit behind one optional block so the form is not a wall of questions.
const PRIMARY_GROUPS = ['contact', 'goals'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initials = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

const paragraphs = (text) => String(text || '').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
const digits = (s) => String(s || '').replace(/[^\d]/g, '');
const telHref = (s) => `tel:${String(s || '').replace(/[^+\d]/g, '')}`;
const isEmptyVal = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

const kindLabel = (k) => CREDENTIAL_KINDS.find((x) => x.value === k)?.label || k;
const modeLabel = (m) => CONSULT_MODES.find((x) => x.value === m)?.label || m;

function feeText(t) {
  if (!t.fee || !(Number(t.fee.amount) > 0)) return 'Free';
  return formatMoney(t.fee.amount, t.fee.currency);
}

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export default function StudyAbroadSite({ payload, siteSlug, demo }) {
  const isDemo = demo ?? !payload;
  const data = useMemo(() => (payload ? payloadToData(payload) : SAMPLE), [payload]);
  const slug = siteSlug || data.siteSlug || '';
  const [prefill, setPrefill] = useState({ typeKey: '', country: '', nonce: 0 });

  const openBooking = useCallback((opts = {}) => {
    setPrefill((p) => ({ typeKey: opts.typeKey || '', country: opts.country || '', nonce: p.nonce + 1 }));
    if (typeof document === 'undefined') return;
    const el = document.getElementById('book');
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, []);

  const ctx = useMemo(() => ({ ...data, slug, isDemo, openBooking, prefill }), [data, slug, isDemo, openBooking, prefill]);

  const { td, knowledge, proof } = data;
  const stories = td.success_stories.filter(isVisibleStory);
  const hasResources = td.resources.length > 0 || td.destinations.some((d) => (d.intakes || []).length > 0) || (knowledge.faqs || []).length > 0;
  const nav = [
    { id: 'credentials', label: 'Credentials' },
    td.destinations.length ? { id: 'destinations', label: 'Destinations' } : null,
    td.services.length ? { id: 'services', label: 'Services' } : null,
    stories.length ? { id: 'stories', label: 'Success stories' } : null,
    hasResources ? { id: 'resources', label: 'Resources' } : null,
  ].filter(Boolean);

  return (
    <DataCtx.Provider value={ctx}>
      <div className="sa-root" id="top">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Figtree:wght@400;500;600;700&family=Share+Tech+Mono&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {isDemo && (
          <div className="sa-demo" role="note">
            Sample site. Every name, number and credential here is fictional, and nothing you type is sent anywhere.
          </div>
        )}
        <Header nav={nav} />
        <main>
          <Hero />
          <Journey />
          <Credentials partners={proof.partners} />
          {td.destinations.length > 0 && <Destinations />}
          {td.services.length > 0 && <Services />}
          {stories.length > 0 && <Stories stories={stories} />}
          {hasResources && <Resources />}
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
    <header className="sa-header">
      <div className="sa-wrap sa-header-row">
        <a href="#top" className="sa-brand">
          {business.name}
        </a>
        <button type="button" className="sa-menu-btn" aria-expanded={open} aria-controls="sa-nav" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close menu' : 'Menu'}
        </button>
        <nav id="sa-nav" className={`sa-nav${open ? ' is-open' : ''}`} aria-label="Main">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <button
            type="button"
            className="sa-btn sa-btn-primary"
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
  const { business, positioning, frontDoor, openBooking } = useData();
  return (
    <section className="sa-hero" aria-labelledby="sa-h1">
      <div className="sa-wrap sa-hero-grid">
        <div className="sa-hero-copy">
          <h1 id="sa-h1">{positioning.headline || business.name}</h1>
          {positioning.subheadline && <p className="sa-lede">{positioning.subheadline}</p>}
          <div className="sa-actions">
            <button type="button" className="sa-btn sa-btn-primary" onClick={() => openBooking()}>
              {frontDoor.cta_label || 'Book a consultation'}
            </button>
            <a className="sa-btn sa-btn-ghost" href="#credentials">
              See registration details
            </a>
          </div>
          {business.response_time && <p className="sa-note">{business.response_time}</p>}
        </div>
        <CredentialCard />
      </div>
    </section>
  );
}

// The owner's photo, shown as a circle (square 1:1 source). Falls back to initials if there is no photo, the address is unsafe,
// or the file fails to load. In demo mode the fallback also states the size the photo should be.
function AdviserPhoto({ url, name }) {
  const { isDemo } = useData();
  const img = useImageChain(imageCandidates(url));
  const show = !img.exhausted;
  return (
    <div className="sa-photo-wrap">
      <div className="sa-photo" aria-hidden="true">
        {show ? (
          <img key={img.src} ref={img.ref} src={img.src} alt="" width={ADVISER_PHOTO.width} height={ADVISER_PHOTO.height} onError={img.onError} />
        ) : (
          <span className="sa-photo-initials">{initials(name)}</span>
        )}
      </div>
      {!show && isDemo && <p className="sa-photo-note">Photo 1:1, 600 × 600 px</p>}
    </div>
  );
}

function CredentialCard() {
  const { business, td } = useData();
  const main = td.credentials[0];
  const practice = PRACTICE_TYPES.find((p) => p.value === td.practice.type)?.label || '';
  const person = business.founder_name || business.name;
  const more = td.credentials.length - 1;
  return (
    <aside className="sa-adviser" aria-label="Adviser registration details">
      <AdviserPhoto url={business.founder_photo_url} name={person} />
      <p className="sa-adviser-name">{person}</p>
      {practice && <p className="sa-adviser-role">{practice}</p>}
      {main ? (
        <>
          <p className="sa-adviser-line">
            {kindLabel(main.kind)} issued by {main.issuing_body}
          </p>
          <p className="sa-adviser-line">
            Number {main.number}
            {main.valid_until ? `, valid until ${formatDate(main.valid_until)}` : ''}
          </p>
        </>
      ) : (
        <p className="sa-adviser-line sa-muted">Registration details have not been added yet.</p>
      )}
      {(main?.verify_url || more > 0) && (
        <div className="sa-adviser-links">
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
  const { td } = useData();
  const steps = td.journey_steps;
  const [i, setI] = useState(0);
  const step = steps[Math.min(i, steps.length - 1)];
  return (
    <section className="sa-section sa-amber" aria-labelledby="sa-journey-h">
      <div className="sa-wrap">
        <h2 id="sa-journey-h">The route from enquiry to departure</h2>
        <ol className="sa-route" style={{ '--n': steps.length }}>
          {steps.map((s, idx) => (
            <li key={s.key || idx}>
              <button type="button" aria-current={idx === i ? 'step' : undefined} onClick={() => setI(idx)}>
                <span className="sa-dot" aria-hidden="true">
                  {idx + 1}
                </span>
                <span className="sa-route-label">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="sa-route-desc" aria-live="polite">
          <strong>{step.label}.</strong> {step.description}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Credentials and about                                               */
/* ------------------------------------------------------------------ */

function Credentials({ partners }) {
  const { business, positioning, proof, td } = useData();
  const disc = getDisclaimers(td);
  const years = business.year_started ? new Date().getFullYear() - Number(business.year_started) : null;
  const forWho = Array.isArray(positioning.for_who) ? positioning.for_who : positioning.for_who ? [positioning.for_who] : [];
  const stats = (proof.stats || []).filter((s) => s && s.label && s.value);
  return (
    <section className="sa-section" id="credentials" aria-labelledby="sa-cred-h">
      <div className="sa-wrap sa-two">
        <div>
          <h2 id="sa-cred-h">About and credentials</h2>
          {paragraphs(business.about).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <dl className="sa-facts">
            {years > 0 && (
              <div>
                <dt>Advising since</dt>
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
            {stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>
                  {s.value}
                  {s.source_note ? <span className="sa-muted"> ({s.source_note})</span> : null}
                </dd>
              </div>
            ))}
          </dl>
          {forWho.length > 0 && (
            <>
              <h3>Who we work with</h3>
              <ul className="sa-list">
                {forWho.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <h3>Registration and membership</h3>
          {td.credentials.length === 0 ? (
            <p className="sa-muted">No registration details have been added yet.</p>
          ) : (
            <ul className="sa-creds">
              {td.credentials.map((c, i) => (
                <li key={`${c.number}-${i}`}>
                  <strong>{kindLabel(c.kind)}</strong>
                  <span>
                    {c.issuing_body}, number {c.number}
                    {c.country ? `, ${countryName({ country_code: c.country })}` : ''}
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
          {isMigration(td) && disc.authorisation && (
            <div className="sa-callout">
              <strong>Who may give immigration advice</strong>
              <p>{disc.authorisation}</p>
            </div>
          )}
          {(partners || []).length > 0 && (
            <>
              <h3>Institutions we work with</h3>
              <p>{partners.join(', ')}</p>
            </>
          )}
          <div className="sa-notice">
            <p>{disc.general}</p>
            {disc.migration && <p>{disc.migration}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Destinations                                                        */
/* ------------------------------------------------------------------ */

// Tries each candidate address in order (.jpg, then .jpeg, .webp, .png) and reports when all have failed.
// An image that fails BEFORE React attaches its onError handler (server-rendered <img>) would never trigger
// the fallback, so the first attempt is also checked once on mount. Each attempt renders a fresh <img>
// (key = its address) so a late error event from an earlier attempt can never advance the chain twice.
function useImageChain(candidates) {
  const ref = useRef(null);
  const key = candidates.join('|');
  const [state, setState] = useState({ key, i: 0 });
  const i = state.key === key ? state.i : 0;
  // Advance only if we are still on the attempt that failed. The "already failed" check and the error event can
  // both fire for the same attempt in one tick; without this guard they would skip a candidate.
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
    // only the first attempt needs this check; later failures arrive through onError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { ref, src: candidates[i], exhausted: i >= candidates.length, onError: advance };
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 12 3a7 7 0 0 1 7 6.8C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.4" />
    </svg>
  );
}

// Photo area of a destination card (aspect ratio 4:3). If the photo is missing or fails to load,
// a tinted placeholder with the country code is shown, so a site never shows a broken image.
function DestMedia({ d }) {
  const { isDemo } = useData();
  const img = useImageChain(imageCandidates(destinationImageSrc(d)));
  return (
    <span className="sa-dest-media">
      {!img.exhausted ? (
        <>
          <img key={img.src} ref={img.ref} className="sa-dest-img" src={img.src} alt="" width={DESTINATION_IMAGE.width} height={DESTINATION_IMAGE.height} loading="lazy" onError={img.onError} />
          <span className="sa-dest-badge" aria-hidden="true">
            {d.country_code}
          </span>
        </>
      ) : (
        <span className="sa-dest-ph" aria-hidden="true">
          <PinIcon />
          <span className="sa-dest-code">{d.country_code}</span>
          {isDemo && (
            <span className="sa-dest-ph-note">
              Photo goes here. Ratio 4:3, {DESTINATION_IMAGE.width} × {DESTINATION_IMAGE.height} px.
            </span>
          )}
        </span>
      )}
    </span>
  );
}

function ExtrasList({ extras }) {
  if (!extras || extras.length === 0) return null;
  return (
    <dl className="sa-facts">
      {extras.map((e) => (
        <div key={e.label}>
          <dt>{e.label}</dt>
          <dd>{e.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Destinations() {
  const { td, openBooking } = useData();
  const list = td.destinations;
  const more = td.destinations_more || {};
  const [code, setCode] = useState(list[0]?.country_code);
  const d = list.find((x) => x.country_code === code) || list[0];
  const c = d.cost_estimate || {};
  const stale = isStale(d.last_verified);
  const cost = (min, max) => (min != null && max != null ? `${formatMoney(min, c.currency)} to ${formatMoney(max, c.currency)}` : '');
  return (
    <section className="sa-section sa-tint" id="destinations" aria-labelledby="sa-dest-h">
      <div className="sa-wrap">
        <h2 id="sa-dest-h">Destinations we advise on</h2>
        <div className="sa-dests">
          {list.map((x, i) => {
            const months = [...new Set((x.intakes || []).map((k) => k.month).filter(Boolean))];
            return (
              <button
                key={x.country_code}
                type="button"
                className={`sa-dest sa-tone-${i % 4}`}
                aria-pressed={x.country_code === d.country_code}
                onClick={() => setCode(x.country_code)}
              >
                <DestMedia d={x} />
                <span className="sa-dest-body">
                  <span className="sa-dest-name">{countryName(x)}</span>
                  {x.headline && <span className="sa-dest-headline">{x.headline}</span>}
                  {months.length > 0 && (
                    <span className="sa-chips">
                      <span className="sa-sr">Intakes: </span>
                      {months.map((m) => (
                        <span key={m} className="sa-chip">
                          {m}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="sa-dest-cta" aria-hidden="true">
                    {x.country_code === d.country_code ? 'Showing details below' : 'View details'}
                  </span>
                </span>
              </button>
            );
          })}
          {more.enabled !== false && (
            <button type="button" className="sa-dest sa-dest-more sa-tone-0" onClick={() => openBooking({ country: 'OTHER' })}>
              <span className="sa-dest-media">
                <span className="sa-dest-plus" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" focusable="false">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </span>
              </span>
              <span className="sa-dest-body">
                <span className="sa-dest-name">And more</span>
                <span className="sa-dest-headline">{(more.note || '').trim() || 'Considering another country? Tell us where and we will say whether we can help.'}</span>
                <span className="sa-dest-cta" aria-hidden="true">
                  Ask about another country
                </span>
              </span>
            </button>
          )}
        </div>

        <article className={`sa-detail sa-tone-${Math.max(0, list.indexOf(d)) % 4}`} aria-live="polite" aria-label={`${countryName(d)} details`}>
          <h3>{countryName(d)}</h3>
          {d.headline && <p className="sa-lede-sm">{d.headline}</p>}
          <div className="sa-detail-grid">
            {(d.intakes || []).length > 0 && (
              <div>
                <h4>Intakes</h4>
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th scope="col">Intake</th>
                      <th scope="col">Starts</th>
                      <th scope="col">Apply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.intakes.map((k) => (
                      <tr key={`${k.name}-${k.month}`}>
                        <td>{k.name}</td>
                        <td>{k.month}</td>
                        <td>{k.apply_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(d.popular_courses || []).length > 0 && (
              <div>
                <h4>Popular courses</h4>
                <ul className="sa-list">
                  {d.popular_courses.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {(cost(c.tuition_min, c.tuition_max) || cost(c.living_min, c.living_max)) && (
              <div>
                <h4>Estimated yearly cost</h4>
                <dl className="sa-facts">
                  {cost(c.tuition_min, c.tuition_max) && (
                    <div>
                      <dt>Tuition</dt>
                      <dd>{cost(c.tuition_min, c.tuition_max)}</dd>
                    </div>
                  )}
                  {cost(c.living_min, c.living_max) && (
                    <div>
                      <dt>Living</dt>
                      <dd>{cost(c.living_min, c.living_max)}</dd>
                    </div>
                  )}
                </dl>
                {c.note && <p className="sa-muted">{c.note}</p>}
              </div>
            )}
          </div>
          {d.eligibility_summary && (
            <>
              <h4>Eligibility</h4>
              <p>{d.eligibility_summary}</p>
            </>
          )}
          {(d.scholarships || []).length > 0 && (
            <>
              <h4>Scholarships</h4>
              <ul className="sa-list">
                {d.scholarships.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          )}
          {d.visa_summary && (
            <>
              <h4>Visa process</h4>
              <p>{d.visa_summary}</p>
            </>
          )}
          {d.post_study_pathway && (
            <>
              <h4>After your studies</h4>
              <p>{d.post_study_pathway}</p>
            </>
          )}
          {(d.partner_institutions || []).length > 0 && (
            <>
              <h4>Institutions we work with here</h4>
              <p>{d.partner_institutions.join(', ')}</p>
            </>
          )}
          <ExtrasList extras={d.extras} />
          <p className={`sa-checked${stale ? ' is-stale' : ''}`}>
            {d.last_verified ? `Last checked on ${formatDate(d.last_verified)}. ` : ''}
            {stale
              ? `This was checked more than ${STALE_AFTER_MONTHS} months ago. Rules and costs change, so confirm current details with us before you decide.`
              : 'This is general information and does not replace advice on your own case.'}
          </p>
          <button type="button" className="sa-btn sa-btn-ghost" onClick={() => openBooking({ country: d.country_code })}>
            Talk to us about {countryName(d)}
          </button>
        </article>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Services and ways to start                                          */
/* ------------------------------------------------------------------ */

function Services() {
  const { td, openBooking } = useData();
  return (
    <section className="sa-section" id="services" aria-labelledby="sa-svc-h">
      <div className="sa-wrap">
        <h2 id="sa-svc-h">How we help</h2>
        <dl className="sa-ruled">
          {td.services.map((s) => (
            <div key={s.key || s.title} className="sa-ruled-row">
              <dt>{s.title}</dt>
              <dd>
                <p>{s.description}</p>
                {(s.included || []).length > 0 && (
                  <ul className="sa-list">
                    {s.included.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                )}
                <ExtrasList extras={s.extras} />
              </dd>
            </div>
          ))}
        </dl>

        <h3 className="sa-gap">Choose how to start</h3>
        <ul className="sa-types">
          {td.consultation_types.map((t) => (
            <li key={t.key}>
              <div>
                <strong>{t.title}</strong>
                <span className="sa-muted">
                  {t.duration_min ? `${t.duration_min} minutes` : 'Length on request'}
                  {(t.modes || []).length ? `. ${(t.modes || []).map(modeLabel).join(', ')}.` : ''}
                </span>
              </div>
              <span className="sa-fee">{feeText(t)}</span>
              <button type="button" className="sa-btn sa-btn-ghost" onClick={() => openBooking({ typeKey: t.key })}>
                Request this session
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Success stories (consent-gated)                                     */
/* ------------------------------------------------------------------ */

function Stories({ stories }) {
  return (
    <section className="sa-section sa-blush" id="stories" aria-labelledby="sa-story-h">
      <div className="sa-wrap">
        <h2 id="sa-story-h">Success stories</h2>
        <p className="sa-muted sa-intro">Shared with each student’s permission. Their outcomes are their own, and yours may differ.</p>
        <div className="sa-stories">
          {stories.map((s, i) => {
            const scope = s.consent_scope || [];
            const showName = scope.includes('name');
            const showPhoto = scope.includes('photo') && s.photo_url;
            const showOutcome = scope.includes('outcome');
            const facts = [];
            if (showOutcome) {
              if (s.destination) facts.push(['Destination', countryName({ country_code: s.destination })]);
              if (s.course) facts.push(['Course', s.course]);
              if (s.university) facts.push(['Institution', s.university]);
              if (s.intake_year) facts.push(['Intake year', String(s.intake_year)]);
              if (s.scholarship) facts.push(['Scholarship', s.scholarship]);
              if (s.outcome) facts.push(['Outcome', s.outcome]);
            }
            (s.extras || []).forEach((e) => facts.push([e.label, e.value]));
            return (
              <figure key={`${s.first_name}-${i}`} className="sa-story">
                <blockquote>{s.quote}</blockquote>
                <figcaption>
                  {showPhoto && <img className="sa-story-photo" src={s.photo_url} alt={showName ? s.first_name : ''} />}
                  <strong>{showName ? s.first_name : 'A former student'}</strong>
                  {facts.length > 0 && (
                    <dl className="sa-facts">
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
/* Resources: intake calendar, guides, FAQs                            */
/* ------------------------------------------------------------------ */

const RESOURCE_TYPES = { document_guide: 'Document guide', webinar: 'Webinar', blog: 'Article', calendar: 'Calendar' };

function Resources() {
  const { td, knowledge } = useData();
  const rows = td.destinations.flatMap((d) => (d.intakes || []).map((k) => ({ country: countryName(d), ...k, stale: isStale(d.last_verified) })));
  const faqs = (knowledge.faqs || []).filter((f) => f && f.q && f.a);
  return (
    <section className="sa-section" id="resources" aria-labelledby="sa-res-h">
      <div className="sa-wrap">
        <h2 id="sa-res-h">Plan your timeline</h2>

        {rows.length > 0 && (
          <>
            <h3>Intake calendar</h3>
            <div className="sa-scroll">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th scope="col">Country</th>
                    <th scope="col">Intake</th>
                    <th scope="col">Starts</th>
                    <th scope="col">Apply</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.country}-${r.name}-${i}`}>
                      <td>{r.country}</td>
                      <td>{r.name}</td>
                      <td>{r.month}</td>
                      <td>{r.apply_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.some((r) => r.stale) && <p className="sa-checked is-stale">Some dates were checked more than {STALE_AFTER_MONTHS} months ago. Confirm them with us.</p>}
          </>
        )}

        {td.resources.length > 0 && (
          <>
            <h3 className="sa-gap">Guides and events</h3>
            <ul className="sa-resources">
              {td.resources.map((r, i) => {
                const stale = r.last_verified && isStale(r.last_verified);
                const meta = `${RESOURCE_TYPES[r.type] || 'Resource'}${r.last_verified ? `. Checked ${formatDate(r.last_verified)}.` : ''}`;
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
                    <span className={`sa-muted${stale ? ' is-stale' : ''}`}>
                      {meta}
                      {stale ? ' Confirm with us before relying on it.' : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {faqs.length > 0 && (
          <>
            <h3 className="sa-gap">Questions we are often asked</h3>
            <div className="sa-faq">
              {faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Contact and consultation request                                    */
/* ------------------------------------------------------------------ */

function Book() {
  const { business } = useData();
  return (
    <section className="sa-section sa-book" id="book" aria-labelledby="sa-book-h">
      <div className="sa-wrap sa-book-grid">
        <div className="sa-book-info">
          <h2 id="sa-book-h">Request a consultation</h2>
          <p className="sa-lede-sm">Choose a session, tell us a little about your profile, and we will confirm a time with you.</p>
          <dl className="sa-contact">
            {business.phone && (
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={telHref(business.phone)}>{business.phone}</a>
                </dd>
              </div>
            )}
            {business.whatsapp && (
              <div>
                <dt>WhatsApp</dt>
                <dd>
                  <a href={`https://wa.me/${digits(business.whatsapp)}`} target="_blank" rel="noopener noreferrer">
                    {business.whatsapp}
                  </a>
                </dd>
              </div>
            )}
            {business.email && (
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${business.email}`}>{business.email}</a>
                </dd>
              </div>
            )}
            {business.hours && (
              <div>
                <dt>Hours</dt>
                <dd>
                  {business.hours}
                  {business.timezone ? ` (${business.timezone})` : ''}
                </dd>
              </div>
            )}
            {business.address && (
              <div>
                <dt>Office</dt>
                <dd>
                  {business.address}
                  {business.map_url ? (
                    <>
                      {' '}
                      <a href={business.map_url} target="_blank" rel="noopener noreferrer">
                        Open in maps
                      </a>
                    </>
                  ) : null}
                </dd>
              </div>
            )}
          </dl>
          {business.response_time && <p className="sa-note">{business.response_time}</p>}
        </div>
        <ConsultForm />
      </div>
    </section>
  );
}

function Field({ def, value, onChange, error }) {
  const id = `sa-f-${def.key}`;
  const errId = `${id}-err`;
  const opts = optionList(def);
  const req = def.required ? <span className="sa-req"> (required)</span> : null;
  const err = error ? (
    <p className="sa-error" id={errId}>
      {error}
    </p>
  ) : null;
  const common = { id, name: def.key, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errId : undefined };

  if (def.type === 'checkbox') {
    return (
      <div className="sa-field">
        <label className="sa-check">
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
      <fieldset className="sa-field sa-fieldset-inner" id={id} aria-describedby={error ? errId : undefined}>
        <legend>
          {def.label}
          {req}
        </legend>
        <div className="sa-checks">
          {opts.map((o) => (
            <label key={o.value} className="sa-check">
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
      <fieldset className="sa-field sa-fieldset-inner" id={id} aria-describedby={error ? errId : undefined}>
        <legend>
          {def.label}
          {req}
        </legend>
        <div className="sa-checks">
          {[
            ['yes', 'Yes'],
            ['no', 'No'],
          ].map(([v, l]) => (
            <label key={v} className="sa-check">
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
    <div className="sa-field">
      <label htmlFor={id}>
        {def.label}
        {req}
      </label>
      {def.type === 'long_text' ? (
        <textarea {...common} className="sa-input" rows={4} maxLength={2000} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : def.type === 'select' ? (
        <select {...common} className="sa-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
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
          className="sa-input"
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

function ConsultForm() {
  const { td, business, slug, isDemo, prefill } = useData();
  const types = td.consultation_types;
  const builtIn = useMemo(() => getPrescreenFields(td), [td]);
  const customDefs = td.prescreen.custom_fields || [];
  const disc = td.policies;

  const [typeKey, setTypeKey] = useState(types.length === 1 ? types[0].key : '');
  const [mode, setMode] = useState('');
  const [date, setDate] = useState('');
  const [part, setPart] = useState('');
  const [tz, setTz] = useState(business.timezone || '');
  const [tzList, setTzList] = useState([]);
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

  const type = types.find((t) => t.key === typeKey);

  // Browser-only values, set after mount to avoid hydration mismatches.
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const list = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
      setTzList(detected && !list.includes(detected) ? [detected, ...list] : list);
      if (detected) setTz(detected);
    } catch {
      /* keep the business timezone */
    }
    const d = new Date();
    setMinDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }, []);

  // "Request this session" / "Talk to us about ..." buttons elsewhere on the page.
  useEffect(() => {
    if (!prefill.nonce) return;
    if (prefill.typeKey && types.some((t) => t.key === prefill.typeKey)) setTypeKey(prefill.typeKey);
    if (prefill.country) {
      setProfile((p) => {
        const cur = Array.isArray(p.target_countries) ? p.target_countries : [];
        return cur.includes(prefill.country) ? p : { ...p, target_countries: [...cur, prefill.country] };
      });
    }
  }, [prefill, types]);

  useEffect(() => {
    if (!type) return;
    if ((type.modes || []).length === 1) setMode(type.modes[0]);
    else if (!(type.modes || []).includes(mode)) setMode('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeKey]);

  const ctx = { ...profile, ...custom };
  const visibleCustom = customDefs.filter((d) => isVisible(d, ctx));
  const setP = (key) => (v) => setProfile((p) => ({ ...p, [key]: v }));
  const setC = (key) => (v) => setCustom((p) => ({ ...p, [key]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!typeKey) errs.type = 'Choose a session.';
    if (type && (type.modes || []).length > 0 && !mode) errs.mode = 'Choose how you would like to meet.';

    const cleanProfile = {};
    builtIn.forEach((f) => {
      let v = profile[f.key];
      if (f.type === 'number' && !isEmptyVal(v)) {
        const n = Number(v);
        if (!Number.isFinite(n)) {
          errs[f.key] = 'Enter a number.';
          return;
        }
        v = n;
      }
      if (isEmptyVal(v)) {
        if (f.required) errs[f.key] = 'This answer is required.';
        return;
      }
      if (f.type === 'email' && !EMAIL_RE.test(String(v).trim())) {
        errs[f.key] = 'Enter a valid email address.';
        return;
      }
      if (f.type === 'tel' && digits(v).length < 7) {
        errs[f.key] = 'Enter a phone number with at least 7 digits.';
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
      if (builtIn.some((f) => errs[f.key] && !PRIMARY_GROUPS.includes(f.group))) setMoreOpen(true);
      setStatus('idle');
      setTimeout(() => summaryRef.current && summaryRef.current.focus(), 0);
      return;
    }

    setStatus('sending');
    setServerMsg('');
    const body = buildSubmitBody({
      siteSlug: slug,
      typeKey,
      mode,
      preferred: { date, part_of_day: part },
      timezone: tz,
      profile: cleanProfile,
      custom: cv.clean,
      policyVersion: disc.version,
      honeypot: hp,
    });
    const res = await submitConsultRequest({ body, demo: isDemo });
    if (res.ok) {
      setResult({ ...res, type });
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
    const t = result?.type;
    const bookingUrl = t?.booking_url || td.integrations.booking_url;
    return (
      <div className="sa-form sa-done" ref={doneRef} tabIndex={-1} role="status">
        <h3>{result?.demo ? 'Sample request received' : 'We have your request'}</h3>
        {result?.demo ? (
          <p>This is a sample site, so nothing was sent.</p>
        ) : (
          <>
            <p>
              Keep this reference: <strong>{result.ref}</strong>
            </p>
            <p>{business.name} will review your details and confirm a time with you.</p>
          </>
        )}
        {t?.fee && t.payment_url && (
          <p>
            <a className="sa-btn sa-btn-primary" href={t.payment_url} target="_blank" rel="noopener noreferrer">
              Pay the consultation fee ({feeText(t)})
            </a>
          </p>
        )}
        {t?.payment_note && <p className="sa-muted">{t.payment_note}</p>}
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
  const privacyHref = disc.privacy?.url || '#policies';
  const grouped = GROUP_ORDER.map((g) => ({ g, fields: builtIn.filter((f) => f.group === g) })).filter((x) => x.fields.length > 0);
  const primary = grouped.filter((x) => PRIMARY_GROUPS.includes(x.g));
  const secondary = grouped.filter((x) => !PRIMARY_GROUPS.includes(x.g));
  const renderGroup = ({ g, fields }) => (
    <fieldset key={g}>
      <legend>{PRESCREEN_GROUPS[g]}</legend>
      {fields.map((f) => (
        <Field key={f.key} def={f} value={profile[f.key]} onChange={setP(f.key)} error={errors[f.key]} />
      ))}
    </fieldset>
  );

  return (
    <form className="sa-form" noValidate onSubmit={onSubmit} aria-labelledby="sa-book-h">
      {(errorList.length > 0 || serverMsg) && (
        <div className="sa-error-summary" ref={summaryRef} tabIndex={-1} role="alert">
          <strong>{serverMsg || 'Please fix the following before sending.'}</strong>
          {errorList.length > 0 && (
            <ul>
              {errorList.map(([k, m]) => (
                <li key={k}>
                  <a href={`#sa-f-${k}`}>{m}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <fieldset>
        <legend>Your session</legend>
        <div className="sa-field" id="sa-f-type">
          <div className="sa-choices">
            {types.map((t) => (
              <label key={t.key} className="sa-choice">
                <input type="radio" name="consultation_type" value={t.key} checked={typeKey === t.key} onChange={() => setTypeKey(t.key)} />
                <span>
                  <strong>{t.title}</strong>
                  <span className="sa-muted">
                    {t.duration_min ? `${t.duration_min} minutes. ` : ''}
                    {feeText(t)}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {errors.type && <p className="sa-error">{errors.type}</p>}
        </div>

        {type && (type.modes || []).length > 1 && (
          <Field
            def={{ key: 'mode', label: 'How would you like to meet?', type: 'select', required: true, options: type.modes.map((m) => ({ value: m, label: modeLabel(m) })) }}
            value={mode}
            onChange={setMode}
            error={errors.mode}
          />
        )}

        <div className="sa-row">
          <div className="sa-field">
            <label htmlFor="sa-f-date">Preferred date</label>
            <input id="sa-f-date" className="sa-input" type="date" min={minDate || undefined} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="sa-field">
            <label htmlFor="sa-f-part">Preferred time of day</label>
            <select id="sa-f-part" className="sa-input" value={part} onChange={(e) => setPart(e.target.value)}>
              <option value="">Any time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
        </div>
        <div className="sa-field">
          <label htmlFor="sa-f-tz">Your time zone</label>
          {tzList.length > 0 ? (
            <select id="sa-f-tz" className="sa-input" value={tz} onChange={(e) => setTz(e.target.value)}>
              {tzList.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          ) : (
            <input id="sa-f-tz" className="sa-input" type="text" value={tz} onChange={(e) => setTz(e.target.value)} />
          )}
          {business.timezone && <p className="sa-muted">We work in {business.timezone}. We will confirm the exact time with you.</p>}
        </div>
      </fieldset>

      {primary.map(renderGroup)}

      {secondary.length > 0 && (
        <details className="sa-more" open={moreOpen} onToggle={(e) => setMoreOpen(e.currentTarget.open)}>
          <summary>More about your background (optional, helps us prepare)</summary>
          {secondary.map(renderGroup)}
        </details>
      )}

      {visibleCustom.length > 0 && (
        <fieldset>
          <legend>A few more questions</legend>
          {visibleCustom.map((d) => (
            <Field
              key={d.key}
              def={{ ...d, options: d.options }}
              value={custom[d.key]}
              onChange={setC(d.key)}
              error={errors[d.key]}
            />
          ))}
        </fieldset>
      )}

      <div className="sa-hp" aria-hidden="true">
        <label htmlFor="sa-f-website">Leave this field empty</label>
        <input id="sa-f-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>

      <div className="sa-field">
        <label className="sa-check">
          <input id="sa-f-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={errors.consent ? true : undefined} />
          <span>
            I agree that {business.name} may store and use the details I have entered to respond to my request. I have read the{' '}
            <a href={privacyHref} {...(disc.privacy?.url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              privacy policy
            </a>
            . (required)
          </span>
        </label>
        {errors.consent && <p className="sa-error">{errors.consent}</p>}
      </div>

      <button type="submit" className="sa-btn sa-btn-primary sa-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending request' : 'Send consultation request'}
      </button>
      <p className="sa-muted">Please do not include passport numbers, bank details or other identity documents. We will tell you how to share documents securely later.</p>
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
    <section className="sa-section" id="policies" aria-labelledby="sa-pol-h">
      <div className="sa-wrap">
        <h2 id="sa-pol-h">Policies and complaints</h2>
        <div className="sa-faq">
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
          <p className="sa-complaints">
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
    <footer className="sa-footer">
      <div className="sa-wrap">
        <p>
          <strong>{business.name}</strong>
          {business.city ? `, ${business.city}` : ''}
        </p>
        <p className="sa-footer-note">{disc.general}</p>
        {entries.length > 0 && (
          <nav className="sa-links" aria-label="Policies">
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
/* Styles (scoped to .sa-root)                                         */
/* ------------------------------------------------------------------ */

// Drop-in replacement for the `const CSS = \`...\`;` block at the bottom of StudyAbroadSite.js.
// Only colours, gradients and surfaces changed. All class names and JSX are untouched.
// (.sa-amber / .sa-blush keep their names but are now blue gradients; no yellow remains.)

const CSS = `
.sa-root{--ink:#0F1B40;--muted:#4A5680;--brand:#3450D4;--brand-d:#263DB0;--brand-tint:#E6ECFF;--line:#D6DEF3;--sky:#F3F6FF;
  --navy-1:#0A1233;--navy-2:#132766;--navy-3:#1F3A9C;--cyan:#3CC9E8;--cyan-l:#9DD9FF;--soft-text:#B9C6F2;--flag:#A93E2A;--white:#FFFFFF;
  --navy-grad:linear-gradient(100deg,#0A1233 0%,#132766 55%,#1F3A9C 100%);
  --btn-grad:linear-gradient(135deg,#3F5EF0 0%,#6A4DF0 100%);
  --btn-grad-h:linear-gradient(135deg,#2D49D6 0%,#5738D8 100%);
  --shadow-s:0 1px 2px rgba(15,27,64,.06),0 2px 8px rgba(15,27,64,.06);--shadow-m:0 2px 4px rgba(15,27,64,.05),0 14px 36px -12px rgba(15,27,64,.28);
  font-family:'Figtree',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--white);line-height:1.6;font-size:1.0625rem;min-height:100vh}
.sa-root *,.sa-root *::before,.sa-root *::after{box-sizing:border-box}
.sa-root h1,.sa-root h2,.sa-root h3,.sa-root h4{font-family:'Bricolage Grotesque','Figtree',system-ui,sans-serif;font-weight:700;line-height:1.1;letter-spacing:-0.015em;margin:0 0 .75rem;color:var(--ink)}
.sa-root h1{font-size:clamp(2.3rem,5.2vw,3.8rem);line-height:1.05}
.sa-root h2{font-size:clamp(1.8rem,3.6vw,2.6rem)}
.sa-root h3{font-size:1.35rem;margin-top:1.75rem}
.sa-root h4{font-size:1.08rem;margin-top:1.25rem}
.sa-root p{margin:0 0 1rem;max-width:68ch}
.sa-root a{color:var(--brand);text-underline-offset:3px}
.sa-root a:hover{color:var(--brand-d)}
.sa-root :focus-visible{outline:3px solid var(--brand-d);outline-offset:2px}
.sa-header :focus-visible,.sa-hero :focus-visible,.sa-book-info :focus-visible,.sa-footer :focus-visible{outline-color:var(--cyan-l)}
.sa-wrap{max-width:1140px;margin:0 auto;padding:0 1.25rem;position:relative}
.sa-root .sa-muted{color:var(--muted);font-size:.97rem}
.sa-root .sa-note{color:var(--muted);font-size:.97rem;margin-top:1rem}
.sa-root .sa-lede{font-size:1.25rem;color:var(--muted);max-width:34rem}
.sa-root .sa-lede-sm{font-size:1.12rem;color:var(--muted)}
.sa-root .sa-intro{margin-bottom:1.5rem}
.sa-root .sa-gap{margin-top:3rem}
.sa-scroll{overflow-x:auto}
.sa-list{margin:0 0 1rem;padding-left:1.2rem}
.sa-list li{margin-bottom:.25rem}
.sa-list li::marker{color:#F0705A}

/* accent tones cycle through the cards and badges (blue, coral, teal, violet) */
.sa-tone-0{--c:#3450D4;--tint:#E6ECFF;--d:#263DB0}
.sa-tone-1{--c:#F0705A;--tint:#FFE7E0;--d:#A93E2A}
.sa-tone-2{--c:#2FB596;--tint:#DBF3EB;--d:#0E6B55}
.sa-tone-3{--c:#7B5CF5;--tint:#ECE6FF;--d:#4B2FB0}

.sa-demo{background:linear-gradient(90deg,#E6ECFF,#D8E2FF 50%,#E9E2FF);color:var(--brand-d);padding:.5rem 1rem;font-size:.93rem;font-weight:600;text-align:center;border-bottom:1px solid var(--line)}

/* buttons */
.sa-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:.6rem 1.4rem;border-radius:12px;border:1.5px solid transparent;font:700 1rem 'Figtree',system-ui,sans-serif;cursor:pointer;text-decoration:none;transition:background .15s,box-shadow .15s,transform .15s,border-color .15s}
.sa-btn-primary{background:var(--btn-grad);color:#fff;box-shadow:0 1px 2px rgba(38,61,176,.35),0 8px 20px -8px rgba(90,70,240,.7)}
.sa-root a.sa-btn-primary{color:#fff}
.sa-btn-primary:hover{background:var(--btn-grad-h);transform:translateY(-1px)}
.sa-btn-primary:disabled{opacity:.6;cursor:progress;transform:none}
.sa-btn-ghost{background:#fff;color:var(--brand-d);border-color:#B7C3F0}
.sa-root a.sa-btn-ghost{color:var(--brand-d)}
.sa-btn-ghost:hover{border-color:var(--brand);background:var(--brand-tint)}
.sa-actions{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:1.75rem}

/* header: same navy gradient as the footer */
.sa-header{position:sticky;top:0;z-index:20;background:var(--navy-grad);border-bottom:1px solid rgba(255,255,255,.12);box-shadow:0 6px 24px -12px rgba(5,10,35,.6)}
.sa-header-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:68px}
.sa-brand{white-space:nowrap;font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:1.25rem;letter-spacing:-0.015em;text-decoration:none;display:inline-flex;align-items:center;gap:.6rem}
.sa-brand::before{content:'';width:.9rem;height:.9rem;border-radius:50%;background:linear-gradient(135deg,#FF8A73,#F0705A);box-shadow:.5rem 0 0 var(--cyan);margin-right:.5rem}
.sa-root a.sa-brand{color:#fff}
.sa-root a.sa-brand:hover{color:#fff}
.sa-nav{display:flex;align-items:center;gap:1.1rem}
.sa-nav a,.sa-nav .sa-btn{white-space:nowrap}
.sa-root .sa-nav a:not(.sa-btn){color:#E6ECFF;text-decoration:none;font-weight:600}
.sa-root .sa-nav a:not(.sa-btn):hover{color:var(--cyan-l);text-decoration:underline;text-underline-offset:6px;text-decoration-thickness:2px}
.sa-nav .sa-btn{min-height:44px;padding:.4rem 1.1rem}
.sa-menu-btn{display:none;min-height:44px;padding:.4rem .9rem;border:1.5px solid rgba(255,255,255,.4);border-radius:12px;background:rgba(255,255,255,.08);color:#fff;font:700 .95rem 'Figtree',sans-serif;cursor:pointer}
.sa-menu-btn:hover{background:rgba(255,255,255,.18)}

/* hero: deep navy with soft blue and cyan glows */
.sa-hero{position:relative;overflow:hidden;color:#fff;padding:4.5rem 0 4.25rem;
  background:radial-gradient(circle at 88% 18%,rgba(90,110,255,.5),transparent 45%),radial-gradient(circle at 8% 95%,rgba(60,201,232,.28),transparent 42%),linear-gradient(160deg,#0A1233 0%,#15286B 60%,#1D3390 100%)}
.sa-hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:3.5rem;align-items:center;position:relative;z-index:1}
.sa-root .sa-hero h1{color:#fff}
.sa-root .sa-hero .sa-lede{color:#D3DCF7}
.sa-root .sa-hero .sa-note{color:var(--soft-text)}
.sa-root .sa-hero a.sa-btn-ghost{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.4)}
.sa-root .sa-hero a.sa-btn-ghost:hover{background:rgba(255,255,255,.18);border-color:#fff;color:#fff}

/* adviser: circular photo and a few lines of text on the navy hero */
.sa-adviser{display:flex;flex-direction:column;align-items:center;text-align:center;justify-self:end;width:100%;max-width:440px;padding:.5rem 0}
.sa-photo{position:relative;width:min(260px,100%);aspect-ratio:1 / 1;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#4F6BFF,#3CC9E8);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;font:700 4rem 'Bricolage Grotesque',sans-serif;flex:none;box-shadow:0 0 0 6px rgba(255,255,255,.14),0 24px 50px -18px rgba(0,0,0,.6)}
.sa-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%}
.sa-photo-initials{line-height:1}
.sa-photo-wrap{display:flex;flex-direction:column;align-items:center;width:100%}
.sa-root .sa-photo-note{margin:.7rem 0 0;font-size:.85rem;color:var(--soft-text);max-width:none}
.sa-root .sa-adviser-name{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:1.7rem;line-height:1.15;letter-spacing:-0.015em;margin:1.25rem 0 .25rem;color:#fff}
.sa-root .sa-adviser-role{color:var(--soft-text);margin:0 0 .7rem}
.sa-root .sa-adviser-line{margin:0 0 .2rem;max-width:none;color:#E6ECFF}
.sa-root .sa-hero .sa-adviser-line.sa-muted{color:var(--soft-text)}
.sa-adviser-links{display:flex;flex-wrap:wrap;justify-content:center;gap:.2rem 1.25rem;margin-top:.6rem;font-weight:600;font-size:.97rem}
.sa-root .sa-adviser-links a{color:var(--cyan-l)}
.sa-root .sa-adviser-links a:hover{color:#fff}

/* sections */
.sa-section{padding:5rem 0;border-top:1px solid var(--line)}
.sa-hero+.sa-section{border-top:0}
.sa-tint{background:linear-gradient(180deg,#F3F6FF 0%,#E2EAFF 100%)}
.sa-blush{background:linear-gradient(135deg,#EEF1FF 0%,#E3E9FF 50%,#EEE6FF 100%)}
.sa-amber{background:linear-gradient(180deg,#E9EFFF 0%,#D9E3FF 100%)}
.sa-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:3.5rem}
.sa-two>div>:first-child{margin-top:0}
.sa-two>div:last-child>h3:first-child{margin-top:.7rem}
.sa-facts{margin:1rem 0;display:grid;gap:.6rem}
.sa-facts>div{display:grid;grid-template-columns:minmax(120px,190px) 1fr;gap:1rem;padding-bottom:.6rem;border-bottom:1px solid var(--line)}
.sa-facts dt{color:var(--muted);font-size:.97rem}
.sa-facts dd{margin:0;font-weight:500}
.sa-creds{list-style:none;margin:0 0 1rem;padding:0;display:grid;gap:.9rem}
.sa-creds li{display:grid;gap:.15rem;padding:.4rem 0 .4rem 1rem;border-left:3px solid var(--c)}
.sa-creds li:nth-child(4n+1){--c:#3450D4}
.sa-creds li:nth-child(4n+2){--c:#F0705A}
.sa-creds li:nth-child(4n+3){--c:#2FB596}
.sa-creds li:nth-child(4n+4){--c:#7B5CF5}
.sa-callout{background:linear-gradient(135deg,#E6ECFF,#DCE4FF);border-radius:14px;padding:1rem 1.2rem;margin:1.25rem 0}
.sa-root .sa-callout p{margin:.25rem 0 0}
.sa-notice{background:linear-gradient(135deg,#EEF2FF,#E0E8FF);border:1px solid var(--line);border-radius:14px;padding:1rem 1.2rem;margin-top:1.75rem}
.sa-root .sa-notice p{margin-bottom:.5rem;font-size:.97rem}
.sa-root .sa-notice p:last-child{margin-bottom:0}

/* journey */
.sa-route{list-style:none;margin:2.25rem 0 1.5rem;padding:0;display:grid;grid-template-columns:repeat(var(--n),1fr);position:relative}
.sa-route::before{content:'';position:absolute;left:calc(50% / var(--n));right:calc(50% / var(--n));top:20px;height:0;border-top:2px dashed #9FB0EC}
.sa-route li{position:relative}
.sa-route button{background:none;border:0;cursor:pointer;color:var(--ink);font:600 .95rem 'Figtree',sans-serif;display:flex;flex-direction:column;align-items:center;gap:.6rem;padding:.25rem .2rem;width:100%;text-align:center}
.sa-dot{width:42px;height:42px;border-radius:50%;background:#fff;border:2px solid #9FB0EC;color:var(--brand-d);display:grid;place-items:center;font:700 1rem 'Bricolage Grotesque',sans-serif;position:relative;z-index:1;transition:transform .15s,background .15s}
.sa-route button:hover .sa-dot{transform:scale(1.08);border-color:var(--brand)}
.sa-route button[aria-current="step"] .sa-dot{background:var(--btn-grad);border-color:transparent;color:#fff;transform:scale(1.12);box-shadow:0 8px 16px -6px rgba(90,70,240,.75)}
.sa-route button[aria-current="step"] .sa-route-label{font-weight:700;color:var(--brand-d)}
.sa-root .sa-route-desc{min-height:3.4em;max-width:60ch;font-size:1.1rem}

/* destination cards */
.sa-dests{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:1.5rem;margin:1.75rem 0 2.5rem}
.sa-dest{display:flex;flex-direction:column;text-align:left;padding:0;background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:20px;overflow:hidden;cursor:pointer;box-shadow:var(--shadow-s);font:inherit;transition:transform .18s,box-shadow .18s,border-color .18s}
.sa-dest:hover{transform:translateY(-4px);box-shadow:var(--shadow-m)}
.sa-dest[aria-pressed="true"]{border-color:var(--c);box-shadow:0 0 0 3px var(--c),var(--shadow-m)}
.sa-dest:focus-visible{outline:3px solid var(--brand-d);outline-offset:3px}
.sa-dest-media{position:relative;display:block;aspect-ratio:4 / 3;background:linear-gradient(135deg,var(--tint),#fff 130%);overflow:hidden}
.sa-dest-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sa-dest-ph{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35rem;color:var(--d);text-align:center;padding:1rem}
.sa-dest-ph svg{width:44px;height:44px;opacity:.7}
.sa-dest-code{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:3rem;line-height:1;letter-spacing:.02em}
.sa-dest-ph-note{font-size:.85rem;font-weight:600;opacity:.85}
.sa-dest-badge{position:absolute;left:14px;bottom:14px;width:48px;height:48px;border-radius:50%;background:#fff;color:var(--d);border:2px dashed var(--c);display:grid;place-items:center;font:700 .82rem 'Bricolage Grotesque',sans-serif;transform:rotate(-8deg);box-shadow:0 2px 8px rgba(0,0,0,.18)}
.sa-dest-body{display:flex;flex-direction:column;gap:.45rem;padding:1.15rem 1.3rem 1.3rem;flex:1}
.sa-dest-name{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:1.5rem;line-height:1.15}
.sa-dest-headline{color:var(--muted);font-size:.98rem;line-height:1.45}
.sa-chips{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.15rem}
.sa-chip{background:var(--tint);color:var(--d);font-weight:600;font-size:.85rem;padding:.2rem .65rem;border-radius:999px}
.sa-dest-cta{margin-top:auto;padding-top:.5rem;font-weight:700;color:var(--d);font-size:.95rem}
.sa-dest[aria-pressed="true"] .sa-dest-cta{color:var(--brand-d)}
.sa-dest-more{background:transparent;border:2px dashed #9FB0EC;box-shadow:none}
.sa-dest-more:hover{background:#fff;border-color:var(--brand)}
.sa-dest-more .sa-dest-media{background:linear-gradient(135deg,#E6ECFF,#DCD9FF)}
.sa-dest-plus{position:absolute;inset:0;display:grid;place-items:center;color:var(--brand)}
.sa-dest-plus svg{width:64px;height:64px}

.sa-detail{background:#fff;border:1px solid var(--line);border-top:5px solid var(--c,var(--brand));border-radius:20px;padding:1.75rem 2rem;box-shadow:var(--shadow-m)}
.sa-detail h3{margin-top:0;font-size:1.9rem}
.sa-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:1.5rem}
.sa-detail-grid>div{min-width:0;overflow-x:auto}
.sa-table{border-collapse:collapse;width:100%;font-size:.97rem}
.sa-table th,.sa-table td{text-align:left;padding:.55rem .65rem;border-bottom:1px solid var(--line);vertical-align:top}
.sa-table th{font-weight:700;background:linear-gradient(90deg,#E6ECFF,#DDE3FF);color:var(--brand-d)}
.sa-root .sa-checked{margin-top:1.25rem;font-size:.97rem;color:var(--muted)}
.sa-root .is-stale{color:var(--flag)}
.sa-root .sa-checked.is-stale{background:#FFE7E0;border-radius:12px;padding:.7rem 1rem;font-weight:600}

/* services */
.sa-ruled{margin:1.75rem 0 0;counter-reset:svc}
.sa-ruled-row{display:grid;grid-template-columns:minmax(220px,.9fr) 2fr;gap:1.5rem;padding:1.3rem 0;border-top:1px solid var(--line);counter-increment:svc}
.sa-ruled-row:nth-child(4n+1){--c:#3450D4;--tint:#E6ECFF;--d:#263DB0}
.sa-ruled-row:nth-child(4n+2){--c:#F0705A;--tint:#FFE7E0;--d:#A93E2A}
.sa-ruled-row:nth-child(4n+3){--c:#2FB596;--tint:#DBF3EB;--d:#0E6B55}
.sa-ruled-row:nth-child(4n+4){--c:#7B5CF5;--tint:#ECE6FF;--d:#4B2FB0}
.sa-ruled-row:last-child{border-bottom:1px solid var(--line)}
.sa-ruled dt{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:1.22rem;display:flex;gap:.9rem;align-items:flex-start;line-height:1.2}
.sa-ruled dt::before{content:counter(svc,decimal-leading-zero);flex:none;width:2.6rem;height:2.6rem;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--tint),#fff 140%);color:var(--d);font-size:.9rem}
.sa-ruled dd{margin:0}
.sa-types{list-style:none;margin:1.25rem 0 0;padding:0;display:grid;gap:1rem}
.sa-types li{display:grid;grid-template-columns:1fr auto auto;gap:1.25rem;align-items:center;background:linear-gradient(90deg,#fff 60%,#F3F6FF);border:1px solid var(--line);border-left:5px solid var(--c);border-radius:14px;padding:1rem 1.25rem;box-shadow:var(--shadow-s)}
.sa-types li:nth-child(4n+1){--c:#3450D4}
.sa-types li:nth-child(4n+2){--c:#F0705A}
.sa-types li:nth-child(4n+3){--c:#2FB596}
.sa-types li:nth-child(4n+4){--c:#7B5CF5}
.sa-types li>div{display:grid}
.sa-fee{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:1.25rem}
.sa-types .sa-btn{min-height:44px}

/* stories */
.sa-stories{display:grid;gap:2rem}
.sa-story{margin:0;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:2.25rem;padding:2rem;background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow-m)}
.sa-story blockquote{margin:0;font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:clamp(1.25rem,2.4vw,1.7rem);line-height:1.3;font-weight:600}
.sa-story blockquote::before{content:'\\201C';display:block;font-size:5rem;line-height:.7;color:#F0705A;margin-bottom:.4rem}
.sa-story-photo{width:68px;height:68px;border-radius:50%;object-fit:cover;display:block;margin-bottom:.5rem}
.sa-story .sa-facts>div{grid-template-columns:110px 1fr}

/* resources */
.sa-resources{list-style:none;margin:1rem 0 0;padding:0;display:grid;gap:1rem}
.sa-resources li{display:grid;gap:.15rem}
.sa-resources summary,.sa-faq summary{cursor:pointer;font-weight:700}
.sa-faq{display:grid;gap:.8rem;max-width:780px}
.sa-faq details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:.9rem 1.15rem;transition:box-shadow .15s,border-color .15s}
.sa-faq details:hover{border-color:#B7C3F0}
.sa-faq details[open]{box-shadow:var(--shadow-s)}
.sa-faq summary{list-style:none;display:flex;justify-content:space-between;gap:1rem;align-items:center;font-size:1.05rem}
.sa-faq summary::-webkit-details-marker{display:none}
.sa-faq summary::after{content:'+';flex:none;width:1.9rem;height:1.9rem;border-radius:50%;background:var(--btn-grad);color:#fff;display:grid;place-items:center;font-weight:700;line-height:1}
.sa-faq details[open] summary::after{content:'\\2212'}
.sa-root .sa-faq p{margin:.7rem 0 0}

/* booking: navy gradient band with the white form card on top */
.sa-book{border-top:0;background:radial-gradient(circle at 12% 12%,rgba(90,110,255,.4),transparent 45%),radial-gradient(circle at 95% 95%,rgba(60,201,232,.22),transparent 40%),linear-gradient(160deg,#0A1233 0%,#15286B 60%,#1D3390 100%)}
.sa-book-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:3.5rem;align-items:start}
.sa-book-grid>div:first-child{position:sticky;top:96px}
.sa-root .sa-book-info h2{color:#fff}
.sa-root .sa-book-info .sa-lede-sm{color:#D3DCF7}
.sa-root .sa-book-info .sa-note{color:var(--soft-text)}
.sa-root .sa-book-info a{color:var(--cyan-l)}
.sa-root .sa-book-info a:hover{color:#fff}
.sa-contact{display:grid;gap:.8rem;margin:1.75rem 0}
.sa-contact>div{display:grid;grid-template-columns:90px 1fr;gap:.75rem}
.sa-contact dt{color:var(--soft-text)}
.sa-contact dd{margin:0;font-weight:600;color:#fff}
.sa-form{color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:22px;padding:1.75rem 1.9rem;box-shadow:0 24px 60px -20px rgba(0,0,0,.55)}
.sa-form fieldset{border:0;border-top:1px solid var(--line);margin:0;padding:1.2rem 0 .4rem;min-width:0}
.sa-form fieldset:first-of-type{border-top:0;padding-top:0}
.sa-form legend{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:1.22rem;padding:0 0 .65rem;float:left;width:100%}
.sa-form legend+*{clear:both}
.sa-fieldset-inner{border:0!important;padding:0!important;margin:0 0 1rem!important}
.sa-fieldset-inner legend{font-family:inherit!important;font-weight:700!important;font-size:1rem!important;padding:0 0 .35rem!important}
.sa-field{margin-bottom:1.1rem}
.sa-field>label{display:block;font-weight:700;margin-bottom:.3rem}
.sa-req{font-weight:500;color:var(--muted)}
.sa-input{width:100%;min-height:48px;padding:.55rem .8rem;border:1.5px solid #A9B5D6;border-radius:12px;background:#fff;font:inherit;color:var(--ink);transition:border-color .15s,box-shadow .15s}
.sa-input:focus{border-color:var(--brand);box-shadow:0 0 0 4px rgba(52,80,212,.18);outline:none}
textarea.sa-input{min-height:110px}
.sa-input[aria-invalid="true"]{border-color:#C0281B}
.sa-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.sa-choices{display:grid;gap:.7rem}
.sa-choice{display:flex;gap:.8rem;align-items:flex-start;padding:.85rem 1rem;border:1.5px solid var(--line);border-radius:14px;cursor:pointer;background:#fff;transition:background .15s,border-color .15s}
.sa-choice:hover{background:var(--sky);border-color:#B7C3F0}
.sa-choice:has(input:checked){background:linear-gradient(135deg,#E6ECFF,#E6E0FF);border-color:var(--brand)}
.sa-choice input{margin-top:.3rem;accent-color:var(--brand)}
.sa-choice>span{display:grid}
.sa-checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:.5rem .75rem}
.sa-check{display:flex;gap:.6rem;align-items:flex-start;font-weight:500;min-height:32px}
.sa-check input{margin-top:.35rem;width:18px;height:18px;flex:none;accent-color:var(--brand)}
.sa-root .sa-error{color:#B3241A;font-size:.94rem;font-weight:600;margin:.3rem 0 0}
.sa-error-summary{border:1.5px solid #D9776D;background:#FFF0EE;border-radius:14px;padding:.9rem 1.1rem;margin-bottom:1.25rem;color:#7A1F16}
.sa-error-summary ul{margin:.4rem 0 0;padding-left:1.1rem}
.sa-root .sa-error-summary a{color:#7A1F16}
.sa-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.sa-submit{width:100%;margin:.5rem 0 1.1rem;min-height:54px;font-size:1.08rem}
.sa-done h3{margin-top:0}
.sa-more{border-top:1px solid var(--line);margin:.5rem 0 1rem;padding-top:.75rem}
.sa-more>summary{cursor:pointer;font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:1.08rem;padding:.4rem 0}
.sa-more>summary+*{margin-top:.5rem}
.sa-links{display:flex;flex-wrap:wrap;gap:.4rem 1.5rem}
.sa-root .sa-complaints{margin-top:1.5rem}

/* footer: same navy gradient as the header */
.sa-footer{background:linear-gradient(135deg,#0A1233 0%,#132766 55%,#1F3A9C 100%);color:#C9D2EC;padding:3rem 0}
.sa-root .sa-footer p{max-width:70ch}
.sa-root .sa-footer a{color:var(--cyan-l)}
.sa-root .sa-footer a:hover{color:#fff}
.sa-root .sa-footer-note{font-size:.95rem}

/* responsive */
@media (max-width:900px){
  .sa-hero-grid,.sa-two,.sa-book-grid,.sa-story{grid-template-columns:1fr}
  .sa-adviser{justify-self:center;margin-top:1rem}
  .sa-book-grid>div:first-child{position:static}
  .sa-hero{padding:3rem 0 3.25rem}
  .sa-ruled-row{grid-template-columns:1fr;gap:.6rem}
  .sa-types li{grid-template-columns:1fr;gap:.6rem}
  .sa-section{padding:3.5rem 0}
}
@media (max-width:1100px){
  .sa-menu-btn{display:inline-flex;align-items:center}
  .sa-nav{display:none;position:absolute;left:0;right:0;top:100%;background:linear-gradient(180deg,#132766,#0A1233);border-bottom:1px solid rgba(255,255,255,.12);padding:1rem 1.25rem 1.25rem;flex-direction:column;align-items:flex-start;gap:.9rem;box-shadow:0 18px 32px -14px rgba(5,10,35,.7)}
  .sa-nav.is-open{display:flex}
}
@media (max-width:820px){
  .sa-route{grid-template-columns:1fr;gap:.2rem}
  .sa-route::before{left:20px;right:auto;top:20px;bottom:20px;width:0;height:auto;border-top:0;border-left:2px dashed #9FB0EC}
  .sa-route button{flex-direction:row;text-align:left;justify-content:flex-start;gap:.9rem}
}
@media (max-width:560px){
  .sa-photo{width:200px;font-size:3rem}
  .sa-root .sa-adviser-name{font-size:1.45rem}
  .sa-brand{white-space:normal;line-height:1.15;font-size:1.1rem;min-width:0}
  .sa-brand::before{margin-right:.25rem}
  .sa-row{grid-template-columns:1fr}
  .sa-facts>div{grid-template-columns:1fr;gap:.1rem}
  .sa-contact>div{grid-template-columns:1fr;gap:.1rem}
  .sa-form{padding:1.2rem}
  .sa-detail{padding:1.25rem}
  .sa-story{padding:1.25rem}
}
@media (prefers-reduced-motion:reduce){
  .sa-root *{transition:none!important;scroll-behavior:auto!important}
  .sa-dest:hover,.sa-btn:hover{transform:none!important}
}
.sa-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
`;