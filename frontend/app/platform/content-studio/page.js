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
    .replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700"><strong>$1.</strong> $2</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => `<ul class="space-y-1 my-2">${m}</ul>`)
    // Table rows — basic support
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split('|').map(c => c.trim())
      const isHeader = false
      return '<tr>' + cells.map(c => `<td class="border border-gray-200 px-2 py-1 text-xs">${c}</td>`).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, m => `<div class="overflow-x-auto my-3"><table class="w-full text-left border-collapse border border-gray-200 text-xs">${m}</table></div>`)
    // Paragraphs — double newline
    .replace(/\n\n/g, '</p><p class="mb-2">')
    // Single newline
    .replace(/\n/g, '<br/>')

  return `<p class="mb-2">${html}</p>`
}

// Quick-command shortcuts shown below the input bar when FB agent is active
const FB_QUICK_COMMANDS = [
  { cmd: '/plan',      label: '📍 Plan',       title: 'Show my full roadmap & current progress' },
  { cmd: '/ads',       label: '✍️ Ad Copy',     title: 'Generate 3+ Facebook ad copy variations' },
  { cmd: '/creative',  label: '🎬 Creative',    title: 'Generate creative briefs & video scripts' },
  { cmd: '/calendar',  label: '📅 Calendar',    title: 'Build a 30-day organic content calendar' },
  { cmd: '/audience',  label: '🎯 Audience',    title: 'Suggest cold, warm, hot audience strategies' },
  { cmd: '/budget',    label: '💰 Budget',      title: 'Build a budget plan with break-even math' },
  { cmd: '/audit',     label: '🔍 Audit',       title: 'Audit my Page, ads, or results' },
  { cmd: '/diagnose',  label: '🩺 Diagnose',    title: 'Troubleshoot a performance problem' },
  { cmd: '/checklist', label: '✅ Checklist',   title: 'Show the pre-launch checklist' },
  { cmd: '/policy',    label: '⚖️ Policy',      title: 'Review ad copy for policy risks' },
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
        badge: 'Live',
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
        badge: 'Live',
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
        badge: 'Live',
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
        badge: 'Live',
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
        title: 'Facebook Marketing',
        role: 'Facebook Ads & Growth Specialist',
        badge: 'Live',
        icon: Target,
        gradient: 'from-blue-600 to-blue-800',
        description: 'Ad copy, post content, and campaign strategies built for Facebook — powered by Claude Sonnet.',
        samplePrompts: [
          'Write 3 Facebook ad variations for my coaching program',
          'Create a 7-day Facebook content calendar for my digital product',
        ],
        ratePerMinute: 10,
        currency: '₹',
      },
      {
        id: 'pitch-decks',
        title: 'Pitch Decks & Proposals',
        role: 'Deal & Proposal Strategist',
        badge: 'Live',
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

  // Voice State
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)

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

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

      // FB Marketing agent gets a tailored welcome via Claude; others get a static greeting
      if (selectedAgent.id === 'facebook-marketing') {
        setMessages([{
          role: 'assistant',
          content: '👋 Hi! I\'m **FB Growth Coach**, your personal Facebook & Meta marketing specialist — powered by Claude Sonnet.\n\nI\'ll help you build a complete, personalized Facebook marketing system — from first post to profitable ad campaigns.\n\n⏱️ Your first **1 minute is free**. Let\'s make the most of it!\n\n**To get started, tell me:**\n1. What are you selling? *(e.g., "I sell handmade candles online for ₹499 each")*\n2. Where do you sell — website, WhatsApp, physical store?\n3. Which country/city do you serve?\n\nOr type `/plan` to see all available commands, or **just tell me your product and goal** and I\'ll take it from there. 🚀',
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
    const textToSend = customText || inputText
    if (!textToSend.trim() || !activeSession || isSending) return

    const userMsg = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsSending(true)

    const isFbAgent = activeSession.agent_id === 'facebook-marketing'
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') : ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      if (isFbAgent) {
        // Route to Claude Sonnet FB Marketing Agent endpoint
        const res = await fetch('/api/agent/fb-marketing/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: activeSession.session_id,
            message: textToSend,
            input_type: inputType,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.reply) {
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
          }
        } else {
          const err = await res.json().catch(() => ({}))
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `⚠️ Error: ${err.detail || 'Could not reach the FB Marketing Agent. Please try again.'}`,
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

  // Left-nav active category highlight
  const [activeCategory, setActiveCategory] = useState(AGENT_CATEGORIES[0].id)

  // Scroll to a category section and update active highlight
  const scrollToCategory = (catId) => {
    setActiveCategory(catId)
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
            Specialist Content Creation Studio
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Collaborate directly with dedicated AI specialists across all your business formats.
            Enjoy the <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">first 1 minute 100% free</span>, then pay per minute chat as you create.
          </p>
        </div>

        {/* ──────────────── Active Chat Workspace (If Session Active) ──────────────── */}
        {activeSession && (
          <div className="mb-12 bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden transition-all">
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

            {/* Chat Messages Canvas */}
            <div className="p-6 sm:p-8 bg-slate-50 min-h-[360px] max-h-[480px] overflow-y-auto space-y-4">
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
                    {activeSession.agent_id === 'facebook-marketing' ? 'FB Growth Coach is thinking...' : 'Specialist is generating response...'}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Controls */}
            <div className="p-4 bg-white border-t border-gray-200 space-y-3">
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

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    isListening
                      ? 'Listening to your voice... Speak now'
                      : activeSession.agent_id === 'facebook-marketing'
                        ? 'Describe your business, ask a question, or type a /command...'
                        : 'Ask your specialist agent or describe your requirements...'
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isSending}
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
            <aside className="hidden lg:block w-56 shrink-0 sticky top-24 self-start">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 bg-slate-50">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Categories</p>
                </div>
                <nav className="py-2">
                  {AGENT_CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2.5 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-bold border-r-2 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`} />
                        {cat.label}
                      </button>
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
                                {agent.badge && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                                    {agent.badge}
                                  </span>
                                )}
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                  {agent.currency} {agent.ratePerMinute}/min
                                </span>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{agent.role}</p>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{agent.title}</h3>
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
                              <button
                                onClick={() => handleOpenConsent(agent)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                              >
                                Start Session <ArrowRight className="w-3.5 h-3.5" />
                              </button>
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
