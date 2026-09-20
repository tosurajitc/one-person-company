'use client'

/**
 * Template 12 — Digital Product Seller
 * Section: Product & Commerce
 * Theme: Bold · Hot Pink #be185d + Near-Black Eggplant #170318
 *
 * DESIGN CONCEPT: "The Creator's Desk"
 * ─────────────────────────────────────────────────────────────────────────────
 * A digital-product buyer isn't hiring anyone — they're deciding, in about
 * eight seconds, whether this file is worth more than the time it would take
 * to make it themselves. So this template sells the TRANSFORMATION, not the
 * seller:
 *
 *  • A scrapbook-style hero — rotated template previews overlapping like a
 *    moodboard, not a single hero image, because the product IS a set of things
 *  • A "WHAT'S INSIDE" contents grid — buyers need to see the exact file count
 *    before they trust a price
 *  • A BEFORE / AFTER transformation strip — the single highest-converting
 *    section for template products; shown as a stylised post comparison
 *  • A PRICE ANCHOR block — bundle price set directly against "hire a
 *    designer" cost, the classic anchor for creative-asset pricing
 *  • An INSTANT DELIVERY explainer — buyers of digital goods need to know
 *    they get the file the second they pay, not "we'll email you"
 *  • REVIEWS labelled by the buyer's own niche, not their job title
 *  • AI CONTENT TOOLS — add-on agents for caption writing & customisation help
 *  • A licence-and-format FAQ — the actual objections before a template sale
 *
 * DATA MAP — user_site_settings keys:
 *  general    → brand_name, tagline, niche, email, support_whatsapp
 *  brand      → primary_color, logo_url
 *  hero       → headline, subheadline, cta_text
 *  about      → creator_name, story, years_active
 *  offers     → bundles[] { title, description, price, compare_at_price,
 *                           file_count, format, license, is_highlighted }
 *  proof      → testimonials[] { name, role, quote, rating },
 *               results[] { label, number }
 *  contact    → checkout_url, support_whatsapp
 *  faq        → items[] { question, answer }
 *  agents     → agents[] { id, title, role, badge, description,
 *                          samplePrompts, ratePerMinute, currency }
 *
 *  PROPOSED NEW template_data FIELDS (digital-product specific — not yet in
 *  the generic schema; flagging for the template-fields table):
 *    - bundle_contents[]   { category, count }         "what's inside" grid
 *    - before_after[]      { label, before_note, after_note }
 *    - tool_required       e.g. "Canva (Free or Pro)"
 *    - delivery_method     e.g. "Instant download link, sent by email"
 *    - downloads_count, creators_count, avg_turnaround
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import {
  Download, Sparkles, Instagram, Layers, Zap, Star, ChevronDown, ChevronUp,
  ArrowRight, CheckCircle, Mail, MessageCircle, ChevronLeft, ChevronRight,
  BadgeCheck, Gift, CreditCard, Wand2, Grid3x3, PenTool, TrendingUp, Users,
  ShieldCheck, Infinity as InfinityIcon, Clock, FileText, Palette,
} from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'

const DataCtx = createContext(null)
const useData = () => useContext(DataCtx)

// ─── Icon lookups (code-owned) ────────────────────────────────────────────────
const AGENT_ICON_MAP = {
  'caption-writer':   PenTool,
  'customizer-help':  Wand2,
  'trend-spotter':    TrendingUp,
  'content-calendar': Grid3x3,
}
const AGENT_ICON_FALLBACK = Sparkles

// ─── payloadToData ────────────────────────────────────────────────────────────
function payloadToData(payload) {
  if (!payload) return SAMPLE
  const biz   = payload.business      || {}
  const pos   = payload.positioning   || {}
  const prf   = payload.proof         || {}
  const fd    = payload.frontDoor     || {}
  const know  = payload.knowledge     || {}
  const off   = payload.offers        || {}
  const td    = payload.template_data || {}
  const owner = biz.owner || {}
  const o = (v, fb) => (v && String(v).trim() ? v : fb)

  const mappedFaqs = (know.faqs || []).filter(f => f?.question && f?.answer)
    .map(f => ({ q: f.question, a: f.answer }))

  const mappedTestimonials = (prf.testimonials || []).filter(t => t?.quote)
    .map(t => ({ name: t.name || '', role: t.role || 'Creator', rating: 5, text: t.quote }))

  const wizardOffers = Array.isArray(off.items) ? off.items : Array.isArray(off) ? off : []
  const mappedTiers = wizardOffers.filter(x => x?.title).map((x, i) => ({
    name:        x.title,
    price:       x.price ? `₹${x.price}` : 'Contact us',
    compareAt:   x.compare_at_price ? `₹${x.compare_at_price}` : null,
    fileCount:   x.file_count || '',
    features:    Array.isArray(x.deliverables) ? x.deliverables : [],
    highlight:   !!x.is_highlighted || i === 1,
  }))
  const tiers = mappedTiers.length ? mappedTiers : SAMPLE.tiers

  const mappedAgents = Array.isArray(payload.agents) ? payload.agents.filter(a => a?.title).map(a => ({
    id:            a.id,
    title:         a.title,
    role:          a.role || '',
    badge:         a.badge || null,
    description:   a.description || '',
    samplePrompts: (a.samplePrompts || []).slice(0, 2),
    ratePerMinute: a.ratePerMinute ?? 0,
    currency:      a.currency || '₹',
    icon:          AGENT_ICON_MAP[a.id] || AGENT_ICON_FALLBACK,
  })) : SAMPLE.agents

  return {
    business: {
      name:        o(biz.brandName, SAMPLE.business.name),
      creator:     o(biz.ownerName || owner.name, SAMPLE.business.creator),
      tagline:     o(biz.tagline, SAMPLE.business.tagline),
      niche:       o(td.niche, SAMPLE.business.niche),
      desc:        o(pos.credibility, SAMPLE.business.desc),
      email:       o(owner.email, SAMPLE.business.email),
      whatsapp:    o(owner.whatsapp, SAMPLE.business.whatsapp),
      checkoutUrl: fd.bookingUrl || fd.checkoutUrl || '#pricing',
      downloads:   td.downloads_count || SAMPLE.business.downloads,
      creators:    td.creators_count || SAMPLE.business.creators,
      rating:      prf.results?.find(r => r?.label?.toLowerCase().includes('rating'))?.number || SAMPLE.business.rating,
      reviews:     SAMPLE.business.reviews,
      tool:        td.tool_required || SAMPLE.business.tool,
      delivery:    td.delivery_method || SAMPLE.business.delivery,
    },
    bundleContents: SAMPLE.bundleContents,
    beforeAfter:    SAMPLE.beforeAfter,
    tiers,
    testimonials:   mappedTestimonials.length ? mappedTestimonials : SAMPLE.testimonials,
    faqs:           mappedFaqs.length ? mappedFaqs : SAMPLE.faqs,
    agents:         mappedAgents,
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  ink:       '#170318',
  inkSoft:   '#2b0a2e',
  pink:      '#be185d',
  pinkDeep:  '#831843',
  pinkBright:'#ec4899',
  gold:      '#f59e0b',
  goldDeep:  '#b45309',
  cream:     '#fff5f8',
  white:     '#ffffff',
  text:      '#1f0f22',
  muted:     '#7c6b80',
  border:    '#fbcfe8',
  bg:        '#fffbfc',
  grayText:  '#6b7280',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = {
  business: {
    name:      'Studio Bloom',
    creator:   'Priya Chandran',
    tagline:   'Instagram & Canva templates that make your feed look hired-out — without hiring anyone',
    niche:     'Social templates for creators & small brands',
    desc:      'Every pack is built in Canva, fully editable on the free plan, and ready to post in under ten minutes.',
    email:     'hello@studiobloom.co',
    whatsapp:  '9845123456',
    downloads: '12,400+',
    creators:  '3,100+',
    rating:    4.9,
    reviews:   612,
    tool:      'Canva (Free or Pro)',
    delivery:  'Instant download link, sent straight to your inbox',
  },
  bundleContents: [
    { category: 'Reel Cover Templates',   count: 25, icon: Instagram },
    { category: 'Story Templates',        count: 40, icon: Layers },
    { category: 'Carousel Slide Sets',    count: 15, icon: Grid3x3 },
    { category: 'Quote & Testimonial Cards', count: 20, icon: FileText },
    { category: 'Highlight Cover Icons',  count: 30, icon: Palette },
    { category: 'Countdown & Promo Templates', count: 10, icon: Zap },
  ],
  beforeAfter: [
    { label: 'Product Launch Post', before: 'Plain photo, no text, posted at random', after: 'Branded layout, headline + price, consistent colours' },
    { label: 'Weekly Quote Card',   before: 'Screenshot of a quote app, generic font', after: 'Custom typography, brand palette, your logo watermark' },
    { label: 'Story Highlight Set', before: 'Default grey circles, no theme', after: 'Matching icon set, on-brand and cohesive at a glance' },
  ],
  tiers: [
    {
      name: 'Starter Pack', price: '₹799', compareAt: '₹1,999', fileCount: '25 templates',
      features: ['25 Reel cover templates', 'Editable in Canva Free', 'Personal use licence', 'Instant download'],
      highlight: false,
    },
    {
      name: 'Full Creator Bundle', price: '₹1,999', compareAt: '₹5,499', fileCount: '140 templates',
      features: ['All 6 template categories · 140 files', 'Editable in Canva Free or Pro', 'Commercial use licence included', 'Free updates for 12 months', 'Instant download'],
      highlight: true,
    },
    {
      name: 'Agency Licence', price: '₹4,999', compareAt: '₹12,000', fileCount: '140 templates + resale rights',
      features: ['Everything in Full Creator Bundle', 'Use across unlimited client accounts', 'White-label — remove our credit', 'Priority email support'],
      highlight: false,
    },
  ],
  testimonials: [
    { name: 'Ananya Rao',   role: 'Skincare brand, Instagram', rating: 5, text: "I used to spend two hours a week just making Story graphics. Now it's ten minutes and my feed actually looks consistent for the first time." },
    { name: 'Kabir Mehta',  role: 'Fitness coach, Reels',       rating: 5, text: "The Reel covers alone paid for the whole bundle. My saves went up almost immediately once posts stopped looking thrown together." },
    { name: 'Tanvi Shah',   role: 'Handmade jewellery seller',  rating: 5, text: 'Everything opens in Canva exactly as shown — no fonts missing, no broken layouts. First template pack that actually matched the preview.' },
    { name: 'Rohan Iyer',   role: 'Freelance social media manager', rating: 4, text: "I use the Agency Licence across four client accounts now. Massive time saver during launch weeks. Wish there were more carousel styles, but I'm not complaining." },
  ],
  faqs: [
    { q: 'What app do I need to edit these?',            a: 'Everything is built in Canva and works on the free plan — no design software or Canva Pro subscription required, though a few premium elements look best on Pro.' },
    { q: 'Do I get the files instantly?',                 a: 'Yes — the moment payment goes through, you get an email with your download link. No waiting, no manual delivery.' },
    { q: 'Can I use these for client work?',              a: 'The Starter Pack is personal-use only. The Full Creator Bundle and Agency Licence both include commercial use rights — check the licence details on each tier above.' },
    { q: 'What if a template looks different once I open it?', a: "That essentially never happens since everything is native Canva, but if a file doesn't open as shown, email us within 7 days for a full refund." },
    { q: 'Do you add new templates over time?',           a: 'Yes — the Full Creator Bundle and Agency Licence include free access to new template drops for 12 months from purchase, at no extra cost.' },
  ],
  agents: [
    {
      id: 'caption-writer', title: 'Caption Writer', role: 'Post Copy Assistant', badge: 'Popular',
      description: "Paste in what the post is about and get three caption options in your brand's voice — hook, body, and call to action.",
      samplePrompts: ['Write a caption for a new product launch post', 'Give me 3 hook options for a testimonial carousel'],
      ratePerMinute: 8, currency: '₹',
    },
    {
      id: 'customizer-help', title: 'Template Customiser', role: 'Canva Setup Assistant', badge: null,
      description: "Stuck on a layout? Describe what's not working and get exact step-by-step fixes for resizing, recolouring, or swapping fonts inside Canva.",
      samplePrompts: ['My logo looks too small on the Story template', 'How do I change all templates to my brand colours at once?'],
      ratePerMinute: 8, currency: '₹',
    },
    {
      id: 'trend-spotter', title: 'Trend Spotter', role: 'Content Trend Scout', badge: null,
      description: 'Get a quick read on which post formats are working right now in your niche, so you know which templates to reach for this week.',
      samplePrompts: ["What's trending for skincare brands on Reels this month?", 'Which of my templates fits a before/after trend?'],
      ratePerMinute: 8, currency: '₹',
    },
    {
      id: 'content-calendar', title: 'Content Calendar Builder', role: 'Posting Planner', badge: null,
      description: 'Turn your template bundle into a ready-made 30-day posting plan, matched to which template fits which day.',
      samplePrompts: ['Build me a 2-week posting plan using my Story templates', 'Which templates should I post on launch week?'],
      ratePerMinute: 8, currency: '₹',
    },
  ],
}

// ─── Scroll to top ────────────────────────────────────────────────────────────
function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  if (!visible) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
      style={{ background: T.pink }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 text-white" />
    </button>
  )
}

// ─── Sticky buy bar (digital-product equivalent of the WhatsApp float) ───────
function BuyStickyBar() {
  const D = useData()
  const b = D.business
  return (
    <a
      href={b.checkoutUrl}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-xl transition-all hover:scale-105"
      style={{ background: T.pink, color: '#fff' }}
    >
      <Download className="w-5 h-5" />
      <span className="font-bold text-sm">Get the Bundle</span>
    </a>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function TemplateNav() {
  const D = useData()
  const b = D.business
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-md"
      style={{ background: 'rgba(255,251,253,0.95)', borderColor: T.border }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center rotate-3" style={{ background: T.pink }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm leading-tight" style={{ color: T.text }}>{b.name}</p>
            <p className="text-[10px] leading-tight" style={{ color: T.muted }}>{b.niche}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-5 text-sm">
          {[['#inside','What\'s inside'],['#pricing','Pricing'],['#reviews','Reviews']].map(([href, label]) => (
            <a key={href} href={href} className="font-medium transition-opacity hover:opacity-60" style={{ color: T.grayText }}>{label}</a>
          ))}
        </div>
        <a href={b.checkoutUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: T.pink }}>
          <Download className="w-3.5 h-3.5" /> Get it now
        </a>
      </div>
    </nav>
  )
}

// ─── Hero — scrapbook moodboard, not a single hero image ────────────────────
function HeroSection() {
  const D = useData()
  const b = D.business

  // Stylised "post" mockups — rotated, staggered fade-in, one orchestrated moment
  const mockups = [
    { top: '2%',  left: '58%', rot: -6,  w: 160, grad: `linear-gradient(150deg, ${T.pink}, ${T.pinkDeep})`, delay: 0 },
    { top: '30%', left: '78%', rot: 8,   w: 130, grad: `linear-gradient(150deg, ${T.gold}, ${T.goldDeep})`, delay: 100 },
    { top: '55%', left: '60%', rot: -3,  w: 145, grad: `linear-gradient(150deg, ${T.pinkBright}, ${T.pink})`, delay: 200 },
    { top: '4%',  left: '80%', rot: 12,  w: 110, grad: `linear-gradient(150deg, ${T.inkSoft}, ${T.ink})`, delay: 300 },
    { top: '68%', left: '82%', rot: -10, w: 100, grad: `linear-gradient(150deg, ${T.goldDeep}, ${T.pinkDeep})`, delay: 400 },
  ]

  return (
    <section className="relative pt-14 overflow-hidden" style={{ background: T.ink }}>
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: `radial-gradient(circle, ${T.pinkBright} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }} />
      <style>{`
        @keyframes cardIn { from { opacity: 0; transform: translateY(16px) rotate(var(--r)) scale(0.94); } to { opacity: 1; transform: translateY(0) rotate(var(--r)) scale(1); } }
        .mockup-card { animation: cardIn 0.7s cubic-bezier(.2,.7,.3,1) both; }
      `}</style>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold mb-6"
              style={{ borderColor: 'rgba(236,72,153,0.35)', color: T.pinkBright, background: 'rgba(236,72,153,0.08)' }}>
              <Download className="w-3.5 h-3.5" /> {b.downloads} downloads by {b.creators} creators
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.03] mb-6 text-white tracking-tight">
              Your feed, redesigned<br />before your coffee<br />
              <span style={{ color: T.pinkBright }}>gets cold.</span>
            </h1>

            <p className="text-base leading-relaxed mb-9 max-w-md" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {b.tagline}. Open a file, drop in your photos, post. That's the whole workflow.
            </p>

            <div className="flex flex-wrap gap-4 mb-9">
              <a href={b.checkoutUrl}
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-black text-base transition-all hover:opacity-90 shadow-lg"
                style={{ background: T.pink, color: '#fff' }}>
                <Download className="w-5 h-5" /> Get the Full Bundle
              </a>
              <a href="#before-after"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-black text-base border transition-all hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                See the transformation
              </a>
            </div>

            <div className="flex flex-wrap gap-5">
              {[
                { label: b.rating + '★ (' + b.reviews + ' reviews)' },
                { label: 'Works with ' + b.tool },
                { label: 'Instant download' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: T.gold }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Moodboard collage */}
          <div className="relative hidden lg:block h-[420px]">
            {mockups.map((m, i) => (
              <div key={i}
                className="mockup-card absolute rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                style={{
                  top: m.top, left: m.left, width: m.w, aspectRatio: '4/5',
                  background: m.grad, '--r': `${m.rot}deg`, animationDelay: `${m.delay}ms`,
                }}>
                <div className="w-full h-full flex flex-col justify-end p-3">
                  <div className="w-8 h-8 rounded-full bg-white/25 mb-2" />
                  <div className="w-3/4 h-2 rounded bg-white/40 mb-1.5" />
                  <div className="w-1/2 h-2 rounded bg-white/25" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Trust strip ──────────────────────────────────────────────────────────────
function TrustStripSection() {
  const D = useData()
  const b = D.business
  const items = [
    { icon: Download,     label: b.downloads,             sub: 'Templates downloaded' },
    { icon: Users,        label: b.creators,               sub: 'Creators using Studio Bloom' },
    { icon: ShieldCheck,  label: '7-day',                  sub: 'Refund window' },
    { icon: InfinityIcon, label: '12 months',               sub: 'Free template updates' },
  ]
  return (
    <section style={{ background: T.pinkDeep }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, label, sub }, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-5 border-r border-b last:border-r-0" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">{label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── What's inside — bundle contents grid ────────────────────────────────────
function WhatsInsideSection() {
  const D = useData()
  return (
    <section id="inside" className="py-20" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm font-bold mb-2" style={{ color: T.pink }}>● What's inside</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>140 files, six formats, one download</h2>
          </div>
          <p className="text-sm max-w-sm" style={{ color: T.muted }}>Every category below is fully editable — swap colours, fonts, and photos in Canva.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {D.bundleContents.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="rounded-2xl border p-6 flex items-start gap-4 transition-all hover:shadow-md" style={{ borderColor: T.border, background: T.white }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: T.cream }}>
                  <Icon className="w-6 h-6" style={{ color: T.pink }} />
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ color: T.pink }}>{item.count}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: T.text }}>{item.category}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Before / After transformation ───────────────────────────────────────────
function BeforeAfterSection() {
  const D = useData()
  return (
    <section id="before-after" className="py-20" style={{ background: T.ink }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-sm font-bold mb-2" style={{ color: T.pinkBright }}>● The actual difference</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">Same post, ten minutes apart</h2>
        </div>

        <div className="space-y-8">
          {D.beforeAfter.map((pair, i) => (
            <div key={i} className="grid md:grid-cols-[auto_1fr_1fr] gap-5 items-center">
              <p className="text-sm font-bold w-full md:w-40 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>{pair.label}</p>

              <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-16 h-20 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.2)' }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Before</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{pair.before}</p>
                </div>
              </div>

              <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.06)' }}>
                <div className="w-16 h-20 rounded-lg flex-shrink-0" style={{ background: `linear-gradient(150deg, ${T.pink}, ${T.pinkDeep})` }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: T.pinkBright }}>After</p>
                  <p className="text-sm text-white">{pair.after}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Price anchor / pricing tiers ─────────────────────────────────────────────
function PricingSection() {
  const D = useData()
  const b = D.business
  return (
    <section id="pricing" className="py-20" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-bold mb-2" style={{ color: T.pink }}>● Pricing</p>
          <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: T.text }}>Less than one hour of a designer's time</h2>
          <p className="text-base max-w-xl" style={{ color: T.muted }}>A freelance designer typically charges ₹15,000+ for a template set like this. The bundle is a fraction of that, and it's yours in seconds.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {D.tiers.map((tier, i) => (
            <div key={i}
              className="rounded-3xl p-7 border-2 flex flex-col relative"
              style={{
                borderColor: tier.highlight ? T.pink : T.border,
                background: tier.highlight ? T.ink : T.white,
                transform: tier.highlight ? 'translateY(-8px)' : 'none',
              }}>
              {tier.highlight && (
                <span className="absolute -top-3 left-7 text-[11px] font-bold px-3 py-1 rounded-full text-white" style={{ background: T.pink }}>
                  Most popular
                </span>
              )}
              <p className="text-sm font-bold mb-1" style={{ color: tier.highlight ? T.pinkBright : T.pink }}>{tier.name}</p>
              <p className="text-xs mb-4" style={{ color: tier.highlight ? 'rgba(255,255,255,0.5)' : T.muted }}>{tier.fileCount}</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-black" style={{ color: tier.highlight ? '#fff' : T.text }}>{tier.price}</span>
                {tier.compareAt && (
                  <span className="text-sm line-through" style={{ color: tier.highlight ? 'rgba(255,255,255,0.4)' : T.grayText }}>{tier.compareAt}</span>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-sm" style={{ color: tier.highlight ? 'rgba(255,255,255,0.85)' : T.text }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tier.highlight ? T.pinkBright : T.pink }} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={b.checkoutUrl}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: tier.highlight ? T.pink : T.cream, color: tier.highlight ? '#fff' : T.pinkDeep }}>
                <Download className="w-4 h-4" /> Get {tier.name}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How delivery works ───────────────────────────────────────────────────────
function DeliverySection() {
  const D = useData()
  const b = D.business
  const steps = [
    { icon: CreditCard, title: 'Pay securely',        desc: 'Checkout takes under a minute — card, UPI, or netbanking.' },
    { icon: Mail,        title: 'Get your link instantly', desc: `${b.delivery}.` },
    { icon: Wand2,        title: `Open in ${b.tool}`,        desc: 'Every file is pre-built and ready to customise, no setup needed.' },
    { icon: Gift,         title: 'Post it',                  desc: 'Swap in your photos and brand colours, then publish — most creators finish their first post in under ten minutes.' },
  ]
  return (
    <section className="py-20" style={{ background: T.white }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-sm font-bold mb-2" style={{ color: T.pink }}>● From payment to posted</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Four steps, no waiting</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="rounded-2xl border p-6" style={{ borderColor: T.border, background: T.bg }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: T.pink }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-black text-base mb-2" style={{ color: T.text }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
function ReviewsSection() {
  const [active, setActive] = useState(0)
  const D = useData()
  const navigate = (dir) => setActive(prev => (prev + dir + D.testimonials.length) % D.testimonials.length)
  const t = D.testimonials[active]

  return (
    <section id="reviews" className="py-20" style={{ background: T.pinkDeep }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm font-bold mb-2" style={{ color: T.gold }}>● What creators say</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">{D.business.reviews} reviews · {D.business.rating}★ average</h2>
          </div>
          <div className="flex gap-2">
            {[[-1, ChevronLeft], [1, ChevronRight]].map(([dir, Icon], i) => (
              <button key={i} onClick={() => navigate(dir)}
                className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-8 border mb-6" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
          <div className="flex gap-1 mb-5">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" style={{ color: T.gold }} />
            ))}
          </div>
          <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-6">"{t.text}"</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm" style={{ background: T.pinkBright, color: T.ink }}>
              {t.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{t.name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.role}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {D.testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className="w-2 h-2 rounded-full transition-all"
              style={{ background: active === i ? T.gold : 'rgba(255,255,255,0.25)' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── AI Content Tools — shared AgentsSection pattern ─────────────────────────
function AgentsSection() {
  const D = useData()
  if (!D.agents?.length) return null
  return (
    <section className="py-20" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-bold mb-2" style={{ color: T.pink }}>● After you download</p>
          <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ color: T.text }}>AI content tools for your bundle</h2>
          <p className="text-base max-w-2xl" style={{ color: T.muted }}>Optional add-ons to help you write, customise, and plan around your new templates — priced separately.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {D.agents.map((agent) => {
            const Icon = agent.icon || AGENT_ICON_FALLBACK
            return (
              <div key={agent.id} className="rounded-2xl border p-5 flex flex-col justify-between" style={{ borderColor: T.border, background: T.white }}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: T.cream }}>
                      <Icon className="w-5 h-5" style={{ color: T.pink }} />
                    </div>
                    {agent.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: T.goldDeep }}>{agent.badge}</span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold mb-1" style={{ color: T.pink }}>{agent.role}</p>
                  <h3 className="font-black text-sm mb-2" style={{ color: T.text }}>{agent.title}</h3>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: T.muted }}>{agent.description}</p>
                  {agent.samplePrompts?.[0] && (
                    <p className="text-xs italic mb-4" style={{ color: T.grayText }}>"{agent.samplePrompts[0]}"</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: T.border }}>
                  <span className="text-xs font-bold" style={{ color: T.pink }}>{agent.currency}{agent.ratePerMinute}/min</span>
                  <button className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: T.goldDeep }}>
                    Try it <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState(null)
  const D = useData()
  return (
    <section className="py-20" style={{ background: T.white }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-sm font-bold mb-2" style={{ color: T.pink }}>● Before you buy</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: T.text }}>Questions creators ask</h2>
        </div>
        <div className="space-y-3">
          {D.faqs.map((f, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-sm"
                style={{ color: T.text, background: open === i ? T.cream : T.white }}>
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`} style={{ color: T.pink }} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: T.muted, background: T.cream }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTASection() {
  const D = useData()
  const b = D.business
  return (
    <section className="py-20" style={{ background: `linear-gradient(135deg, ${T.ink} 0%, ${T.pinkDeep} 65%, ${T.pink} 100%)` }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
          Stop starting from a blank canvas.
        </h2>
        <p className="text-base leading-relaxed mb-9 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
          140 templates, delivered the second you pay. Open Canva, drop in your content, and your feed is done for the week.
        </p>
        <a href={b.checkoutUrl}
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-black text-base transition-all hover:opacity-90 shadow-lg"
          style={{ background: '#fff', color: T.pinkDeep }}>
          <Download className="w-5 h-5" /> Get the Full Bundle — {D.tiers.find(t => t.highlight)?.price}
        </a>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function TemplateFooter() {
  const D = useData()
  const b = D.business
  return (
    <footer style={{ background: T.ink, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center rotate-3" style={{ background: T.pink }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white">{b.name}</span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{b.tagline}.</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>By {b.creator}</p>
          </div>
          <div>
            <p className="text-xs font-bold mb-4" style={{ color: T.pinkBright }}>Shop</p>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {[['#inside',"What's inside"],['#pricing','Pricing'],['#reviews','Reviews'],['#','Licence & Terms']].map(([href, label]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold mb-4" style={{ color: T.pinkBright }}>Support</p>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <li><a href={`mailto:${b.email}`} className="hover:text-white transition-colors">{b.email}</a></li>
              <li>Refunds within 7 days</li>
            </ul>
            <a href={`https://wa.me/${b.whatsapp}?text=Hi! I have a question about a template bundle.`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: '#25d366' }}>
              <MessageCircle className="w-4 h-4" /> WhatsApp Support
            </a>
          </div>
        </div>
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
          <span>© {new Date().getFullYear()} {b.name}. All rights reserved.</span>
          <Link href="/templates" className="hover:text-white transition-colors">← Browse all templates on OPC Genie</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DigitalProductSellerTemplate({ data }) {
  const value = payloadToData(data)
  return (
    <DataCtx.Provider value={value}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <TemplateNav />
        <HeroSection />
        <TrustStripSection />
        <WhatsInsideSection />
        <BeforeAfterSection />
        <PricingSection />
        <DeliverySection />
        <ReviewsSection />
        <AgentsSection />
        <FAQSection />
        <FinalCTASection />
        <TemplateFooter />
        <BuyStickyBar />
        <ScrollToTop />
      </div>
    </DataCtx.Provider>
  )
}