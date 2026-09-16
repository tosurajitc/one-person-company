'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Globe, Lock, Loader2, Search } from 'lucide-react'
import AdminShell from '../../../components/AdminShell'

function getToken() {
  return localStorage.getItem('auth_token') || localStorage.getItem('token')
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = getToken()
    fetch('/api/admin/communities', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.ok ? r.json() : [])
      .then(setCommunities)
      .finally(() => setLoading(false))
  }, [])

  const filtered = communities.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.owner_name?.toLowerCase().includes(q) ||
      c.owner_email?.toLowerCase().includes(q)
    )
  })

  const statusColor = { draft: 'text-yellow-600 bg-yellow-50', active: 'text-green-600 bg-green-50', archived: 'text-gray-500 bg-gray-50' }

  return (
    <AdminShell>
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="text-sm text-gray-500 mt-1">Platform-wide oversight — read only.</p>
        </div>
        <Link href="/admin/community-templates" className="text-sm text-primary-600 border border-primary-200 px-4 py-2 rounded-lg hover:bg-primary-50">
          Manage templates →
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name or owner…"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="py-3 px-4 text-left">Community</th>
                <th className="py-3 px-4 text-left">Owner</th>
                <th className="py-3 px-4 text-left">Members</th>
                <th className="py-3 px-4 text-left">Price</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    {search ? 'No matching communities.' : 'No communities yet.'}
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">/{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-700">{c.owner_name || '—'}</p>
                    <p className="text-xs text-gray-400">{c.owner_email}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{c.member_count?.toLocaleString() ?? 0}</td>
                  <td className="py-3 px-4">
                    {c.price ? (
                      <span className="flex items-center gap-1 text-gray-700">
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                        {c.currency} {c.price}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500">
                        <Globe className="w-3.5 h-3.5" /> Free
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor[c.status] || statusColor.draft}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} of {communities.length} communities
          </div>
        </div>
      )}
    </div>
    </AdminShell>
  )
}
