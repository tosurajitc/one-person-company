'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, BarChart3, TrendingUp, Filter, RefreshCw, Download,
  Search, CheckCircle, Clock, ExternalLink, ArrowRight,
  Target, Mail, Link as LinkIcon, Calendar, UserCheck, AlertCircle,
  FileText, MessageSquare, Bot, Settings, Bell,
} from 'lucide-react'
import AdminShell from '../../../components/AdminShell'

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([])
  const [summary, setSummary] = useState(null)
  const [funnel, setFunnel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [convertedFilter, setConvertedFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') || '' : '')

  const fetchLeadsAndFunnel = useCallback(async () => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token()}` }
      
      let leadsUrl = '/api/leads?'
      if (sourceFilter !== 'all') leadsUrl += `source=${encodeURIComponent(sourceFilter)}&`
      if (convertedFilter !== 'all') leadsUrl += `converted=${convertedFilter === 'converted'}&`

      const [leadsRes, funnelRes] = await Promise.all([
        fetch(leadsUrl, { headers }),
        fetch('/api/leads/funnel', { headers })
      ])

      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
        setSummary(data.summary || null)
      }

      if (funnelRes.ok) {
        const funnelData = await funnelRes.json()
        setFunnel(funnelData)
      }
    } catch (err) {
      console.error('Failed to load leads data', err)
    } finally {
      setLoading(false)
    }
  }, [sourceFilter, convertedFilter])

  useEffect(() => {
    fetchLeadsAndFunnel()
  }, [fetchLeadsAndFunnel])

  const filteredLeads = leads.filter(l => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      l.email?.toLowerCase().includes(q) ||
      l.source?.toLowerCase().includes(q) ||
      l.utm_source?.toLowerCase().includes(q) ||
      l.utm_campaign?.toLowerCase().includes(q)
    )
  })

  // Export leads to CSV
  const exportCSV = () => {
    if (!leads.length) return
    const headers = ['ID', 'Email', 'Source', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Converted', 'User ID', 'Created At']
    const rows = leads.map(l => [
      l.id,
      l.email,
      l.source || '',
      l.utm_source || '',
      l.utm_medium || '',
      l.utm_campaign || '',
      l.converted_to_user_id ? 'Yes' : 'No',
      l.converted_to_user_id || '',
      l.created_at || '',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads & Sales Funnel</h1>
            <p className="text-gray-500 mt-1">Track visitor lead capture, user conversions, and offers created through the sales funnel.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeadsAndFunnel}
              className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={leads.length === 0}
              className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Funnel Metrics Bar */}
        {funnel && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
              Sales Funnel Conversion Stages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Stage 1 */}
              <div className="relative p-5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">1. Leads Captured</div>
                <div className="text-3xl font-extrabold text-gray-900">{funnel.funnel.unique_leads}</div>
                <div className="text-xs text-gray-400 mt-1">{funnel.funnel.leads_captured} total submissions</div>
              </div>

              {/* Stage 2 */}
              <div className="relative p-5 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="text-xs uppercase tracking-wider text-blue-700 font-semibold mb-1">2. Signups (Converted)</div>
                <div className="text-3xl font-extrabold text-blue-900">{funnel.funnel.signups}</div>
                <div className="text-xs font-semibold text-blue-600 mt-1">
                  {funnel.conversion_rates.lead_to_signup_pct}% lead conversion
                </div>
              </div>

              {/* Stage 3 */}
              <div className="relative p-5 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <div className="text-xs uppercase tracking-wider text-indigo-700 font-semibold mb-1">3. First Offer Created</div>
                <div className="text-3xl font-extrabold text-indigo-900">{funnel.funnel.offers_created}</div>
                <div className="text-xs font-semibold text-indigo-600 mt-1">
                  {funnel.conversion_rates.signup_to_offer_pct}% of signed-up leads
                </div>
              </div>

              {/* Stage 4 */}
              <div className="relative p-5 rounded-xl bg-green-50/60 border border-green-200">
                <div className="text-xs uppercase tracking-wider text-green-700 font-semibold mb-1">4. First Sale Made</div>
                <div className="text-3xl font-extrabold text-green-900">{funnel.funnel.first_sales}</div>
                <div className="text-xs font-semibold text-green-600 mt-1">
                  {funnel.funnel.offers_created > 0 ? `${funnel.conversion_rates.offer_to_sale_pct}% offer-to-sale` : '0%'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Captured Leads</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total_leads}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary-600">
                  <Mail className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Converted to Users</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{summary.converted_leads}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{summary.conversion_rate_pct}%</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by email, UTM or source..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Source:</span>
                <select
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Sources</option>
                  <option value="marketing_hero">marketing_hero</option>
                  <option value="playbook_download">playbook_download</option>
                  <option value="direct">direct</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Status:</span>
                <select
                  value={convertedFilter}
                  onChange={e => setConvertedFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="converted">Converted (Signed up)</option>
                  <option value="unconverted">Not Converted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No leads found matching your filter criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Source Tag</th>
                    <th className="py-3 px-4">UTM Parameters</th>
                    <th className="py-3 px-4">Captured Date</th>
                    <th className="py-3 px-4">Converted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {lead.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {lead.source || 'direct'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {lead.utm_source || lead.utm_campaign ? (
                          <div className="space-y-0.5">
                            {lead.utm_source && <div><span className="font-semibold text-gray-500">source:</span> {lead.utm_source}</div>}
                            {lead.utm_campaign && <div><span className="font-semibold text-gray-500">campaign:</span> {lead.utm_campaign}</div>}
                            {lead.utm_medium && <div><span className="font-semibold text-gray-500">medium:</span> {lead.utm_medium}</div>}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {lead.created_at ? new Date(lead.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {lead.converted_to_user_id ? (
                          <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" />
                            Yes (User #{lead.converted_to_user_id})
                            {lead.converted_user?.username && (
                              <Link
                                href={`/${lead.converted_user.username}`}
                                target="_blank"
                                className="ml-1 text-primary-600 hover:underline inline-flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </Link>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
