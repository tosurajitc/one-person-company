'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, ShoppingCart, User, Clock, Tag, AlertCircle, Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Razorpay checkout helper (loaded lazily — script injected once)
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
// Component
// ---------------------------------------------------------------------------
export default function OfferLandingPage() {
  const params = useParams()
  const username = params?.username
  const offerSlug = params?.['offer-slug']

  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [payError, setPayError] = useState(null)

  // ---- Fetch offer data ---------------------------------------------------
  useEffect(() => {
    if (!username || !offerSlug) return
    fetch(`/api/content/offers/public/${username}/${offerSlug}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.detail || 'Offer not found')
        }
        return res.json()
      })
      .then(setOffer)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [username, offerSlug])

  // ---- Payment flow -------------------------------------------------------
  const handleBuy = useCallback(async () => {
    if (!offer) return
    setPaying(true)
    setPayError(null)

    try {
      // 1. Create order on backend
      const token = document.cookie
        .split('; ')
        .find((r) => r.startsWith('token='))
        ?.split('=')[1] || localStorage.getItem('token')

      if (!token) {
        // Redirect to login, return to this page after
        window.location.href = `/login?next=/${username}/${offerSlug}`
        return
      }

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          purpose: 'offer',
          offer_id: offer.id,
          gateway: 'razorpay',
        }),
      })

      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}))
        throw new Error(body.detail || 'Could not create payment order')
      }

      const orderData = await orderRes.json()

      // 2. Load Razorpay SDK and open checkout
      const sdkLoaded = await loadRazorpay()
      if (!sdkLoaded) throw new Error('Payment library failed to load')

      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount * 100,   // back to paise
        currency: orderData.currency,
        name: offer.creator?.full_name || 'OPC Genie Founder',
        description: offer.title,
        image: offer.thumbnail_url || undefined,
        order_id: orderData.order_id,
        handler: async function (response) {
          // 3. Verify signature on backend
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                gateway_order_id: response.razorpay_order_id,
                gateway_payment_id: response.razorpay_payment_id,
                gateway_signature: response.razorpay_signature,
              }),
            })
            if (verifyRes.ok) {
              setPaid(true)
            } else {
              setPayError('Payment received but verification failed — please contact support.')
            }
          } catch {
            setPayError('Verification request failed — your payment may have succeeded. Please check your email.')
          } finally {
            setPaying(false)
          }
        },
        prefill: {},
        theme: { color: '#3b82d4' },
        modal: {
          ondismiss: () => setPaying(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setPayError(err.message)
      setPaying(false)
    }
  }, [offer, username, offerSlug])

  // ---- Render states ------------------------------------------------------
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
          <h1 className="text-xl font-bold text-gray-900 mb-2">Offer not found</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">Payment successful!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Thank you for purchasing <strong>{offer.title}</strong>. Check your email for access details.
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

  const isFree = !offer.price || offer.price === 0
  const displayPrice = isFree
    ? 'Free'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: offer.currency || 'INR', maximumFractionDigits: 0 }).format(offer.price)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Founder attribution */}
        <div className="flex items-center gap-3 mb-8">
          {offer.creator?.avatar_url ? (
            <img src={offer.creator.avatar_url} alt={offer.creator.full_name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{offer.creator?.full_name || 'Independent Founder'}</p>
            {offer.creator?.username && (
              <p className="text-xs text-gray-400">@{offer.creator.username}</p>
            )}
          </div>
        </div>

        {/* Offer hero */}
        {offer.thumbnail_url && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video bg-gray-100">
            <img src={offer.thumbnail_url} alt={offer.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="mb-6">
          {offer.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 mb-4">
              <Tag className="w-3 h-3" /> {offer.category}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
            {offer.title}
          </h1>
          {offer.description && (
            <p className="text-lg text-gray-500 leading-relaxed">{offer.description}</p>
          )}
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-3 mb-10 text-sm text-gray-500">
          {offer.offer_type && (
            <span className="capitalize bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">{offer.offer_type.replace('_', ' ')}</span>
          )}
          {offer.duration && (
            <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
              <Clock className="w-4 h-4" /> {offer.duration}
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Price</p>
            <p className="text-3xl font-black text-gray-900">{displayPrice}</p>
            {!isFree && (
              <p className="text-xs text-gray-400 mt-1">One-time payment · Instant access</p>
            )}
          </div>

          {payError && (
            <p className="text-sm text-red-500 sm:max-w-xs">{payError}</p>
          )}

          {isFree ? (
            <button
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-sm"
              onClick={() => window.location.href = '/login'}
            >
              <CheckCircle className="w-4 h-4" /> Get free access
            </button>
          ) : (
            <button
              onClick={handleBuy}
              disabled={paying}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold px-8 py-4 rounded-xl transition-colors text-sm"
            >
              {paying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : (
                <><ShoppingCart className="w-4 h-4" /> Buy now · {displayPrice}</>
              )}
            </button>
          )}
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap gap-6 mt-8 text-xs text-gray-400 justify-center">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Secure payment</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Instant access</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Built on OPC Genie</span>
        </div>

      </div>
    </div>
  )
}
