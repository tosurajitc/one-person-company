'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles, Send, X, Bot, ChevronRight, HelpCircle,
  BookOpen, ExternalLink, Minimize2, Maximize2, Loader2,
  CheckCircle, ArrowRight
} from 'lucide-react'

// Suggested starter prompts based on common wizard & admin questions
const QUICK_QUESTIONS = [
  'How do I change my pricing tiers?',
  'Where do I add my Calendly booking link?',
  'How do I configure what is NOT included?',
  'Where do I add doctor degrees or council reg?',
  'How do I add a downloadable digital product?',
  'How do I update weekly course curriculum?',
]

export default function AdminGenieChatDrawer({ currentStep = null, activeTemplate = null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm **Admin Genie**, your assistant for building and customizing your website. Ask me where to edit any field, how to configure your template, or how to write high-converting copy!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [isOpen, messages])

  const handleSend = async (userPrompt = null) => {
    const textToSend = typeof userPrompt === 'string' ? userPrompt : input
    if (!textToSend.trim() || loading) return

    const userMessage = {
      role: 'user',
      content: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Future AI endpoint connection point: /api/genie/rag-chat or /api/chat
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') : ''
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: textToSend.trim(),
          context: {
            currentStep,
            activeTemplate,
            source: 'admin_setup_wizard',
            knowledge_base: 'SETUP_WIZARD_RAG_KB',
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const botReply = data.response || data.message || data.reply || formatLocalFallback(textToSend.trim())
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: botReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tokensUsed: data.tokens_used || 0,
            totalTokens: data.total_tokens_used || 0,
          },
        ])
      } else {
        // Graceful fallback with rule-based answers while AI model is connected
        const fallbackReply = formatLocalFallback(textToSend.trim())
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: fallbackReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      }
    } catch (_) {
      const fallbackReply = formatLocalFallback(textToSend.trim())
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Client-side instant RAG fallback while backend model hook is finalized
  function formatLocalFallback(query) {
    const q = query.toLowerCase()
    if (q.includes('price') || q.includes('tier') || q.includes('pricing') || q.includes('cost')) {
      return "💡 **To edit your Pricing & Offers:**\n\nNavigate to **Step 4: Offers & Pricing** in the wizard.\n- **Front Door Tier:** Enter your low-friction discovery call / audit fee.\n- **Core Tier:** Enter your signature project / package fee.\n- **Recurring Tier:** Enter your monthly retainer or subscription.\n\n*Tip:* Enter only numeric values (e.g. `25000`, not `₹25,000/-`)."
    }
    if (q.includes('calendar') || q.includes('calendly') || q.includes('booking') || q.includes('book')) {
      return "📅 **To add your Calendar / Booking Link:**\n\n1. Go to **Step 6: Front Door & Lead Capture**.\n2. In the **Booking Calendar URL** field, paste your direct scheduling link (e.g., `https://calendly.com/yourname/30min` or `https://cal.com/yourname`).\n3. Select your preferred **Primary Action** as *Book a Call*."
    }
    if (q.includes('not included') || q.includes('included') || q.includes('scope')) {
      return "🛡️ **To configure Scope Boundaries (Included vs Not Included):**\n\n1. Go to **Step 7: Knowledge & Delivery**.\n2. Add items to **What is always included**.\n3. Add items to **Out of Scope / Not Included**.\n\nThis renders a clear boundary card on templates like *Consultant & Advisor* to prevent client scope creep."
    }
    if (q.includes('doctor') || q.includes('council') || q.includes('degree') || q.includes('clinic')) {
      return "🩺 **For Clinic & Medical Practitioners:**\n\n- **Medical Degrees (MBBS, MD, FRCP):** Enter in **Step 2: Identity** under *Your Role / Title*.\n- **Council Registration No. (e.g. DMC #8342):** Enter in **Step 5: Proof & Trust** under *Credentials & Licenses*.\n- **Clinic Locality:** Enter in **Step 2: Identity** in the *City / Location* field."
    }
    if (q.includes('digital product') || q.includes('asset') || q.includes('template') || q.includes('download')) {
      return "📦 **To sell a Downloadable Digital Product / Asset:**\n\n1. Go to **Step 4: Offers & Pricing**.\n2. Scroll to the **Digital Product** card and toggle it **Enabled**.\n3. Enter the **Product Name**, **Summary**, **Price (INR / USD)**, and direct **Download Link**."
    }
    if (q.includes('curriculum') || q.includes('module') || q.includes('course') || q.includes('cohort')) {
      return "🎓 **For Course Creators & Educators:**\n\n- **12-Week Curriculum:** Go to **Step 7: Knowledge & Delivery** -> *How do you deliver? (Process Steps)*. Set each step title as a Module/Week and the detail as lesson topics.\n- **Next Batch / Cohort Date:** Enter in **Step 4: Offers** under your Core Offer duration & summary."
    }
    return "✨ **Admin Genie Recommendation:**\n\nYou can configure this field directly from the **Setup Wizard** steps on the left.\n- **Steps 1-3:** Identity, Persona & Positioning\n- **Steps 4-5:** Offers, Rates & Proof / Testimonials\n- **Steps 6-8:** Front Door / Booking, Knowledge / FAQs & Brand Colors\n- **Steps 9-11:** Payments, Social Channels & Domain Settings\n\n*Feel free to ask about any specific template or section!*"
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-24 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-200 border border-white/20 group"
          aria-label="Open Admin Genie AI Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </div>
          <span className="font-bold text-sm">Ask Admin Genie</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300"></span>
          </span>
        </button>
      )}

      {/* Right-Side Chat Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-0 right-0 z-50 transition-all duration-300 ease-in-out flex flex-col bg-white border-l border-t border-gray-200 shadow-2xl ${
            isExpanded
              ? 'w-full md:w-[600px] h-full md:h-[90vh] md:bottom-4 md:right-4 md:rounded-2xl md:border'
              : 'w-full sm:w-[420px] h-[580px] sm:bottom-4 sm:right-4 sm:rounded-2xl sm:border'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between rounded-t-2xl sm:rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white">Admin Genie</h3>
                  <span className="text-[10px] bg-blue-500/40 text-blue-100 px-1.5 py-0.5 rounded font-mono">
                    RAG KB
                  </span>
                </div>
                <p className="text-xs text-blue-100/80">Website Builder & Template Copilot</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden md:flex p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 text-white mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line prose prose-sm max-w-none">
                    {m.content}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-gray-100/60">
                    {m.role === 'assistant' && m.tokensUsed ? (
                      <span className="text-[10px] text-blue-600/80 font-mono">
                        ⚡ {m.tokensUsed} tokens
                      </span>
                    ) : (
                      <span />
                    )}
                    <span
                      className={`text-[10px] ${
                        m.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 text-white">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white text-gray-500 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-2">
                  <span>Genie is checking the knowledge base…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length <= 3 && (
            <div className="p-3 bg-white border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Common Questions
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {QUICK_QUESTIONS.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-left text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={e => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 rounded-b-2xl sm:rounded-b-2xl"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Genie where to edit a field or template…"
              className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
