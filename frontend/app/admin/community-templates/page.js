'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react'
import AdminShell from '../../../components/AdminShell'

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
// Inline edit row
// ---------------------------------------------------------------------------
function TemplateRow({ template, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: template.name,
    description: template.description || '',
    categories: (template.categories || []).join('\n'),
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(template.id, {
      name: form.name,
      description: form.description,
      categories: form.categories.split('\n').map((s) => s.trim()).filter(Boolean),
    })
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <tr className="hover:bg-gray-50 group">
        <td className="py-3 px-4">
          <p className="font-semibold text-gray-900">{template.name}</p>
          {template.description && <p className="text-xs text-gray-400 mt-0.5">{template.description}</p>}
        </td>
        <td className="py-3 px-4">
          <div className="flex flex-wrap gap-1">
            {(template.categories || []).map((cat) => (
              <span key={cat} className="text-xs bg-primary-50 text-primary-700 border border-primary-100 rounded-full px-2 py-0.5">
                {cat}
              </span>
            ))}
          </div>
        </td>
        <td className="py-3 px-4 text-xs text-gray-400">
          {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : '—'}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-primary-600">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(template.id)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="bg-primary-50">
      <td className="py-3 px-4 space-y-1">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium" placeholder="Name" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-600" placeholder="Description" />
      </td>
      <td className="py-3 px-4">
        <textarea value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })}
          rows={4} className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono resize-none" />
        <p className="text-xs text-gray-400 mt-1">One category per line</p>
      </td>
      <td className="py-3 px-4 text-xs text-gray-400">Editing…</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <button onClick={handleSave} disabled={saving} className="p-1.5 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminCommunityTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', description: '', categories: '' })
  const [creating, setCreating] = useState(false)
  const [err, setErr] = useState(null)

  const load = () => {
    authFetch('/api/admin/community-templates')
      .then((r) => r.ok ? r.json() : [])
      .then(setTemplates)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setErr(null)
    const res = await authFetch('/api/admin/community-templates', {
      method: 'POST',
      body: JSON.stringify({
        name: newForm.name,
        description: newForm.description,
        categories: newForm.categories.split('\n').map((s) => s.trim()).filter(Boolean),
      }),
    })
    if (res.ok) {
      setNewForm({ name: '', description: '', categories: '' })
      setShowNew(false)
      load()
    } else {
      const body = await res.json().catch(() => ({}))
      setErr(body.detail || 'Failed to create template')
    }
    setCreating(false)
  }

  const handleSave = async (id, data) => {
    await authFetch(`/api/admin/community-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this template? Founders who used it will keep their seeded categories.')) return
    await authFetch(`/api/admin/community-templates/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <AdminShell>
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Reusable category presets founders can pick when creating a community.
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg"
        >
          <Plus className="w-4 h-4" /> New template
        </button>
      </div>

      {/* New template form */}
      {showNew && (
        <form onSubmit={handleCreate} className="bg-primary-50 border border-primary-100 rounded-2xl p-5 mb-6 max-w-lg">
          <h3 className="font-semibold text-gray-800 mb-4">New template</h3>
          <div className="space-y-3">
            <input required value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              placeholder="Name (e.g. Coaching)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
              placeholder="Short description" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categories (one per line)</label>
              <textarea value={newForm.categories} onChange={(e) => setNewForm({ ...newForm, categories: e.target.value })}
                rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none"
                placeholder={'Announcements\nGeneral\nQ&A\nResources'} />
            </div>
            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={creating}
                className="px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg disabled:opacity-60 flex items-center gap-2">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create
              </button>
              <button type="button" onClick={() => setShowNew(false)} className="px-5 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="py-3 px-4 text-left w-56">Template</th>
                <th className="py-3 px-4 text-left">Default categories</th>
                <th className="py-3 px-4 text-left w-28">Updated</th>
                <th className="py-3 px-4 text-left w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 text-sm">
                    No templates yet. Create one above.
                  </td>
                </tr>
              )}
              {templates.map((t) => (
                <TemplateRow key={t.id} template={t} onSave={handleSave} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Deleting a template does not affect communities already seeded from it.
      </p>
    </div>
    </AdminShell>
  )
}
