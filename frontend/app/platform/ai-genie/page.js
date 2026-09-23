'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  Mic,
  MicOff,
  Send,
  Square,
  Info,
  ShieldCheck,
  Zap,
  Target,
  Scale,
  Landmark,
  Plane,
  GraduationCap,
  Armchair,
  Compass,
  ImageIcon,
  Paperclip,
  Download,
} from 'lucide-react'

// Theme: bottle green #021610 / #053728 / #0a4836 / #0f6b4f, light green #a7f3c0 / #d9f5e4 / #f2faf5, orange buttons.

// ─────────────────────────────────────────────
// Minimal Markdown renderer (bold, italic, code, bullets, headers, tables)
// No external dependency — pure regex transforms to JSX-safe HTML string
// ─────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return ''
  let html = text
    // Escape < > to avoid XSS from model output
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4 class="font-bold text-gray-800 mt-3 mb-1 text-sm">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-gray-800 mt-4 mb-1 text-base">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-gray-900 mt-4 mb-1 text-lg">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-black text-gray-900 mt-4 mb-2 text-xl">$1</h1>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-3 border-gray-200"/>')
    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-[#f2faf5] px-1 py-0.5 rounded text-xs font-mono text-[#0a4836]">$1</code>')
    // Bullet lists
    .replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 leading-normal">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700 leading-normal"><strong>$1.</strong> $2</li>')
    // Wrap consecutive <li> in <ul> (stripping trailing newlines inside list to prevent br insertion)
    .replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, m => `<ul class="space-y-1 my-2">${m.replace(/\n/g, '')}</ul>`)
    // Table rows — basic support
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split('|').map(c => c.trim())
      return '<tr>' + cells.map(c => `<td class="border border-gray-200 px-2 py-1 text-xs">${c}</td>`).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, m => `<div class="overflow-x-auto my-3"><table class="w-full text-left border-collapse border border-gray-200 text-xs">${m}</table></div>`)
    // Paragraphs — double newline
    .replace(/\n\n/g, '</p><p class="mb-2">')
    // Single newline outside list items
    .replace(/\n/g, '<br/>')
    // Clean up spurious tags around lists and block elements
    .replace(/<p class="mb-2"><\/p>/g, '')
    .replace(/<p class="mb-2">(<ul[\s\S]*?<\/ul>)<\/p>/g, '$1')
    .replace(/<p class="mb-2">(<h[1-4][\s\S]*?<\/h[1-4]>)<\/p>/g, '$1')

  return `<p class="mb-2">${html}</p>`
}

// Supported social marketing platforms with badges and logos (brand colours kept on purpose)
const SOCIAL_PLATFORMS_CONFIG = [
  {
    id: 'google',
    name: 'Google Ads',
    badge: 'Search & PMax',
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-200 hover:border-amber-400',
    bgColor: 'bg-amber-50/70',
    activeRing: 'ring-2 ring-amber-500 bg-amber-100/80',
    svg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube Ads',
    badge: 'Video & Shorts',
    color: 'from-red-500 to-rose-600',
    borderColor: 'border-red-200 hover:border-red-400',
    bgColor: 'bg-red-50/70',
    activeRing: 'ring-2 ring-red-500 bg-red-100/80',
    svg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Ads',
    badge: 'B2B & Lead Gen',
    color: 'from-blue-600 to-sky-700',
    borderColor: 'border-blue-200 hover:border-blue-400',
    bgColor: 'bg-sky-50/70',
    activeRing: 'ring-2 ring-sky-600 bg-sky-100/80',
    svg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
      </svg>
    ),
  },
  {
    id: 'pinterest',
    name: 'Pinterest Ads',
    badge: 'Visual Discovery',
    color: 'from-rose-600 to-red-700',
    borderColor: 'border-rose-200 hover:border-rose-400',
    bgColor: 'bg-rose-50/70',
    activeRing: 'ring-2 ring-rose-600 bg-rose-100/80',
    svg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#E60023">
        <path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.98-.12-2.48.02-3.55l1.04-4.42s-.26-.53-.26-1.32c0-1.24.72-2.16 1.61-2.16.76 0 1.13.57 1.13 1.25 0 .76-.49 1.91-.74 2.97-.21.89.44 1.61 1.32 1.61 1.58 0 2.8-1.67 2.8-4.08 0-2.13-1.53-3.62-3.72-3.62-2.54 0-4.03 1.9-4.03 3.87 0 .77.3 1.59.67 2.04.07.09.08.17.06.26l-.25 1.04c-.04.17-.14.21-.32.13-1.2-.56-1.95-2.31-1.95-3.72 0-3.03 2.2-5.81 6.35-5.81 3.33 0 5.92 2.38 5.92 5.55 0 3.31-2.09 5.98-4.99 5.98-.98 0-1.9-.51-2.21-1.11l-.6 2.3c-.22.84-.81 1.89-1.21 2.53A12 12 0 1 0 12 0z"/>
      </svg>
    ),
  },
  {
    id: 'snapchat',
    name: 'Snapchat Ads',
    badge: 'AR & Gen-Z',
    color: 'from-yellow-400 to-amber-500',
    borderColor: 'border-yellow-200 hover:border-yellow-400',
    bgColor: 'bg-yellow-50/70',
    activeRing: 'ring-2 ring-yellow-500 bg-yellow-100/80',
    svg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FFFC00" stroke="#000" strokeWidth="0.8">
        <path d="M12.001 2c-3.547 0-5.82 2.584-5.82 5.534 0 .913.344 1.77.625 2.406.125.281.188.469.063.656-.094.125-.344.219-.656.281-.781.156-1.625.688-1.625 1.531 0 .625.438 1.156 1.125 1.344.313.094.594.188.719.375.125.188.063.469-.031.844-.125.531-.281 1.25-.281 1.906 0 1.219.781 2.063 2.094 2.188.594.063 1.25-.094 1.906-.313.438-.156.813-.25 1.094-.25.281 0 .656.094 1.094.25.656.219 1.313.375 1.906.313 1.313-.125 2.094-.969 2.094-2.188 0-.656-.156-1.375-.281-1.906-.094-.375-.156-.656-.031-.844.125-.188.406-.281.719-.375.688-.188 1.125-.719 1.125-1.344 0-.844-.844-1.375-1.625-1.531-.313-.063-.563-.156-.656-.281-.125-.188-.063-.375.063-.656.281-.625.625-1.493.625-2.406C17.821 4.584 15.548 2 12.001 2z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Meta / FB Ads',
    badge: 'Feed & Reels',
    color: 'from-blue-600 to-indigo-700',
    borderColor: 'border-blue-200 hover:border-blue-400',
    bgColor: 'bg-blue-50/70',
    activeRing: 'ring-2 ring-blue-600 bg-blue-100/80',
    svg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
]

// Quick-command shortcuts shown below the input bar when Social Media agent is active
const FB_QUICK_COMMANDS = [
  { cmd: '/plan',      label: '📍 Plan',       title: 'Show my full multi-platform roadmap & current progress' },
  { cmd: '/ads',       label: '✍️ Ad Copy',     title: 'Generate 3+ platform-tailored ad copy variations' },
  { cmd: '/creative',  label: '🎬 Creative',    title: 'Generate video scripts, shorts & visual briefs' },
  { cmd: '/calendar',  label: '📅 Calendar',    title: 'Build a 30-day cross-platform content calendar' },
  { cmd: '/audience',  label: '🎯 Audience',    title: 'Suggest cold, warm, hot platform targeting' },
  { cmd: '/budget',    label: '💰 Budget',      title: 'Build a multi-channel budget plan with ROAS math' },
  { cmd: '/audit',     label: '🔍 Audit',       title: 'Audit my campaign setup, ads, or results' },
  { cmd: '/diagnose',  label: '🩺 Diagnose',    title: 'Troubleshoot a performance/dropoff problem' },
  { cmd: '/checklist', label: '✅ Checklist',   title: 'Show the pre-launch compliance checklist' },
  { cmd: '/policy',    label: '⚖️ Policy',      title: 'Review ad copy against platform policies' },
]

// ─────────────────────────────────────────────
// Filter tags
// `live` is a computed filter (agent.badge === 'Live'); the rest match agent.tags
// ─────────────────────────────────────────────
const FILTER_TAGS = [
  { id: 'all',       label: 'All Genies' },
  { id: 'live',      label: 'Live now' },
  { id: 'marketing', label: 'Marketing & Sales' },
  { id: 'legal',     label: 'Legal' },
  { id: 'money',     label: 'Tax & Money' },
  { id: 'migration', label: 'Migration' },
  { id: 'education', label: 'Education' },
  { id: 'home',      label: 'Home & Interior' },
  { id: 'travel',    label: 'Travel' },
]
const TAG_LABEL = Object.fromEntries(FILTER_TAGS.map(t => [t.id, t.label]))

// ─────────────────────────────────────────────
// The 7 AI Genies
// bannerImage: set to a real path (e.g. '/images/genie/legal.jpg') to replace the placeholder.
// The agent `id` 'facebook-marketing' is kept — the backend routes on it.
// ─────────────────────────────────────────────
const AI_GENIES = [
  {
    id: 'facebook-marketing',
    title: 'Social Media Marketing Specialist',
    role: 'Multi-Platform Ad & Growth Specialist',
    badge: 'Live',
    icon: Target,
    gradient: 'from-[#021610] via-[#0a4836] to-[#0f8a63]',
    bannerImage: null,
    tags: ['marketing'],
    description: 'Cross-platform ad copy, video scripts, targeting & campaign strategies for Google Ads, YouTube, LinkedIn, Pinterest, Snapchat & Meta.',
    samplePrompts: [
      'Create high-converting Google Ads search copy and keywords',
      'Write a YouTube video ad script with hook, body, and CTA',
    ],
    ratePerMinute: 10,
    currency: '₹',
  },
  {
    id: 'legal-consultancy',
    title: 'Legal Consultancy',
    role: 'Legal Advisor for Solo Founders',
    badge: null,
    icon: Scale,
    gradient: 'from-[#04261c] to-[#0a4836]',
    bannerImage: null,
    tags: ['legal'],
    description: 'IP ownership, contracts, NDAs, platform T&Cs, data privacy (IT Act / GDPR) and the right legal structure for your solo business.',
    samplePrompts: [
      'Who owns the content I create for a client — me or them?',
      'Draft a freelance service agreement with payment milestones',
    ],
    ratePerMinute: 10,
    currency: '₹',
  },
  {
    id: 'tax-consultancy',
    title: 'Tax Consultancy',
    role: 'Tax & Compliance Advisor',
    badge: null,
    icon: Landmark,
    gradient: 'from-orange-500 to-orange-700',
    bannerImage: null,
    tags: ['money'],
    description: 'Income tax, GST, advance tax, ITR filing guidance and deductions for freelancers and self-employed founders.',
    samplePrompts: [
      'What ITR form should I file as a freelancer earning ₹12 lakh?',
      'How do I calculate advance tax for an irregular monthly income?',
    ],
    ratePerMinute: 10,
    currency: '₹',
  },
  {
    id: 'migration-consultancy',
    title: 'Migration Consultancy',
    role: 'Visa & Immigration Guide',
    badge: null,
    icon: Compass,
    gradient: 'from-teal-700 to-emerald-500',
    bannerImage: null,
    tags: ['migration', 'legal'],
    description: 'Visa pathways, points calculators, documentation checklists and step-by-step timelines for moving abroad to work or settle.',
    samplePrompts: [
      'Compare skilled-migration options for a software freelancer',
      'List the documents I need for a Canada Express Entry profile',
    ],
    ratePerMinute: 10,
    currency: '₹',
  },
  {
    id: 'higher-education-consultancy',
    title: 'Higher Education Consultancy',
    role: 'Study-Abroad & Admissions Counsellor',
    badge: null,
    icon: GraduationCap,
    gradient: 'from-[#0a4836] to-lime-600',
    bannerImage: null,
    tags: ['education', 'migration'],
    description: 'Course and university shortlisting, application timelines, SOP guidance, scholarships and budget planning.',
    samplePrompts: [
      'Shortlist 5 MS Data Science programs for a ₹30 lakh budget',
      'Outline a strong Statement of Purpose for an MBA application',
    ],
    ratePerMinute: 10,
    currency: '₹',
  },
  {
    id: 'interior-consultancy',
    title: 'Interior Consultancy',
    role: 'Interior & Space Planning Designer',
    badge: null,
    icon: Armchair,
    gradient: 'from-amber-500 to-orange-600',
    bannerImage: null,
    tags: ['home'],
    description: 'Room layouts, colour palettes, furniture and lighting plans, and budget breakdowns for homes, studios and small offices.',
    samplePrompts: [
      'Plan a 2BHK living room on a ₹1.5 lakh budget',
      'Suggest a colour palette for a small north-facing bedroom',
    ],
    ratePerMinute: 10,
    currency: '₹',
  },
  {
    id: 'travel-consultancy',
    title: 'Travel Consultancy',
    role: 'Trip Planner & Itinerary Designer',
    badge: null,
    icon: Plane,
    gradient: 'from-[#0f6b4f] to-green-500',
    bannerImage: null,
    tags: ['travel'],
    description: 'Day-by-day itineraries, visa and packing checklists, budget estimates and best-season advice for domestic and international trips.',
    samplePrompts: [
      'Plan a 7-day Kerala trip for a family of four',
      'Build a budget itinerary for 10 days in Thailand',
    ],
    ratePerMinute: 10,
    currency: '₹',
  },
]

// Flat list kept for session/chat logic that references agents by id
const SPECIALIST_AGENTS = AI_GENIES

const BTN_ORANGE = 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30'

// Banner block — shows the real image when `bannerImage` is set, otherwise a branded placeholder
function GenieBanner({ agent, tall = false }) {
  const Icon = agent.icon
  return (
    <div className={`relative w-full overflow-hidden bg-gradient-to-tr ${agent.gradient} ${tall ? 'h-full min-h-[220px]' : 'h-40'}`}>
      {agent.bannerImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={agent.bannerImage} alt={`${agent.title} banner`} className="genie-banner-media absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #fff 0, transparent 40%), radial-gradient(circle at 80% 80%, #fff 0, transparent 35%)' }} />
          <Icon className="genie-banner-media absolute -right-4 -bottom-4 w-36 h-36 text-white/20" />
          <div className="absolute left-4 bottom-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/25 text-white/90 text-[11px] font-medium backdrop-blur-sm">
            <ImageIcon className="w-3.5 h-3.5" /> Banner image placeholder
          </div>
        </>
      )}
      <div className="genie-icon-tile absolute left-4 top-4 w-11 h-11 rounded-xl bg-white/95 text-[#0a4836] flex items-center justify-center shadow-md">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Interactive card: 3D tilt + cursor-following light + lift/enlarge on hover.
// Neighbouring cards dim slightly so the hovered one stands out. Motion is
// skipped for people who prefer reduced motion. Live cards open the session
// dialog when clicked anywhere.
// ─────────────────────────────────────────────
function GenieCard({ agent, isFeatured, isActive, isDimmed, index, sessionOpen, onHover, onOpen, onTag }) {
  const cardRef = useRef(null)
  const isLive = agent.badge === 'Live'
  const tilt = isFeatured ? 2 : 7
  const scale = isFeatured ? 1.015 : 1.05

  const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleMove = (e) => {
    const el = cardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    el.style.setProperty('--mx', `${x}px`)
    el.style.setProperty('--my', `${y}px`)
    if (prefersReducedMotion()) return
    const px = x / r.width - 0.5
    const py = y / r.height - 0.5
    el.style.transform = `perspective(1000px) rotateX(${(-py * tilt).toFixed(2)}deg) rotateY(${(px * tilt * 1.3).toFixed(2)}deg) scale(${scale})`
  }

  const handleLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = ''
    onHover(null)
  }

  const openIfLive = () => { if (isLive && !sessionOpen) onOpen(agent) }

  return (
    <div
      className={`genie-rise ${isFeatured ? 'sm:col-span-2 lg:col-span-3' : ''} ${isActive ? 'relative z-20' : 'relative z-0'}`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div
        ref={cardRef}
        onMouseEnter={() => onHover(agent.id)}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={openIfLive}
        className={`genie-card group relative h-full bg-white rounded-2xl border overflow-hidden flex ${
          isFeatured ? 'flex-col md:flex-row' : 'flex-col'
        } ${isLive && !sessionOpen ? 'cursor-pointer' : ''} ${
          isActive
            ? 'border-[#0f6b4f] shadow-2xl shadow-[#053728]/30'
            : isDimmed
            ? 'border-[#c9f2d8] opacity-70 scale-[0.98] shadow-sm'
            : 'border-[#c9f2d8] shadow-sm'
        }`}
      >
        {/* Cursor-following light */}
        <div
          className="genie-spotlight pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        />

        <div className={isFeatured ? 'md:w-2/5 shrink-0' : ''}>
          <GenieBanner agent={agent} tall={isFeatured} />
        </div>

        <div className="p-6 flex flex-col justify-between flex-1 relative">
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-xs font-bold text-[#0a4836] uppercase tracking-wider">{agent.role}</p>
              <div className="flex items-center gap-2 shrink-0">
                {isLive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d9f5e4] text-[#053728] border border-[#a7f3c0] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0f6b4f] animate-pulse" /> Live
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-wider">
                    Coming Soon
                  </span>
                )}
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f2faf5] text-[#0a4836] border border-[#c9f2d8]">
                  {agent.currency} {agent.ratePerMinute}/min
                </span>
              </div>
            </div>

            <h3 className={`font-bold text-[#06352a] mb-2 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>{agent.title}</h3>

            {agent.id === 'facebook-marketing' && (
              <div className="flex items-center gap-1.5 mb-3 p-1.5 bg-[#f2faf5] border border-[#c9f2d8] rounded-xl w-fit max-w-full">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Supports:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SOCIAL_PLATFORMS_CONFIG.map(p => (
                    <span key={p.id} title={p.name} className="p-1 bg-white rounded-md border border-[#d9f5e4]">
                      {p.svg}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-600 leading-relaxed mb-4">{agent.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {agent.tags.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTag(t) }}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f2faf5] text-[#0a4836] border border-[#c9f2d8] hover:bg-[#d9f5e4] hover:border-[#0f6b4f] transition-colors"
                >
                  {TAG_LABEL[t]}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 mb-6">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Try asking:</p>
              {agent.samplePrompts.slice(0, 2).map((prompt, pIdx) => (
                <div key={pIdx} className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="text-orange-500">•</span>
                  <span className="truncate italic">&ldquo;{prompt}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#d9f5e4] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0f6b4f] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 1 min Free
            </span>
            {isLive ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpen(agent) }}
                disabled={sessionOpen}
                className={`genie-cta inline-flex items-center gap-1.5 px-4 py-2 ${BTN_ORANGE} text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Start Session <ArrowRight className="w-3.5 h-3.5 genie-cta-arrow" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f2faf5] text-[#0a4836]/50 text-xs font-semibold rounded-xl cursor-not-allowed border border-[#c9f2d8]"
              >
                Not Live
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AiGeniePage() {
  // Modal & Active Session State
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isConsentOpen, setIsConsentOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('google')
  const [activeSession, setActiveSession] = useState(null)
  const [isStarting, setIsStarting] = useState(false)
  const [sessionSummary, setSessionSummary] = useState(null)

  // Filter + hover state
  const [activeFilter, setActiveFilter] = useState('all')
  const [hoveredId, setHoveredId] = useState(null)

  // Timer & Billing State
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isStopping, setIsStopping] = useState(false)

  // Chat State
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [handoffBrief, setHandoffBrief] = useState(null)
  // Pending file attachment — set on file select, cleared after user presses Send
  // shape: { name, size, type: 'brief'|'text', parsed? }
  const [pendingAttachment, setPendingAttachment] = useState(null)

  const fileInputRef = useRef(null)
  const chatContainerRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Resize the textarea to fit its content
  const resizeTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }

  // Resizable chat panel — height in px, draggable via the handle bar
  const [chatHeight, setChatHeight] = useState(480)
  const dragStateRef = useRef(null)

  const handleResizeStart = (e) => {
    const startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
    dragStateRef.current = { startY, startHeight: chatHeight }
    const onMove = (ev) => {
      const y = ev.type === 'touchmove' ? ev.touches[0].clientY : ev.clientY
      const delta = y - dragStateRef.current.startY
      setChatHeight(Math.max(260, Math.min(900, dragStateRef.current.startHeight + delta)))
    }
    const onUp = () => {
      dragStateRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)
  }

  // Sync textarea height whenever inputText changes
  useEffect(() => { resizeTextarea() }, [inputText])

  // Voice State
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef(null)

  // Auto-start session from Campaign Builder handoff (?agent=&session_id=&handoff=1)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const agentParam = params.get('agent')
    const sessionIdParam = params.get('session_id')
    const isHandoff = params.get('handoff') === '1'
    if (!agentParam || !sessionIdParam || !isHandoff) return

    const agent = SPECIALIST_AGENTS.find(a => a.id === agentParam)
    if (!agent) return

    let restoredSession
    try {
      const stored = localStorage.getItem('fb_handoff_session')
      restoredSession = stored ? JSON.parse(stored) : null
      localStorage.removeItem('fb_handoff_session')
    } catch (_) { restoredSession = null }

    if (!restoredSession) {
      restoredSession = { session_id: sessionIdParam, agent_id: agentParam, status: 'active' }
    }

    setActiveSession(restoredSession)
    setElapsedSeconds(0)
    setSelectedAgent(agent)

    try {
      const storedBrief = localStorage.getItem('fb_handoff_brief')
      if (storedBrief) setHandoffBrief(JSON.parse(storedBrief))
      localStorage.removeItem('fb_handoff_brief')
    } catch (_) {}

    const handoffPrompt = localStorage.getItem('fb_handoff_prompt') || ''
    localStorage.removeItem('fb_handoff_prompt')
    const greeting = handoffPrompt ||
      `👋 Welcome back! Your Campaign Launch Brief has been loaded. I already know your niche, budget, approved copy angles, and automation rules — no need to re-explain anything.\n\nLet's take your campaign to the next level. What would you like to work on first?`
    setMessages([{ role: 'assistant', content: greeting }])

    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setVoiceSupported(true)
        const recognizer = new SpeechRecognition()
        recognizer.continuous = true
        recognizer.interimResults = true
        recognizer.lang = 'en-US'

        recognizer.onresult = (event) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          if (transcript) {
            setInputText(prev => (prev ? `${prev} ${transcript}` : transcript))
          }
        }
        recognizer.onerror = () => setIsListening(false)
        recognizer.onend = () => setIsListening(false)
        recognitionRef.current = recognizer
      }
    }
  }, [])

  // Live Timer & Heartbeat Effect
  useEffect(() => {
    let interval = null
    let heartbeatInterval = null

    if (activeSession && activeSession.status === 'active') {
      interval = setInterval(() => setElapsedSeconds(sec => sec + 1), 1000)

      heartbeatInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/agent-session/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: activeSession.session_id }),
          })
          if (res.ok) {
            const data = await res.json()
            if (data.session) {
              setActiveSession(prev => ({ ...prev, ...data.session }))
            }
          }
        } catch (err) {
          console.error('Heartbeat sync error:', err)
        }
      }, 15000)
    }

    return () => {
      if (interval) clearInterval(interval)
      if (heartbeatInterval) clearInterval(heartbeatInterval)
    }
  }, [activeSession])

  // Scroll page to chat workspace whenever a session becomes active
  useEffect(() => {
    if (activeSession && chatContainerRef.current) {
      const top = chatContainerRef.current.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }
  }, [activeSession?.session_id])

  // Scroll only the inner messages container to its bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isSending])

  // Open Consent Modal
  const handleOpenConsent = (agent) => {
    setSelectedAgent(agent)
    setIsConsentOpen(true)
  }

  // Agree and Start Session
  const handleStartSession = async () => {
    if (!selectedAgent) return
    setIsStarting(true)

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') : ''
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/agent-session/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          agent_name: selectedAgent.title,
          rate_per_minute: selectedAgent.ratePerMinute,
          currency: selectedAgent.currency,
        }),
      })

      if (!res.ok) throw new Error('Failed to start session')
      const data = await res.json()

      setActiveSession(data.session)
      setElapsedSeconds(0)
      setIsConsentOpen(false)

      if (selectedAgent.id === 'facebook-marketing') {
        const platformObj = SOCIAL_PLATFORMS_CONFIG.find(p => p.id === selectedPlatform) || SOCIAL_PLATFORMS_CONFIG[0]
        setMessages([{
          role: 'assistant',
          content: `👋 Hi! I'm your **Social Media Marketing Specialist** focused on **${platformObj.name}**.\n\nI'll help you build a high-converting **${platformObj.name}** marketing & ad system — from campaign structure and ad copy to video scripts and budget optimization.\n\n⏱️ Your first **1 minute is free**. Let's make the most of it!\n\n**⚡ How to use the quick tools below the chat bar:**\n- 📍 **/plan** — View your personalized step-by-step marketing roadmap and milestones.\n- ✍️ **/ads** — Instantly generate platform-tailored ad copy variations & headlines.\n- 🎬 **/creative** — Produce video scripts, short-form concepts, and visual creative briefs.\n- 📅 **/calendar** — Build a structured content and publishing calendar.\n- 🎯 **/audience** — Define cold, warm, and retargeting audience segments.\n- 💰 **/budget** — Calculate ROAS, daily spend targets, and break-even math.\n- 🔍 **/audit** & 🩺 **/diagnose** — Analyze your current ads or troubleshoot drop-offs.\n- ⚖️ **/policy** — Check your messaging against ${platformObj.name} ad policies.\n\n👉 **Click any button below** to start immediately, or type your business details and requirements in the chat! 🚀`,
        }])
      } else {
        setMessages([{
          role: 'assistant',
          content: `👋 Hello! I am your **${selectedAgent.title} Genie**. Your live session is now active. The first 1 minute is free! How can I assist you today?`,
        }])
      }
    } catch (err) {
      alert('Could not start agent session. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  // Stop Session
  const handleStopSession = async () => {
    if (!activeSession) return
    setIsStopping(true)
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    try {
      const res = await fetch('/api/agent-session/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSession.session_id }),
      })

      if (res.ok) {
        const data = await res.json()
        setSessionSummary(data.session)
      }
    } catch (err) {
      console.error('Error stopping session:', err)
    } finally {
      setIsStopping(false)
      setActiveSession(null)
    }
  }

  // Send Message — routes FB Marketing agent to Claude Sonnet endpoint
  const handleSendMessage = async (customText = null, inputType = 'text') => {
    if (!activeSession || isSending) return

    const isFbAgent = activeSession.agent_id === 'facebook-marketing'
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') : ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    // ── Brief attachment pending: inject it into agent state first ──
    if (pendingAttachment?.type === 'brief' && !customText) {
      setPendingAttachment(null)
      setIsSending(true)
      setMessages(prev => [...prev, {
        role: 'user',
        content: `📎 Sending campaign brief: **${pendingAttachment.name}**`,
      }])
      try {
        const res = await fetch('/api/agent/fb-marketing/inject-brief', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: activeSession.session_id,
            brief: pendingAttachment.parsed,
          }),
        })
        const data = await res.json()
        const prompt = data.agent_handoff_prompt ||
          '✅ Campaign brief loaded. What would you like to work on first?'
        setMessages(prev => [...prev, { role: 'assistant', content: prompt }])
      } catch {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ Could not load the campaign brief. Please try again.',
        }])
      } finally {
        setIsSending(false)
      }
      return
    }

    // ── Normal text / file-content message ──
    const textToSend = customText || inputText
    if (!textToSend.trim()) return

    const userMsg = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    if (pendingAttachment) setPendingAttachment(null)
    setIsSending(true)

    try {
      if (isFbAgent) {
        // 3-minute AbortController timeout — mirrors proxyTimeout in next.config.js
        const fbAbortCtrl = new AbortController()
        const fbTimeoutId = setTimeout(() => fbAbortCtrl.abort(), 180_000)
        let res
        try {
          res = await fetch('/api/agent/fb-marketing/chat', {
            method: 'POST',
            headers,
            signal: fbAbortCtrl.signal,
            body: JSON.stringify({
              session_id: activeSession.session_id,
              platform: selectedPlatform,
              message: textToSend,
              input_type: inputType,
            }),
          })
        } catch (fetchErr) {
          clearTimeout(fbTimeoutId)
          const isTimeout = fetchErr?.name === 'AbortError'
          console.error('[fb-agent] fetch error:', fetchErr)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: isTimeout
              ? '⚠️ The agent is taking longer than expected. Your request is still being processed — please wait a moment and refresh if needed.'
              : '⚠️ Could not reach the FB Marketing Agent. Please check your connection and try again.',
          }])
          return
        }
        clearTimeout(fbTimeoutId)
        if (res.ok) {
          const data = await res.json()
          if (data.reply) {
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '⚠️ The agent returned an empty response. Please try again.',
            }])
          }
        } else {
          const rawText = await res.text().catch(() => '')
          let detail = ''
          try { detail = JSON.parse(rawText)?.detail || '' } catch (_) { detail = rawText.slice(0, 200) }
          console.error('[fb-agent] HTTP', res.status, detail || rawText)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `⚠️ Error ${res.status}: ${detail || 'Could not reach the FB Marketing Agent. Please try again.'}`,
          }])
        }
      } else {
        // Generic session endpoint for all other Genies (as they go live)
        const res = await fetch('/api/agent-session/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: activeSession.session_id,
            content: textToSend,
            input_type: inputType,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.assistant_message) {
            setMessages(prev => [...prev, data.assistant_message])
          }
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Network error — please check your connection and try again.',
      }])
    } finally {
      setIsSending(false)
    }
  }

  // Toggle Voice-to-text
  const toggleVoice = () => {
    if (!voiceSupported) {
      alert('Voice-to-text is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (err) {
        console.error('Voice start error:', err)
      }
    }
  }

  // Format seconds mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Filtering
  const matchesFilter = (agent) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'live') return agent.badge === 'Live'
    return agent.tags.includes(activeFilter)
  }
  const visibleGenies = AI_GENIES.filter(matchesFilter)
  const countFor = (id) => (id === 'all' ? AI_GENIES.length : AI_GENIES.filter(a => (id === 'live' ? a.badge === 'Live' : a.tags.includes(id))).length)

  // Jump from a hero icon to that Genie's category in the directory
  const jumpToGenie = (agent) => {
    setActiveFilter(agent.tags[0] || 'all')
    const el = typeof document !== 'undefined' ? document.getElementById('genie-directory') : null
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 140
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }
  }

  // Current billable status
  const isFreeTier = elapsedSeconds <= 60
  const billableMinutes = isFreeTier ? 0 : Math.ceil((elapsedSeconds - 60) / 60)
  const currentCost = activeSession ? billableMinutes * activeSession.rate_per_minute : 0

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f2faf5] to-white pt-16 lg:pt-20 pb-16">
      <style jsx global>{`
        /* One orchestrated entrance: cards rise in, staggered */
        @keyframes genieRise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        .genie-rise { animation: genieRise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

        /* Hero icon rail bobs gently */
        @keyframes genieFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .genie-float { animation: genieFloat 4.5s ease-in-out infinite; }

        /* Card interaction */
        .genie-card { transition: transform 0.18s ease-out, box-shadow 0.3s ease, opacity 0.3s ease, border-color 0.3s ease; will-change: transform; transform-style: preserve-3d; }
        .genie-spotlight { background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(167, 243, 192, 0.28), transparent 55%); mix-blend-mode: soft-light; }
        .genie-card:hover .genie-banner-media { transform: scale(1.18) rotate(-4deg); }
        .genie-banner-media { transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
        .genie-card:hover .genie-icon-tile { transform: translateY(-3px) scale(1.12); }
        .genie-icon-tile { transition: transform 0.3s ease; }
        .genie-card:hover .genie-cta { transform: scale(1.08); padding-left: 1.25rem; padding-right: 1.25rem; }
        .genie-cta { transition: transform 0.25s ease, padding 0.25s ease, background 0.2s ease; }
        .genie-card:hover .genie-cta-arrow { transform: translateX(4px); }
        .genie-cta-arrow { transition: transform 0.25s ease; }

        @media (prefers-reduced-motion: reduce) {
          .genie-rise, .genie-float { animation: none; }
          .genie-card, .genie-banner-media, .genie-icon-tile, .genie-cta, .genie-cta-arrow { transition: none; }
          .genie-card:hover .genie-banner-media, .genie-card:hover .genie-icon-tile, .genie-card:hover .genie-cta, .genie-card:hover .genie-cta-arrow { transform: none; }
        }
      `}</style>

      {/* ──────────────── Hero band (full width) ──────────────── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836]">
        <div className="pointer-events-none absolute -top-24 -right-24 w-[26rem] h-[26rem] rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-[26rem] h-[26rem] rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="relative w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-14 lg:py-20 text-center">
          <div className="inline-flex items-center px-4 py-1.5 bg-[#a7f3c0]/10 border border-[#a7f3c0]/30 rounded-full text-xs font-semibold text-[#a7f3c0] mb-5 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            7 Specialist AI Genies • Per-Minute Live Studio
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-5">
            AI Genie
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-emerald-50/80 leading-relaxed max-w-3xl mx-auto">
            Talk to a dedicated AI consultant for marketing, legal, tax, migration, education, interiors and travel.
            Enjoy the <span className="font-semibold text-[#a7f3c0]">first 1 minute 100% free</span>, then pay per minute as you go.
          </p>

          {/* Genie icon rail */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {AI_GENIES.map((g, i) => {
              const GIcon = g.icon
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => jumpToGenie(g)}
                  title={g.title}
                  aria-label={`Jump to ${g.title}`}
                  className="genie-float group flex flex-col items-center focus:outline-none"
                  style={{ animationDelay: `${i * 0.35}s` }}
                >
                  <span className="w-14 h-14 rounded-2xl bg-white/10 border border-[#a7f3c0]/30 backdrop-blur-sm flex items-center justify-center text-[#a7f3c0] transition-all duration-200 group-hover:scale-125 group-hover:bg-[#a7f3c0] group-hover:text-[#053728] group-hover:shadow-lg group-hover:shadow-[#a7f3c0]/30 group-focus-visible:ring-2 group-focus-visible:ring-[#a7f3c0]">
                    <GIcon className="w-6 h-6" />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 pt-10">

        {/* ──────────────── Active Chat Workspace (If Session Active) ──────────────── */}
        {activeSession && (
          <div ref={chatContainerRef} className="mb-12 bg-white rounded-3xl border border-[#c9f2d8] shadow-xl overflow-hidden transition-all">
            {/* Active Session Header & Live Timer */}
            <div className="bg-gradient-to-r from-[#021610] via-[#053728] to-[#0a4836] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#053728]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#a7f3c0] text-[#053728] flex items-center justify-center font-bold shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {activeSession.agent_name} Genie
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-100/70">Rate: {activeSession.currency} {activeSession.rate_per_minute}/min after 1st minute</p>
                </div>
              </div>

              {/* Live Timer & Pricing Meter */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/25 px-4 py-2 rounded-xl border border-[#a7f3c0]/20">
                  <Clock className={`w-4 h-4 ${isFreeTier ? 'text-emerald-300 animate-pulse' : 'text-amber-400'}`} />
                  <span className="font-mono text-sm font-bold tracking-wider">{formatTime(elapsedSeconds)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isFreeTier ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-400 border border-amber-700'}`}>
                    {isFreeTier ? `FREE (${60 - elapsedSeconds}s left)` : `BILLING: ${billableMinutes} min (${activeSession.currency} ${currentCost})`}
                  </span>
                </div>

                <button
                  onClick={handleStopSession}
                  disabled={isStopping}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  {isStopping ? 'Stopping...' : 'Stop & Finish'}
                </button>
              </div>
            </div>

            {/* Chat Messages Canvas — height is user-resizable via the drag handle below */}
            <div
              ref={messagesContainerRef}
              className="p-6 sm:p-8 bg-[#f2faf5] overflow-y-auto space-y-4"
              style={{ height: `${chatHeight}px` }}
            >
              {messages.map((m, idx) => {
                const isUser = m.role === 'user'
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-3xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-[#0a4836] text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-[#c9f2d8] rounded-bl-none'
                      }`}
                    >
                      {/* Assistant messages get markdown rendering; user messages are plain text */}
                      {!isUser ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-5 py-3 text-xs text-gray-500 border border-[#c9f2d8] flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f6b4f] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f6b4f] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f6b4f] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    {activeSession.agent_id === 'facebook-marketing' ? 'Social Media Specialist is thinking...' : 'Genie is generating response...'}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Resize handle */}
            <div
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              title="Drag to resize chat window"
              className="group relative flex items-center justify-center h-3 bg-[#d9f5e4] border-y border-[#c9f2d8] cursor-ns-resize select-none hover:bg-[#c9f2d8] transition-colors"
            >
              <div className="w-8 h-1 rounded-full bg-[#0f6b4f]/40 group-hover:bg-[#0f6b4f] transition-colors" />
              <span className="absolute right-3 text-[10px] text-[#0a4836]/60 group-hover:text-[#0a4836] transition-colors select-none">
                ↕ resize
              </span>
            </div>

            {/* Handoff Brief Attachment Chip */}
            {handoffBrief && (
              <div className="px-4 pt-3 pb-0">
                <div className="flex items-center gap-2 bg-[#f2faf5] border border-[#a7f3c0] rounded-xl px-3 py-2 w-fit max-w-full">
                  <Paperclip className="w-3.5 h-3.5 text-[#0f6b4f] flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-[#053728] truncate">
                    {`campaign-launch-brief-${(handoffBrief.meta?.niche || 'campaign').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`}
                  </span>
                  <button
                    type="button"
                    title="Send brief into chat"
                    onClick={() => {
                      const niche = handoffBrief.meta?.niche || 'my business'
                      const budget = handoffBrief.meta?.monthly_budget || '—'
                      const copies = handoffBrief.structured?.copies_approved ?? '—'
                      const rules = handoffBrief.structured?.rules_active ?? '—'
                      handleSendMessage(
                        `I've shared my Campaign Launch Brief with you. Here's a quick summary:\n` +
                        `• Niche: ${niche}\n• Budget: ₹${budget}/mo\n• Approved copy angles: ${copies}\n• Active automation rules: ${rules}\n\n` +
                        `You already have the full brief loaded. Let's work on launching this campaign — what should we tackle first?`
                      )
                    }}
                    className="ml-1 p-1 rounded-lg hover:bg-[#d9f5e4] text-[#0f6b4f] hover:text-[#053728] transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Download brief JSON"
                    onClick={() => {
                      const filename = `campaign-launch-brief-${(handoffBrief.meta?.niche || 'campaign').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`
                      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(handoffBrief, null, 2))
                      const a = document.createElement('a')
                      a.setAttribute('href', dataStr)
                      a.setAttribute('download', filename)
                      a.click()
                    }}
                    className="p-1 rounded-lg hover:bg-[#d9f5e4] text-[#0f6b4f] hover:text-[#053728] transition-colors flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Chat Input Controls */}
            <div className="p-4 bg-white border-t border-[#c9f2d8] space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.log,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const inputEl = e.target
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const content = ev.target?.result
                    inputEl.value = ''
                    if (typeof content !== 'string') return

                    const trimmed = content.trim()
                    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                      let parsed
                      try { parsed = JSON.parse(trimmed) } catch (_) { parsed = null }
                      if (parsed && activeSession?.agent_id === 'facebook-marketing') {
                        setPendingAttachment({ name: file.name, size: file.size, type: 'brief', parsed })
                        return
                      }
                    }

                    setPendingAttachment({ name: file.name, size: file.size, type: 'text' })
                    setInputText(content)
                  }
                  reader.onerror = () => { inputEl.value = '' }
                  reader.readAsText(file)
                }}
              />

              {pendingAttachment && (
                <div className="flex items-center gap-2 bg-[#f2faf5] border border-[#a7f3c0] rounded-xl px-3 py-2">
                  <Paperclip className="w-3.5 h-3.5 text-[#0f6b4f] flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-[#053728] truncate flex-1">
                    {pendingAttachment.type === 'brief' ? '📋 Brief ready: ' : '📄 File loaded: '}
                    {pendingAttachment.name}
                    <span className="font-normal text-[#0f6b4f] ml-1">
                      ({(pendingAttachment.size / 1024).toFixed(1)} KB)
                    </span>
                  </span>
                  <span className="text-[10px] text-[#0f6b4f] font-medium flex-shrink-0">
                    Press Send ↵ to submit
                  </span>
                  <button
                    type="button"
                    title="Remove attachment"
                    onClick={() => { setPendingAttachment(null); setInputText('') }}
                    className="ml-1 text-[#0f6b4f] hover:text-[#053728] flex-shrink-0 text-sm leading-none"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleVoice}
                  title={isListening ? 'Stop microphone' : 'Speak using voice-to-text'}
                  className={`p-3 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-rose-50 border-rose-300 text-rose-600 animate-bounce'
                      : 'bg-[#f2faf5] hover:bg-[#d9f5e4] border-[#c9f2d8] text-[#0a4836]'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach a file (.txt, .md, .csv, .log, .json)"
                  className="p-3 rounded-xl border bg-[#f2faf5] hover:bg-[#d9f5e4] border-[#c9f2d8] text-[#0a4836] transition-all"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value)
                    resizeTextarea()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={
                    isListening
                      ? 'Listening to your voice... Speak now'
                      : activeSession.agent_id === 'facebook-marketing'
                        ? 'Describe your business, ask a question, or type a /command…  (Shift+Enter for new line)'
                        : 'Ask your Genie or describe your requirements…  (Shift+Enter for new line)'
                  }
                  className="flex-1 px-4 py-3 border border-[#c9f2d8] rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#0f6b4f] focus:border-[#0f6b4f] focus:outline-none resize-none overflow-y-auto leading-5 transition-[height]"
                  style={{ minHeight: '46px', maxHeight: '240px' }}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputText.trim() && !pendingAttachment) || isSending}
                  className={`px-5 py-3 ${BTN_ORANGE} rounded-xl font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-40 disabled:shadow-none`}
                >
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {isListening && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                  Recording voice... Click the mic button again or press Send when finished.
                </p>
              )}

              {/* Quick-Command Pills — Social Media Marketing Genie only */}
              {activeSession.agent_id === 'facebook-marketing' && !isListening && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
                    <Zap className="w-3 h-3" /> Quick:
                  </span>
                  {FB_QUICK_COMMANDS.map(({ cmd, label, title }) => (
                    <button
                      key={cmd}
                      title={title}
                      onClick={() => handleSendMessage(cmd)}
                      disabled={isSending}
                      className="px-2.5 py-1 rounded-lg bg-[#f2faf5] hover:bg-[#d9f5e4] border border-[#c9f2d8] text-[#0a4836] text-[11px] font-semibold transition-colors disabled:opacity-40"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────── Genie Directory ──────────────── */}
        <div id="genie-directory" className="mb-14 scroll-mt-32">
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#06352a]">Pick the Genie for the job</h2>
              <p className="text-sm text-gray-500 mt-1">Hover a card, then click to start. Describe what you need and get a finished draft, plan or checklist in minutes.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#053728] bg-[#d9f5e4] border border-[#a7f3c0] px-3 py-1.5 rounded-lg font-medium shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#0f6b4f]" />
              1 Minute Free on Every Session
            </div>
          </div>

          {/* Filter tags — stay visible while scrolling the grid */}
          <div className="sticky top-16 lg:top-20 z-30 -mx-4 sm:-mx-6 lg:-mx-10 2xl:-mx-16 px-4 sm:px-6 lg:px-10 2xl:px-16 py-3 mb-6 bg-white/85 backdrop-blur-md border-y border-[#d9f5e4]">
            <div className="flex gap-2 overflow-x-auto sm:flex-wrap" role="tablist" aria-label="Filter Genies">
              {FILTER_TAGS.map((tag) => {
                const isActive = activeFilter === tag.id
                return (
                  <button
                    key={tag.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(tag.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6b4f] ${
                      isActive
                        ? 'bg-[#0a4836] text-white border-[#0a4836] shadow-md scale-105'
                        : 'bg-white text-[#0a4836] border-[#c9f2d8] hover:border-[#0f6b4f] hover:bg-[#f2faf5]'
                    }`}
                  >
                    {tag.id === 'live' && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-orange-400' : 'bg-orange-500'}`} />}
                    {tag.label}
                    <span className={`text-[10px] font-semibold px-1.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#d9f5e4] text-[#0a4836]'}`}>
                      {countFor(tag.id)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Genie grid: featured live Genie spans the full row on "All", the other six sit in a 3 × 2 grid */}
          {visibleGenies.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-[#a7f3c0] rounded-2xl">
              <p className="text-sm font-semibold text-[#06352a]">No Genies match this filter yet.</p>
              <button onClick={() => setActiveFilter('all')} className="mt-3 text-xs font-bold text-orange-600 hover:text-orange-700">
                Show all Genies
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {visibleGenies.map((agent, i) => {
                const isLive = agent.badge === 'Live'
                const isFeatured = isLive && activeFilter === 'all'
                return (
                  <GenieCard
                    key={`${activeFilter}-${agent.id}`}
                    agent={agent}
                    index={i}
                    isFeatured={isFeatured}
                    isActive={hoveredId === agent.id}
                    isDimmed={hoveredId !== null && hoveredId !== agent.id}
                    sessionOpen={!!activeSession}
                    onHover={setHoveredId}
                    onOpen={handleOpenConsent}
                    onTag={setActiveFilter}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* ──────────────── Consent & Rate Confirmation Modal ──────────────── */}
        {isConsentOpen && selectedAgent && (
          <div className="fixed inset-0 bg-[#021610]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#c9f2d8] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedAgent.gradient} text-white flex items-center justify-center shadow-md`}>
                  <selectedAgent.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#06352a]">Start Session: {selectedAgent.title}</h3>
                  <p className="text-xs text-gray-500">{selectedAgent.role}</p>
                </div>
              </div>

              {/* Platform selection (Social Media Marketing Genie only) */}
              {selectedAgent.id === 'facebook-marketing' && (
                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2.5">
                    Select Social Media Ad Platform
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SOCIAL_PLATFORMS_CONFIG.map((platform) => {
                      const isSelected = selectedPlatform === platform.id
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => setSelectedPlatform(platform.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? `${platform.activeRing} border-transparent shadow-sm`
                              : `${platform.bgColor} ${platform.borderColor} text-gray-700`
                          }`}
                        >
                          <div className="shrink-0 p-1 bg-white rounded-lg flex items-center justify-center">
                            {platform.svg}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate leading-tight">{platform.name}</p>
                            <p className="text-[10px] text-gray-500 truncate leading-tight">{platform.badge}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 italic">
                    The Genie will customize prompts, targeting strategies, ad specs, and compliance guardrails specifically for this platform.
                  </p>
                </div>
              )}

              <div className="bg-[#f2faf5] border border-[#a7f3c0] rounded-2xl p-4 mb-6 space-y-2 text-sm text-[#053728]">
                <p className="font-bold flex items-center gap-1.5 text-[#053728]">
                  <Info className="w-4 h-4 text-[#0f6b4f]" /> Per-Minute Billing Terms
                </p>
                <ul className="text-xs space-y-1.5 text-[#053728]/85 list-disc list-inside">
                  <li><strong>First 1 minute (60 seconds) is 100% Free</strong>.</li>
                  <li>After 60 seconds, time is billed at <strong>{selectedAgent.currency} {selectedAgent.ratePerMinute} per 1-minute block</strong>.</li>
                  <li>Live clock starts as soon as you confirm below.</li>
                  <li>You can end the session and stop billing at any time by clicking <strong>&quot;Stop &amp; Finish&quot;</strong>.</li>
                  <li>Supports both <strong>Text typing</strong> and <strong>Voice-to-Text</strong> real-time input.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsConsentOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#0a4836] text-[#0a4836] text-sm font-semibold hover:bg-[#f2faf5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartSession}
                  disabled={isStarting}
                  className={`px-6 py-2.5 ${BTN_ORANGE} text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2`}
                >
                  {isStarting ? 'Starting Session...' : 'Agree & Start Chat'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────── Session Summary & Receipt Modal ──────────────── */}
        {sessionSummary && (
          <div className="fixed inset-0 bg-[#021610]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#c9f2d8] text-center">
              <div className="w-14 h-14 bg-[#d9f5e4] text-[#0f6b4f] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#06352a] mb-1">Session Complete</h3>
              <p className="text-xs text-gray-500 mb-6">{sessionSummary.agent_name} Genie</p>

              <div className="bg-[#f2faf5] border border-[#c9f2d8] rounded-2xl p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Total Duration:</span>
                  <span className="font-bold text-gray-900">{formatTime(sessionSummary.total_seconds)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Free Duration:</span>
                  <span className="font-semibold text-[#0f6b4f]">1 min (60s)</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Billable Minutes:</span>
                  <span className="font-bold text-gray-900">{sessionSummary.billable_minutes} min</span>
                </div>
                <div className="pt-2 border-t border-[#c9f2d8] flex justify-between text-sm font-black text-gray-900">
                  <span>Total Charged:</span>
                  <span className="text-[#0a4836]">{sessionSummary.currency} {sessionSummary.total_charged}</span>
                </div>
              </div>

              <button
                onClick={() => setSessionSummary(null)}
                className={`w-full py-3 ${BTN_ORANGE} rounded-xl font-bold text-sm transition-all`}
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}