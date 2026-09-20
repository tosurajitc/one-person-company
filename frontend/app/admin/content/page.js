'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen, Video, FileText, Users, Eye, Edit3, Trash2, Plus,
  Search, Filter, Upload, Download, Play, Pause, Star, Clock,
  TrendingUp, Award, Globe, Settings, BarChart3, Zap, Calendar,
  ChevronDown, ArrowUpDown, MoreVertical, Check, X, AlertCircle,
  Image, Music, Code, PenTool, Layers, Target, RefreshCw, CheckCircle
} from 'lucide-react'
import AdminShell from '../../../components/AdminShell'

// Content Stats Component
function ContentStats() {
  const stats = [
    { title: 'Total Offers',  value: '—', change: 'Live from API', icon: BookOpen, iconBg: 'bg-primary-50',  iconColor: 'text-primary-600',  border: 'border-primary-100' },
    { title: 'Playbooks',     value: '—', change: 'Live from API', icon: Target,   iconBg: 'bg-blue-50',    iconColor: 'text-blue-500',     border: 'border-blue-100'    },
    { title: 'Media Assets',  value: '—', change: 'Live from API', icon: Video,    iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-500',   border: 'border-indigo-100'  },
    { title: 'Total Sales',   value: '—', change: 'Live from API', icon: Users,    iconBg: 'bg-sky-50',     iconColor: 'text-sky-500',      border: 'border-sky-100'     },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-primary-500 text-sm mt-2">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} border ${stat.border} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Content Tabs Component
function ContentTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'offers', name: 'Offers', icon: BookOpen, count: null },
    { id: 'playbooks', name: 'Playbooks', icon: Target, count: null },
    { id: 'media', name: 'Media', icon: Video, count: null },
    { id: 'resources', name: 'Resources', icon: FileText, count: null }
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 mb-6">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-blue-400 bg-blue-500/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.name}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Offer Management Component
function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selectedCourses, setSelectedCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [toast, setToast] = useState(null)

  const getToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token') || ''

  const fetchCourses = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/content/offers', { headers: { Authorization: `Bearer ${getToken()}` } })
      if (!res.ok) throw new Error('Failed to load offers')
      const data = await res.json()
      setCourses(data)
      setFilteredCourses(data)
    } catch (e) {
      setError(e.message)
    } finally { setIsLoading(false) }
  }

  useEffect(() => { fetchCourses() }, [])

  const handleSearch = (e) => {
    const term = e.target.value
    setSearchTerm(term)
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(term.toLowerCase()) ||
      course.instructor.toLowerCase().includes(term.toLowerCase()) ||
      course.category.toLowerCase().includes(term.toLowerCase())
    )
    setFilteredCourses(filtered)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return 'bg-green-500/20 text-green-400'
      case 'Draft': return 'bg-yellow-500/20 text-yellow-400'
      case 'Review': return 'bg-blue-500/20 text-primary-600'
      case 'Archived': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const handleDelete = async (courseId) => {
    if (!confirm('Delete this offer? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/content/offers/${courseId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
      if (!res.ok) throw new Error('Failed to delete offer')
      setToast({ message: 'Offer deleted.', type: 'success' })
      fetchCourses()
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center px-5 py-3 rounded-xl border backdrop-blur-sm ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingCourse) && (
        <CourseModal
          course={editingCourse}
          getToken={getToken}
          onClose={() => { setShowCreateModal(false); setEditingCourse(null) }}
          onSaved={() => { setShowCreateModal(false); setEditingCourse(null); fetchCourses(); setToast({ message: editingCourse ? 'Offer updated!' : 'Offer created!', type: 'success' }) }}
          onError={(msg) => setToast({ message: msg, type: 'error' })}
        />
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Review">Review</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={fetchCourses} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all">
              <Plus className="w-4 h-4 mr-2" />
              New Offer
            </button>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && <div className="text-center py-12 text-gray-400">Loading offers...</div>}
      {error && <div className="text-center py-12 text-red-400">{error}</div>}

      {/* Course Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">No offers found. Create your first offer!</div>
          )}
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-sm transition-all group">
              <div className="relative aspect-video bg-primary-50 border-b border-primary-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white border border-primary-200 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-500" />
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>{course.status}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{course.title}</h3>
                    {course.price != null
                      ? <span className="shrink-0 text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">{course.currency} {Number(course.price).toLocaleString()}</span>
                      : <span className="shrink-0 text-sm font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">Free</span>
                    }
                  </div>
                  <p className="text-gray-400 text-sm">by {course.instructor}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {course.offer_type && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{course.offer_type.replace('_', ' ')}</span>}
                    {course.category && <span className="text-xs text-gray-400">{course.category}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                  {course.duration && <div className="flex items-center"><Clock className="w-4 h-4 mr-1" />{course.duration}</div>}
                  {course.lessons_count > 0 && <div className="flex items-center"><BookOpen className="w-4 h-4 mr-1" />{course.lessons_count} items</div>}
                  {course.slug && <div className="flex items-center text-xs text-gray-300 font-mono truncate max-w-[120px]">/offer/{course.slug}</div>}
                </div>

                {course.description && <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>}

                <div className="flex space-x-2">
                  <button onClick={() => setEditingCourse(course)} className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 px-3 rounded-lg text-sm font-medium transition-colors text-center">
                    <Edit3 className="w-4 h-4 inline mr-1" />Edit
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Course Create / Edit Modal
// ─────────────────────────────────────────────
function CourseModal({ course, getToken, onClose, onSaved, onError }) {
  const inputCls = 'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none'

  const OFFER_TYPES = [
    { value: 'service',         label: 'Service' },
    { value: 'coaching',        label: 'Coaching / Consulting' },
    { value: 'course',          label: 'Course / Workshop' },
    { value: 'digital_product', label: 'Digital Product' },
    { value: 'video',           label: 'Video / Film' },
    { value: 'audio',           label: 'Audio / Podcast' },
    { value: 'book',            label: 'Book / eBook' },
    { value: 'community',       label: 'Community / Membership' },
    { value: 'event',           label: 'Event / Webinar' },
    { value: 'physical',        label: 'Physical Product' },
    { value: 'bundle',          label: 'Bundle / Package' },
    { value: 'other',           label: 'Other' },
  ]
  const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']

  const [form, setForm] = useState({
    title: course?.title || '',
    instructor: course?.instructor || '',
    offer_type: course?.offer_type || 'service',
    category: course?.category || '',
    status: course?.status || 'Draft',
    description: course?.description || '',
    price: course?.price ?? '',
    currency: course?.currency || 'INR',
    slug: course?.slug || '',
    duration: course?.duration || '',
    lessons_count: course?.lessons_count ?? 0,
    thumbnail_url: course?.thumbnail_url || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Auto-generate slug from title when creating a new offer
  const handleTitleChange = (val) => {
    const slugified = val.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
    setForm(f => ({ ...f, title: val, ...(course ? {} : { slug: slugified }) }))
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.instructor.trim()) { onError('Title and Creator are required.'); return }
    setIsSaving(true)
    try {
      const url = course ? `/api/content/offers/${course.id}` : '/api/content/offers'
      const method = course ? 'PUT' : 'POST'
      const payload = {
        ...form,
        price: form.price === '' ? null : parseFloat(form.price),
        lessons_count: parseInt(form.lessons_count) || 0,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail || 'Save failed') }
      onSaved()
    } catch (e) {
      onError(e.message)
    } finally { setIsSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{course ? 'Edit Offer' : 'New Offer'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
        </div>

        {/* Row 1: Title + Offer Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="e.g. 1-on-1 Brand Strategy Session" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type *</label>
            <select value={form.offer_type} onChange={e => setForm({...form, offer_type: e.target.value})} className={inputCls}>
              {OFFER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Creator + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Creator / Provider *</label>
            <input type="text" value={form.instructor} onChange={e => setForm({...form, instructor: e.target.value})} placeholder="Your name or brand" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Design, Marketing, Finance" className={inputCls} />
          </div>
        </div>

        {/* Row 3: Price + Currency + Status */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0 = Free" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className={inputCls}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputCls}>
              {['Draft','Published','Review','Archived'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Row 4: Slug + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r border-gray-300 whitespace-nowrap">/offer/</span>
              <input type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="my-offer-name" className="flex-1 px-3 py-2 text-sm text-gray-900 outline-none bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <input type="text" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="e.g. 60 min session, 4-week program" className={inputCls} />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="What does the buyer get? What problem does this solve?" className={inputCls} />
        </div>

        {/* Thumbnail + Items count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
            <input type="url" value={form.thumbnail_url} onChange={e => setForm({...form, thumbnail_url: e.target.value})} placeholder="https://..." className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Items / Modules</label>
            <input type="number" min="0" value={form.lessons_count} onChange={e => setForm({...form, lessons_count: e.target.value})} className={inputCls} />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center">
            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : null}
            {course ? 'Update Offer' : 'Create Offer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Playbook Create / Edit Modal
// ─────────────────────────────────────────────
function PlaybookModal({ playbook, categories, getToken, onClose, onSaved, onError }) {
  const inputCls = 'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none'
  const [form, setForm] = useState({
    title: playbook?.title || '',
    description: playbook?.description || '',
    category: playbook?.category || (categories[0]?.id || 'launch'),
    content_type: playbook?.content_type || 'guide',
    is_featured: playbook?.is_featured ?? false,
    is_public: playbook?.is_public ?? true,
    read_time_minutes: playbook?.read_time_minutes ?? 15,
    file_url: playbook?.file_url || '',
    difficulty: playbook?.difficulty || 'Beginner',
    author: playbook?.author || 'OPC Genie Team',
    thumbnail_url: playbook?.thumbnail_url || '',
    is_published: playbook?.is_published ?? true,
    nav_order: playbook?.nav_order ?? 0,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim()) { onError('Title is required.'); return }
    setIsSaving(true)
    try {
      const url = playbook ? `/api/resources/${playbook.id}` : '/api/resources'
      const method = playbook ? 'PUT' : 'POST'
      const payload = {
        ...form,
        duration: form.read_time_minutes ? `${form.read_time_minutes} min read` : '',
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail || 'Save failed') }
      onSaved()
    } catch (e) {
      onError(e.message)
    } finally { setIsSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-200 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{playbook ? 'Edit Playbook' : 'New Playbook'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Title *</label>
          <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputCls}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Content Type</label>
            <select value={form.content_type} onChange={e => setForm({...form, content_type: e.target.value})} className={inputCls}>
              {['guide', 'template', 'checklist', 'download'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Read Time (Mins)</label>
            <input type="number" value={form.read_time_minutes} onChange={e => setForm({...form, read_time_minutes: parseInt(e.target.value)||0})} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Author / Team</label>
            <input type="text" value={form.author} onChange={e => setForm({...form, author: e.target.value})} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">File / Asset URL (Optional)</label>
          <input type="text" placeholder="/downloads/example.pdf or https://..." value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} className={inputCls} />
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2">
          <label className="flex items-center space-x-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} className="rounded bg-gray-100 border-gray-300 text-blue-500 focus:ring-0" />
            <span>Featured</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={e => setForm({...form, is_public: e.target.checked})} className="rounded bg-gray-100 border-gray-300 text-blue-500 focus:ring-0" />
            <span>Public Access</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} className="rounded bg-gray-100 border-gray-300 text-blue-500 focus:ring-0" />
            <span>Published</span>
          </label>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-primary-600 text-gray-900 rounded-lg transition-all disabled:opacity-50 flex items-center">
            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : null}
            {playbook ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Playbooks Management Component
function PlaybookManagement() {
  const [playbooks, setPlaybooks] = useState([])
  const [categories, setCategories] = useState([])
  const [filteredPlaybooks, setFilteredPlaybooks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlaybook, setEditingPlaybook] = useState(null)
  const [toast, setToast] = useState(null)

  const getToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token') || ''

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [catsRes, playsRes] = await Promise.all([
        fetch('/api/settings/playbook_categories'),
        fetch('/api/resources', { headers: { Authorization: `Bearer ${getToken()}` } }),
      ])
      const catsData = catsRes.ok ? await catsRes.json() : []
      const playsData = playsRes.ok ? await playsRes.json() : []
      setCategories(catsData)
      setPlaybooks(playsData)
      setFilteredPlaybooks(playsData)
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let filtered = playbooks
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory)
    }
    setFilteredPlaybooks(filtered)
  }, [searchTerm, filterCategory, playbooks])

  const handleDelete = async (id) => {
    if (!confirm('Delete this playbook? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
      if (!res.ok) throw new Error('Failed to delete playbook')
      setToast({ message: 'Playbook deleted.', type: 'success' })
      loadData()
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
  }

  const handleToggle = async (item, field) => {
    try {
      const updatedValue = !item[field]
      const res = await fetch(`/api/resources/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ [field]: updatedValue }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      loadData()
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center px-5 py-3 rounded-xl border backdrop-blur-sm ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingPlaybook) && (
        <PlaybookModal
          playbook={editingPlaybook}
          categories={categories}
          getToken={getToken}
          onClose={() => { setShowCreateModal(false); setEditingPlaybook(null) }}
          onSaved={() => { setShowCreateModal(false); setEditingPlaybook(null); loadData(); setToast({ message: editingPlaybook ? 'Playbook updated!' : 'Playbook created!', type: 'success' }) }}
          onError={(msg) => setToast({ message: msg, type: 'error' })}
        />
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search playbooks..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={loadData} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-gray-900 rounded-lg font-medium transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Create Playbook
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading playbooks...</div>
        ) : filteredPlaybooks.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No playbooks found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Featured</th>
                  <th className="px-6 py-4">Public</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPlaybooks.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-gray-400 text-xs line-clamp-1">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 capitalize">
                      {categories.find(c => c.id === item.category)?.name || item.category || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md text-xs font-medium uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {item.content_type || 'guide'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(item, 'is_featured')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.is_featured ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' : 'bg-gray-800 text-gray-400'}`}
                      >
                        {item.is_featured ? '★ Pinned' : 'Normal'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(item, 'is_public')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.is_public ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}
                      >
                        {item.is_public ? 'Public' : 'Members'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(item, 'is_published')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.is_published ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-gray-700 text-gray-400'}`}
                      >
                        {item.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setEditingPlaybook(item)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    { title: 'Bulk Upload',          description: 'Upload multiple assets at once',       icon: Upload,   href: '/admin/content/upload',       iconBg: 'bg-primary-50',  iconColor: 'text-primary-600', border: 'border-primary-100' },
    { title: 'Content Analytics',    description: 'View detailed performance metrics',    icon: BarChart3, href: '/admin/content/analytics',    iconBg: 'bg-blue-50',     iconColor: 'text-blue-500',    border: 'border-blue-100'    },
    { title: 'AI Copy Generator',    description: 'Generate offer copy with AI',          icon: Zap,      href: '/admin/content/ai-generator',  iconBg: 'bg-indigo-50',   iconColor: 'text-indigo-500',  border: 'border-indigo-100'  },
    { title: 'Scheduled Publishing', description: 'Manage content release schedule',      icon: Calendar, href: '/admin/content/schedule',      iconBg: 'bg-sky-50',      iconColor: 'text-sky-500',     border: 'border-sky-100'     },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Link
              key={index}
              href={action.href}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:bg-primary-50 hover:border-primary-200 transition-all group"
            >
              <div className={`w-8 h-8 ${action.iconBg} border ${action.border} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-4 h-4 ${action.iconColor}`} />
              </div>
              <h4 className="text-gray-900 font-medium text-sm">{action.title}</h4>
              <p className="text-gray-400 text-xs mt-1">{action.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// Main Content Management Component
export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState('offers')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'offers':
        return <CourseManagement />
      case 'playbooks':
        return <PlaybookManagement />
      case 'media':
        return <div className="text-gray-900 py-8 text-center text-gray-400">Media Management Coming Soon</div>
      case 'resources':
        return <div className="text-gray-900 py-8 text-center text-gray-400">Resource Management Coming Soon</div>
      default:
        return <CourseManagement />
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
            <p className="text-gray-500 mt-1">Manage offers, playbooks, and founder resources</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors border border-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Content Stats */}
        <ContentStats />

        {/* Tabs */}
        <ContentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            {renderTabContent()}
          </div>
          <div className="xl:col-span-1">
            <QuickActions />
          </div>
        </div>
      </div>
    </AdminShell>
  )
}