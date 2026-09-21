'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Briefcase, BookOpen, MapPin, ShoppingBag, Users } from 'lucide-react'

const TEMPLATE_SECTIONS = [
  {
    id: 'service-based',
    section: 'Service-Based Solopreneurs',
    icon: Briefcase,
    templates: [
      { slug: 'consultant-advisor',  name: 'Consultant / Advisor',      description: 'Clean, authority-driven — case studies front and centre.', theme: 'Professional', accent: '#1e3a5f', tag: 'Navy + Gold',           status: 'live' },
      { slug: 'coach-mentor',        name: 'Coach / Mentor',            description: 'Warm, personal — transformation story, testimonials heavy.', theme: 'Warm',         accent: '#c2693e', tag: 'Terracotta + Cream',    status: 'live' },
      { slug: 'freelancer-creative', name: 'Freelancer / Creative',     description: 'Portfolio-led, work samples, project enquiry flow.',          theme: 'Bold',         accent: '#6d28d9', tag: 'Electric Violet + Lime', status: 'live' },
      { slug: 'agency-of-one',       name: 'Agency-of-One',             description: 'Process-driven, deliverables ladder, retainer CTA.',          theme: 'Professional', accent: '#334155', tag: 'Slate + Cyan',          status: 'live' },
    ],
  },
  {
    id: 'knowledge-content',
    section: 'Knowledge & Content Creators',
    icon: BookOpen,
    templates: [
      { slug: 'course-creator',        name: 'Course Creator / Educator',      description: 'Curriculum preview, cohort dates, enrolment CTA.',        theme: 'Bold', accent: '#0f766e', tag: 'Deep Teal + Amber', status: 'live' },
      { slug: 'author-speaker',        name: 'Author / Speaker',               description: 'Book/talk showcase, media kit, booking form.',             theme: 'Warm', accent: '#7f1d1d', tag: 'Burgundy + Blush',  status: 'live' },
      { slug: 'newsletter-community',  name: 'Newsletter / Community Builder', description: 'Subscriber-first, free tier → paid tier funnel.',          theme: 'Bold', accent: '#3730a3', tag: 'Indigo + Mint',     status: 'live' },
    ],
  },
  {
    id: 'local-trade',
    section: 'Local & Trade Businesses',
    icon: MapPin,
    templates: [
      { slug: 'local-service-pro',   name: 'Local Service Pro',     description: 'Locality signals, WhatsApp CTA, GST / trust badges.', theme: 'Local', accent: '#166534', tag: 'Forest + Saffron',        status: 'live' },
      { slug: 'clinic-practitioner', name: 'Clinic / Practitioner', description: 'Appointment booking, credentials, FAQ-heavy.',        theme: 'Local', accent: '#0369a1', tag: 'Medical Blue + Lavender', status: 'live' },
      { slug: 'tutor-training',      name: 'Tutor / Training Centre', description: 'Batch schedule, subject grid, parent-friendly copy.', theme: 'Warm', accent: '#ca8a04', tag: 'Sunflower + Sky',         status: 'live' },
    ],
  },
  {
    id: 'product-commerce',
    section: 'Product & Commerce',
    icon: ShoppingBag,
    templates: [
      { slug: 'digital-product-seller', name: 'Digital Product Seller', description: 'Instant download, before/after, price anchor.',             theme: 'Bold',         accent: '#be185d', tag: 'Hot Pink + Dark',     status: 'live' },
      { slug: 'physical-artisan',        name: 'Physical / Artisan',     description: 'Story-led, craft photography slots, custom order form.',  theme: 'Warm',         accent: '#78350f', tag: 'Earthy Brown + Linen', status: 'live' },
    ],
  },
  {
    id: 'hybrid-platform',
    section: 'Hybrid / Platform Models',
    icon: Users,
    templates: [
      { slug: 'community-led',         name: 'Community-Led Business',   description: 'Membership tiers, community preview, join CTA.',            theme: 'Bold',         accent: '#7e22ce', tag: 'Purple + Yellow', status: 'coming-soon' },
      { slug: 'subscription-retainer', name: 'Subscription / Retainer',  description: "Recurring revenue ladder, what's included each month.",    theme: 'Professional', accent: '#111827', tag: 'Charcoal + Coral', status: 'coming-soon' },
      { slug: 'event-workshop-host',   name: 'Event / Workshop Host',    description: 'Date-driven, urgency, waitlist signup.',                   theme: 'Warm',         accent: '#991b1b', tag: 'Ruby + Gold',      status: 'coming-soon' },
    ],
  },
]

// Smooth-scroll helper
function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function TemplatesPage() {
  const [activeSection, setActiveSection] = useState(TEMPLATE_SECTIONS[0].id)
  const sectionRefs = useRef({})

  // Intersection observer — highlights the sidebar item matching the visible section
  useEffect(() => {
    const observers = []
    TEMPLATE_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  return (
    // pt-20 clears the fixed platform header (h-20)
    <div className="min-h-screen bg-gray-50 pt-20">

      {/* ── Page hero ── */}
      <div className="bg-white border-b border-gray-200 py-12 px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-100">
          16 Ready-Made Templates
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
          Pick your template,&nbsp;<span className="text-blue-600">launch in minutes</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Every template is built for a specific one-person business model, with the right sections, copy structure, and CTAs pre-wired.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="max-w-screen-xl mx-auto flex gap-0">

        {/* ── Sticky left sidebar ── */}
        <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
          <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-8 px-4 border-r border-gray-200 bg-white">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">Browse by Category</p>
            <nav className="space-y-1">
              {TEMPLATE_SECTIONS.map(({ id, section, icon: Icon, templates }) => {
                const isActive = activeSection === id
                return (
                  <div key={id}>
                    {/* Section heading — clickable */}
                    <button
                      onClick={() => scrollTo(id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      </span>
                      <span className="leading-tight">{section}</span>
                    </button>
                    {/* Template links beneath section */}
                    <ul className="mt-0.5 ml-9 mb-1 space-y-0.5">
                      {templates.map((t) => (
                        <li key={t.slug}>
                          <button
                            onClick={() => scrollTo(`tpl-${t.slug}`)}
                            className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-1.5 group"
                          >
                            <span className="w-2 h-2 rounded-full flex-shrink-0 border" style={{ borderColor: t.accent, background: t.status === 'live' ? t.accent : 'transparent' }} />
                            <span className="truncate">{t.name}</span>
                            {t.status === 'live' && (
                              <span className="ml-auto flex-shrink-0 text-[10px] font-bold text-green-600">Live</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 py-10 px-4 sm:px-8">
          {TEMPLATE_SECTIONS.map(({ id, section, icon: Icon, templates }) => (
            <section key={id} id={id} className="mb-16 scroll-mt-24">
              {/* Section heading */}
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{section}</h2>
                <span className="ml-auto text-xs text-gray-400 font-medium">{templates.length} templates</span>
              </div>

              {/* Template cards */}
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {templates.map((t) => (
                  <div
                    key={t.slug}
                    id={`tpl-${t.slug}`}
                    className="scroll-mt-24 group border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Colour stripe */}
                    <div className="h-1.5 w-full" style={{ background: t.accent }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{t.theme}</span>
                        {t.status === 'live' ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Live</span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Soon</span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">{t.name}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">{t.description}</p>
                      <p className="text-xs text-gray-400 mb-4 font-medium">{t.tag}</p>
                      {t.status === 'live' ? (
                        <a
                          href={`/templates/${t.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                          style={{ background: t.accent }}
                        >
                          View Template <ArrowRight className="w-4 h-4 ml-1.5" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center text-sm font-semibold text-gray-400 cursor-not-allowed">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
