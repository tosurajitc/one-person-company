'use client'

/**
 * Founder Community  (/dashboard/community)
 * ------------------------------------------------------------------
 * THEME (matches dashboard, profile, wallet, AI Website Builder):
 *   bottle green  #021610 / #053728 / #0a4836 / #0f6b4f
 *   light green   #a7f3c0 / #c9f2d8 / #d9f5e4 / #f2faf5
 *   orange        primary action buttons only
 *
 * All community API calls are unchanged. Two fixes are noted with "FIX".
 * When the founder has no community yet, a labelled sample preview is shown.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, Plus, Settings, MessageSquare, Calendar,
  Loader2, ChevronRight, Globe, Lock, Trash2, Crown, Ban,
  ArrowLeft, Sparkles, AlertCircle, CheckCircle,
} from 'lucide-react'
import DashboardSidebar from '../../../components/DashboardSidebar'
import CommunitySample from '../../../components/CommunitySample'

// ─── Theme class strings ─────────────────────────────────────────────────────
const BTN_ORANGE = 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30'
const BTN_GREEN = 'bg-[#0a4836] hover:bg-[#053728] text-white'
const BTN_OUTLINE = 'bg-white border border-[#0a4836] text-[#0a4836] hover:bg-[#f2faf5]'
const CARD = 'bg-white rounded-2xl border border-[#c9f2d8] shadow-sm'
const INPUT = 'w-full px-3.5 py-2.5 bg-white border border-[#c9f2d8] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] focus:border-[#0f6b4f]'
const LABEL = 'block text-xs font-semibold text-gray-700 mb-1.5'

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function Spinner() {
  return (
    <div className="p-8 text-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#0f6b4f] mx-auto" />
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    draft: 'bg-amber-100 text-amber-800',
    active: 'bg-[#d9f5e4] text-[#053728]',
    archived: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[status] || map.draft}`}>
      {status}
    </span>
  )
}

// ─── Create Community modal ──────────────────────────────────────────────────
function CreateCommunityModal({ templates, onClose, onCreate, onUpgradeRequired }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', currency: 'INR', category_template: '' })
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
      // FIX: the plan check now happens on the real submit (see handleCreate below)
      if (res.status === 403) { onUpgradeRequired(); return }
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
    <div className="fixed inset-0 bg-[#021610]/60 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="create-title">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#c9f2d8]">
        <h2 id="create-title" className="text-lg font-bold text-[#06352a] mb-5 pb-3 border-b border-[#d9f5e4]">Create your community</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL} htmlFor="c-name">Community name *</label>
            <input id="c-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={INPUT} placeholder="e.g. The Founder Circle" />
          </div>
          <div>
            <label className={LABEL} htmlFor="c-desc">Description</label>
            <textarea id="c-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className={`${INPUT} resize-none`} placeholder="What is this community about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="c-price">Price (blank = free)</label>
              <input id="c-price" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={INPUT} placeholder="0" />
            </div>
            <div>
              <label className={LABEL} htmlFor="c-cur">Currency</label>
              <select id="c-cur" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className={INPUT}>
                <option>INR</option><option>USD</option><option>GBP</option><option>EUR</option>
              </select>
            </div>
          </div>
          {templates.length > 0 && (
            <div>
              <label className={LABEL} htmlFor="c-tpl">Category template <span className="text-gray-400 font-normal">(optional)</span></label>
              <select id="c-tpl" value={form.category_template} onChange={e => setForm({ ...form, category_template: e.target.value })} className={INPUT}>
                <option value="">Start blank</option>
                {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          )}
          {err && <p className="text-sm text-red-600 flex items-center gap-1.5" role="alert"><AlertCircle className="w-4 h-4" />{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${BTN_OUTLINE}`}>Cancel</button>
            <button type="submit" disabled={saving} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 ${BTN_ORANGE}`}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}Create community
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Settings tab ────────────────────────────────────────────────────────────
function SettingsTab({ community, onStatusChange }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null) // { ok, text }

  useEffect(() => {
    authFetch(`/api/communities/${community.id}/settings`)
      .then(r => (r.ok ? r.json() : null))
      .then(s => {
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
      const res = await authFetch(`/api/communities/${community.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify({
          welcome_message: form.welcome_message,
          rules: form.rules.split('\n').map(s => s.trim()).filter(Boolean),
          categories: form.categories.split('\n').map(s => s.trim()).filter(Boolean),
          features_enabled: { events: form.events_on, threads: form.threads_on, members: form.members_on },
        }),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setMsg({ ok: true, text: 'Settings saved.' })
    } catch (ex) {
      setMsg({ ok: false, text: ex.message })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    const res = await authFetch(`/api/communities/${community.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      onStatusChange(newStatus) // FIX: update parent state instead of mutating the prop
      setMsg({ ok: true, text: `Status set to ${newStatus}.` })
    } else {
      setMsg({ ok: false, text: 'Could not change status.' })
    }
  }

  if (!form) return <Spinner />

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div>
        <label className={LABEL} htmlFor="s-welcome">Welcome message</label>
        <textarea id="s-welcome" value={form.welcome_message} onChange={e => setForm({ ...form, welcome_message: e.target.value })} rows={3} className={`${INPUT} resize-none`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={LABEL} htmlFor="s-cats">Categories <span className="font-normal text-gray-400">(one per line)</span></label>
          <textarea id="s-cats" value={form.categories} onChange={e => setForm({ ...form, categories: e.target.value })} rows={4} className={`${INPUT} resize-none font-mono`} placeholder={'Announcements\nGeneral\nQ&A'} />
        </div>
        <div>
          <label className={LABEL} htmlFor="s-rules">Community rules <span className="font-normal text-gray-400">(one per line)</span></label>
          <textarea id="s-rules" value={form.rules} onChange={e => setForm({ ...form, rules: e.target.value })} rows={4} className={`${INPUT} resize-none font-mono`} placeholder={'Be respectful\nNo spam'} />
        </div>
      </div>

      <fieldset>
        <legend className={LABEL}>Features</legend>
        <div className="space-y-2.5">
          {[
            { key: 'threads_on', label: 'Discussions / threads' },
            { key: 'events_on', label: 'Events' },
            { key: 'members_on', label: 'Member directory' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 accent-[#0a4836]" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <p className={LABEL}>Visibility</p>
        <div className="flex flex-wrap gap-2">
          {['draft', 'active', 'archived'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatusChange(s)}
              aria-pressed={community.status === s}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] ${
                community.status === s
                  ? 'bg-[#0a4836] text-white border-[#0a4836]'
                  : 'bg-white border-[#c9f2d8] text-gray-700 hover:border-[#0f6b4f] hover:text-[#0a4836]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Only <strong className="text-[#06352a]">active</strong> communities are visible at your public URL.</p>
      </div>

      {msg && (
        <p role="status" className={`text-sm flex items-center gap-1.5 ${msg.ok ? 'text-[#0f6b4f]' : 'text-red-600'}`}>
          {msg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{msg.text}
        </p>
      )}
      <button type="submit" disabled={saving} className={`px-8 py-3 text-sm font-bold rounded-xl flex items-center gap-2 disabled:opacity-60 ${BTN_ORANGE}`}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}Save settings
      </button>
    </form>
  )
}

// ─── Members tab ─────────────────────────────────────────────────────────────
function MembersTab({ community }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    authFetch(`/api/community/${community.id}/members`)
      .then(r => (r.ok ? r.json() : []))
      .then(setMembers)
      .finally(() => setLoading(false))
  }, [community.id])

  useEffect(() => { load() }, [load])

  const handleBan = async (memberId, banned) => {
    await authFetch(`/api/community/${community.id}/members/${memberId}`, { method: 'PUT', body: JSON.stringify({ is_banned: banned }) })
    load()
  }
  const handleRemove = async (memberId) => {
    if (!confirm('Remove this member?')) return
    await authFetch(`/api/community/${community.id}/members/${memberId}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <Spinner />
  if (!members.length) return <p className="text-gray-500 text-sm py-8">No members yet. Share your public link to invite people.</p>

  const roleCls = r => (r === 'admin' ? 'bg-orange-100 text-orange-800' : r === 'moderator' ? 'bg-[#d9f5e4] text-[#053728]' : 'bg-gray-100 text-gray-600')

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#d9f5e4] text-left text-xs font-semibold text-[#0a4836]">
            <th className="pb-3 pr-4">Member</th><th className="pb-3 pr-4">Role</th><th className="pb-3 pr-4">Joined</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d9f5e4]">
          {members.map(m => (
            <tr key={m.id} className="hover:bg-[#f2faf5]">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#d9f5e4] flex items-center justify-center"><Users className="w-4 h-4 text-[#0a4836]" /></span>
                  <p className="font-medium text-[#06352a]">{m.display_name || `User #${m.user_id}`}</p>
                </div>
              </td>
              <td className="py-3 pr-4"><span className={`capitalize px-2 py-0.5 rounded-full text-xs font-semibold ${roleCls(m.role)}`}>{m.role}</span></td>
              <td className="py-3 pr-4 text-gray-500">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}</td>
              <td className="py-3 pr-4">
                {m.is_banned ? <span className="text-red-600 text-xs font-semibold">Banned</span>
                  : m.is_active ? <span className="text-[#0f6b4f] text-xs font-semibold">Active</span>
                  : <span className="text-gray-400 text-xs">Inactive</span>}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => handleBan(m.id, !m.is_banned)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50" title={m.is_banned ? 'Unban' : 'Ban'} aria-label={m.is_banned ? 'Unban member' : 'Ban member'}><Ban className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleRemove(m.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Remove" aria-label="Remove member"><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Events tab ──────────────────────────────────────────────────────────────
function EventsTab({ community }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', meeting_url: '', scheduled_at: '', duration_minutes: 60, event_type: 'webinar' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    authFetch(`/api/community/${community.id}/events`)
      .then(r => (r.ok ? r.json() : []))
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [community.id])

  useEffect(() => { load() }, [load])

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

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#06352a]">Events</h3>
        <button type="button" onClick={() => setShowForm(!showForm)} className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl ${BTN_ORANGE}`}>
          <Plus className="w-3.5 h-3.5" />New event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#f2faf5] border border-[#c9f2d8] rounded-xl p-4 mb-4 space-y-3">
          <input required aria-label="Event title" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={INPUT} />
          <textarea aria-label="Event description" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className={`${INPUT} resize-none`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="url" aria-label="Meeting URL" placeholder="Meeting URL" value={form.meeting_url} onChange={e => setForm({ ...form, meeting_url: e.target.value })} className={INPUT} />
            <input type="datetime-local" aria-label="Date and time" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} className={INPUT} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={`px-5 py-2 text-xs font-bold rounded-xl disabled:opacity-60 ${BTN_GREEN}`}>{saving ? 'Creating…' : 'Create event'}</button>
            <button type="button" onClick={() => setShowForm(false)} className={`px-5 py-2 text-xs rounded-xl ${BTN_OUTLINE}`}>Cancel</button>
          </div>
        </form>
      )}

      {!events.length ? (
        <p className="text-gray-500 text-sm py-4">No events yet. Create the first one.</p>
      ) : (
        <ul className="space-y-3">
          {events.map(ev => (
            <li key={ev.id} className="flex items-center justify-between bg-[#f2faf5] rounded-xl p-4 border border-[#c9f2d8]">
              <div>
                <p className="font-semibold text-[#06352a] text-sm">{ev.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {ev.scheduled_at ? new Date(ev.scheduled_at).toLocaleString() : 'No date set'}
                  {ev.meeting_url && <> · <a href={ev.meeting_url} className="text-[#0a4836] font-medium hover:underline" target="_blank" rel="noreferrer">Join link</a></>}
                </p>
              </div>
              <button type="button" onClick={() => handleDelete(ev.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label="Delete event"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Threads tab (owner moderation) ──────────────────────────────────────────
function ThreadsTab({ community }) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    authFetch(`/api/community/${community.id}/threads`)
      .then(r => (r.ok ? r.json() : []))
      .then(setThreads)
      .finally(() => setLoading(false))
  }, [community.id])

  useEffect(() => { load() }, [load])

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

  if (loading) return <Spinner />
  if (!threads.length) return <p className="text-gray-500 text-sm py-4">No discussions yet.</p>

  return (
    <ul className="space-y-3">
      {threads.map(t => (
        <li key={t.id} className="flex items-center justify-between bg-[#f2faf5] rounded-xl p-4 border border-[#c9f2d8]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-[#06352a] text-sm truncate">{t.title}</p>
              {t.status === 'pinned' && <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-semibold">Pinned</span>}
            </div>
            <p className="text-xs text-gray-500">by {t.author_name || 'Unknown'} · {t.reply_count} replies · {t.category || 'General'}</p>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <button type="button" onClick={() => handlePin(t)} className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-white" title="Pin / unpin" aria-label="Pin or unpin thread"><Crown className="w-4 h-4" /></button>
            <button type="button" onClick={() => handleDelete(t.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white" title="Delete" aria-label="Delete thread"><Trash2 className="w-4 h-4" /></button>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ─── Page shell: hero band + sidebar + content ───────────────────────────────
function Shell({ title, subtitle, user, hasSite, userSiteSlug, action, children }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f2faf5] to-white pt-16 lg:pt-20">
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836]">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="relative w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-10 lg:py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="inline-flex items-center px-4 py-1.5 bg-[#a7f3c0]/10 border border-[#a7f3c0]/30 rounded-full text-xs font-medium mb-3 text-[#a7f3c0]">
              <Users className="w-3.5 h-3.5 mr-1.5" />Community
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{title}</h1>
            <p className="text-sm md:text-base text-emerald-50/80 mt-2 max-w-2xl">{subtitle}</p>
          </div>
          {action}
        </div>
      </section>

      <main className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
          <DashboardSidebar activeTab="community" hasSite={hasSite} userSiteSlug={userSiteSlug} user={user} />
          <div className="lg:col-span-9 min-w-0">{children}</div>
        </div>
      </main>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function DashboardCommunityPage() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('settings')
  const [user, setUser] = useState(null)
  const [hasSite, setHasSite] = useState(false)
  const [userSiteSlug, setUserSiteSlug] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      authFetch('/api/communities/mine').then(r => (r.ok ? r.json() : [])),
      authFetch('/api/admin/community-templates').then(r => (r.ok ? r.json() : [])).catch(() => []),
      authFetch('/api/auth/me').then(r => (r.ok ? r.json() : null)).catch(() => null),
      authFetch('/api/settings/mine').then(r => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([comms, tmpls, me, settings]) => {
      setCommunities(Array.isArray(comms) ? comms : [])
      setTemplates(Array.isArray(tmpls) ? tmpls : [])
      if (me) setUser(me)
      const slug = settings?.site?.subdomain || null
      if (slug) { setHasSite(true); setUserSiteSlug(slug) }
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // FIX: the old code POSTed a real community named "__test__" just to check the
  // plan. Now we open the form, and a 403 on the real submit shows the upgrade prompt.
  const handleCreate = () => {
    setUpgradeRequired(false)
    setShowCreate(true)
  }

  const onCreate = (newCommunity) => {
    setCommunities(prev => [newCommunity, ...prev])
    setShowCreate(false)
    setSelected(newCommunity)
    setTab('settings')
  }

  const onUpgradeRequired = () => {
    setShowCreate(false)
    setUpgradeRequired(true)
  }

  const onStatusChange = (status) => {
    setSelected(s => ({ ...s, status }))
    setCommunities(list => list.map(c => (c.id === selected.id ? { ...c, status } : c)))
  }

  const shell = { user, hasSite, userSiteSlug }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f2faf5] to-white pt-24 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#0a4836] text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin" />Loading your community…
        </div>
      </div>
    )
  }

  // ---- Manage a selected community -----------------------------------------
  if (selected) {
    const tabs = [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'threads', label: 'Threads', icon: MessageSquare },
      { id: 'events', label: 'Events', icon: Calendar },
    ]
    // FIX: the old "View public page" link was malformed. Public URL is /{username}/community/{slug}
    const username = user?.username
    const publicUrl = username && selected.slug ? `/${username}/community/${selected.slug}` : null

    return (
      <Shell {...shell} title={selected.name} subtitle={selected.description || 'Manage settings, members, threads and events.'}>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0a4836] hover:text-[#053728]">
              <ArrowLeft className="w-4 h-4" />All communities
            </button>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <StatusBadge status={selected.status} />
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{selected.member_count || 0} members</span>
              <span className="inline-flex items-center gap-1">
                {selected.price ? <><Lock className="w-3.5 h-3.5" />{selected.currency} {selected.price}</> : <><Globe className="w-3.5 h-3.5" />Free</>}
              </span>
              {selected.status === 'active' && publicUrl && (
                <a href={publicUrl} target="_blank" rel="noreferrer" className={`px-4 py-2 rounded-xl text-xs font-semibold ${BTN_OUTLINE}`}>View public page ↗</a>
              )}
            </div>
          </div>

          <div className={`${CARD} overflow-hidden`}>
            <div className="flex flex-wrap gap-2 p-3 border-b border-[#d9f5e4] bg-[#f2faf5]" role="tablist">
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = tab === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] ${
                      active ? 'bg-[#0a4836] text-white border-[#0a4836]' : 'bg-white text-gray-700 border-[#c9f2d8] hover:border-[#0f6b4f] hover:text-[#0a4836]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                )
              })}
            </div>
            <div className="p-5 sm:p-6">
              {tab === 'settings' && <SettingsTab community={selected} onStatusChange={onStatusChange} />}
              {tab === 'members' && <MembersTab community={selected} />}
              {tab === 'threads' && <ThreadsTab community={selected} />}
              {tab === 'events' && <EventsTab community={selected} />}
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  // ---- Community list / sample preview -------------------------------------
  return (
    <Shell
      {...shell}
      title="Your community"
      subtitle="Your own private space for your audience, free or paid, under your own name."
      action={
        <button type="button" onClick={handleCreate} className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold ${BTN_ORANGE}`}>
          <Plus className="w-4 h-4" />New community
        </button>
      }
    >
      <div className="space-y-6">
        {upgradeRequired && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4" role="alert">
            <Sparkles className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Pro or Enterprise plan required</p>
              <p className="text-sm text-amber-800 mt-1">Community is a paid-tier feature. Upgrade your plan to create and run your own community.</p>
              <Link href="/pricing" className={`inline-block mt-3 text-sm font-bold px-5 py-2 rounded-xl ${BTN_ORANGE}`}>View plans</Link>
            </div>
          </div>
        )}

        {communities.length === 0 ? (
          <CommunitySample onCreate={handleCreate} />
        ) : (
          <ul className="grid gap-4">
            {communities.map(c => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => { setSelected(c); setTab('settings') }}
                  className={`${CARD} w-full flex items-center justify-between p-5 text-left hover:border-[#0f6b4f] hover:bg-[#f2faf5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f6b4f]`}
                >
                  <span className="flex items-center gap-4 min-w-0">
                    <span className="w-12 h-12 bg-[#d9f5e4] rounded-xl flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-[#0a4836]" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-[#06352a] truncate">{c.name}</span>
                        <StatusBadge status={c.status} />
                      </span>
                      <span className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.member_count || 0} members</span>
                        <span>{c.price ? `${c.currency} ${c.price}` : 'Free'}</span>
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-[#0f6b4f] shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCreate && (
        <CreateCommunityModal
          templates={templates}
          onClose={() => setShowCreate(false)}
          onCreate={onCreate}
          onUpgradeRequired={onUpgradeRequired}
        />
      )}
    </Shell>
  )
}