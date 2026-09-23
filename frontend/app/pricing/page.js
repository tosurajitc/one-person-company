'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { Check, X, Sparkles, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

// Theme: bottle green #021610 / #053728 / #0a4836 / #0f6b4f, light green #a7f3c0 / #d9f5e4 / #f2faf5, orange buttons.
function CustomStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

      * {
        font-family: 'Inter', sans-serif;
      }

      .bg-bottle-gradient {
        background: linear-gradient(135deg, #021610 0%, #053728 55%, #0a4836 100%);
      }

      .price-card {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
      }

      .price-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 25px 50px -12px rgba(5, 55, 40, 0.28);
        border-color: #0f6b4f;
      }

      @media (prefers-reduced-motion: reduce) {
        .price-card { transition: none; }
        .price-card:hover { transform: none; }
      }
    `}</style>
  )
}

export default function PricingPage() {
  const siteConfig = useSiteConfig()
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' or 'annual'
  const [openFAQ, setOpenFAQ] = useState(null)

  const pricing = siteConfig.pricing || {}
  const currency = pricing.currency ?? '₹'
  const annualDiscountPercent = pricing.annualDiscountPercent ?? 20
  const configPlans = pricing.plans ?? []
  const faqs = pricing.faqs ?? []

  // Badge / button styles cycle by plan position: 1st = light green, 2nd (usually the highlighted plan) = orange, 3rd = bottle green
  const badgeColors = ['bg-[#053728]', 'bg-orange-500', 'bg-[#0a4836]']
  const buttonStyles = [
    'bg-[#d9f5e4] hover:bg-[#c9f2d8] text-[#053728] border border-[#a7f3c0]',
    'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30',
    'bg-[#0a4836] hover:bg-[#053728] text-white',
  ]

  const pricingPlans = configPlans.map((plan, i) => {
    const base = plan.monthlyPrice
    const price = billingCycle === 'monthly' ? base : Math.round(base * 12 * (1 - annualDiscountPercent / 100))
    const originalPrice = billingCycle === 'monthly' ? base : base * 12
    return {
      ...plan,
      price,
      originalPrice,
      period: base === 0 ? 'Forever' : billingCycle === 'monthly' ? '/month' : '/year',
      badgeColor: badgeColors[i % badgeColors.length],
      buttonStyle: buttonStyles[i % buttonStyles.length],
    }
  })

  const getDiscountedPrice = (plan) => {
    if (plan.monthlyPrice === 0) return 0
    return plan.price
  }

  return (
    <>
      <CustomStyles />
      <div className="min-h-screen bg-white overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 bg-bottle-gradient overflow-hidden flex items-center">
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center">
              <div className="inline-flex items-center px-5 py-2 bg-[#a7f3c0]/10 border border-[#a7f3c0]/30 rounded-full text-sm font-medium mb-8 text-[#a7f3c0]">
                <Sparkles className="w-4 h-4 mr-2" />
                Simple, transparent pricing
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                {siteConfig.cta?.headline || 'Pick Your Plan'}
              </h1>

              <p className="text-xl md:text-2xl text-emerald-50/80 mb-10 max-w-3xl mx-auto leading-relaxed">
                {siteConfig.cta?.subheadline}
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center mb-4">
                <span className={`mr-3 font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-emerald-100/50'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  aria-label="Toggle annual billing"
                  aria-pressed={billingCycle === 'annual'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full border border-[#a7f3c0]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#a7f3c0] focus:ring-offset-2 focus:ring-offset-[#053728] ${
                    billingCycle === 'annual' ? 'bg-orange-500' : 'bg-[#0f6b4f]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`ml-3 font-medium ${billingCycle === 'annual' ? 'text-white' : 'text-emerald-100/50'}`}>
                  Annual
                  <span className="ml-2 bg-[#a7f3c0]/20 text-[#a7f3c0] border border-[#a7f3c0]/30 text-xs px-2 py-1 rounded-full">
                    Save {annualDiscountPercent}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 bg-gradient-to-b from-[#f2faf5] to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-[#06352a] mb-4">
                Plans for every stage
              </h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                {siteConfig.pricing?.plans?.[0]?.target && 'Start free, grow at your own pace.'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`price-card relative rounded-2xl p-8 border bg-white ${
                    plan.highlight
                      ? 'border-[#0f6b4f] shadow-lg ring-2 ring-[#a7f3c0]'
                      : 'border-[#c9f2d8]'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${plan.badgeColor} text-white px-4 py-1 rounded-full text-xs font-bold`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-8">
                    <h3 className="text-xl font-black text-[#06352a] mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mb-5">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline mb-1">
                        <span className="text-4xl font-black text-[#053728]">
                          {getDiscountedPrice(plan) === 0 ? 'Free' : `${currency}${getDiscountedPrice(plan).toLocaleString('en-IN')}`}
                        </span>
                        {getDiscountedPrice(plan) > 0 && <span className="text-gray-400 ml-1 text-sm">{plan.period}</span>}
                      </div>
                      {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                        <div className="text-xs text-gray-400">
                          <span className="line-through">{currency}{plan.originalPrice.toLocaleString('en-IN')}</span>
                          <span className="ml-2 text-[#0f6b4f] font-medium">
                            Save {currency}{(plan.originalPrice - getDiscountedPrice(plan)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Target Audience */}
                    <div className="bg-[#f2faf5] border border-[#d9f5e4] rounded-lg p-3 mb-5">
                      <p className="text-xs text-[#0a4836] font-medium">{plan.target}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-[#06352a] text-sm mb-4">What's included:</h4>
                    <ul className="space-y-2.5">
                      {(plan.features || []).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="w-4 h-4 text-[#0f6b4f] mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {(plan.restrictions || []).length > 0 && (
                      <ul className="space-y-2 mt-3">
                        {plan.restrictions.map((r, ri) => (
                          <li key={ri} className="flex items-start">
                            <X className="w-4 h-4 text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-400 text-sm">{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={plan.buttonHref || (plan.monthlyPrice === 0 ? '/setup-wizard' : '/contact')}
                    className={`w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-bold transition-all duration-200 ${plan.buttonStyle}`}
                  >
                    {plan.buttonText}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white border-t border-[#d9f5e4]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-[#06352a] mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-500">
                {siteConfig.socialProofSection?.subtitle || 'Everything you need to know'}
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-[#c9f2d8] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    aria-expanded={openFAQ === index}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#f2faf5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6b4f]"
                  >
                    <span className="font-semibold text-[#06352a]">{faq.question}</span>
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-[#0f6b4f] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 pb-5 bg-[#f2faf5]">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-bottle-gradient relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
          <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              {siteConfig.cta?.headline}
            </h2>
            <p className="text-xl text-emerald-50/80 mb-10 leading-relaxed">
              {siteConfig.cta?.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href={siteConfig.cta?.primary?.href || '/setup-wizard'}
                className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/30 px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all"
              >
                {siteConfig.cta?.primary?.text}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href={siteConfig.cta?.secondary?.href || '/contact'}
                className="bg-white/10 hover:bg-[#a7f3c0]/15 text-white px-10 py-4 rounded-xl font-bold text-lg border border-[#a7f3c0]/40 hover:border-[#a7f3c0] flex items-center justify-center transition-all"
              >
                {siteConfig.cta?.secondary?.text}
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-emerald-100/80 text-sm">
              {(siteConfig.cta?.badges || []).map((b, i) => (
                <div key={i} className="flex items-center">
                  <Check className="w-4 h-4 mr-1.5 text-[#a7f3c0]" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}