'use client'

/**
 * Civil / Architectural Consultation — public site template (v2, professional)
 * ---------------------------------------------------------------
 * Concept: a calm, confident practice website. The 3D banner image carries
 * the first impression; everything after it is quiet, well spaced and easy
 * to scan, so the consultation call-to-action is always obvious.
 *
 * Tokens
 *   ink   #212121  charcoal, matches the banner render    mist  #F3F5F6  alternate bands
 *   teal  #0E7C86  actions and highlights                sand  #E7E1D3  soft accent band
 *   steel #5E6C75  secondary text                        line  #D9E0E3  borders
 * Type
 *   Bricolage Grotesque for headings, Figtree for everything else.
 *
 * Hero image (template_data.hero_image) adapts to its shape:
 *   square / portrait (like a 1:1 3D render on a dark ground) -> split hero,
 *     text left, image right, edges feathered into the charcoal background
 *   wide (16:9 or wider) -> full-bleed banner with the text over a dark gradient
 *
 * Usage
 *   <CivilArchSite payload={sitePayload} siteSlug="nair" />   // live
 *   <CivilArchSite payload={SAMPLE_PAYLOAD} demo />           // gallery
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  MessageCircle, MapPin, Check, Download, X, Ruler, LayoutGrid, FileText,
  Calculator, HardHat, Mail, Clock,
} from 'lucide-react'
import {
  PROJECT_CATEGORIES, PROJECT_STATUSES, DELIVERABLE_TYPES, DEFAULT_FAQS,
  SAMPLE_PAYLOAD, SAMPLE_DELIVERABLES, parseProjects, parseFees,
} from '@/lib/civil-arch-schema'
import { submitEnquiry, actOnDeliverable } from '@/lib/civil-arch-api'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ── payload → view data ───────────────────────────────────────────
const list = v => (Array.isArray(v) ? v : []).map(s => String(s || '').trim()).filter(Boolean)

function formatPrice(tier, market, mode) {
  const inr = tier.priceInr ? `₹${Number(tier.priceInr).toLocaleString('en-IN')}` : ''
  const usd = tier.priceUsd ? `$${Number(tier.priceUsd).toLocaleString('en-US')}` : ''
  const parts = market === 'india' ? [inr] : market === 'global' ? [usd] : [inr, usd]
  const s = parts.filter(Boolean).join(' / ')
  return s ? (mode === 'from' ? `From ${s}` : s) : ''
}

export function payloadToData(payload) {
  const p = payload || {}
  const b = p.business || {}, o = b.owner || {}, pos = p.positioning || {}
  const td = p.template_data || {}, fd = p.frontDoor || {}, kn = p.knowledge || {}
  const of = p.offers || {}, pr = p.proof || {}
  const market = p.site?.market || 'india'

  const cities = list(td.service_cities)
  const modes = list(td.delivery_modes)
  const remote = modes.includes('remote')
  const selectedCats = list(td.project_categories)
  const categories = PROJECT_CATEGORIES.filter(c => !selectedCats.length || selectedCats.includes(c.value))
  const cityForFaq = cities[0] || b.city || 'your city'

  const tier1 = (of.tiers || []).find(t => t.tier === 'front_door' && t.name)
  const fixed = tier1 ? {
    name: tier1.name, summary: tier1.summary, duration: tier1.duration,
    deliverables: list(tier1.deliverables), price: formatPrice(tier1, market, of.priceDisplay),
  } : null

  const ownFaqs = (kn.faqs || []).filter(f => f.question && f.answer).map(f => ({ q: f.question, a: f.answer }))
  const defaults = DEFAULT_FAQS.map(f => ({ q: f.q.replace('{city}', cityForFaq), a: f.a.replace(/\{city\}/g, cityForFaq) }))

  const credentials = [
    { label: 'Architect registration', value: td.council_reg },
    { label: 'Engineering credentials', value: td.engineer_creds },
    ...list(pr.credentials).map(c => ({ label: 'Credential', value: c })),
  ].filter(c => c.value)

  const areaText = cities.length
    ? cities.join(', ') + (remote ? ', and remote consultations' : '')
    : remote ? 'Remote consultations available' : (b.city || '')

  return {
    brand: { name: b.brandName || 'Your practice', city: b.city, logo: b.logoUrl },
    owner: { name: o.name, role: o.role, photo: o.photoUrl, email: o.email, whatsapp: o.whatsapp },
    hero: {
      headline: b.tagline || 'Plan your home with clarity.',
      sub: 'From plot assessment and floor plans to detailed drawings, estimates and site support.',
      statement: pos.sentence || '',
      image: td.hero_image || '',
      ctaLabel: fd.buttonLabel || 'Book a consultation',
    },
    area: { text: areaText, remote, cities },
    categories,
    bio: pos.credibility || b.description || '',
    philosophy: td.philosophy || '',
    education: list(td.education),
    credentials,
    stats: [
      pr.yearsExperience ? { n: pr.yearsExperience, label: 'years in practice' } : null,
      pr.clientsServed ? { n: pr.clientsServed, label: 'clients served' } : null,
    ].filter(Boolean),
    projects: parseProjects(td.projects),
    pricing: { models: list(td.pricing_models), fixed, fees: parseFees(td.starting_fees) },
    process: (kn.process || []).filter(s => s.title),
    testimonials: (pr.testimonials || []).filter(t => t.name && t.quote),
    faqs: [...ownFaqs, ...defaults],
    form: { questions: list(fd.formQuestions), responseTime: fd.responseTime, workingHours: fd.workingHours },
    portal: { documents: list(td.portal_features).includes('documents'), approvals: list(td.portal_features).includes('approvals') },
    cta: { action: fd.primaryAction || 'enquiry_form', bookingUrl: fd.bookingUrl },
    social: p.channels?.social || {},
  }
}

// ── helpers ───────────────────────────────────────────────────────
function waLink(d, text) {
  let n = (d.owner.whatsapp || '').replace(/\D/g, '')
  if (!n) return ''
  if (n.length === 10) n = '91' + n
  return `https://wa.me/${n}?text=${encodeURIComponent(text || `Hello ${d.owner.name || ''}, I found your website and would like to talk about a project.`)}`
}
function ctaTarget(d) {
  if (d.cta.action === 'book_call' && d.cta.bookingUrl) return { href: d.cta.bookingUrl, ext: true }
  if (d.cta.action === 'whatsapp' && waLink(d)) return { href: waLink(d), ext: true }
  if (d.cta.action === 'buy_tier1' && d.pricing.fixed) return { href: '#fees' }
  return { href: '#enquire' }
}
const extProps = t => (t.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})

// ── styles ────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..700&family=Figtree:wght@400..700&display=swap');
.ca-root{--ink:#212121;--mist:#F3F5F6;--teal:#0E7C86;--teal-d:#0A5F67;--sand:#E7E1D3;--steel:#5E6C75;--line:#D9E0E3;
  background:#fff;color:var(--ink);font-family:'Figtree',system-ui,sans-serif;font-size:1.0625rem;line-height:1.6;scroll-behavior:smooth}
.ca-root *{box-sizing:border-box}
.ca-root a{color:inherit}
.ca-h{font-family:'Bricolage Grotesque','Figtree',sans-serif;font-weight:600;letter-spacing:-.02em;line-height:1.1;margin:0}
.ca-wrap{max-width:1160px;margin:0 auto;padding:0 24px}
.ca-band{background:var(--mist)}
.ca-dark{background:var(--ink);color:#fff}
.ca-p{max-width:64ch;margin:0}
.ca-muted{color:var(--steel)}
.ca-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.85rem 1.4rem;background:var(--teal);color:#fff!important;font-weight:600;border:1.5px solid var(--teal);border-radius:6px;text-decoration:none;cursor:pointer;font-family:inherit;font-size:1rem;line-height:1.2;transition:background .15s}
.ca-btn:hover{background:var(--teal-d);border-color:var(--teal-d)}
.ca-btn-o{background:transparent;color:var(--ink)!important;border-color:var(--ink)}
.ca-btn-o:hover{background:var(--ink);border-color:var(--ink);color:#fff!important}
.ca-btn-w{background:transparent;color:#fff!important;border-color:rgba(255,255,255,.75)}
.ca-btn-w:hover{background:#fff;border-color:#fff;color:var(--ink)!important}
.ca-btn-s{padding:.55rem 1rem;font-size:.9rem}
.ca-btn:disabled{opacity:.5;cursor:not-allowed}
.ca-root :focus-visible{outline:3px solid #7CC7D0;outline-offset:2px}
.ca-card{background:#fff;border:1px solid var(--line);border-radius:10px}
.ca-input{width:100%;padding:.7rem .85rem;border:1.5px solid var(--line);background:#fff;font:inherit;color:var(--ink);border-radius:6px}
.ca-input:focus{border-color:var(--teal);outline:none;box-shadow:0 0 0 3px rgba(14,124,134,.2)}
.ca-label{display:block;font-weight:600;font-size:.9rem;margin-bottom:.3rem}
.ca-tabs{display:flex;gap:4px;overflow-x:auto;border-bottom:1px solid var(--line)}
.ca-tab{background:none;border:0;border-bottom:3px solid transparent;padding:.7rem .9rem;font:inherit;font-weight:500;color:var(--steel);cursor:pointer;white-space:nowrap;margin-bottom:-1px}
.ca-tab:hover{color:var(--ink)}
.ca-tab[aria-pressed=true]{color:var(--ink);border-bottom-color:var(--teal);font-weight:700}
.ca-pill{display:inline-flex;align-items:center;gap:6px;font-size:.8rem;font-weight:600;padding:3px 10px;border-radius:999px;background:var(--mist);color:var(--ink)}
.ca-faq summary{cursor:pointer;list-style:none;padding:1.1rem 0;font-weight:600;display:flex;justify-content:space-between;gap:1rem}
.ca-faq summary::-webkit-details-marker{display:none}
.ca-faq summary::after{content:'+';font-size:1.5rem;line-height:1;color:var(--teal);font-weight:400}
.ca-faq[open] summary::after{content:'\\2212'}
.ca-heroimg{animation:ca-in 1.6s ease both}
@keyframes ca-in{from{transform:scale(1.05);opacity:.7}to{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.ca-heroimg{animation:none}.ca-root{scroll-behavior:auto}}
.ca-nav a{text-decoration:none;white-space:nowrap;padding:6px 2px;color:var(--steel);font-weight:500}
.ca-nav a:hover{color:var(--ink)}
@media(min-width:960px){.ca-nav{order:0!important;flex-basis:auto!important}}
`

// ── layout pieces ─────────────────────────────────────────────────
function Section({ id, band, dark, children }) {
  return (
    <section id={id} className={dark ? 'ca-dark' : band ? 'ca-band' : ''} style={{ padding: '88px 0', scrollMarginTop: 72 }}>
      <div className="ca-wrap">{children}</div>
    </section>
  )
}
function Head({ title, children, light }) {
  return (
    <div style={{ marginBottom: 40, maxWidth: 720 }}>
      <h2 className="ca-h" style={{ fontSize: 'clamp(1.9rem,3.8vw,2.7rem)' }}>{title}</h2>
      {children && <p className={`ca-p ${light ? '' : 'ca-muted'}`} style={{ marginTop: 12, fontSize: '1.1rem', opacity: light ? .8 : 1 }}>{children}</p>}
    </div>
  )
}

function Header() {
  const d = useData()
  const cta = ctaTarget(d)
  const links = [
    ['#services', 'Services'], ['#about', 'About'],
    d.projects.length ? ['#projects', 'Projects'] : null,
    d.pricing.models.length ? ['#fees', 'Fees'] : null,
    d.portal.documents || d.portal.approvals ? ['#portal', 'Client portal'] : null,
    ['#faq', 'FAQ'],
  ].filter(Boolean)
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, background: '#fff', borderBottom: '1px solid var(--line)' }}>
      <div className="ca-wrap" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 24px', flexWrap: 'wrap' }}>
        <a href="#top" className="ca-h" style={{ fontSize: '1.25rem', textDecoration: 'none', marginRight: 'auto' }}>
          {d.brand.logo ? <img src={d.brand.logo} alt={d.brand.name} style={{ height: 34 }} /> : d.brand.name}
        </a>
        <nav aria-label="Sections" className="ca-nav" style={{ display: 'flex', gap: 22, overflowX: 'auto', order: 3, flexBasis: '100%', fontSize: '.95rem' }}>
          {links.map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </nav>
        <a href={cta.href} {...extProps(cta)} className="ca-btn ca-btn-s">{d.hero.ctaLabel}</a>
      </div>
    </header>
  )
}

// Shown only when no banner image is supplied: a quiet isometric wireframe.
function FallbackArt() {
  return (
    <svg viewBox="0 0 600 400" aria-hidden="true" style={{ position: 'absolute', right: '-4%', top: '8%', width: 'min(62%,760px)', opacity: .5 }}>
      <g fill="none" stroke="#9BD6DC" strokeWidth="1.3" strokeLinejoin="round">
        <polygon points="300,330 140,250 300,170 460,250" opacity=".5" />
        <polygon points="300,220 140,140 300,60 460,140" />
        <polygon points="300,212 128,136 300,52 472,136" opacity=".45" />
        <line x1="140" y1="250" x2="140" y2="140" /><line x1="300" y1="330" x2="300" y2="220" /><line x1="460" y1="250" x2="460" y2="140" />
        {[0.33, 0.66].map(t => (
          <g key={t} opacity=".55">
            <line x1="140" y1={250 - 110 * t} x2="300" y2={330 - 110 * t} /><line x1="300" y1={330 - 110 * t} x2="460" y2={250 - 110 * t} />
          </g>
        ))}
      </g>
    </svg>
  )
}

function Hero() {
  const d = useData()
  const cta = ctaTarget(d)
  const wa = waLink(d)
  const imgRef = useRef(null)
  const [wide, setWide] = useState(false)
  const check = el => { if (el && el.naturalWidth) setWide(el.naturalWidth / el.naturalHeight >= 1.5) }
  useEffect(() => { check(imgRef.current) }, [d.hero.image])
  const split = !!d.hero.image && !wide
  const mask = 'linear-gradient(90deg,transparent 0,#000 12%,#000 100%),linear-gradient(0deg,transparent 0,#000 6%,#000 100%)'
  const facts = [
    d.area.text ? { label: 'Serving', value: d.area.text } : null,
    d.credentials[0] ? { label: d.credentials[0].label, value: d.credentials[0].value } : null,
    ...d.stats.map(s => ({ label: s.label, value: String(s.n) })),
    d.form.responseTime ? { label: 'Reply time', value: d.form.responseTime } : null,
  ].filter(Boolean).slice(0, 4)

  return (
    <>
      <section id="top" style={{ position: 'relative', overflow: 'hidden', background: '#212121', color: '#fff', display: 'flex', alignItems: 'center', minHeight: split ? 0 : 'min(86vh,720px)' }}>
        {!d.hero.image && <FallbackArt />}
        {d.hero.image && wide && (
          <>
            <img ref={imgRef} onLoad={e => check(e.currentTarget)} className="ca-heroimg" src={d.hero.image} alt={`3D view of a building by ${d.brand.name}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center' }} />
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(33,33,33,.92) 0%,rgba(33,33,33,.62) 42%,rgba(33,33,33,.08) 78%),linear-gradient(0deg,rgba(33,33,33,.45),transparent 40%)' }} />
          </>
        )}
        <div className="ca-wrap" style={{ position: 'relative', padding: split ? '64px 24px 112px' : '96px 24px 128px', width: '100%', display: 'grid', gap: 32, gridTemplateColumns: split ? 'repeat(auto-fit,minmax(min(100%,420px),1fr))' : '1fr', alignItems: 'center' }}>
          <div style={{ maxWidth: 660 }}>
            <h1 className="ca-h" style={{ fontSize: split ? 'clamp(2.4rem,5vw,4rem)' : 'clamp(2.6rem,6.2vw,4.6rem)' }}>{d.hero.headline}</h1>
            <p className="ca-p" style={{ fontSize: '1.25rem', margin: '20px 0 0', opacity: .92 }}>{d.hero.sub}</p>
            {d.hero.statement && <p className="ca-p" style={{ margin: '14px 0 0', opacity: .75 }}>{d.hero.statement}</p>}
            <ul aria-label="Project types" style={{ listStyle: 'none', padding: 0, margin: '26px 0 30px', display: 'flex', flexWrap: 'wrap', gap: '8px 0', fontWeight: 500, opacity: .95 }}>
              {['Residential', 'Renovation', 'Farmhouse', 'Commercial', 'Construction consultation'].map((t, i) => (
                <li key={t} style={{ padding: '0 16px 0 0', marginRight: 16, borderRight: i < 4 ? '1px solid rgba(255,255,255,.4)' : 'none' }}>{t}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={cta.href} {...extProps(cta)} className="ca-btn" style={{ padding: '1rem 1.7rem', fontSize: '1.05rem' }}>{d.hero.ctaLabel}</a>
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="ca-btn ca-btn-w" style={{ padding: '1rem 1.5rem' }}><MessageCircle size={18} aria-hidden />WhatsApp the consultant</a>}
            </div>
          </div>
          {split && (
            <div style={{ position: 'relative', width: '100%', maxWidth: 640, justifySelf: 'end', aspectRatio: '1 / 0.94', overflow: 'hidden', WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' }}>
              <img ref={imgRef} onLoad={e => check(e.currentTarget)} className="ca-heroimg" src={d.hero.image} alt={`3D view of a building by ${d.brand.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center bottom', display: 'block' }} />
            </div>
          )}
        </div>
      </section>
      {facts.length > 0 && (
        <div className="ca-wrap" style={{ marginTop: -56, position: 'relative', zIndex: 2 }}>
          <dl className="ca-card" style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', boxShadow: '0 12px 32px rgba(0,0,0,.14)' }}>
            {facts.map((f, i) => (
              <div key={f.label} style={{ padding: '20px 24px', borderLeft: i ? '1px solid var(--line)' : 'none' }}>
                <dt className="ca-muted" style={{ fontSize: '.85rem' }}>{f.label}</dt>
                <dd style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '1.05rem' }}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </>
  )
}

const SCOPE = [
  [Ruler, 'Plot assessment', 'Size, shape, access, slope and what the local rules allow.'],
  [LayoutGrid, 'Floor plans', 'Layouts that fit the way your household actually lives.'],
  [FileText, 'Detailed drawings', 'The set your contractor builds from, coordinated across trades.'],
  [Calculator, 'Estimates', 'A quantified estimate, so cost is known before work starts.'],
  [HardHat, 'Site support', 'Visits and answers while the building goes up.'],
]

function Services() {
  const d = useData()
  return (
    <Section id="services">
      <div style={{ display: 'grid', gap: 56, gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', alignItems: 'start' }}>
        <div>
          <Head title="Plan your home with clarity">From the first look at your plot to the last site visit, one consultant keeps the design, the drawings and the cost in step.</Head>
          <h3 className="ca-h" style={{ fontSize: '1.05rem', marginBottom: 12 }}>Project types</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {d.categories.map(c => <li key={c.value} className="ca-pill" style={{ padding: '6px 14px', fontSize: '.9rem', fontWeight: 500 }}>{c.label}</li>)}
          </ul>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
          {SCOPE.map(([Icon, t, s]) => (
            <li key={t} style={{ display: 'flex', gap: 16, padding: '18px 0', borderBottom: '1px solid var(--line)' }}>
              <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--mist)', color: 'var(--teal)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon size={22} /></span>
              <span><strong style={{ fontSize: '1.1rem' }}>{t}</strong><br /><span className="ca-muted">{s}</span></span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function About() {
  const d = useData()
  const initials = (d.owner.name || d.brand.name || '').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <>
      <Section id="about" band>
        <div style={{ display: 'grid', gap: 48, gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 24 }}>
              {d.owner.photo
                ? <img src={d.owner.photo} alt={d.owner.name} style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover' }} />
                : <span aria-hidden="true" className="ca-h" style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--ink)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '1.8rem' }}>{initials}</span>}
              <div><h2 className="ca-h" style={{ fontSize: 'clamp(1.7rem,3.2vw,2.3rem)' }}>{d.owner.name || d.brand.name}</h2><p className="ca-muted" style={{ margin: '4px 0 0' }}>{d.owner.role}</p></div>
            </div>
            {d.bio && <p className="ca-p" style={{ fontSize: '1.1rem' }}>{d.bio}</p>}
            {d.stats.length > 0 && (
              <dl style={{ display: 'flex', gap: 40, margin: '32px 0 0', flexWrap: 'wrap' }}>
                {d.stats.map(s => <div key={s.label}><dd className="ca-h" style={{ margin: 0, fontSize: '2.4rem', color: 'var(--teal)' }}>{s.n}</dd><dt className="ca-muted" style={{ fontSize: '.9rem' }}>{s.label}</dt></div>)}
              </dl>
            )}
          </div>
          <div className="ca-card" style={{ borderTop: '4px solid var(--teal)' }}>
            {d.education.length > 0 && (
              <div style={{ padding: 24, borderBottom: d.credentials.length ? '1px solid var(--line)' : 'none' }}>
                <h3 className="ca-h" style={{ fontSize: '1.1rem', marginBottom: 10 }}>Education</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{d.education.map(e => <li key={e} style={{ padding: '2px 0' }}>{e}</li>)}</ul>
              </div>
            )}
            {d.credentials.length > 0 && (
              <div style={{ padding: 24 }}>
                <h3 className="ca-h" style={{ fontSize: '1.1rem', marginBottom: 10 }}>Registration and credentials</h3>
                <dl style={{ margin: 0 }}>{d.credentials.map((c, i) => <div key={i} style={{ padding: '6px 0' }}><dt className="ca-muted" style={{ fontSize: '.85rem' }}>{c.label}</dt><dd style={{ margin: 0, fontWeight: 600 }}>{c.value}</dd></div>)}</dl>
              </div>
            )}
            {!d.education.length && !d.credentials.length && <p className="ca-muted" style={{ padding: 24, margin: 0 }}>Qualifications appear here once added.</p>}
          </div>
        </div>
      </Section>

      {d.philosophy && (
        <section className="ca-dark" style={{ padding: '72px 0' }}>
          <div className="ca-wrap">
            <blockquote className="ca-h" style={{ margin: 0, maxWidth: 900, fontSize: 'clamp(1.5rem,3.2vw,2.3rem)', fontWeight: 500, lineHeight: 1.3 }}>{d.philosophy}</blockquote>
            <p style={{ margin: '20px 0 0', opacity: .7 }}>Design and engineering philosophy, {d.owner.name || d.brand.name}</p>
          </div>
        </section>
      )}

      {d.testimonials.length > 0 && (
        <Section>
          <Head title="What clients say" />
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))' }}>
            {d.testimonials.map((t, i) => (
              <figure key={i} className="ca-card" style={{ margin: 0, padding: 24 }}>
                <blockquote className="ca-p" style={{ margin: '0 0 14px' }}>{t.quote}</blockquote>
                <figcaption className="ca-muted" style={{ fontSize: '.95rem' }}><strong style={{ color: 'var(--ink)' }}>{t.name}</strong>{t.role ? `, ${t.role}` : ''}</figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

const PLANS = [
  [[0, 55, 160, 55], [70, 0, 70, 55], [70, 55, 70, 110], [110, 55, 110, 110]],
  [[0, 40, 90, 40], [90, 0, 90, 110], [90, 70, 160, 70], [40, 40, 40, 110]],
  [[55, 0, 55, 110], [55, 60, 160, 60], [105, 60, 105, 110], [0, 30, 55, 30]],
]
function PlanThumb({ seed, label }) {
  const plan = PLANS[seed % PLANS.length]
  return (
    <svg viewBox="-14 -14 188 138" role="img" aria-label={label} style={{ width: '100%', aspectRatio: '4/3', display: 'block', background: 'var(--mist)', color: 'var(--steel)' }} preserveAspectRatio="xMidYMid meet">
      <g fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="0" y="0" width="160" height="110" />
        {plan.map((l, i) => <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} />)}</g>
    </svg>
  )
}

function Projects() {
  const d = useData()
  const [cat, setCat] = useState('all')
  const [status, setStatus] = useState('all')
  if (!d.projects.length) return null
  const present = PROJECT_CATEGORIES.filter(c => d.projects.some(p => p.category === c.value))
  const shown = d.projects.filter(p => (cat === 'all' || p.category === cat) && (status === 'all' || p.status === status))
  const catLabel = v => PROJECT_CATEGORIES.find(c => c.value === v)?.label || v
  return (
    <Section id="projects" band>
      <Head title="Projects">Browse by type of work, or by whether it is built or still on site.</Head>
      <div role="group" aria-label="Filter by project type" className="ca-tabs" style={{ marginBottom: 16 }}>
        <button type="button" className="ca-tab" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All types</button>
        {present.map(c => <button key={c.value} type="button" className="ca-tab" aria-pressed={cat === c.value} onClick={() => setCat(c.value)}>{c.label}</button>)}
      </div>
      <div role="group" aria-label="Filter by status" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {[{ value: 'all', label: 'Any status' }, ...PROJECT_STATUSES].map(s => (
          <button key={s.value} type="button" aria-pressed={status === s.value} onClick={() => setStatus(s.value)}
            style={{ padding: '6px 14px', borderRadius: 999, border: '1.5px solid ' + (status === s.value ? 'var(--ink)' : 'var(--line)'), background: status === s.value ? 'var(--ink)' : '#fff', color: status === s.value ? '#fff' : 'var(--ink)', font: 'inherit', fontSize: '.9rem', cursor: 'pointer' }}>{s.label}</button>
        ))}
      </div>
      <div aria-live="polite" style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))' }}>
        {shown.map((p, i) => (
          <article key={p.title + i} className="ca-card" style={{ overflow: 'hidden' }}>
            {p.image ? <img src={p.image} alt={p.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} /> : <PlanThumb seed={i} label={`Plan sketch for ${p.title}`} />}
            <div style={{ padding: '16px 18px 18px' }}>
              <h3 className="ca-h" style={{ fontSize: '1.15rem' }}>{p.title}</h3>
              <p className="ca-muted" style={{ margin: '4px 0 12px', fontSize: '.95rem' }}>{catLabel(p.category)}{p.location ? `, ${p.location}` : ''}</p>
              <span className="ca-pill"><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: p.status === 'under-construction' ? '#C27A00' : 'var(--teal)' }} />{p.status === 'under-construction' ? 'Under construction' : 'Completed'}</span>
            </div>
          </article>
        ))}
      </div>
      {shown.length === 0 && <p className="ca-muted">No projects match these filters. Clear a filter to see more.</p>}
    </Section>
  )
}

function Fees({ setIntent }) {
  const d = useData()
  const m = d.pricing.models
  const cols = []
  if (m.includes('fixed_online') && d.pricing.fixed) cols.push('fixed')
  if (m.includes('starting_fees') && d.pricing.fees.length) cols.push('fees')
  if (m.includes('custom_proposal')) cols.push('custom')
  if (!cols.length) return null
  const f = d.pricing.fixed
  const box = { padding: 28, display: 'flex', flexDirection: 'column', gap: 10 }
  return (
    <Section id="fees">
      <Head title="Consultation and fees">Choose how you want to start. You never need to share your full budget to get a first answer.</Head>
      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))' }}>
        {cols.includes('fixed') && (
          <div className="ca-card" style={{ ...box, borderTop: '4px solid var(--teal)' }}>
            <h3 className="ca-h" style={{ fontSize: '1.25rem' }}>Fixed-price online consultation</h3>
            <p style={{ margin: 0, fontWeight: 600 }}>{f.name}</p>
            {f.price && <p className="ca-h" style={{ fontSize: '2.4rem', margin: 0 }}>{f.price}</p>}
            {f.duration && <p className="ca-muted" style={{ margin: 0 }}>{f.duration}</p>}
            {f.summary && <p style={{ margin: 0 }}>{f.summary}</p>}
            {f.deliverables.length > 0 && <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>{f.deliverables.map(x => <li key={x} style={{ display: 'flex', gap: 8, padding: '3px 0' }}><Check size={18} style={{ marginTop: 3, color: 'var(--teal)', flexShrink: 0 }} aria-hidden />{x}</li>)}</ul>}
            <a href="#enquire" className="ca-btn" style={{ marginTop: 'auto' }} onClick={() => setIntent('Fixed-price online consultation')}>Book this consultation</a>
          </div>
        )}
        {cols.includes('fees') && (
          <div className="ca-card" style={box}>
            <h3 className="ca-h" style={{ fontSize: '1.25rem' }}>Starting fees by project type</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>{d.pricing.fees.map((r, i) => <tr key={i} style={{ borderTop: i ? '1px solid var(--line)' : 'none' }}><td style={{ padding: '12px 12px 12px 0' }}>{r.type}</td><td style={{ padding: '12px 0', fontWeight: 600, textAlign: 'right' }}>{r.fee}</td></tr>)}</tbody>
            </table>
            <p className="ca-muted" style={{ margin: 0, fontSize: '.9rem' }}>Starting fees only. The final fee depends on scope.</p>
          </div>
        )}
        {cols.includes('custom') && (
          <div className="ca-card" style={box}>
            <h3 className="ca-h" style={{ fontSize: '1.25rem' }}>Request a custom project proposal</h3>
            <p style={{ margin: 0 }}>Tell me about the plot, the scope and your timeline. You get a written proposal that says what is included and what it costs.</p>
            <a href="#enquire" className="ca-btn ca-btn-o" style={{ marginTop: 'auto' }} onClick={() => setIntent('Custom project proposal')}>Request a proposal</a>
          </div>
        )}
      </div>
    </Section>
  )
}

function Process() {
  const d = useData()
  if (!d.process.length) return null
  return (
    <Section band>
      <Head title="How a project runs" />
      <ol style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,230px),1fr))', listStyle: 'none', margin: 0, padding: 0 }}>
        {d.process.map((s, i) => (
          <li key={i}>
            <span aria-hidden="true" className="ca-h" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'grid', placeItems: 'center', marginBottom: 14 }}>{i + 1}</span>
            <h3 className="ca-h" style={{ fontSize: '1.15rem' }}>{s.title}</h3>
            {s.detail && <p className="ca-muted" style={{ margin: '6px 0 0' }}>{s.detail}</p>}
          </li>
        ))}
      </ol>
    </Section>
  )
}

// ── Client portal preview (always sample data; never a real client's files) ──
const STATUS = {
  awaiting: { label: 'Awaiting your review', bg: '#FFF1D6', fg: '#7A4B00' },
  approved: { label: 'Approved', bg: '#D8F0F2', fg: '#0A5F67' },
  changes:  { label: 'Changes requested', bg: '#FBE0DC', fg: '#8E2A1E' },
}

function Portal() {
  const d = useData()
  const [items, setItems] = useState(SAMPLE_DELIVERABLES)
  const [sel, setSel] = useState('d1')
  const [compose, setCompose] = useState(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  if (!d.portal.documents && !d.portal.approvals) return null
  const typeLabel = v => DELIVERABLE_TYPES.find(t => t.value === v)?.label || v
  const it = items.find(x => x.id === sel) || items[0]
  const st = STATUS[it.status] || STATUS.awaiting

  const patch = (id, fn) => setItems(l => l.map(x => (x.id === id ? fn(x) : x)))
  const act = async (id, action, text) => {
    await actOnDeliverable(id, action, text, { demo: true })
    if (action === 'approve') patch(id, x => ({ ...x, status: 'approved', log: [...x.log, { who: 'You', text: 'Approved' }] }))
    if (action === 'changes') patch(id, x => ({ ...x, status: 'changes', log: [...x.log, { who: 'You', text: `Requested changes: ${text}` }] }))
    if (action === 'question') patch(id, x => ({ ...x, log: [...x.log, { who: 'You', text: `Asked: ${text}` }] }))
    if (action === 'acknowledge') patch(id, x => ({ ...x, ack: true, log: [...x.log, { who: 'You', text: 'Acknowledged receipt' }] }))
    if (action === 'download') setToast('In the live portal this downloads the file for review.')
    setCompose(null); setNote('')
  }

  return (
    <Section id="portal">
      <Head title="Review and approve drawings online">Every drawing has a version history and clear actions. This is a preview with sample files; your own files appear after you sign in.</Head>
      <div className="ca-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', background: 'var(--mist)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: '.9rem' }}>
          <strong>Client portal, sample project</strong>
          <a href="/login" className="ca-muted">Client sign in</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))' }}>
          <ul aria-label="Deliverables" style={{ listStyle: 'none', margin: 0, padding: 0, borderRight: '1px solid var(--line)' }}>
            {items.map(x => {
              const s = STATUS[x.status] || STATUS.awaiting
              return (
                <li key={x.id}>
                  <button type="button" onClick={() => { setSel(x.id); setCompose(null) }} aria-current={x.id === sel}
                    style={{ width: '100%', textAlign: 'left', padding: '16px 20px', border: 0, borderBottom: '1px solid var(--line)', background: x.id === sel ? '#EAF5F6' : '#fff', font: 'inherit', cursor: 'pointer', borderLeft: `4px solid ${x.id === sel ? 'var(--teal)' : 'transparent'}` }}>
                    <strong style={{ display: 'block' }}>{x.title}</strong>
                    <span className="ca-muted" style={{ fontSize: '.85rem' }}>{typeLabel(x.type)}</span>
                    <span style={{ display: 'block', marginTop: 6 }}><span className="ca-pill" style={{ background: s.bg, color: s.fg }}>{s.label}</span></span>
                  </button>
                </li>
              )
            })}
            <li style={{ padding: '16px 20px' }}>
              <p className="ca-muted" style={{ margin: 0, fontSize: '.85rem' }}>You can share: {DELIVERABLE_TYPES.map(t => t.label).join(', ')}. Structural drawings are released only when a qualified engineer has prepared and signed them off.</p>
            </li>
          </ul>

          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div><h3 className="ca-h" style={{ fontSize: '1.25rem' }}>{it.title}</h3><p className="ca-muted" style={{ margin: '4px 0 0', fontSize: '.95rem' }}>{typeLabel(it.type)}</p></div>
              <span className="ca-pill" style={{ background: st.bg, color: st.fg, alignSelf: 'flex-start' }}>{st.label}</span>
            </div>

            {d.portal.documents && (
              <ol style={{ listStyle: 'none', margin: '0 0 20px', padding: 0 }}>
                {[...it.versions].reverse().map((v, i) => (
                  <li key={v.v} style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 8, background: i === 0 ? 'var(--teal)' : 'var(--line)', flexShrink: 0 }} />
                    <span><strong>Version {v.v}</strong>{i === 0 ? ' (latest)' : ''}, {v.date}<br /><span className="ca-muted" style={{ fontSize: '.95rem' }}>{v.note}</span></span>
                  </li>
                ))}
              </ol>
            )}

            {d.portal.approvals && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="ca-btn ca-btn-s" disabled={it.status === 'approved'} onClick={() => act(it.id, 'approve')}>Approve</button>
                <button type="button" className="ca-btn ca-btn-o ca-btn-s" onClick={() => { setCompose({ id: it.id, action: 'changes' }); setNote('') }}>Request changes</button>
                <button type="button" className="ca-btn ca-btn-o ca-btn-s" onClick={() => { setCompose({ id: it.id, action: 'question' }); setNote('') }}>Ask a question</button>
                <button type="button" className="ca-btn ca-btn-o ca-btn-s" onClick={() => act(it.id, 'download')}><Download size={15} aria-hidden />Download for review</button>
                <button type="button" className="ca-btn ca-btn-o ca-btn-s" disabled={it.ack} onClick={() => act(it.id, 'acknowledge')}>{it.ack ? 'Receipt acknowledged' : 'Acknowledge receipt'}</button>
              </div>
            )}

            {compose?.id === it.id && (
              <div style={{ marginTop: 16 }}>
                <label className="ca-label" htmlFor="ca-note">{compose.action === 'changes' ? 'What should change?' : 'Your question'}</label>
                <textarea id="ca-note" className="ca-input" rows={3} value={note} onChange={e => setNote(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" className="ca-btn ca-btn-s" disabled={!note.trim()} onClick={() => act(it.id, compose.action, note.trim())}>{compose.action === 'changes' ? 'Send change request' : 'Send question'}</button>
                  <button type="button" className="ca-btn ca-btn-o ca-btn-s" onClick={() => setCompose(null)}>Cancel</button>
                </div>
              </div>
            )}

            {it.log.length > 0 && (
              <ul style={{ margin: '20px 0 0', padding: '16px 0 0', listStyle: 'none', borderTop: '1px solid var(--line)', fontSize: '.95rem' }}>
                {it.log.map((l, i) => <li key={i} style={{ padding: '2px 0' }}><strong>{l.who}:</strong> <span className="ca-muted">{l.text}</span></li>)}
              </ul>
            )}
            {toast && (
              <p role="status" style={{ margin: '16px 0 0', display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '.9rem', padding: '10px 14px', background: 'var(--ink)', color: '#fff', borderRadius: 6 }}>
                {toast}<button type="button" aria-label="Dismiss" onClick={() => setToast('')} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }}><X size={16} /></button>
              </p>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}

function Faq() {
  const d = useData()
  return (
    <Section id="faq" band>
      <div style={{ display: 'grid', gap: 56, gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', alignItems: 'start' }}>
        <div>
          <Head title="Questions people ask before they build">Straight answers to the questions that come up before any design work starts.</Head>
          <a href="#enquire" className="ca-btn ca-btn-o">Ask your own question</a>
        </div>
        <div style={{ gridColumn: 'span 1', borderTop: '1px solid var(--line)' }}>
          {d.faqs.map((f, i) => (
            <details key={i} className="ca-faq" style={{ borderBottom: '1px solid var(--line)' }}>
              <summary>{f.q}</summary>
              <p className="ca-p" style={{ margin: '0 0 18px' }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}

function Enquire({ intent, demo, siteSlug }) {
  const d = useData()
  const [f, setF] = useState({ name: '', phone: '', email: '', projectType: '', location: '', stage: '', message: '', answers: {} })
  const [state, setState] = useState({ status: 'idle' })
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const valid = f.name.trim() && (f.phone.trim() || /\S+@\S+\.\S+/.test(f.email))
  const submit = async e => {
    e.preventDefault()
    if (!valid) return
    setState({ status: 'sending' })
    try { await submitEnquiry({ ...f, intent }, { demo, siteSlug }); setState({ status: 'done' }) }
    catch (err) { setState({ status: 'error' }) }
  }
  const wa = waLink(d)
  const row = { display: 'flex', gap: 12, alignItems: 'flex-start', margin: '0 0 14px' }
  return (
    <Section id="enquire" dark>
      <div style={{ display: 'grid', gap: 48, gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', alignItems: 'start' }}>
        <div>
          <Head title="Book a consultation" light>Tell me about your project and I will reply with the next step.</Head>
          {d.form.responseTime && <p style={row}><Clock size={20} aria-hidden style={{ marginTop: 3, color: '#7CC7D0' }} /><span>Reply time: {d.form.responseTime}{d.form.workingHours ? `. ${d.form.workingHours}.` : ''}</span></p>}
          {d.owner.email && <p style={row}><Mail size={20} aria-hidden style={{ marginTop: 3, color: '#7CC7D0' }} /><a href={`mailto:${d.owner.email}`}>{d.owner.email}</a></p>}
          {d.area.text && <p style={row}><MapPin size={20} aria-hidden style={{ marginTop: 3, color: '#7CC7D0' }} /><span>Serving {d.area.text}</span></p>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="ca-btn ca-btn-w" style={{ marginTop: 12 }}><MessageCircle size={18} aria-hidden />WhatsApp the consultant</a>}
        </div>

        {state.status === 'done' ? (
          <div className="ca-card" style={{ padding: 32, color: 'var(--ink)' }} role="status">
            <h3 className="ca-h" style={{ fontSize: '1.5rem', marginBottom: 8 }}>Enquiry received</h3>
            <p style={{ margin: 0 }}>{demo ? 'This is a template preview, so nothing was sent.' : `Thank you, ${f.name}. I will reply${d.form.responseTime ? ' ' + String(d.form.responseTime).toLowerCase() : ' soon'}.`}</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="ca-card" style={{ padding: 28, color: 'var(--ink)', display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))' }}>
            {intent && <p style={{ gridColumn: '1/-1', margin: 0 }}><span className="ca-pill">Request: {intent}</span></p>}
            <div><label className="ca-label" htmlFor="ca-name">Your name</label><input id="ca-name" className="ca-input" value={f.name} onChange={e => set('name', e.target.value)} required autoComplete="name" /></div>
            <div><label className="ca-label" htmlFor="ca-phone">Phone or WhatsApp</label><input id="ca-phone" className="ca-input" value={f.phone} onChange={e => set('phone', e.target.value)} autoComplete="tel" /></div>
            <div><label className="ca-label" htmlFor="ca-email">Email</label><input id="ca-email" type="email" className="ca-input" value={f.email} onChange={e => set('email', e.target.value)} autoComplete="email" /></div>
            <div><label className="ca-label" htmlFor="ca-type">Project type</label>
              <select id="ca-type" className="ca-input" value={f.projectType} onChange={e => set('projectType', e.target.value)}>
                <option value="">Choose one</option>{d.categories.map(c => <option key={c.value} value={c.label}>{c.label}</option>)}
              </select></div>
            <div><label className="ca-label" htmlFor="ca-loc">Plot or site location</label><input id="ca-loc" className="ca-input" value={f.location} onChange={e => set('location', e.target.value)} /></div>
            <div><label className="ca-label" htmlFor="ca-stage">Where are you now?</label>
              <select id="ca-stage" className="ca-input" value={f.stage} onChange={e => set('stage', e.target.value)}>
                <option value="">Choose one</option>
                {['Still exploring', 'Plot chosen, not bought', 'Plot bought', 'Plan ready, need estimate', 'Under construction'].map(s => <option key={s}>{s}</option>)}
              </select></div>
            {d.form.questions.map((q, i) => (
              <div key={i} style={{ gridColumn: '1/-1' }}><label className="ca-label" htmlFor={`ca-q${i}`}>{q}</label>
                <input id={`ca-q${i}`} className="ca-input" value={f.answers[q] || ''} onChange={e => set('answers', { ...f.answers, [q]: e.target.value })} /></div>
            ))}
            <div style={{ gridColumn: '1/-1' }}><label className="ca-label" htmlFor="ca-msg">Anything else I should know?</label><textarea id="ca-msg" rows={4} className="ca-input" value={f.message} onChange={e => set('message', e.target.value)} /></div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="submit" className="ca-btn" disabled={!valid || state.status === 'sending'}>{state.status === 'sending' ? 'Sending' : d.hero.ctaLabel}</button>
              {!valid && <span className="ca-muted" style={{ fontSize: '.9rem' }}>Add your name and a phone number or email.</span>}
            </div>
            {state.status === 'error' && <p role="alert" style={{ gridColumn: '1/-1', margin: 0, color: '#B3261E', fontWeight: 600 }}>The enquiry did not send. Check your connection and try again, or use WhatsApp.</p>}
          </form>
        )}
      </div>
    </Section>
  )
}

function Footer() {
  const d = useData()
  const soc = Object.entries(d.social).filter(([, v]) => v)
  return (
    <footer style={{ background: '#161616', color: 'rgba(255,255,255,.8)', padding: '40px 0', fontSize: '.95rem' }}>
      <div className="ca-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
        <div><p className="ca-h" style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{d.brand.name}</p>
          <p style={{ margin: '4px 0 0' }}>{[d.owner.name, d.brand.city].filter(Boolean).join(', ')}</p></div>
        <div style={{ textAlign: 'right' }}>
          {d.owner.email && <p style={{ margin: 0 }}><a href={`mailto:${d.owner.email}`}>{d.owner.email}</a></p>}
          {soc.length > 0 && <p style={{ margin: '4px 0 0', display: 'flex', gap: 16, justifyContent: 'flex-end' }}>{soc.map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener noreferrer" style={{ textTransform: 'capitalize' }}>{k}</a>)}</p>}
        </div>
      </div>
    </footer>
  )
}

function FloatingWhatsApp() {
  const d = useData()
  const wa = waLink(d)
  if (!wa) return null
  return (
    <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp the consultant"
      style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 40, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '.75rem 1.1rem', background: '#157347', color: '#fff', borderRadius: 999, fontWeight: 600, textDecoration: 'none', boxShadow: '0 6px 18px rgba(0,0,0,.25)' }}>
      <MessageCircle size={20} aria-hidden /><span>WhatsApp</span>
    </a>
  )
}

// ── root ──────────────────────────────────────────────────────────
export default function CivilArchSite({ payload, demo = false, siteSlug }) {
  const isDemo = demo || !payload
  const data = useMemo(() => payloadToData(payload || SAMPLE_PAYLOAD), [payload])
  const [intent, setIntent] = useState('')
  return (
    <DataCtx.Provider value={data}>
      <div className="ca-root">
        <style>{CSS}</style>
        {isDemo && (
          <div style={{ background: 'var(--ink)', color: '#fff', textAlign: 'center', padding: '8px 16px', fontSize: '.9rem' }}>
            Template preview with sample data. <a href="/setup-wizard" style={{ fontWeight: 700, textDecoration: 'underline' }}>Use this template</a>
          </div>
        )}
        <Header />
        <main>
          <Hero />
          <Services />
          <About />
          <Projects />
          <Fees setIntent={setIntent} />
          <Process />
          <Portal />
          <Faq />
          <Enquire intent={intent} demo={isDemo} siteSlug={siteSlug} />
        </main>
        <Footer />
        <FloatingWhatsApp />
      </div>
    </DataCtx.Provider>
  )
}