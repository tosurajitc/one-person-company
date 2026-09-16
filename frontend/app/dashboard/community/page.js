'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, Plus, Settings, MessageSquare, Calendar,
  CheckCircle, AlertCircle, Loader2, ChevronRight,
  Tag, Globe, Lock, Edit2, Trash2, Crown, Ban,
  ArrowLeft, Sparkles,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getToken() {
  return localStorage.getItem('auth_token') || localStorage.getItem('token')
}

function authFetch(url, opts = {}) {
  const token = getToken()
  return fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }) {
  const map = {
    draft: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || map.draft}`}>
      {status}
    </span>
  )
}

// ---- Create Community Modal ------------------------------------------------
function CreateCommunityModal({ templates, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'INR',
    category_template: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      const res = await authFetch('/api/communities', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          price: form.price ? parseFloat(form.price) : null,
          category_template: form.category_template || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to create community')
      onCreate(data)
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Create your community</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Community name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g. The Founder Circle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="What is this community about?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (leave blank for free)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option>INR</option>
                <option>USD</option>
                <option>GBP</option>
                <option>EUR</option>
              </select>
            </div>
          </div>
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category template <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={form.category_template}
                onChange={(e) => setForm({ ...form, category_template: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Start blank</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {err && <p className="text-sm text-red-500">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create community
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Settings Tab ----------------------------------------------------------
function SettingsTab({ community }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    authFetch(`/api/communities/${community.id}/settings`)
      .then((r) => r.ok ? r.json() : null)
      .then((s) => {
        if (s) setForm({
          welcome_message: s.welcome_message || '',
          rules: (s.rules || []).join('\n'),
          categories: (s.categories || []).join('\n'),
          events_on: !!(s.features_enabled?.events),
          threads_on: !!(s.features_enabled?.threads),
          members_on: !!(s.features_enabled?.members),
        })
      })
  }, [community.id])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      // Save community metadata
      await authFetch(`/api/communities/${community.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: community.status,
        }),
      })
      // Save settings
      const res = await authFetch(`/api/communities/${community.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify({
          welcome_message: form.welcome_message,
          rules: form.rules.split('\n').map((s) => s.trim()).filter(Boolean),
          categories: form.categories.split('\n').map((s) => s.trim()).filter(Boolean),
          features_enabled: {
            events: form.events_on,
            threads: form.threads_on,
            members: form.members_on,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setMsg('Settings saved.')
    } catch (ex) {
      setMsg(ex.message)
    } finally {
      setSaving(false)
    }
  }

  // Status toggle
  const handleStatusChange = async (newStatus) => {
    await authFetch(`/api/communities/${community.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    })
    setMsg(`Status set to ${newStatus}.`)
    community.status = newStatus
  }

  if (!form) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Welcome message</label>
        <textarea
          value={form.welcome_message}
          onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Categories <span className="font-normal text-gray-400">(one per line)</span>
        </label>
        <textarea
          value={form.categories}
          onChange={(e) => setForm({ ...form, categories: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none font-mono"
          placeholder={'Announcements\nGeneral\nQ&A'}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Community rules <span className="font-normal text-gray-400">(one per line)</span>
        </label>
        <textarea
          value={form.rules}
          onChange={(e) => setForm({ ...form, rules: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none font-mono"
          placeholder={'Be respectful\nNo spam'}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Features</label>
        <div className="space-y-2">
          {[
            { key: 'threads_on', label: 'Discussions / threads' },
            { key: 'events_on', label: 'Events' },
            { key: 'members_on', label: 'Member directory' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="w-4 h-4 accent-primary-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
        <div className="flex gap-3">
          {['draft', 'active', 'archived'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatusChange(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${
                community.status === s
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Only <strong>active</strong> communities are visible at your public URL.
        </p>
      </div>
      {msg && <p className="text-sm text-green-600">{msg}</p>}
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg flex items-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Save settings
      </button>
    </form>
  )
}

// ---- Members Tab -----------------------------------------------------------
function MembersTab({ community }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    authFetch(`/api/community/${community.id}/members`)
      .then((r) => r.ok ? r.json() : [])
      .then(setMembers)
      .finally(() => setLoading(false))
  }, [community.id])

  useEffect(load, [load])

  const handleBan = async (memberId, banned) => {
    await authFetch(`/api/community/${community.id}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({ is_banned: banned }),
    })
    load()
  }

  const handleRemove = async (memberId) => {
    if (!confirm('Remove this member?')) return
    await authFetch(`/api/community/${community.id}/members/${memberId}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>
  if (!members.length) return <p className="text-gray-500 text-sm py-8">No members yet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <th className="pb-3 pr-4">Member</th>
            <th className="pb-3 pr-4">Role</th>
            <th className="pb-3 pr-4">Joined</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{m.display_name || `User #${m.user_id}`}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4">
                <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-semibold ${
                  m.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  m.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{m.role}</span>
              </td>
              <td className="py-3 pr-4 text-gray-500">
                {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
              </td>
              <td className="py-3 pr-4">
                {m.is_banned ? (
                  <span className="text-red-500 text-xs font-semibold">Banned</span>
                ) : m.is_active ? (
                  <span className="text-green-500 text-xs font-semibold">Active</span>
                ) : (
                  <span className="text-gray-400 text-xs">Inactive</span>
                )}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBan(m.id, !m.is_banned)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-orange-500 transition-colors"
                    title={m.is_banned ? 'Unban' : 'Ban'}
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- Events Tab ------------------------------------------------------------
function EventsTab({ community }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', meeting_url: '', scheduled_at: '', duration_minutes: 60, event_type: 'webinar' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    authFetch(`/api/community/${community.id}/events`)
      .then((r) => r.ok ? r.json() : [])
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [community.id])

  useEffect(load, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const res = await authFetch(`/api/community/${community.id}/events`, {
      method: 'POST',
      body: JSON.stringify({ ...form, scheduled_at: form.scheduled_at || null }),
    })
    if (res.ok) { setShowForm(false); load() }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    await authFetch(`/api/community/${community.id}/events/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Events</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" /> New event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="url" placeholder="Meeting URL" value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg disabled:opacity-60">
              {saving ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-gray-300 text-xs rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {!events.length ? (
        <p className="text-gray-400 text-sm py-4">No events yet. Create the first one.</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{ev.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ev.scheduled_at ? new Date(ev.scheduled_at).toLocaleString() : 'No date set'}
                  {ev.meeting_url && <> · <a href={ev.meeting_url} className="text-primary-600 hover:underline" target="_blank" rel="noreferrer">Join link</a></>}
                </p>
              </div>
              <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Threads Tab (owner moderation view) -----------------------------------
function ThreadsTab({ community }) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    authFetch(`/api/community/${community.id}/threads`)
      .then((r) => r.ok ? r.json() : [])
      .then(setThreads)
      .finally(() => setLoading(false))
  }, [community.id])

  useEffect(load, [load])

  const handleDelete = async (id) => {
    if (!confirm('Delete this thread?')) return
    await authFetch(`/api/community/${community.id}/threads/${id}`, { method: 'DELETE' })
    load()
  }

  const handlePin = async (thread) => {
    await authFetch(`/api/community/${community.id}/threads/${thread.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: thread.status === 'pinned' ? 'open' : 'pinned' }),
    })
    load()
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>
  if (!threads.length) return <p className="text-gray-400 text-sm py-4">No discussions yet.</p>

  return (
    <div className="space-y-3">
      {threads.map((t) => (
        <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 text-sm truncate">{t.title}</p>
              {t.status === 'pinned' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Pinned</span>}
            </div>
            <p className="text-xs text-gray-400">
              by {t.author_name || 'Unknown'} · {t.reply_count} replies · {t.category || 'General'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-4">
            <button onClick={() => handlePin(t)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-yellow-500" title="Pin/Unpin">
              <Crown className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DashboardCommunityPage() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selected, setSelected] = useState(null)  // the community being managed
  const [tab, setTab] = useState('settings')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      authFetch('/api/communities/mine').then((r) => r.ok ? r.json() : []),
      authFetch('/api/admin/community-templates').then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([comms, tmpls]) => {
      setCommunities(comms)
      setTemplates(tmpls)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const handleCreate = async () => {
    // Test if user is on pro — a 403 from the API means upgrade needed
    const test = await authFetch('/api/communities', { method: 'POST', body: JSON.stringify({ name: '__test__' }) })
    if (test.status === 403) {
      setUpgradeRequired(true)
      return
    }
    setShowCreate(true)
  }

  const onCreate = (newCommunity) => {
    setCommunities((prev) => [newCommunity, ...prev])
    setShowCreate(false)
    setSelected(newCommunity)
    setTab('settings')
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // ---- Manage selected community ------------------------------------------
  if (selected) {
    const tabs = [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'threads', label: 'Threads', icon: MessageSquare },
      { id: 'events', label: 'Events', icon: Calendar },
    ]

    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Back */}
          <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="w-4 h-4" /> All communities
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900">{selected.name}</h1>
                <StatusBadge status={selected.status} />
              </div>
              {selected.description && (
                <p className="text-gray-500 text-sm mt-1">{selected.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {selected.member_count || 0} members
                </span>
                <span className="flex items-center gap-1">
                  {selected.price ? (
                    <><Lock className="w-3.5 h-3.5" /> {selected.currency} {selected.price}</>
                  ) : (
                    <><Globe className="w-3.5 h-3.5" /> Free</>
                  )}
                </span>
              </div>
            </div>
            {selected.status === 'active' && selected.slug && (
              <a
                href={`/${communities.find((c) => c.id === selected.id) ? '' : ''}..`}
                className="text-xs text-primary-600 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-50"
                target="_blank"
                rel="noreferrer"
              >
                View public page ↗
              </a>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    tab === id
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {tab === 'settings' && <SettingsTab community={selected} />}
          {tab === 'members' && <MembersTab community={selected} />}
          {tab === 'threads' && <ThreadsTab community={selected} />}
          {tab === 'events' && <EventsTab community={selected} />}
        </div>
      </div>
    )
  }

  // ---- Community list / empty state ----------------------------------------
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Your community</h1>
            <p className="text-gray-500 text-sm mt-1">
              Your own private space for your audience — like Skool, but yours.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg"
          >
            <Plus className="w-4 h-4" /> New community
          </button>
        </div>

        {/* Upgrade required */}
        {upgradeRequired && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Pro or Enterprise plan required</p>
              <p className="text-sm text-amber-700 mt-1">
                Community is a paid-tier feature. Upgrade your plan to create and run your own community.
              </p>
              <Link href="/pricing" className="inline-block mt-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-1.5 rounded-lg">
                View plans →
              </Link>
            </div>
          </div>
        )}

        {/* Communities */}
        {communities.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No community yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Create your first community. Pick a name, set categories, decide on free or paid access.
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl"
            >
              <Plus className="w-4 h-4" /> Create community
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {communities.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-sm transition-all cursor-pointer"
                onClick={() => { setSelected(c); setTab('settings') }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.member_count || 0} members</span>
                      <span>{c.price ? `${c.currency} ${c.price}` : 'Free'}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <CreateCommunityModal
            templates={templates}
            onClose={() => setShowCreate(false)}
            onCreate={onCreate}
          />
        )}
      </div>
    </div>
  )
}
