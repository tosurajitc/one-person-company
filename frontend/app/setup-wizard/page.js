'use client'

import { useState, useEffect } from 'react'
import {
  ArrowRight, ArrowLeft, Download, CheckCircle,
  Building2, Lock, Mail, Globe, LayoutGrid,
  Navigation, DollarSign, Megaphone, Layers, User, ChevronRight,
  Plus, X, Trash2, ShoppingBag, Target, Bot
} from 'lucide-react'

// ─────────────────────────────────────────────
// Shared field primitives
// ─────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

function Field({ label, hint, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// Progress bar + step header
// ─────────────────────────────────────────────
const STEPS = [
  { id: 1,  label: 'Business Identity',          icon: Building2 },
  { id: 2,  label: 'Admin Credentials',          icon: Lock },
  { id: 3,  label: 'Social Links',               icon: Globe },
  { id: 4,  label: 'Home Page Hero',             icon: Layers },
  { id: 5,  label: 'Stats & Proof',              icon: User },
  { id: 6,  label: 'Feature Cards',              icon: LayoutGrid },
  { id: 7,  label: 'CTA & Footer',               icon: Navigation },
  { id: 8,  label: 'Pricing',                    icon: DollarSign },
  { id: 9,  label: 'Your Offers',                icon: ShoppingBag },
  { id: 10, label: 'Facebook Marketing Agent',   icon: Target },
  { id: 11, label: 'Marketing Page',             icon: Megaphone },
  { id: 12, label: 'Email Setup',                icon: Mail },
  { id: 13, label: 'Review & Save',              icon: CheckCircle },
]

function StepHeader({ step }) {
  const Icon = STEPS[step - 1].icon
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Step {step} of {STEPS.length}</p>
        <h2 className="text-xl font-bold text-gray-900">{STEPS[step - 1].label}</h2>
      </div>
    </div>
  )
}

function ProgressBar({ step }) {
  const pct = Math.round(((step - 1) / (STEPS.length - 1)) * 100)
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>{STEPS[step - 1].label}</span>
        <span>{pct}% complete</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-2">
        {STEPS.map(s => (
          <div key={s.id} className={`w-2 h-2 rounded-full transition-all ${s.id <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>
    </div>
  )
}

function NavButtons({ step, setStep, onFinish, missing = [] }) {
  return (
    <div className="space-y-3 pt-6 mt-6 border-t border-gray-200">
      {missing.length > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠ Optional fields not filled: <strong>{missing.join(', ')}</strong>. You can continue — your site will be built without them.
        </p>
      )}
      <div className="flex justify-between">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
        ) : <div />}
        {step < STEPS.length ? (
          <button onClick={() => setStep(s => s + 1)} className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button onClick={onFinish} className="inline-flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors">
            <Download className="w-4 h-4 mr-2" /> Download setup.json
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 1 — Business Identity
// ─────────────────────────────────────────────
function Step1({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  return (
    <div className="space-y-5">
      <StepHeader step={1} />
      <p className="text-sm text-gray-500">Your brand details — these appear in the header, footer, browser tab, and all emails.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Brand / Business Name *">
          <input className={inputCls} value={data.brandName} onChange={e => set('brandName', e.target.value)} placeholder="e.g. OPC Genie" />
        </Field>
        <Field label="Tagline *">
          <input className={inputCls} value={data.tagline} onChange={e => set('tagline', e.target.value)} placeholder="e.g. Your One-Person Company" />
        </Field>
        <Field label="Business Description *" hint="One sentence shown in footer and SEO meta">
          <input className={inputCls} value={data.description} onChange={e => set('description', e.target.value)} placeholder="e.g. AI-powered business-in-a-box for solo founders." />
        </Field>
        <Field label="Contact Email *">
          <input type="email" className={inputCls} value={data.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="hello@yourbusiness.com" />
        </Field>
        <Field label="Contact Phone">
          <input className={inputCls} value={data.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+91 9876543210" />
        </Field>
        <Field label="Location">
          <input className={inputCls} value={data.location} onChange={e => set('location', e.target.value)} placeholder="India" />
        </Field>
        <Field label="Copyright Year">
          <input className={inputCls} value={data.year} onChange={e => set('year', e.target.value)} placeholder={String(new Date().getFullYear())} />
        </Field>
        <Field label="Site Name (for browser tab)" hint="Usually same as Brand Name">
          <input className={inputCls} value={data.siteName} onChange={e => set('siteName', e.target.value)} placeholder="OPC Genie" />
        </Field>
      </div>
      <Field label="Site Description (for SEO)" hint="Shown in Google search results and link previews">
        <textarea rows={2} className={inputCls} value={data.siteDescription} onChange={e => set('siteDescription', e.target.value)} placeholder="Build, brand, and run your one-person company with an AI Genie..." />
      </Field>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 2 — Admin Credentials
// ─────────────────────────────────────────────
function Step2({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  return (
    <div className="space-y-5">
      <StepHeader step={2} />
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        ⚠️ The default admin password is <code className="bg-amber-100 px-1 rounded">password</code> — change it here before your site goes live.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Admin Email *">
          <input type="email" className={inputCls} value={data.adminEmail} onChange={e => set('adminEmail', e.target.value)} placeholder="admin@yourbusiness.com" />
        </Field>
        <Field label="Support Email">
          <input type="email" className={inputCls} value={data.supportEmail} onChange={e => set('supportEmail', e.target.value)} placeholder="support@yourbusiness.com" />
        </Field>
        <Field label="New Admin Password *" hint="Min 8 characters">
          <input type="password" className={inputCls} value={data.adminPassword} onChange={e => set('adminPassword', e.target.value)} placeholder="New secure password" />
        </Field>
        <Field label="Confirm Password *">
          <input type="password" className={inputCls} value={data.adminPasswordConfirm} onChange={e => set('adminPasswordConfirm', e.target.value)} placeholder="Repeat password" />
        </Field>
      </div>
      {data.adminPassword && data.adminPasswordConfirm && data.adminPassword !== data.adminPasswordConfirm && (
        <p className="text-sm text-red-600">Passwords do not match.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Timezone">
          <select className={inputCls} value={data.timezone} onChange={e => set('timezone', e.target.value)}>
            {['UTC','Asia/Kolkata','America/New_York','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo'].map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </Field>
        <Field label="Default Language">
          <select className={inputCls} value={data.language} onChange={e => set('language', e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 3 — Social Links
// ─────────────────────────────────────────────
function Step3({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  const socials = ['twitter','linkedin','github','youtube','facebook','instagram']
  return (
    <div className="space-y-5">
      <StepHeader step={3} />
      <p className="text-sm text-gray-500">Leave a field blank to hide that icon from the footer. All fields are optional.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {socials.map(k => (
          <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
            <input type="url" className={inputCls} value={data[k] || ''} onChange={e => set(k, e.target.value)} placeholder={`https://${k}.com/yourhandle`} />
          </Field>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 4 — Home Page Hero
// ─────────────────────────────────────────────
function Step4({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  return (
    <div className="space-y-5">
      <StepHeader step={4} />
      <p className="text-sm text-gray-500">The big top section of your home page (<code>/</code>). This is what organic visitors see first.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Badge Text" hint="Small pill above headline, e.g. 'AI-Powered Business-in-a-Box'">
          <input className={inputCls} value={data.heroBadge} onChange={e => set('heroBadge', e.target.value)} placeholder="AI-Powered Business-in-a-Box" />
        </Field>
        <Field label="Highlight Word(s)" hint="Which words in the headline glow in accent colour">
          <input className={inputCls} value={data.heroHighlightWord} onChange={e => set('heroHighlightWord', e.target.value)} placeholder="AI Genie" />
        </Field>
      </div>
      <Field label="Headline *">
        <input className={inputCls} value={data.heroHeadline} onChange={e => set('heroHeadline', e.target.value)} placeholder="Launch Your One-Person Company With Your Own AI Genie" />
      </Field>
      <Field label="Subheadline *">
        <textarea rows={2} className={inputCls} value={data.heroSubheadline} onChange={e => set('heroSubheadline', e.target.value)} placeholder="Describe your business. Your Genie builds the site, writes the copy, and runs sales & support..." />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Primary CTA Button Text *">
          <input className={inputCls} value={data.heroPrimaryText} onChange={e => set('heroPrimaryText', e.target.value)} placeholder="Build My Business Free" />
        </Field>
        <Field label="Primary CTA Link *">
          <input className={inputCls} value={data.heroPrimaryHref} onChange={e => set('heroPrimaryHref', e.target.value)} placeholder="/setup-wizard" />
        </Field>
        <Field label="Secondary CTA Button Text">
          <input className={inputCls} value={data.heroSecondaryText} onChange={e => set('heroSecondaryText', e.target.value)} placeholder="See Your Genie in Action" />
        </Field>
        <Field label="Secondary CTA Link">
          <input className={inputCls} value={data.heroSecondaryHref} onChange={e => set('heroSecondaryHref', e.target.value)} placeholder="/platform/industry-simulator" />
        </Field>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 5 — Stats & Social Proof
// ─────────────────────────────────────────────
function Step5({ data, setData }) {
  const setStats = (i, k, v) => setData(d => ({
    ...d,
    stats: d.stats.map((s, idx) => idx === i ? { ...s, [k]: v } : s)
  }))
  const setTrustedBy = v => setData(d => ({ ...d, trustedBy: v }))
  const addTestimonial = () => setData(d => ({ ...d, testimonials: [...d.testimonials, { name: '', role: '', content: '', rating: 5 }] }))
  const removeTestimonial = i => setData(d => ({ ...d, testimonials: d.testimonials.filter((_, idx) => idx !== i) }))
  const setTestimonial = (i, k, v) => setData(d => ({
    ...d,
    testimonials: d.testimonials.map((t, idx) => idx === i ? { ...t, [k]: v } : t)
  }))

  return (
    <div className="space-y-6">
      <StepHeader step={5} />

      {/* Stats bar */}
      <section>
        <h4 className="font-semibold text-gray-800 text-sm mb-3">Stats Bar — 4 headline numbers</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.stats.map((stat, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <Field label={`#${i+1} Number`}>
                <input className={inputCls} value={stat.number} onChange={e => setStats(i, 'number', e.target.value)} placeholder="500+" />
              </Field>
              <Field label="Label">
                <input className={inputCls} value={stat.label} onChange={e => setStats(i, 'label', e.target.value)} placeholder="Founders Launched" />
              </Field>
            </div>
          ))}
        </div>
      </section>

      {/* Trusted by */}
      <section>
        <Field label="Trusted By (comma-separated)" hint="Shown as a strip below stats, e.g. Freelancers, Consultants, Coaches">
          <input className={inputCls} value={data.trustedBy} onChange={e => setTrustedBy(e.target.value)} placeholder="Freelancers, Consultants, Coaches, Creators" />
        </Field>
      </section>

      {/* Testimonials */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 text-sm">Testimonials <span className="text-gray-400 font-normal">(optional — leave empty to hide section)</span></h4>
          <button onClick={addTestimonial} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium">
            <Plus className="w-3.5 h-3.5 mr-1" />Add
          </button>
        </div>
        {data.testimonials.length === 0 && (
          <p className="text-xs text-gray-400 italic">No testimonials yet. Click Add to include social proof.</p>
        )}
        {data.testimonials.map((t, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 mb-3 relative">
            <button onClick={() => removeTestimonial(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Name">
                <input className={inputCls} value={t.name} onChange={e => setTestimonial(i, 'name', e.target.value)} placeholder="Priya Sharma" />
              </Field>
              <Field label="Role / Company">
                <input className={inputCls} value={t.role} onChange={e => setTestimonial(i, 'role', e.target.value)} placeholder="Independent Consultant" />
              </Field>
              <Field label="Rating (1-5)">
                <input type="number" min="1" max="5" className={inputCls} value={t.rating} onChange={e => setTestimonial(i, 'rating', parseInt(e.target.value) || 5)} />
              </Field>
            </div>
            <Field label="Quote">
              <textarea rows={2} className={inputCls} value={t.content} onChange={e => setTestimonial(i, 'content', e.target.value)} placeholder="I launched my consulting website and started getting client enquiries within 48 hours..." />
            </Field>
          </div>
        ))}
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 6 — Homepage Feature Cards
// ─────────────────────────────────────────────
function Step6({ data, setData }) {
  const setWD = (k, v) => setData(d => ({ ...d, whyDifferentTitle: k === 'title' ? v : d.whyDifferentTitle, whyDifferentSubtitle: k === 'subtitle' ? v : d.whyDifferentSubtitle }))
  const setVP = (i, k, v) => setData(d => ({ ...d, valueProps: d.valueProps.map((p, idx) => idx === i ? { ...p, [k]: v } : p) }))
  const addVP = () => setData(d => ({ ...d, valueProps: [...d.valueProps, { title: '', description: '', highlight: '' }] }))
  const removeVP = i => setData(d => ({ ...d, valueProps: d.valueProps.filter((_, idx) => idx !== i) }))
  const setFeat = (i, k, v) => setData(d => ({ ...d, features: d.features.map((f, idx) => idx === i ? { ...f, [k]: v } : f) }))
  const addFeat = () => setData(d => ({ ...d, features: [...d.features, { title: '', description: '', preview: '', link: '/', status: 'Coming Soon' }] }))
  const removeFeat = i => setData(d => ({ ...d, features: d.features.filter((_, idx) => idx !== i) }))

  return (
    <div className="space-y-6">
      <StepHeader step={6} />

      <section className="space-y-3">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">"Why We're Different" Section Header</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input className={inputCls} value={data.whyDifferentTitle} onChange={e => setWD('title', e.target.value)} placeholder="Why OPC Genie is Different" />
          </Field>
        </div>
        <Field label="Subtitle">
          <textarea rows={2} className={inputCls} value={data.whyDifferentSubtitle} onChange={e => setWD('subtitle', e.target.value)} placeholder="Other tools give you templates. Your Genie builds, writes, and runs your business." />
        </Field>
      </section>

      <section>
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
          <h4 className="font-semibold text-gray-800 text-sm">Value Proposition Cards (4 cards)</h4>
          {data.valueProps.length < 4 && (
            <button onClick={addVP} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium"><Plus className="w-3.5 h-3.5 mr-1" />Add</button>
          )}
        </div>
        {data.valueProps.map((vp, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 mb-3 relative">
            <button onClick={() => removeVP(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            <p className="text-xs font-semibold text-gray-500 uppercase">Card {i + 1}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Title"><input className={inputCls} value={vp.title} onChange={e => setVP(i, 'title', e.target.value)} placeholder="Your Genie Builds It" /></Field>
              <Field label="Highlight Badge"><input className={inputCls} value={vp.highlight} onChange={e => setVP(i, 'highlight', e.target.value)} placeholder="vs. DIY Page Builders" /></Field>
            </div>
            <Field label="Description"><textarea rows={2} className={inputCls} value={vp.description} onChange={e => setVP(i, 'description', e.target.value)} /></Field>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
          <h4 className="font-semibold text-gray-800 text-sm">Platform Feature Cards</h4>
          <button onClick={addFeat} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium"><Plus className="w-3.5 h-3.5 mr-1" />Add</button>
        </div>
        {data.features.map((f, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 mb-3 relative">
            <button onClick={() => removeFeat(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            <p className="text-xs font-semibold text-gray-500 uppercase">Card {i + 1}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Title"><input className={inputCls} value={f.title} onChange={e => setFeat(i, 'title', e.target.value)} placeholder="AI Website Builder" /></Field>
              <Field label="Status">
                <select className={inputCls} value={f.status} onChange={e => setFeat(i, 'status', e.target.value)}>
                  <option>Available</option><option>Live Demo</option><option>Coming Soon</option>
                </select>
              </Field>
              <Field label="Internal Link"><input className={inputCls} value={f.link} onChange={e => setFeat(i, 'link', e.target.value)} placeholder="/platform/..." /></Field>
              <Field label="Preview Text"><input className={inputCls} value={f.preview} onChange={e => setFeat(i, 'preview', e.target.value)} placeholder="Live site in under 10 minutes" /></Field>
            </div>
            <Field label="Description"><textarea rows={2} className={inputCls} value={f.description} onChange={e => setFeat(i, 'description', e.target.value)} /></Field>
          </div>
        ))}
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 7 — Final CTA + Footer Nav
// ─────────────────────────────────────────────
function Step7({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  const addLink = col => setData(d => ({ ...d, [col]: [...d[col], { name: '', href: '' }] }))
  const removeLink = (col, i) => setData(d => ({ ...d, [col]: d[col].filter((_, idx) => idx !== i) }))
  const setLink = (col, i, k, v) => setData(d => ({ ...d, [col]: d[col].map((l, idx) => idx === i ? { ...l, [k]: v } : l) }))

  const LinkGroup = ({ title, col }) => (
    <section>
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
        <h4 className="font-semibold text-gray-700 text-sm">{title}</h4>
        <button onClick={() => addLink(col)} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium"><Plus className="w-3.5 h-3.5 mr-1" />Add</button>
      </div>
      {data[col].map((link, i) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <input className={inputCls} value={link.name} onChange={e => setLink(col, i, 'name', e.target.value)} placeholder="Label" />
          <input className={inputCls} value={link.href} onChange={e => setLink(col, i, 'href', e.target.value)} placeholder="/path or https://..." />
          <button onClick={() => removeLink(col, i)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
    </section>
  )

  return (
    <div className="space-y-6">
      <StepHeader step={7} />

      <section className="space-y-4">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">Page-Bottom CTA Section</h4>
        <Field label="CTA Headline *"><input className={inputCls} value={data.ctaHeadline} onChange={e => set('ctaHeadline', e.target.value)} placeholder="Your Business. Built by Your Genie." /></Field>
        <Field label="CTA Subheadline"><input className={inputCls} value={data.ctaSubheadline} onChange={e => set('ctaSubheadline', e.target.value)} placeholder="Stop juggling tools. Describe what you do — your Genie handles the rest." /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Primary Button Text"><input className={inputCls} value={data.ctaPrimaryText} onChange={e => set('ctaPrimaryText', e.target.value)} placeholder="Build My Business Free" /></Field>
          <Field label="Primary Button Link"><input className={inputCls} value={data.ctaPrimaryHref} onChange={e => set('ctaPrimaryHref', e.target.value)} placeholder="/setup-wizard" /></Field>
          <Field label="Secondary Button Text"><input className={inputCls} value={data.ctaSecondaryText} onChange={e => set('ctaSecondaryText', e.target.value)} placeholder="Book a Live Demo" /></Field>
          <Field label="Secondary Button Link"><input className={inputCls} value={data.ctaSecondaryHref} onChange={e => set('ctaSecondaryHref', e.target.value)} placeholder="/contact" /></Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Trust Badge 1"><input className={inputCls} value={data.badge0} onChange={e => set('badge0', e.target.value)} placeholder="No credit card required" /></Field>
          <Field label="Trust Badge 2"><input className={inputCls} value={data.badge1} onChange={e => set('badge1', e.target.value)} placeholder="Live in under 10 minutes" /></Field>
          <Field label="Trust Badge 3"><input className={inputCls} value={data.badge2} onChange={e => set('badge2', e.target.value)} placeholder="Cancel anytime" /></Field>
        </div>
      </section>

      <LinkGroup title="Footer — Platform Links" col="footerPlatform" />
      <LinkGroup title="Footer — Resources Links" col="footerResources" />
      <LinkGroup title="Footer — Company Links" col="footerCompany" />
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 8 — Pricing
// ─────────────────────────────────────────────
function Step8({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  const addPlan = () => setData(d => ({ ...d, plans: [...d.plans, { name: '', description: '', badge: '', monthlyPrice: 0, buttonText: 'Get Started', buttonHref: '/setup-wizard', target: '', highlight: false, featuresText: '', restrictionsText: '' }] }))
  const removePlan = i => setData(d => ({ ...d, plans: d.plans.filter((_, idx) => idx !== i) }))
  const setPlan = (i, k, v) => setData(d => ({ ...d, plans: d.plans.map((p, idx) => idx === i ? { ...p, [k]: v } : p) }))
  const addFaq = () => setData(d => ({ ...d, faqs: [...d.faqs, { question: '', answer: '' }] }))
  const removeFaq = i => setData(d => ({ ...d, faqs: d.faqs.filter((_, idx) => idx !== i) }))
  const setFaq = (i, k, v) => setData(d => ({ ...d, faqs: d.faqs.map((f, idx) => idx === i ? { ...f, [k]: v } : f) }))

  return (
    <div className="space-y-6">
      <StepHeader step={8} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Currency Symbol"><input className={inputCls} value={data.currency} onChange={e => set('currency', e.target.value)} placeholder="₹" /></Field>
        <Field label="Annual Discount %"><input type="number" className={inputCls} value={data.annualDiscount} onChange={e => set('annualDiscount', Number(e.target.value))} /></Field>
        <Field label="Student Discount %"><input type="number" className={inputCls} value={data.studentDiscount} onChange={e => set('studentDiscount', Number(e.target.value))} /></Field>
      </div>

      <section>
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
          <h4 className="font-semibold text-gray-800 text-sm">Plans (up to 4)</h4>
          {data.plans.length < 4 && <button onClick={addPlan} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium"><Plus className="w-3.5 h-3.5 mr-1" />Add Plan</button>}
        </div>
        {data.plans.map((plan, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 mb-3 relative">
            <button onClick={() => removePlan(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Plan Name"><input className={inputCls} value={plan.name} onChange={e => setPlan(i, 'name', e.target.value)} placeholder="Launch" /></Field>
              <Field label="Badge"><input className={inputCls} value={plan.badge || ''} onChange={e => setPlan(i, 'badge', e.target.value)} placeholder="Free Forever" /></Field>
              <Field label="Monthly Price"><input type="number" className={inputCls} value={plan.monthlyPrice} onChange={e => setPlan(i, 'monthlyPrice', Number(e.target.value))} /></Field>
              <Field label="Button Text"><input className={inputCls} value={plan.buttonText || ''} onChange={e => setPlan(i, 'buttonText', e.target.value)} placeholder="Start Free" /></Field>
              <Field label="Button Link"><input className={inputCls} value={plan.buttonHref || ''} onChange={e => setPlan(i, 'buttonHref', e.target.value)} placeholder="/setup-wizard" /></Field>
              <Field label="Target Audience"><input className={inputCls} value={plan.target || ''} onChange={e => setPlan(i, 'target', e.target.value)} placeholder="Solo founders just starting out" /></Field>
            </div>
            <Field label="Description"><input className={inputCls} value={plan.description || ''} onChange={e => setPlan(i, 'description', e.target.value)} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Features (one per line)"><textarea rows={5} className={inputCls} value={plan.featuresText} onChange={e => setPlan(i, 'featuresText', e.target.value)} placeholder={"AI website\nUnlimited offers\n24/7 Genie"} /></Field>
              <Field label="Restrictions (one per line)"><textarea rows={5} className={inputCls} value={plan.restrictionsText} onChange={e => setPlan(i, 'restrictionsText', e.target.value)} placeholder={"No custom domain\nNo payments"} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={!!plan.highlight} onChange={e => setPlan(i, 'highlight', e.target.checked)} className="rounded" />
              Featured / highlighted plan
            </label>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
          <h4 className="font-semibold text-gray-800 text-sm">Pricing FAQs</h4>
          <button onClick={addFaq} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium"><Plus className="w-3.5 h-3.5 mr-1" />Add FAQ</button>
        </div>
        {data.faqs.map((faq, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 mb-3 relative">
            <button onClick={() => removeFaq(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            <Field label={`Question ${i + 1}`}><input className={inputCls} value={faq.question} onChange={e => setFaq(i, 'question', e.target.value)} /></Field>
            <Field label="Answer"><textarea rows={2} className={inputCls} value={faq.answer} onChange={e => setFaq(i, 'answer', e.target.value)} /></Field>
          </div>
        ))}
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 9 — Your Offers (Products & Services)
// ─────────────────────────────────────────────
const OFFER_TYPES = [
  { value: 'service',         label: 'Service',                hint: 'Done-for-you work, freelance, agency' },
  { value: 'coaching',        label: 'Coaching / Consulting',  hint: '1-on-1 or group sessions' },
  { value: 'course',          label: 'Course / Workshop',      hint: 'Structured learning program' },
  { value: 'digital_product', label: 'Digital Product',        hint: 'Template, preset, software, tool' },
  { value: 'video',           label: 'Video / Film',           hint: 'Video series, documentary, masterclass' },
  { value: 'audio',           label: 'Audio / Podcast',        hint: 'Audio course, podcast, music' },
  { value: 'book',            label: 'Book / eBook',           hint: 'Written guide, novel, manual' },
  { value: 'community',       label: 'Community / Membership', hint: 'Access to group, forum, or network' },
  { value: 'event',           label: 'Event / Webinar',        hint: 'Live or recorded online event' },
  { value: 'physical',        label: 'Physical Product',       hint: 'Shipped goods, merchandise' },
  { value: 'bundle',          label: 'Bundle / Package',       hint: 'Combination of multiple offers' },
  { value: 'other',           label: 'Other',                  hint: 'Anything else you sell' },
]
const CURRENCIES_WIZ = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD']

function Step9({ data, setData }) {
  const addOffer = () => setData(d => ({
    ...d,
    offers: [...(d.offers || []), {
      title: '', offer_type: 'service', description: '', price: '',
      currency: 'INR', category: '', duration: '', slug: '',
    }]
  }))
  const removeOffer = i => setData(d => ({ ...d, offers: d.offers.filter((_, idx) => idx !== i) }))
  const setOffer = (i, k, v) => setData(d => ({
    ...d,
    offers: d.offers.map((o, idx) => {
      if (idx !== i) return o
      const updated = { ...o, [k]: v }
      if (k === 'title' && (!o.slug || o.slug === o.title.toLowerCase().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-').replace(/^-+|-+$/g,''))) {
        updated.slug = v.toLowerCase().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-').replace(/^-+|-+$/g,'')
      }
      return updated
    })
  }))

  const offers = data.offers || []

  return (
    <div className="space-y-6">
      <StepHeader step={9} />
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        Tell us what you sell — products, services, courses, videos, books, anything. Each offer gets its own landing page. You can add more later from Admin → Content.
      </div>

      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 text-sm">Your Offers <span className="text-gray-400 font-normal">(add up to 10)</span></h4>
        {offers.length < 10 && (
          <button onClick={addOffer} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium">
            <Plus className="w-3.5 h-3.5 mr-1" />Add Offer
          </button>
        )}
      </div>

      {offers.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No offers yet. This step is optional — skip if you want to add them later.</p>
          <button onClick={addOffer} className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
            + Add your first offer
          </button>
        </div>
      )}

      {offers.map((offer, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Offer {i + 1}</p>
            <button onClick={() => removeOffer(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title *">
              <input className={inputCls} value={offer.title} onChange={e => setOffer(i, 'title', e.target.value)} placeholder="e.g. Brand Strategy Session" />
            </Field>
            <Field label="Type *">
              <select className={inputCls} value={offer.offer_type} onChange={e => setOffer(i, 'offer_type', e.target.value)}>
                {OFFER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Price" hint="Leave blank = Free">
              <input type="number" min="0" step="0.01" className={inputCls} value={offer.price} onChange={e => setOffer(i, 'price', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Currency">
              <select className={inputCls} value={offer.currency} onChange={e => setOffer(i, 'currency', e.target.value)}>
                {CURRENCIES_WIZ.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <input className={inputCls} value={offer.category} onChange={e => setOffer(i, 'category', e.target.value)} placeholder="e.g. Design" />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Duration" hint="e.g. 60 min, 4 weeks, Lifetime">
              <input className={inputCls} value={offer.duration} onChange={e => setOffer(i, 'duration', e.target.value)} placeholder="60 min session" />
            </Field>
            <Field label="URL Slug" hint="Auto-filled from title">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                <span className="px-2 py-2 bg-gray-100 text-gray-400 text-xs border-r border-gray-300 whitespace-nowrap">/offer/</span>
                <input className="flex-1 px-2 py-2 text-sm text-gray-900 outline-none bg-white" value={offer.slug} onChange={e => setOffer(i, 'slug', e.target.value)} placeholder="my-offer" />
              </div>
            </Field>
          </div>

          <Field label="Description" hint="What does the buyer get? What problem does it solve?">
            <textarea rows={2} className={inputCls} value={offer.description} onChange={e => setOffer(i, 'description', e.target.value)} placeholder="Brief description of your offer..." />
          </Field>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 10 — Facebook Marketing Agent
// ─────────────────────────────────────────────
function Step10({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  const addProduct = () => setData(d => ({ ...d, fbProducts: [...(d.fbProducts || []), { name: '', description: '', audience: '', price: '' }] }))
  const removeProduct = i => setData(d => ({ ...d, fbProducts: (d.fbProducts || []).filter((_, idx) => idx !== i) }))
  const setProduct = (i, k, v) => setData(d => ({ ...d, fbProducts: (d.fbProducts || []).map((p, idx) => idx === i ? { ...p, [k]: v } : p) }))

  const products = data.fbProducts || []

  return (
    <div className="space-y-6">
      <StepHeader step={10} />

      {/* Agent overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 space-y-1">
        <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
          <Bot className="w-4 h-4" /> Facebook Marketing Agent — Powered by Claude Sonnet
        </div>
        <p className="text-xs text-blue-700">
          This agent crafts Facebook ad copy, post content, and campaign strategies specifically for your business.
          Fill in the details below so the agent knows your brand voice, products, and target audience.
        </p>
      </div>

      {/* Brand voice */}
      <section className="space-y-4">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">Brand Voice & Tone</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand Tone" hint="e.g. Friendly & Conversational, Professional, Bold, Inspirational">
            <input className={inputCls} value={data.fbBrandTone || ''} onChange={e => set('fbBrandTone', e.target.value)} placeholder="Friendly & Conversational" />
          </Field>
          <Field label="Primary Audience" hint="Who are you targeting on Facebook?">
            <input className={inputCls} value={data.fbPrimaryAudience || ''} onChange={e => set('fbPrimaryAudience', e.target.value)} placeholder="e.g. Small business owners in India, 25–45" />
          </Field>
        </div>
        <Field label="Unique Selling Points" hint="What makes you different? Comma-separated">
          <input className={inputCls} value={data.fbUSP || ''} onChange={e => set('fbUSP', e.target.value)} placeholder="e.g. Lowest price, 24/7 support, 7-day results" />
        </Field>
        <Field label="Call-to-Action Preference" hint="What do you want people to do?">
          <input className={inputCls} value={data.fbCTAPreference || ''} onChange={e => set('fbCTAPreference', e.target.value)} placeholder="e.g. Book a free call, Shop now, Sign up free" />
        </Field>
      </section>

      {/* Products to promote */}
      <section>
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
          <h4 className="font-semibold text-gray-800 text-sm">Products / Services to Promote</h4>
          <button onClick={addProduct} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium">
            <Plus className="w-3.5 h-3.5 mr-1" />Add
          </button>
        </div>
        {products.length === 0 && (
          <p className="text-xs text-gray-400 italic">No products added. The agent will use your brand info above.</p>
        )}
        {products.map((p, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 mb-3 relative">
            <button onClick={() => removeProduct(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            <p className="text-xs font-semibold text-gray-500 uppercase">Product {i + 1}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Product / Service Name">
                <input className={inputCls} value={p.name} onChange={e => setProduct(i, 'name', e.target.value)} placeholder="e.g. Brand Strategy Session" />
              </Field>
              <Field label="Price / Offer" hint="e.g. ₹4,999 · Free trial · 50% off">
                <input className={inputCls} value={p.price} onChange={e => setProduct(i, 'price', e.target.value)} placeholder="₹4,999" />
              </Field>
              <Field label="Target Audience for This Product">
                <input className={inputCls} value={p.audience} onChange={e => setProduct(i, 'audience', e.target.value)} placeholder="e.g. Freelancers who need branding" />
              </Field>
            </div>
            <Field label="Short Description" hint="2–3 sentences the agent uses to write ads">
              <textarea rows={2} className={inputCls} value={p.description} onChange={e => setProduct(i, 'description', e.target.value)} placeholder="Describe what this product does and the result it delivers..." />
            </Field>
          </div>
        ))}
      </section>

      {/* Campaign goals */}
      <section className="space-y-4">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">Campaign Goals</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Primary Goal" hint="What is the main objective of your Facebook campaigns?">
            <select className={inputCls} value={data.fbCampaignGoal || ''} onChange={e => set('fbCampaignGoal', e.target.value)}>
              <option value="">Select a goal…</option>
              <option value="lead_generation">Lead Generation</option>
              <option value="sales">Direct Sales / Conversions</option>
              <option value="brand_awareness">Brand Awareness</option>
              <option value="engagement">Page / Post Engagement</option>
              <option value="traffic">Website Traffic</option>
              <option value="app_installs">App Installs</option>
            </select>
          </Field>
          <Field label="Monthly Ad Budget (approx.)" hint="Helps the agent tailor strategy to your scale">
            <input className={inputCls} value={data.fbMonthlyBudget || ''} onChange={e => set('fbMonthlyBudget', e.target.value)} placeholder="e.g. ₹10,000 / month" />
          </Field>
        </div>
        <Field label="Competitor Pages / Brands to Avoid" hint="Comma-separated — agent won't mimic these">
          <input className={inputCls} value={data.fbCompetitors || ''} onChange={e => set('fbCompetitors', e.target.value)} placeholder="e.g. Brand A, Brand B" />
        </Field>
        <Field label="Restricted Words / Topics" hint="Words the agent must never use in copy">
          <input className={inputCls} value={data.fbRestrictedWords || ''} onChange={e => set('fbRestrictedWords', e.target.value)} placeholder="e.g. guaranteed, get rich, cure" />
        </Field>
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 11 — Marketing Landing Page
// ─────────────────────────────────────────────
function Step11Mkt({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  const addBullet = () => setData(d => ({ ...d, mktBullets: [...d.mktBullets, ''] }))
  const setBullet = (i, v) => setData(d => ({ ...d, mktBullets: d.mktBullets.map((b, idx) => idx === i ? v : b) }))
  const removeBullet = i => setData(d => ({ ...d, mktBullets: d.mktBullets.filter((_, idx) => idx !== i) }))
  const addFG = () => setData(d => ({ ...d, mktFeatureGrid: [...d.mktFeatureGrid, { title: '', before: '', after: '' }] }))
  const setFG = (i, k, v) => setData(d => ({ ...d, mktFeatureGrid: d.mktFeatureGrid.map((f, idx) => idx === i ? { ...f, [k]: v } : f) }))
  const removeFG = i => setData(d => ({ ...d, mktFeatureGrid: d.mktFeatureGrid.filter((_, idx) => idx !== i) }))

  return (
    <div className="space-y-6">
      <StepHeader step={11} />
      <p className="text-sm text-gray-500">This configures the <code className="bg-gray-100 px-1 rounded">/marketing</code> page — your ad-traffic landing page. Separate copy from the home page.</p>

      <section className="space-y-4">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">Hero</h4>
        <Field label="Headline *"><input className={inputCls} value={data.mktHeadline} onChange={e => set('mktHeadline', e.target.value)} placeholder="Stop renting your business. Own it." /></Field>
        <Field label="Subheadline *"><textarea rows={2} className={inputCls} value={data.mktSubheadline} onChange={e => set('mktSubheadline', e.target.value)} placeholder="Describe your business. Your AI Genie builds the site..." /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CTA Button Label"><input className={inputCls} value={data.mktCtaLabel} onChange={e => set('mktCtaLabel', e.target.value)} placeholder="Start free" /></Field>
          <Field label="CTA Destination"><input className={inputCls} value={data.mktCtaHref} onChange={e => set('mktCtaHref', e.target.value)} placeholder="/setup-wizard" /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={!!data.mktShowDemo} onChange={e => set('mktShowDemo', e.target.checked)} className="rounded" />
          Embed live AI Genie demo in hero
        </label>
      </section>

      <section>
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
          <h4 className="font-semibold text-gray-800 text-sm">Problem Bullets</h4>
          <button onClick={addBullet} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium"><Plus className="w-3.5 h-3.5 mr-1" />Add</button>
        </div>
        {data.mktBullets.map((b, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input className={inputCls} value={b} onChange={e => setBullet(i, e.target.value)} placeholder={`Pain point #${i + 1}`} />
            <button onClick={() => removeBullet(i)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
          <h4 className="font-semibold text-gray-800 text-sm">Feature Grid (Before → After)</h4>
          <button onClick={addFG} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium"><Plus className="w-3.5 h-3.5 mr-1" />Add Card</button>
        </div>
        {data.mktFeatureGrid.map((fg, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 mb-3 relative">
            <button onClick={() => removeFG(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Title"><input className={inputCls} value={fg.title} onChange={e => setFG(i, 'title', e.target.value)} placeholder="Build" /></Field>
              <Field label="Before (Old Way)"><input className={inputCls} value={fg.before} onChange={e => setFG(i, 'before', e.target.value)} placeholder="One month with a developer" /></Field>
              <Field label="After (With You)"><input className={inputCls} value={fg.after} onChange={e => setFG(i, 'after', e.target.value)} placeholder="One prompt, live in minutes" /></Field>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">Comparison Table</h4>
        <Field label="Column headers (comma-separated, first = your brand)" hint="e.g. OPC Genie, Graphy, Kajabi, Skool">
          <input className={inputCls} value={data.mktCompetitors} onChange={e => set('mktCompetitors', e.target.value)} placeholder="OPC Genie, Graphy, Kajabi, Skool" />
        </Field>
        <Field label="Comparison rows (one per line, format: Label | val1 | val2 | val3 | val4)" hint={'e.g. Pricing model | Flat license | Monthly % | Monthly $ | Monthly $'}>
          <textarea rows={4} className={inputCls} value={data.mktCompRows} onChange={e => set('mktCompRows', e.target.value)} placeholder={"Pricing model | Flat license | Monthly % | Monthly $ | Monthly $\nYou own the code | Yes | No | No | No"} />
        </Field>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">Lead Magnet</h4>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={!!data.mktLeadMagnetEnabled} onChange={e => set('mktLeadMagnetEnabled', e.target.checked)} className="rounded" />
          Show lead magnet section on /marketing
        </label>
        {data.mktLeadMagnetEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Headline"><input className={inputCls} value={data.mktLeadMagnetHeadline} onChange={e => set('mktLeadMagnetHeadline', e.target.value)} placeholder="Get the Solo Founder Launch Playbook" /></Field>
            <Field label="CTA Button Label"><input className={inputCls} value={data.mktLeadMagnetCta} onChange={e => set('mktLeadMagnetCta', e.target.value)} placeholder="Send me the playbook" /></Field>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">Final CTA</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Headline"><input className={inputCls} value={data.mktFinalCtaHeadline} onChange={e => set('mktFinalCtaHeadline', e.target.value)} placeholder="Build your business today." /></Field>
          <Field label="Button Label"><input className={inputCls} value={data.mktFinalCtaLabel} onChange={e => set('mktFinalCtaLabel', e.target.value)} placeholder="Start free" /></Field>
        </div>
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 12 — Email Setup
// ─────────────────────────────────────────────
function Step12Email({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  return (
    <div className="space-y-5">
      <StepHeader step={12} />
      <p className="text-sm text-gray-500">Used for transactional emails — welcome, password reset, lead notifications.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email Provider">
          <select className={inputCls} value={data.emailProvider} onChange={e => set('emailProvider', e.target.value)}>
            <option value="gmail">Gmail</option>
            <option value="smtp">Custom SMTP</option>
            <option value="sendgrid">SendGrid</option>
            <option value="mailgun">Mailgun</option>
            <option value="ses">Amazon SES</option>
          </select>
        </Field>
        <Field label="SMTP Host"><input className={inputCls} value={data.smtpHost} onChange={e => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" /></Field>
        <Field label="SMTP Port"><input type="number" className={inputCls} value={data.smtpPort} onChange={e => set('smtpPort', Number(e.target.value))} /></Field>
        <Field label="SMTP Username"><input className={inputCls} value={data.smtpUsername} onChange={e => set('smtpUsername', e.target.value)} placeholder="you@gmail.com" /></Field>
        <Field label="SMTP Password / App Password">
          <input type="password" className={inputCls} value={data.smtpPassword} onChange={e => set('smtpPassword', e.target.value)} />
        </Field>
        <Field label="From Email"><input type="email" className={inputCls} value={data.fromEmail} onChange={e => set('fromEmail', e.target.value)} placeholder="noreply@yourbusiness.com" /></Field>
        <Field label="From Name"><input className={inputCls} value={data.fromName} onChange={e => set('fromName', e.target.value)} placeholder="OPC Genie" /></Field>
        <Field label="Reply-To Email"><input type="email" className={inputCls} value={data.replyToEmail} onChange={e => set('replyToEmail', e.target.value)} placeholder="support@yourbusiness.com" /></Field>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 13 — Review & Save
// ─────────────────────────────────────────────
function Step13Review({ data, onDownload, saving, onGoToStep }) {
  const [confirmMode, setConfirmMode] = useState(false)

  // Determine what critical data is missing
  const incomplete = []
  if (!data.brandName)     incomplete.push({ label: 'Brand Name',       step: 1 })
  if (!data.contactEmail)  incomplete.push({ label: 'Contact Email',     step: 1 })
  if (!data.adminEmail)    incomplete.push({ label: 'Admin Email',       step: 2 })
  if (!data.adminPassword) incomplete.push({ label: 'Admin Password',    step: 2 })
  if (!data.heroHeadline)  incomplete.push({ label: 'Hero Headline',     step: 4 })
  if (!data.heroPrimaryText) incomplete.push({ label: 'Primary CTA Text', step: 4 })

  const hasIncomplete = incomplete.length > 0

  const sections = [
    { label: 'Business Identity',         fields: [['Brand', data.brandName], ['Tagline', data.tagline], ['Email', data.contactEmail]] },
    { label: 'Admin Credentials',         fields: [['Admin Email', data.adminEmail], ['Support Email', data.supportEmail], ['Password', data.adminPassword ? '●●●●●●' : '⚠ Not set']] },
    { label: 'Social Links',              fields: ['twitter','linkedin','github','youtube','facebook','instagram'].filter(k => data[k]).map(k => [k, data[k]]) },
    { label: 'Home Page Hero',            fields: [['Headline', data.heroHeadline], ['Badge', data.heroBadge], ['Primary CTA', `${data.heroPrimaryText} → ${data.heroPrimaryHref}`]] },
    { label: 'Stats',                     fields: data.stats.map((s, i) => [`Stat ${i+1}`, `${s.number} — ${s.label}`]) },
    { label: 'Testimonials',              fields: [[`Count`, String(data.testimonials.length)]] },
    { label: 'Feature Cards',             fields: [[`Value Props`, String(data.valueProps.length)], ['Feature Cards', String(data.features.length)]] },
    { label: 'Pricing',                   fields: [['Currency', data.currency], ['Plans', String(data.plans.length)], ['FAQs', String(data.faqs.length)]] },
    { label: 'Your Offers',               fields: (data.offers || []).length === 0 ? [] : (data.offers || []).map((o, i) => [`Offer ${i+1}`, `${o.title} (${(o.offer_type||'').replace('_',' ')})${o.price ? ` · ${o.currency} ${o.price}` : ' · Free'}`]) },
    { label: 'Facebook Marketing Agent',  fields: [['Tone', data.fbBrandTone || '—'], ['Audience', data.fbPrimaryAudience || '—'], ['Goal', data.fbCampaignGoal || '—'], ['Products', String((data.fbProducts || []).length)]] },
    { label: 'Marketing Page',            fields: [['Headline', data.mktHeadline], ['Problem Bullets', String(data.mktBullets.length)], ['Feature Grid Cards', String(data.mktFeatureGrid.length)]] },
    { label: 'Email Setup',               fields: [['Provider', data.emailProvider], ['Host', data.smtpHost], ['From', data.fromEmail]] },
  ]

  return (
    <div className="space-y-6">
      <StepHeader step={13} />

      {/* Incomplete data warning banner */}
      {hasIncomplete && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 text-sm text-amber-800">
          <p className="font-semibold mb-2">⚠ Your setup is incomplete</p>
          <p className="mb-3">The following important fields are still empty. Your site will be created but these sections will be blank or use placeholder defaults:</p>
          <ul className="space-y-1 mb-3">
            {incomplete.map(item => (
              <li key={item.label} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  {item.label}
                </span>
                <button
                  onClick={() => onGoToStep(item.step)}
                  className="text-xs text-amber-700 underline hover:text-amber-900 font-medium"
                >
                  Go fill it in →
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-600">You can still save now and edit these from Admin → Settings later.</p>
        </div>
      )}

      {/* All good banner — only shown when nothing is missing */}
      {!hasIncomplete && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-800">
          <p className="font-semibold mb-1">✅ All done! Here's a summary of what you've configured.</p>
          <p>Click <strong>Save & Download</strong> to save your data and launch your site.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(sec => (
          <div key={sec.label} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">{sec.label}</p>
            {sec.fields.length === 0
              ? <p className="text-xs text-gray-400 italic">Not configured</p>
              : sec.fields.map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs py-0.5">
                  <span className="text-gray-500">{k}</span>
                  <span className={`font-medium truncate max-w-[160px] ${!v || v === '—' ? 'text-amber-500 italic' : 'text-gray-900'}`}>{v || '—'}</span>
                </div>
              ))
            }
          </div>
        ))}
      </div>

      {/* First click on incomplete: show confirm prompt instead of saving */}
      {hasIncomplete && !confirmMode ? (
        <div className="space-y-3">
          <button
            onClick={() => setConfirmMode(true)}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-base transition-colors shadow-lg disabled:opacity-60"
          >
            <Download className="w-5 h-5" /> Save with incomplete data
          </button>
          <p className="text-center text-xs text-gray-400">Some fields are empty — click above to confirm you want to save anyway.</p>
        </div>
      ) : hasIncomplete && confirmMode ? (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-800 text-center">Are you sure you want to save with missing data?</p>
          <p className="text-xs text-amber-700 text-center">Your site will be built but {incomplete.length} field{incomplete.length > 1 ? 's' : ''} will be blank. You can fix them later from Admin → Settings.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmMode(false)}
              className="flex-1 py-2.5 bg-white border border-amber-300 text-amber-700 rounded-lg font-medium text-sm hover:bg-amber-50 transition-colors"
            >
              ← Go back and fix
            </button>
            <button
              onClick={onDownload}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-60"
            >
              <Download className="w-4 h-4" /> {saving ? 'Saving…' : 'Yes, save anyway'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button onClick={onDownload} disabled={saving} className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-lg disabled:opacity-60">
            <Download className="w-5 h-5" /> {saving ? 'Saving…' : 'Save & Download setup.json'}
          </button>
          <p className="text-center text-xs text-gray-400">The JSON file contains all your settings. Keep it safe — it can rebuild your entire site.</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Build the output JSON from wizard state
// ─────────────────────────────────────────────
function buildSetupPayload(d) {
  const parseCompRows = () => {
    return (d.mktCompRows || '').split('\n').filter(Boolean).map(line => {
      const parts = line.split('|').map(s => s.trim())
      return { label: parts[0] || '', values: parts.slice(1) }
    })
  }

  return {
    general: {
      siteName: d.siteName || d.brandName,
      siteDescription: d.siteDescription,
      adminEmail: d.adminEmail,
      supportEmail: d.supportEmail,
      timezone: d.timezone,
      language: d.language,
      maintenanceMode: false,
      registrationOpen: true,
      emailVerification: true,
      twoFactorRequired: false,
    },
    _adminPassword: d.adminPassword,
    brand: {
      name: d.brandName,
      tagline: d.tagline,
      description: d.description,
      year: d.year || String(new Date().getFullYear()),
    },
    contact: {
      email: d.contactEmail,
      phone: d.contactPhone,
      location: d.location,
    },
    social: {
      twitter: d.twitter || '',
      linkedin: d.linkedin || '',
      github: d.github || '',
      youtube: d.youtube || '',
      facebook: d.facebook || '',
      instagram: d.instagram || '',
    },
    hero: {
      badge: d.heroBadge,
      headline: d.heroHeadline,
      subheadline: d.heroSubheadline,
      highlightWord: d.heroHighlightWord,
      cta: {
        primary: { text: d.heroPrimaryText, href: d.heroPrimaryHref },
        secondary: { text: d.heroSecondaryText, href: d.heroSecondaryHref },
      },
    },
    stats: d.stats,
    trustedBy: (d.trustedBy || '').split(',').map(s => s.trim()).filter(Boolean),
    cta: {
      headline: d.ctaHeadline,
      subheadline: d.ctaSubheadline,
      primary: { text: d.ctaPrimaryText, href: d.ctaPrimaryHref },
      secondary: { text: d.ctaSecondaryText, href: d.ctaSecondaryHref },
      badges: [d.badge0, d.badge1, d.badge2].filter(Boolean),
    },
    whyDifferent: {
      title: d.whyDifferentTitle,
      subtitle: d.whyDifferentSubtitle,
    },
    valueProps: d.valueProps,
    features: d.features,
    testimonials: d.testimonials,
    socialProofSection: {
      title: 'Trusted by',
      highlight: 'Solo Founders',
      subtitle: "Join hundreds of founders who've launched with us",
    },
    footerLinks: {
      platform: d.footerPlatform,
      resources: d.footerResources,
      company: d.footerCompany,
    },
    pricing: {
      currency: d.currency,
      annualDiscountPercent: d.annualDiscount,
      studentDiscountPercent: d.studentDiscount,
      plans: d.plans.map(({ featuresText, restrictionsText, ...rest }) => ({
        ...rest,
        features: (featuresText || '').split('\n').map(s => s.trim()).filter(Boolean),
        restrictions: (restrictionsText || '').split('\n').map(s => s.trim()).filter(Boolean),
      })),
      faqs: d.faqs,
    },
    marketing_page: {
      hero: {
        headline: d.mktHeadline,
        subheadline: d.mktSubheadline,
        cta_label: d.mktCtaLabel,
        cta_href: d.mktCtaHref,
        show_live_demo: !!d.mktShowDemo,
      },
      problem_bullets: d.mktBullets.filter(Boolean),
      feature_grid: d.mktFeatureGrid,
      comparison_table: {
        competitors: (d.mktCompetitors || '').split(',').map(s => s.trim()).filter(Boolean),
        rows: parseCompRows(),
      },
      testimonials: d.testimonials,
      lead_magnet: {
        enabled: !!d.mktLeadMagnetEnabled,
        resource_id: null,
        headline: d.mktLeadMagnetHeadline,
        cta_label: d.mktLeadMagnetCta,
      },
      final_cta: {
        headline: d.mktFinalCtaHeadline,
        cta_label: d.mktFinalCtaLabel,
      },
    },
    facebook_marketing_agent: {
      brand_tone: d.fbBrandTone || '',
      primary_audience: d.fbPrimaryAudience || '',
      usp: (d.fbUSP || '').split(',').map(s => s.trim()).filter(Boolean),
      cta_preference: d.fbCTAPreference || '',
      products: (d.fbProducts || []),
      campaign_goal: d.fbCampaignGoal || '',
      monthly_budget: d.fbMonthlyBudget || '',
      competitors_to_avoid: (d.fbCompetitors || '').split(',').map(s => s.trim()).filter(Boolean),
      restricted_words: (d.fbRestrictedWords || '').split(',').map(s => s.trim()).filter(Boolean),
    },
    email: {
      provider: d.emailProvider,
      smtpHost: d.smtpHost,
      smtpPort: d.smtpPort,
      smtpUsername: d.smtpUsername,
      smtpPassword: d.smtpPassword,
      fromEmail: d.fromEmail,
      fromName: d.fromName,
      replyToEmail: d.replyToEmail,
      enableSsl: true,
      enableStartTls: true,
      emailTemplates: {
        welcome: 'enabled',
        verification: 'enabled',
        passwordReset: 'enabled',
        courseCompletion: 'enabled',
        newsletter: 'enabled',
      },
    },
  }
}

// ─────────────────────────────────────────────
// Default wizard state
// ─────────────────────────────────────────────
const DEFAULT_STATE = {
  // Step 1
  brandName: '', tagline: '', description: '', contactEmail: '', contactPhone: '', location: '', year: String(new Date().getFullYear()), siteName: '', siteDescription: '',
  // Step 2
  adminEmail: '', supportEmail: '', adminPassword: '', adminPasswordConfirm: '', timezone: 'Asia/Kolkata', language: 'en',
  // Step 3
  twitter: '', linkedin: '', github: '', youtube: '', facebook: '', instagram: '',
  // Step 4
  heroBadge: '', heroHeadline: '', heroSubheadline: '', heroHighlightWord: '', heroPrimaryText: '', heroPrimaryHref: '/setup-wizard', heroSecondaryText: '', heroSecondaryHref: '',
  // Step 5
  stats: [{ number: '', label: '' }, { number: '', label: '' }, { number: '', label: '' }, { number: '', label: '' }],
  trustedBy: '',
  testimonials: [],
  // Step 6
  whyDifferentTitle: '', whyDifferentSubtitle: '',
  valueProps: [{ title: '', description: '', highlight: '' }, { title: '', description: '', highlight: '' }, { title: '', description: '', highlight: '' }, { title: '', description: '', highlight: '' }],
  features: [{ title: '', description: '', preview: '', link: '/', status: 'Available' }],
  // Step 7
  ctaHeadline: '', ctaSubheadline: '', ctaPrimaryText: '', ctaPrimaryHref: '/setup-wizard', ctaSecondaryText: '', ctaSecondaryHref: '',
  badge0: '', badge1: '', badge2: '',
  footerPlatform: [{ name: '', href: '' }],
  footerResources: [{ name: '', href: '' }],
  footerCompany: [{ name: '', href: '' }],
  // Step 8
  currency: '₹', annualDiscount: 20, studentDiscount: 0,
  plans: [{ name: 'Launch', description: '', badge: 'Free Forever', monthlyPrice: 0, buttonText: 'Start Free', buttonHref: '/setup-wizard', target: '', highlight: false, featuresText: '', restrictionsText: '' }],
  faqs: [],
  // Step 9 — Offers
  offers: [],
  // Step 10 — Facebook Marketing Agent
  fbBrandTone: '', fbPrimaryAudience: '', fbUSP: '', fbCTAPreference: '',
  fbProducts: [],
  fbCampaignGoal: '', fbMonthlyBudget: '', fbCompetitors: '', fbRestrictedWords: '',
  // Step 11 — Marketing Page
  mktHeadline: '', mktSubheadline: '', mktCtaLabel: 'Start free', mktCtaHref: '/setup-wizard', mktShowDemo: true,
  mktBullets: ['', '', ''],
  mktFeatureGrid: [{ title: 'Build', before: '', after: '' }, { title: 'Sell', before: '', after: '' }, { title: 'Run', before: '', after: '' }, { title: 'Grow', before: '', after: '' }],
  mktCompetitors: '',
  mktCompRows: '',
  mktLeadMagnetEnabled: true, mktLeadMagnetHeadline: '', mktLeadMagnetCta: 'Send me the playbook',
  mktFinalCtaHeadline: '', mktFinalCtaLabel: 'Start free',
  // Step 12 — Email Setup
  emailProvider: 'gmail', smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpUsername: '', smtpPassword: '', fromEmail: '', fromName: '', replyToEmail: '',
}

// ─────────────────────────────────────────────
// Main Wizard Page
// ─────────────────────────────────────────────
export default function SetupWizardPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState(DEFAULT_STATE)
  const [downloaded, setDownloaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [prefillApplied, setPrefillApplied] = useState(false)

  // On first mount, check if the AI Website Builder sent a Genie prefill
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('genie_prefill')
    if (!raw) return
    try {
      const prefill = JSON.parse(raw)
      setData(d => ({ ...d, ...prefill }))
      setPrefillApplied(true)
    } catch (_) {
      // malformed — ignore silently
    } finally {
      sessionStorage.removeItem('genie_prefill')
    }
  }, [])

  const handleDownload = () => {
    const payload = buildSetupPayload(data)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'setup.json'
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  const handleFinish = async () => {
    // Always trigger the local download first
    handleDownload()

    // Then attempt to save to the backend for the logged-in user
    const token =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('auth_token') || localStorage.getItem('token'))) ||
      ''
    if (!token) return // not logged in — download-only is fine

    setSaving(true)
    setSaveError(null)
    try {
      // 1. Save site settings
      const payload = buildSetupPayload(data)
      const res = await fetch('/api/settings/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)

      // 2. Save each offer to the offers table
      const offers = data.offers || []
      for (const offer of offers) {
        if (!offer.title.trim()) continue
        await fetch('/api/content/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: offer.title,
            instructor: data.brandName || data.adminEmail,
            offer_type: offer.offer_type || 'service',
            description: offer.description || '',
            price: offer.price === '' ? null : parseFloat(offer.price) || null,
            currency: offer.currency || 'INR',
            category: offer.category || '',
            duration: offer.duration || '',
            slug: offer.slug || '',
            status: 'Draft',
          }),
        })
      }

      setSaved(true)
    } catch (err) {
      setSaveError('Could not save to your account — your setup.json was still downloaded.')
    } finally {
      setSaving(false)
    }
  }

  const getMissingFields = (s) => {
    const missing = []
    if (s === 1) {
      if (!data.brandName)    missing.push('Brand Name')
      if (!data.contactEmail) missing.push('Contact Email')
    }
    if (s === 2) {
      if (!data.adminEmail)    missing.push('Admin Email')
      if (!data.adminPassword) missing.push('Admin Password')
      if (data.adminPassword && data.adminPassword !== data.adminPasswordConfirm) missing.push('Passwords must match')
    }
    if (s === 4) {
      if (!data.heroHeadline)    missing.push('Hero Headline')
      if (!data.heroPrimaryText) missing.push('Primary CTA Text')
    }
    return missing
  }

  const renderStep = () => {
    const stepData = {
      1:  <Step1  data={data} setData={setData} />,
      2:  <Step2  data={data} setData={setData} />,
      3:  <Step3  data={data} setData={setData} />,
      4:  <Step4  data={data} setData={setData} />,
      5:  <Step5  data={data} setData={setData} />,
      6:  <Step6  data={data} setData={setData} />,
      7:  <Step7  data={data} setData={setData} />,
      8:  <Step8  data={data} setData={setData} />,
      9:  <Step9       data={data} setData={setData} />,
      10: <Step10      data={data} setData={setData} />,
      11: <Step11Mkt   data={data} setData={setData} />,
      12: <Step12Email data={data} setData={setData} />,
      13: <Step13Review data={data} onDownload={handleFinish} saving={saving} onGoToStep={setStep} />,
    }
    return stepData[step]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Top banner */}
      <div className="bg-blue-600 text-white text-center py-3 px-4 text-sm font-medium">
        🚀 Website Builder Wizard — Fill in your details, then download your <code className="bg-white/20 px-1.5 py-0.5 rounded text-xs">setup.json</code> to launch your site
      </div>

      {/* Genie prefill notice */}
      {prefillApplied && (
        <div className="bg-green-50 border-b border-green-200 text-green-800 text-center py-2.5 px-4 text-sm">
          ✨ <strong>Genie has pre-filled Steps 1, 4 & 6</strong> based on your business description — review each step and adjust anything you like.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sidebar step list (desktop) + progress bar */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-3 xl:col-span-3 sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Setup Steps</p>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {step}/{STEPS.length}
              </span>
            </div>
            <nav className="space-y-1">
              {STEPS.map(s => {
                const Icon = s.icon
                const done = s.id < step
                const active = s.id === step
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(s.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : done
                        ? 'text-gray-700 hover:bg-blue-50/60 hover:text-blue-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {done ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                      ) : (
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                      )}
                      <span className="truncate">{s.label}</span>
                    </div>
                    {done && <span className="text-[10px] text-emerald-600 bg-emerald-50 font-semibold px-1.5 py-0.5 rounded">Done</span>}
                  </button>
                )
              })}
            </nav>
          </aside>

          <div className="lg:col-span-9 xl:col-span-9">
            <ProgressBar step={step} />
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 lg:p-10">
              {renderStep()}
              <NavButtons step={step} setStep={setStep} onFinish={handleFinish} missing={getMissingFields(step)} />
            </div>
            {downloaded && (
              <div className="mt-4 text-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl py-3 px-5">
                <CheckCircle className="inline w-4 h-4 mr-1" />
                {saved
                  ? <><strong>Saved to your account!</strong> Your site settings are stored. Go to <a href="/admin/settings" className="underline font-medium">Admin → Settings</a> to review them.</>
                  : saveError
                  ? <span className="text-orange-700">{saveError}</span>
                  : <><strong>setup.json downloaded!</strong> Go to <a href="/admin/settings" className="underline font-medium">Admin Settings</a> to apply it, or share it with your developer.</>
                }
              </div>
            )}
          </div>
        </div>

        {/* Mobile: no sidebar */}
        <div className="lg:hidden">
          <ProgressBar step={step} />
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
            {renderStep()}
            <NavButtons step={step} setStep={setStep} onFinish={handleFinish} missing={getMissingFields(step)} />
          </div>
          {downloaded && (
            <div className="mt-4 text-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl py-3 px-5">
              <CheckCircle className="inline w-4 h-4 mr-1" />
              {saved
                ? <><strong>Saved to your account!</strong> Go to <a href="/admin/settings" className="underline font-medium">Admin → Settings</a> to review them.</>
                : saveError
                ? <span className="text-orange-700">{saveError}</span>
                : <><strong>setup.json downloaded!</strong> Go to <a href="/admin/settings" className="underline font-medium">Admin Settings</a> to apply it.</>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
