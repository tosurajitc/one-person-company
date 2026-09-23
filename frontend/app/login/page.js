'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { FaLinkedin, FaFacebook, FaGithub } from 'react-icons/fa'

import {
  ArrowRight, Eye, EyeOff, Mail, Lock, AlertCircle, Brain, Sparkles,
  Globe, LayoutTemplate, CreditCard, Users, MessageSquare,
  FileText, Monitor, Lightbulb, ShieldCheck,
} from 'lucide-react'

// Brand — keep in sync with header.js / footer.js
const BRAND_NAME = 'Shukto'
const LOGO_SRC = '/brand/logo-mark.png'

const inputCls =
  'w-full px-4 py-3 border border-[#c9f2d8] rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] focus:border-[#0f6b4f]'
const btnOrange =
  'w-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center'

// ─────────────────────────────────────────────
// Left panel: interactive preview of what is inside the platform
// (every line describes something the platform actually does)
// ─────────────────────────────────────────────
function DashboardPreview() {
  const [activeView, setActiveView] = useState(0)

  const dashboardViews = [
    {
      title: 'AI Website Builder',
      description: 'Answer a few questions and Genie drafts your positioning, offers and pages for you to review',
      icon: Globe,
      color: 'from-[#053728] to-[#0f6b4f]',
      stats: ['Guided intake', 'Your own prices', 'Edit anytime'],
    },
    {
      title: 'AI Genie',
      description: 'Seven specialist consultants: marketing, legal, tax, migration, higher education, interiors and travel',
      icon: Sparkles,
      color: 'from-[#0a4836] to-[#0f8a63]',
      stats: ['1 min free', 'Voice or text', 'Pay per minute'],
    },
    {
      title: 'Offers & Payments',
      description: 'Package your services into priced offers with their own pages and a built-in checkout',
      icon: CreditCard,
      color: 'from-orange-500 to-orange-600',
      stats: ['Razorpay', 'Stripe', 'Tiered offers'],
    },
    {
      title: 'Your Community',
      description: 'Open a free or paid members-only community for your audience, with threads and events',
      icon: Users,
      color: 'from-[#04261c] to-[#0a4836]',
      stats: ['Free or paid', 'Threads & events', 'Pro plans'],
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveView((prev) => (prev + 1) % dashboardViews.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-[#a7f3c0]/20 mt-12">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-[#a7f3c0] rounded-xl flex items-center justify-center mr-4">
          <Monitor className="w-7 h-7 text-[#053728]" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Your {BRAND_NAME} Dashboard</h3>
          <p className="text-emerald-100/70 text-lg">Everything you need to run your business solo</p>
        </div>
      </div>

      {/* Views showcase */}
      <div className="mb-8">
        {dashboardViews.map((view, index) => {
          const Icon = view.icon
          return (
            <div
              key={index}
              className={`transition-all duration-700 ${activeView === index ? 'opacity-100 block' : 'opacity-0 hidden'}`}
            >
              <div className={`bg-gradient-to-r ${view.color} rounded-2xl p-6 text-white`}>
                <div className="flex items-center mb-4">
                  <Icon className="w-8 h-8 mr-3 shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold">{view.title}</h4>
                    <p className="text-white/90 mt-1">{view.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {view.stats.map((stat, idx) => (
                    <div key={idx} className="bg-white/20 rounded-lg p-3 text-center">
                      <p className="text-white font-medium text-sm">{stat}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center space-x-3 mb-8">
        {dashboardViews.map((view, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveView(index)}
            aria-label={`Show ${view.title}`}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              activeView === index ? 'bg-orange-500 scale-125' : 'bg-[#a7f3c0]/30 hover:bg-[#a7f3c0]/60'
            }`}
          />
        ))}
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { icon: Globe, title: 'Your Website', subtitle: 'Live & branded' },
          { icon: Sparkles, title: 'AI Genie', subtitle: 'Ask by the minute' },
          { icon: FileText, title: 'Offers', subtitle: 'Priced packages' },
          { icon: Users, title: 'Community', subtitle: 'Your audience' },
        ].map((feature, index) => {
          const Icon = feature.icon
          return (
            <div key={index} className="bg-white/5 rounded-xl p-4 border border-[#a7f3c0]/20 text-center hover:border-[#a7f3c0]/60 hover:bg-white/10 transition-all">
              <Icon className="w-6 h-6 text-[#a7f3c0] mx-auto mb-2" />
              <div className="text-lg font-bold text-white">{feature.title}</div>
              <div className="text-emerald-100/60 text-sm">{feature.subtitle}</div>
            </div>
          )
        })}
      </div>

      {/* Note */}
      <div className="bg-white/5 rounded-xl p-6 border border-[#a7f3c0]/20">
        <div className="flex items-center text-[#a7f3c0] mb-3">
          <Lightbulb className="w-5 h-5 mr-2" />
          <span className="font-semibold">Ready to pick up where you left off?</span>
        </div>
        <p className="text-emerald-50/70 leading-relaxed">
          Sign in to manage your website, review your offers and start an AI Genie session.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Login / register card
// ─────────────────────────────────────────────
const socialLogins = [
  { name: 'Google',   icon: FcGoogle,    provider: 'google',   iconColor: undefined },
  { name: 'LinkedIn', icon: FaLinkedin,  provider: 'linkedin', iconColor: '#0A66C2' },
  { name: 'Facebook', icon: FaFacebook,  provider: 'facebook', iconColor: '#1877F2' },
  { name: 'GitHub',   icon: FaGithub,    provider: 'github',   iconColor: '#181717' },
]

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [legacyLogin, setLegacyLogin] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [logoOk, setLogoOk] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', fullName: '' })
  const router = useRouter()

  const handleOAuthLogin = async (provider) => {
    setIsLoading(true)
    setLoadingProvider(provider)
    setError('')

    try {
      // Generate state parameter for security
      const state = generateRandomString(32)
      localStorage.setItem('oauth_state', state)
      localStorage.setItem('oauth_provider', provider)

      const oauthUrl = await getOAuthUrl(provider, state)

      if (oauthUrl) {
        window.location.href = oauthUrl
      } else {
        throw new Error('Failed to generate OAuth URL')
      }
    } catch (err) {
      setError(`Failed to initiate ${provider} login. Please try again.`)
      setIsLoading(false)
      setLoadingProvider('')
    }
  }

  const getOAuthUrl = async (provider, state) => {
    try {
      const response = await fetch(`/api/auth/oauth/${provider}/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.authorization_url
      }
      return null
    } catch (error) {
      console.error('Error getting OAuth URL:', error)
      return null
    }
  }

  const generateRandomString = (length) => {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
          : (data.detail ?? `Registration failed (${res.status})`)
        throw new Error(String(detail))
      }
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('user_role', data.user?.role ?? '')
        localStorage.setItem('user_data', JSON.stringify(data.user ?? {}))
        document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`
        window.dispatchEvent(new Event('authchange'))
      }
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleLegacySubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const detail = Array.isArray(data.detail)
          ? data.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
          : (data.detail ?? `Login failed (${res.status})`)
        throw new Error(String(detail))
      }

      const data = await res.json()

      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('user_role', data.user?.role ?? '')
        localStorage.setItem('user_data', JSON.stringify(data.user ?? {}))
        document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`
        // Notify same-tab listeners (e.g. Header) that auth state changed.
        window.dispatchEvent(new Event('authchange'))
      }

      // Redirect: honour ?next= or ?redirect= (both are used by different pages)
      const role = data.user?.role ?? ''
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next') || params.get('redirect')
      router.push(next || (role === 'admin' || role === 'super_admin' ? '/admin' : '/dashboard'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Check for OAuth callback success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const success = urlParams.get('success')

    if (error) {
      setError(decodeURIComponent(error))
    }

    if (success) {
      // Honour ?next= or ?redirect= if present, otherwise go to dashboard
      const next = urlParams.get('next') || urlParams.get('redirect')
      router.push(next || '/dashboard')
    }
  }, [router])

  // Plain function (not a component) so the input keeps focus while typing
  const passwordField = ({ label, name, placeholder, minLength }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          id={name}
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          placeholder={placeholder}
          required
          minLength={minLength}
          className={`${inputCls} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#0a4836]"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="relative bg-white rounded-3xl shadow-2xl shadow-[#053728]/15 border border-[#c9f2d8] max-w-md w-full overflow-hidden">
      {/* Accent strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#053728] via-[#0f6b4f] to-orange-500" />

      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f2faf5] to-[#d9f5e4] border border-[#c9f2d8] flex items-center justify-center">
            {logoOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={LOGO_SRC} alt={BRAND_NAME} className="h-14 w-14 object-contain" onError={() => setLogoOk(false)} />
            ) : (
              <Brain className="w-9 h-9 text-[#0a4836]" />
            )}
          </div>
          <h2 className="text-2xl font-black text-[#06352a] mb-1">
            {mode === 'register' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-gray-500 text-sm">
            {mode === 'register'
              ? `Start building your one-person company with ${BRAND_NAME}`
              : 'Sign in to continue building your one-person company'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-[#c9f2d8] p-1 mb-6 bg-[#f2faf5]">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setLegacyLogin(false) }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-[#0a4836] text-white shadow-sm' : 'text-gray-600 hover:text-[#0a4836]'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setLegacyLogin(false) }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-[#0a4836] text-white shadow-sm' : 'text-gray-600 hover:text-[#0a4836]'}`}
          >
            Register
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {mode === 'register' ? (
          /* ── Register form ── */
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input id="fullName" type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Jane Doe" required className={inputCls} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="your.email@example.com" required className={inputCls} />
            </div>
            {passwordField({ label: 'Password', name: 'password', placeholder: 'At least 6 characters', minLength: 6 })}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Repeat your password" required className={inputCls} />
            </div>
            <button type="submit" disabled={isLoading} className={btnOrange}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </button>
          </form>
        ) : !legacyLogin ? (
          <>
            {/* OAuth options — 2 × 2 grid */}
            <p className="text-xs font-semibold text-gray-500 text-center mb-3">Continue with</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {socialLogins.map((social) => {
                const IconComponent = social.icon
                const isProviderLoading = isLoading && loadingProvider === social.provider
                return (
                  <button
                    key={social.provider}
                    type="button"
                    onClick={() => handleOAuthLogin(social.provider)}
                    disabled={isLoading}
                    className="flex items-center justify-center px-3 py-3 border-2 border-[#c9f2d8] hover:border-[#0f6b4f] hover:bg-[#f2faf5] hover:-translate-y-0.5 hover:shadow-md rounded-xl font-medium text-sm text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProviderLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-[#0a4836] rounded-full animate-spin mr-2" />
                    ) : (
                      <IconComponent className="w-5 h-5 mr-2" style={social.iconColor ? { color: social.iconColor } : undefined} />
                    )}
                    <span>{isProviderLoading ? 'Connecting…' : social.name}</span>
                  </button>
                )
              })}
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#d9f5e4]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400 uppercase tracking-wider">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLegacyLogin(true)}
              className="w-full bg-gradient-to-br from-[#053728] to-[#0a4836] hover:from-[#0a4836] hover:to-[#0f6b4f] text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center shadow-md"
            >
              <Mail className="w-4 h-4 mr-2" />
              Sign in with Email &amp; Password
            </button>
          </>
        ) : (
          <>
            {/* Email / password form (admins sign in here too and are sent to /admin) */}
            <form onSubmit={handleLegacySubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="your.email@example.com" required className={inputCls} />
              </div>
              {passwordField({ label: 'Password', name: 'password', placeholder: 'Enter your password' })}
              <button type="submit" disabled={isLoading} className={btnOrange}>
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setLegacyLogin(false)}
                className="text-[#0a4836] hover:text-[#053728] text-sm font-medium transition-colors"
              >
                ← Back to other sign-in options
              </button>
            </div>
          </>
        )}

        {/* Admin link */}
        <div className="mt-8 text-center border-t border-[#d9f5e4] pt-6">
          <p className="text-gray-500 text-sm mb-2">Need admin access?</p>
          <Link href="/admin/login" className="inline-flex items-center text-[#0a4836] hover:text-[#053728] text-sm font-semibold transition-colors">
            <Lock className="w-4 h-4 mr-2" />
            Admin Login
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          <div className="flex justify-center space-x-6 text-sm">
            <Link href="/terms" className="text-gray-500 hover:text-[#0a4836] transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-gray-500 hover:text-[#0a4836] transition-colors">Privacy Policy</Link>
          </div>
          <div className="bg-[#f2faf5] border border-[#d9f5e4] rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-[#0a4836]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Social sign-in never shares your provider password with us.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main login page — left showcase + right login panel
// ─────────────────────────────────────────────
export default function LoginPage() {
  const [logoOk, setLogoOk] = useState(true)

  const platformBenefits = [
    { icon: Globe, title: 'AI Website Builder', description: 'Answer Genie’s questions and get a drafted site with your positioning, offers and pages' },
    { icon: Sparkles, title: 'AI Genie', description: 'Seven specialist consultants for marketing, legal, tax, migration, education, interiors and travel' },
    { icon: LayoutTemplate, title: 'Templates', description: 'Ready-made website templates built for different one-person business models' },
    { icon: CreditCard, title: 'Offers & Payments', description: 'Priced offers with checkout through Razorpay for rupees and Stripe for international payments' },
    { icon: Users, title: 'Community', description: 'A free or paid members-only space for your audience, with threads and events' },
  ]

  const highlights = [
    { number: '7', label: 'AI Genies', icon: Sparkles },
    { number: '1 min', label: 'Free on every session', icon: MessageSquare },
    { number: '6', label: 'Ready-made templates', icon: LayoutTemplate },
    { number: '₹10', label: 'Per minute after that', icon: CreditCard },
  ]

  const steps = [
    { title: 'Answer Genie’s questions', text: 'Describe what you do, who you help and what you charge.' },
    { title: 'Review and confirm', text: 'Check the draft in the setup wizard and edit anything you like.' },
    { title: 'Publish your site', text: 'Pick a template and go live at your own address.' },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row pt-16 lg:pt-20">
      {/* Left side — platform showcase (shown below the card on mobile) */}
      <div className="order-2 lg:order-1 flex-1 relative overflow-hidden bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836] p-8 lg:p-16 flex flex-col justify-center">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />

        <div className="relative max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white/10 border border-[#a7f3c0]/30 rounded-2xl flex items-center justify-center mr-6 shrink-0">
                {logoOk ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={LOGO_SRC} alt="" className="h-11 w-11 object-contain" onError={() => setLogoOk(false)} />
                ) : (
                  <Brain className="w-9 h-9 text-[#a7f3c0]" />
                )}
              </div>
              <div>
                <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">Welcome Back</h1>
                <p className="text-[#a7f3c0] text-xl lg:text-2xl mt-3 font-medium">
                  Continue building your one-person company
                </p>
              </div>
            </div>
            <p className="text-xl lg:text-2xl text-emerald-50/75 leading-relaxed max-w-3xl">
              Sign in to manage your website, review your offers and start an AI Genie session.
            </p>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {highlights.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white/5 rounded-2xl p-6 border border-[#a7f3c0]/20 text-center hover:border-[#a7f3c0]/60 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                  <Icon className="w-8 h-8 text-[#a7f3c0] mx-auto mb-3" />
                  <div className="text-3xl font-black text-white mb-2">{stat.number}</div>
                  <div className="text-emerald-100/70 text-sm">{stat.label}</div>
                </div>
              )
            })}
          </div>

          {/* Interactive preview */}
          <DashboardPreview />

          {/* Platform benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {platformBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="bg-white/5 rounded-2xl p-6 border border-[#a7f3c0]/20 hover:border-[#a7f3c0]/60 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-[#a7f3c0] rounded-xl flex items-center justify-center mr-4 shrink-0 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-[#053728]" />
                    </div>
                    <h3 className="text-white font-bold text-lg">{benefit.title}</h3>
                  </div>
                  <p className="text-emerald-50/70 leading-relaxed">{benefit.description}</p>
                </div>
              )
            })}
          </div>

          {/* How it works */}
          <div className="mt-12 bg-white/5 rounded-2xl p-8 border border-[#a7f3c0]/20">
            <div className="flex items-center mb-6">
              <Sparkles className="w-6 h-6 text-orange-400 mr-3" />
              <h3 className="text-2xl font-bold text-white">How it works</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <div key={step.title} className="flex items-start">
                  <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center mr-4 shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-white font-semibold">{step.title}</p>
                    <p className="text-emerald-50/70 text-sm mt-1 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 pt-5 border-t border-[#a7f3c0]/15 text-sm text-emerald-100/70">
              Genie never invents prices, numbers or testimonials. Those come only from you.
            </p>
          </div>
        </div>
      </div>

      {/* Right side — login panel (shown first on mobile, stays in view on desktop) */}
      <div className="order-1 lg:order-2 w-full lg:w-[28rem] xl:w-[32rem] bg-gradient-to-b from-[#f2faf5] to-white flex items-start justify-center p-6 sm:p-8 pt-10 lg:pt-16 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto border-l border-[#d9f5e4]">
        <LoginForm />
      </div>
    </div>
  )
}