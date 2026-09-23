'use client'

import { ArrowRight } from 'lucide-react'

const TEMPLATES = [
  { slug: 'tutor-training',       name: 'Tutors & Independent Educators',                  description: 'Live 1-on-1 & group classes on Google Meet, trial bookings, real weekly availability.',                                             theme: 'Chalkboard',   accent: '#24352B', tag: 'Chalkboard Green + Marker Yellow', status: 'live',         banner: '/templates/gallery/tutor-training.png' },
  { slug: 'astrologer-spiritual', name: 'Astrologers & Spiritual-Service Providers',        description: 'Birth-chart consultations, remedies, online puja bookings and trust-building for spiritual practitioners.',                           theme: 'Celestial',    accent: '#4B0082', tag: 'Deep Indigo + Gold',               status: 'coming-soon', banner: '/templates/gallery/astrologer-spiritual.png' },
  { slug: 'physical-artisan',     name: 'Photographers, Artists & Creative Professionals', description: 'Story-led portfolio, craft photography slots, custom order and commission enquiry flow.',                                              theme: 'Warm',         accent: '#78350f', tag: 'Earthy Brown + Linen',             status: 'live',         banner: '/templates/gallery/physical-artisan.png' },
  { slug: 'trip-architect',       name: 'Travel Planners & Trip Architects',                description: 'Route-map hero, custom itinerary showcase, consultation booking and destination portfolio.',                                          theme: 'Cartographer', accent: '#78350f', tag: 'Earthy Brown + Linen',             status: 'live',         banner: '/templates/gallery/trip-architect.png' },
  { slug: 'consultant-advisor',   name: 'Tax Advisors, Accountants & Insurance Advisors',  description: 'Authority-driven, compliance credentials front and centre, clear service tiers and appointment booking.',                             theme: 'Professional', accent: '#1e3a5f', tag: 'Navy + Gold',                    status: 'live',         banner: '/templates/gallery/consultant-advisor.png' },
]

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">

      {/* ── Page hero ── */}
      <div className="bg-white border-b border-gray-200 py-12 px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-100">
          5 Ready-Made Templates
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
          Pick your template,&nbsp;<span className="text-blue-600">launch in minutes</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Every template is built for a specific one-person business model, with the right sections, copy structure, and CTAs pre-wired.
        </p>
      </div>

      {/* ── Template grid ── */}
      <div className="max-w-screen-xl mx-auto py-12 px-4 sm:px-8">
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {TEMPLATES.map((t) => (
            <div
              key={t.slug}
              className="group border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Banner image — falls back to a colour stripe */}
              {t.banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.banner}
                  alt=""
                  className="h-40 w-full object-cover bg-gray-100"
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'block' }}
                />
              ) : null}
              <div className="h-1.5 w-full" style={{ background: t.accent, display: t.banner ? 'none' : 'block' }} />
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
                <p className="text-xs mb-4 font-medium" style={{ color: t.tagColor || undefined }} className="text-xs text-gray-400 mb-4 font-medium">{t.tag}</p>
                {t.status === 'live' ? (
                  <a
                    href={`/templates/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                    style={{ background: t.btnAccent || t.accent, color: t.tagColor || '#ffffff' }}
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
      </div>
    </div>
  )
}