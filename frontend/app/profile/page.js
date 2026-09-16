'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  User, Mail, Phone, MapPin, Camera, Save, Edit3, 
  Shield, Bell, Globe, Eye, EyeOff, Trash2, 
  Key, CreditCard, Download, Upload, RefreshCw,
  CheckCircle, AlertCircle, Settings, Lock,
  Smartphone, Monitor, Calendar, Clock, Star
} from 'lucide-react'

// Profile Layout Component
function ProfileLayout({ children }) {
  const [user, setUser] = useState({
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    role: 'Premium User',
    avatar: '/api/placeholder/100/100',
    joinDate: 'January 2024'
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 transition-colors text-sm font-medium">
                ← Back to Dashboard
              </Link>
              <div className="border-l border-gray-200 pl-4">
                <h1 className="text-lg font-bold text-gray-900">Profile Settings</h1>
                <p className="text-xs text-gray-500">Manage your account preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
}

// Profile Settings Component
export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // User data state
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: 'Solo founder building my one-person company with OPC Genie.',
    website: '',
    company: '',
    position: 'Founder'
  })

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    newLeads: true,
    weeklyDigest: false,
    promotions: true,
    securityAlerts: true
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showProgress: true,
    allowMessages: true
  })

  const tabs = [
    { id: 'general', name: 'General', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'billing', name: 'Billing', icon: CreditCard }
  ]

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    }, 1000)
  }

  const inputClass = "w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
  const cardClass = "bg-gray-50 rounded-2xl p-6 border border-gray-100"
  const cardTitleClass = "text-lg font-bold text-gray-900 mb-4"
  const labelClass = "block text-sm font-medium text-gray-700 mb-2"

  const renderGeneral = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className={cardClass}>
        <h3 className={cardTitleClass}>Profile Picture</h3>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">SC</span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div>
            <h4 className="text-gray-900 font-medium">Upload new picture</h4>
            <p className="text-gray-500 text-sm mb-3">JPG, PNG or GIF. Max size 5MB.</p>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </button>
              <button className="flex items-center px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className={cardClass}>
        <h3 className={cardTitleClass}>Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>First Name</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({...profile, firstName: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({...profile, lastName: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({...profile, location: e.target.value})}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              rows="3"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className={cardClass}>
        <h3 className={cardTitleClass}>Professional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Company</label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => setProfile({...profile, company: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Position</label>
            <input
              type="text"
              value={profile.position}
              onChange={(e) => setProfile({...profile, position: e.target.value})}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Website</label>
            <input
              type="url"
              value={profile.website}
              onChange={(e) => setProfile({...profile, website: e.target.value})}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className={cardClass}>
        <h3 className={cardTitleClass}>Email Notifications</h3>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <h4 className="text-gray-900 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                <p className="text-gray-500 text-sm">Get notified about important updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className={cardClass}>
        <h3 className={cardTitleClass}>Privacy Settings</h3>
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Profile Visibility</label>
            <select
              value={privacy.profileVisibility}
              onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})}
              className={inputClass}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="friends">Friends Only</option>
            </select>
          </div>

          {Object.entries(privacy).slice(1).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <h4 className="text-gray-900 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                <p className="text-gray-500 text-sm">Control who can see this information</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setPrivacy({...privacy, [key]: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className={cardClass}>
        <h3 className={cardTitleClass}>Password & Security</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center px-4 py-3 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors font-medium">
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </button>
          <button className="w-full flex items-center justify-center px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium">
            <Shield className="w-4 h-4 mr-2" />
            Enable Two-Factor Authentication
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className={cardTitleClass}>Active Sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center space-x-3">
              <Monitor className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-gray-900 font-medium">Current Session</p>
                <p className="text-gray-500 text-sm">Chrome on macOS • San Francisco, CA</p>
              </div>
            </div>
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs border border-green-200 font-medium">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-900 font-medium">Mobile App</p>
                <p className="text-gray-500 text-sm">iOS App • 2 days ago</p>
              </div>
            </div>
            <button className="text-red-500 hover:text-red-600 text-sm font-medium">Revoke</button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBilling = () => (
    <div className="space-y-6">
      <div className={cardClass}>
        <h3 className={cardTitleClass}>Current Plan</h3>
        <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-200">
          <div>
            <h4 className="text-gray-900 font-bold">Premium Plan</h4>
            <p className="text-primary-600 text-sm">$29/month • Renews on Feb 15, 2025</p>
          </div>
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            Manage Plan
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className={cardTitleClass}>Payment Method</h3>
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-gray-900 font-medium">•••• •••• •••• 4242</p>
              <p className="text-gray-500 text-sm">Expires 12/27</p>
            </div>
          </div>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">Update</button>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneral()
      case 'notifications': return renderNotifications()
      case 'privacy': return renderPrivacy()
      case 'security': return renderSecurity()
      case 'billing': return renderBilling()
      default: return renderGeneral()
    }
  }

  return (
    <ProfileLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    {tab.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderTabContent()}

          {/* Save Button */}
          <div className="mt-8 flex justify-end space-x-3">
            <button className="px-6 py-3 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : isSaved ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </ProfileLayout>
  )
}
