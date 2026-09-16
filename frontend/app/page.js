'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { Brain, BookOpen, Users, Award, Building, ChevronRight, Play, Star, ArrowRight, Code, Zap, Target, TrendingUp, MessageSquare, Lightbulb, Shield, Globe, CheckCircle, Sparkles, Rocket, Database } from 'lucide-react'
import { useSiteConfig } from '../hooks/useSiteConfig'

// Context so all sub-components can access the (possibly API-loaded) config
const SiteConfigCtx = createContext(null)
const useCfg = () => useContext(SiteConfigCtx)

// Custom CSS animations and styles component
function CustomStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      
      * {
        font-family: 'Inter', sans-serif;
      }
      
      .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .card-hover:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1);
      }
      
      .text-accent {
        color: #2563eb;
      }
      
      .btn-primary {
        background: #2563eb;
        transition: all 0.2s ease;
      }
      
      .btn-primary:hover {
        background: #1d4ed8;
        transform: translateY(-1px);
      }
    `}</style>
  )
}

// Modern Hero Section with advanced styling
function HeroSection() {
  const siteConfig = useCfg()
  return (
    <>
      <CustomStyles />
      <section className="relative min-h-screen bg-white overflow-hidden flex items-center border-b border-gray-100">
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-5 py-2 bg-primary-50 border border-primary-100 rounded-full text-sm font-medium mb-8 text-primary-700">
              <Sparkles className="w-4 h-4 mr-2" />
              {siteConfig.hero.badge}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
              {siteConfig.hero.headline}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-4xl mx-auto leading-relaxed">
              {siteConfig.hero.subheadline.split(siteConfig.hero.highlightWord).map((part, i, arr) =>
                i < arr.length - 1
                  ? <span key={i}>{part}<span className="text-primary-600 font-semibold">{siteConfig.hero.highlightWord}</span></span>
                  : <span key={i}>{part}</span>
              )}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href={siteConfig.hero.cta.primary.href || '/setup-wizard'}
                className="btn-primary text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center group"
              >
                {siteConfig.hero.cta.primary.text}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              {/* Watch in Action — opens YouTube URL set by admin, falls back to a YouTube search */}
              <a
                href={siteConfig.hero.cta.secondary.href || 'https://www.youtube.com'}
                target={siteConfig.hero.cta.secondary.href?.startsWith('http') ? '_blank' : undefined}
                rel={siteConfig.hero.cta.secondary.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-gray-700 px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Play className="w-5 h-5 mr-2" />
                {siteConfig.hero.cta.secondary.text}
              </a>
            </div>


          </div>
        </div>
      </section>
    </>
  )
}

// Enhanced Value Propositions Section
function ValuePropsSection() {
  const siteConfig = useCfg()
  // Icons cycle for the value prop cards
  const vpIcons = [Brain, Code, Lightbulb, Globe, Shield, Zap, Target, TrendingUp]
  const vpColors = [
    'bg-primary-600', 'bg-primary-600',
    'bg-primary-600', 'bg-primary-600',
    'bg-primary-600', 'bg-primary-600',
  ]
  const valueProps = (siteConfig.valueProps || []).map((vp, i) => ({
    ...vp,
    icon: vpIcons[i % vpIcons.length],
    color: vpColors[i % vpColors.length],
  }))
  const wd = siteConfig.whyDifferent || {}
  const wdTitle = wd.title || "Why We're Different"
  const wdSubtitle = wd.subtitle || "Other tools just give you features. OPC Genie gives you a business. Here's what makes us different."

  return (
    <section className="py-32 bg-gray-50 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
            {wdTitle.replace("Different", "").trim()} <span className="text-accent">Different</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {wdSubtitle}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mt-32">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon
            return (
              <div key={index} className="card-hover group relative bg-white rounded-2xl p-8 border border-gray-200">
                <div className="relative">
                  <div className="flex items-center mb-6">
                    <div className={`${prop.color} rounded-xl p-3 mr-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{prop.title}</h3>
                  <p className="text-gray-500 mb-5 leading-relaxed">{prop.description}</p>
                  <div className="bg-gray-100 text-gray-600 text-sm px-4 py-1.5 rounded-full font-medium inline-block">
                    {prop.highlight}
                  </div>
                </div>
              </div>
            )
          })}
        </div>


            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16 mt-24">
              {siteConfig.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-700 mb-2">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>


            {/* Social Proof */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-6">Trusted by professionals at</p>
              <div className="flex justify-center items-center space-x-8 opacity-60">
                {siteConfig.trustedBy.map((company, index) => (
                  <div key={index} className="px-6 py-2 rounded-lg text-gray-600 font-medium border border-gray-200 bg-white">
                    {company}
                  </div>
                ))}
              </div>
            </div>






      </div>
    </section>
  )
}

// Enhanced Platform Features Showcase
function FeaturesShowcase() {
  const siteConfig = useCfg()
  const featureIcons = [BookOpen, MessageSquare, Code, Users, TrendingUp, Building, Shield, Zap]
  const featureColors = [
    'bg-primary-600', 'bg-primary-600',
    'bg-primary-600', 'bg-primary-600',
    'bg-primary-600', 'bg-primary-600',
  ]
  const ecosystemSection = siteConfig.ecosystemSection || {}
  const ecosystemTitle = ecosystemSection.title || 'Everything You Need to Launch'
  const ecosystemSubtitle = ecosystemSection.subtitle || 'One platform to build, brand, sell, and run your one-person company'
  const features = (siteConfig.features || []).map((f, i) => ({
    ...f,
    icon: featureIcons[i % featureIcons.length],
    color: featureColors[i % featureColors.length],
  }))

  return (
    <section className="py-32 bg-gray-900 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            {ecosystemTitle} <span className="text-primary-400">Ecosystem</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {ecosystemSubtitle}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-32">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isAvailable = feature.status === 'Available' || feature.status === 'Live Demo'
            
            return (
              <div key={index} className="card-hover group relative glass-effect rounded-3xl p-8 border border-white border-opacity-20">
                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    isAvailable 
                      ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30' 
                      : 'bg-yellow-500 bg-opacity-20 text-yellow-400 border border-yellow-500 border-opacity-30'
                  }`}>
                    {feature.status}
                  </span>
                </div>

                <div className="flex items-center mb-6">
                  <div className={`${feature.color} rounded-xl p-3 mr-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                </div>
                
                <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                <p className="text-sm text-blue-400 mb-8 font-medium">{feature.preview}</p>
                
                {isAvailable ? (
                  <Link href={feature.link} className="inline-flex items-center text-white bg-white bg-opacity-10 hover:bg-opacity-20 px-6 py-3 rounded-xl font-medium transition-all border border-white border-opacity-20">
                    {feature.status === 'Live Demo' ? 'Try Now' : 'Learn More'} 
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                ) : (
                  <button className="inline-flex items-center text-gray-400 cursor-not-allowed px-6 py-3 rounded-xl font-medium border border-gray-600">
                    Coming Soon <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Enhanced Social Proof Section
function SocialProofSection() {
  const siteConfig = useCfg()
  const tColors = ['bg-primary-600', 'bg-primary-600', 'bg-primary-600', 'bg-primary-600']
  const testimonials = (siteConfig.testimonials || []).map((t, i) => ({
    ...t,
    color: tColors[i % tColors.length],
  }))
  const socialProofSection = siteConfig.socialProofSection || {}
  const spTitle = socialProofSection.title || 'Trusted by'
  const spHighlight = socialProofSection.highlight || 'AI Professionals'
  const spSubtitle = socialProofSection.subtitle || "Join thousands who've accelerated their AI careers"

  return (
    <section className="py-32 bg-white border-t border-gray-100 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
            {spTitle} <span className="text-accent">{spHighlight}</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">{spSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-32">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card-hover bg-white rounded-2xl p-8 border border-gray-200 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${testimonial.color}`}></div>
              
              <div className="flex items-center mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-8 text-lg leading-relaxed italic">"{testimonial.content}"</p>
              <div className="flex items-center">
                <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center mr-4`}>
                  <span className="text-white font-bold text-lg">{testimonial.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
                  <p className="text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Enhanced CTA Section
function CTASection() {
  const siteConfig = useCfg()
  return (
    <section className="py-32 bg-gray-900 relative overflow-hidden">
      <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
          {siteConfig.cta.headline}
        </h2>
        <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
          {siteConfig.cta.subheadline}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12 mt-32">
          <Link
            href={siteConfig.cta.primary.href || '/setup-wizard'}
            className="btn-primary text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl"
          >
            {siteConfig.cta.primary.text}
          </Link>
          <Link
            href={siteConfig.cta.secondary.href || '/contact'}
            className="glass-effect text-white px-12 py-6 rounded-2xl font-bold text-xl hover:bg-white hover:bg-opacity-20 transition-all border border-white border-opacity-30"
          >
            {siteConfig.cta.secondary.text}
          </Link>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400">
          {siteConfig.cta.badges.map((badge, i) => (
            <div key={i} className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Main HomePage Component
export default function HomePage() {
  const siteConfig = useSiteConfig()
  return (
    <SiteConfigCtx.Provider value={siteConfig}>
      <div className="min-h-screen bg-white overflow-hidden">
        <HeroSection />
        <ValuePropsSection />
        <FeaturesShowcase />
        <SocialProofSection />
        <CTASection />
      </div>
    </SiteConfigCtx.Provider>
  )
}