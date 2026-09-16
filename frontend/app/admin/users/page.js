'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, Search, Filter, Download, Plus, Edit3, Lock, Unlock,
  Mail, Phone, MapPin, Calendar, Activity, Award, DollarSign,
  MoreVertical, Eye, Trash2, RefreshCw, ArrowUpDown, ChevronDown,
  UserCheck, UserX, Shield, BookOpen, Clock, TrendingUp, AlertCircle,
  X, Check, Ban, Star, Globe, Zap, BarChart3, Settings
} from 'lucide-react'
import AdminShell from '../../../components/AdminShell'

// User Stats Cards Component
function UserStatsCards() {
  const stats = [
    {
      title: 'Total Users',
      value: '15,847',
      change: '+12.5%',
      changeType: 'increase',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active This Week',
      value: '8,234',
      change: '+8.2%',
      changeType: 'increase',
      icon: UserCheck,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'New Registrations',
      value: '143',
      change: '+23.1%',
      changeType: 'increase',
      icon: Plus,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Suspended Accounts',
      value: '47',
      change: '-15.3%',
      changeType: 'decrease',
      icon: Ban,
      color: 'from-red-500 to-red-600'
    }
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
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">vs last month</span>
                </div>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// User Filters Component
function UserFilters({ filters, setFilters, onSearch, onExport }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    onSearch(e.target.value)
  }

  const roles = ['All Roles', 'Admin', 'Founder', 'User', 'Enterprise']
  const statuses = ['All Status', 'Active', 'Inactive', 'Suspended']
  const plans = ['All Plans', 'Free', 'Pro', 'Enterprise', 'Custom']

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search and Filter Toggle */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users by name, email, or ID..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onExport}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <Link
            href="/admin/users/new"
            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Link>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <select
              value={filters.plan}
              onChange={(e) => setFilters({...filters, plan: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
            >
              {plans.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// User Detail Modal Component
function UserDetailModal({ user, isOpen, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState(user || {})

  useEffect(() => {
    if (user) {
      setFormData(user)
    }
  }, [user])

  if (!isOpen || !user) return null

  const tabs = [
    { id: 'profile', name: 'Profile', icon: Users },
    { id: 'business', name: 'Business', icon: BookOpen },
    { id: 'billing', name: 'Billing', icon: DollarSign },
    { id: 'activity', name: 'Activity', icon: Activity },
  ]

  const handleSave = () => {
    onUpdate(formData)
    setEditMode(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'Suspended': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Founder': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'User': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Enterprise': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
            <div className="flex space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                {user.status}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className="p-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user.name}</p>
                    )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    {editMode ? (
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user.email}</p>
                    )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    {editMode ? (
                      <select
                        value={formData.role || ''}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="User">User</option>
                        <option value="Founder">Founder</option>
                        <option value="Admin">Admin</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{user.role}</p>
                    )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    {editMode ? (
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{user.status}</p>
                    )}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">Joined: {user.joinDate}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Activity className="w-4 h-4 mr-2" />
                  <span className="text-sm">Last Active: {user.lastActive}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="text-sm">Location: {user.location}</span>
                </div>
              </div>

              {editMode && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Offers Created</p>
                      <p className="text-2xl font-bold text-gray-900">{user.offersCreated || 0}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Sales Made</p>
                      <p className="text-2xl font-bold text-gray-900">{user.salesMade || 0}</p>
                    </div>
                    <Award className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">AI Sessions</p>
                      <p className="text-2xl font-bold text-gray-900">{user.aiSessions || 0}</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-500 text-sm">Business activity data is pulled from the offers and analytics APIs when available.</p>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-gray-900 font-medium mb-3">Current Plan</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-gray-900">{user.plan || 'Pro Plan'}</p>
                      <p className="text-gray-400 text-sm">Monthly billing</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">${user.monthlySpend || 49}</p>
                      <p className="text-gray-400 text-sm">per month</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-gray-900 font-medium mb-3">Usage This Month</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">AI Queries</span>
                      <span className="text-gray-900">{user.aiQueries || 0} / 2000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Active Sessions</span>
                      <span className="text-gray-900">{user.monthlyHours || 0} sessions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Downloads</span>
                      <span className="text-gray-900">{user.downloads || 15} files</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-gray-900 font-medium mb-3">Billing History</h4>
                <div className="space-y-3">
                  {[
                    { date: '2024-10-01', amount: 49, status: 'Paid', description: 'Pro Plan - Monthly' },
                    { date: '2024-09-01', amount: 49, status: 'Paid', description: 'Pro Plan - Monthly' },
                    { date: '2024-08-01', amount: 49, status: 'Paid', description: 'Pro Plan - Monthly' },
                  ].map((bill, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div>
                        <p className="text-gray-900 font-medium">{bill.description}</p>
                        <p className="text-gray-400 text-sm">{bill.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-medium">${bill.amount}</p>
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                          {bill.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Login Sessions</p>
                      <p className="text-2xl font-bold text-gray-900">{user.loginSessions || 0}</p>
                    </div>
                    <Activity className="w-8 h-8 text-primary-600" />
                  </div>
                  <p className="text-gray-400 text-xs mt-2">This month</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">AI Interactions</p>
                      <p className="text-2xl font-bold text-gray-900">{user.aiInteractions || 0}</p>
                    </div>
                    <Zap className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-gray-400 text-xs mt-2">Total queries</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Support Tickets</p>
                      <p className="text-2xl font-bold text-gray-900">{user.supportTickets || 0}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="text-gray-400 text-xs mt-2">All time</p>
                </div>
              </div>

              <div>
                <h4 className="text-gray-900 font-medium mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  {[
                    { action: 'Published new offer page', time: '2 hours ago', type: 'offer' },
                    { action: 'Used AI Genie for website copy', time: '5 hours ago', type: 'ai' },
                    { action: 'Downloaded business playbook', time: '1 day ago', type: 'download' },
                    { action: 'Updated profile information', time: '3 days ago', type: 'profile' },
                    { action: 'Joined founder community', time: '5 days ago', type: 'community' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'offer' ? 'bg-green-500/20' :
                        activity.type === 'ai' ? 'bg-purple-500/20' :
                        activity.type === 'download' ? 'bg-blue-500/20' :
                        activity.type === 'profile' ? 'bg-orange-500/20' :
                        'bg-gray-500/20'
                      }`}>
                        {activity.type === 'offer' && <BookOpen className="w-4 h-4 text-green-400" />}
                        {activity.type === 'ai' && <Zap className="w-4 h-4 text-purple-400" />}
                        {activity.type === 'download' && <Download className="w-4 h-4 text-blue-400" />}
                        {activity.type === 'profile' && <Users className="w-4 h-4 text-orange-400" />}
                        {activity.type === 'community' && <Users className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{activity.action}</p>
                        <p className="text-gray-400 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Users Table Component
function UsersTable({ users, onUserSelect, onUserAction }) {
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [selectedUsers, setSelectedUsers] = useState([])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-400'
      case 'Inactive': return 'bg-gray-500/20 text-gray-400'
      case 'Suspended': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-500/20 text-red-400'
      case 'Instructor': return 'bg-blue-500/20 text-blue-400'
      case 'Student': return 'bg-green-500/20 text-green-400'
      case 'Enterprise': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">All Users ({users.length})</h3>
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">{selectedUsers.length} selected</span>
              <button className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm hover:bg-primary-100 border border-primary-200">
                Send Email
              </button>
              <button className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-sm hover:bg-yellow-100 border border-yellow-200">
                Change Role
              </button>
              <button className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 border border-red-200">
                Suspend
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center text-gray-500 hover:text-gray-900 font-medium text-sm"
                >
                  User
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('role')}
                  className="flex items-center text-gray-500 hover:text-gray-900 font-medium text-sm"
                >
                  Role
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center text-gray-500 hover:text-gray-900 font-medium text-sm"
                >
                  Status
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('lastActive')}
                  className="flex items-center text-gray-500 hover:text-gray-900 font-medium text-sm"
                >
                  Last Active
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-gray-500 font-medium text-sm">Progress</span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-gray-500 font-medium text-sm">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{user.name}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-500 text-sm">{user.lastActive}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${user.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs">{user.progress || 0}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUserSelect(user)}
                      className="p-1 hover:bg-primary-50 rounded text-primary-600 hover:text-primary-700"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUserAction('edit', user)}
                      className="p-1 hover:bg-green-50 rounded text-green-600 hover:text-green-700"
                      title="Edit User"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUserAction('resetPassword', user)}
                      className="p-1 hover:bg-yellow-50 rounded text-yellow-600 hover:text-yellow-700"
                      title="Reset Password"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUserAction('suspend', user)}
                      className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-600"
                      title="Suspend User"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing 1 to 10 of {users.length} users
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 text-sm">
            Previous
          </button>
          <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm">
            1
          </button>
          <button className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 text-sm">
            2
          </button>
          <button className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 text-sm">
            3
          </button>
          <button className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 text-sm">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

// Main User Management Component
export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [filters, setFilters] = useState({
    role: 'All Roles',
    status: 'All Status',
    plan: 'All Plans',
    dateFrom: '',
    dateTo: ''
  })

  // Sample user data
  useEffect(() => {
    const sampleUsers = [
      {
        id: 1,
        name: 'Alex Rivera',
        email: 'alex.rivera@gmail.com',
        role: 'Founder',
        status: 'Active',
        lastActive: '2 hours ago',
        progress: 85,
        joinDate: '2024-01-15',
        location: 'San Francisco, CA',
        plan: 'Pro Plan',
        offersCreated: 3,
        salesMade: 12,
        aiSessions: 127,
        monthlySpend: 49,
        aiQueries: 1247,
        monthlyHours: 23,
        downloads: 15
      },
      {
        id: 2,
        name: 'Jordan Kim',
        email: 'jordan.k@gmail.com',
        role: 'Founder',
        status: 'Active',
        lastActive: '5 minutes ago',
        progress: 95,
        joinDate: '2023-11-20',
        location: 'Seattle, WA',
        plan: 'Enterprise',
        offersCreated: 8,
        salesMade: 45,
        aiSessions: 245,
        monthlySpend: 149,
        aiQueries: 2341,
        monthlyHours: 45,
        downloads: 67
      },
      {
        id: 3,
        name: 'Sam Patel',
        email: 'sam.patel@studio.com',
        role: 'Admin',
        status: 'Active',
        lastActive: '1 hour ago',
        progress: 78,
        joinDate: '2023-08-10',
        location: 'New York, NY',
        plan: 'Enterprise',
        offersCreated: 12,
        salesMade: 67,
        aiSessions: 312,
        monthlySpend: 299,
        aiQueries: 3567,
        monthlyHours: 67,
        downloads: 89
      },
      {
        id: 4,
        name: 'David Kim',
        email: 'david.kim@gmail.com',
        role: 'User',
        status: 'Inactive',
        lastActive: '2 days ago',
        progress: 45,
        joinDate: '2024-03-01',
        location: 'Los Angeles, CA',
        plan: 'Free',
        offersCreated: 1,
        salesMade: 0,
        aiSessions: 34,
        monthlySpend: 0,
        aiQueries: 234,
        monthlyHours: 8,
        downloads: 5
      },
      {
        id: 5,
        name: 'Lisa Anderson',
        email: 'lisa.a@freelance.com',
        role: 'Enterprise',
        status: 'Active',
        lastActive: '30 minutes ago',
        progress: 92,
        joinDate: '2024-02-14',
        location: 'Austin, TX',
        plan: 'Enterprise',
        offersCreated: 15,
        salesMade: 89,
        aiSessions: 456,
        monthlySpend: 499,
        aiQueries: 4523,
        monthlyHours: 78,
        downloads: 134
      },
      {
        id: 6,
        name: 'Alex Thompson',
        email: 'alex.t@gmail.com',
        role: 'User',
        status: 'Suspended',
        lastActive: '1 week ago',
        progress: 23,
        joinDate: '2024-04-05',
        location: 'Chicago, IL',
        plan: 'Pro Plan',
        offersCreated: 0,
        salesMade: 0,
        aiSessions: 19,
        monthlySpend: 49,
        aiQueries: 123,
        monthlyHours: 4,
        downloads: 2
      }
    ]
    
    setUsers(sampleUsers)
    setFilteredUsers(sampleUsers)
  }, [])

  const handleSearch = (searchTerm) => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toString().includes(searchTerm)
    )
    setFilteredUsers(filtered)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting user data...')
  }

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleUserAction = (action, user) => {
    switch (action) {
      case 'edit':
        setSelectedUser(user)
        setShowUserModal(true)
        break
      case 'resetPassword':
        console.log('Reset password for:', user.name)
        // Implement password reset
        break
      case 'suspend':
        console.log('Suspend user:', user.name)
        // Implement user suspension
        break
      default:
        break
    }
  }

  const handleUserUpdate = (updatedUser) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ))
    setFilteredUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ))
    setShowUserModal(false)
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Manage user accounts, roles, and permissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <UserStatsCards />

        {/* Filters */}
        <UserFilters
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearch}
          onExport={handleExport}
        />

        {/* Users Table */}
        <UsersTable
          users={filteredUsers}
          onUserSelect={handleUserSelect}
          onUserAction={handleUserAction}
        />

        {/* User Detail Modal */}
        <UserDetailModal
          user={selectedUser}
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          onUpdate={handleUserUpdate}
        />
      </div>
    </AdminShell>
  )
}