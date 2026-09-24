'use client'

/**
 * SalesDeskSample
 * ------------------------------------------------------------------
 * Fallback preview for the AI Sales Desk. Shown on the dashboard ONLY while
 * the founder has no real enquiries yet, so the tab never looks empty and
 * they can see what the Sales Desk will do once enquiries arrive.
 *
 * Everything here is clearly labelled "Sample data". Nothing is sent, saved
 * or billed from this component. Names, prices and messages are made up.
 *
 * Props:
 *   onViewWebsite  optional; called by the "Share your website" button
 *
 * Theme: bottle green + light green + orange primary buttons.
 */

import { useState } from 'react'
import {
  Sparkles, Mail, Clock, CheckCircle, RefreshCw, Send, Flame,
  Inbox, CalendarClock, IndianRupee, Info, Globe,
} from 'lucide-react'

const BTN_ORANGE = 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30'
const CARD = 'bg-white rounded-2xl border border-[#c9f2d8]'

// ─── Sample data (exported so it can be reused in tests or a demo page) ──────
export const SAMPLE_ENQUIRIES = [
  {
    id: 'sample-1',
    name: 'Ananya Roy',
    email: 'ananya@example.com',
    source: 'Website contact form',
    received: '12 min ago',
    status: 'awaiting_approval',
    interest: 'hot',
    matchedOffer: 'GST Registration (₹3,000)',
    value: 3000,
    message:
      "Hi, I run a small design studio and just crossed the GST limit. I need to register and start filing this month. How quickly can you get it done, and what do you need from me?",
    aiSummary: 'Ready to buy. Needs GST registration within the month.',
    nextStep: 'Send the document checklist and offer a 15-minute call.',
    draft:
      "Hi Ananya,\n\nThank you for reaching out. Congratulations on crossing the threshold, that is a good sign for the studio.\n\nOur GST Registration package is ₹3,000. You receive your GSTIN, the registration certificate and your first return filed. Most registrations are complete within 7 to 10 working days once we have your documents.\n\nTo start, please send your PAN, Aadhaar, business address proof and a cancelled cheque. If it is easier to talk it through first, you can book a short call using the link on my website.\n\nWarm regards",
  },
  {
    id: 'sample-2',
    name: 'Rahul Mehta',
    email: 'rahul@example.com',
    source: 'WhatsApp',
    received: '2 hours ago',
    status: 'awaiting_approval',
    interest: 'warm',
    matchedOffer: 'Monthly Filing (₹2,500/month)',
    value: 30000,
    message:
      "We are a 4-person agency and our books are a mess. Someone told me you do monthly filing. Do you also clean up old records? Not sure if this is the right fit.",
    aiSummary: 'Interested in ongoing support. Unsure about fit and past clean-up.',
    nextStep: 'Suggest a free 30-minute intro call to review the records.',
    draft:
      "Hi Rahul,\n\nThanks for getting in touch. Yes, monthly filing includes reconciling your books, so older records can be brought up to date as part of getting started.\n\nThe best way to know if it is the right fit is a free 30-minute call. I can look at where things stand and tell you plainly what is needed. Would you like to pick a time this week?\n\nBest regards",
  },
  {
    id: 'sample-3',
    name: 'Priya Nair',
    email: 'priya@example.com',
    source: 'Website contact form',
    received: 'Yesterday',
    status: 'replied',
    interest: 'warm',
    matchedOffer: 'Free 30-min call',
    value: 0,
    message: "Can I see a sample of the report you give clients after an audit?",
    aiSummary: 'Wants proof before booking. Asked for a sample report.',
    nextStep: 'Follow up in 2 days if she has not booked.',
    draft:
      "Hi Priya,\n\nHappy to share an example. I have attached an anonymised audit report so you can see the format and level of detail. If it looks useful, we can go through it together on a free call.\n\nBest regards",
  },
  {
    id: 'sample-4',
    name: 'Karan Shah',
    email: 'karan@example.com',
    source: 'Instagram DM',
    received: '3 days ago',
    status: 'follow_up_due',
    interest: 'cold',
    matchedOffer: 'Annual Package',
    value: 24000,
    message: "Just exploring options for next year. What is your annual pricing?",
    aiSummary: 'Early stage, comparing options. No urgency stated.',
    nextStep: 'Send a short nudge with the annual package summary.',
    draft:
      "Hi Karan,\n\nJust following up on your question about annual pricing. The Annual Package covers everything for the year and works out cheaper than paying month by month. I am happy to send the full breakdown if it would help you compare.\n\nBest regards",
  },
]

const STATUS = {
  awaiting_approval: { label: 'Needs your approval', cls: 'bg-orange-100 text-orange-800' },
  replied:           { label: 'Replied',             cls: 'bg-[#d9f5e4] text-[#053728]' },
  follow_up_due:     { label: 'Follow-up due',       cls: 'bg-amber-100 text-amber-800' },
}
const INTEREST = {
  hot:  { label: 'Hot',  cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  warm: { label: 'Warm', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  cold: { label: 'Cold', cls: 'text-gray-600 bg-gray-50 border-gray-200' },
}

const inr = n => `₹${Number(n).toLocaleString('en-IN')}`

export default function SalesDeskSample({ onViewWebsite }) {
  const [selectedId, setSelectedId] = useState(SAMPLE_ENQUIRIES[0].id)
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(SAMPLE_ENQUIRIES.map(e => [e.id, e.draft]))
  )
  const [regenerating, setRegenerating] = useState(false)
  const [notice, setNotice] = useState('')

  const selected = SAMPLE_ENQUIRIES.find(e => e.id === selectedId)
  const awaiting = SAMPLE_ENQUIRIES.filter(e => e.status === 'awaiting_approval').length
  const followUps = SAMPLE_ENQUIRIES.filter(e => e.status === 'follow_up_due').length
  const pipeline = SAMPLE_ENQUIRIES.reduce((s, e) => s + e.value, 0)

  const flash = msg => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3500)
  }

  const handleRegenerate = () => {
    setRegenerating(true)
    setTimeout(() => {
      setRegenerating(false)
      setDrafts(d => ({ ...d, [selected.id]: selected.draft }))
      flash('Sample only: the draft was reset to the original.')
    }, 700)
  }

  const stats = [
    { icon: Inbox,         label: 'New enquiries',     value: SAMPLE_ENQUIRIES.length },
    { icon: Send,          label: 'Awaiting approval', value: awaiting },
    { icon: CalendarClock, label: 'Follow-ups due',    value: followUps },
    { icon: IndianRupee,   label: 'Potential value',   value: inr(pipeline) },
  ]

  return (
    <div className="space-y-5">
      {/* Sample banner */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-[#f2faf5] border border-[#a7f3c0] rounded-xl">
        <div className="flex items-start gap-3 flex-1">
          <Info className="w-5 h-5 text-[#0f6b4f] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#06352a]">
              Sample data &mdash; this is a preview of your Sales Desk
            </p>
            <p className="text-xs text-[#0a4836] mt-0.5">
              These names and messages are made up. Real enquiries from your website will replace them automatically, and nothing here is sent to anyone.
            </p>
          </div>
        </div>
        {onViewWebsite && (
          <button
            type="button"
            onClick={onViewWebsite}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 ${BTN_ORANGE} rounded-xl text-xs font-bold whitespace-nowrap`}
          >
            <Globe className="w-3.5 h-3.5" />Get my website live
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className={`${CARD} p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xl font-black text-[#053728]">{value}</p>
              <span className="w-8 h-8 rounded-full bg-[#d9f5e4] flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#0a4836]" />
              </span>
            </div>
            <p className="text-xs font-semibold text-[#06352a]">{label}</p>
          </div>
        ))}
      </div>

      {/* Inbox + detail */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">
        {/* Enquiry list */}
        <div className={`${CARD} shadow-sm overflow-hidden xl:col-span-2`}>
          <p className="px-4 py-3 text-sm font-bold text-[#06352a] border-b border-[#d9f5e4] bg-[#f2faf5]">Inbox</p>
          <ul className="divide-y divide-[#d9f5e4]" role="listbox" aria-label="Sample enquiries">
            {SAMPLE_ENQUIRIES.map(e => {
              const active = e.id === selectedId
              const st = STATUS[e.status]
              const it = INTEREST[e.interest]
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => setSelectedId(e.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0f6b4f] ${
                      active ? 'bg-[#f2faf5] border-l-4 border-[#0a4836]' : 'hover:bg-[#f2faf5] border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#06352a] truncate">{e.name}</p>
                      <span className="text-[11px] text-gray-500 shrink-0">{e.received}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{e.message}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${it.cls}`}>{it.label}</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Detail */}
        <div className={`${CARD} shadow-sm xl:col-span-3 p-5 space-y-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#d9f5e4]">
            <div>
              <h3 className="text-base font-bold text-[#06352a]">{selected.name}</h3>
              <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{selected.email}</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{selected.received}</span>
                <span>via {selected.source}</span>
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${INTEREST[selected.interest].cls}`}>
              {selected.interest === 'hot' && <Flame className="w-3 h-3" />}
              {INTEREST[selected.interest].label} lead
            </span>
          </div>

          {/* Their message */}
          <div>
            <p className="text-xs font-semibold text-[#0a4836] mb-1.5">Their message</p>
            <p className="text-sm text-gray-800 bg-[#f2faf5] border border-[#c9f2d8] rounded-xl px-4 py-3 leading-relaxed">
              {selected.message}
            </p>
          </div>

          {/* AI analysis */}
          <div className="rounded-xl bg-gradient-to-br from-[#021610] to-[#0a4836] text-white p-4">
            <p className="text-xs font-semibold text-[#a7f3c0] flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" />What Genie found
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <dt className="text-emerald-100/70">Summary</dt>
                <dd className="mt-0.5 text-white">{selected.aiSummary}</dd>
              </div>
              <div>
                <dt className="text-emerald-100/70">Best-matching offer</dt>
                <dd className="mt-0.5 text-white">{selected.matchedOffer}</dd>
              </div>
              <div>
                <dt className="text-emerald-100/70">Suggested next step</dt>
                <dd className="mt-0.5 text-white">{selected.nextStep}</dd>
              </div>
            </dl>
          </div>

          {/* Draft reply */}
          <div>
            <label htmlFor="sample-draft" className="text-xs font-semibold text-[#0a4836] mb-1.5 block">
              Drafted reply (edit before sending)
            </label>
            <textarea
              id="sample-draft"
              rows={9}
              value={drafts[selected.id]}
              onChange={e => setDrafts(d => ({ ...d, [selected.id]: e.target.value }))}
              className="w-full px-3.5 py-3 bg-white border border-[#c9f2d8] rounded-xl text-sm text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] focus:border-[#0f6b4f] resize-y"
            />
          </div>

          {notice && (
            <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-[#0f6b4f]">
              <CheckCircle className="w-3.5 h-3.5" />{notice}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={() => flash('Sample only: nothing was sent. With real enquiries, this sends your approved reply.')}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${BTN_ORANGE} rounded-xl text-sm font-bold`}
            >
              <Send className="w-4 h-4" />Approve &amp; send
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-[#0a4836] text-[#0a4836] hover:bg-[#f2faf5] rounded-xl text-sm font-medium disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Rewriting…' : 'Rewrite draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
