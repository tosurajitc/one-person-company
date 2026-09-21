'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Copy, CheckCircle, Users, Gift, TrendingUp, Share2, AlertCircle } from 'lucide-react'
import DashboardSidebar from '../../../components/DashboardSidebar'

const API_BASE = '/api'

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
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const referralLink = stats?.referral_link || ''
  const referredCount = stats?.referred_count ?? 0
  const commissionPct = stats?.commission_percent ?? 20

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900">Referral Program</h1>
          <p className="text-gray-500 text-sm mt-0.5">Earn 20% lifetime commissions by referring solo founders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Left Dashboard Menu */}
          <DashboardSidebar
            activeTab="referral"
            hasSite={!!user?.site?.subdomain}
            userSiteSlug={user?.site?.subdomain}
            user={user}
          />

          {/* Right Main Content */}
          <div className="lg:col-span-9 space-y-8">
            {/* Header Hero */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
              <div className="inline-flex items-center px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300 mb-3">
                <Gift className="w-3.5 h-3.5 mr-1.5" />
                Lifetime Earnings
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">
                Earn {commissionPct}% commission — for life
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                Every time someone you refer becomes a paid subscriber, you earn {commissionPct}% of their monthly payment every month, for as long as they remain on the platform.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Users, label: 'Referred users', value: referredCount },
                { icon: TrendingUp, label: 'Commission rate', value: `${commissionPct}%` },
                { icon: Gift, label: 'Earnings model', value: 'Lifetime' },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-center">
                  <Icon className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-black text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Referral link card */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">Your unique referral link</p>
                <span className="text-xs text-indigo-700 font-bold bg-indigo-100 px-2.5 py-0.5 rounded-full">
                  {stats?.referral_code}
                </span>
              </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 min-w-0 bg-white border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-mono focus:outline-none"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-3">
            Share this link anywhere — social media, email, WhatsApp. When someone signs up through it, they're automatically linked to your account.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h2 className="text-base font-bold text-gray-900 mb-4">How it works</h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your referral link with anyone who might benefit from OPC Genie.' },
              { step: '2', text: 'They sign up and subscribe to any paid plan using your link.' },
              { step: '3', text: `You earn ${commissionPct}% of their subscription fee every billing cycle — forever, as long as they remain a paid subscriber.` },
              { step: '4', text: 'Payouts are processed monthly to your registered payment account.' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step}
                </span>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terms callout */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-10">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Programme terms</h3>
          <ul className="text-xs text-gray-500 space-y-1.5 list-disc list-inside">
            <li>Commission applies to paid subscriptions only — free-tier referrals do not earn commission.</li>
            <li>Commission stops if the referred user cancels or downgrades to a free plan.</li>
            <li>Self-referrals are not permitted.</li>
            <li>OPC Genie reserves the right to adjust commission rates with 30 days' notice.</li>
          </ul>
        </div>

        {/* Apply referral code section — only shown if user hasn't been referred yet */}
        {!user?.referred_by_code && !stats?.referred_by_code_applied && (
          <div className="border border-dashed border-gray-300 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">Were you referred by someone?</p>
            </div>
            <form onSubmit={handleApplyCode} className="flex items-center gap-2">
              <input
                value={applyCode}
                onChange={e => setApplyCode(e.target.value.toUpperCase())}
                placeholder="e.g. REF-A1B2C3D4"
                maxLength={12}
                className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={applying || !applyCode.trim()}
                className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
              >
                {applying ? 'Applying…' : 'Apply'}
              </button>
            </form>
            {applyStatus && (
              <p className={`mt-2 text-xs font-medium ${applyStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {applyStatus.message}
              </p>
            )}
          </div>
        )}

          </div>
        </div>
      </div>
    </div>
  )
}
