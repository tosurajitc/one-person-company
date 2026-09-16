'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, GraduationCap, Bot, DollarSign, TrendingUp, TrendingDown,
  Plus, Bell, FileText, BarChart3, Activity, Clock, Star,
  MessageSquare, Award, Globe, Zap, AlertCircle, CheckCircle,
  ArrowRight, Calendar, Download, RefreshCw, Settings, Search, Target,
} from 'lucide-react'
import AdminShell from '../../components/AdminShell'

// Metric Card Component
function MetricCard({ title, value, change, changeType, icon: Icon, trend }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <div className="flex items-center mt-2">
            {changeType === 'increase' ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </span>
            <span className="text-gray-400 text-sm ml-1">vs last month</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
      </div>
    </div>
  )
}

// Chart Component (Placeholder)
function Chart({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="h-64 bg-primary-50 rounded-lg flex items-center justify-center border border-primary-100">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-primary-600 mx-auto mb-2" />
          <p className="text-gray-700 font-medium">Interactive Chart</p>
          <p className="text-gray-400 text-sm">Real-time data visualization</p>
        </div>
      </div>
    </div>
  )
}

// Activity Feed Component
function ActivityFeed() {
  const activities = [
    {
      id: 1,
      type: 'user_signup',
      user: 'Alex Rivera',
      action: 'completed registration and started onboarding',
      time: '2 minutes ago',
      icon: Users,
      color: 'text-green-400'
    },
    {
      id: 2,
      type: 'offer_published',
      user: 'Jordan Kim',
      action: 'published a new offer: "Brand Strategy Session"',
      time: '15 minutes ago',
      icon: Award,
      color: 'text-yellow-400'
    },
    {
      id: 3,
      type: 'ai_query',
      user: 'Sam Patel',
      action: 'used AI Genie to generate website copy',
      time: '32 minutes ago',
      icon: Bot,
      color: 'text-purple-400'
    },
    {
      id: 4,
      type: 'enterprise_signup',
      user: 'Freelance Studio',
      action: 'upgraded to Pro plan',
      time: '1 hour ago',
      icon: DollarSign,
      color: 'text-blue-400'
    },
    {
      id: 5,
      type: 'system_alert',
      user: 'System',
      action: 'API usage approaching 80% limit',
      time: '2 hours ago',
      icon: AlertCircle,
      color: 'text-orange-400'
    }
  ]

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        <button className="text-primary-600 hover:text-primary-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-sm">
                  <span className="font-medium">{activity.user}</span> {activity.action}
                </p>
                <p className="text-gray-400 text-xs">{activity.time}</p>
              </div>
            </div>
          )
        })}
      </div>
      <button className="w-full mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors flex items-center justify-center">
        View All Activities
        <ArrowRight className="w-3 h-3 ml-1" />
      </button>
    </div>
  )
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    {
      title: 'Create New Offer',
      description: 'Add a new product or service offer',
      icon: Plus,
      href: '/admin/content',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Add User Account',
      description: 'Register new user manually',
      icon: Users,
      href: '/admin/users/new',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Send Announcement',
      description: 'Broadcast to all users',
      icon: Bell,
      href: '/admin/communications/new',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Generate Report',
      description: 'Monthly analytics report',
      icon: FileText,
      href: '/admin/reports/generate',
      color: 'from-orange-500 to-red-600'
    }
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
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-primary-50 hover:border-primary-200 transition-all group"
            >
              <div className={`w-8 h-8 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-gray-900 font-medium text-sm">{action.title}</h4>
              <p className="text-gray-500 text-xs mt-1">{action.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading Dashboard...</p>
          </div>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your platform.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Report
              </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value="15,847"
            change="+12.5%"
            changeType="increase"
            icon={Users}
          />
          <MetricCard
            title="Active Founders"
            value="8,234"
            change="+8.2%"
            changeType="increase"
            icon={GraduationCap}
          />
          <MetricCard
            title="AI Queries (Week)"
            value="45,231"
            change="+23.1%"
            changeType="increase"
            icon={Bot}
          />
          <MetricCard
            title="Monthly Revenue"
            value="$124,500"
            change="+15.7%"
            changeType="increase"
            icon={DollarSign}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Chart title="User Growth Trends" />
          <Chart title="Platform Activity" />
          <Chart title="AI Genie Usage Patterns" />
          <Chart title="Revenue Growth" />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed />
          <QuickActions />
        </div>
      </div>
    </AdminShell>
  )
}