'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Brain, ArrowRight, Mail, Phone, MapPin,
  Twitter, Linkedin, Github, Youtube, Facebook, Instagram,
  Globe, Heart,
} from 'lucide-react'
import { useSiteConfig } from '../hooks/useSiteConfig'

// ─────────────────────────────────────────────
// Brand — keep in sync with header.js
//   frontend/public/brand/logo-mark-light.png  → logo for DARK backgrounds (white / light-green version)
//   frontend/public/brand/logo-mark.png        → normal logo (shown on a white tile if the light one is missing)
// If neither file exists, the Brain icon is used.
// ─────────────────────────────────────────────
const BRAND_NAME = 'Shukto'
const LOGO_LIGHT_SRC = '/brand/logo-mark-light.png'
const LOGO_SRC = '/brand/logo-mark.png'
const SHOW_NAME_NEXT_TO_LOGO = true

const SUPPRESS_HEADER_PREFIXES = ['/admin', '/templates']

function isFounderSitePath(pathname) {
  if (SUPPRESS_HEADER_PREFIXES.some(p => pathname.startsWith(p + '/'))) return true
  const PLATFORM_ROUTES = new Set([
    'dashboard', 'profile', 'settings', 'platform', 'setup-wizard',
    'login', 'signout', 'pricing', 'resources', 'community',
    'marketing', 'contact', 'get_started', 'about', 'auth', 'templates',
  ])
  if (!/^\/[a-z0-9][a-z0-9-]*$/.test(pathname)) return false
  const segment = pathname.slice(1)
  return !PLATFORM_ROUTES.has(segment)
}

export default function Footer() {
  const pathname = usePathname()
  const siteConfig = useSiteConfig()
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [dynamicPages, setDynamicPages] = useState([])
  const [logoStage, setLogoStage] = useState(0) // 0 = light logo, 1 = normal logo on white tile, 2 = icon fallback

  useEffect(() => {
    fetch('/api/pages/public')
      .then(r => r.ok ? r.json() : [])
      .then(setDynamicPages)
      .catch(() => {})
  }, [])

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    setIsSubscribing(true)
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      })
      if (res.ok) {
        setSubscribed(true)
        setEmail('')
      }
    } catch (_) {
      // Fail silently — UX already shows success on any network issue
      setSubscribed(true)
      setEmail('')
    } finally {
      setIsSubscribing(false)
    }
  }

  // Merge static footer links from site config with dynamic pages from admin
  const toLink = (p) => ({ name: p.title, href: p.slug.startsWith('/') ? p.slug : `/${p.slug}` })
  const dynPlatform  = dynamicPages.filter(p => p.in_footer_platform).map(toLink)
  const dynResources = dynamicPages.filter(p => p.in_footer_resources).map(toLink)
  const dynCompany   = dynamicPages.filter(p => p.in_footer_company).map(toLink)

  const footerSections = {
    platform:  { title: 'Platform',  links: [...(siteConfig.footerLinks?.platform  || []), ...dynPlatform] },
    resources: { title: 'Resources', links: [...(siteConfig.footerLinks?.resources || []), ...dynResources] },
    company:   { title: 'Company',   links: [...(siteConfig.footerLinks?.company   || []), ...dynCompany] },
  }

  const socialIconMap = { Twitter, Linkedin, Github, Youtube, Facebook, Instagram }
  const socialLinks = Object.entries(siteConfig.social || {})
    .filter(([, href]) => href)
    .map(([name, href]) => {
      const label = name.charAt(0).toUpperCase() + name.slice(1)
      return { name: label, href, icon: socialIconMap[label] || Globe }
    })

  const contact = siteConfig.contact || {}
  const brand = siteConfig.brand || {}

  // Hide platform footer on founder-generated website pages
  if (isFounderSitePath(pathname)) return null

  return (
    <footer className="shukto-footer relative overflow-hidden text-white">
      <style jsx global>{`
        .shukto-footer {
          background: linear-gradient(160deg, #021610 0%, #053728 55%, #0a4836 100%);
        }

        /* Moving glow: three soft orbs drifting behind the content */
        .footer-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          pointer-events: none;
          will-change: transform;
        }
        .footer-orb.a { width: 26rem; height: 26rem; top: -8rem; left: -6rem;  background: #a7f3c0; opacity: 0.16; animation: footerDriftA 18s ease-in-out infinite alternate; }
        .footer-orb.b { width: 22rem; height: 22rem; bottom: -9rem; right: -4rem; background: #0f8a63; opacity: 0.28; animation: footerDriftB 22s ease-in-out infinite alternate; }
        .footer-orb.c { width: 14rem; height: 14rem; top: 35%; left: 55%; background: #f97316; opacity: 0.10; animation: footerDriftC 26s ease-in-out infinite alternate; }

        @keyframes footerDriftA { from { transform: translate(0, 0) scale(1); }    to { transform: translate(14rem, 6rem) scale(1.25); } }
        @keyframes footerDriftB { from { transform: translate(0, 0) scale(1.1); }  to { transform: translate(-16rem, -5rem) scale(0.9); } }
        @keyframes footerDriftC { from { transform: translate(0, 0) scale(1); }    to { transform: translate(-10rem, 8rem) scale(1.4); } }

        /* Glowing line sweeping along the top edge */
        .footer-edge {
          position: absolute; top: 0; left: 0; right: 0; height: 2px; overflow: hidden;
          background: rgba(167, 243, 192, 0.15);
        }
        .footer-edge::after {
          content: ''; position: absolute; top: 0; left: -40%; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, #a7f3c0, #f97316, transparent);
          animation: footerSweep 6s linear infinite;
        }
        @keyframes footerSweep { to { left: 100%; } }

        .footer-link { transition: color 0.2s ease, transform 0.2s ease; }
        .footer-link:hover { color: #a7f3c0; transform: translateX(3px); }

        @media (prefers-reduced-motion: reduce) {
          .footer-orb, .footer-edge::after { animation: none; }
        }
      `}</style>

      {/* Animated background */}
      <div className="footer-edge" aria-hidden="true" />
      <div className="footer-orb a" aria-hidden="true" />
      <div className="footer-orb b" aria-hidden="true" />
      <div className="footer-orb c" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Company Info & Newsletter - 5 columns */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <Link href="/" className="flex items-center space-x-3 group mb-6" aria-label={`${BRAND_NAME} home`}>
                {logoStage === 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={LOGO_LIGHT_SRC} alt={BRAND_NAME} className="h-12 w-auto max-w-[180px] object-contain" onError={() => setLogoStage(1)} />
                )}
                {logoStage === 1 && (
                  <div className="bg-white rounded-xl p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={LOGO_SRC} alt={BRAND_NAME} className="h-9 w-auto max-w-[160px] object-contain" onError={() => setLogoStage(2)} />
                  </div>
                )}
                {logoStage === 2 && (
                  <div className="w-12 h-12 bg-[#a7f3c0]/15 border border-[#a7f3c0]/40 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Brain className="w-7 h-7 text-[#a7f3c0]" />
                  </div>
                )}
                {(SHOW_NAME_NEXT_TO_LOGO || logoStage === 2) && (
                  <div>
                    <h2 className="text-2xl font-black text-white">{BRAND_NAME}</h2>
                    {brand.tagline && <p className="text-sm text-emerald-100/70">{brand.tagline}</p>}
                  </div>
                )}
              </Link>

              {brand.description && (
                <p className="text-emerald-50/75 leading-relaxed mb-6">{brand.description}</p>
              )}

              <div className="space-y-3">
                {contact.email && (
                  <div className="flex items-center text-emerald-50/80">
                    <Mail className="w-4 h-4 mr-3 text-[#a7f3c0]" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center text-emerald-50/80">
                    <Phone className="w-4 h-4 mr-3 text-[#a7f3c0]" />
                    <span className="text-sm">{contact.phone}</span>
                  </div>
                )}
                {contact.location && (
                  <div className="flex items-center text-emerald-50/80">
                    <MapPin className="w-4 h-4 mr-3 text-[#a7f3c0]" />
                    <span className="text-sm">{contact.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-[#a7f3c0]" />
                Stay Updated
              </h3>

              {subscribed ? (
                <div className="bg-[#a7f3c0]/10 border border-[#a7f3c0]/40 rounded-lg p-4 flex items-center">
                  <div className="w-8 h-8 bg-[#a7f3c0] rounded-full flex items-center justify-center mr-3">
                    <Heart className="w-4 h-4 text-[#053728]" />
                  </div>
                  <div>
                    <p className="text-[#a7f3c0] font-medium">Successfully subscribed!</p>
                    <p className="text-emerald-100/80 text-sm">Welcome to the {BRAND_NAME} community.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="flex-1 px-4 py-3 bg-white/10 border border-[#a7f3c0]/25 rounded-lg text-white placeholder-emerald-100/50 focus:outline-none focus:ring-2 focus:ring-[#a7f3c0] focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={isSubscribing}
                      className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md shadow-orange-500/30 transition-all duration-200 disabled:opacity-50 flex items-center justify-center min-w-[120px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a7f3c0]"
                    >
                      {isSubscribing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Subscribe
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-emerald-100/60">
                    By subscribing, you agree to our Privacy Policy and consent to receive updates.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Navigation Links - 7 columns */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(footerSections).map(([key, section]) => (
                <div key={key}>
                  <h3 className="text-lg font-semibold mb-4 text-white">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.links.map((link, index) => (
                      <li key={index}>
                        <Link href={link.href} className="footer-link flex items-center text-emerald-50/75 text-sm group">
                          {link.icon && <link.icon className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100" />}
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative border-t border-[#a7f3c0]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">

            <div className="text-center lg:text-left">
              <p className="text-emerald-100/70 text-sm">
                © {brand.year || new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
              </p>
              {brand.description && (
                <p className="text-emerald-100/50 text-xs mt-1">{brand.description}</p>
              )}
            </div>

            {socialLinks.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-emerald-100/70 text-sm mr-2">Follow us:</span>
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-[#a7f3c0]/20 border border-transparent hover:border-[#a7f3c0]/40 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <social.icon className="w-5 h-5 text-emerald-50/80 group-hover:text-[#a7f3c0]" />
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/privacy-policy"  className="text-emerald-100/70 hover:text-[#a7f3c0] transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-use"    className="text-emerald-100/70 hover:text-[#a7f3c0] transition-colors">Terms of Use</Link>
              <Link href="/refund-policy"   className="text-emerald-100/70 hover:text-[#a7f3c0] transition-colors">Refund Policy</Link>
              <Link href="/cookie-policy"   className="text-emerald-100/70 hover:text-[#a7f3c0] transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-full shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a7f3c0]"
        aria-label="Back to top"
      >
        <ArrowRight className="w-5 h-5 transform -rotate-90 group-hover:scale-110 transition-transform" />
      </button>
    </footer>
  )
}