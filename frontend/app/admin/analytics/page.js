'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp, DollarSign, Users, BookOpen, BarChart3, Settings,
  Calendar, Download, Filter, RefreshCw, ArrowUpDown, ChevronDown,
  Target, Award, Globe, Clock, Activity, Zap, Building, Star,
  PieChart, LineChart, Activity as ActivityIcon, Eye, AlertCircle,
  CheckCircle, TrendingDown, ArrowUp, ArrowDown, Percent,
  FileText, Mail, Phone, MapPin, ExternalLink, Search
} from 'lucide-react'
import AdminShell from '../../../components/AdminShell'

// Key Metrics Overview
function KeyMetricsOverview() {
  const [timeRange, setTimeRange] = useState('30d')
  const [metrics, setMetrics] = useState({
    revenue: {
      current: 124500,
      previous: 108300,
      change: 14.9
    },
    users: {
      current: 15847,
      previous: 14123,
      change: 12.2
    },
    enrollments: {
      current: 45291,
      previous: 38456,
      change: 17.8
    },
    retention: {
      current: 84.5,
      previous: 82.1,
      change: 2.9
    },
    avgRevenuePerUser: {
      current: 7.85,
      previous: 7.67,
      change: 2.3
    },
    courseCompletionRate: {
      current: 76.8,
      previous: 74.2,
      change: 3.5
    }
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercent = (value) => {
    return `${value}%`
  }

  const getChangeColor = (change) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400'
  }

  const getChangeIcon = (change) => {
    return change >= 0 ? ArrowUp : ArrowDown
  }

  const metricCards = [
    { title: 'Monthly Revenue',   value: formatCurrency(metrics.revenue.current),             change: metrics.revenue.change,             icon: DollarSign, iconBg: 'bg-primary-50', iconColor: 'text-primary-600', border: 'border-primary-100' },
    { title: 'Total Users',       value: metrics.users.current.toLocaleString(),               change: metrics.users.change,               icon: Users,      iconBg: 'bg-blue-50',    iconColor: 'text-blue-500',    border: 'border-blue-100'    },
    { title: 'Course Enrollments',value: metrics.enrollments.current.toLocaleString(),         change: metrics.enrollments.change,         icon: BookOpen,   iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-500',  border: 'border-indigo-100'  },
    { title: 'User Retention',    value: formatPercent(metrics.retention.current),             change: metrics.retention.change,           icon: Target,     iconBg: 'bg-sky-50',     iconColor: 'text-sky-500',     border: 'border-sky-100'     },
    { title: 'Avg Revenue/User',  value: formatCurrency(metrics.avgRevenuePerUser.current),    change: metrics.avgRevenuePerUser.change,   icon: TrendingUp, iconBg: 'bg-primary-50', iconColor: 'text-primary-600', border: 'border-primary-100' },
    { title: 'Completion Rate',   value: formatPercent(metrics.courseCompletionRate.current),  change: metrics.courseCompletionRate.change, icon: Award,     iconBg: 'bg-blue-50',    iconColor: 'text-blue-500',    border: 'border-blue-100'    },
  ]

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Key Performance Metrics</h2>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors border border-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon
          const ChangeIcon = getChangeIcon(metric.change)
          return (
            <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${metric.iconBg} border ${metric.border} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                </div>
                <div className={`flex items-center text-sm font-medium ${metric.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  <ChangeIcon className="w-4 h-4 mr-1" />
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                <p className="text-gray-400 text-sm mt-2">vs previous period</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Revenue Analytics
function RevenueAnalytics() {
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 124500,
    subscriptionRevenue: 89650,
    courseRevenue: 28350,
    enterpriseRevenue: 6500,
    revenueByPlan: [
      { plan: 'Free', users: 8234, revenue: 0, percentage: 0 },
      { plan: 'Pro', users: 5671, revenue: 56710, percentage: 45.6 },
      { plan: 'Enterprise', users: 1942, revenue: 67790, percentage: 54.4 }
    ],
    topPerformingOffers: [
      { name: 'AI Website Builder — Starter', revenue: 24940, enrollments: 1247 },
      { name: 'Business Launch Bundle', revenue: 46820, enrollments: 2341 },
      { name: 'Founder Strategy Session', revenue: 31560, enrollments: 1578 },
      { name: 'Digital Workforce Pro', revenue: 28750, enrollments: 1437 },
      { name: 'OPC Genie — Annual Plan', revenue: 18920, enrollments: 946 }
    ]
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics</h2>
      
      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.totalRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.subscriptionRevenue)}</p>
            </div>
            <Users className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Course Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.courseRevenue)}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Enterprise</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.enterpriseRevenue)}</p>
            </div>
            <Building className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Revenue by Plan and Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Plan</h3>
          <div className="space-y-4">
            {revenueData.revenueByPlan.map((plan, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    plan.plan === 'Free' ? 'bg-gray-400' :
                    plan.plan === 'Pro' ? 'bg-blue-400' : 'bg-purple-400'
                  }`}></div>
                  <div>
                    <p className="text-gray-900 font-medium">{plan.plan}</p>
                    <p className="text-gray-400 text-sm">{plan.users.toLocaleString()} users</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-bold">{formatCurrency(plan.revenue)}</p>
                  <p className="text-gray-400 text-sm">{plan.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Offers */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Offers</h3>
          <div className="space-y-4">
            {revenueData.topPerformingOffers.map((offer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-50 border border-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">{offer.name}</p>
                    <p className="text-gray-400 text-sm">{offer.enrollments} sales</p>
                  </div>
                </div>
                <p className="text-green-400 font-bold">{formatCurrency(offer.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// User Analytics
function UserAnalytics() {
  const [userMetrics, setUserMetrics] = useState({
    totalUsers: 15847,
    activeUsers: 8234,
    newUsers: 1247,
    churnRate: 3.2,
    usersByRole: [
      { role: 'Students', count: 14500, percentage: 91.5 },
      { role: 'Instructors', count: 145, percentage: 0.9 },
      { role: 'Enterprise', count: 1190, percentage: 7.5 },
      { role: 'Admins', count: 12, percentage: 0.1 }
    ],
    geographicData: [
      { country: 'United States', users: 4763, percentage: 30.1 },
      { country: 'India', users: 3169, percentage: 20.0 },
      { country: 'United Kingdom', users: 1902, percentage: 12.0 },
      { country: 'Germany', users: 1585, percentage: 10.0 },
      { country: 'Canada', users: 1269, percentage: 8.0 },
      { country: 'Others', users: 3159, percentage: 19.9 }
    ]
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">User Analytics</h2>
      
      {/* User Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{userMetrics.totalUsers.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{userMetrics.activeUsers.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">New Users</p>
              <p className="text-2xl font-bold text-gray-900">{userMetrics.newUsers.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Churn Rate</p>
              <p className="text-2xl font-bold text-gray-900">{userMetrics.churnRate}%</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Users by Role</h3>
          <div className="space-y-4">
            {userMetrics.usersByRole.map((role, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium">{role.role}</span>
                  <span className="text-gray-400">{role.count.toLocaleString()} ({role.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      role.role === 'Students' ? 'bg-blue-500' :
                      role.role === 'Instructors' ? 'bg-green-500' :
                      role.role === 'Enterprise' ? 'bg-purple-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${role.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="space-y-4">
            {userMetrics.geographicData.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-primary-400 border border-primary-200"></div>
                  <span className="text-gray-900 font-medium">{location.country}</span>
                </div>
                <div className="text-right">
                  <p className="text-gray-900">{location.users.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">{location.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Business Analytics
function LearningAnalytics() {
  const [metrics, setMetrics] = useState({
    totalOffers: 0,
    totalUsers: 0,
    averageEngagement: 0,
    totalSessions: 0,
    popularCategories: [],
    topOffers: []
  })

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch('/api/content/offers', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setMetrics(m => ({ ...m, totalOffers: Array.isArray(data) ? data.length : 0 })))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Business Analytics</h2>
      
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Offers</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalOffers}</p>
            </div>
            <BookOpen className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Engagement</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.averageEngagement}%</p>
            </div>
            <Award className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalSessions}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Details — populated from API when data is available */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Offers Overview</h3>
        {metrics.totalOffers === 0 ? (
          <p className="text-gray-400 text-sm">No offers found. Create your first offer via Content Management.</p>
        ) : (
          <p className="text-gray-500 text-sm">{metrics.totalOffers} active offers in your catalogue.</p>
        )}
      </div>
    </div>
  )
}

// Main Business Intelligence Component
export default function BusinessIntelligence() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'revenue', name: 'Revenue', icon: DollarSign },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'offers', name: 'Offers', icon: BookOpen },
    { id: 'forecasting', name: 'Forecasting', icon: TrendingUp }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <KeyMetricsOverview />
      case 'revenue':
        return <RevenueAnalytics />
      case 'users':
        return <UserAnalytics />
      case 'offers':
        return <LearningAnalytics />
      case 'forecasting':
        return <div className="text-gray-900">Forecasting & Predictions Coming Soon</div>
      default:
        return <KeyMetricsOverview />
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
            <p className="text-gray-500 mt-1">Comprehensive analytics and business insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors border border-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </button>
            <button className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-gray-900 rounded-lg font-medium transition-all">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex overflow-x-auto border-b border-gray-200">
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
                </button>
              )
            })}
          </div>
          
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}