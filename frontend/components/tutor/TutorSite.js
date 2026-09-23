'use client'

/**
 * Tutor, Trainer & Creative Teacher — public site (template slug: "tutor-training")
 * ------------------------------------------------------------------------------
 * Design concept: a teacher's own chalkboard and planner, not another SaaS
 * template — deep chalkboard-green + chalk-white, a single marker-yellow accent,
 * a serif display face for warmth, index-card subject tiles, a real weekly
 * timetable grid for availability (this genuinely is a schedule, not decoration),
 * a horizontal "class reel" filmstrip for past videos, and testimonials styled
 * as notes passed in class.
 *
 * Props:
 *   siteSlug  — founder site slug, passed to every api call
 *   payload   — the wizard site_build_payload (or GET /api/sites/public/{slug}
 *               response) used for hero/bio/testimonials/FAQ via fromWizardPayload()
 *   api       — a tutor-api.js instance: createRemoteTutorApi() on a live site,
 *               createLocalTutorApi(seed) on /templates/tutor-training
 *
 * Subjects, videos and the weekly schedule always come from api.getPublicTutor(),
 * never from the wizard payload — those are edited live from the dashboard.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen, Music, Palette, Sparkles, Languages, Code2, GraduationCap, HeartPulse, Star,
  Video, Play, Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2, X, Loader2,
  Quote, ChevronDown, Mail, Phone, MessageCircle, Award, Users, CalendarClock, ArrowRight,
} from 'lucide-react'
import {
  CATEGORY_META, FORMAT_META, AGE_GROUP_META, WEEKDAY_LABELS, WEEKDAY_LABELS_LONG,
  priceLine, durationLabel, slotLabel, windowsByWeekday, formatMoney, fromWizardPayload,
} from '@/lib/tutor-schema'

const ICONS = { BookOpen, Music, Palette, Sparkles, Languages, Code2, GraduationCap, HeartPulse, Star }

const BOARD = '#24352B'
const BOARD_DARK = '#182119'
const CHALK = '#F7F4EA'
const INK = '#201D18'
const MARKER = '#EAB24B'
const CORAL = '#E2694B'
const SAGE = '#C9CFC6'
const LINE = '#E4DFD0'

const THEME_VARS = {
  '--board': BOARD, '--board-dark': BOARD_DARK, '--chalk': CHALK, '--ink': INK,
  '--marker': MARKER, '--coral': CORAL, '--sage': SAGE, '--line': LINE,
}

export default function TutorSite({ siteSlug, payload, api }) {
  const bio = useMemo(() => fromWizardPayload(payload || {}), [payload])
  const [subjects, setSubjects] = useState([])
  const [videos, setVideos] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [booking, setBooking] = useState(null) // { subject, isTrial } | null

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.getPublicTutor(siteSlug)
      .then((res) => {
        if (cancelled) return
        setSubjects(res.subjects || [])
        setVideos(res.videos || [])
        setSettings(res.settings || {})
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load this site.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [api, siteSlug])

  const categories = useMemo(() => {
    const present = new Set(subjects.map((s) => s.category))
    return ['all', ...Object.keys(CATEGORY_META).filter((c) => present.has(c))]
  }, [subjects])

  const filteredSubjects = activeCategory === 'all' ? subjects : subjects.filter((s) => s.category === activeCategory)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CHALK }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: BOARD }} />
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6" style={{ background: CHALK, color: INK }}>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ ...THEME_VARS, background: CHALK, color: INK }} className="min-h-screen font-sans">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap" />
      <style>{`.font-display{font-family:'Fraunces',Georgia,serif;}`}</style>

      <NavBar bio={bio} />
      <Hero bio={bio} settings={settings} subjects={subjects} onBookTrial={(s) => setBooking({ subject: s, isTrial: true })} />
      {bio.certifications?.length > 0 && <TrustStrip certifications={bio.certifications} />}

      <SubjectsSection
        subjects={filteredSubjects}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        settings={settings}
        onBook={(s, isTrial) => setBooking({ subject: s, isTrial })}
      />

      {settings?.bookingEnabled !== false && <ScheduleSection settings={settings} />}
      {videos.length > 0 && <VideoReel videos={videos} subjects={subjects} />}

      <BioSection bio={bio} />
      <HowItWorks settings={settings} />
      {bio.testimonials?.length > 0 && <TestimonialsSection testimonials={bio.testimonials} />}
      {bio.faqs?.length > 0 && <FaqSection faqs={bio.faqs} />}
      <ContactSection bio={bio} settings={settings} siteSlug={siteSlug} api={api} />
      <SiteFooter bio={bio} />

      {booking && (
        <BookingModal
          siteSlug={siteSlug}
          api={api}
          subject={booking.subject}
          isTrial={booking.isTrial}
          settings={settings}
          onClose={() => setBooking(null)}
        />
      )}
    </div>
  )
}

// ─── Nav ───────────────────────────────────────────────────────────────────
function NavBar({ bio }) {
  const links = [
    ['Classes', '#classes'], ['Schedule', '#schedule'], ['Watch', '#watch'],
    ['About', '#about'], ['Reviews', '#reviews'], ['FAQ', '#faq'],
  ]
  return (
    <header className="sticky top-0 z-30 backdrop-blur border-b" style={{ background: `${BOARD}F2`, borderColor: `${SAGE}33` }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#top" className="font-display text-lg font-semibold" style={{ color: CHALK }}>
          {bio.brandName || 'Your class'}
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: SAGE }}>
          {links.map(([label, href]) => (
            <a key={href} href={href} className="hover:opacity-100 opacity-90 transition-opacity">{label}</a>
          ))}
        </nav>
        <a href="#classes" className="text-sm font-medium px-4 py-2 rounded-full transition-transform hover:-translate-y-0.5"
           style={{ background: MARKER, color: BOARD_DARK }}>
          Book a class
        </a>
      </div>
    </header>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────
function Hero({ bio, settings, subjects, onBookTrial }) {
  const trialSubject = subjects.find((s) => s.trialAvailable && s.status === 'published')
  return (
    <section id="top" className="relative overflow-hidden" style={{ background: BOARD, color: CHALK }}>
      <ChalkTexture />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6" style={{ background: `${CORAL}22`, color: '#F3B8A5', border: `1px solid ${CORAL}55` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CORAL }} />
            Live classes on {settings?.meetPlatform === 'zoom' ? 'Zoom' : 'Google Meet'}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] mb-5">
            {bio.tagline || `Learn ${bio.primarySubjects?.[0] || 'something new'} with ${bio.ownerName || 'a real teacher'}, live and one on one.`}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-8 max-w-xl" style={{ color: SAGE }}>
            {bio.sentence || bio.credibility || 'Every class is a real conversation, not a pre-recorded video — book a slot that works for you and join from anywhere.'}
          </p>

          {bio.primarySubjects?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-9">
              {bio.primarySubjects.slice(0, 6).map((subj) => (
                <span key={subj} className="text-sm px-3.5 py-1.5 rounded-full" style={{ background: '#2E4437', color: CHALK, border: `1px solid ${SAGE}44` }}>
                  {subj}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <a href="#classes" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
               style={{ background: MARKER, color: BOARD_DARK }}>
              See my classes <ArrowRight className="w-4 h-4" />
            </a>
            {trialSubject && (
              <button type="button" onClick={() => onBookTrial(trialSubject)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold border transition-colors hover:bg-white/5"
                style={{ borderColor: SAGE, color: CHALK }}>
                Book a free trial class
              </button>
            )}
          </div>
        </div>

        <div className="relative mx-auto lg:mx-0 w-full max-w-sm">
          <div className="relative rounded-[2rem] overflow-hidden border-[3px] shadow-2xl" style={{ borderColor: `${SAGE}55`, borderStyle: 'dashed' }}>
            <div className="aspect-[4/5] w-full flex items-center justify-center" style={{ background: '#2E4437' }}>
              {bio.ownerPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bio.ownerPhotoUrl} alt={bio.ownerName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-6xl" style={{ color: SAGE }}>
                  {(bio.ownerName || 'T').charAt(0)}
                </span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 rounded-2xl px-4 py-3 shadow-xl" style={{ background: CHALK, color: INK }}>
            <p className="font-display text-2xl leading-none">{bio.teachingSince ? `${new Date().getFullYear() - Number(bio.teachingSince)}+` : '—'}</p>
            <p className="text-[11px] mt-1" style={{ color: '#6B6659' }}>years teaching</p>
          </div>
          {(bio.rating || bio.studentsTaught) && (
            <div className="absolute -top-5 -right-4 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-1.5" style={{ background: MARKER, color: BOARD_DARK }}>
              <Star className="w-4 h-4 fill-current" />
              <span className="font-display text-lg leading-none">{bio.rating || '5.0'}</span>
              {bio.totalReviews && <span className="text-xs opacity-80">({bio.totalReviews})</span>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ChalkTexture() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" aria-hidden="true">
      <filter id="chalk-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#chalk-noise)" />
    </svg>
  )
}

// ─── Trust strip ───────────────────────────────────────────────────────────
function TrustStrip({ certifications }) {
  return (
    <div className="border-b" style={{ borderColor: LINE, background: '#FDFBF5' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center gap-3 overflow-x-auto">
        <Award className="w-4 h-4 flex-shrink-0" style={{ color: '#8A7B45' }} />
        {certifications.map((c) => (
          <span key={c} className="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: CHALK, border: `1px solid ${LINE}`, color: '#5C5546' }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Subjects / classes — "index card" tiles ────────────────────────────────
function SubjectsSection({ subjects, categories, activeCategory, onCategoryChange, settings, onBook }) {
  if (subjects.length === 0 && activeCategory === 'all') return null
  return (
    <section id="classes" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <SectionHeading eyebrow="What I teach" title="Classes you can book" />

      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-9">
          {categories.map((c) => {
            const meta = c === 'all' ? { label: 'All classes' } : CATEGORY_META[c]
            const active = activeCategory === c
            return (
              <button key={c} type="button" onClick={() => onCategoryChange(c)}
                className="text-sm px-4 py-2 rounded-full border transition-colors"
                style={active
                  ? { background: BOARD, color: CHALK, borderColor: BOARD }
                  : { background: 'transparent', color: INK, borderColor: LINE }}>
                {meta.label}
              </button>
            )
          })}
        </div>
      )}

      {subjects.length === 0 ? (
        <EmptyNote text="No classes published yet — check back soon." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((s, i) => <SubjectCard key={s.id} subject={s} settings={settings} rotate={i % 3 === 1} onBook={onBook} />)}
        </div>
      )}
    </section>
  )
}

function SubjectCard({ subject, settings, rotate, onBook }) {
  const meta = CATEGORY_META[subject.category] || CATEGORY_META.other
  const Icon = ICONS[meta.icon] || Star
  return (
    <div
      className="group relative rounded-2xl border p-6 transition-transform duration-200 hover:-translate-y-1"
      style={{ background: '#FDFBF5', borderColor: LINE, transform: rotate ? 'rotate(-0.4deg)' : 'rotate(0.4deg)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}1A`, color: meta.color }}>
          <Icon className="w-5 h-5" />
        </span>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: `${BOARD}0D`, color: BOARD }}>
          {FORMAT_META[subject.format]?.label}
        </span>
      </div>
      <h3 className="font-display text-xl mb-1.5">{subject.title}</h3>
      <p className="text-sm leading-relaxed mb-4" style={{ color: '#5C5546' }}>{subject.summary}</p>

      <div className="flex items-center gap-3 text-xs mb-5" style={{ color: '#8A8372' }}>
        <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{durationLabel(subject.durationMinutes)}</span>
        {subject.ageGroups?.length > 0 && (
          <span>{subject.ageGroups.map((a) => AGE_GROUP_META[a]?.label).filter(Boolean).join(', ')}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: LINE }}>
        <p className="text-sm font-medium">{priceLine(subject, settings?.currency)}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => onBook(subject, false)}
          className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-full transition-transform hover:-translate-y-0.5"
          style={{ background: BOARD, color: CHALK }}>
          Book class
        </button>
        {subject.trialAvailable && (
          <button type="button" onClick={() => onBook(subject, true)}
            className="text-sm font-medium px-4 py-2.5 rounded-full border"
            style={{ borderColor: MARKER, color: '#8A6A1F' }}>
            Trial
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Weekly schedule — a real timetable grid ────────────────────────────────
function ScheduleSection({ settings }) {
  return (
    <section id="schedule" className="py-16 sm:py-24" style={{ background: '#FDFBF5' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <SectionHeading eyebrow="Weekly timetable" title="When classes usually run" />
        <p className="text-sm mb-8 max-w-2xl" style={{ color: '#5C5546' }}>
          Pick a class above to see exact open slots — this is the general weekly rhythm.
          {settings?.timezone ? ` Times shown in ${settings.timezone}.` : ''}
        </p>
        <WeeklyTimetablePreview />
      </div>
    </section>
  )
}

// A lightweight visual timetable (illustrative bands, not tied to live slot data —
// the real open slots load per-subject inside the booking modal).
function WeeklyTimetablePreview() {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: LINE, background: CHALK }}>
      <div className="grid grid-cols-7 divide-x" style={{ borderColor: LINE }}>
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={d} className="p-3 text-center">
            <p className="text-xs font-semibold mb-3" style={{ color: '#8A8372' }}>{d}</p>
            <div className="space-y-1.5">
              {i !== 6 ? (
                <>
                  <div className="h-6 rounded-md" style={{ background: `${MARKER}30`, border: `1px solid ${MARKER}55` }} />
                  {i % 2 === 0 && <div className="h-6 rounded-md" style={{ background: `${MARKER}30`, border: `1px solid ${MARKER}55` }} />}
                </>
              ) : (
                <div className="h-6 rounded-md opacity-40" style={{ background: LINE }} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 text-xs flex items-center gap-2 border-t" style={{ borderColor: LINE, color: '#8A8372' }}>
        <span className="w-3 h-3 rounded" style={{ background: `${MARKER}30`, border: `1px solid ${MARKER}55` }} />
        Typically open for classes
      </div>
    </div>
  )
}

// ─── Video reel ──────────────────────────────────────────────────────────────
function VideoReel({ videos, subjects }) {
  const [active, setActive] = useState(null)
  const subjectTitle = (id) => subjects.find((s) => s.id === id || String(s.serverId) === String(id))?.title
  return (
    <section id="watch" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <SectionHeading eyebrow="Watch a class" title="See how classes actually go" />
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-5 px-5 sm:mx-0 sm:px-0">
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v)}
            className="group relative flex-shrink-0 w-64 sm:w-72 snap-start rounded-xl overflow-hidden border text-left"
            style={{ borderColor: LINE }}
          >
            <div className="relative aspect-video" style={{ background: BOARD }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://img.youtube.com/vi/${v.youtubeVideoId}/hqdefault.jpg`} alt={v.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${MARKER}E6` }}>
                  <Play className="w-4.5 h-4.5 fill-current ml-0.5" style={{ color: BOARD_DARK }} />
                </span>
              </span>
            </div>
            <div className="p-3.5" style={{ background: '#FDFBF5' }}>
              <p className="text-sm font-medium line-clamp-1">{v.title}</p>
              {subjectTitle(v.subjectId) && <p className="text-xs mt-0.5" style={{ color: '#8A8372' }}>{subjectTitle(v.subjectId)}</p>}
            </div>
          </button>
        ))}
      </div>

      {active && (
        <Lightbox onClose={() => setActive(null)}>
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full rounded-xl"
              src={`https://www.youtube.com/embed/${active.youtubeVideoId}?autoplay=1`}
              title={active.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
          <p className="text-white/90 text-sm mt-4">{active.description}</p>
        </Lightbox>
      )}
    </section>
  )
}

function Lightbox({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: '#0E140F E6'.replace(' ', '') }} onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
        <button type="button" onClick={onClose} className="mt-4 text-white/70 text-sm inline-flex items-center gap-1.5 hover:text-white">
          <X className="w-4 h-4" /> Close
        </button>
      </div>
    </div>
  )
}

// ─── Bio / credentials — "transcript" style ─────────────────────────────────
function BioSection({ bio }) {
  return (
    <section id="about" className="py-16 sm:py-24" style={{ background: BOARD, color: CHALK }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
        <div>
          <p className="text-xs font-medium tracking-wide mb-3" style={{ color: MARKER }}>About your teacher</p>
          <h2 className="font-display text-3xl sm:text-4xl mb-5">{bio.ownerName || 'Meet your teacher'}</h2>
          <p className="leading-relaxed" style={{ color: SAGE }}>
            {bio.credibility || 'A dedicated teacher focused on real progress, one class at a time.'}
          </p>
          {(bio.studentsTaught || bio.teachingSince) && (
            <div className="grid grid-cols-2 gap-4 mt-8">
              {bio.studentsTaught && (
                <div className="rounded-xl p-4" style={{ background: '#2E4437' }}>
                  <p className="font-display text-2xl">{bio.studentsTaught}+</p>
                  <p className="text-xs mt-1" style={{ color: SAGE }}>students taught</p>
                </div>
              )}
              {bio.teachingSince && (
                <div className="rounded-xl p-4" style={{ background: '#2E4437' }}>
                  <p className="font-display text-2xl">{new Date().getFullYear() - Number(bio.teachingSince)}+ yrs</p>
                  <p className="text-xs mt-1" style={{ color: SAGE }}>teaching experience</p>
                </div>
              )}
            </div>
          )}
        </div>

        {bio.certifications?.length > 0 && (
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: CHALK, color: INK }}>
            <p className="text-xs font-semibold tracking-wide mb-5" style={{ color: '#8A7B45' }}>Qualifications & credentials</p>
            <ul className="space-y-3.5">
              {bio.certifications.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" style={{ color: '#3B6B4E' }} />
                  <span className="text-sm">{c}</span>
                </li>
              ))}
            </ul>
            {bio.languagesTaught && (
              <p className="text-xs mt-6 pt-5 border-t" style={{ borderColor: LINE, color: '#8A8372' }}>
                Teaches in: {bio.languagesTaught}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── How it works ────────────────────────────────────────────────────────────
function HowItWorks({ settings }) {
  const steps = [
    { icon: Calendar, title: 'Book a slot', detail: 'Pick any open time on the calendar — trial or paid class.' },
    { icon: CheckCircle2, title: 'Get confirmed', detail: `Usually confirmed ${settings?.responseTimePromise?.toLowerCase() || 'within a few hours'}.` },
    { icon: Video, title: 'Join on Google Meet', detail: 'A link lands in your inbox before class starts — no app to install.' },
    { icon: Sparkles, title: 'Learn & keep going', detail: 'Rebook your next class right from the confirmation email.' },
  ]
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <SectionHeading eyebrow="Booking a class" title="From booking to your first lesson" />
      <div className="relative grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-4 mt-4">
        <div className="hidden sm:block absolute top-6 left-[12.5%] right-[12.5%] border-t border-dashed" style={{ borderColor: LINE }} />
        {steps.map((step) => (
          <div key={step.title} className="relative text-center sm:text-left">
            <span className="relative z-10 inline-flex w-12 h-12 rounded-full items-center justify-center mb-4" style={{ background: BOARD, color: MARKER }}>
              <step.icon className="w-5 h-5" />
            </span>
            <h3 className="font-display text-lg mb-1.5">{step.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#5C5546' }}>{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Testimonials — "notes passed in class" ─────────────────────────────────
function TestimonialsSection({ testimonials }) {
  return (
    <section id="reviews" className="py-16 sm:py-24" style={{ background: '#FDFBF5' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <SectionHeading eyebrow="From students" title="What it's like to learn here" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={t.name + i} className="rounded-xl p-5 border" style={{ background: CHALK, borderColor: LINE, transform: i % 2 ? 'rotate(0.6deg)' : 'rotate(-0.6deg)' }}>
              <Quote className="w-5 h-5 mb-3" style={{ color: MARKER }} />
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#3A362C' }}>&ldquo;{t.quote}&rdquo;</p>
              <p className="text-sm font-semibold">{t.name}</p>
              {t.role && <p className="text-xs" style={{ color: '#8A8372' }}>{t.role}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FaqSection({ faqs }) {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <SectionHeading eyebrow="Good to know" title="Frequently asked questions" center />
      <div className="mt-6 divide-y" style={{ borderColor: LINE }}>
        {faqs.map((f, i) => (
          <div key={f.question} className="py-4">
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between text-left gap-4">
              <span className="font-medium text-sm sm:text-base">{f.question}</span>
              <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} style={{ color: '#8A8372' }} />
            </button>
            {open === i && <p className="text-sm leading-relaxed mt-3" style={{ color: '#5C5546' }}>{f.answer}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Contact ─────────────────────────────────────────────────────────────────
function ContactSection({ bio, settings, siteSlug, api }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [state, setState] = useState('idle')

  const submit = async (e) => {
    e.preventDefault()
    setState('sending')
    try {
      await api.sendEnquiry(siteSlug, form)
      setState('sent')
      setForm({ name: '', email: '', message: '' })
    } catch (_) {
      setState('error')
    }
  }

  return (
    <section className="py-16 sm:py-24" style={{ background: BOARD, color: CHALK }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <p className="text-xs font-medium tracking-wide mb-3" style={{ color: MARKER }}>Have a question first?</p>
        <h2 className="font-display text-3xl sm:text-4xl mb-4">{bio.invitation || "Tell me what you're hoping to learn."}</h2>
        {settings?.responseTimePromise && (
          <p className="text-sm mb-8" style={{ color: SAGE }}>Usually replies {settings.responseTimePromise.toLowerCase()}.</p>
        )}

        {state === 'sent' ? (
          <p className="inline-flex items-center gap-2 px-5 py-3 rounded-full" style={{ background: '#2E4437', color: CHALK }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: MARKER }} /> Message sent — thanks!
          </p>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <input required placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg px-4 py-3 text-sm outline-none" style={{ background: '#2E4437', color: CHALK }} />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-lg px-4 py-3 text-sm outline-none" style={{ background: '#2E4437', color: CHALK }} />
            <textarea required placeholder="What would you like to learn?" rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="sm:col-span-2 rounded-lg px-4 py-3 text-sm outline-none resize-none" style={{ background: '#2E4437', color: CHALK }} />
            <button type="submit" disabled={state === 'sending'} className="sm:col-span-2 font-semibold rounded-full py-3 mt-1 disabled:opacity-60"
              style={{ background: MARKER, color: BOARD_DARK }}>
              {state === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            {state === 'error' && <p className="sm:col-span-2 text-sm" style={{ color: CORAL }}>Something went wrong — please try again.</p>}
          </form>
        )}
      </div>
    </section>
  )
}

function SiteFooter({ bio }) {
  return (
    <footer className="py-8 border-t" style={{ background: BOARD_DARK, borderColor: '#2E4437', color: SAGE }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 text-xs flex flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} {bio.brandName || bio.ownerName}</span>
        <span>Built with a live class booking system</span>
      </div>
    </footer>
  )
}

// ─── Shared bits ─────────────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title, center }) {
  return (
    <div className={center ? 'text-center' : ''}>
      <p className="text-xs font-medium tracking-wide mb-3" style={{ color: '#8A7B45' }}>{eyebrow}</p>
      <h2 className="font-display text-3xl sm:text-4xl mb-8" style={{ color: INK }}>{title}</h2>
    </div>
  )
}

function EmptyNote({ text }) {
  return <p className="text-sm rounded-xl border border-dashed px-5 py-8 text-center" style={{ borderColor: LINE, color: '#8A8372' }}>{text}</p>
}

// ─── Booking modal ───────────────────────────────────────────────────────────
function BookingModal({ siteSlug, api, subject, isTrial, settings, onClose }) {
  const [days, setDays] = useState([])
  const [dayIndex, setDayIndex] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('slot') // slot | details | done
  const [form, setForm] = useState({ studentName: '', phone: '', email: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getAvailability(siteSlug, subject.serverId ?? subject.id, 14)
      .then((res) => !cancelled && setDays(res.days || []))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [api, siteSlug, subject])

  const currentDay = days[dayIndex]

  const submit = async (e) => {
    e.preventDefault()
    if (!selectedSlot || !currentDay) return
    setSubmitting(true)
    setError(null)
    try {
      await api.requestBooking(siteSlug, {
        subjectId: subject.serverId ?? subject.id,
        classDate: currentDay.date,
        startTime: selectedSlot.startTime,
        isTrial,
        ...form,
      })
      setStep('done')
    } catch (err) {
      setError(err.message || 'Could not book that slot. It may have just been taken.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5" style={{ background: '#0E140FE6' }} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col" style={{ background: CHALK }} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: BOARD, color: CHALK }}>
          <div>
            <p className="text-xs" style={{ color: MARKER }}>{isTrial ? 'Free trial class' : 'Book a class'}</p>
            <h3 className="font-display text-xl mt-1">{subject.title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 'slot' && (
            <>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin" style={{ color: BOARD }} /></div>
              ) : days.length === 0 ? (
                <EmptyNote text="No open slots right now — send an enquiry instead and we'll find a time." />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <button type="button" disabled={dayIndex === 0} onClick={() => { setDayIndex((i) => i - 1); setSelectedSlot(null) }} className="p-1.5 rounded-full border disabled:opacity-30" style={{ borderColor: LINE }}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <p className="text-sm font-medium">
                      {currentDay && new Date(currentDay.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <button type="button" disabled={dayIndex >= days.length - 1} onClick={() => { setDayIndex((i) => i + 1); setSelectedSlot(null) }} className="p-1.5 rounded-full border disabled:opacity-30" style={{ borderColor: LINE }}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {currentDay.slots.map((slot) => {
                      const active = selectedSlot?.startTime === slot.startTime
                      return (
                        <button key={slot.startTime} type="button" onClick={() => setSelectedSlot(slot)}
                          className="text-sm px-3 py-2.5 rounded-lg border transition-colors"
                          style={active ? { background: BOARD, color: CHALK, borderColor: BOARD } : { borderColor: LINE, color: INK }}>
                          {slotLabel(slot.startTime, slot.endTime)}
                        </button>
                      )
                    })}
                  </div>
                  <button type="button" disabled={!selectedSlot} onClick={() => setStep('details')}
                    className="w-full mt-6 font-semibold rounded-full py-3 disabled:opacity-40"
                    style={{ background: MARKER, color: BOARD_DARK }}>
                    Continue
                  </button>
                </>
              )}
            </>
          )}

          {step === 'details' && (
            <form onSubmit={submit} className="space-y-3">
              <div className="rounded-lg px-4 py-3 text-sm flex items-center gap-2 mb-2" style={{ background: '#FDFBF5', color: '#5C5546' }}>
                <CalendarClock className="w-4 h-4 flex-shrink-0" />
                {currentDay && new Date(currentDay.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                {selectedSlot && <> · {slotLabel(selectedSlot.startTime, selectedSlot.endTime)}</>}
              </div>
              <input required placeholder="Your name" value={form.studentName} onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
                className="w-full rounded-lg px-4 py-3 text-sm border outline-none" style={{ borderColor: LINE }} />
              <input required placeholder="Phone / WhatsApp" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg px-4 py-3 text-sm border outline-none" style={{ borderColor: LINE }} />
              <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg px-4 py-3 text-sm border outline-none" style={{ borderColor: LINE }} />
              <textarea placeholder="Anything I should know before class? (optional)" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg px-4 py-3 text-sm border outline-none resize-none" style={{ borderColor: LINE }} />
              {error && <p className="text-sm" style={{ color: CORAL }}>{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep('slot')} className="px-4 py-3 rounded-full border text-sm font-medium" style={{ borderColor: LINE }}>Back</button>
                <button type="submit" disabled={submitting} className="flex-1 font-semibold rounded-full py-3 disabled:opacity-60" style={{ background: BOARD, color: CHALK }}>
                  {submitting ? 'Booking…' : isTrial ? 'Confirm free trial' : `Confirm · ${formatMoney(subject.price, settings?.currency) || 'request'}`}
                </button>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-4" style={{ color: '#3B6B4E' }} />
              <h4 className="font-display text-xl mb-2">Class requested!</h4>
              <p className="text-sm" style={{ color: '#5C5546' }}>
                You&apos;ll get a {settings?.meetPlatform === 'zoom' ? 'Zoom' : 'Google Meet'} link by email once it&apos;s confirmed — {settings?.responseTimePromise?.toLowerCase() || 'usually within a few hours'}.
              </p>
              <button type="button" onClick={onClose} className="mt-6 px-6 py-2.5 rounded-full text-sm font-medium" style={{ background: BOARD, color: CHALK }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
