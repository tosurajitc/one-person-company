'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  ShieldCheck,
  History,
  Zap,
  IndianRupee,
  Lock,
  ChevronRight,
  User,
  Bell,
  Shield,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import DashboardSidebar from '../../../components/DashboardSidebar'

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
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
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
    const val = e.target.value
    setCustomAmount(val)
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
          color: '#3b82f6',
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

            setSuccessMsg(
              `₹${effectiveAmount.toFixed(2)} added successfully to your wallet!`
            )
            // Reload user data / balances
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

  const profileName = userData?.full_name || user?.full_name || 'Founder'
  const initials = profileName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'OP'

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900">Wallet & Funds</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your prepaid balance, recharge funds, and track AI usage</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Left Dashboard Menu */}
          <DashboardSidebar
            activeTab="wallet"
            hasSite={!!userData?.site?.subdomain}
            userSiteSlug={userData?.site?.subdomain}
            user={userData || user}
          />

          {/* Right Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Balance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available Balance Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-10 -mt-10 pointer-events-none" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Balance
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium text-gray-500">Available Balance</p>
                  <div className="text-3xl font-black text-gray-900 mt-1 flex items-baseline">
                    <span className="text-2xl font-bold mr-1">₹</span>
                    {isFetchingStats ? (
                      <span className="animate-pulse text-gray-300">...</span>
                    ) : (
                      walletBalance.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary-500 mr-1" />
                    Instantly usable across all AI tools and workspace features
                  </p>
                </div>
              </div>

              {/* Consumed Fund Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-10 -mt-10 pointer-events-none" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    Lifetime Usage
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium text-gray-500">Consumed Fund</p>
                  <div className="text-3xl font-black text-gray-900 mt-1 flex items-baseline">
                    <span className="text-2xl font-bold mr-1">₹</span>
                    {isFetchingStats ? (
                      <span className="animate-pulse text-gray-300">...</span>
                    ) : (
                      walletConsumed.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Total funds consumed for services, AI drafts, and automations
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Transaction Error</p>
                  <p className="text-red-600 text-xs mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-xl text-sm flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Payment Successful!</p>
                  <p className="text-emerald-700 text-xs mt-0.5">{successMsg}</p>
                </div>
              </div>
            )}

            {/* Add Fund / Top Up Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <ArrowUpRight className="w-5 h-5 mr-2 text-primary-600" />
                  Add Funds to Wallet
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose a preset amount or enter whatever amount you want. Minimum recharge is <strong>₹99/-</strong>.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                  Select Quick Amount
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {PRESET_AMOUNTS.map((val) => {
                    const isSelected = !isCustom && parseFloat(amount) === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectPreset(val)}
                        className={`py-3 px-4 rounded-xl text-center font-bold text-sm transition-all border ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20 ring-2 ring-primary-500/30'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                        }`}
                      >
                        ₹{val}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Amount Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Or Enter Custom Amount (Minimum ₹99)
                </label>
                <div className="relative rounded-xl shadow-sm max-w-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-bold text-lg">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="99"
                    step="1"
                    placeholder="Enter amount (e.g. 250, 500, 5000)"
                    value={customAmount}
                    onChange={handleCustomChange}
                    className={`block w-full rounded-xl pl-10 pr-4 py-3 text-base text-gray-900 placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                      isCustom
                        ? 'border-primary-500 ring-2 ring-primary-500/20 bg-blue-50/20 font-semibold'
                        : 'border-gray-300 bg-white'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  You can enter any amount greater than or equal to ₹99/-.
                </p>
              </div>

              {/* Payment Summary Box */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    Amount to Pay
                  </p>
                  <p className="text-2xl font-black text-gray-900 mt-0.5">
                    ₹
                    {isNaN(effectiveAmount) || effectiveAmount <= 0
                      ? '0.00'
                      : effectiveAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    No hidden taxes • Instant 1:1 wallet credit
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddFund}
                  disabled={isLoading || isNaN(effectiveAmount) || effectiveAmount < 99}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Connecting Razorpay...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Proceed to Pay with Razorpay
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* How Wallet Works Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h4 className="text-base font-bold text-gray-900 mb-4">
                How your OPC Genie Wallet works
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">
                    1
                  </div>
                  <h5 className="font-semibold text-gray-900 text-sm mb-1">Add Any Fund</h5>
                  <p className="text-xs text-gray-600">
                    Recharge starting from ₹99 with UPI, NetBanking, Debit/Credit cards via Razorpay.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3">
                    2
                  </div>
                  <h5 className="font-semibold text-gray-900 text-sm mb-1">Instant Activation</h5>
                  <p className="text-xs text-gray-600">
                    Your balance is updated in real-time as soon as the Razorpay checkout completes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm mb-3">
                    3
                  </div>
                  <h5 className="font-semibold text-gray-900 text-sm mb-1">Track & Spend</h5>
                  <p className="text-xs text-gray-600">
                    Monitor consumed funds and remaining balance directly on this dashboard anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
