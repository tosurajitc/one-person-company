'use client'

/**
 * Profile Settings
 * ------------------------------------------------------------------
 * THEME (matches /platform/ai-website-builder and /dashboard):
 *   bottle green  #021610 / #053728 / #0a4836 / #0f6b4f
 *   light green   #a7f3c0 / #c9f2d8 / #d9f5e4 / #f2faf5
 *   orange        primary action buttons only
 * LAYOUT: full-width hero band + sidebar / content grid.
 *
 * Data loading and state are unchanged from the previous version.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User, Camera, Save, Shield, Bell, Trash2,
  Key, CreditCard, Upload, RefreshCw,
  CheckCircle, Lock, Wallet, Smartphone, Monitor, Sparkles,
} from 'lucide-react'
import DashboardSidebar from '../../components/DashboardSidebar'

// ─── Shared theme class strings ──────────────────────────────────────────────
const BTN_ORANGE = 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30'
const BTN_GREEN = 'bg-[#0a4836] hover:bg-[#053728] text-white'
const CARD = 'bg-white rounded-2xl border border-[#c9f2d8] shadow-sm p-6'
const CARD_TITLE = 'text-base font-bold text-[#06352a] mb-4 pb-3 border-b border-[#d9f5e4]'
const LABEL = 'block text-xs font-semibold text-gray-700 mb-1.5'
const INPUT = 'w-full px-3.5 py-2.5 bg-white border border-[#c9f2d8] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] focus:border-[#0f6b4f]'
const TOGGLE = "w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#0f6b4f] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0a4836]"

const initialsOf = (first, last, email) => {
  const s = `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()
  return s || (email || '?')[0].toUpperCase()
}

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [user, setUser] = useState(null)
  const [hasSite, setHasSite] = useState(false)
  const [userSiteSlug, setUserSiteSlug] = useState(null)

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: 'Solo founder building my one-person company with OPC Genie.',
    website: '',
    company: '',
    position: 'Founder',
  })

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    newLeads: true,
    weeklyDigest: false,
    promotions: true,
    securityAlerts: true,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showProgress: true,
    allowMessages: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    Promise.all([
      fetch('/api/auth/me', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/settings/mine', { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([me, settings]) => {
      if (me) {
        setUser(me)
        setProfile(prev => ({
          ...prev,
          firstName: me.name?.split(' ')[0] || me.full_name?.split(' ')[0] || '',
          lastName: me.name?.split(' ').slice(1).join(' ') || me.full_name?.split(' ').slice(1).join(' ') || '',
          email: me.email || '',
        }))
      }
      const slug = settings?.site?.subdomain || null
      if (slug) {
        setHasSite(true)
        setUserSiteSlug(slug)
      }
    }).catch(() => {})
  }, [])

  const tabs = [
    { id: 'general', name: 'General', icon: User },
    { id: 'wallet', name: 'Wallet & Funds', icon: Wallet, href: '/profile/wallet' },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ]

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    }, 1000)
  }

  const initials = initialsOf(profile.firstName, profile.lastName, profile.email)
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email || 'Your profile'

  // ── Reusable pieces ────────────────────────────────────────────────────────
  const Field = ({ label, className = '', children }) => (
    <div className={className}>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  )

  const ToggleRow = ({ title, hint, checked, onChange }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#d9f5e4] last:border-0">
      <div>
        <h4 className="text-sm font-semibold text-[#06352a] capitalize">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className={TOGGLE} />
      </label>
    </div>
  )

  const renderGeneral = () => (
    <div className="space-y-6">
      {/* Profile picture */}
      <div className={CARD}>
        <h3 className={CARD_TITLE}>Profile picture</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-[#053728] to-[#0f6b4f] rounded-full flex items-center justify-center ring-4 ring-[#d9f5e4]">
              <span className="text-white font-bold text-2xl">{initials}</span>
            </div>
            <button
              type="button"
              aria-label="Change profile picture"
              className={`absolute bottom-0 right-0 w-8 h-8 ${BTN_ORANGE} rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-400`}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#06352a]">Upload a new picture</h4>
            <p className="text-gray-500 text-xs mb-3">JPG, PNG or GIF. Max size 5 MB.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg border border-[#0a4836] bg-white text-[#0a4836] hover:bg-[#f2faf5] text-xs font-semibold transition-colors">
                <Upload className="w-3.5 h-3.5 mr-2" />Upload
              </button>
              <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors">
                <Trash2 className="w-3.5 h-3.5 mr-2" />Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal information */}
      <div className={CARD}>
        <h3 className={CARD_TITLE}>Personal information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="First name">
            <input type="text" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} className={INPUT} />
          </Field>
          <Field label="Last name">
            <input type="text" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} className={INPUT} />
          </Field>
          <Field label="Email">
            <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className={INPUT} />
          </Field>
          <Field label="Phone">
            <input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className={INPUT} />
          </Field>
          <Field label="Location" className="md:col-span-2">
            <input type="text" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} className={INPUT} />
          </Field>
          <Field label="Bio" className="md:col-span-2">
            <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3} className={`${INPUT} resize-y`} />
          </Field>
        </div>
      </div>

      {/* Professional information */}
      <div className={CARD}>
        <h3 className={CARD_TITLE}>Professional information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Company">
            <input type="text" value={profile.company} onChange={e => setProfile({ ...profile, company: e.target.value })} className={INPUT} />
          </Field>
          <Field label="Position">
            <input type="text" value={profile.position} onChange={e => setProfile({ ...profile, position: e.target.value })} className={INPUT} />
          </Field>
          <Field label="Website" className="md:col-span-2">
            <input type="url" value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} className={INPUT} />
          </Field>
        </div>
      </div>
    </div>
  )

  const renderNotifications = () => (
    <div className={CARD}>
      <h3 className={CARD_TITLE}>Email notifications</h3>
      {Object.entries(notifications).map(([key, value]) => (
        <ToggleRow
          key={key}
          title={key.replace(/([A-Z])/g, ' $1')}
          hint="Get notified about important updates"
          checked={value}
          onChange={e => setNotifications({ ...notifications, [key]: e.target.checked })}
        />
      ))}
    </div>
  )

  const renderPrivacy = () => (
    <div className={CARD}>
      <h3 className={CARD_TITLE}>Privacy settings</h3>
      <div className="space-y-2">
        <Field label="Profile visibility" className="mb-3">
          <select
            value={privacy.profileVisibility}
            onChange={e => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
            className={INPUT}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="friends">Friends only</option>
          </select>
        </Field>
        {Object.entries(privacy).slice(1).map(([key, value]) => (
          <ToggleRow
            key={key}
            title={key.replace(/([A-Z])/g, ' $1')}
            hint="Control who can see this information"
            checked={value}
            onChange={e => setPrivacy({ ...privacy, [key]: e.target.checked })}
          />
        ))}
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className={CARD}>
        <h3 className={CARD_TITLE}>Password &amp; security</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" className="flex items-center justify-center px-4 py-3 rounded-xl border border-[#0a4836] bg-white text-[#0a4836] hover:bg-[#f2faf5] text-sm font-semibold transition-colors">
            <Key className="w-4 h-4 mr-2" />Change password
          </button>
          <button type="button" className="flex items-center justify-center px-4 py-3 rounded-xl border border-[#a7f3c0] bg-[#f2faf5] text-[#053728] hover:bg-[#d9f5e4] text-sm font-semibold transition-colors">
            <Shield className="w-4 h-4 mr-2" />Enable two-factor authentication
          </button>
        </div>
      </div>

      <div className={CARD}>
        <h3 className={CARD_TITLE}>Active sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-[#f2faf5] rounded-xl border border-[#c9f2d8]">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-[#0f6b4f]" />
              <div>
                <p className="text-sm font-semibold text-[#06352a]">Current session</p>
                <p className="text-gray-500 text-xs">Chrome on macOS • San Francisco, CA</p>
              </div>
            </div>
            <span className="bg-[#d9f5e4] text-[#053728] px-2.5 py-0.5 rounded-full text-[11px] font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#c9f2d8]">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-[#06352a]">Mobile app</p>
                <p className="text-gray-500 text-xs">iOS app • 2 days ago</p>
              </div>
            </div>
            <button type="button" className="text-red-500 hover:text-red-600 text-xs font-semibold">Revoke</button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBilling = () => (
    <div className="space-y-6">
      <div className={CARD}>
        <h3 className={CARD_TITLE}>Current plan</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836] rounded-xl text-white">
          <div>
            <h4 className="font-bold">Premium plan</h4>
            <p className="text-[#a7f3c0] text-xs mt-0.5">$29/month • Renews on Feb 15, 2025</p>
          </div>
          <button type="button" className={`px-5 py-2 ${BTN_ORANGE} rounded-lg text-xs font-semibold`}>
            Manage plan
          </button>
        </div>
      </div>

      <div className={CARD}>
        <h3 className={CARD_TITLE}>Payment method</h3>
        <div className="flex items-center justify-between p-3.5 bg-[#f2faf5] rounded-xl border border-[#c9f2d8]">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#0f6b4f]" />
            <div>
              <p className="text-sm font-semibold text-[#06352a]">•••• •••• •••• 4242</p>
              <p className="text-gray-500 text-xs">Expires 12/27</p>
            </div>
          </div>
          <button type="button" className="text-[#0a4836] hover:text-[#053728] text-xs font-semibold underline-offset-2 hover:underline">Update</button>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications': return renderNotifications()
      case 'privacy': return renderPrivacy()
      case 'security': return renderSecurity()
      case 'billing': return renderBilling()
      default: return renderGeneral()
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f2faf5] to-white pt-16 lg:pt-20">

      {/* ── Full-width hero band ── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836]">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="relative w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-10 lg:py-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#a7f3c0]/15 border border-[#a7f3c0]/30 flex items-center justify-center shrink-0">
              <span className="text-[#a7f3c0] font-bold text-lg">{initials}</span>
            </div>
            <div>
              <div className="inline-flex items-center px-3 py-1 bg-[#a7f3c0]/10 border border-[#a7f3c0]/30 rounded-full text-xs font-medium mb-2 text-[#a7f3c0]">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Profile settings
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{displayName}</h1>
              <p className="text-sm text-emerald-50/80 mt-1">Manage your account information and preferences.</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#a7f3c0]/30 bg-white/5 text-emerald-50 hover:bg-white/10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#a7f3c0]"
          >
            ← Back to dashboard
          </Link>
        </div>
      </section>

      {/* ── Full-width workspace ── */}
      <main className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">

          {/* Left navigation */}
          <DashboardSidebar
            activeTab="profile"
            hasSite={hasSite}
            userSiteSlug={userSiteSlug}
            user={user}
          />

          {/* Right content */}
          <div className="lg:col-span-9 min-w-0 space-y-6">

            {/* Sub-tabs */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-[#d9f5e4]" role="tablist">
              {tabs.map(tab => {
                const Icon = tab.icon
                const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f6b4f]'
                if (tab.href) {
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      className={`${base} bg-white border border-[#c9f2d8] text-gray-700 hover:border-[#0f6b4f] hover:bg-[#f2faf5] hover:text-[#0a4836]`}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#0f6b4f]" />
                      {tab.name}
                    </Link>
                  )
                }
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${base} ${
                      active
                        ? 'bg-[#0a4836] text-white shadow-sm border border-[#0a4836]'
                        : 'bg-white border border-[#c9f2d8] text-gray-700 hover:border-[#0f6b4f] hover:bg-[#f2faf5] hover:text-[#0a4836]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.name}
                  </button>
                )
              })}
            </div>

            {renderTabContent()}

            {/* Save bar */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-[#d9f5e4]">
              <button
                type="button"
                className="px-6 py-3 rounded-xl text-sm font-medium border border-[#0a4836] text-[#0a4836] bg-white hover:bg-[#f2faf5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className={`inline-flex items-center justify-center px-8 py-3 ${isSaved ? BTN_GREEN : BTN_ORANGE} rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none`}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : isSaved ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Saving…' : isSaved ? 'Saved!' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}