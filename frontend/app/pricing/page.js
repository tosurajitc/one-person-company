'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { 
  Check, X, Star, Users, BookOpen, MessageSquare, Code, 
  Brain, Award, Shield, Zap, Clock, Calendar, 
  Sparkles, ArrowRight, ChevronDown, ChevronUp,
  PlayCircle, FileText, BarChart3, Video, Headphones,
  Image, Presentation, Bot, Globe, Target
} from 'lucide-react'

// Custom CSS animations and styles component (matching page.js)
function CustomStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      
      * {
        font-family: 'Inter', sans-serif;
      }
      
      .gradient-bg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      .glass-effect {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .floating-animation {
        animation: floating 6s ease-in-out infinite;
      }
      
      .floating-delayed {
        animation: floating 6s ease-in-out infinite 2s;
      }
      
      .pulse-glow {
        animation: pulse-glow 2s ease-in-out infinite;
      }
      
      @keyframes floating {
        0%, 100% { transform: translate(0, 0px) rotate(0deg); }
        33% { transform: translate(30px, -30px) rotate(2deg); }
        66% { transform: translate(-20px, 20px) rotate(-2deg); }
      }
      
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
        50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.8); }
      }
      
      .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .card-hover:hover {
        transform: translateY(-12px) scale(1.02);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }
      
      .text-gradient {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
      }
      
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 30px rgba(102, 126, 234, 0.6);
      }
      
      .particle {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.6;
        animation: particle-float 20s linear infinite;
      }
      
      @keyframes particle-float {
        0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
        10% { opacity: 0.6; }
        90% { opacity: 0.6; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
      }
    `}</style>
  )
}

// Floating particles component (matching page.js)
function FloatingParticles() {
  const [particles, setParticles] = useState([])
  
  useEffect(() => {
    const particleCount = 15
    const newParticles = []
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100 + '%',
        size: Math.random() * 4 + 2 + 'px',
        delay: Math.random() * 20 + 's',
        duration: (Math.random() * 10 + 15) + 's',
        color: ['#667eea', '#764ba2', '#f093fb', '#f5576c'][Math.floor(Math.random() * 4)]
      })
    }
    
    setParticles(newParticles)
  }, [])
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            animationDelay: particle.delay,
            animationDuration: particle.duration
          }}
        />
      ))}
    </div>
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

  const badgeColors = ['bg-gray-700', 'bg-primary-600', 'bg-gray-900']
  const buttonStyles = [
    'bg-gray-100 hover:bg-gray-200 text-gray-900',
    'bg-primary-600 hover:bg-primary-700 text-white',
    'bg-gray-900 hover:bg-gray-800 text-white',
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
        <section className="relative pt-32 pb-20 bg-white border-b border-gray-100 overflow-hidden flex items-center">
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center">
              <div className="inline-flex items-center px-5 py-2 bg-primary-50 border border-primary-100 rounded-full text-sm font-medium mb-8 text-primary-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Simple, transparent pricing
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
                {siteConfig.cta?.headline || 'Pick Your Plan'}
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-3xl mx-auto leading-relaxed">
                {siteConfig.cta?.subheadline}
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center mb-10">
                <span className={`mr-3 font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`ml-3 font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
                  Annual
                  <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    Save {annualDiscountPercent}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
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
                  className={`relative rounded-2xl p-8 border ${
                    plan.highlight
                      ? 'border-primary-300 bg-white shadow-lg ring-1 ring-primary-200'
                      : 'border-gray-200 bg-white'
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
                    <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mb-5">{plan.description}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline mb-1">
                        <span className="text-4xl font-black text-gray-900">
                          {getDiscountedPrice(plan) === 0 ? 'Free' : `${currency}${getDiscountedPrice(plan).toLocaleString('en-IN')}`}
                        </span>
                        {getDiscountedPrice(plan) > 0 && <span className="text-gray-400 ml-1 text-sm">{plan.period}</span>}
                      </div>
                      {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                        <div className="text-xs text-gray-400">
                          <span className="line-through">{currency}{plan.originalPrice.toLocaleString('en-IN')}</span>
                          <span className="ml-2 text-green-600 font-medium">
                            Save {currency}{(plan.originalPrice - getDiscountedPrice(plan)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Target Audience */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-5">
                      <p className="text-xs text-gray-600 font-medium">{plan.target}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 text-sm mb-4">What's included:</h4>
                    <ul className="space-y-2.5">
                      {(plan.features || []).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
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
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-500">
                {siteConfig.socialProofSection?.subtitle || 'Everything you need to know'}
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 pb-5 bg-gray-50">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              {siteConfig.cta?.headline}
            </h2>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              {siteConfig.cta?.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href={siteConfig.cta?.primary?.href || '/setup-wizard'}
                className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center"
              >
                {siteConfig.cta?.primary?.text}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href={siteConfig.cta?.secondary?.href || '/contact'}
                className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-xl font-bold text-lg border border-white/20 flex items-center justify-center"
              >
                {siteConfig.cta?.secondary?.text}
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-400 text-sm">
              {(siteConfig.cta?.badges || []).map((b, i) => (
                <div key={i} className="flex items-center">
                  <Check className="w-4 h-4 mr-1.5 text-green-500" />
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