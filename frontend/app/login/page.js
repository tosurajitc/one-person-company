'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin, FaMicrosoft, FaGithub } from "react-icons/fa"; 

import { 
  LogIn, Brain, Target, ArrowRight, Play, Eye, EyeOff,
  BarChart3, Users, Zap, CheckCircle, Star, Lightbulb,
  Award, Globe, Shield, Search, Sparkles, User, Mail,
  Lock, Building, Calendar, Code, Database, TrendingUp,
  MessageSquare, BookOpen, Layers, Hexagon, Package,
  Activity, PieChart, Workflow, Monitor, AlertCircle, FileText
} from 'lucide-react'

// Interactive Dashboard Preview Component
function DashboardPreview() {
  const [activeView, setActiveView] = useState(0)
  
  const dashboardViews = [
    {
      title: "Your Business Dashboard",
      description: "Manage your website, offers, analytics, and community from one clean view",
      icon: BarChart3,
      color: "from-primary-600 to-primary-700",
      stats: ["Website Live", "Offers Active", "AI Genie On"]
    },
    {
      title: "AI Genie in Action",
      description: "Your Genie handles customer questions, writes content, and gives business advice",
      icon: MessageSquare,
      color: "from-primary-700 to-primary-800",
      stats: ["24/7 Support", "Your Voice", "Zero Training"]
    },
    {
      title: "Offers & Revenue",
      description: "Create service packages, digital products, and payment links in minutes",
      icon: TrendingUp,
      color: "from-primary-500 to-primary-600",
      stats: ["Instant Payments", "No Inventory", "Recurring Plans"]
    },
    {
      title: "Founder Community",
      description: "Connect with fellow OPC founders — share wins, get feedback, find collaborators",
      icon: Users,
      color: "from-primary-800 to-primary-900",
      stats: ["Private Network", "Real Founders", "Weekly Events"]
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveView((prev) => (prev + 1) % dashboardViews.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="bg-primary-50 rounded-3xl p-8 border border-primary-100 mt-12">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4">
          <Monitor className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Your OPC Genie Dashboard</h3>
          <p className="text-gray-500 text-lg">Everything you need to run your business solo</p>
        </div>
      </div>
      
      {/* Dashboard Views Showcase */}
      <div className="mb-8">
        {dashboardViews.map((view, index) => {
          const Icon = view.icon
          return (
            <div
              key={index}
              className={`transition-all duration-700 ${
                activeView === index ? 'opacity-100 block' : 'opacity-0 hidden'
              }`}
            >
              <div className={`bg-gradient-to-r ${view.color} rounded-2xl p-6 text-white mb-6`}>
                <div className="flex items-center mb-4">
                  <Icon className="w-8 h-8 mr-3" />
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

      {/* View Navigation Dots */}
      <div className="flex justify-center space-x-3 mb-8">
        {dashboardViews.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveView(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              activeView === index
                ? 'bg-primary-600 scale-125'
                : 'bg-primary-200 hover:bg-primary-400'
            }`}
          />
        ))}
      </div>
      
      {/* Quick Access Features */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { icon: Globe, title: "Your Website",    subtitle: "Live & Branded" },
          { icon: MessageSquare, title: "AI Genie", subtitle: "Always On" },
          { icon: FileText, title: "Offers",        subtitle: "Sell Anything" },
          { icon: Users, title: "Community",        subtitle: "Founder Network" }
        ].map((feature, index) => {
          const Icon = feature.icon
          return (
            <div key={index} className="bg-white rounded-xl p-4 border border-primary-100 text-center hover:border-primary-300 hover:shadow-sm transition-all">
              <Icon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">{feature.title}</div>
              <div className="text-gray-500 text-sm">{feature.subtitle}</div>
            </div>
          )
        })}
      </div>

      {/* Welcome Back Message */}
      <div className="bg-white rounded-xl p-6 border border-primary-100">
        <div className="flex items-center text-primary-700 mb-3">
          <Lightbulb className="w-5 h-5 mr-2" />
          <span className="font-semibold">Ready to build your business?</span>
        </div>
        <p className="text-gray-500 leading-relaxed">
          Your dashboard is ready. Sign in to manage your website, view your Genie's activity, and track your business growth.
        </p>
      </div>
    </div>
  )
}

// Updated Login Form Component with OAuth Integration
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [legacyLogin, setLegacyLogin] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    rememberMe: false
  })
  const router = useRouter()
  
  // OAuth providers with updated styling
  const socialLogins = [
    { 
      name: 'Google', 
      icon: FcGoogle, 
      color: 'hover:bg-red-50 border-gray-300 hover:border-red-300',
      provider: 'google'
    },
    { 
      name: 'LinkedIn', 
      icon: FaLinkedin, 
      color: 'hover:bg-blue-50 border-gray-300 hover:border-blue-300',
      provider: 'linkedin'
    },
    { 
      name: 'Microsoft', 
      icon: FaMicrosoft, 
      color: 'hover:bg-blue-50 border-gray-300 hover:border-blue-300',
      provider: 'microsoft'
    },
    { 
      name: 'Github', 
      icon: FaGithub, 
      color: 'hover:bg-gray-50 border-gray-300 hover:border-gray-400',
      provider: 'github'
    },
  ]

  const handleOAuthLogin = async (provider) => {
    setIsLoading(true)
    setLoadingProvider(provider)
    setError('')

    try {
      // Generate state parameter for security
      const state = generateRandomString(32)
      localStorage.setItem('oauth_state', state)
      
      // Construct OAuth URL
      const oauthUrl = await getOAuthUrl(provider, state)
      
      if (oauthUrl) {
        // Redirect to OAuth provider
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state })
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

      // Redirect: admins go to /admin, everyone else to /dashboard
      const role = data.user?.role ?? ''
      const next = new URLSearchParams(window.location.search).get('next')
      router.push(next || (role === 'admin' || role === 'super_admin' ? '/admin' : '/dashboard'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
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
      // Redirect to dashboard on successful login
      router.push('/dashboard')
    }
  }, [router])
  
  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 max-w-md w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mode === 'register' ? 'Create your account' : 'Welcome Back!'}
        </h2>
        <p className="text-gray-600">
          {mode === 'register' ? 'Start building your one-person company today' : 'Sign in to continue building your one-person company'}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-xl border border-gray-200 p-1 mb-6">
        <button
          onClick={() => { setMode('login'); setError(''); setLegacyLogin(false) }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode('register'); setError(''); setLegacyLogin(false) }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'register' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Register
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {mode === 'register' ? (
        /* ── Register Form ── */
        <form onSubmit={handleSignupSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Jane Doe"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Repeat your password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </button>
        </form>
      ) : !legacyLogin ? (
        <>
          {/* OAuth Login Options */}
          <div className="space-y-3 mb-6">
            {socialLogins.map((social, index) => {
              const IconComponent = social.icon
              const isProviderLoading = isLoading && loadingProvider === social.provider
              
              return (
                <button 
                  key={index}
                  onClick={() => handleOAuthLogin(social.provider)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 ${social.color} text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform shadow-sm hover:shadow-md`}
                >
                  {isProviderLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin mr-3" />
                  ) : (
                    <IconComponent className="w-5 h-5 mr-3" />
                  )}
                  <span>
                    {isProviderLoading ? 'Connecting...' : `Continue with ${social.name}`}
                  </span>
                </button>
              )
            })}
          </div>

          {/* OAuth Benefits */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center text-blue-800 mb-2">
              <Shield className="w-4 h-4 mr-2" />
              <span className="font-semibold text-sm">Secure OAuth Login</span>
            </div>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• No password required - use your existing accounts</li>
              <li>• Enterprise-grade security protocols</li>
              <li>• Automatic account creation on first login</li>
            </ul>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Legacy Login Option */}
          <button
            onClick={() => setLegacyLogin(true)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <Mail className="w-4 h-4 mr-2" />
            Sign in with Email & Password
          </button>
        </>
      ) : (
        <>
          {/* Legacy Email/Password Form */}
          <form onSubmit={handleLegacySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setLegacyLogin(false)}
              className="text-primary-600 hover:text-primary-700 text-sm transition-colors"
            >
              ← Back to OAuth Login
            </button>
          </div>
        </>
      )}

      {/* Admin Access Link */}
      <div className="mt-8 text-center border-t border-gray-200 pt-6">
        <p className="text-gray-600 text-sm mb-3">
          Need admin access?
        </p>
        <Link 
          href="/admin/login"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
        >
          <Lock className="w-4 h-4 mr-2" />
          Admin Login
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {/* Footer Links */}
      <div className="mt-6 text-center space-y-4">
        <div className="flex justify-center space-x-6 text-sm">
          <Link href="/terms" className="text-gray-500 hover:text-gray-700 transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-gray-500 hover:text-gray-700 transition-colors">
            Privacy Policy
          </Link>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-4 h-4 text-blue-600 mr-2" />
            <p className="text-sm font-semibold text-blue-800">Secure Login</p>
          </div>
          <p className="text-xs text-blue-600">
            Your data is protected with enterprise-grade security and encryption
          </p>
        </div>
      </div>
    </div>
  )
}

// Feature Navigation Dots
function FeatureNavigation({ activeFeature, setActiveFeature }) {
  const features = [
    'Dashboard Preview',
    'Learning Analytics', 
    'AI Code Assistant',
    'Community Access',
    'Career Progress'
  ]
  
  return (
    <div className="flex justify-center space-x-3 mt-8">
      {features.map((feature, index) => (
        <button
          key={index}
          onClick={() => setActiveFeature(index)}
          className={`w-3 h-3 rounded-full transition-all duration-200 ${
            activeFeature === index 
              ? 'bg-white scale-125' 
              : 'bg-white/30 hover:bg-white/50'
          }`}
          title={feature}
        />
      ))}
    </div>
  )
}

// Main Login Page
export default function LoginPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  
  const platformBenefits = [
    {
      icon: Brain,
      title: 'AI Business Builder',
      description: 'Your Genie builds a complete website and offer pages for your one-person business in minutes'
    },
    {
      icon: Code,
      title: 'Sales & Support Automation',
      description: 'AI handles inbound enquiries, follow-ups, and customer support around the clock'
    },
    {
      icon: BarChart3,
      title: 'Founder Analytics',
      description: 'Track revenue, leads, and visitors with a clean dashboard built for solo operators'
    },
    {
      icon: Users,
      title: 'Founder Community',
      description: 'Connect with other solo founders, share playbooks, and learn from real-world results'
    },
    {
      icon: Award,
      title: 'Offers & Payments',
      description: 'Create and sell offers with smart pricing pages, payment links, and automated follow-ups'
    },
    {
      icon: Workflow,
      title: 'Content Studio',
      description: 'AI writes your blog posts, social copy, and email sequences — branded to your voice'
    }
  ]

  const learningStats = [
    { number: "500+", label: "Active Founders", icon: Users },
    { number: "1-Day", label: "Avg. Launch Time", icon: BookOpen },
    { number: "90%", label: "Live in 24 hrs", icon: Award },
    { number: "24/7", label: "AI Genie Support", icon: MessageSquare }
  ]
  
  return (
    <div className="min-h-screen bg-white flex mt-12">
      {/* Left Side - Platform Showcase */}
      <div className="flex-1 bg-primary-50 border-r border-primary-100 p-8 lg:p-16 flex flex-col justify-center">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mr-6">
                <LogIn className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                  Welcome Back
                </h1>
                <p className="text-primary-600 text-xl lg:text-2xl mt-3 font-medium">
                  Continue building your one-person company
                </p>
              </div>
            </div>
            <p className="text-xl lg:text-2xl text-gray-500 leading-relaxed max-w-3xl">
              Your dashboard is waiting. Sign in to manage your website, view your Genie's activity, and track your business growth.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {learningStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white rounded-2xl p-6 border border-primary-100 text-center hover:border-primary-300 hover:shadow-sm transition-all duration-300">
                  <Icon className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                  <div className="text-3xl font-black text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-500 text-sm">{stat.label}</div>
                </div>
              )
            })}
          </div>
          
          {/* Interactive Dashboard Preview */}
          <DashboardPreview />
          
          {/* Platform Benefits Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {platformBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-200 hover:shadow-sm transition-all duration-300 group">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4 group-hover:bg-primary-700 transition-colors">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg">{benefit.title}</h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed">{benefit.description}</p>
                </div>
              )
            })}
          </div>

          {/* Founder Testimonials */}
          <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-200">
            <div className="flex items-center mb-6">
              <Star className="w-6 h-6 text-yellow-400 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">What Founders Say</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary-600 rounded-full mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700 font-medium">"Launched my consulting site and got clients in 48 hours"</p>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary-600 rounded-full mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700 font-medium">"The AI Genie wrote better copy than I ever could"</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary-600 rounded-full mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700 font-medium">"Replaced three tools with just OPC Genie"</p>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary-600 rounded-full mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700 font-medium">"Setup felt like talking to a very smart business partner"</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Dots */}
          <FeatureNavigation
            activeFeature={activeFeature}
            setActiveFeature={setActiveFeature}
          />
        </div>
      </div>
      
      {/* Right Side - Login Panel */}
      <div className="w-full lg:w-[28rem] xl:w-[32rem] bg-white flex items-start justify-center p-8 pt-16 overflow-y-auto border-l border-gray-100">
        <LoginForm />
      </div>
    </div>
  )
}