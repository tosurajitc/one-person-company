'use client'

import { useState, useEffect } from 'react'
import {
  Zap, Bot, BarChart3, Settings, TrendingUp, Users, BookOpen,
  Activity, DollarSign, Clock, AlertCircle, CheckCircle, XCircle,
  Cpu, Database, Globe, Shield, RefreshCw, Download, Upload,
  MessageSquare, Code, Brain, Target, Layers, Eye, Edit3,
  Play, Pause, RotateCcw, ArrowUpDown, ChevronDown, Search,
  Filter, Plus, Trash2, Copy, ExternalLink, Key, Monitor,
  Send
} from 'lucide-react'
import AdminShell from '../../../components/AdminShell'

// AIAssistantManagement Component - THE MISSING COMPONENT
function AIAssistantManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [conversations, setConversations] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [testResponse, setTestResponse] = useState(null)

  // Sample data for demo - replace with actual API calls
  const sampleConversations = [
    {
      id: 'conv_1',
      user_id: 'user_123',
      started_at: '2025-01-24T10:30:00Z',
      message_count: 12,
      last_message: 'Help me write copy for my consulting offer page',
      status: 'active'
    },
    {
      id: 'conv_2',
      user_id: 'user_456',
      started_at: '2025-01-24T09:15:00Z',
      message_count: 8,
      last_message: 'What should I charge for my coaching package?',
      status: 'completed'
    },
    {
      id: 'conv_3',
      user_id: 'user_789',
      started_at: '2025-01-24T08:45:00Z',
      message_count: 15,
      last_message: 'Generate a landing page for my freelance service',
      status: 'active'
    }
  ]

  const sampleMetrics = {
    total_conversations: 156,
    total_messages: 1247,
    recent_messages_hour: 23,
    average_response_time: 1.2,
    success_rate: 98.5,
    active_users: 45,
    popular_topics: [
      { topic: 'Website Copy', count: 89 },
      { topic: 'Pricing & Offers', count: 67 },
      { topic: 'Sales Strategy', count: 45 },
      { topic: 'Brand Identity', count: 34 }
    ]
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Simulate API calls - replace with actual endpoints
      setTimeout(() => {
        setConversations(sampleConversations)
        setMetrics(sampleMetrics)
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to load data:', error)
      setIsLoading(false)
    }
  }

  const testAIAssistant = async () => {
    if (!testMessage.trim()) return
    
    setIsLoading(true)
    try {
      // Simulate API call to test AI assistant
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          user_id: 'admin_test'
        })
      })
      
      const data = await response.json()
      setTestResponse(data)
    } catch (error) {
      setTestResponse({
        success: false,
        error: 'Failed to connect to AI service'
      })
    }
    setIsLoading(false)
  }

  const clearAllConversations = async () => {
    if (confirm('Are you sure you want to clear all conversations? This cannot be undone.')) {
      try {
        await fetch('/api/chat/clear-all', { method: 'POST' })
        loadData()
      } catch (error) {
        console.error('Failed to clear conversations:', error)
      }
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'conversations', name: 'Conversations', icon: MessageSquare },
    { id: 'testing', name: 'AI Testing', icon: Bot },
    { id: 'settings', name: 'Settings', icon: Settings }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.total_conversations || 0}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Messages Today</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.recent_messages_hour || 0}</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.success_rate || 0}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.active_users || 0}</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Topics</h3>
        <div className="space-y-3">
          {metrics?.popular_topics?.map((topic, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-gray-500">{topic.topic}</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(topic.count / 100) * 100}%` }}
                  ></div>
                </div>
                <span className="text-primary-600 text-sm">{topic.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderConversations = () => (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Recent Conversations</h3>
        <div className="space-x-3">
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-blue-500/20 text-primary-600 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Refresh
          </button>
          <button 
            onClick={clearAllConversations}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Clear All
          </button>
        </div>
      </div>

      {/* Conversations Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Conversation ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conversations.map((conversation) => (
                <tr key={conversation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {conversation.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversation.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversation.message_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {conversation.last_message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      conversation.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {conversation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button className="text-primary-600 hover:text-primary-700">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderTesting = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">AI Assistant Testing</h3>
      
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Test Message
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a message to test the AI assistant..."
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={testAIAssistant}
                disabled={isLoading || !testMessage.trim()}
                className="px-6 py-2 bg-blue-500/20 text-primary-600 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {testResponse && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Response</h4>
              <div className={`p-4 rounded-lg border ${
                testResponse.success 
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {testResponse.success ? (
                  <div>
                    <p className="mb-2">{testResponse.data?.message}</p>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>Model: {testResponse.data?.model_used}</p>
                      <p>Tokens: {testResponse.data?.tokens_used}</p>
                      <p>Response Time: {testResponse.data?.response_time}s</p>
                    </div>
                  </div>
                ) : (
                  <p>{testResponse.error}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">AI Assistant Settings</h3>
      
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="space-y-6">
          <div>
            <h4 className="text-gray-900 font-medium mb-4">Model Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Default Model</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500">
                  <option value="llama3-70b-8192">Llama 3 70B (Recommended)</option>
                  <option value="llama3-8b-8192">Llama 3 8B (Faster)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Temperature</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  defaultValue="0.7"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-gray-900 font-medium mb-4">Rate Limiting</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Requests per User/Hour</label>
                <input 
                  type="number" 
                  defaultValue="20"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Global Requests/Hour</label>
                <input 
                  type="number" 
                  defaultValue="1000"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-6 py-2 bg-blue-500/20 text-primary-600 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 border border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-primary-600 border border-blue-500/30'
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
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'conversations' && renderConversations()}
        {activeTab === 'testing' && renderTesting()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  )
}

// AI System Status Component
function AISystemStatus() {
  const [systemStatus, setSystemStatus] = useState({
    groq: 'online',
    models: 'healthy',
    apiGateway: 'online',
    rateLimits: 'normal'
  })

  const statusItems = [
    {
      title: 'GROQ API',
      status: systemStatus.groq,
      description: 'Primary AI service connection',
      icon: Zap,
      details: 'llama3-70b-8192 Active'
    },
    {
      title: 'AI Models',
      status: systemStatus.models,
      description: 'Model availability and performance',
      icon: Brain,
      details: '4 models available'
    },
    {
      title: 'API Gateway',
      status: systemStatus.apiGateway,
      description: 'Request routing and load balancing',
      icon: Globe,
      details: '99.9% uptime'
    },
    {
      title: 'Rate Limits',
      status: systemStatus.rateLimits,
      description: 'API usage and throttling',
      icon: Shield,
      details: '78% of limit used'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'healthy':
      case 'normal':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'offline':
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
      case 'healthy':
      case 'normal':
        return CheckCircle
      case 'warning':
        return AlertCircle
      case 'offline':
      case 'error':
        return XCircle
      default:
        return AlertCircle
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statusItems.map((item, index) => {
        const Icon = item.icon
        const StatusIcon = getStatusIcon(item.status)
        return (
          <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </div>
              <StatusIcon className={`w-5 h-5 ${getStatusColor(item.status).split(' ')[0]}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
              <span className="text-gray-400 text-xs">{item.details}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// GROQ Integration Dashboard
function GroqDashboard() {
  const [apiMetrics, setApiMetrics] = useState({
    totalQueries: 45231,
    queriesThisHour: 1247,
    averageResponseTime: 245,
    successRate: 99.7,
    costThisMonth: 1247.50,
    modelsInUse: 3
  })

  const [activeModels, setActiveModels] = useState([
    {
      id: 'llama3-70b-8192',
      name: 'Llama 3 70B',
      status: 'active',
      usage: 78,
      responseTime: 1.2,
      requests: 1240
    },
    {
      id: 'llama3-8b-8192', 
      name: 'Llama 3 8B',
      status: 'active',
      usage: 45,
      responseTime: 0.8,
      requests: 890
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      status: 'active',
      usage: 23,
      responseTime: 1.5,
      requests: 234
    }
  ])

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Queries</p>
              <p className="text-2xl font-bold text-gray-900">{apiMetrics.totalQueries.toLocaleString()}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Hour</p>
              <p className="text-2xl font-bold text-gray-900">{apiMetrics.queriesThisHour.toLocaleString()}</p>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{apiMetrics.successRate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Active Models */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Active Models</h3>
        <div className="space-y-4">
          {activeModels.map((model) => (
            <div key={model.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div>
                  <h4 className="text-gray-900 font-medium">{model.name}</h4>
                  <p className="text-gray-400 text-sm">{model.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-400">Usage</p>
                  <p className="text-gray-900 font-medium">{model.usage}%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Response Time</p>
                  <p className="text-gray-900 font-medium">{model.responseTime}s</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Requests</p>
                  <p className="text-gray-900 font-medium">{model.requests}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// AI Configuration Component
function AIConfiguration() {
  const [config, setConfig] = useState({
    apiKey: '•••••••••••••gk_1234',
    defaultModel: 'llama3-70b-8192',
    maxTokens: 1000,
    temperature: 0.7,
    rateLimitPerUser: 20,
    rateLimitPerHour: 1000,
    enableLogging: true,
    enableAnalytics: true,
    autoFailover: false
  })

  const availableModels = [
    {
      id: 'llama3-70b-8192',
      name: 'Llama 3 70B',
      description: 'Most capable model'
    },
    {
      id: 'llama3-8b-8192',
      name: 'Llama 3 8B',
      description: 'Faster model'
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      description: 'High performance model'
    }
  ]

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveConfig = () => {
    console.log('Saving configuration:', config)
    // Here you would save to your backend
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">AI Configuration</h3>
      
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="space-y-6">
          {/* API Configuration */}
          <div className="space-y-4">
            <h4 className="text-gray-900 font-medium">API Configuration</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">GROQ API Key</label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
                />
                <button className="p-2 bg-blue-500/20 text-primary-600 rounded-lg hover:bg-blue-500/30">
                  <Key className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Default Model</label>
              <select
                value={config.defaultModel}
                onChange={(e) => handleConfigChange('defaultModel', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.temperature}
                  onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="space-y-4">
            <h4 className="text-gray-900 font-medium">Rate Limiting</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Requests per User per Hour</label>
              <input
                type="number"
                value={config.rateLimitPerUser}
                onChange={(e) => handleConfigChange('rateLimitPerUser', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Global Requests per Hour</label>
              <input
                type="number"
                value={config.rateLimitPerHour}
                onChange={(e) => handleConfigChange('rateLimitPerHour', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3">
              <h4 className="text-gray-900 font-medium">Features</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Enable Logging</span>
                <input
                  type="checkbox"
                  checked={config.enableLogging}
                  onChange={(e) => handleConfigChange('enableLogging', e.target.checked)}
                  className="rounded border-gray-300 bg-gray-100 text-blue-500 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Enable Analytics</span>
                <input
                  type="checkbox"
                  checked={config.enableAnalytics}
                  onChange={(e) => handleConfigChange('enableAnalytics', e.target.checked)}
                  className="rounded border-gray-300 bg-gray-100 text-blue-500 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Auto Failover</span>
                <input
                  type="checkbox"
                  checked={config.autoFailover}
                  onChange={(e) => handleConfigChange('autoFailover', e.target.checked)}
                  className="rounded border-gray-300 bg-gray-100 text-blue-500 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors">
            Test Connection
          </button>
          <button
            onClick={handleSaveConfig}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-gray-900 rounded-lg transition-all"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}

// Main AI Tools Admin Component
export default function AIToolsAdmin() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', name: 'GROQ Dashboard', icon: BarChart3 },
    { id: 'assistant', name: 'AI Assistant', icon: Bot },
    { id: 'config', name: 'Configuration', icon: Settings },
    { id: 'logs', name: 'Logs & Analytics', icon: Activity }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <GroqDashboard />
      case 'assistant':
        return <AIAssistantManagement />
      case 'config':
        return <AIConfiguration />
      case 'logs':
        return <div className="text-gray-900">Logs & Analytics Coming Soon</div>
      default:
        return <GroqDashboard />
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Tools Administration</h1>
            <p className="text-gray-500 mt-1">Manage GROQ integration, AI models, and assistant performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors border border-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium transition-colors border border-green-500/30">
              <Monitor className="w-4 h-4 mr-2" />
              System Health
            </button>
          </div>
        </div>

        {/* System Status */}
        <AISystemStatus />

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