'use client'

import { useState, useEffect, useRef } from 'react'
import {
  PenTool,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  Mic,
  MicOff,
  Send,
  Square,
  DollarSign,
  FileText,
  Share2,
  Mail,
  Presentation,
  Globe,
  Target,
  Info,
  ShieldCheck,
  AlertTriangle,
  Zap,
  UserRound,
  MapPin,
  MessageCircle,
  Headphones,
  Lightbulb,
  Search,
  Wallet,
  ClipboardList,
  ScrollText,
  Scale,
  Settings,
  CalendarCheck,
  Download,
  Paperclip,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

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
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-blue-700">$1</code>')
    // Bullet lists
    .replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 leading-normal">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700 leading-normal"><strong>$1.</strong> $2</li>')
    // Wrap consecutive <li> in <ul> (stripping trailing newlines inside list to prevent br insertion)
    .replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, m => `<ul class="space-y-1 my-2">${m.replace(/\n/g, '')}</ul>`)
    // Table rows — basic support
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split('|').map(c => c.trim())
      const isHeader = false
      return '<tr>' + cells.map(c => `<td class="border border-gray-200 px-2 py-1 text-xs">${c}</td>`).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, m => `<div class="overflow-x-auto my-3"><table class="w-full text-left border-collapse border border-gray-200 text-xs">${m}</table></div>`)
    // Clean empty paragraph wrappers around block elements (ul, table, headers, hr)
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

// Supported social marketing platforms with badges and logos
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
// Specialist Agent Definitions
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Category definitions with all specialist agents
// ─────────────────────────────────────────────
const AGENT_CATEGORIES = [
  {
    id: 'marketing',
    label: '1. Marketing & Content',
    color: 'blue',
    agents: [
      {
        id: 'blog-posts',
        title: 'Blog Posts & Articles',
        role: 'Editorial & SEO Specialist',
        badge: null,
        icon: FileText,
        gradient: 'from-blue-500 to-indigo-600',
        description: 'SEO-ready long-form content on any topic — one prompt, full draft in seconds.',
        samplePrompts: [
          'Draft an outline for a guide on solo founder cashflow',
          'Write a 1200-word article comparing freelancing vs agency work',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'social-media',
        title: 'Social Media Captions',
        role: 'Viral Growth Copywriter',
        badge: null,
        icon: Share2,
        gradient: 'from-purple-500 to-pink-600',
        description: 'LinkedIn, Instagram, X — channel-aware copy with the right tone for each platform.',
        samplePrompts: [
          'Turn my product update into a 5-tweet viral thread',
          'Write 3 high-hook LinkedIn carousels for B2B consultants',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'email-sequences',
        title: 'Email Sequences',
        role: 'Lifecycle & Funnel Architect',
        badge: null,
        icon: Mail,
        gradient: 'from-amber-500 to-orange-600',
        description: 'Welcome flows, nurture sequences, and sales emails written in your voice.',
        samplePrompts: [
          'Create a 5-day welcome sequence for new subscribers',
          'Write a high-converting cold outreach email to agency owners',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'landing-page-copy',
        title: 'Website & Landing Page Copy',
        role: 'Direct Response Copywriter',
        badge: null,
        icon: Globe,
        gradient: 'from-cyan-500 to-blue-600',
        description: 'Headlines, feature descriptions, FAQs, and CTAs that convert.',
        samplePrompts: [
          'Write 5 punchy hero headlines for an AI accounting tool',
          'Structure a high-converting pricing page comparison section',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'brand-identity',
        title: 'Brand Identity & Positioning',
        role: 'Personal Brand Strategist',
        badge: null,
        icon: UserRound,
        gradient: 'from-violet-500 to-purple-700',
        description: 'Brand voice, taglines, bios, and a positioning statement that sets you apart.',
        samplePrompts: [
          'Write my LinkedIn headline and About section as a finance coach',
          'Give me 10 tagline options for an eco-friendly candle brand',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'local-seo',
        title: 'Local Visibility',
        role: 'Local SEO & Google Business Specialist',
        badge: null,
        icon: MapPin,
        gradient: 'from-green-500 to-emerald-700',
        description: 'Google Business Profile descriptions, review replies, and local keyword plans.',
        samplePrompts: [
          'Optimise my Google Business Profile for a salon in Salt Lake',
          'Write replies to 3 negative Google reviews',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
    ],
  },
  {
    id: 'sales',
    label: '2. Sales & Clients',
    color: 'emerald',
    agents: [
      {
        id: 'facebook-marketing',
        title: 'Social Media Marketing Specialist',
        role: 'Multi-Platform Ad & Growth Specialist',
        badge: 'Live',
        icon: Target,
        gradient: 'from-blue-600 via-indigo-600 to-purple-700',
        description: 'Cross-platform ad copy, video scripts, targeting & campaign strategies for Google Ads, YouTube, LinkedIn, Pinterest, Snapchat & Meta.',
        samplePrompts: [
          'Create high-converting Google Ads search copy and keywords',
          'Write a YouTube video ad script with hook, body, and CTA',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'pitch-decks',
        title: 'Pitch Decks & Proposals',
        role: 'Deal & Proposal Strategist',
        badge: null,
        icon: Presentation,
        gradient: 'from-emerald-500 to-teal-600',
        description: 'Slide-ready content and client proposal templates tailored to your offer.',
        samplePrompts: [
          'Create an 8-slide pitch deck structure for seed investors',
          'Write a standard client retainer proposal with 3 service tiers',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'sales-scripts',
        title: 'Sales Scripts & Objection Handling',
        role: 'Sales Closer & Negotiation Coach',
        badge: null,
        icon: MessageCircle,
        gradient: 'from-orange-500 to-red-600',
        description: 'Discovery call scripts, follow-ups, and replies to "it\'s too expensive."',
        samplePrompts: [
          'Write a 15-minute discovery call script for a bookkeeping client',
          'How do I respond when a client asks for a 40% discount?',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'whatsapp-messaging',
        title: 'WhatsApp Business Messaging',
        role: 'WhatsApp & DM Sales Specialist',
        badge: null,
        icon: Share2,
        gradient: 'from-green-600 to-green-800',
        description: 'Broadcast messages, catalogue descriptions, and auto-replies.',
        samplePrompts: [
          'Write 5 WhatsApp broadcast messages for my Diwali sale',
          'Create quick-reply templates for common customer questions',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'customer-support',
        title: 'Customer Support & Retention',
        role: 'Client Success Manager',
        badge: null,
        icon: Headphones,
        gradient: 'from-pink-500 to-rose-600',
        description: 'FAQ answers, complaint replies, onboarding messages, and review requests.',
        samplePrompts: [
          'Draft a polite reply to an angry customer about a late delivery',
          'Write a WhatsApp message asking happy clients for a Google review',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
    ],
  },
  {
    id: 'strategy',
    label: '3. Strategy & Planning',
    color: 'violet',
    agents: [
      {
        id: 'business-plan',
        title: 'Business Plan & Validation',
        role: 'Business Strategy Advisor',
        badge: null,
        icon: Lightbulb,
        gradient: 'from-yellow-500 to-amber-600',
        description: 'Test your idea, find your niche, and build a lean one-page plan.',
        samplePrompts: [
          'Validate my idea for a home-baked cake business in Kolkata',
          'Create a one-page business plan for a freelance video editing service',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'pricing-packages',
        title: 'Pricing & Packages',
        role: 'Pricing & Offer Strategist',
        badge: null,
        icon: DollarSign,
        gradient: 'from-teal-500 to-cyan-700',
        description: 'Tiered packages, value-based pricing, and competitor benchmarks.',
        samplePrompts: [
          'Design 3 pricing tiers for my social media management service',
          'Should I charge hourly or per project for web design?',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'market-research',
        title: 'Competitor & Customer Research',
        role: 'Market Research Analyst',
        badge: null,
        icon: Search,
        gradient: 'from-indigo-500 to-blue-700',
        description: 'Map competitors, understand customer pain points, and build buyer personas.',
        samplePrompts: [
          'Build 2 customer personas for an online yoga coaching business',
          'Compare my offer against 3 typical competitors and find gaps',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
    ],
  },
  {
    id: 'money',
    label: '4. Cashflow, Tax & Legal',
    color: 'amber',
    agents: [
      {
        id: 'cashflow',
        title: 'Cashflow & Budgeting',
        role: 'Cashflow & Finance Advisor',
        badge: null,
        icon: Wallet,
        gradient: 'from-lime-500 to-green-700',
        description: 'Cashflow forecasts, monthly budgets, break-even math, and savings targets for irregular income.',
        samplePrompts: [
          'Build a 6-month cashflow forecast for my freelance income',
          'How many clients do I need to break even at ₹40,000/month expenses?',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'tax',
        title: 'Tax Planning & Filing Basics',
        role: 'Tax & Compliance Advisor',
        badge: null,
        icon: ClipboardList,
        gradient: 'from-orange-500 to-amber-700',
        description: 'Income tax, GST, advance tax, ITR filing guidance, and deductions for self-employed individuals.',
        samplePrompts: [
          'What ITR form should I file as a freelancer earning ₹12 lakh?',
          'How do I calculate advance tax for an irregular monthly income?',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'compliance',
        title: 'GST, Invoices & Registration Basics',
        role: 'Compliance & Paperwork Guide',
        badge: null,
        icon: ClipboardList,
        gradient: 'from-yellow-500 to-orange-600',
        description: 'Plain-language help with GST, Udyam/MSME registration, invoicing, and business structures.',
        samplePrompts: [
          'Do I need GST registration as a freelancer earning ₹15 lakh a year?',
          'Explain the difference between a sole proprietorship and an OPC',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'legal',
        title: 'Legal Guidelines',
        role: 'Legal Advisor for Solo Founders',
        badge: null,
        icon: Scale,
        gradient: 'from-slate-600 to-gray-800',
        description: 'IP ownership, copyright basics, platform T&C compliance, data privacy (IT Act / GDPR), dispute notices, and legal structures for solo businesses.',
        samplePrompts: [
          'Who owns the content I create for a client — me or them?',
          'What data privacy rules apply to my Indian SaaS product with EU users?',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'contracts',
        title: 'Contracts & Policies',
        role: 'Contract & Agreement Drafter',
        badge: null,
        icon: ScrollText,
        gradient: 'from-rose-500 to-pink-700',
        description: 'Freelance contracts, NDAs, terms of service, and refund policy drafts.',
        samplePrompts: [
          'Draft a freelance service agreement with payment milestones',
          'Write a refund policy for my online course',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
    ],
  },
  {
    id: 'operations',
    label: '5. Operations & Productivity',
    color: 'slate',
    agents: [
      {
        id: 'workflows-automation',
        title: 'Workflows & Automation',
        role: 'Operations & Automation Architect',
        badge: null,
        icon: Settings,
        gradient: 'from-gray-600 to-slate-800',
        description: 'SOPs, tool stack recommendations, and step-by-step automation plans.',
        samplePrompts: [
          'Write an SOP for onboarding a new client from payment to kickoff',
          'Suggest a free tool stack to automate my invoicing and reminders',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'productivity',
        title: 'Weekly Planning & Focus',
        role: 'Productivity Coach',
        badge: null,
        icon: CalendarCheck,
        gradient: 'from-sky-500 to-blue-700',
        description: 'Time-blocked weekly plans, priority sorting, and burnout-proof routines.',
        samplePrompts: [
          'Plan my week: 3 client projects, content creation, and admin',
          'Help me decide which tasks to outsource first',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
    ],
  },
]

// Flat list kept for session/chat logic that references agents by id
const SPECIALIST_AGENTS = AGENT_CATEGORIES.flatMap(c => c.agents)

export default function ContentStudioPage() {
  // Modal & Active Session State
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isConsentOpen, setIsConsentOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('google')
  const [activeSession, setActiveSession] = useState(null)
  const [isStarting, setIsStarting] = useState(false)
  const [sessionSummary, setSessionSummary] = useState(null)

  // Timer & Billing State
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isStopping, setIsStopping] = useState(false)

  // Chat State
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [handoffBrief, setHandoffBrief] = useState(null)
  // Pending file attachment — set on file select, cleared after user presses Send
  const [pendingAttachment, setPendingAttachment] = useState(null)
  // pendingAttachment shape: { name, size, type: 'brief'|'text', parsed?, content? }

  // File upload ref
  const fileInputRef = useRef(null)

  // Chat workspace scroll anchor (scrolls the page to show the chat panel)
  const chatContainerRef = useRef(null)

  // Inner messages scroll container (scrolls only the overflow-y-auto div, not the page)
  const messagesContainerRef = useRef(null)

  // Textarea ref — needed to programmatically resize after file content is loaded
  const textareaRef = useRef(null)

  // Resize the textarea to fit its content (called on every inputText change)
  const resizeTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }

  // Resizable chat panel — height in px, draggable via the handle bar
  const [chatHeight, setChatHeight] = useState(480)
  const dragStateRef = useRef(null) // { startY, startHeight }

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

  // Sync textarea height whenever inputText changes (covers voice injection,
  // file loads, quick-command insertions, and post-send clear)
  useEffect(() => { resizeTextarea() }, [inputText])

  // Voice State
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)

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

    // Restore full session object — prefer the one stored in localStorage by handoffToSpecialist
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

    // Read the brief JSON for the attachment chip
    try {
      const storedBrief = localStorage.getItem('fb_handoff_brief')
      if (storedBrief) setHandoffBrief(JSON.parse(storedBrief))
      localStorage.removeItem('fb_handoff_brief')
    } catch (_) {}

    // Read the LLM-generated handoff opening message relayed via localStorage
    const handoffPrompt = localStorage.getItem('fb_handoff_prompt') || ''
    localStorage.removeItem('fb_handoff_prompt')
    const greeting = handoffPrompt ||
      `👋 Welcome back! Your Campaign Launch Brief has been loaded. I already know your niche, budget, approved copy angles, and automation rules — no need to re-explain anything.\n\nLet's take your campaign to the next level. What would you like to work on first?`
    setMessages([{ role: 'assistant', content: greeting }])

    // Clean URL params without reload
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

        recognizer.onerror = () => {
          setIsListening(false)
        }

        recognizer.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognizer
      }
    }
  }, [])

  // Live Timer & Heartbeat Effect
  useEffect(() => {
    let interval = null
    let heartbeatInterval = null

    if (activeSession && activeSession.status === 'active') {
      // Local second-by-second ticker
      interval = setInterval(() => {
        setElapsedSeconds(sec => sec + 1)
      }, 1000)

      // Server heartbeat every 15s
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

  // Scroll page to chat workspace whenever a session becomes active.
  // Uses window.scrollTo so only the page scroll moves — the inner messages
  // container scroll is handled separately below.
  useEffect(() => {
    if (activeSession && chatContainerRef.current) {
      const top = chatContainerRef.current.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }
  }, [activeSession?.session_id])   // only when session ID changes, not on every heartbeat update

  // Scroll only the inner messages container to its bottom on new messages.
  // Direct scrollTop manipulation avoids scrollIntoView bubbling up to the window.
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isSending])

  // Resize textarea whenever inputText changes (covers programmatic setInputText
  // from file loads — React does not fire the DOM onChange in that case).
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [inputText])

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

      // Social Media Marketing agent gets a tailored welcome based on selected platform; others get a static greeting
      if (selectedAgent.id === 'facebook-marketing') {
        const platformObj = SOCIAL_PLATFORMS_CONFIG.find(p => p.id === selectedPlatform) || SOCIAL_PLATFORMS_CONFIG[0]
        setMessages([{
          role: 'assistant',
          content: `👋 Hi! I'm your **Social Media Marketing Specialist** focused on **${platformObj.name}**.\n\nI'll help you build a high-converting **${platformObj.name}** marketing & ad system — from campaign structure and ad copy to video scripts and budget optimization.\n\n⏱️ Your first **1 minute is free**. Let's make the most of it!\n\n**⚡ How to use the quick tools below the chat bar:**\n- 📍 **/plan** — View your personalized step-by-step marketing roadmap and milestones.\n- ✍️ **/ads** — Instantly generate platform-tailored ad copy variations & headlines.\n- 🎬 **/creative** — Produce video scripts, short-form concepts, and visual creative briefs.\n- 📅 **/calendar** — Build a structured content and publishing calendar.\n- 🎯 **/audience** — Define cold, warm, and retargeting audience segments.\n- 💰 **/budget** — Calculate ROAS, daily spend targets, and break-even math.\n- 🔍 **/audit** & 🩺 **/diagnose** — Analyze your current ads or troubleshoot drop-offs.\n- ⚖️ **/policy** — Check your messaging against ${platformObj.name} ad policies.\n\n👉 **Click any button below** to start immediately, or type your business details and requirements in the chat! 🚀`,
        }])
      } else {
        setMessages([{
          role: 'assistant',
          content: `👋 Hello! I am your **${selectedAgent.title} Specialist**. Your live session is now active. The first 1 minute is free! How can I assist you today?`,
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

    // ── Brief attachment pending: inject it into agent state first ──────────
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

    // ── Normal text / file-content message ──────────────────────────────────
    const textToSend = customText || inputText
    if (!textToSend.trim()) return

    const userMsg = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    if (pendingAttachment) setPendingAttachment(null)
    setIsSending(true)

    try {
      if (isFbAgent) {
        // Route to Claude Sonnet FB Marketing Agent endpoint.
        // Use a 3-minute AbortController timeout — mirrors the proxyTimeout in
        // next.config.js so the UI surfaces a clear message instead of a raw 500
        // if the proxy ever drops the connection on very large JSON payloads.
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
            // Backend returned 200 but reply is empty — show a fallback
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '⚠️ The agent returned an empty response. Please try again.',
            }])
          }
        } else {
          // Capture status + raw body to surface the real error
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
        // Generic placeholder for all other agents
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

  // Left-nav active category highlight & collapsible state
  const [activeCategory, setActiveCategory] = useState(AGENT_CATEGORIES[0].id)
  const [openCategories, setOpenCategories] = useState({
    marketing: true,
    sales: true,
    strategy: false,
    money: false,
    operations: false,
  })

  const toggleCategoryAccordion = (catId) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  // Scroll to a category section and update active highlight
  const scrollToCategory = (catId) => {
    setActiveCategory(catId)
    setOpenCategories(prev => ({ ...prev, [catId]: true }))
    const el = document.getElementById(`cat-${catId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Track which category is in view via IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined') return
    const observers = []
    AGENT_CATEGORIES.forEach((cat) => {
      const el = document.getElementById(`cat-${cat.id}`)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveCategory(cat.id) },
        { threshold: 0.25 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  // Current billable status
  const isFreeTier = elapsedSeconds <= 60
  const billableMinutes = isFreeTier ? 0 : Math.ceil((elapsedSeconds - 60) / 60)
  const currentCost = activeSession ? billableMinutes * activeSession.rate_per_minute : 0

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ──────────────── Header Banner ──────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700 mb-4 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Specialist AI Agents • Per-Minute Live Studio
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Digital Workforce
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Collaborate directly with dedicated AI Consultants across all your business formats.
            Enjoy the <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">first 1 minute 100% free</span>, then pay per minute chat as you create.
          </p>
        </div>

        {/* ──────────────── Active Chat Workspace (If Session Active) ──────────────── */}
        {activeSession && (
          <div ref={chatContainerRef} className="mb-12 bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden transition-all">
            {/* Active Session Header & Live Timer */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {activeSession.agent_name} Specialist
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Rate: {activeSession.currency} {activeSession.rate_per_minute}/min after 1st minute</p>
                </div>
              </div>

              {/* Live Timer & Pricing Meter */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                  <Clock className={`w-4 h-4 ${isFreeTier ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                  <span className="font-mono text-sm font-bold tracking-wider">{formatTime(elapsedSeconds)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isFreeTier ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-amber-950 text-amber-400 border border-amber-700'}`}>
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
              className="p-6 sm:p-8 bg-slate-50 overflow-y-auto space-y-4"
              style={{ height: `${chatHeight}px` }}
            >
              {messages.map((m, idx) => {
                const isUser = m.role === 'user'
                const isFbMsg = activeSession.agent_id === 'facebook-marketing'
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-2xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      {/* FB agent assistant messages get markdown rendering; everything else is plain text */}
                      {!isUser && isFbMsg ? (
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
                  <div className="bg-white rounded-2xl px-5 py-3 text-xs text-gray-500 border border-gray-200 flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'0ms'}} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'150ms'}} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'300ms'}} />
                    </span>
                    {activeSession.agent_id === 'facebook-marketing' ? 'Social Media Specialist is thinking...' : 'Specialist is generating response...'}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Resize handle — drag vertically to grow / shrink the chat window ── */}
            <div
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              title="Drag to resize chat window"
              className="group relative flex items-center justify-center h-3 bg-slate-100 border-y border-slate-200 cursor-ns-resize select-none hover:bg-blue-50 transition-colors"
            >
              <div className="flex gap-1 items-center">
                <div className="w-8 h-1 rounded-full bg-slate-300 group-hover:bg-blue-400 transition-colors" />
              </div>
              <span className="absolute right-3 text-[10px] text-slate-400 group-hover:text-blue-400 transition-colors select-none">
                ↕ resize
              </span>
            </div>

            {/* Handoff Brief Attachment Chip — pinned above input bar */}
            {handoffBrief && (
              <div className="px-4 pt-3 pb-0">
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 w-fit max-w-full">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-indigo-700 truncate">
                    {`campaign-launch-brief-${(handoffBrief.meta?.niche || 'campaign').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`}
                  </span>
                  {/* Send brief into chat */}
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
                    className="ml-1 p-1 rounded-lg hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  {/* Download brief JSON */}
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
                    className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-colors flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Chat Input Controls */}
            <div className="p-4 bg-white border-t border-gray-200 space-y-3">
              {/* Hidden file input — text and JSON files */}
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
                        // Stage as pending — user must press Send to confirm
                        setPendingAttachment({ name: file.name, size: file.size, type: 'brief', parsed })
                        return
                      }
                    }

                    // Text files: load into textarea — user reviews and presses Send
                    setPendingAttachment({ name: file.name, size: file.size, type: 'text' })
                    setInputText(content)
                  }
                  reader.onerror = () => { inputEl.value = '' }
                  reader.readAsText(file)
                }}
              />

              {/* Pending attachment chip — shown after file select, before Send */}
              {pendingAttachment && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                  <Paperclip className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-blue-700 truncate flex-1">
                    {pendingAttachment.type === 'brief' ? '📋 Brief ready: ' : '📄 File loaded: '}
                    {pendingAttachment.name}
                    <span className="font-normal text-blue-500 ml-1">
                      ({(pendingAttachment.size / 1024).toFixed(1)} KB)
                    </span>
                  </span>
                  <span className="text-[10px] text-blue-500 font-medium flex-shrink-0">
                    Press Send ↵ to submit
                  </span>
                  <button
                    type="button"
                    title="Remove attachment"
                    onClick={() => { setPendingAttachment(null); setInputText('') }}
                    className="ml-1 text-blue-400 hover:text-blue-600 flex-shrink-0 text-sm leading-none"
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
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach a file (.txt, .md, .csv, .log, .json)"
                  className="p-3 rounded-xl border bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 transition-all"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value)
                    // resizeTextarea() will also fire via the useEffect above,
                    // but calling it here too gives immediate feedback on each keystroke.
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
                        : 'Ask your specialist agent or describe your requirements…  (Shift+Enter for new line)'
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none overflow-y-auto leading-5 transition-[height]"
                  style={{ minHeight: '46px', maxHeight: '240px' }}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputText.trim() && !pendingAttachment) || isSending}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-40"
                >
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Voice recording indicator */}
              {isListening && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                  Recording voice... Click the mic button again or press Send when finished.
                </p>
              )}

              {/* FB Quick-Command Pills — only shown for the Facebook Marketing agent */}
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
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-semibold transition-colors disabled:opacity-40"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────── Agent Cards — Categorised with Left Nav ──────────────── */}
        <div className="mb-14">
          {/* Section header */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Our AI Team to help you for Every Part of Your Business</h2>
              <p className="text-sm text-gray-500 mt-1">Get ready-to-use help with marketing, sales, pricing, money, contracts, and daily operations. Pick a specialist, describe what you need, and get a finished draft in minutes.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1 Minute Free on Every Agent Session
            </div>
          </div>

          {/* Mobile: horizontal category pills */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {AGENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Desktop: sidebar + content */}
          <div className="flex gap-8 items-start">

            {/* ── Left Sticky Nav ── */}
            <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Specialist Roster</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    1 Live Agent
                  </span>
                </div>
                <nav className="p-2 space-y-1">
                  {AGENT_CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.id
                    const isOpen = !!openCategories[cat.id]
                    return (
                      <div key={cat.id} className="rounded-xl overflow-hidden">
                        <div
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 shadow-xs'
                              : 'text-gray-700 hover:bg-slate-50 hover:text-gray-900'
                          }`}
                          onClick={() => toggleCategoryAccordion(cat.id)}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              scrollToCategory(cat.id)
                            }}
                            className="flex items-center gap-2 text-left min-w-0 flex-1 hover:text-blue-600"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`} />
                            <span className="truncate">{cat.label}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCategoryAccordion(cat.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                          </button>
                        </div>

                        {/* Dropdown list of agents under category */}
                        {isOpen && (
                          <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-3.5 my-1">
                            {cat.agents.map((agent) => {
                              const isLive = agent.badge === 'Live'
                              const AgentIcon = agent.icon
                              return (
                                <button
                                  key={agent.id}
                                  type="button"
                                  onClick={() => {
                                    if (isLive) {
                                      handleOpenConsent(agent)
                                    } else {
                                      scrollToCategory(cat.id)
                                    }
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left group ${
                                    isLive
                                      ? 'bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 font-semibold'
                                      : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <AgentIcon className={`w-3.5 h-3.5 shrink-0 ${isLive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className="truncate">{agent.title}</span>
                                  </div>
                                  <span className="ml-1.5 shrink-0">
                                    {isLive ? (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                                        Live
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-gray-400">
                                        Soon
                                      </span>
                                    )}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </nav>
                <div className="px-4 py-3 border-t border-gray-100 bg-slate-50">
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    <span className="font-semibold text-emerald-600">1 min free</span> on every session. Pay ₹10/min after.
                  </p>
                </div>
              </div>
            </aside>

            {/* ── Agent Sections ── */}
            <div className="flex-1 min-w-0 space-y-12">
              {AGENT_CATEGORIES.map((category) => (
                <div key={category.id} id={`cat-${category.id}`}>
                  {/* Category heading */}
                  <div className="flex items-center gap-3 mb-5">
                    <h3 className="text-base font-black text-gray-800 tracking-tight">{category.label}</h3>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {category.agents.map((agent) => {
                      const Icon = agent.icon
                      return (
                        <div
                          key={agent.id}
                          className="bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all p-6 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${agent.gradient} text-white flex items-center justify-center shadow-md`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex items-center gap-2">
                                {agent.badge ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                                    {agent.badge}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                                    Coming Soon
                                  </span>
                                )}
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                  {agent.currency} {agent.ratePerMinute}/min
                                </span>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{agent.role}</p>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{agent.title}</h3>
                            {agent.id === 'facebook-marketing' && (
                              <div className="flex items-center gap-1.5 mb-3 p-1.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Supports:</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {SOCIAL_PLATFORMS_CONFIG.map(p => (
                                    <span key={p.id} title={p.name} className="p-1 bg-white rounded-md border border-slate-200 shadow-2xs">
                                      {p.svg}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 leading-relaxed mb-4">{agent.description}</p>

                            <div className="space-y-1.5 mb-6">
                              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Example capabilities:</p>
                              {agent.samplePrompts.slice(0, 2).map((prompt, pIdx) => (
                                <div key={pIdx} className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                                  <span className="text-blue-500">•</span>
                                  <span className="truncate italic">"{prompt}"</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> 1 min Free
                              </span>
                              {agent.badge === 'Live' ? (
                                <button
                                  onClick={() => handleOpenConsent(agent)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                >
                                  Start Session <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed border border-slate-200"
                                >
                                  Not Live
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ──────────────── Consent & Rate Confirmation Modal ──────────────── */}
        {isConsentOpen && selectedAgent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedAgent.gradient} text-white flex items-center justify-center shadow-md`}>
                  <selectedAgent.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Start Session: {selectedAgent.title}</h3>
                  <p className="text-xs text-gray-500">{selectedAgent.role}</p>
                </div>
              </div>

              {/* Social Media Platform Selection (Shown only when Social Media Marketing agent is selected) */}
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
                          <div className="shrink-0 p-1 bg-white rounded-lg shadow-xs flex items-center justify-center">
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
                    The agent will customize prompts, targeting strategies, ad specs, and compliance guardrails specifically for this platform.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 space-y-2 text-sm text-blue-900">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <Info className="w-4 h-4 text-blue-600" /> Per-Minute Billing Terms
                </p>
                <ul className="text-xs space-y-1.5 text-blue-950/80 list-disc list-inside">
                  <li><strong>First 1 minute (60 seconds) is 100% Free</strong>.</li>
                  <li>After 60 seconds, time is billed at <strong>{selectedAgent.currency} {selectedAgent.ratePerMinute} per 1-minute block</strong>.</li>
                  <li>Live clock starts as soon as you confirm below.</li>
                  <li>You can end the session and stop billing at any time by clicking <strong>"Stop & Finish"</strong>.</li>
                  <li>Supports both <strong>Text typing</strong> and <strong>Voice-to-Text</strong> real-time input.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsConsentOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartSession}
                  disabled={isStarting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-1">Session Complete</h3>
              <p className="text-xs text-gray-500 mb-6">{sessionSummary.agent_name} Specialist Agent</p>

              <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Total Duration:</span>
                  <span className="font-bold text-gray-900">{formatTime(sessionSummary.total_seconds)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Free Duration:</span>
                  <span className="font-semibold text-emerald-600">1 min (60s)</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Billable Minutes:</span>
                  <span className="font-bold text-gray-900">{sessionSummary.billable_minutes} min</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-black text-gray-900">
                  <span>Total Charged:</span>
                  <span className="text-blue-600">{sessionSummary.currency} {sessionSummary.total_charged}</span>
                </div>
              </div>

              <button
                onClick={() => setSessionSummary(null)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md"
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
