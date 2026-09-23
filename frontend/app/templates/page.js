'use client'

import { ArrowRight } from 'lucide-react'

const TEMPLATES = [
  { slug: 'tutor-training',        name: 'Tutors & Independent Educators',           description: 'Live 1-on-1 & group classes on Google Meet, trial bookings, real weekly availability.',                                              theme: 'Chalkboard',   accent: '#24352B', tag: 'Chalkboard Green + Marker Yellow', status: 'live',         banner: '/templates/gallery/tutor-training.png' },
  { slug: 'trip-architect',        name: 'Travel Planners & Trip Architects',         description: 'Route-map hero, custom itinerary showcase, consultation booking and destination portfolio.',                                           theme: 'Cartographer', accent: '#78350f', tag: 'Earthy Brown + Linen',             status: 'live',         banner: '/templates/gallery/trip-architect.png' },
  { slug: 'education-migration',   name: 'Education & Migration Consultant',          description: 'Credential showcase, visa & course guidance services, consultation booking and student success stories.',                              theme: 'Warm',         accent: '#78350f', tag: 'Earthy Brown + Linen',             status: 'live',         banner: '/templates/gallery/education-migration.png' },
  { slug: 'civil-architect-consultant', name: 'Civil Architect Plan & Service',       description: 'Project portfolio, architectural plans showcase, client consultation booking and construction service tiers.',                         theme: 'Blueprint',    accent: '#1e3a8a', tag: 'Blueprint Blue + Concrete',        status: 'live',        banner: '/templates/gallery/civil-architect-card.png' },
  { slug: 'consultant-advisor',    name: 'Tax Advisors, Accountants & Insurance Advisors', description: 'Authority-driven, compliance credentials front and centre, clear service tiers and appointment booking.',                       theme: 'Professional', accent: '#1e3a5f', tag: 'Navy + Gold',                    status: 'live',         banner: '/templates/gallery/consultant-advisor.png' },
  { slug: 'home-interior-vastu',   name: 'Home Interior and Vastu Consultation',      description: 'Portfolio of interior spaces, Vastu principles, design packages, before-after showcases and consultation booking.',                   theme: 'Earthy',       accent: '#92400e', tag: 'Warm Amber + Ivory',               status: 'coming-soon', banner: '/templates/gallery/home-interior-vastu.png' },
]

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f2faf5] to-white pt-20">

      {/* ── Page hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836] py-14 px-4 sm:px-6 lg:px-8 text-center">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="relative">
          <span className="inline-block bg-[#a7f3c0]/10 text-[#a7f3c0] text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-[#a7f3c0]/30">
            6 Ready-Made Templates
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Pick your template,&nbsp;<span className="text-[#a7f3c0]">launch in minutes</span>
          </h1>
          <p className="text-lg text-emerald-50/80 max-w-2xl mx-auto leading-relaxed">
            Every template is built for a specific one-person business model, with the right sections, copy structure, and CTAs pre-wired.
          </p>
        </div>
      </div>

      {/* ── Template grid ── */}
      <div className="max-w-screen-xl mx-auto py-12 px-4 sm:px-8">
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {TEMPLATES.map((t) => (
            <div
              key={t.slug}
              className="group border border-[#c9f2d8] rounded-2xl overflow-hidden bg-white hover:shadow-lg hover:shadow-[#053728]/10 hover:border-[#0f6b4f]/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Banner image — falls back to a colour stripe */}
              {t.banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.banner}
                  alt=""
                  className="h-40 w-full object-cover bg-[#f2faf5]"
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'block' }}
                />
              ) : null}
              <div className="h-1.5 w-full" style={{ background: t.accent, display: t.banner ? 'none' : 'block' }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#d9f5e4] text-[#0a4836]">{t.theme}</span>
                  {t.status === 'live' ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f2faf5] text-[#053728] border border-[#a7f3c0]">Live</span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">Soon</span>
                  )}
                </div>
                <h3 className="font-bold text-[#06352a] text-base mb-1">{t.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{t.description}</p>
                <p className="text-xs text-gray-400 mb-4 font-medium">{t.tag}</p>
                {t.status === 'live' ? (
                  <a
                    href={`/templates/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold px-4 py-2 rounded-lg text-white bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-md shadow-orange-500/30 transition-all"
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