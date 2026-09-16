'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Users, CheckCircle, ShoppingCart, AlertCircle,
  Loader2, User, Lock, Tag, MessageSquare, Calendar,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Razorpay loader (reused from the offer landing page)
// ---------------------------------------------------------------------------
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ---------------------------------------------------------------------------
// Token helper
// ---------------------------------------------------------------------------
function getToken() {
  return (
    document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1] ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token')
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CommunityLandingPage() {
  const params = useParams()
  const username = params?.username
  const slug = params?.slug

  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Join state
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [joinError, setJoinError] = useState(null)

  // ---- Fetch community data -----------------------------------------------
  useEffect(() => {
    if (!username || !slug) return
    fetch(`/api/public/${username}/community/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.detail || 'Community not found')
        }
        return res.json()
      })
      .then((data) => {
        setCommunity(data)
        if (data.is_member) setJoined(true)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [username, slug])

  // ---- Join flow -----------------------------------------------------------
  const handleJoin = useCallback(async () => {
    if (!community) return
    setJoining(true)
    setJoinError(null)

    const token = getToken()
    if (!token) {
      window.location.href = `/login?next=/${username}/community/${slug}`
      return
    }

    try {
      const res = await fetch(`/api/public/${username}/community/${slug}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Could not join community')
      }

      if (data.status === 'joined' || data.status === 'already_member') {
        setJoined(true)
        return
      }

      // Paid community — open Razorpay with the community offer
      if (data.status === 'payment_required') {
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            purpose: 'offer',
            offer_id: data.offer_id,
            gateway: 'razorpay',
          }),
        })
        if (!orderRes.ok) {
          const body = await orderRes.json().catch(() => ({}))
          throw new Error(body.detail || 'Could not create payment order')
        }
        const orderData = await orderRes.json()
        const sdkLoaded = await loadRazorpay()
        if (!sdkLoaded) throw new Error('Payment library failed to load')

        const options = {
          key: orderData.razorpay_key_id,
          amount: orderData.amount * 100,
          currency: orderData.currency,
          name: community.owner?.full_name || 'OPC Genie Founder',
          description: `Join ${community.name}`,
          order_id: orderData.order_id,
          handler: () => {
            setJoined(true)
            setJoining(false)
          },
          theme: { color: '#3b82d4' },
          modal: { ondismiss: () => setJoining(false) },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
        return
      }
    } catch (err) {
      setJoinError(err.message)
    } finally {
      setJoining(false)
    }
  }, [community, username, slug])

  // ---- Render states -------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Community not found</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">You're in! 🎉</h1>
          <p className="text-gray-500 text-sm mb-6">
            Welcome to <strong>{community?.name}</strong>.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-colors"
          >
            Go to your dashboard
          </a>
        </div>
      </div>
    )
  }

  const isFree = !community.price || community.price === 0
  const displayPrice = isFree
    ? 'Free'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: community.currency || 'INR',
        maximumFractionDigits: 0,
      }).format(community.price)

  const categories = community.categories || []
  const features = community.features_enabled || {}

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Founder attribution */}
        <div className="flex items-center gap-3 mb-8">
          {community.owner?.avatar_url ? (
            <img
              src={community.owner.avatar_url}
              alt={community.owner.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {community.owner?.full_name || 'Independent Founder'}
            </p>
            {community.owner?.username && (
              <p className="text-xs text-gray-400">@{community.owner.username}</p>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 mb-4">
            <Users className="w-3 h-3" /> Community
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
            {community.name}
          </h1>
          {community.description && (
            <p className="text-lg text-gray-500 leading-relaxed">{community.description}</p>
          )}
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-3 mb-8 text-sm text-gray-500">
          <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
            <Users className="w-4 h-4" /> {community.member_count?.toLocaleString() || 0} members
          </span>
          {features.threads && (
            <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
              <MessageSquare className="w-4 h-4" /> Discussions
            </span>
          )}
          {features.events && (
            <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4" /> Events
            </span>
          )}
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Topics</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1"
                >
                  <Tag className="w-3 h-3" /> {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Welcome message */}
        {community.welcome_message && (
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 mb-10">
            <p className="text-primary-800 text-sm leading-relaxed italic">
              "{community.welcome_message}"
            </p>
          </div>
        )}

        {/* Price + CTA */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Membership</p>
            <p className="text-3xl font-black text-gray-900">{displayPrice}</p>
            {!isFree && (
              <p className="text-xs text-gray-400 mt-1">One-time · Lifetime access</p>
            )}
          </div>

          {joinError && (
            <p className="text-sm text-red-500 sm:max-w-xs">{joinError}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={joining}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold px-8 py-4 rounded-xl transition-colors text-sm"
          >
            {joining ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : isFree ? (
              <><CheckCircle className="w-4 h-4" /> Join free</>
            ) : (
              <><ShoppingCart className="w-4 h-4" /> Join · {displayPrice}</>
            )}
          </button>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap gap-6 mt-8 text-xs text-gray-400 justify-center">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Instant access
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-green-500" /> Private community
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Built on OPC Genie
          </span>
        </div>

      </div>
    </div>
  )
}
