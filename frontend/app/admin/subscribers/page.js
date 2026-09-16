'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, Target, Users, FileText, Bot, TrendingUp, Settings,
  MessageSquare, Mail, Search, RefreshCw, Download, ToggleLeft,
  ToggleRight, Calendar, CheckCircle, XCircle, Bell,
} from 'lucide-react'
import AdminShell from '../../../components/AdminShell'

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [togglingId, setTogglingId] = useState(null)

  const token = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') || localStorage.getItem('token') || ''
      : ''

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token()}` }
      let url = '/api/subscribers?'
      if (activeFilter === 'active') url += 'active_only=true&'
      if (activeFilter === 'inactive') url += 'active_only=false&'

      const res = await fetch(url, { headers })
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers || [])
        setSummary(data.summary || null)
      }
    } catch (err) {
      console.error('Failed to load subscribers', err)
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  const toggleStatus = async (id) => {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSubscribers(prev =>
          prev.map(s => (s.id === id ? data.subscriber : s))
        )
        setSummary(prev => {
          if (!prev) return prev
          const updated = data.subscriber
          const delta = updated.is_active ? 1 : -1
          return {
            ...prev,
            active: prev.active + delta,
            unsubscribed: prev.unsubscribed - delta,
          }
        })
      }
    } catch (err) {
      console.error('Failed to toggle subscriber', err)
    } finally {
      setTogglingId(null)
    }
  }

  const filteredSubscribers = subscribers.filter(s => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      s.email?.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.source?.toLowerCase().includes(q)
    )
  })

  const exportCSV = () => {
    if (!subscribers.length) return
    const headers = ['ID', 'Email', 'Name', 'Source', 'Active', 'Subscribed At', 'Unsubscribed At']
    const rows = subscribers.map(s => [
      s.id,
      s.email,
      s.name || '',
      s.source || 'footer',
      s.is_active ? 'Yes' : 'No',
      s.subscribed_at || '',
      s.unsubscribed_at || '',
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `subscribers_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Newsletter Subscribers</h1>
            <p className="text-gray-500 mt-1">
              People who subscribed via the footer newsletter form. Use this list to plan marketing campaigns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSubscribers}
              className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={subscribers.length === 0}
              className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Subscribers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active Subscribers</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{summary.active}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Unsubscribed</p>
                  <p className="text-2xl font-bold text-gray-400 mt-1">{summary.unsubscribed}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter + Search + Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by email, name or source..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              <select
                value={activeFilter}
                onChange={e => setActiveFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="active">Active only</option>
                <option value="inactive">Unsubscribed only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading subscribers...</div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No subscribers found.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Subscribed On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubscribers.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{sub.email}</td>
                      <td className="py-3 px-4 text-gray-600">{sub.name || <span className="text-gray-300">—</span>}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {sub.source || 'footer'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleString() : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {sub.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Unsubscribed
                            {sub.unsubscribed_at && (
                              <span className="ml-1 text-gray-300">{new Date(sub.unsubscribed_at).toLocaleDateString()}</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleStatus(sub.id)}
                          disabled={togglingId === sub.id}
                          title={sub.is_active ? 'Unsubscribe' : 'Re-subscribe'}
                          className="inline-flex items-center justify-center text-gray-400 hover:text-primary-600 disabled:opacity-40 transition-colors"
                        >
                          {sub.is_active
                            ? <ToggleRight className="w-6 h-6 text-green-500" />
                            : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                        </button>
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
