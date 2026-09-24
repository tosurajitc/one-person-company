'use client'

/**
 * Wallet & Funds
 * ------------------------------------------------------------------
 * THEME (matches /platform/ai-website-builder, /dashboard, /profile, referral):
 *   bottle green  #021610 / #053728 / #0a4836 / #0f6b4f
 *   light green   #a7f3c0 / #c9f2d8 / #d9f5e4 / #f2faf5
 *   orange        primary action buttons only
 *
 * Payment, verification and balance-loading logic are unchanged.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wallet,
  ArrowUpRight,
  TrendingDown,
  CreditCard,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import DashboardSidebar from '../../../components/DashboardSidebar'

// ─── Shared theme class strings ──────────────────────────────────────────────
const BTN_ORANGE = 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30'
const CARD = 'bg-white rounded-2xl border border-[#c9f2d8] shadow-sm'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const PRESET_AMOUNTS = [99, 199, 499, 999, 1999]

const formatInr = (n) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function WalletPage() {
  const { user, token } = useAuth()
  const router = useRouter()

  const [amount, setAmount] = useState('99')
  const [customAmount, setCustomAmount] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingStats, setIsFetchingStats] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Balance stats state
  const [walletBalance, setWalletBalance] = useState(0.0)
  const [walletConsumed, setWalletConsumed] = useState(0.0)
  const [userData, setUserData] = useState(null)

  // Fetch current user wallet details
  const fetchUserData = async () => {
    try {
      const authToken =
        token ||
        (typeof window !== 'undefined' &&
          (localStorage.getItem('auth_token') || localStorage.getItem('token')))
      if (!authToken) {
        setIsFetchingStats(false)
        return
      }

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUserData(data)
        setWalletBalance(data.wallet_balance || 0.0)
        setWalletConsumed(data.wallet_consumed || 0.0)
      }
    } catch (err) {
      console.error('Failed to load wallet stats:', err)
    } finally {
      setIsFetchingStats(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [token])

  const effectiveAmount = isCustom
    ? parseFloat(customAmount || '0')
    : parseFloat(amount || '0')

  const handleSelectPreset = (val) => {
    setIsCustom(false)
    setAmount(String(val))
    setErrorMsg('')
  }

  const handleCustomChange = (e) => {
    setCustomAmount(e.target.value)
    setIsCustom(true)
    setErrorMsg('')
  }

  const handleAddFund = async (e) => {
    e?.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (isNaN(effectiveAmount) || effectiveAmount < 99) {
      setErrorMsg('Minimum fund addition amount is ₹99.')
      return
    }

    const authToken =
      token ||
      (typeof window !== 'undefined' &&
        (localStorage.getItem('auth_token') || localStorage.getItem('token')))
    if (!authToken) {
      router.push('/login?redirect=/profile/wallet')
      return
    }

    setIsLoading(true)

    try {
      // 1. Create order on backend
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          gateway: 'razorpay',
          purpose: 'wallet_topup',
          amount: effectiveAmount,
        }),
      })

      const orderData = await res.json()
      if (!res.ok) {
        throw new Error(orderData.detail || 'Failed to initialize payment order.')
      }

      // 2. Load Razorpay Checkout SDK
      const sdkLoaded = await loadRazorpayScript()
      if (!sdkLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.')
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: orderData.razorpay_key_id,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        name: 'OPC Genie',
        description: `Wallet Recharge of ₹${orderData.amount}`,
        order_id: orderData.order_id,
        prefill: {
          name: userData?.full_name || user?.full_name || '',
          email: userData?.email || user?.email || '',
        },
        theme: {
          color: '#0a4836', // bottle green to match the platform theme
        },
        handler: async function (response) {
          try {
            // 4. Verify payment with backend
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                gateway_order_id: response.razorpay_order_id,
                gateway_payment_id: response.razorpay_payment_id,
                gateway_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) {
              throw new Error(verifyData.detail || 'Payment verification failed.')
            }

            setSuccessMsg(`₹${effectiveAmount.toFixed(2)} added successfully to your wallet!`)
            await fetchUserData()
          } catch (verErr) {
            setErrorMsg(verErr.message || 'Payment verification error.')
          } finally {
            setIsLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        setErrorMsg(resp.error?.description || 'Payment transaction failed.')
        setIsLoading(false)
      })
      rzp.open()
    } catch (err) {
      setErrorMsg(err.message || 'Could not initiate payment.')
      setIsLoading(false)
    }
  }

  const payDisabled = isLoading || isNaN(effectiveAmount) || effectiveAmount < 99

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f2faf5] to-white pt-16 lg:pt-20">

      {/* ── Full-width hero band ── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836]">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="relative w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-10 lg:py-12">
          <div className="inline-flex items-center px-4 py-1.5 bg-[#a7f3c0]/10 border border-[#a7f3c0]/30 rounded-full text-xs font-medium mb-3 text-[#a7f3c0]">
            <Wallet className="w-3.5 h-3.5 mr-1.5" />
            Prepaid balance
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">Wallet &amp; Funds</h1>
          <p className="text-sm md:text-base text-emerald-50/80 mt-2 max-w-2xl leading-relaxed">
            Recharge your balance, and track what your AI tools have used.
          </p>
        </div>
      </section>

      {/* ── Full-width workspace ── */}
      <main className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">

          {/* Left navigation */}
          <DashboardSidebar
            activeTab="wallet"
            hasSite={!!userData?.site?.subdomain}
            userSiteSlug={userData?.site?.subdomain}
            user={userData || user}
          />

          {/* Right content */}
          <div className="lg:col-span-9 min-w-0 space-y-6">

            {/* Balance cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available balance: the one dark, emphasised card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836] p-6 text-white shadow-sm">
                <div className="pointer-events-none absolute -top-16 -right-12 w-56 h-56 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
                <div className="relative flex items-center justify-between mb-4">
                  <div className="w-11 h-11 bg-[#a7f3c0]/15 border border-[#a7f3c0]/30 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-[#a7f3c0]" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#a7f3c0]/10 border border-[#a7f3c0]/30 text-[#a7f3c0]">
                    Active balance
                  </span>
                </div>
                <div className="relative">
                  <p className="text-sm font-medium text-emerald-50/80">Available balance</p>
                  <div className="text-3xl font-black mt-1 flex items-baseline">
                    <span className="text-2xl font-bold mr-1">₹</span>
                    {isFetchingStats ? (
                      <span className="animate-pulse text-emerald-200/50">…</span>
                    ) : (
                      formatInr(walletBalance)
                    )}
                  </div>
                  <p className="text-xs text-emerald-50/70 mt-2 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 text-[#a7f3c0] mr-1.5 shrink-0" />
                    Instantly usable across all AI tools and workspace features
                  </p>
                </div>
              </div>

              {/* Consumed */}
              <div className={`${CARD} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 bg-[#d9f5e4] rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-[#0a4836]" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f2faf5] border border-[#c9f2d8] text-[#0a4836]">
                    Lifetime usage
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500">Consumed fund</p>
                <div className="text-3xl font-black text-[#053728] mt-1 flex items-baseline">
                  <span className="text-2xl font-bold mr-1">₹</span>
                  {isFetchingStats ? (
                    <span className="animate-pulse text-gray-300">…</span>
                  ) : (
                    formatInr(walletConsumed)
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Total funds consumed for services, AI drafts, and automations
                </p>
              </div>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm flex items-start gap-3" role="alert">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Payment did not go through</p>
                  <p className="text-red-600 text-xs mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="bg-[#f2faf5] border border-[#a7f3c0] text-[#053728] px-4 py-3.5 rounded-xl text-sm flex items-start gap-3" role="status">
                <CheckCircle className="w-5 h-5 text-[#0f6b4f] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Payment successful</p>
                  <p className="text-[#0a4836] text-xs mt-0.5">{successMsg}</p>
                </div>
              </div>
            )}

            {/* Add funds */}
            <div className={`${CARD} p-6 sm:p-8 space-y-6`}>
              <div className="pb-4 border-b border-[#d9f5e4]">
                <h3 className="text-lg font-bold text-[#06352a] flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#d9f5e4] flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-[#0a4836]" />
                  </span>
                  Add funds to wallet
                </h3>
                <p className="text-sm text-gray-500 mt-1.5">
                  Choose a preset amount or enter your own. Minimum recharge is <strong className="text-[#06352a]">₹99</strong>.
                </p>
              </div>

              {/* Presets */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-3">Select a quick amount</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" role="radiogroup" aria-label="Quick amounts">
                  {PRESET_AMOUNTS.map((val) => {
                    const isSelected = !isCustom && parseFloat(amount) === val
                    return (
                      <button
                        key={val}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectPreset(val)}
                        className={`py-3 px-4 rounded-xl text-center font-bold text-sm transition-colors border focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] ${
                          isSelected
                            ? 'bg-[#0a4836] text-white border-[#0a4836] shadow-sm'
                            : 'bg-white text-gray-800 border-[#c9f2d8] hover:border-[#0f6b4f] hover:bg-[#f2faf5]'
                        }`}
                      >
                        ₹{val}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <label htmlFor="custom-amount" className="block text-xs font-semibold text-gray-700 mb-2">
                  Or enter a custom amount (minimum ₹99)
                </label>
                <div className="relative max-w-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#0a4836] font-bold text-lg">
                    ₹
                  </div>
                  <input
                    id="custom-amount"
                    type="number"
                    min="99"
                    step="1"
                    placeholder="e.g. 250, 500, 5000"
                    value={customAmount}
                    onChange={handleCustomChange}
                    className={`block w-full rounded-xl pl-10 pr-4 py-3 text-base text-gray-900 placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] transition-colors ${
                      isCustom
                        ? 'border-[#0a4836] ring-1 ring-[#0a4836] bg-[#f2faf5] font-semibold'
                        : 'border-[#c9f2d8] bg-white'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Any amount of ₹99 or more works.</p>
              </div>

              {/* Payment summary */}
              <div className="bg-[#f2faf5] rounded-xl p-5 border border-[#c9f2d8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Amount to pay</p>
                  <p className="text-2xl font-black text-[#053728] mt-0.5">
                    ₹{isNaN(effectiveAmount) || effectiveAmount <= 0 ? '0.00' : formatInr(effectiveAmount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">No hidden taxes • Instant 1:1 wallet credit</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddFund}
                  disabled={payDisabled}
                  className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 ${BTN_ORANGE} rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Connecting to Razorpay…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay with Razorpay
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* How the wallet works */}
            <div className={`${CARD} p-6`}>
              <h4 className="text-base font-bold text-[#06352a] mb-4 pb-3 border-b border-[#d9f5e4]">
                How your OPC Genie wallet works
              </h4>
              <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Add any amount', text: 'Recharge from ₹99 with UPI, net banking, or debit and credit cards via Razorpay.' },
                  { title: 'Instant activation', text: 'Your balance updates as soon as the Razorpay checkout completes.' },
                  { title: 'Track and spend', text: 'See consumed funds and your remaining balance on this page anytime.' },
                ].map((s, i) => (
                  <li key={s.title} className="p-4 rounded-xl bg-[#f2faf5] border border-[#c9f2d8]">
                    <div className="w-7 h-7 rounded-full bg-[#0a4836] text-white flex items-center justify-center font-bold text-xs mb-3">
                      {i + 1}
                    </div>
                    <h5 className="font-semibold text-[#06352a] text-sm mb-1">{s.title}</h5>
                    <p className="text-xs text-gray-600 leading-relaxed">{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}