'use client'

import { useSiteConfig } from '../../../hooks/useSiteConfig'
import Link from 'next/link'
import { FileText, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'

export default function OffersPage() {
  const siteConfig = useSiteConfig()
  const feature = (siteConfig.features || []).find(f => f.title === 'Offers & Payments') || {}

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center px-4 py-2 bg-primary-50 border border-primary-100 rounded-full text-sm font-medium mb-6 text-primary-700">
            <Sparkles className="w-4 h-4 mr-2" />
            {feature.status || 'Available'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
            {feature.title || 'Offers & Payments'}
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {feature.description}
          </p>
          <p className="mt-2 text-sm text-primary-600 font-medium">{feature.preview}</p>
        </div>

        {/* Offer types */}
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-6">What you can sell</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Service Packages',    body: 'Fixed-scope engagements with clear deliverables and pricing — perfect for consultants and freelancers.' },
              { title: 'Digital Products',    body: 'Templates, guides, courses, or toolkits. Sell once, deliver instantly, no inventory.' },
              { title: 'Retainers',           body: 'Ongoing monthly engagements — recurring revenue that compounds over time.' },
              { title: '1-on-1 Calls',        body: 'Paid discovery, strategy, or coaching sessions with an integrated booking link.' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-start">
                  <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">{item.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing plans — config-driven */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">Payment integrations by plan</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(siteConfig.pricing?.plans || []).map((plan, i) => (
              <div key={i} className={`rounded-xl p-5 border ${plan.highlight ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}>
                <p className="font-bold text-gray-900 text-sm mb-1">{plan.name}</p>
                <p className="text-gray-500 text-xs mb-3">{plan.target}</p>
                {plan.features?.filter(f => f.toLowerCase().includes('payment') || f.toLowerCase().includes('offer') || f.toLowerCase().includes('domain')).map((f, j) => (
                  <div key={j} className="flex items-start text-xs text-gray-700 mb-1">
                    <CheckCircle className="w-3 h-3 mr-1.5 text-green-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href={siteConfig.cta?.primary?.href || '/setup-wizard'}
            className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            {siteConfig.cta?.primary?.text || 'Start Selling Free'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <div className="flex justify-center gap-6 mt-4">
            {(siteConfig.cta?.badges || []).map((b, i) => (
              <span key={i} className="flex items-center text-gray-500 text-sm">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> {b}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
