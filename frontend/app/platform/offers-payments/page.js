'use client'

/**
 * Referral Program
 * ------------------------------------------------------------------
 * THEME (matches /platform/ai-website-builder, /dashboard, /profile):
 *   bottle green  #021610 / #053728 / #0a4836 / #0f6b4f
 *   light green   #a7f3c0 / #c9f2d8 / #d9f5e4 / #f2faf5
 *   orange        primary action buttons only
 *
 * Data loading and behaviour are unchanged from the previous version.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Copy, CheckCircle, Users, Gift, TrendingUp, Share2, AlertCircle, Loader2 } from 'lucide-react'
import DashboardSidebar from '../../../components/DashboardSidebar'

const API_BASE = '/api'

// ─── Shared theme class strings ──────────────────────────────────────────────
const BTN_ORANGE = 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30'
const BTN_GREEN = 'bg-[#0a4836] hover:bg-[#053728] text-white'
const CARD = 'bg-white rounded-2xl border border-[#c9f2d8] shadow-sm'
const INPUT = 'w-full px-3.5 py-2.5 bg-white border border-[#c9f2d8] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] focus:border-[#0f6b4f]'

export default function ReferralPage() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [applyCode, setApplyCode] = useState('')
  const [applyStatus, setApplyStatus] = useState(null) // { type: 'success'|'error', message }
  const [applying, setApplying] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const authToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/referral/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) throw new Error('Failed to load referral stats')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const copyLink = async () => {
    if (!stats?.referral_link) return
    await navigator.clipboard.writeText(stats.referral_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleApplyCode = async (e) => {
    e.preventDefault()
    if (!applyCode.trim()) return
    setApplying(true)
    setApplyStatus(null)
    try {
      const authToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/referral/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referral_code: applyCode.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (res.ok) {
        setApplyStatus({ type: 'success', message: 'Referral code applied! Thank you.' })
        setApplyCode('')
        fetchStats()
      } else {
        setApplyStatus({ type: 'error', message: data.detail || 'Could not apply code.' })
      }
    } catch {
      setApplyStatus({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f2faf5] to-white pt-20 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#0a4836] text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading your referral details…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f2faf5] to-white pt-20 flex items-center justify-center px-4">
        <div className={`${CARD} p-8 text-center max-w-md`} role="alert">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-[#06352a] font-semibold mb-1">Could not load referral stats</p>
          <p className="text-gray-500 text-sm mb-5">{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            className={`inline-flex items-center px-6 py-2.5 ${BTN_ORANGE} rounded-xl text-sm font-bold`}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const referralLink = stats?.referral_link || ''
  const referredCount = stats?.referred_count ?? 0
  const commissionPct = stats?.commission_percent ?? 20

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f2faf5] to-white pt-16 lg:pt-20">

      {/* ── Full-width hero band ── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836]">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="relative w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-10 lg:py-12">
          <div className="inline-flex items-center px-4 py-1.5 bg-[#a7f3c0]/10 border border-[#a7f3c0]/30 rounded-full text-xs font-medium mb-3 text-[#a7f3c0]">
            <Gift className="w-3.5 h-3.5 mr-1.5" />
            Lifetime earnings
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Earn {commissionPct}% commission, for life
          </h1>
          <p className="text-sm md:text-base text-emerald-50/80 mt-2 max-w-2xl leading-relaxed">
            Every time someone you refer becomes a paid subscriber, you earn {commissionPct}% of their monthly payment,
            every month, for as long as they stay on the platform.
          </p>
        </div>
      </section>

      {/* ── Full-width workspace ── */}
      <main className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">

          {/* Left navigation */}
          <DashboardSidebar
            activeTab="referral"
            hasSite={!!user?.site?.subdomain}
            userSiteSlug={user?.site?.subdomain}
            user={user}
          />

          {/* Right content */}
          <div className="lg:col-span-9 min-w-0 space-y-6">

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Users, label: 'Referred users', value: referredCount },
                { icon: TrendingUp, label: 'Commission rate', value: `${commissionPct}%` },
                { icon: Gift, label: 'Earnings model', value: 'Lifetime' },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={i} className={`${CARD} p-5`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-2xl font-black text-[#053728]">{value}</p>
                    <span className="w-8 h-8 rounded-full bg-[#d9f5e4] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#0a4836]" />
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#06352a]">{label}</p>
                </div>
              ))}
            </div>

            {/* Referral link card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836] p-6 text-white shadow-sm">
              <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="text-sm font-semibold">Your unique referral link</p>
                  {stats?.referral_code && (
                    <span className="text-xs text-[#a7f3c0] font-mono font-bold bg-[#a7f3c0]/10 border border-[#a7f3c0]/30 px-2.5 py-0.5 rounded-full">
                      {stats.referral_code}
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    readOnly
                    aria-label="Your referral link"
                    value={referralLink}
                    className="flex-1 min-w-0 bg-white/95 border border-[#a7f3c0]/40 rounded-xl px-3.5 py-2.5 text-sm text-[#06352a] font-mono focus:outline-none focus:ring-2 focus:ring-[#a7f3c0]"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className={`inline-flex items-center justify-center gap-1.5 px-6 py-2.5 ${BTN_ORANGE} rounded-xl text-sm font-bold shrink-0`}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
                <p className="text-xs text-emerald-50/80 mt-3 leading-relaxed">
                  Share this link anywhere: social media, email, WhatsApp. When someone signs up through it, they are automatically linked to your account.
                </p>
              </div>
            </div>

            {/* How it works + Terms */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <div className={`${CARD} p-6`}>
                <h2 className="text-base font-bold text-[#06352a] mb-4 pb-3 border-b border-[#d9f5e4]">How it works</h2>
                <ol className="space-y-4">
                  {[
                    'Share your referral link with anyone who might benefit from OPC Genie.',
                    'They sign up and subscribe to any paid plan using your link.',
                    `You earn ${commissionPct}% of their subscription fee every billing cycle, for as long as they remain a paid subscriber.`,
                    'Payouts are processed monthly to your registered payment account.',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#0a4836] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-[#f2faf5] rounded-2xl border border-[#c9f2d8] p-6">
                <h3 className="text-base font-bold text-[#06352a] mb-3 pb-3 border-b border-[#d9f5e4]">Programme terms</h3>
                <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside leading-relaxed">
                  <li>Commission applies to paid subscriptions only. Free-tier referrals do not earn commission.</li>
                  <li>Commission stops if the referred user cancels or downgrades to a free plan.</li>
                  <li>Self-referrals are not permitted.</li>
                  <li>OPC Genie reserves the right to adjust commission rates with 30 days&apos; notice.</li>
                </ul>
              </div>
            </div>

            {/* Apply referral code — only if user hasn't been referred yet */}
            {!user?.referred_by_code && !stats?.referred_by_code_applied && (
              <div className="bg-white border border-dashed border-[#0f6b4f]/50 rounded-2xl p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-7 h-7 rounded-full bg-[#d9f5e4] flex items-center justify-center">
                    <Share2 className="w-3.5 h-3.5 text-[#0a4836]" />
                  </span>
                  <p className="text-sm font-semibold text-[#06352a]">Were you referred by someone?</p>
                </div>
                <form onSubmit={handleApplyCode} className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    aria-label="Referral code"
                    value={applyCode}
                    onChange={e => setApplyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. REF-A1B2C3D4"
                    maxLength={12}
                    className={`${INPUT} flex-1 min-w-0 font-mono`}
                  />
                  <button
                    type="submit"
                    disabled={applying || !applyCode.trim()}
                    className={`inline-flex items-center justify-center px-6 py-2.5 ${BTN_GREEN} rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
                  >
                    {applying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying…</> : 'Apply code'}
                  </button>
                </form>
                {applyStatus && (
                  <p
                    role="status"
                    className={`mt-3 text-xs font-medium flex items-center gap-1.5 ${applyStatus.type === 'success' ? 'text-[#0f6b4f]' : 'text-red-600'}`}
                  >
                    {applyStatus.type === 'success'
                      ? <CheckCircle className="w-3.5 h-3.5" />
                      : <AlertCircle className="w-3.5 h-3.5" />}
                    {applyStatus.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}