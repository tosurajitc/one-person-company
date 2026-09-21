'use client'

import { useState, useEffect } from 'react'
import {
  Inbox, Sparkles, Send, CheckCircle2, Clock, Mail,
  Phone, Building2, RefreshCw, AlertCircle, MessageSquare,
  ChevronRight, Filter, Eye, Check, Edit3, XCircle
} from 'lucide-react'

export default function SalesDeskSection({ token }) {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Draft editing state
  const [draftContent, setDraftContent] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [actionError, setActionError] = useState(null)

  const fetchEnquiries = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`/api/enquiries/mine?status_filter=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEnquiries(data.enquiries || [])
        if (data.enquiries?.length > 0) {
          // Keep current selection or select the first lead
          setSelectedEnquiry(prev => {
            if (!prev) return data.enquiries[0]
            const updated = data.enquiries.find(e => e.id === prev.id)
            return updated || data.enquiries[0]
          })
        } else {
          setSelectedEnquiry(null)
        }
      }
    } catch (e) {
      console.error('Failed to load enquiries', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnquiries()
  }, [token, statusFilter])

  // Sync draftContent whenever active enquiry changes
  useEffect(() => {
    if (selectedEnquiry) {
      setDraftContent(selectedEnquiry.sent_reply_content || selectedEnquiry.ai_draft_reply || '')
      setCustomInstructions('')
      setActionSuccess(null)
      setActionError(null)
    }
  }, [selectedEnquiry])

  const handleRegenerate = async () => {
    if (!selectedEnquiry || !token) return
    setIsRegenerating(true)
    setActionSuccess(null)
    setActionError(null)
    try {
      const res = await fetch(`/api/enquiries/${selectedEnquiry.id}/regenerate-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instructions: customInstructions }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedEnquiry(data.enquiry)
        setDraftContent(data.enquiry.ai_draft_reply)
        setActionSuccess('AI drafted a new response!')
        fetchEnquiries()
      } else {
        setActionError('Failed to regenerate draft.')
      }
    } catch (e) {
      setActionError('Error contacting AI service.')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleApproveAndSend = async () => {
    if (!selectedEnquiry || !token || !draftContent.trim()) return
    setIsSending(true)
    setActionSuccess(null)
    setActionError(null)
    try {
      const res = await fetch(`/api/enquiries/${selectedEnquiry.id}/approve-and-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply_content: draftContent }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedEnquiry(data.enquiry)
        setActionSuccess(`Reply successfully approved & sent to ${data.enquiry.email}!`)
        fetchEnquiries()
      } else {
        setActionError('Failed to send reply.')
      }
    } catch (e) {
      setActionError('Error sending response.')
    } finally {
      setIsSending(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedEnquiry || !token) return
    try {
      const res = await fetch(`/api/enquiries/${selectedEnquiry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedEnquiry(data.enquiry)
        fetchEnquiries()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'new') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">New Lead</span>
    if (s === 'qualified') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Qualified</span>
    if (s === 'replied') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check className="w-3 h-3" /> Replied</span>
    if (s === 'closed') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Closed</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{status}</span>
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Sales Desk Banner Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">AI Sales Desk</h2>
              <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-xs rounded-full font-medium border border-indigo-400/20">
                Human-in-the-loop
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Inbound client inquiries qualified and auto-drafted based on your active offers.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="all">All Enquiries</option>
            <option value="new">New</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={fetchEnquiries}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2-Column Sales Desk Area */}
      {loading && enquiries.length === 0 ? (
        <div className="p-12 text-center text-gray-500 animate-pulse">
          Loading your sales inbox...
        </div>
      ) : enquiries.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">No enquiries yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            When prospective clients submit contact forms or booking requests on your website, they will appear here with AI-generated proposal drafts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 min-h-[460px]">
          
          {/* Left Column: Leads List */}
          <div className="lg:col-span-5 divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
            {enquiries.map((enq) => {
              const isSelected = selectedEnquiry?.id === enq.id
              return (
                <button
                  key={enq.id}
                  onClick={() => setSelectedEnquiry(enq)}
                  className={`w-full text-left p-4 transition-all hover:bg-slate-50 flex flex-col gap-2 ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-gray-900 truncate">{enq.name}</span>
                    {getStatusBadge(enq.status)}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{enq.message}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                    <span>{enq.email}</span>
                    <span>{new Date(enq.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right Column: Lead Detail & AI Draft Reviewer */}
          {selectedEnquiry && (
            <div className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Lead Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{selectedEnquiry.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedEnquiry.email}</span>
                      {selectedEnquiry.phone && (
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedEnquiry.phone}</span>
                      )}
                      {selectedEnquiry.business && (
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {selectedEnquiry.business}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedEnquiry.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 font-medium"
                    >
                      <option value="new">Mark: New</option>
                      <option value="qualified">Mark: Qualified</option>
                      <option value="replied">Mark: Replied</option>
                      <option value="closed">Mark: Closed</option>
                    </select>
                  </div>
                </div>

                {/* Original Message */}
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs text-gray-700 space-y-1">
                  <p className="font-semibold text-gray-900">Prospect Requirement / Message:</p>
                  <p className="whitespace-pre-line text-gray-600">{selectedEnquiry.message}</p>
                </div>

                {/* AI Qualification Insight */}
                {selectedEnquiry.ai_qualification && (
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-900">AI Qualification: </span>
                      <span>{selectedEnquiry.ai_qualification}</span>
                      {selectedEnquiry.ai_matched_offer && (
                        <span className="ml-1 inline-block px-1.5 py-0.5 rounded bg-indigo-200/70 text-indigo-800 font-semibold text-[10px]">
                          Matched: {selectedEnquiry.ai_matched_offer}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Draft Response Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      {selectedEnquiry.status === 'replied' ? 'Sent Email Reply:' : 'AI Drafted Email Response (Review & Edit):'}
                    </label>
                  </div>
                  <textarea
                    rows={6}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    disabled={selectedEnquiry.status === 'replied'}
                    className="w-full text-xs font-sans text-gray-800 bg-white border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent leading-relaxed"
                    placeholder="Draft response..."
                  />
                </div>

                {/* Optional Custom AI tweak instructions */}
                {selectedEnquiry.status !== 'replied' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Prompt AI tweak (e.g. 'Add a 10% discount', 'Ask for call Thursday')..."
                      className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-indigo-600' : ''}`} />
                      {isRegenerating ? 'Drafting...' : 'Regenerate'}
                    </button>
                  </div>
                )}

                {/* Notifications & Action status */}
                {actionSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    {actionSuccess}
                  </div>
                )}
                {actionError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    {actionError}
                  </div>
                )}
              </div>

              {/* Bottom Send & Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                {selectedEnquiry.status === 'replied' ? (
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Sent on {new Date(selectedEnquiry.reply_sent_at).toLocaleString()}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApproveAndSend}
                    disabled={isSending || !draftContent.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-pulse' : ''}`} />
                    {isSending ? 'Sending to Lead...' : 'Approve & Send Email to Lead'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
