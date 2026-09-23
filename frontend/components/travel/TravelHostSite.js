'use client';

// components/travel/TravelHostSite.js — Travel Creator & Tour Organiser template.
// Exports:
//   TravelHostSite  → the site; [username]/page.js renders it with
//                     data={fromWizardPayload(payload)} siteSlug={slug} api={createRemoteTravelApi()}
//   TravelHostDemo  → gallery demo using TRAVEL_SAMPLE and an in-memory API.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DIFFICULTY, REGIONS, SHARING, TRAVEL_SAMPLE, TRIP_TYPES,
  departureEnd, depositPerTraveller, formatDate, formatINR, isDepartureBookable,
  lowestPrice, priceFor, seatsLeft, toISODate, upcomingDepartures,
} from '@/lib/travel-schema';
import { createLocalTravelApi } from '@/lib/travel-api';

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800&family=Instrument+Sans:wght@400;500;600;700&display=swap');
.th-root{--lagoon:#0B4F55;--tide:#1C8A8F;--sunset:#E8672B;--mist:#EEF4F3;--ink:#172A2E;--line:#CFDFDD;
  font-family:'Instrument Sans',system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink);background:var(--mist)}
.th-display{font-family:'Big Shoulders Display','Arial Narrow',Impact,sans-serif;letter-spacing:.01em}
.th-root :focus-visible{outline:3px solid var(--sunset);outline-offset:2px;border-radius:6px}
.th-board-row{animation:th-flip .5s ease both}
@keyframes th-flip{from{transform:rotateX(70deg);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.th-board-row{animation:none}}
`;

const typeLabel = (v) => TRIP_TYPES.find((t) => t.value === v)?.label || v;
const diffLabel = (v) => DIFFICULTY.find((d) => d.value === v)?.label || v;

function hashHue(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

// Illustrated cover used when the founder hasn't uploaded a photo.
function CoverArt({ pkg, className = '' }) {
  if (pkg.coverImage) {
    return <img src={pkg.coverImage} alt="" className={`h-full w-full object-cover ${className}`} />;
  }
  const hue = hashHue(pkg.id + pkg.title);
  const sea = ['weekend', 'women-only'].includes(pkg.tripType) || /beach|backwater|kerala|goa/i.test(pkg.destination);
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={`h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${pkg.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${(hue + 190) % 360} 55% 78%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 20) % 360} 80% 86%)`} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#sky-${pkg.id})`} />
      <circle cx={80 + (hue % 240)} cy="78" r="26" fill="#FFD9A8" opacity=".9" />
      {sea ? (
        <>
          <path d="M0 150 Q50 135 100 150 T200 150 T300 150 T400 150 V240 H0Z" fill="#1C8A8F" />
          <path d="M0 175 Q50 160 100 175 T200 175 T300 175 T400 175 V240 H0Z" fill="#0B4F55" />
          <path d="M0 205 Q60 192 120 205 T240 205 T400 200 V240 H0Z" fill="#083A3F" />
        </>
      ) : (
        <>
          <path d="M0 170 L70 95 L120 140 L190 70 L260 150 L320 100 L400 160 V240 H0Z" fill="#1C8A8F" opacity=".85" />
          <path d="M190 70 L172 90 L182 88 L190 98 L199 88 L210 92Z" fill="#fff" opacity=".85" />
          <path d="M0 200 L90 140 L160 185 L240 130 L330 190 L400 165 V240 H0Z" fill="#0B4F55" />
        </>
      )}
    </svg>
  );
}

function SeatsBadge({ dep, bookable }) {
  const left = seatsLeft(dep);
  if (dep.status === 'cancelled') return <span className="text-[#9AA9AB]">Cancelled</span>;
  if (left === 0) return <span className="text-[#F4A38A]">Sold out</span>;
  if (!bookable) return <span className="text-[#BFD7D5]">Enquire</span>;
  if (left <= 4) return <span className="text-[#FFB27A]">{left} left</span>;
  return <span className="text-[#9EE3D9]">{left} seats</span>;
}

// ─── Page sections ───────────────────────────────────────────────────────────
function Nav({ brand, whatsapp }) {
  const links = [['#trips', 'Trips'], ['#calendar', 'Calendar'], ['#about', 'About'], ['#faq', 'FAQ'], ['#contact', 'Contact']];
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--mist)]/95 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <a href="#top" className="th-display text-2xl font-extrabold text-[var(--lagoon)]">{brand.name}</a>
        <nav className="hidden gap-6 text-sm font-medium md:flex" aria-label="Main">
          {links.map(([href, label]) => <a key={href} href={href} className="hover:text-[var(--sunset)]">{label}</a>)}
        </nav>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
             className="rounded-full bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--tide)]">
            WhatsApp us
          </a>
        )}
      </div>
    </header>
  );
}

function Hero({ data, embedVideos }) {
  const { host, positioning } = data;
  const stats = [
    [host.subscribers, 'subscribers'],
    [host.tripsLed, 'trips led'],
    [host.travellersHosted, 'travellers hosted'],
    [host.countriesVisited, 'countries filmed'],
  ].filter(([v]) => v !== null && v !== undefined && v !== '');
  return (
    <section id="top" className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-10 md:grid-cols-[1.05fr_1fr] md:pt-16">
      <div>
        <p className="mb-4 text-sm font-semibold text-[var(--tide)]">{data.brand.tagline}</p>
        <h1 className="th-display text-5xl font-extrabold leading-[0.95] text-[var(--lagoon)] md:text-6xl lg:text-7xl">{positioning.headline}</h1>
        {positioning.outcome && <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#3D5559]">{positioning.outcome}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#departures" className="rounded-full bg-[var(--sunset)] px-6 py-3 font-semibold text-white hover:brightness-95">See upcoming departures</a>
          <a href="#contact" className="rounded-full border-2 border-[var(--lagoon)] px-6 py-3 font-semibold text-[var(--lagoon)] hover:bg-white">Ask about a trip</a>
        </div>
        {stats.length > 0 && (
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {stats.map(([v, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd><span className="th-display text-3xl font-extrabold text-[var(--lagoon)]">{Number(v).toLocaleString('en-IN')}</span> <span className="text-sm text-[#4E6669]">{label}</span></dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl bg-[var(--lagoon)] shadow-[0_24px_60px_-30px_rgba(11,79,85,.7)]">
        <div className="aspect-video">
          {embedVideos && host.featuredVideoId ? (
            <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${host.featuredVideoId}`}
                    title="Latest trip film" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <div className="relative h-full w-full">
              <CoverArt pkg={data.packages[0] || { id: 'hero', title: 'hero', destination: '' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#E8672B" /></svg>
                </span>
              </div>
            </div>
          )}
        </div>
        {host.youtubeUrl && (
          <a href={host.youtubeUrl} target="_blank" rel="noopener noreferrer" className="block px-5 py-3 text-sm font-medium text-white/90 hover:text-white">
            Watch the trip films on YouTube
          </a>
        )}
      </div>
    </section>
  );
}

function DepartureBoard({ rows, onOpen }) {
  return (
    <section id="departures" className="bg-[var(--lagoon)] text-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="th-display text-4xl font-extrabold md:text-5xl">Next departures</h2>
          <a href="#calendar" className="text-sm font-medium text-white/80 underline-offset-4 hover:underline">Open the calendar</a>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-white/20 p-6 text-white/80">New dates are being planned. Send an enquiry and we will tell you first.</p>
        ) : (
          <div className="relative overflow-x-auto" style={{ perspective: '800px' }}>
            <table className="w-full border-separate border-spacing-y-1.5 text-left sm:min-w-[640px]">
              <thead className="text-xs text-white/60">
                <tr><th className="px-4 font-medium">Date</th><th className="px-4 font-medium">Trip</th><th className="hidden px-4 font-medium sm:table-cell">Days</th><th className="hidden px-4 font-medium sm:table-cell">From</th><th className="px-4 font-medium">Seats</th><th className="hidden px-4 sm:table-cell"><span className="sr-only">Action</span></th></tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map(({ pkg, dep, bookable }, i) => (
                  <tr key={dep.id} className="th-board-row bg-[#083E43]" style={{ animationDelay: `${i * 70}ms` }}>
                    <td className="th-display whitespace-nowrap rounded-l-lg px-3 py-3 text-lg font-semibold text-[#FFD9A8] sm:px-4 sm:text-2xl">{formatDate(dep.startDate, { day: '2-digit', month: 'short' })}</td>
                    <td className="px-2 py-3 sm:px-4"><div className="font-semibold leading-snug">{pkg.title}</div><div className="text-sm text-white/60">{pkg.startCity ? `Starts ${pkg.startCity}` : pkg.destination}</div><div className="text-sm text-white/80 sm:hidden">{pkg.durationDays} days · from {formatINR(dep.priceOverride || lowestPrice(pkg))}</div>
                      <button onClick={() => onOpen(pkg, dep.id)} className="mt-2 rounded-full bg-white px-3.5 py-1 text-sm font-semibold text-[var(--lagoon)] sm:hidden">{bookable ? 'Book' : 'Details'}</button></td>
                    <td className="th-display hidden px-4 py-3 text-2xl font-semibold sm:table-cell">{pkg.durationDays}</td>
                    <td className="hidden whitespace-nowrap px-4 py-3 font-semibold sm:table-cell">{formatINR(dep.priceOverride || lowestPrice(pkg))}</td>
                    <td className="th-display whitespace-nowrap rounded-r-lg px-3 py-3 text-right text-lg font-semibold sm:rounded-none sm:px-4 sm:text-left sm:text-2xl"><SeatsBadge dep={dep} bookable={bookable} /></td>
                    <td className="hidden rounded-r-lg px-4 py-3 text-right sm:table-cell">
                      <button onClick={() => onOpen(pkg, dep.id)} className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[var(--lagoon)] hover:bg-[#FFD9A8]">
                        {bookable ? 'Book' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function TripsGrid({ packages, settings, onOpen }) {
  const [region, setRegion] = useState('all');
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const types = useMemo(() => [...new Set(packages.map((p) => p.tripType))], [packages]);
  const today = toISODate(new Date());
  const shown = packages
    .filter((p) => region === 'all' || p.region === region)
    .filter((p) => type === 'all' || p.tripType === type)
    .filter((p) => !query || `${p.title} ${p.destination}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const chip = (active) => `rounded-full border px-3.5 py-1.5 text-sm font-medium ${active ? 'border-[var(--lagoon)] bg-[var(--lagoon)] text-white' : 'border-[var(--line)] bg-white hover:border-[var(--tide)]'}`;

  return (
    <section id="trips" className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="th-display text-4xl font-extrabold text-[var(--lagoon)] md:text-5xl">All trips</h2>
        <label className="relative block md:w-72">
          <span className="sr-only">Search trips</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a place or trip"
                 className="w-full rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter trips">
        <button className={chip(region === 'all' && type === 'all')} onClick={() => { setRegion('all'); setType('all'); }}>All</button>
        {REGIONS.map((r) => <button key={r.value} className={chip(region === r.value)} onClick={() => setRegion(region === r.value ? 'all' : r.value)}>{r.label}</button>)}
        {types.map((t) => <button key={t} className={chip(type === t)} onClick={() => setType(type === t ? 'all' : t)}>{typeLabel(t)}</button>)}
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-[#4E6669]">No trips match this filter. Clear the filters to see every trip.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((pkg) => {
            const next = (pkg.departures || []).filter((d) => d.startDate > today && d.status !== 'cancelled').sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
            const nextBookable = next && isDepartureBookable(pkg, next, settings);
            return (
              <article key={pkg.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
                <button onClick={() => onOpen(pkg)} className="relative block aspect-[5/3] overflow-hidden text-left" aria-label={`View ${pkg.title}`}>
                  <CoverArt pkg={pkg} />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[var(--lagoon)]">{typeLabel(pkg.tripType)}</span>
                </button>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold leading-snug">{pkg.title}</h3>
                  <p className="mt-1 text-sm text-[#4E6669]">{pkg.destination}</p>
                  <p className="mt-3 text-sm text-[#3D5559]">{pkg.durationDays} days, {pkg.durationNights} nights · {diffLabel(pkg.difficulty)}</p>
                  <div className="mt-auto flex items-end justify-between pt-5">
                    <div>
                      <div className="text-xs text-[#4E6669]">from, per person</div>
                      <div className="text-xl font-bold text-[var(--lagoon)]">{formatINR(lowestPrice(pkg))}</div>
                    </div>
                    <div className="text-right text-xs text-[#4E6669]">
                      {next ? <>Next: <span className="font-semibold text-[var(--ink)]">{formatDate(next.startDate, { day: 'numeric', month: 'short' })}</span>{nextBookable && seatsLeft(next) <= 4 && <div className="font-semibold text-[var(--sunset)]">{seatsLeft(next)} seats left</div>}</> : 'Dates on request'}
                    </div>
                  </div>
                  <button onClick={() => onOpen(pkg)} className="mt-4 rounded-full border-2 border-[var(--lagoon)] py-2 text-sm font-semibold text-[var(--lagoon)] hover:bg-[var(--lagoon)] hover:text-white">
                    View itinerary and dates
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DepartureCalendar({ packages, settings, onOpen }) {
  const rows = useMemo(() => upcomingDepartures(packages, settings), [packages, settings]);
  const first = rows[0]?.dep.startDate ? new Date(rows[0].dep.startDate + 'T00:00:00') : new Date();
  const [cursor, setCursor] = useState(new Date(first.getFullYear(), first.getMonth(), 1));
  const [selected, setSelected] = useState(null);

  const byDate = useMemo(() => {
    const m = {};
    rows.forEach((r) => { (m[r.dep.startDate] = m[r.dep.startDate] || []).push(r); });
    return m;
  }, [rows]);

  const year = cursor.getFullYear(); const month = cursor.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const todayISO = toISODate(new Date());
  const monthRows = rows.filter((r) => r.dep.startDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
  const list = selected ? byDate[selected] || [] : monthRows;

  return (
    <section id="calendar" className="border-y border-[var(--line)] bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="th-display text-4xl font-extrabold text-[var(--lagoon)] md:text-5xl">Trip calendar</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => { setCursor(new Date(year, month - 1, 1)); setSelected(null); }} className="rounded-full border border-[var(--line)] px-3 py-1.5" aria-label="Previous month">‹</button>
              <span className="w-32 text-center font-semibold sm:w-36" aria-live="polite">{monthLabel}</span>
              <button onClick={() => { setCursor(new Date(year, month + 1, 1)); setSelected(null); }} className="rounded-full border border-[var(--line)] px-3 py-1.5" aria-label="Next month">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#4E6669]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />;
              const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const deps = byDate[iso] || [];
              const isSel = selected === iso;
              return (
                <button key={iso} disabled={!deps.length} onClick={() => setSelected(isSel ? null : iso)}
                        aria-pressed={isSel} aria-label={`${formatDate(iso)}${deps.length ? `, ${deps.length} departure(s)` : ''}`}
                        className={`flex min-h-[64px] flex-col items-start rounded-lg border p-1.5 text-left text-sm ${deps.length ? 'border-[var(--tide)] bg-[#E3F1EF] hover:bg-[#D2EAE7]' : 'border-transparent text-[#9AA9AB]'} ${isSel ? '!border-[var(--sunset)] !bg-[#FDE9DE]' : ''} ${iso === todayISO ? 'font-bold' : ''}`}>
                  <span>{day}</span>
                  {deps.slice(0, 2).map(({ pkg, dep }) => (
                    <span key={dep.id} className={`mt-0.5 hidden w-full truncate rounded px-1 text-[10px] font-semibold leading-4 sm:block ${seatsLeft(dep) === 0 ? 'bg-[#E8D5CF] text-[#8A4B37]' : 'bg-[var(--lagoon)] text-white'}`}>{pkg.title}</span>
                  ))}
                  {deps.length > 0 && <span className="mt-auto h-1.5 w-1.5 rounded-full bg-[var(--sunset)] sm:hidden" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-bold">{selected ? `Departing ${formatDate(selected)}` : `Departing in ${monthLabel}`}</h3>
          {list.length === 0 ? (
            <p className="text-[#4E6669]">No departures this month. Try the next month or send us your dates for a private trip.</p>
          ) : (
            <ul className="space-y-3">
              {list.map(({ pkg, dep, bookable }) => (
                <li key={dep.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-4">
                  <div>
                    <div className="font-semibold">{pkg.title}</div>
                    <div className="text-sm text-[#4E6669]">{formatDate(dep.startDate, { day: 'numeric', month: 'short' })} to {formatDate(departureEnd(pkg, dep), { day: 'numeric', month: 'short' })} · {seatsLeft(dep) === 0 ? 'Sold out' : `${seatsLeft(dep)} seats left`}</div>
                  </div>
                  <button onClick={() => onOpen(pkg, dep.id)} className="shrink-0 rounded-full bg-[var(--sunset)] px-4 py-2 text-sm font-semibold text-white hover:brightness-95">
                    {bookable ? 'Book' : 'Details'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function WaysToTravel({ tiers }) {
  if (!tiers?.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="th-display text-4xl font-extrabold text-[var(--lagoon)] md:text-5xl">Ways to travel with us</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.tier || t.name} className={`flex flex-col rounded-2xl p-6 ${t.isHighlighted ? 'bg-[var(--lagoon)] text-white' : 'border border-[var(--line)] bg-white'}`}>
            <h3 className="text-xl font-bold">{t.name}</h3>
            <p className={`mt-1 font-semibold ${t.isHighlighted ? 'text-[#FFD9A8]' : 'text-[var(--sunset)]'}`}>
              {t.price === 0 ? 'Free' : t.price ? `${t.priceLabel ? t.priceLabel + ' ' : ''}${formatINR(t.price)}` : t.priceLabel}
            </p>
            <p className={`mt-3 text-sm leading-relaxed ${t.isHighlighted ? 'text-white/85' : 'text-[#3D5559]'}`}>{t.description}</p>
            {t.deliverables?.length > 0 && (
              <ul className={`mt-4 space-y-1.5 text-sm ${t.isHighlighted ? 'text-white/90' : ''}`}>
                {t.deliverables.map((d) => <li key={d} className="flex gap-2"><span aria-hidden="true">✓</span>{d}</li>)}
              </ul>
            )}
            <a href={t.tier === 'core' ? '#departures' : '#contact'} className={`mt-6 rounded-full py-2.5 text-center text-sm font-semibold ${t.isHighlighted ? 'bg-[var(--sunset)] text-white' : 'border-2 border-[var(--lagoon)] text-[var(--lagoon)]'}`}>
              {t.cta || 'Find out more'}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reviews({ testimonials }) {
  if (!testimonials?.length) return null; // empty-state rule: hide proof when there is none
  return (
    <section className="bg-[#E3F1EF]">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="th-display text-4xl font-extrabold text-[var(--lagoon)] md:text-5xl">From past travellers</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <figure key={i} className="rounded-2xl bg-white p-6">
              <blockquote className="text-lg leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-4 text-sm"><span className="font-semibold">{t.name}</span>{t.detail && <span className="text-[#4E6669]">, {t.detail}</span>}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function About({ data }) {
  const { host, brand, positioning } = data;
  if (!host.bio && !positioning.forWho) return null;
  return (
    <section id="about" className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_1.4fr]">
      <h2 className="th-display text-4xl font-extrabold text-[var(--lagoon)] md:text-5xl">About {brand.name}</h2>
      <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-[#3D5559]">
        {host.bio && <p>{host.bio}</p>}
        {positioning.forWho && <p><span className="font-semibold text-[var(--ink)]">Who our trips suit:</span> {positioning.forWho}</p>}
      </div>
    </section>
  );
}

function Faq({ faq, settings }) {
  const items = [...(faq || [])];
  if (settings.cancellationPolicy?.length) {
    items.push({
      q: 'What is the cancellation policy?',
      a: settings.cancellationPolicy
        .slice().sort((a, b) => b.daysBefore - a.daysBefore)
        .map((r) => `${r.daysBefore}+ days before departure: ${r.refundPercent}% refund`).join('. ') + '.',
    });
  }
  if (!items.length) return null;
  return (
    <section id="faq" className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="th-display text-4xl font-extrabold text-[var(--lagoon)] md:text-5xl">Questions travellers ask</h2>
        <div className="mt-8 divide-y divide-[var(--line)]">
          {items.map((f, i) => (
            <details key={i} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}<span className="text-xl text-[var(--tide)] group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-[#3D5559]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ data, api, siteSlug, packages }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', trip: '', message: '' });
  const [state, setState] = useState({ status: 'idle', error: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) {
      setState({ status: 'error', error: 'Add your name and a phone number or email so we can reply.' });
      return;
    }
    setState({ status: 'sending', error: '' });
    try {
      await api.sendEnquiry(siteSlug, { name: form.name, phone: form.phone, email: form.email, message: `${form.trip ? `[${form.trip}] ` : ''}${form.message}` });
      setState({ status: 'sent', error: '' });
    } catch (err) {
      setState({ status: 'error', error: err.message || 'Could not send. Try WhatsApp instead.' });
    }
  };
  const input = 'w-full rounded-lg border border-[var(--line)] bg-white px-3.5 py-2.5';
  return (
    <section id="contact" className="bg-[var(--lagoon)] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
        <div>
          <h2 className="th-display text-4xl font-extrabold md:text-5xl">Ask about a trip</h2>
          <p className="mt-4 max-w-md text-white/80">Questions about fitness level, rooming, solo travel or a private group? Send them here and we reply within a day.</p>
          <ul className="mt-6 space-y-2 text-white/90">
            {data.contact.whatsapp && <li><a className="underline-offset-4 hover:underline" href={`https://wa.me/${data.contact.whatsapp.replace(/\D/g, '')}`}>WhatsApp {data.contact.whatsapp}</a></li>}
            {data.contact.email && <li><a className="underline-offset-4 hover:underline" href={`mailto:${data.contact.email}`}>{data.contact.email}</a></li>}
            {data.contact.address && <li>{data.contact.address}</li>}
          </ul>
        </div>
        {state.status === 'sent' ? (
          <div className="rounded-2xl bg-white p-6 text-[var(--ink)]" role="status">
            <h3 className="text-xl font-bold">Message sent</h3>
            <p className="mt-2 text-[#3D5559]">Thanks, {form.name.split(' ')[0]}. We will reply on {form.phone ? 'WhatsApp' : 'email'} within a day.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-6 text-[var(--ink)]" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">Name<input className={`${input} mt-1`} value={form.name} onChange={set('name')} autoComplete="name" /></label>
              <label className="text-sm font-medium">Phone / WhatsApp<input className={`${input} mt-1`} value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" /></label>
            </div>
            <label className="block text-sm font-medium">Email<input className={`${input} mt-1`} value={form.email} onChange={set('email')} type="email" autoComplete="email" /></label>
            <label className="block text-sm font-medium">Trip you are interested in
              <select className={`${input} mt-1`} value={form.trip} onChange={set('trip')}>
                <option value="">Not sure yet</option>
                {packages.map((p) => <option key={p.id} value={p.title}>{p.title}</option>)}
                <option value="Private / custom trip">Private / custom trip</option>
              </select>
            </label>
            <label className="block text-sm font-medium">Your question<textarea className={`${input} mt-1`} rows={3} value={form.message} onChange={set('message')} /></label>
            {state.error && <p className="text-sm font-medium text-[#B3261E]" role="alert">{state.error}</p>}
            <button disabled={state.status === 'sending'} className="w-full rounded-full bg-[var(--sunset)] py-3 font-semibold text-white disabled:opacity-60">
              {state.status === 'sending' ? 'Sending…' : 'Send question'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer({ data }) {
  const { brand, settings, social } = data;
  return (
    <footer className="bg-[#083A3F] text-sm text-white/70" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-semibold text-white">{brand.name}</div>
          {settings.gstin && <div>GSTIN {settings.gstin}</div>}
          {settings.tourismRegistration && <div>Tourism registration {settings.tourismRegistration}</div>}
        </div>
        <nav className="flex flex-wrap gap-4" aria-label="Footer">
          {social.youtube && <a href={social.youtube} className="hover:text-white">YouTube</a>}
          {social.instagram && <a href={social.instagram} className="hover:text-white">Instagram</a>}
          <a href="legal/terms" className="hover:text-white">Booking terms</a>
          <a href="legal/privacy" className="hover:text-white">Privacy</a>
          <a href="legal/refund" className="hover:text-white">Cancellation & refunds</a>
        </nav>
      </div>
    </footer>
  );
}

// ─── Trip detail + booking ───────────────────────────────────────────────────
function TripDialog({ pkg, initialDepId, settings, api, siteSlug, onClose }) {
  const today = toISODate(new Date());
  const deps = (pkg.departures || []).filter((d) => d.startDate > today && d.status !== 'cancelled').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const [depId, setDepId] = useState(initialDepId || deps.find((d) => isDepartureBookable(pkg, d, settings))?.id || deps[0]?.id || '');
  const [sharing, setSharing] = useState('twin');
  const [travellers, setTravellers] = useState(1);
  const [step, setStep] = useState('details'); // details | form | done
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const dialogRef = useRef(null);
  const asideRef = useRef(null);

  const dep = deps.find((d) => d.id === depId);
  const bookable = dep && isDepartureBookable(pkg, dep, settings);
  const perPerson = dep ? priceFor(pkg, dep, sharing) : null;
  const deposit = perPerson ? depositPerTraveller(pkg, perPerson, settings) : null;
  const availableSharing = SHARING.filter((s) => pkg[s.priceKey]);
  const maxTravellers = dep ? Math.min(seatsLeft(dep), 10) : 1;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  useEffect(() => { if (travellers > maxTravellers) setTravellers(Math.max(1, maxTravellers)); }, [maxTravellers, travellers]);
  // Keep the booking panel in view when the step changes (mobile stacks it under the itinerary).
  useEffect(() => { if (step !== 'details') asideRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [step]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setErr('Name and phone number are required to hold your seat.'); return; }
    setBusy(true); setErr('');
    try {
      const res = await api.requestBooking(siteSlug, { packageId: pkg.serverId || pkg.id, departureId: dep.serverId || dep.id, sharing, travellers, ...form });
      setResult(res);
      setStep('done');
      // When payments are wired, res.payment carries the Razorpay order for the deposit.
    } catch (e2) {
      setErr(e2.message || 'Could not reserve. Please try again.');
    } finally { setBusy(false); }
  };

  const input = 'mt-1 w-full rounded-lg border border-[var(--line)] bg-white px-3.5 py-2.5';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B2A2E]/60 md:items-center md:p-6" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="trip-title"
           onClick={(e) => e.stopPropagation()}
           className="th-root flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-[var(--mist)] outline-none md:rounded-2xl">
        <div className="relative h-40 shrink-0 md:h-52">
          <CoverArt pkg={pkg} />
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold" aria-label="Close trip details">Close</button>
        </div>
        <div className="grid flex-1 overflow-y-auto md:grid-cols-[1.4fr_1fr]">
          {/* Left: trip content */}
          <div className="space-y-8 p-6 md:p-8">
            <div>
              <h2 id="trip-title" className="th-display text-4xl font-extrabold text-[var(--lagoon)]">{pkg.title}</h2>
              <p className="mt-1 text-[#4E6669]">{pkg.destination}</p>
              {pkg.summary && <p className="mt-4 max-w-prose leading-relaxed">{pkg.summary}</p>}
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {[
                  ['Duration', `${pkg.durationDays} days, ${pkg.durationNights} nights`],
                  ['Starts from', pkg.startCity],
                  ['Difficulty', diffLabel(pkg.difficulty)],
                  ['Group size', pkg.groupSizeMax ? `Up to ${pkg.groupSizeMax}` : ''],
                  ['Minimum age', pkg.minAge ? `${pkg.minAge}+` : ''],
                  ['Stay', pkg.stayType],
                  ['Transport', pkg.transport],
                  ['Visa help', pkg.region === 'international' ? (pkg.visaSupport ? 'Included' : 'Not included') : ''],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-white p-3"><dt className="text-xs text-[#4E6669]">{k}</dt><dd className="font-semibold">{v}</dd></div>
                ))}
              </dl>
            </div>

            {pkg.highlights?.length > 0 && (
              <div>
                <h3 className="text-lg font-bold">Highlights</h3>
                <ul className="mt-3 space-y-1.5">{pkg.highlights.map((h) => <li key={h} className="flex gap-2"><span className="text-[var(--sunset)]" aria-hidden="true">●</span>{h}</li>)}</ul>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold">Day-by-day plan</h3>
              <ol className="mt-4 border-l-2 border-[var(--tide)]">
                {pkg.itinerary.filter((d) => d.title).map((d) => (
                  <li key={d.day} className="relative pb-5 pl-6">
                    <span className="th-display absolute -left-[15px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--lagoon)] text-sm font-semibold text-white">{d.day}</span>
                    <div className="font-semibold">{d.title}</div>
                    {d.description && <p className="mt-1 text-sm leading-relaxed text-[#3D5559]">{d.description}</p>}
                    {(d.stay || d.meals) && <p className="mt-1 text-xs text-[#4E6669]">{[d.stay && `Stay: ${d.stay}`, d.meals && `Meals: ${d.meals}`].filter(Boolean).join(' · ')}</p>}
                  </li>
                ))}
              </ol>
            </div>

            {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0) && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div><h3 className="text-lg font-bold">Included</h3><ul className="mt-3 space-y-1.5 text-sm">{pkg.inclusions.map((x) => <li key={x} className="flex gap-2"><span className="text-[var(--tide)]" aria-hidden="true">✓</span>{x}</li>)}</ul></div>
                <div><h3 className="text-lg font-bold">Not included</h3><ul className="mt-3 space-y-1.5 text-sm">{pkg.exclusions.map((x) => <li key={x} className="flex gap-2"><span className="text-[#B3261E]" aria-hidden="true">✕</span>{x}</li>)}</ul></div>
              </div>
            )}
          </div>

          {/* Right: booking panel */}
          <aside ref={asideRef} className="scroll-mt-4 border-t border-[var(--line)] bg-white p-6 md:sticky md:top-0 md:self-start md:border-l md:border-t-0 md:p-8">
            {step === 'done' ? (
              <div role="status">
                <h3 className="th-display text-3xl font-extrabold text-[var(--lagoon)]">Seat request received</h3>
                <p className="mt-3 leading-relaxed">
                  We are holding {result?.booking?.travellers || travellers} seat(s) on {formatDate(dep.startDate)} for {settings.holdMinutes} minutes.
                  {result?.payment ? ' Complete the deposit to confirm.' : ' We will send the deposit link on WhatsApp shortly.'}
                </p>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between"><dt>Trip total</dt><dd className="font-semibold">{formatINR(result?.booking?.totalAmount)}</dd></div>
                  <div className="flex justify-between"><dt>Deposit to confirm</dt><dd className="font-semibold">{formatINR(result?.booking?.depositAmount)}</dd></div>
                </dl>
                <button onClick={onClose} className="mt-6 w-full rounded-full border-2 border-[var(--lagoon)] py-2.5 font-semibold text-[var(--lagoon)]">Back to trips</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold">Choose your dates</h3>
                {deps.length === 0 ? (
                  <p className="mt-3 text-sm text-[#4E6669]">No dates announced yet. Send an enquiry from the contact section and we will tell you first.</p>
                ) : (
                  <div className="mt-3 space-y-2" role="radiogroup" aria-label="Departure dates">
                    {deps.map((d) => {
                      const left = seatsLeft(d);
                      const ok = isDepartureBookable(pkg, d, settings);
                      return (
                        <label key={d.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm ${depId === d.id ? 'border-[var(--lagoon)] bg-[#E3F1EF]' : 'border-[var(--line)]'} ${left === 0 ? 'opacity-60' : ''}`}>
                          <span className="flex items-center gap-2">
                            <input type="radio" name="dep" checked={depId === d.id} onChange={() => { setDepId(d.id); setStep('details'); }} className="accent-[var(--lagoon)]" />
                            <span className="font-semibold">{formatDate(d.startDate, { day: 'numeric', month: 'short' })} – {formatDate(departureEnd(pkg, d), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </span>
                          <span className={left === 0 ? 'text-[#8A4B37]' : left <= 4 ? 'font-semibold text-[var(--sunset)]' : 'text-[#4E6669]'}>
                            {left === 0 ? 'Sold out' : ok ? `${left} left` : 'Enquire'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {dep && availableSharing.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <label className="text-sm font-medium">Room
                      <select value={sharing} onChange={(e) => setSharing(e.target.value)} className={input}>
                        {availableSharing.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-medium">Travellers
                      <select value={travellers} onChange={(e) => setTravellers(Number(e.target.value))} className={input} disabled={!bookable}>
                        {Array.from({ length: Math.max(1, maxTravellers) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                  </div>
                )}

                {dep && perPerson && (
                  <dl className="mt-5 space-y-2 rounded-xl bg-[var(--mist)] p-4 text-sm">
                    <div className="flex justify-between"><dt>Per person</dt><dd className="font-semibold">{formatINR(perPerson)}</dd></div>
                    <div className="flex justify-between"><dt>Total for {travellers}</dt><dd className="font-semibold">{formatINR(perPerson * travellers)}</dd></div>
                    {bookable && deposit ? <div className="flex justify-between border-t border-[var(--line)] pt-2 text-base"><dt>Pay now to hold seats</dt><dd className="font-bold text-[var(--lagoon)]">{formatINR(deposit * travellers)}</dd></div> : null}
                    <p className="pt-1 text-xs text-[#4E6669]">Prices include applicable taxes unless stated. Balance due {settings.balanceDueDays} days before departure.</p>
                  </dl>
                )}

                {step === 'details' && (
                  bookable ? (
                    <button onClick={() => setStep('form')} className="mt-5 w-full rounded-full bg-[var(--sunset)] py-3 font-semibold text-white hover:brightness-95">
                      Reserve {travellers} seat{travellers > 1 ? 's' : ''}
                    </button>
                  ) : (
                    <a href="#contact" onClick={onClose} className="mt-5 block w-full rounded-full border-2 border-[var(--lagoon)] py-3 text-center font-semibold text-[var(--lagoon)]">
                      {dep && seatsLeft(dep) === 0 ? 'Join the waitlist' : 'Send an enquiry'}
                    </a>
                  )
                )}

                {step === 'form' && bookable && (
                  <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
                    <label className="block text-sm font-medium">Full name (as on ID)<input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
                    <label className="block text-sm font-medium">Phone / WhatsApp<input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" autoComplete="tel" /></label>
                    <label className="block text-sm font-medium">Email<input className={input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
                    <label className="block text-sm font-medium">Anything we should know? <span className="font-normal text-[#4E6669]">(diet, health, roommate)</span><textarea rows={2} className={input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
                    {err && <p className="text-sm font-medium text-[#B3261E]" role="alert">{err}</p>}
                    <button disabled={busy} className="w-full rounded-full bg-[var(--sunset)] py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Reserving…' : 'Confirm seat request'}</button>
                    <button type="button" onClick={() => setStep('details')} className="w-full py-2 text-sm text-[#4E6669] underline">Change dates or travellers</button>
                  </form>
                )}

                {settings.cancellationPolicy?.length > 0 && (
                  <details className="mt-6 text-sm">
                    <summary className="cursor-pointer font-semibold">Cancellation policy</summary>
                    <ul className="mt-2 space-y-1 text-[#3D5559]">
                      {settings.cancellationPolicy.slice().sort((a, b) => b.daysBefore - a.daysBefore).map((r) => (
                        <li key={r.daysBefore}>{r.daysBefore}+ days before departure: {r.refundPercent}% refund</li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Main site component ─────────────────────────────────────────────────────
export function TravelHostSite({ data, siteSlug = 'sample', api, embedVideos = true }) {
  const [live, setLive] = useState({ packages: data.packages || [], settings: data.settings });
  const [open, setOpen] = useState(null); // { pkg, depId }

  // Pull live seat counts (remote) or subscribe to the in-memory store (demo/preview).
  useEffect(() => {
    let cancelled = false;
    api.getPublicTravel(siteSlug)
      .then((res) => { if (!cancelled && res) setLive({ packages: res.packages || [], settings: { ...data.settings, ...(res.settings || {}) } }); })
      .catch(() => { /* keep payload data if the live call fails */ });
    const unsub = api.subscribe((snap) => setLive({ packages: snap.packages.filter((p) => p.status === 'published'), settings: snap.settings }));
    return () => { cancelled = true; unsub?.(); };
  }, [api, siteSlug, data.settings]);

  const packages = live.packages.filter((p) => p.status === 'published');
  const settings = live.settings;
  const board = useMemo(() => upcomingDepartures(packages, settings), [packages, settings]);
  const current = open ? packages.find((p) => p.id === open.pkg.id) || open.pkg : null;
  const view = { ...data, packages, settings };

  return (
    <div className="th-root min-h-screen">
      <style>{FONT_CSS}</style>
      <Nav brand={data.brand} whatsapp={data.contact.whatsapp} />
      <main>
        <Hero data={view} embedVideos={embedVideos} />
        <DepartureBoard rows={board} onOpen={(pkg, depId) => setOpen({ pkg, depId })} />
        <TripsGrid packages={packages} settings={settings} onOpen={(pkg, depId) => setOpen({ pkg, depId })} />
        <DepartureCalendar packages={packages} settings={settings} onOpen={(pkg, depId) => setOpen({ pkg, depId })} />
        <WaysToTravel tiers={data.tiers} />
        <Reviews testimonials={data.proof?.testimonials} />
        <About data={view} />
        <Faq faq={data.faq} settings={settings} />
        <Contact data={view} api={api} siteSlug={siteSlug} packages={packages} />
      </main>
      <Footer data={view} />
      {current && (
        <TripDialog key={current.id} pkg={current} initialDepId={open.depId} settings={settings} api={api} siteSlug={siteSlug} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

// Gallery demo at /templates/travel-host
export function TravelHostDemo() {
  const [api] = useState(() => createLocalTravelApi(TRAVEL_SAMPLE));
  return <TravelHostSite data={TRAVEL_SAMPLE} api={api} siteSlug="sample" />;
}