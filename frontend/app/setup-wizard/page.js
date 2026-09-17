'use client'

/**
 * One-click Website Builder — Setup Wizard
 * ------------------------------------------------------------------
 * Collects what the AI needs to build a solopreneur's website, using the
 * framework from "The One-Person Company" (Surajit Chatterjee):
 *
 *   Ch.3  Positioning & niche  → who the site is for, the problem, the outcome
 *   Ch.6  Three-tier ladder    → front door, core offer, recurring offer
 *   Ch.5  Proof of real work   → results, case studies, published work
 *   Ch.4  Front door + knowledge layer → one enquiry queue, FAQs, policies
 *   Ch.2/8 Agents with guardrails → draft-only, human approval
 *   Ch.7  Payments & compliance → GST, LUT, payment terms
 *
 * The user gives INPUTS (facts, prices, decisions). The AI writes the COPY.
 * Every site uses the same template structure (see SITE_PAGES); only content changes.
 *
 * Output: POST to BUILD_ENDPOINT, plus an optional setup.json download.
 * Passwords are never collected here and never written to the JSON.
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import {
  ArrowRight, ArrowLeft, Download, CheckCircle, AlertTriangle, Sparkles,
  Building2, Target, Layers, Award, DoorOpen, BookOpen, Palette, Bot,
  Wallet, Share2, Globe, Rocket, Plus, Trash2, X, RotateCcw, Loader2,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Config — change these for your platform
// ─────────────────────────────────────────────
const BUILD_ENDPOINT = '/api/sites/build'        // receives buildSitePayload()
const AI_DRAFT_ENDPOINT = '/api/genie/draft-site' // optional: returns partial wizard state
const SITE_DOMAIN_SUFFIX = '.yourplatform.com'
const DRAFT_STORAGE_KEY = 'opc_site_wizard_draft_v2'
const SCHEMA_VERSION = '2.0'
const TEMPLATE_ID = 'opc-template-v1'

// Fixed page structure every generated site follows
const SITE_PAGES = [
  { slug: '/',          name: 'Home',            source: 'positioning + offers + proof + front door' },
  { slug: '/offers',    name: 'Offers',          source: 'three-tier ladder' },
  { slug: '/offers/:tier', name: 'Offer detail (one per tier)', source: 'each tier' },
  { slug: '/about',     name: 'About',           source: 'owner + credibility' },
  { slug: '/work',      name: 'Work & results',  source: 'proof of work (hidden if empty)' },
  { slug: '/insights',  name: 'Insights',        source: 'content topics + published work' },
  { slug: '/faq',       name: 'FAQ',             source: 'knowledge base' },
  { slug: '/contact',   name: 'Contact / Book',  source: 'front door' },
  { slug: '/legal/*',   name: 'Terms, Privacy, Refund', source: 'payments & policies' },
]

// ─────────────────────────────────────────────
// Small state helpers (nested paths like "offers.tiers.0.name")
// ─────────────────────────────────────────────
function getIn(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}
function setIn(obj, path, value) {
  const keys = Array.isArray(path) ? path : path.split('.')
  if (keys.length === 0) return value
  const [k, ...rest] = keys
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj || {}) }
  clone[k] = setIn(obj ? obj[k] : undefined, rest, value)
  return clone
}
function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}
function deepMerge(base, patch) {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch === undefined ? base : patch
  const out = { ...base }
  for (const key of Object.keys(patch)) {
    out[key] = isPlainObject(base[key]) && isPlainObject(patch[key])
      ? deepMerge(base[key], patch[key])
      : patch[key]
  }
  return out
}
const slugify = s => (s || '').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
const clean = list => (list || []).map(s => (typeof s === 'string' ? s.trim() : s)).filter(Boolean)

const WizardContext = createContext(null)
const useWizard = () => useContext(WizardContext)

// ─────────────────────────────────────────────
// Field primitives (bound to wizard state by path)
// ─────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm'

function Field({ label, hint, required, children }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function Text({ path, label, hint, placeholder, required, type = 'text', prefix }) {
  const { data, update } = useWizard()
  const value = getIn(data, path) ?? ''
  const input = (
    <input
      type={type}
      className={prefix ? 'flex-1 px-3 py-2 text-sm text-gray-900 outline-none bg-white min-w-0' : inputCls}
      value={value}
      placeholder={placeholder}
      onChange={e => update(path, e.target.value)}
    />
  )
  return (
    <Field label={label} hint={hint} required={required}>
      {prefix ? (
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
          <span className="px-2.5 py-2 bg-gray-100 text-gray-500 text-sm border-r border-gray-300 whitespace-nowrap">{prefix}</span>
          {input}
        </div>
      ) : input}
    </Field>
  )
}

function Area({ path, label, hint, placeholder, required, rows = 3 }) {
  const { data, update } = useWizard()
  return (
    <Field label={label} hint={hint} required={required}>
      <textarea rows={rows} className={inputCls} value={getIn(data, path) ?? ''} placeholder={placeholder} onChange={e => update(path, e.target.value)} />
    </Field>
  )
}

function Select({ path, label, hint, options, required }) {
  const { data, update } = useWizard()
  return (
    <Field label={label} hint={hint} required={required}>
      <select className={inputCls} value={getIn(data, path) ?? ''} onChange={e => update(path, e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

function Toggle({ path, label, hint }) {
  const { data, update } = useWizard()
  const checked = !!getIn(data, path)
  return (
    <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer py-1">
      <input type="checkbox" checked={checked} onChange={e => update(path, e.target.checked)} className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <span>
        {label}
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  )
}

// Single choice shown as selectable cards
function Choice({ path, label, hint, options, columns = 2, required }) {
  const { data, update } = useWizard()
  const current = getIn(data, path)
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns]
  return (
    <Field label={label} hint={hint} required={required}>
      <div className={`grid grid-cols-1 ${cols} gap-2`} role="radiogroup">
        {options.map(o => {
          const active = current === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => update(path, o.value)}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                active ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className={`block font-medium ${active ? 'text-blue-800' : 'text-gray-900'}`}>{o.label}</span>
              {o.hint && <span className="block text-xs text-gray-500 mt-0.5">{o.hint}</span>}
            </button>
          )
        })}
      </div>
    </Field>
  )
}

// Multiple choice stored as an array of values
function MultiChoice({ path, label, hint, options }) {
  const { data, update } = useWizard()
  const current = getIn(data, path) || []
  const toggle = v => update(path, current.includes(v) ? current.filter(x => x !== v) : [...current, v])
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const active = current.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(o.value)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                active ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </Field>
  )
}

function AddButton({ onClick, label = 'Add' }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
      <Plus className="w-3.5 h-3.5 mr-1" />{label}
    </button>
  )
}

function StringList({ path, label, hint, placeholder, addLabel = 'Add', max = 10 }) {
  const { data, update } = useWizard()
  const list = getIn(data, path) || []
  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {list.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputCls} value={v} placeholder={typeof placeholder === 'function' ? placeholder(i) : placeholder} onChange={e => update(`${path}.${i}`, e.target.value)} />
            <button type="button" aria-label="Remove" onClick={() => update(path, list.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {list.length < max && <AddButton onClick={() => update(path, [...list, ''])} label={addLabel} />}
      </div>
    </Field>
  )
}

function FieldByType({ f, path }) {
  if (f.type === 'area') return <Area path={path} label={f.label} hint={f.hint} placeholder={f.placeholder} rows={f.rows || 2} />
  if (f.type === 'select') return <Select path={path} label={f.label} hint={f.hint} options={f.options} />
  return <Text path={path} label={f.label} hint={f.hint} placeholder={f.placeholder} type={f.inputType || 'text'} />
}

function CardList({ path, label, hint, fields, blank, itemLabel, addLabel = 'Add', max = 10, emptyText }) {
  const { data, update } = useWizard()
  const list = getIn(data, path) || []
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">{label}</h4>
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
        </div>
        {list.length < max && <AddButton onClick={() => update(path, [...list, { ...blank }])} label={addLabel} />}
      </div>
      {list.length === 0 && emptyText && <p className="text-xs text-gray-500 italic">{emptyText}</p>}
      {list.map((_, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">{itemLabel} {i + 1}</p>
            <button type="button" aria-label={`Remove ${itemLabel} ${i + 1}`} onClick={() => update(path, list.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
                <FieldByType f={f} path={`${path}.${i}.${f.key}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">{title}</h4>
      {children}
    </section>
  )
}

// Short guidance drawn from the book, shown at the top of steps
function BookNote({ chapter, children }) {
  return (
    <div className="flex gap-3 bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-900">
      <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
      <div>
        <p className="text-xs font-semibold text-blue-700 mb-0.5">From The One-Person Company, {chapter}</p>
        <p className="text-blue-900/90">{children}</p>
      </div>
    </div>
  )
}

function Warning({ children }) {
  return (
    <p className="flex gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </p>
  )
}

// ─────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────
const STEPS = [
  { id: 1,  label: 'Your business in a few lines', short: 'Start',               icon: Sparkles },
  { id: 2,  label: 'You & your business',          short: 'Identity',            icon: Building2 },
  { id: 3,  label: 'Who you help',                 short: 'Positioning',         icon: Target },
  { id: 4,  label: 'Offers & pricing',             short: 'Offers & pricing',    icon: Layers },
  { id: 5,  label: 'Proof of your work',           short: 'Proof of work',       icon: Award },
  { id: 6,  label: 'How clients reach you',        short: 'Front door',          icon: DoorOpen },
  { id: 7,  label: 'Policies & FAQs',              short: 'Knowledge base',      icon: BookOpen },
  { id: 8,  label: 'Brand look & voice',           short: 'Brand & style',       icon: Palette },
  { id: 9,  label: 'Your AI team',                 short: 'AI agents',           icon: Bot },
  { id: 10, label: 'Payments & compliance',        short: 'Payments',            icon: Wallet },
  { id: 11, label: 'Social & publishing',          short: 'Social & publishing', icon: Share2 },
  { id: 12, label: 'Website address',              short: 'Website address',     icon: Globe },
  { id: 13, label: 'Review & build',               short: 'Review & build',      icon: Rocket },
]

function StepHeader({ step, intro }) {
  const Icon = STEPS[step - 1].icon
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-600">Step {step} of {STEPS.length}</p>
          <h2 className="text-xl font-bold text-gray-900">{STEPS[step - 1].label}</h2>
        </div>
      </div>
      {intro && <p className="text-sm text-gray-600 mt-3">{intro}</p>}
    </div>
  )
}

// ── STEP 1 — Start ─────────────────────────────
const BUSINESS_TYPES = [
  { value: 'consulting',  label: 'Consultant / advisor',   hint: 'Strategy, finance, tech, HR, legal' },
  { value: 'freelance',   label: 'Freelancer / creative',  hint: 'Design, writing, video, development' },
  { value: 'coaching',    label: 'Coach / trainer',        hint: 'Career, fitness, life, business' },
  { value: 'creator',     label: 'Creator / educator',     hint: 'Courses, ebooks, templates, community' },
  { value: 'local',       label: 'Local business',         hint: 'Bakery, salon, studio, tutor, clinic' },
  { value: 'other',       label: 'Something else',         hint: 'Describe it above' },
]

function Step1({ onAiDraft, aiState }) {
  const { data } = useWizard()
  return (
    <div className="space-y-6">
      <StepHeader step={1} intro="Describe your business the way you'd explain it to a friend. Our AI uses this to draft the rest of the wizard, and you can edit everything afterwards." />
      <Area
        path="start.description"
        label="What does your business do, and for whom?"
        required
        rows={4}
        placeholder="e.g. I'm a chartered accountant in Kolkata. I help freelancers and small agencies set up GST, file returns on time and stop overpaying tax. Most clients find me through LinkedIn and referrals."
      />
      <Choice path="start.businessType" label="Which describes you best?" options={BUSINESS_TYPES} columns={3} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Choice
          path="start.market"
          label="Where are your clients?"
          options={[
            { value: 'india',  label: 'India',            hint: 'Prices in ₹' },
            { value: 'global', label: 'Outside India',    hint: 'Prices in $' },
            { value: 'both',   label: 'Both',             hint: 'Separate ₹ and $ prices' },
          ]}
          columns={3}
        />
        <Select
          path="start.language"
          label="Website language"
          options={[
            { value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' },
            { value: 'bn', label: 'Bengali' }, { value: 'en-hi', label: 'English + Hindi' },
          ]}
        />
      </div>

      <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="text-sm text-gray-700">
          <p className="font-medium text-gray-900">Let AI fill in the next steps</p>
          <p className="text-xs text-gray-500">It drafts positioning, offers and FAQs from your description. Prices and facts stay yours to confirm.</p>
        </div>
        <button
          type="button"
          onClick={onAiDraft}
          disabled={!data.start.description.trim() || aiState.status === 'loading'}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {aiState.status === 'loading'
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Drafting…</>
            : <><Sparkles className="w-4 h-4 mr-2" />Draft with AI</>}
        </button>
      </div>
      {aiState.status === 'done' && <p className="text-sm text-green-700">Draft added. Review each step, especially prices, before you build.</p>}
      {aiState.status === 'error' && <Warning>{aiState.message}</Warning>}
    </div>
  )
}

// ── STEP 2 — Identity ──────────────────────────
function Step2() {
  return (
    <div className="space-y-6">
      <StepHeader step={2} intro="These details appear in the header, footer, About page and contact page." />
      <Section title="Business">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Text path="identity.brandName" label="Business or brand name" required placeholder="e.g. Clear Books Studio" />
          <Text path="identity.tagline" label="Tagline" hint="Leave blank and AI writes one from your positioning" placeholder="e.g. Tax sorted for freelancers" />
          <Text path="identity.city" label="City" placeholder="Kolkata" />
          <Text path="identity.country" label="Country" placeholder="India" />
          <Text path="identity.logoUrl" label="Logo URL" hint="Optional. A text logo is made from your name if blank" placeholder="https://…" />
          <Select
            path="identity.timezone"
            label="Time zone"
            options={['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'UTC'].map(v => ({ value: v, label: v }))}
          />
        </div>
      </Section>
      <Section title="You">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Text path="identity.ownerName" label="Your name" required placeholder="Priya Sharma" />
          <Text path="identity.ownerRole" label="Your title" placeholder="Founder & Tax Consultant" />
          <Text path="identity.email" label="Business email" type="email" required placeholder="hello@clearbooks.in" />
          <Text path="identity.whatsapp" label="Phone / WhatsApp" placeholder="+91 98765 43210" />
          <Text path="identity.photoUrl" label="Your photo URL" hint="A real photo builds trust on a one-person site" placeholder="https://…" />
        </div>
      </Section>
    </div>
  )
}

// ── STEP 3 — Positioning ───────────────────────
const NICHE_DIMENSIONS = [
  { key: 'pain',   label: 'Expensive pain',     low: 'A minor annoyance',              high: 'Costs them money every month' },
  { key: 'budget', label: 'Existing budget',    low: 'They pay nobody for this yet',   high: 'They already pay someone for it' },
  { key: 'reach',  label: 'Reachable buyers',   low: 'Hard to name any',               high: 'I can name 50 and reach them this week' },
  { key: 'repeat', label: 'Repeatable work',    low: 'Every job is custom',            high: 'Most of each job reuses the last one' },
  { key: 'cred',   label: 'Your credibility',   low: 'One of many providers',          high: 'My background makes me the obvious pick' },
]

function Step3() {
  const { data, update } = useWizard()
  const p = data.positioning
  const score = Object.values(p.nicheScore).reduce((a, b) => a + Number(b), 0)
  const blank = t => <span className="text-gray-400">{t}</span>
  return (
    <div className="space-y-6">
      <StepHeader step={3} intro="Your whole website is built around one sentence about who you help. Be specific; a narrow site converts better than a broad one." />
      <BookNote chapter="Chapter 3">
        Narrow beats clever. Visitors who instantly recognise themselves are already half convinced, so the site can spend its space on booking a conversation instead of explaining who you are.
      </BookNote>

      <Section title="Your positioning sentence">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Text path="positioning.buyer" label="I help…" required hint="A specific group, not 'everyone' or 'small businesses'" placeholder="freelance designers and small agencies in India" />
          <Text path="positioning.problem" label="…who struggle with…" required hint="A recurring problem that costs them money or stress" placeholder="messy GST filings and surprise tax bills" />
          <Text path="positioning.outcome" label="…to get…" required hint="A result they can measure or clearly see" placeholder="clean books and on-time filings" />
          <Text path="positioning.timeframe" label="…within…" placeholder="30 days" />
          <Text path="positioning.fear" label="…without…" hint="The thing they worry about when hiring someone like you" placeholder="learning accounting software or chasing a CA" />
        </div>
        <div className="rounded-xl bg-gray-900 text-white px-5 py-4 text-base leading-relaxed">
          I help {p.buyer || blank('[specific buyer]')} who struggle with {p.problem || blank('[expensive problem]')} to get {p.outcome || blank('[measurable outcome]')}
          {p.timeframe ? <> within {p.timeframe}</> : null}
          {p.fear ? <>, without {p.fear}</> : null}.
        </div>
      </Section>

      <Section title="Why you">
        <Area path="positioning.alreadyTried" label="What have your clients already tried that didn't work?" rows={2} placeholder="Doing it themselves with YouTube videos, or a cheap CA who files late and never explains anything." />
        <Area path="positioning.credibility" label="What makes you the obvious choice?" hint="Experience, qualifications, results, or a personal story. Only real facts; the AI will not invent credentials." rows={3} placeholder="Chartered accountant for 9 years, ex-Deloitte. I've set up GST for 140+ freelancers." />
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StringList path="positioning.forWho" label="This is for you if…" placeholder={i => ['You invoice clients and hate the paperwork', 'You crossed ₹20 lakh and need GST', 'You want one person who knows your numbers'][i] || 'Another sign'} addLabel="Add a sign" max={6} />
        <StringList path="positioning.notFor" label="This is not for you if…" hint="Filters out bad-fit enquiries" placeholder={i => ['You want the cheapest filing possible', 'You run a company with a finance team'][i] || 'Another sign'} addLabel="Add a sign" max={6} />
      </div>

      <Section title="Quick niche check (private, not shown on your site)">
        <p className="text-xs text-gray-500">Rate your niche from 1 to 5 on each point. The book suggests aiming for 18 or more out of 25.</p>
        <div className="space-y-4">
          {NICHE_DIMENSIONS.map(dim => (
            <div key={dim.key}>
              <div className="flex justify-between text-sm">
                <label htmlFor={`niche-${dim.key}`} className="font-medium text-gray-700">{dim.label}</label>
                <span className="font-semibold text-gray-900">{p.nicheScore[dim.key]}</span>
              </div>
              <input
                id={`niche-${dim.key}`}
                type="range" min="1" max="5" step="1"
                value={p.nicheScore[dim.key]}
                onChange={e => update(`positioning.nicheScore.${dim.key}`, Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400"><span>{dim.low}</span><span>{dim.high}</span></div>
            </div>
          ))}
        </div>
        <div className={`rounded-lg px-4 py-3 text-sm ${score >= 18 ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
          <strong>{score} / 25.</strong>{' '}
          {score >= 18
            ? 'A strong niche to build a website around.'
            : 'Consider narrowing your buyer or problem before launch. You can still build the site and refine it later.'}
        </div>
      </Section>
    </div>
  )
}

// ── STEP 4 — Offers & pricing ladder ───────────
const TIER_META = {
  front_door: {
    title: 'Tier 1 · Paid first step',
    purpose: 'A small, fixed-price starting offer: a diagnostic, audit, trial session or strategy call. It turns strangers into clients and becomes the plan for Tier 2.',
    namePh: 'e.g. Tax Health Check', durationPh: 'e.g. 1 week / 60-minute call', inr: '4999', usd: '99',
  },
  core: {
    title: 'Tier 2 · Main offer',
    purpose: 'Your core outcome, sold as a fixed scope for a fixed price. Most clients should buy this.',
    namePh: 'e.g. GST Setup & First-Year Filing', durationPh: 'e.g. 4 weeks', inr: '35000', usd: '650',
  },
  recurring: {
    title: 'Tier 3 · Ongoing support',
    purpose: 'Monthly work that keeps clients with you: retainer, membership or ongoing coaching. Predictable income lets you say no to bad-fit work.',
    namePh: 'e.g. Monthly Books & Filing', durationPh: 'e.g. 3-month minimum', inr: '6000', usd: '150',
  },
}

function TierCard({ index }) {
  const { data, update } = useWizard()
  const tier = data.offers.tiers[index]
  const meta = TIER_META[tier.tier]
  const market = data.start.market
  const base = `offers.tiers.${index}`
  const isMostBought = data.offers.mostBought === tier.tier
  const nameLooksHourly = /\bhour|\/hr\b|per hour/i.test(`${tier.name} ${tier.summary}`)
  return (
    <div className={`rounded-xl border p-4 sm:p-5 space-y-4 ${isMostBought ? 'border-blue-500 ring-1 ring-blue-500 bg-white' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h4 className="font-semibold text-gray-900">{meta.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5 max-w-xl">{meta.purpose}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer flex-shrink-0">
          <input type="radio" name="mostBought" checked={isMostBought} onChange={() => update('offers.mostBought', tier.tier)} className="text-blue-600 focus:ring-blue-500" />
          Highlight as most popular
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Text path={`${base}.name`} label="Offer name" required={index === 0} placeholder={meta.namePh} />
        <Text path={`${base}.duration`} label={tier.tier === 'recurring' ? 'Minimum commitment' : 'Duration'} placeholder={meta.durationPh} />
        <div className="sm:col-span-2">
          <Area path={`${base}.summary`} label="The result the client gets" rows={2} placeholder="In one or two sentences, describe the outcome, not your activities." />
        </div>
        <div className="sm:col-span-2">
          <Area path={`${base}.deliverables`} label="What's included" hint="One item per line" rows={3} placeholder={'Review of last 12 months of invoices\nWritten report with 5 fixes\n45-minute walkthrough call'} />
        </div>
        {(market === 'india' || market === 'both') && (
          <Text path={`${base}.priceInr`} label={tier.tier === 'recurring' ? 'Price per month (₹)' : 'Price (₹)'} required={index === 0} type="number" prefix="₹" placeholder={meta.inr} />
        )}
        {(market === 'global' || market === 'both') && (
          <Text path={`${base}.priceUsd`} label={tier.tier === 'recurring' ? 'Price per month ($)' : 'Price ($)'} required={index === 0 && market === 'global'} type="number" prefix="$" placeholder={meta.usd} />
        )}
      </div>
      {nameLooksHourly && <Warning>This looks like hourly pricing. The book recommends selling a named outcome at a fixed price, so faster delivery increases your earnings instead of reducing them.</Warning>}
      {index === 0 && tier.name && !tier.priceInr && !tier.priceUsd && (
        <Warning>A free first step tends to attract people looking for free advice. Even a small price filters for serious buyers.</Warning>
      )}
    </div>
  )
}

function Step4() {
  const { data } = useWizard()
  return (
    <div className="space-y-6">
      <StepHeader step={4} intro="Every site uses a three-step pricing ladder. Enter your own prices; the AI will never change or invent them." />
      <BookNote chapter="Chapter 6">
        Three tiers, no more: one to start, one to build, one to keep. Price against what the problem costs the client, and price each market in its own currency rather than converting.
      </BookNote>
      <div className="space-y-4">
        {data.offers.tiers.map((_, i) => <TierCard key={i} index={i} />)}
      </div>

      <Section title="Optional: a low-cost product">
        <Toggle path="offers.product.enabled" label="I also sell a template, ebook, course or kit" hint="Keeps people who can't afford Tier 1 yet in touch with you" />
        {data.offers.product.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Text path="offers.product.name" label="Product name" placeholder="GST Starter Kit for Freelancers" />
            <Text path="offers.product.link" label="Purchase link (if it already exists)" placeholder="https://…" />
            {(data.start.market !== 'global') && <Text path="offers.product.priceInr" label="Price (₹)" type="number" prefix="₹" placeholder="999" />}
            {(data.start.market !== 'india') && <Text path="offers.product.priceUsd" label="Price ($)" type="number" prefix="$" placeholder="19" />}
            <div className="sm:col-span-2"><Area path="offers.product.summary" label="What's inside" rows={2} /></div>
          </div>
        )}
      </Section>

      <Section title="Terms shown on your offer pages">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            path="offers.paymentTerms"
            label="Payment terms"
            options={[
              { value: '50_50', label: '50% upfront, 50% on delivery' },
              { value: '100_upfront', label: '100% upfront' },
              { value: 'monthly_advance', label: 'Monthly in advance' },
              { value: 'milestones', label: 'By milestones' },
            ]}
          />
          <Select
            path="offers.revisionRounds"
            label="Revision rounds included"
            options={[{ value: '1', label: '1 round' }, { value: '2', label: '2 rounds' }, { value: '3', label: '3 rounds' }, { value: 'na', label: 'Not applicable' }]}
          />
          <Select
            path="offers.priceDisplay"
            label="Show prices on the website?"
            options={[
              { value: 'show', label: 'Show all prices' },
              { value: 'from', label: 'Show "starting from"' },
              { value: 'tier1_only', label: 'Show Tier 1 only' },
            ]}
          />
        </div>
      </Section>
    </div>
  )
}

// ── STEP 5 — Proof of work ─────────────────────
function Step5() {
  return (
    <div className="space-y-6">
      <StepHeader step={5} intro="Real proof, even small, persuades more than big claims. Anything you leave empty is hidden on your site, never filled with made-up content." />
      <BookNote chapter="Chapter 5">
        Show the work, not opinions about the work. A real result, a before-and-after or a mistake you fixed earns more trust than any stock graphic.
      </BookNote>

      <Section title="Experience">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Text path="proof.yearsExperience" label="Years of experience" type="number" placeholder="9" />
          <Text path="proof.clientsServed" label="Clients or projects completed" hint="Only if you have counted" placeholder="140" />
        </div>
        <StringList path="proof.credentials" label="Qualifications, certifications or past roles" placeholder="e.g. Chartered Accountant (ICAI)" addLabel="Add credential" max={6} />
      </Section>

      <CardList
        path="proof.results"
        label="Measured results"
        hint="Numbers you can back up, e.g. '₹2.4L tax saved for one client'"
        itemLabel="Result"
        addLabel="Add result"
        max={4}
        blank={{ number: '', label: '' }}
        emptyText="No results yet. The results strip will be hidden."
        fields={[
          { key: 'number', label: 'Number', placeholder: '₹2.4L' },
          { key: 'label', label: 'What it measures', placeholder: 'tax saved for a design studio in year one' },
        ]}
      />

      <CardList
        path="proof.caseStudies"
        label="Case studies"
        hint="Short stories of real client work. Anonymise the client if needed."
        itemLabel="Case study"
        addLabel="Add case study"
        max={6}
        blank={{ client: '', problem: '', whatYouDid: '', result: '', link: '' }}
        emptyText="No case studies yet. The Work page will show your process instead."
        fields={[
          { key: 'client', label: 'Client (or description)', placeholder: 'A 6-person design agency in Pune' },
          { key: 'result', label: 'Result', placeholder: 'Filed 14 months of pending returns, zero penalties' },
          { key: 'problem', label: 'Their problem', type: 'area', wide: true },
          { key: 'whatYouDid', label: 'What you did', type: 'area', wide: true },
          { key: 'link', label: 'Link (optional)', placeholder: 'https://…', wide: true },
        ]}
      />

      <CardList
        path="proof.testimonials"
        label="Testimonials"
        hint="Real quotes only, with the client's permission"
        itemLabel="Testimonial"
        addLabel="Add testimonial"
        max={8}
        blank={{ name: '', role: '', quote: '' }}
        emptyText="No testimonials yet. The section will be hidden."
        fields={[
          { key: 'name', label: 'Name', placeholder: 'Rahul M.' },
          { key: 'role', label: 'Role / company', placeholder: 'Freelance UX designer' },
          { key: 'quote', label: 'Quote', type: 'area', wide: true },
        ]}
      />
    </div>
  )
}

// ── STEP 6 — Front door ────────────────────────
function Step6() {
  const { data } = useWizard()
  const fd = data.frontDoor
  return (
    <div className="space-y-6">
      <StepHeader step={6} intro="Decide what visitors should do next. Every enquiry, from any channel, lands in one inbox in your dashboard." />
      <BookNote chapter="Chapters 4 and 5">
        A one-person company converts through conversations, not landing pages. Send every enquiry to one queue, and end your pages with a specific invitation to talk about the visitor's own situation.
      </BookNote>

      <Choice
        path="frontDoor.primaryCta"
        label="Main action on your website"
        required
        columns={2}
        options={[
          { value: 'book_call',    label: 'Book a short call',     hint: 'Visitors pick a slot on your calendar' },
          { value: 'buy_tier1',    label: 'Buy your Tier 1 offer', hint: 'Straight to checkout for the paid first step' },
          { value: 'whatsapp',     label: 'Message on WhatsApp',   hint: 'Opens a chat with a pre-filled message' },
          { value: 'enquiry_form', label: 'Fill an enquiry form',  hint: 'You reply by email' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fd.primaryCta === 'book_call' && (
          <Text path="frontDoor.bookingUrl" label="Booking link" required hint="Calendly, Cal.com, Google Calendar or Zoho Bookings" placeholder="https://cal.com/yourname/20min" />
        )}
        {fd.primaryCta === 'whatsapp' && !data.identity.whatsapp && (
          <Warning>Add your WhatsApp number in Step 2 to use this option.</Warning>
        )}
        <Text path="frontDoor.ctaLabel" label="Button text" hint="Leave blank and AI will write one" placeholder="Book a free 20-minute fit call" />
        <Text path="frontDoor.responseTime" label="Response time you promise" placeholder="Within 1 business day" />
        <Text path="frontDoor.workingHours" label="Working hours" placeholder="Mon–Fri, 10am–6pm IST" />
      </div>

      <Area
        path="frontDoor.invitation"
        label="Your invitation line"
        hint="Shown at the end of pages and posts. Ask about their specific situation, not 'let me know your thoughts'."
        rows={2}
        placeholder="Tell me which part of your GST process is stuck, and I'll reply with what I would fix first."
      />

      <Section title="Other ways to reach you">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <Toggle path="frontDoor.channels.form" label="Enquiry form on the Contact page" />
          <Toggle path="frontDoor.channels.whatsapp" label="WhatsApp button" />
          <Toggle path="frontDoor.channels.email" label="Email address" />
          <Toggle path="frontDoor.channels.booking" label="Booking calendar" />
        </div>
      </Section>

      <StringList
        path="frontDoor.formQuestions"
        label="Enquiry form questions"
        hint="Name and email are always included. Keep it to 3–5 questions that help you prepare."
        placeholder="Question"
        addLabel="Add question"
        max={6}
      />
    </div>
  )
}

// ── STEP 7 — Knowledge base ────────────────────
function Step7() {
  return (
    <div className="space-y-6">
      <StepHeader step={7} intro="These become your FAQ page, offer terms and legal pages. Your AI agents also read them, so they quote your real policies instead of guessing." />
      <BookNote chapter="Chapter 4">
        An agent without your current rate card, policies and past work will confidently invent all three. Keep one source of truth that you edit and agents only read.
      </BookNote>

      <CardList
        path="knowledge.process"
        label="How working with you goes"
        hint="Shown as steps on your offer pages"
        itemLabel="Step"
        addLabel="Add step"
        max={7}
        blank={{ title: '', detail: '' }}
        fields={[
          { key: 'title', label: 'Step name', placeholder: 'Discovery call' },
          { key: 'detail', label: 'What happens', placeholder: '20 minutes to understand your situation' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StringList path="knowledge.included" label="Always included" placeholder="e.g. Written summary after every call" addLabel="Add item" max={8} />
        <StringList path="knowledge.notIncluded" label="Not included (out of scope)" placeholder="e.g. Representation in tax disputes" addLabel="Add item" max={8} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Area path="knowledge.refundPolicy" label="Refund & cancellation policy" rows={3} hint="Leave blank for a standard draft you can edit later" placeholder="Tier 1 is refundable before the call. Deposits for Tier 2 are non-refundable once work starts." />
        <Area path="knowledge.toolsUsed" label="Tools or methods you use (optional)" rows={3} placeholder="Zoho Books, Tally, Google Drive" />
      </div>

      <CardList
        path="knowledge.faqs"
        label="Frequently asked questions"
        hint="Add the questions clients really ask. AI adds a few more from your offers, which you can edit."
        itemLabel="FAQ"
        addLabel="Add FAQ"
        max={12}
        blank={{ question: '', answer: '' }}
        emptyText="No FAQs yet. AI will draft them from your offers and policies."
        fields={[
          { key: 'question', label: 'Question', wide: true },
          { key: 'answer', label: 'Answer', type: 'area', wide: true },
        ]}
      />
    </div>
  )
}

// ── STEP 8 — Brand & style ─────────────────────
function Step8() {
  return (
    <div className="space-y-6">
      <StepHeader step={8} intro="Your template layout stays the same. These choices change its colours, type and writing voice." />
      <Choice
        path="brand.style"
        label="Visual style"
        columns={4}
        options={[
          { value: 'minimal',      label: 'Minimal',      hint: 'Lots of white space, quiet' },
          { value: 'professional', label: 'Professional', hint: 'Structured, corporate buyers' },
          { value: 'warm',         label: 'Warm',         hint: 'Friendly, personal services' },
          { value: 'bold',         label: 'Bold',         hint: 'Strong colour, creative work' },
        ]}
      />
      <Choice
        path="brand.tone"
        label="Writing voice"
        columns={4}
        options={[
          { value: 'plain',     label: 'Plain & direct', hint: 'No jargon, no hype' },
          { value: 'expert',    label: 'Expert',         hint: 'Precise and credible' },
          { value: 'friendly',  label: 'Friendly',       hint: 'Conversational and warm' },
          { value: 'energetic', label: 'Energetic',      hint: 'Upbeat and motivating' },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ColorField />
        <Text path="brand.referenceSite" label="A website whose feel you like (optional)" placeholder="https://…" />
      </div>
      <Text path="brand.avoidWords" label="Words or claims to never use" hint="Comma-separated. Applies to the website and all AI agents." placeholder="guaranteed, overnight, get rich, #1" />
    </div>
  )
}

function ColorField() {
  const { data, update } = useWizard()
  return (
    <Field label="Main brand colour">
      <div className="flex items-center gap-3">
        <input type="color" value={data.brand.primaryColor} onChange={e => update('brand.primaryColor', e.target.value)} className="h-10 w-14 rounded border border-gray-300 cursor-pointer bg-white" aria-label="Pick brand colour" />
        <input className={inputCls} value={data.brand.primaryColor} onChange={e => update('brand.primaryColor', e.target.value)} />
      </div>
    </Field>
  )
}

// ── STEP 9 — AI agents ─────────────────────────
const AGENT_GROUPS = [
  { name: 'Marketing & content', agents: [
    { id: 'blog',        title: 'Blog posts & articles',        live: true },
    { id: 'social',      title: 'Social media captions',        live: true },
    { id: 'email',       title: 'Email sequences',              live: true },
    { id: 'landing',     title: 'Website & landing page copy',  live: true },
    { id: 'brand',       title: 'Brand identity & positioning' },
    { id: 'local_seo',   title: 'Local SEO & Google Business' },
  ]},
  { name: 'Sales & clients', agents: [
    { id: 'facebook',    title: 'Facebook marketing',           live: true },
    { id: 'proposals',   title: 'Pitch decks & proposals',      live: true },
    { id: 'sales',       title: 'Sales scripts & objections' },
    { id: 'whatsapp',    title: 'WhatsApp business messaging' },
    { id: 'support',     title: 'Customer support & retention' },
  ]},
  { name: 'Strategy & planning', agents: [
    { id: 'strategy',    title: 'Business plan & validation' },
    { id: 'pricing',     title: 'Pricing & packages' },
    { id: 'research',    title: 'Competitor & customer research' },
  ]},
  { name: 'Money & compliance', agents: [
    { id: 'finance',     title: 'Budgeting & cash flow' },
    { id: 'compliance',  title: 'GST, invoices & registration basics' },
    { id: 'contracts',   title: 'Contracts & policies' },
  ]},
  { name: 'Operations', agents: [
    { id: 'operations',  title: 'Workflows & automation' },
    { id: 'productivity', title: 'Weekly planning & focus' },
  ]},
]

function Step9() {
  const { data, update } = useWizard()
  const enabled = data.agents.enabled
  const toggle = id => update('agents.enabled', enabled.includes(id) ? enabled.filter(x => x !== id) : [...enabled, id])
  return (
    <div className="space-y-6">
      <StepHeader step={9} intro="Choose the specialists you want in your dashboard. They all share your positioning, offers, policies and voice from the previous steps." />
      <BookNote chapter="Chapters 2 and 8">
        Agents collapse internal work; they don't create demand. Anything a client will see should be drafted by an agent and approved by you. The promise, the price and the apology stay human.
      </BookNote>

      <div className="space-y-5">
        {AGENT_GROUPS.map(group => (
          <div key={group.name}>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">{group.name}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.agents.map(agent => {
                const on = enabled.includes(agent.id)
                return (
                  <label key={agent.id} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border cursor-pointer text-sm ${on ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <span className="flex items-center gap-2.5">
                      <input type="checkbox" checked={on} onChange={() => toggle(agent.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-gray-900">{agent.title}</span>
                    </span>
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${agent.live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {agent.live ? 'Available' : 'Coming soon'}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Section title="How much agents may do on their own">
        <Choice
          path="agents.autonomy"
          columns={2}
          options={[
            { value: 'suggest',    label: 'Suggest only', hint: 'Agents give ideas; you write everything' },
            { value: 'draft_only', label: 'Draft, I approve (recommended)', hint: 'Nothing reaches a client until you approve it' },
          ]}
        />
        <div className="space-y-1">
          <Toggle path="agents.guardrails.onlyListedPrices" label="Only quote prices from my offers" />
          <Toggle path="agents.guardrails.noDeadlines" label="Never promise delivery dates or availability" />
          <Toggle path="agents.guardrails.noInventedFacts" label="Never invent statistics, clients or testimonials" />
          <Toggle path="agents.guardrails.logEveryRun" label="Keep a log of everything agents produce" hint="Review it weekly, as the book suggests" />
        </div>
        <Text path="agents.monthlySpendCap" label="Monthly spend limit for agent sessions" type="number" prefix={data.start.market === 'global' ? '$' : '₹'} hint="Sessions pause when this is reached" placeholder="1000" />
      </Section>

      {enabled.includes('facebook') && (
        <Section title="Facebook marketing agent settings">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              path="agents.facebook.goal"
              label="Main campaign goal"
              options={[
                { value: '', label: 'Select a goal' },
                { value: 'lead_generation', label: 'Enquiries / leads' },
                { value: 'sales', label: 'Direct sales' },
                { value: 'traffic', label: 'Website visits' },
                { value: 'engagement', label: 'Page engagement' },
                { value: 'brand_awareness', label: 'Brand awareness' },
              ]}
            />
            <Text path="agents.facebook.monthlyBudget" label="Monthly ad budget" placeholder="₹10,000" />
            <div className="sm:col-span-2">
              <Text path="agents.facebook.audience" label="Audience to target on Facebook" hint="Leave blank to use your positioning buyer" placeholder="Freelancers in metro cities, 25–40" />
            </div>
            <div className="sm:col-span-2">
              <Text path="agents.facebook.competitorsToAvoid" label="Brands not to imitate" placeholder="Brand A, Brand B" />
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}

// ── STEP 10 — Payments & compliance ────────────
function Step10() {
  const { data } = useWizard()
  const pay = data.payments
  return (
    <div className="space-y-6">
      <StepHeader step={10} intro="Used for checkout, invoices and the legal pages on your site." />
      <BookNote chapter="Chapter 7">
        General guidance, not tax advice: service businesses in India usually need GST registration above ₹20 lakh turnover, and exports of services can be zero-rated under an annual Letter of Undertaking. Confirm your situation with a chartered accountant.
      </BookNote>

      <MultiChoice
        path="payments.gateways"
        label="How clients can pay"
        options={[
          { value: 'razorpay', label: 'Razorpay' }, { value: 'upi', label: 'UPI' },
          { value: 'bank_transfer', label: 'Bank transfer' }, { value: 'stripe', label: 'Stripe' },
          { value: 'paypal', label: 'PayPal' },
        ]}
      />

      <Section title="Business registration">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            path="payments.structure"
            label="Business structure"
            options={[
              { value: 'sole_proprietor', label: 'Sole proprietorship' },
              { value: 'opc', label: 'One Person Company (OPC)' },
              { value: 'llp', label: 'LLP' },
              { value: 'private_limited', label: 'Private limited' },
              { value: 'not_registered', label: 'Not registered yet' },
              { value: 'other', label: 'Other / outside India' },
            ]}
          />
          <Text path="payments.legalName" label="Legal name on invoices" hint="If different from your brand name" placeholder="Priya Sharma (Proprietor)" />
          <Select path="payments.gstRegistered" label="Registered for GST?" options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }, { value: 'not_sure', label: 'Not sure' }]} />
          {pay.gstRegistered === 'yes' && <Text path="payments.gstin" label="GSTIN" placeholder="19ABCDE1234F1Z5" />}
          <Select path="payments.exportClients" label="Do you invoice clients outside India?" options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
          {pay.exportClients === 'yes' && (
            <Select path="payments.lutFiled" label="Letter of Undertaking filed for this year?" options={[{ value: 'no', label: 'Not yet' }, { value: 'yes', label: 'Yes' }, { value: 'not_sure', label: 'Not sure' }]} />
          )}
          <Text path="payments.invoicePrefix" label="Invoice number prefix" placeholder="CBS-" />
        </div>
        {pay.exportClients === 'yes' && pay.lutFiled !== 'yes' && (
          <Warning>We'll remind you to file the LUT with your CA before invoicing foreign clients. It must be renewed each April.</Warning>
        )}
      </Section>

      <Section title="Legal pages to generate">
        <p className="text-xs text-gray-500">Drafted from your offers and policies. Have them reviewed before relying on them.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
          <Toggle path="payments.legalPages.terms" label="Terms of service" />
          <Toggle path="payments.legalPages.privacy" label="Privacy policy" />
          <Toggle path="payments.legalPages.refund" label="Refund policy" />
        </div>
      </Section>
    </div>
  )
}

// ── STEP 11 — Social & publishing ──────────────
function Step11() {
  const { data } = useWizard()
  return (
    <div className="space-y-6">
      <StepHeader step={11} intro="Links appear in your footer. Your publishing plan sets up the Insights page and the content agents." />
      <Section title="Social profiles">
        <p className="text-xs text-gray-500">Leave blank to hide an icon.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['linkedin', 'LinkedIn', 'https://linkedin.com/in/yourname'],
            ['instagram', 'Instagram', 'https://instagram.com/yourhandle'],
            ['facebook', 'Facebook', 'https://facebook.com/yourpage'],
            ['youtube', 'YouTube', 'https://youtube.com/@yourchannel'],
            ['x', 'X (Twitter)', 'https://x.com/yourhandle'],
            ['googleBusiness', 'Google Business Profile', 'https://g.page/…'],
          ].map(([key, label, ph]) => (
            <Text key={key} path={`channels.social.${key}`} label={label} placeholder={ph} type="url" />
          ))}
        </div>
      </Section>

      <Section title="Publishing plan">
        <BookNote chapter="Chapter 5">
          One real piece of work a week, turned into several short posts, compounds over time. You write the core piece; agents help with the variations.
        </BookNote>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            path="channels.mainPlatform"
            label="Where your buyers already read"
            options={[
              { value: 'linkedin', label: 'LinkedIn' }, { value: 'instagram', label: 'Instagram' },
              { value: 'youtube', label: 'YouTube' }, { value: 'facebook', label: 'Facebook' },
              { value: 'newsletter', label: 'Email newsletter' }, { value: 'whatsapp', label: 'WhatsApp groups' },
            ]}
          />
          <Select
            path="channels.cadence"
            label="How often you can publish"
            options={[{ value: 'weekly', label: 'Weekly' }, { value: 'fortnightly', label: 'Every two weeks' }, { value: 'monthly', label: 'Monthly' }, { value: 'not_yet', label: 'Not publishing yet' }]}
          />
        </div>
        <Toggle path="channels.newsletter" label="Add a newsletter signup to my site" />
        <StringList path="channels.contentTopics" label="Topics you can write about from real work" placeholder={i => ['GST mistakes freelancers make in year one', 'How I cleaned up 14 months of books in 3 weeks', 'What advance tax really means for you'][i] || 'Topic'} addLabel="Add topic" max={10} />
        <CardList
          path="channels.publishedWork"
          label="Work you've already published"
          hint="Posts, videos or talks to feature on your Insights page"
          itemLabel="Item"
          addLabel="Add item"
          max={8}
          blank={{ title: '', url: '' }}
          emptyText={data.channels.cadence === 'not_yet' ? 'Nothing yet. That’s fine; the Insights page starts empty.' : 'None added.'}
          fields={[
            { key: 'title', label: 'Title', placeholder: 'My GST checklist for freelancers' },
            { key: 'url', label: 'Link', placeholder: 'https://…', inputType: 'url' },
          ]}
        />
      </Section>
    </div>
  )
}

// ── STEP 12 — Website address ──────────────────
function Step12() {
  const { data } = useWizard()
  return (
    <div className="space-y-6">
      <StepHeader step={12} intro="Your site goes live on a free address first. You can connect your own domain now or later." />
      <div className="grid grid-cols-1 gap-4">
        <Field label="Free website address" hint="Lowercase letters, numbers and hyphens">
          <SubdomainInput />
        </Field>
        <Text path="site.customDomain" label="Your own domain (optional)" hint="We'll show the DNS records to add after the build" placeholder="www.clearbooks.in" />
        <Text path="site.notifyEmail" label="Send new enquiry alerts to" type="email" hint={`Defaults to ${data.identity.email || 'your business email'}`} placeholder={data.identity.email || 'you@example.com'} />
        <Text path="site.analyticsId" label="Google Analytics ID (optional)" placeholder="G-XXXXXXXXXX" />
      </div>
    </div>
  )
}

function SubdomainInput() {
  const { data, update } = useWizard()
  const suggestion = slugify(data.identity.brandName)
  return (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
      <input
        className="flex-1 px-3 py-2 text-sm text-gray-900 outline-none bg-white min-w-0"
        value={data.site.subdomain}
        placeholder={suggestion || 'yourbusiness'}
        onChange={e => update('site.subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
      />
      <span className="px-2.5 py-2 bg-gray-100 text-gray-500 text-sm border-l border-gray-300 whitespace-nowrap">{SITE_DOMAIN_SUFFIX}</span>
    </div>
  )
}

// ── STEP 13 — Review & build ───────────────────
function formatPrice(tier, market) {
  const inr = tier.priceInr ? `₹${Number(tier.priceInr).toLocaleString('en-IN')}` : ''
  const usd = tier.priceUsd ? `$${Number(tier.priceUsd).toLocaleString('en-US')}` : ''
  const suffix = tier.tier === 'recurring' ? '/mo' : ''
  const parts = market === 'india' ? [inr] : market === 'global' ? [usd] : [inr, usd]
  const shown = parts.filter(Boolean).map(p => p + suffix)
  return shown.length ? shown.join(' · ') : 'No price'
}

function Step13({ issues, onGoToStep, onBuild, onDownload, build }) {
  const { data } = useWizard()
  const p = data.positioning
  const required = issues.filter(i => i.level === 'required')
  const recommended = issues.filter(i => i.level === 'recommended')
  const niche = Object.values(p.nicheScore).reduce((a, b) => a + Number(b), 0)
  const ctaText = { book_call: 'Book a call', buy_tier1: 'Buy Tier 1', whatsapp: 'WhatsApp', enquiry_form: 'Enquiry form' }[data.frontDoor.primaryCta]

  return (
    <div className="space-y-6">
      <StepHeader step={13} intro="This is your one-page business summary. Your website is built from exactly this." />

      {/* One-page business sheet */}
      <div className="rounded-2xl border-2 border-gray-900 bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-900">{data.identity.brandName || 'Your business'}</h3>
          <span className="text-xs text-gray-500">{(data.site.subdomain || slugify(data.identity.brandName) || 'yourbusiness') + SITE_DOMAIN_SUFFIX}</span>
        </div>
        <p className="text-base text-gray-900 leading-relaxed">
          I help <strong>{p.buyer || '___'}</strong> who struggle with <strong>{p.problem || '___'}</strong> to get <strong>{p.outcome || '___'}</strong>
          {p.timeframe && <> within <strong>{p.timeframe}</strong></>}
          {p.fear && <> without <strong>{p.fear}</strong></>}.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {data.offers.tiers.map(t => (
            <div key={t.tier} className={`rounded-lg p-3 ${data.offers.mostBought === t.tier ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
              <p className={`text-xs ${data.offers.mostBought === t.tier ? 'text-blue-100' : 'text-gray-500'}`}>{TIER_META[t.tier].title.split(' · ')[0]}</p>
              <p className="font-semibold text-sm mt-0.5">{t.name || 'Not named'}</p>
              <p className="text-sm mt-1">{formatPrice(t, data.start.market)}</p>
            </div>
          ))}
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><dt className="text-xs text-gray-500">Main action</dt><dd className="font-medium text-gray-900">{ctaText}</dd></div>
          <div><dt className="text-xs text-gray-500">AI agents</dt><dd className="font-medium text-gray-900">{data.agents.enabled.length} selected</dd></div>
          <div><dt className="text-xs text-gray-500">Proof items</dt><dd className="font-medium text-gray-900">{data.proof.results.length + data.proof.caseStudies.length + data.proof.testimonials.length}</dd></div>
          <div><dt className="text-xs text-gray-500">Niche score</dt><dd className={`font-medium ${niche >= 18 ? 'text-green-700' : 'text-amber-700'}`}>{niche} / 25</dd></div>
        </dl>
      </div>

      {/* Pages */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Pages we'll build</h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {SITE_PAGES.map(pg => (
            <li key={pg.slug} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><span className="text-gray-900">{pg.name}</span> <span className="text-gray-500 text-xs">from {pg.source}</span></span>
            </li>
          ))}
        </ul>
      </div>

      {/* Issues */}
      {required.length > 0 && (
        <IssueList title="Needed before we can build" tone="red" items={required} onGoToStep={onGoToStep} />
      )}
      {recommended.length > 0 && (
        <IssueList title="Recommended, but you can add these later" tone="amber" items={recommended} onGoToStep={onGoToStep} />
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBuild}
          disabled={required.length > 0 || build.status === 'building'}
          className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {build.status === 'building'
            ? <><Loader2 className="w-5 h-5 animate-spin" />Building your website…</>
            : <><Rocket className="w-5 h-5" />Build my website</>}
        </button>
        <button type="button" onClick={onDownload} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />Download my answers (setup.json)
        </button>
        {build.status === 'done' && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            <strong>Your website is being built.</strong>{' '}
            {build.url ? <>Preview it at <a href={build.url} className="underline font-medium">{build.url}</a>.</> : 'We’ll email you when the preview is ready.'}
          </div>
        )}
        {build.status === 'error' && <Warning>{build.message}</Warning>}
      </div>
    </div>
  )
}

function IssueList({ title, tone, items, onGoToStep }) {
  const styles = tone === 'red'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-amber-50 border-amber-200 text-amber-800'
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <p className="font-semibold mb-2">{title}</p>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <span>{item.label}</span>
            <button type="button" onClick={() => onGoToStep(item.step)} className="text-xs underline font-medium flex-shrink-0">
              Go to step {item.step}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────
function getIssues(d) {
  const issues = []
  const req = (cond, label, step) => { if (!cond) issues.push({ label, step, level: 'required' }) }
  const rec = (cond, label, step) => { if (!cond) issues.push({ label, step, level: 'recommended' }) }
  const t1 = d.offers.tiers[0]
  const market = d.start.market

  req(d.start.description.trim(), 'Describe your business', 1)
  req(d.identity.brandName.trim(), 'Business name', 2)
  req(d.identity.ownerName.trim(), 'Your name', 2)
  req(/\S+@\S+\.\S+/.test(d.identity.email), 'A valid business email', 2)
  req(d.positioning.buyer.trim(), 'Who you help', 3)
  req(d.positioning.problem.trim(), 'The problem you solve', 3)
  req(d.positioning.outcome.trim(), 'The outcome clients get', 3)
  req(t1.name.trim(), 'Tier 1 offer name', 4)
  if (d.frontDoor.primaryCta === 'book_call') req(d.frontDoor.bookingUrl.trim(), 'Booking link for your main action', 6)
  if (d.frontDoor.primaryCta === 'whatsapp') req(d.identity.whatsapp.trim(), 'WhatsApp number for your main action', 2)
  if (d.frontDoor.primaryCta === 'buy_tier1') req(t1.priceInr || t1.priceUsd, 'Tier 1 price (needed for checkout)', 4)
  if (d.frontDoor.primaryCta === 'buy_tier1') req(d.payments.gateways.length > 0, 'At least one payment method', 10)

  rec(d.identity.photoUrl, 'Add your photo', 2)
  rec(d.positioning.credibility.trim(), 'Why you are the obvious choice', 3)
  rec(Object.values(d.positioning.nicheScore).reduce((a, b) => a + Number(b), 0) >= 18, 'Niche score is under 18; consider narrowing', 3)
  rec(t1.priceInr || t1.priceUsd, 'Put a price on Tier 1', 4)
  if (market === 'both') rec(t1.priceInr && t1.priceUsd, 'Tier 1 price in both ₹ and $', 4)
  rec(d.offers.tiers[1].name.trim(), 'Tier 2 main offer', 4)
  rec(d.offers.tiers[2].name.trim(), 'Tier 3 ongoing offer', 4)
  rec(d.proof.results.length + d.proof.caseStudies.length + d.proof.testimonials.length > 0, 'At least one result, case study or testimonial', 5)
  rec(d.frontDoor.invitation.trim(), 'Your invitation line', 6)
  rec(clean(d.knowledge.notIncluded).length > 0, 'What is not included', 7)
  if (d.payments.gstRegistered === 'yes') rec(d.payments.gstin.trim(), 'GSTIN', 10)
  rec(d.site.subdomain.trim() || slugify(d.identity.brandName), 'Website address', 12)
  return issues
}

// ─────────────────────────────────────────────
// Output payload — same structure for every site
// ─────────────────────────────────────────────
function buildSitePayload(d) {
  const market = d.start.market
  const currencies = market === 'india' ? ['INR'] : market === 'global' ? ['USD'] : ['INR', 'USD']
  const num = v => (v === '' || v == null ? null : Number(v))
  const tierOrder = { front_door: 1, core: 2, recurring: 3 }

  const tiers = d.offers.tiers
    .filter(t => t.name.trim())
    .map(t => ({
      tier: t.tier,
      order: tierOrder[t.tier],
      name: t.name.trim(),
      slug: slugify(t.name),
      summary: t.summary,
      deliverables: clean((t.deliverables || '').split('\n')),
      duration: t.duration,
      billing: t.tier === 'recurring' ? 'monthly' : 'one_time',
      prices: {
        ...(currencies.includes('INR') ? { INR: num(t.priceInr) } : {}),
        ...(currencies.includes('USD') ? { USD: num(t.priceUsd) } : {}),
      },
      highlight: d.offers.mostBought === t.tier,
    }))

  const n = d.positioning
  const sentence = `I help ${n.buyer} who struggle with ${n.problem} to get ${n.outcome}${n.timeframe ? ` within ${n.timeframe}` : ''}${n.fear ? `, without ${n.fear}` : ''}.`

  return {
    schemaVersion: SCHEMA_VERSION,
    template: TEMPLATE_ID,
    createdAt: new Date().toISOString(),

    site: {
      subdomain: d.site.subdomain || slugify(d.identity.brandName),
      customDomain: d.site.customDomain || null,
      language: d.start.language,
      market,
      currencies,
      timezone: d.identity.timezone,
      notifyEmail: d.site.notifyEmail || d.identity.email,
      analyticsId: d.site.analyticsId || null,
      pages: SITE_PAGES.map(p => p.slug),
    },

    business: {
      description: d.start.description,
      type: d.start.businessType,
      brandName: d.identity.brandName,
      tagline: d.identity.tagline || null,
      logoUrl: d.identity.logoUrl || null,
      city: d.identity.city,
      country: d.identity.country,
      owner: {
        name: d.identity.ownerName,
        role: d.identity.ownerRole,
        photoUrl: d.identity.photoUrl || null,
        email: d.identity.email,
        whatsapp: d.identity.whatsapp,
      },
    },

    positioning: {
      sentence,
      buyer: n.buyer,
      problem: n.problem,
      outcome: n.outcome,
      timeframe: n.timeframe,
      fear: n.fear,
      alreadyTried: n.alreadyTried,
      credibility: n.credibility,
      forWho: clean(n.forWho),
      notFor: clean(n.notFor),
      nicheScore: { ...n.nicheScore, total: Object.values(n.nicheScore).reduce((a, b) => a + Number(b), 0) },
    },

    offers: {
      tiers,
      product: d.offers.product.enabled ? {
        name: d.offers.product.name,
        summary: d.offers.product.summary,
        link: d.offers.product.link || null,
        prices: {
          ...(currencies.includes('INR') ? { INR: num(d.offers.product.priceInr) } : {}),
          ...(currencies.includes('USD') ? { USD: num(d.offers.product.priceUsd) } : {}),
        },
      } : null,
      paymentTerms: d.offers.paymentTerms,
      revisionRounds: d.offers.revisionRounds,
      priceDisplay: d.offers.priceDisplay,
    },

    proof: {
      yearsExperience: num(d.proof.yearsExperience),
      clientsServed: num(d.proof.clientsServed),
      credentials: clean(d.proof.credentials),
      results: d.proof.results.filter(r => r.number && r.label),
      caseStudies: d.proof.caseStudies.filter(c => c.client || c.result),
      testimonials: d.proof.testimonials.filter(t => t.name && t.quote),
    },

    frontDoor: {
      primaryAction: d.frontDoor.primaryCta,
      bookingUrl: d.frontDoor.bookingUrl || null,
      buttonLabel: d.frontDoor.ctaLabel || null,
      invitation: d.frontDoor.invitation,
      responseTime: d.frontDoor.responseTime,
      workingHours: d.frontDoor.workingHours,
      channels: d.frontDoor.channels,
      formQuestions: clean(d.frontDoor.formQuestions),
    },

    knowledge: {
      process: d.knowledge.process.filter(s => s.title),
      included: clean(d.knowledge.included),
      notIncluded: clean(d.knowledge.notIncluded),
      refundPolicy: d.knowledge.refundPolicy || null,
      toolsUsed: d.knowledge.toolsUsed,
      faqs: d.knowledge.faqs.filter(f => f.question && f.answer),
    },

    brand: {
      style: d.brand.style,
      tone: d.brand.tone,
      primaryColor: d.brand.primaryColor,
      referenceSite: d.brand.referenceSite || null,
      avoidWords: clean((d.brand.avoidWords || '').split(',')),
    },

    agents: {
      enabled: d.agents.enabled,
      autonomy: d.agents.autonomy,
      guardrails: d.agents.guardrails,
      monthlySpendCap: num(d.agents.monthlySpendCap),
      facebook: d.agents.enabled.includes('facebook') ? {
        ...d.agents.facebook,
        audience: d.agents.facebook.audience || n.buyer,
        competitorsToAvoid: clean((d.agents.facebook.competitorsToAvoid || '').split(',')),
      } : null,
    },

    payments: {
      gateways: d.payments.gateways,
      structure: d.payments.structure,
      legalName: d.payments.legalName || d.identity.brandName,
      gstRegistered: d.payments.gstRegistered,
      gstin: d.payments.gstRegistered === 'yes' ? d.payments.gstin : null,
      exportClients: d.payments.exportClients === 'yes',
      lutFiled: d.payments.exportClients === 'yes' ? d.payments.lutFiled : null,
      invoicePrefix: d.payments.invoicePrefix,
      legalPages: d.payments.legalPages,
    },

    channels: {
      social: Object.fromEntries(Object.entries(d.channels.social).filter(([, v]) => v)),
      mainPlatform: d.channels.mainPlatform,
      cadence: d.channels.cadence,
      newsletter: d.channels.newsletter,
      contentTopics: clean(d.channels.contentTopics),
      publishedWork: d.channels.publishedWork.filter(w => w.title && w.url),
    },

    // Rules the site generator must follow (from the book's honesty standard)
    generation: {
      writeCopyFor: ['hero', 'tagline_if_empty', 'about', 'offer_pages', 'faq_additions', 'cta_label_if_empty', 'legal_drafts', 'meta_seo'],
      rules: [
        'Build every page around positioning.sentence.',
        'Use only prices from offers. Never invent, round or convert prices.',
        'Never invent statistics, clients, testimonials, credentials or logos.',
        'Hide any proof section that has no data instead of filling it.',
        'End each page with frontDoor.invitation and the primary action.',
        'Never promise delivery dates or availability beyond what is stated.',
        'Avoid every word in brand.avoidWords.',
        'Mark legal pages as drafts that need professional review.',
      ],
    },
  }
}

// ─────────────────────────────────────────────
// Default state
// ─────────────────────────────────────────────
const DEFAULT_STATE = {
  start: { description: '', businessType: 'consulting', market: 'india', language: 'en' },
  identity: {
    brandName: '', tagline: '', city: '', country: 'India', logoUrl: '', timezone: 'Asia/Kolkata',
    ownerName: '', ownerRole: '', email: '', whatsapp: '', photoUrl: '',
  },
  positioning: {
    buyer: '', problem: '', outcome: '', timeframe: '', fear: '',
    alreadyTried: '', credibility: '',
    forWho: ['', '', ''], notFor: ['', ''],
    nicheScore: { pain: 3, budget: 3, reach: 3, repeat: 3, cred: 3 },
  },
  offers: {
    tiers: [
      { tier: 'front_door', name: '', summary: '', deliverables: '', duration: '', priceInr: '', priceUsd: '' },
      { tier: 'core',       name: '', summary: '', deliverables: '', duration: '', priceInr: '', priceUsd: '' },
      { tier: 'recurring',  name: '', summary: '', deliverables: '', duration: '', priceInr: '', priceUsd: '' },
    ],
    product: { enabled: false, name: '', summary: '', link: '', priceInr: '', priceUsd: '' },
    mostBought: 'core',
    paymentTerms: '50_50',
    revisionRounds: '2',
    priceDisplay: 'show',
  },
  proof: { yearsExperience: '', clientsServed: '', credentials: [''], results: [], caseStudies: [], testimonials: [] },
  frontDoor: {
    primaryCta: 'book_call', bookingUrl: '', ctaLabel: '', invitation: '',
    responseTime: 'Within 1 business day', workingHours: '',
    channels: { form: true, whatsapp: true, email: true, booking: true },
    formQuestions: ['What does your business do?', 'What problem do you want solved?', 'When do you need it done?'],
  },
  knowledge: {
    process: [
      { title: 'Short call', detail: '' },
      { title: 'Fixed proposal', detail: '' },
      { title: 'Delivery', detail: '' },
      { title: 'Walkthrough & handover', detail: '' },
    ],
    included: [''], notIncluded: [''], refundPolicy: '', toolsUsed: '', faqs: [],
  },
  brand: { style: 'minimal', tone: 'plain', primaryColor: '#2563eb', referenceSite: '', avoidWords: '' },
  agents: {
    enabled: ['blog', 'social', 'email', 'landing', 'facebook', 'proposals'],
    autonomy: 'draft_only',
    guardrails: { onlyListedPrices: true, noDeadlines: true, noInventedFacts: true, logEveryRun: true },
    monthlySpendCap: '',
    facebook: { goal: '', monthlyBudget: '', audience: '', competitorsToAvoid: '' },
  },
  payments: {
    gateways: ['razorpay', 'upi'], structure: 'sole_proprietor', legalName: '',
    gstRegistered: 'no', gstin: '', exportClients: 'no', lutFiled: 'no', invoicePrefix: 'INV-',
    legalPages: { terms: true, privacy: true, refund: true },
  },
  channels: {
    social: { linkedin: '', instagram: '', facebook: '', youtube: '', x: '', googleBusiness: '' },
    mainPlatform: 'linkedin', cadence: 'weekly', newsletter: false,
    contentTopics: ['', '', ''], publishedWork: [],
  },
  site: { subdomain: '', customDomain: '', notifyEmail: '', analyticsId: '' },
}

// ─────────────────────────────────────────────
// Layout pieces
// ─────────────────────────────────────────────
function ProgressBar({ step }) {
  const pct = Math.round(((step - 1) / (STEPS.length - 1)) * 100)
  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>{STEPS[step - 1].short}</span>
        <span>{pct}% complete</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-2 bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function NavButtons({ step, setStep, stepIssues }) {
  const required = stepIssues.filter(i => i.level === 'required')
  return (
    <div className="space-y-3 pt-6 mt-8 border-t border-gray-200">
      {required.length > 0 && step < STEPS.length && (
        <Warning>Still needed before building: <strong>{required.map(i => i.label).join(', ')}</strong>. You can continue and come back.</Warning>
      )}
      <div className="flex justify-between">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(s => s - 1)} className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </button>
        ) : <div />}
        {step < STEPS.length && (
          <button type="button" onClick={() => setStep(s => s + 1)} className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
            {step === STEPS.length - 1 ? 'Review' : 'Next'}<ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  )
}

function StepSidebar({ step, setStep, issues, onReset }) {
  return (
    <aside className="sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Build your website</p>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{step}/{STEPS.length}</span>
      </div>
      <nav className="space-y-0.5" aria-label="Wizard steps">
        {STEPS.map(s => {
          const Icon = s.icon
          const active = s.id === step
          const hasRequired = issues.some(i => i.step === s.id && i.level === 'required')
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              aria-current={active ? 'step' : undefined}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                <span className="truncate">{s.short}</span>
              </span>
              {hasRequired && !active && <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" aria-label="Has required fields" />}
            </button>
          )
        })}
      </nav>
      <button type="button" onClick={onReset} className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-red-600">
        <RotateCcw className="w-3.5 h-3.5" />Start over
      </button>
    </aside>
  )
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function SetupWizardPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)
  const [aiState, setAiState] = useState({ status: 'idle' })
  const [build, setBuild] = useState({ status: 'idle' })
  const [notice, setNotice] = useState(null)

  const update = useCallback((path, value) => setData(d => setIn(d, path, value)), [])

  // Restore a saved draft, then apply any Genie prefill on top
  useEffect(() => {
    if (typeof window === 'undefined') return
    let next = DEFAULT_STATE
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (saved) { next = deepMerge(DEFAULT_STATE, JSON.parse(saved)); setNotice('We restored your saved progress.') }
    } catch (_) { /* ignore a corrupt draft */ }
    try {
      const prefill = sessionStorage.getItem('genie_prefill')
      if (prefill) { next = deepMerge(next, JSON.parse(prefill)); setNotice('Genie pre-filled some steps from your description. Review them before building.') }
    } catch (_) { /* ignore */ } finally {
      try { sessionStorage.removeItem('genie_prefill') } catch (_) { /* ignore */ }
    }
    setData(next)
    setHydrated(true)
  }, [])

  // Autosave draft (no secrets are stored in wizard state)
  useEffect(() => {
    if (!hydrated) return
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data)) } catch (_) { /* storage full or blocked */ }
    }, 600)
    return () => clearTimeout(t)
  }, [data, hydrated])

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const issues = getIssues(data)
  const stepIssues = issues.filter(i => i.step === step)

  const getToken = () => {
    try { return localStorage.getItem('auth_token') || localStorage.getItem('token') || '' } catch (_) { return '' }
  }

  const handleAiDraft = async () => {
    setAiState({ status: 'loading' })
    try {
      const token = getToken()
      const res = await fetch(AI_DRAFT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ start: data.start }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const draft = await res.json()
      // Keep anything the user already typed; AI only fills empty fields
      setData(current => preferUserInput(deepMerge(DEFAULT_STATE, draft), current))
      setAiState({ status: 'done' })
    } catch (_) {
      setAiState({ status: 'error', message: 'AI drafting is unavailable right now. Continue filling the steps manually; nothing you typed was lost.' })
    }
  }

  const handleDownload = () => {
    const payload = buildSitePayload(data)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `setup-${payload.site.subdomain || 'site'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleBuild = async () => {
    if (issues.some(i => i.level === 'required')) return
    setBuild({ status: 'building' })
    try {
      const token = getToken()
      const res = await fetch(BUILD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(buildSitePayload(data)),
      })
      if (res.status === 401) throw new Error('auth')
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json().catch(() => ({}))
      setBuild({ status: 'done', url: json.previewUrl || json.url || null })
    } catch (err) {
      setBuild({
        status: 'error',
        message: err.message === 'auth'
          ? 'Sign in to build your website. Your answers are saved on this device.'
          : 'The build could not start. Your answers are saved; try again, or download setup.json.',
      })
    }
  }

  const handleReset = () => {
    if (typeof window !== 'undefined' && !window.confirm('Clear all answers and start over?')) return
    try { localStorage.removeItem(DRAFT_STORAGE_KEY) } catch (_) { /* ignore */ }
    setData(DEFAULT_STATE)
    setStep(1)
    setNotice(null)
  }

  const renderStep = () => {
    switch (step) {
      case 1:  return <Step1 onAiDraft={handleAiDraft} aiState={aiState} />
      case 2:  return <Step2 />
      case 3:  return <Step3 />
      case 4:  return <Step4 />
      case 5:  return <Step5 />
      case 6:  return <Step6 />
      case 7:  return <Step7 />
      case 8:  return <Step8 />
      case 9:  return <Step9 />
      case 10: return <Step10 />
      case 11: return <Step11 />
      case 12: return <Step12 />
      case 13: return <Step13 issues={issues} onGoToStep={setStep} onBuild={handleBuild} onDownload={handleDownload} build={build} />
      default: return null
    }
  }

  return (
    <WizardContext.Provider value={{ data, update }}>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="bg-blue-600 text-white text-center py-3 px-4 text-sm font-medium">
          Answer a few questions about your business. Our AI builds your website from them.
        </div>

        {notice && (
          <div className="bg-green-50 border-b border-green-200 text-green-800 text-center py-2.5 px-4 text-sm flex items-center justify-center gap-3">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-green-700 hover:text-green-900"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-12 gap-8 items-start">
            <div className="hidden lg:block lg:col-span-3">
              <StepSidebar step={step} setStep={setStep} issues={issues} onReset={handleReset} />
            </div>
            <div className="lg:col-span-9">
              <ProgressBar step={step} />
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8 lg:p-10">
                {renderStep()}
                <NavButtons step={step} setStep={setStep} stepIssues={stepIssues} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  )
}

// Merge an AI draft with the user's answers. Anything the user typed wins;
// AI only fills fields that are still empty (matched by position inside lists).
function hasContent(v, key) {
  if (key === 'tier') return false
  if (typeof v === 'string') return v.trim() !== ''
  if (Array.isArray(v)) return v.some(x => hasContent(x))
  if (isPlainObject(v)) return Object.entries(v).some(([k, x]) => hasContent(x, k))
  return false
}
function preferUserInput(ai, user) {
  if (typeof user === 'string') return user.trim() ? user : (ai ?? user)
  if (Array.isArray(user)) {
    if (!hasContent(user)) return Array.isArray(ai) && ai.length ? ai : user
    if (Array.isArray(ai) && user.every(isPlainObject) && ai.every(isPlainObject)) {
      const length = Math.max(user.length, ai.length)
      return Array.from({ length }, (_, i) => (user[i] === undefined ? ai[i] : ai[i] === undefined ? user[i] : preferUserInput(ai[i], user[i])))
    }
    return user
  }
  if (isPlainObject(user)) {
    const out = {}
    for (const k of new Set([...Object.keys(ai || {}), ...Object.keys(user)])) {
      out[k] = k in user ? preferUserInput(ai ? ai[k] : undefined, user[k]) : ai[k]
    }
    return out
  }
  return user === undefined ? ai : user
}