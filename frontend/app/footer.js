'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Brain, Sparkles, ArrowRight, Mail, Phone, MapPin,
  Twitter, Linkedin, Github, Youtube, Facebook, Instagram,
  BookOpen, Users, Building, MessageSquare, BarChart3, Code,
  Shield, Award, Globe, Zap, Heart
} from 'lucide-react'
import { useSiteConfig } from '../hooks/useSiteConfig'

const SUPPRESS_HEADER_PREFIXES = ['/admin', '/templates']

function isFounderSitePath(pathname) {
  if (SUPPRESS_HEADER_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
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
  const dynPlatform  = dynamicPages.filter(p => p.in_footer_platform).map(p => ({ name: p.title, href: p.slug.startsWith('/') ? p.slug : `/${p.slug}` }))
  const dynResources = dynamicPages.filter(p => p.in_footer_resources).map(p => ({ name: p.title, href: p.slug.startsWith('/') ? p.slug : `/${p.slug}` }))
  const dynCompany   = dynamicPages.filter(p => p.in_footer_company).map(p => ({ name: p.title, href: p.slug.startsWith('/') ? p.slug : `/${p.slug}` }))

  const footerSections = {
    platform:  { title: 'Platform',   links: [...(siteConfig.footerLinks?.platform  || []), ...dynPlatform] },
    resources: { title: 'Resources',  links: [...(siteConfig.footerLinks?.resources || []), ...dynResources] },
    company:   { title: 'Company',    links: [...(siteConfig.footerLinks?.company   || []), ...dynCompany] },
  }

  const socialIconMap = { Twitter, Linkedin, Github, Youtube, Facebook, Instagram }
  const socialLinks = Object.entries(siteConfig.social)
    .filter(([, href]) => href)
    .map(([name, href]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      href,
      icon: socialIconMap[name.charAt(0).toUpperCase() + name.slice(1)] || Globe,
    }))

  // Hide platform footer on founder-generated website pages
  if (isFounderSitePath(pathname)) return null

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Company Info & Newsletter - 5 columns */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <Link href="/" className="flex items-center space-x-3 group mb-6">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-800" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{siteConfig.brand.name}</h2>
                  <p className="text-sm text-gray-300">{siteConfig.brand.tagline}</p>
                </div>
              </Link>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                {siteConfig.brand.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Mail className="w-4 h-4 mr-3 text-blue-400" />
                  <span className="text-sm">{siteConfig.contact.email}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Phone className="w-4 h-4 mr-3 text-blue-400" />
                  <span className="text-sm">{siteConfig.contact.phone}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-4 h-4 mr-3 text-blue-400" />
                  <span className="text-sm">{siteConfig.contact.location}</span>
                </div>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-400" />
                Stay Updated
              </h3>
              
              {subscribed ? (
                <div className="bg-green-600 bg-opacity-20 border border-green-500 rounded-lg p-4 flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-green-400 font-medium">Successfully subscribed!</p>
                    <p className="text-green-300 text-sm">Welcome to the AI community.</p>
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
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={isSubscribing}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
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
                  <p className="text-xs text-gray-400">
                    By subscribing, you agree to our Privacy Policy and consent to receive updates.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Navigation Links - 7 columns */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Platform, Resources, Company - All 3 sections */}
              {Object.entries(footerSections).map(([key, section]) => (
                <div key={key}>
                  <h3 className="text-lg font-semibold mb-4 text-white">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.links.map((link, index) => (
                      <li key={index}>
                        <Link
                          href={link.href}
                          className="flex items-center text-gray-300 hover:text-blue-400 transition-colors text-sm group"
                        >
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
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            
            <div className="text-center lg:text-left">
              <p className="text-gray-400 text-sm">
                © {siteConfig.brand.year} {siteConfig.brand.name}. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {siteConfig.brand.description}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm mr-2">Follow us:</span>
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  aria-label={`Follow us on ${social.name}`}
                >
                  <social.icon className="w-5 h-5 text-gray-300 group-hover:text-white" />
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <Link href="/status" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                System Status
              </Link>
              <Link href="/sitemap" className="text-gray-400 hover:text-blue-400 transition-colors">
                Sitemap
              </Link>
              <Link href="/accessibility" className="text-gray-400 hover:text-blue-400 transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-40"
        aria-label="Back to top"
      >
        <ArrowRight className="w-5 h-5 transform -rotate-90 group-hover:scale-110 transition-transform" />
      </button>
    </footer>
  )
}