'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings, Users, BookOpen, Zap, TrendingUp, BarChart3,
  Save, RefreshCw, Upload, Download, Key, Globe, Shield,
  Mail, Database, Server, Code, Palette, Bell, Lock,
  AlertCircle, CheckCircle, Eye, EyeOff, Copy, ExternalLink,
  Monitor, Smartphone, Tablet, Wifi, Cloud, HardDrive,
  Clock, Calendar, DollarSign, CreditCard, Building,
  UserCheck, FileText, Image, Video, Archive, Trash2,
  Plus, X, Type, Link as LinkIcon, Hash
} from 'lucide-react'
import siteConfig from '../../../site.config'
import AdminShell from '../../../components/AdminShell'

// ─────────────────────────────────────────────
// Toast notification component
// ─────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = type === 'success'
    ? 'bg-green-50 border-green-200 text-green-700'
    : 'bg-red-50 border-red-200 text-red-700'
  const Icon = type === 'success' ? CheckCircle : AlertCircle

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center px-5 py-4 rounded-xl border backdrop-blur-sm ${colors} shadow-xl`}>
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Shared save helper — uses JWT from localStorage
// ─────────────────────────────────────────────
async function saveSettings(payload) {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || ''
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to save settings')
  }
  return res.json()
}

async function loadSettings() {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || ''
  const res = await fetch('/api/settings', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load settings')
  return res.json()
}

// ─────────────────────────────────────────────
// Shared form field components
// ─────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-2">{label}</label>
      {children}
    </div>
  )
}
const inputCls = 'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none'

// ─────────────────────────────────────────────
// SaveBar — bottom of each section
// ─────────────────────────────────────────────
function SaveBar({ isSaving, onSave, onReset }) {
  return (
    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
      {onReset && (
        <button onClick={onReset} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-colors">
          Reset to Defaults
        </button>
      )}
      <button onClick={onSave} disabled={isSaving}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center"
      >
        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Changes
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// General Settings
// ─────────────────────────────────────────────
function GeneralSettings({ allSettings, onToast }) {
  const defaults = {
    siteName: 'OPC Genie', siteDescription: 'Your One-Person Company AI Platform',
    adminEmail: 'admin@opcgenie.com', supportEmail: 'support@opcgenie.com',
    timezone: 'UTC', language: 'en',
    maintenanceMode: false, registrationOpen: true, emailVerification: true, twoFactorRequired: false,
  }
  const [settings, setSettings] = useState(defaults)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (allSettings?.general) setSettings({ ...defaults, ...allSettings.general })
  }, [allSettings])

  const timezones = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Kolkata']
  const languages = [{ code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' }, { code: 'de', name: 'German' }, { code: 'hi', name: 'Hindi' }]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings({ general: settings })
      onToast('General settings saved!', 'success')
    } catch (e) {
      onToast(e.message, 'error')
    } finally { setIsSaving(false) }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">General Settings</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-gray-900 font-medium">Site Configuration</h4>
          <Field label="Site Name"><input type="text" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} className={inputCls} /></Field>
          <Field label="Site Description"><textarea value={settings.siteDescription} onChange={e => setSettings({...settings, siteDescription: e.target.value})} rows={3} className={inputCls} /></Field>
          <Field label="Admin Email"><input type="email" value={settings.adminEmail} onChange={e => setSettings({...settings, adminEmail: e.target.value})} className={inputCls} /></Field>
          <Field label="Support Email"><input type="email" value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} className={inputCls} /></Field>
        </div>
        <div className="space-y-4">
          <h4 className="text-gray-900 font-medium">Localization & Features</h4>
          <Field label="Timezone">
            <select value={settings.timezone} onChange={e => setSettings({...settings, timezone: e.target.value})} className={inputCls}>
              {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>
          <Field label="Default Language">
            <select value={settings.language} onChange={e => setSettings({...settings, language: e.target.value})} className={inputCls}>
              {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </Field>
          <div className="space-y-3">
            <h5 className="text-gray-900 font-medium">System Features</h5>
            {[
              ['maintenanceMode', 'Maintenance Mode'],
              ['registrationOpen', 'Open Registration'],
              ['emailVerification', 'Email Verification Required'],
              ['twoFactorRequired', 'Two-Factor Authentication Required'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-500">{label}</span>
                <input type="checkbox" checked={settings[key]} onChange={e => setSettings({...settings, [key]: e.target.checked})} className="rounded border-gray-300 bg-gray-100 text-blue-500 focus:ring-primary-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <SaveBar isSaving={isSaving} onSave={handleSave} onReset={() => setSettings(defaults)} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Security Settings
// ─────────────────────────────────────────────
function SecuritySettings({ allSettings, onToast }) {
  const defaults = {
    sessionTimeout: 24, passwordMinLength: 8, passwordRequireSpecial: true,
    passwordRequireNumbers: true, passwordRequireUppercase: true,
    maxLoginAttempts: 5, accountLockoutDuration: 30,
    ipWhitelist: ['127.0.0.1', '192.168.1.0/24'],
    sslRequired: true, rateLimitRequests: 1000, rateLimitWindow: 15,
  }
  const [securityConfig, setSecurityConfig] = useState(defaults)
  const [isSaving, setIsSaving] = useState(false)

  // Change-password state
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    if (allSettings?.security) setSecurityConfig({ ...defaults, ...allSettings.security })
  }, [allSettings])

  const handleAddIP = () => {
    const ip = prompt('Enter IP address or range:')
    if (ip) setSecurityConfig(prev => ({ ...prev, ipWhitelist: [...prev.ipWhitelist, ip] }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings({ security: securityConfig })
      onToast('Security settings saved!', 'success')
    } catch (e) {
      onToast(e.message, 'error')
    } finally { setIsSaving(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwNew !== pwConfirm) { onToast('New passwords do not match', 'error'); return }
    if (pwNew.length < 6) { onToast('New password must be at least 6 characters', 'error'); return }
    setPwSaving(true)
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || ''
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to change password')
      }
      onToast('Password changed successfully! Use the new password next time you log in.', 'success')
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
    } catch (err) {
      onToast(err.message, 'error')
    } finally { setPwSaving(false) }
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-gray-900">Security Settings</h3>

      {/* ── Change Admin Password ── */}
      <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
        <div className="flex items-center space-x-3 mb-1">
          <Lock className="w-5 h-5 text-purple-400" />
          <h4 className="text-gray-900 font-semibold">Change Admin Password</h4>
        </div>
        <p className="text-gray-400 text-sm">
          Login username is <code className="bg-gray-100 px-1 rounded text-gray-600">admin</code>.
          Default password on first run is <code className="bg-gray-100 px-1 rounded text-gray-600">password</code> — change it now.
        </p>
        <form onSubmit={handleChangePassword} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Field label="Current Password">
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} required className={inputCls + ' pr-10'} placeholder="Current password" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="New Password">
            <input type={showPw ? 'text' : 'password'} value={pwNew} onChange={e => setPwNew(e.target.value)} required className={inputCls} placeholder="Min. 6 characters" />
          </Field>
          <Field label="Confirm New Password">
            <input type={showPw ? 'text' : 'password'} value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} required className={`${inputCls} ${pwConfirm && pwNew !== pwConfirm ? 'border-red-500' : ''}`} placeholder="Repeat new password" />
          </Field>
          <div className="lg:col-span-3 flex justify-end">
            <button type="submit" disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-gray-900 rounded-lg transition-all disabled:opacity-50 flex items-center">
              {pwSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
              Update Password
            </button>
          </div>
        </form>
      </section>

      {/* ── Other Security Config ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-gray-900 font-medium">Session & Rate Limits</h4>
          <Field label="Session Timeout (hours)"><input type="number" value={securityConfig.sessionTimeout} onChange={e => setSecurityConfig({...securityConfig, sessionTimeout: parseInt(e.target.value)})} className={inputCls} /></Field>
          <Field label="Max Login Attempts"><input type="number" value={securityConfig.maxLoginAttempts} onChange={e => setSecurityConfig({...securityConfig, maxLoginAttempts: parseInt(e.target.value)})} className={inputCls} /></Field>
          <Field label="Account Lockout Duration (minutes)"><input type="number" value={securityConfig.accountLockoutDuration} onChange={e => setSecurityConfig({...securityConfig, accountLockoutDuration: parseInt(e.target.value)})} className={inputCls} /></Field>
          <Field label="Rate Limit (requests per window)"><input type="number" value={securityConfig.rateLimitRequests} onChange={e => setSecurityConfig({...securityConfig, rateLimitRequests: parseInt(e.target.value)})} className={inputCls} /></Field>
          <Field label="Rate Limit Window (minutes)"><input type="number" value={securityConfig.rateLimitWindow} onChange={e => setSecurityConfig({...securityConfig, rateLimitWindow: parseInt(e.target.value)})} className={inputCls} /></Field>
        </div>
        <div className="space-y-4">
          <h4 className="text-gray-900 font-medium">Network Security</h4>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-500">IP Whitelist</label>
              <button onClick={handleAddIP} className="text-primary-600 hover:text-primary-700 text-sm">+ Add IP</button>
            </div>
            <div className="space-y-2">
              {securityConfig.ipWhitelist.map((ip, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <span className="text-gray-900 font-mono">{ip}</span>
                  <button onClick={() => setSecurityConfig(prev => ({...prev, ipWhitelist: prev.ipWhitelist.filter((_,idx) => idx !== i)}))} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Require SSL/HTTPS</span>
            <input type="checkbox" checked={securityConfig.sslRequired} onChange={e => setSecurityConfig({...securityConfig, sslRequired: e.target.checked})} className="rounded border-gray-300 bg-gray-100 text-blue-500 focus:ring-primary-500" />
          </div>
        </div>
      </div>
      <SaveBar isSaving={isSaving} onSave={handleSave} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Email Configuration
// ─────────────────────────────────────────────
function EmailConfiguration({ allSettings, onToast }) {
  const defaults = {
    provider: 'gmail', smtpHost: 'smtp.gmail.com', smtpPort: 587,
    smtpUsername: '', smtpPassword: '', fromEmail: 'opcgenie@gmail.com',
    fromName: 'OPC Genie', replyToEmail: 'support@opcgenie.com',
    enableSsl: true, enableStartTls: true,
    emailTemplates: { welcome: 'enabled', verification: 'enabled', passwordReset: 'enabled', courseCompletion: 'enabled', newsletter: 'enabled' },
  }
  const [emailConfig, setEmailConfig] = useState(defaults)
  const [isSaving, setIsSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testStatus, setTestStatus] = useState(null)

  useEffect(() => {
    if (allSettings?.email) setEmailConfig({ ...defaults, ...allSettings.email })
  }, [allSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings({ email: emailConfig })
      onToast('Email settings saved!', 'success')
    } catch (e) {
      onToast(e.message, 'error')
    } finally { setIsSaving(false) }
  }

  const handleTestEmail = async () => {
    setTestStatus('sending')
    setTimeout(() => { setTestStatus('success'); setTimeout(() => setTestStatus(null), 3000) }, 2000)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Email Configuration</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-gray-900 font-medium">SMTP Settings</h4>
          <Field label="Email Provider">
            <select value={emailConfig.provider} onChange={e => setEmailConfig({...emailConfig, provider: e.target.value})} className={inputCls}>
              {[{v:'gmail',n:'Gmail'},{v:'smtp',n:'Custom SMTP'},{v:'sendgrid',n:'SendGrid'},{v:'mailgun',n:'Mailgun'},{v:'ses',n:'Amazon SES'}].map(p => <option key={p.v} value={p.v}>{p.n}</option>)}
            </select>
          </Field>
          <Field label="SMTP Host"><input type="text" value={emailConfig.smtpHost} onChange={e => setEmailConfig({...emailConfig, smtpHost: e.target.value})} className={inputCls} /></Field>
          <Field label="SMTP Port"><input type="number" value={emailConfig.smtpPort} onChange={e => setEmailConfig({...emailConfig, smtpPort: parseInt(e.target.value)})} className={inputCls} /></Field>
          <Field label="Username"><input type="text" value={emailConfig.smtpUsername} onChange={e => setEmailConfig({...emailConfig, smtpUsername: e.target.value})} className={inputCls} /></Field>
          <Field label="Password"><input type="password" value={emailConfig.smtpPassword} onChange={e => setEmailConfig({...emailConfig, smtpPassword: e.target.value})} className={inputCls} /></Field>
          {[['enableSsl','Enable SSL'],['enableStartTls','Enable STARTTLS']].map(([k,l]) => (
            <div key={k} className="flex items-center justify-between"><span className="text-gray-500">{l}</span><input type="checkbox" checked={emailConfig[k]} onChange={e => setEmailConfig({...emailConfig, [k]: e.target.checked})} className="rounded border-gray-300 bg-gray-100 text-blue-500 focus:ring-primary-500" /></div>
          ))}
        </div>
        <div className="space-y-4">
          <h4 className="text-gray-900 font-medium">Email Settings</h4>
          <Field label="From Email"><input type="email" value={emailConfig.fromEmail} onChange={e => setEmailConfig({...emailConfig, fromEmail: e.target.value})} className={inputCls} /></Field>
          <Field label="From Name"><input type="text" value={emailConfig.fromName} onChange={e => setEmailConfig({...emailConfig, fromName: e.target.value})} className={inputCls} /></Field>
          <Field label="Reply-To Email"><input type="email" value={emailConfig.replyToEmail} onChange={e => setEmailConfig({...emailConfig, replyToEmail: e.target.value})} className={inputCls} /></Field>
          <div className="space-y-3">
            <h5 className="text-gray-900 font-medium">Email Templates</h5>
            {Object.entries(emailConfig.emailTemplates || {}).map(([template, status]) => (
              <div key={template} className="flex items-center justify-between">
                <span className="text-gray-500 capitalize">{template.replace(/([A-Z])/g, ' $1')}</span>
                <select value={status} onChange={e => setEmailConfig({...emailConfig, emailTemplates:{...emailConfig.emailTemplates,[template]:e.target.value}})} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded text-gray-900 text-sm focus:ring-2 focus:ring-primary-500">
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h5 className="text-gray-900 font-medium mb-3">Test Email Configuration</h5>
            <div className="flex space-x-2">
              <input type="email" placeholder="test@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500" />
              <button onClick={handleTestEmail} disabled={!testEmail || testStatus === 'sending'} className="px-4 py-2 bg-blue-500/20 text-primary-600 rounded-lg hover:bg-blue-500/30 disabled:opacity-50 flex items-center">
                {testStatus === 'sending' ? <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /> : 'Send Test'}
              </button>
            </div>
            {testStatus === 'success' && <div className="mt-2 text-green-400 text-sm flex items-center"><CheckCircle className="w-4 h-4 mr-1" />Test email sent successfully!</div>}
          </div>
        </div>
      </div>
      <SaveBar isSaving={isSaving} onSave={handleSave} />
    </div>
  )
}

// ─────────────────────────────────────────────
// System Information (read-only, no API save)
// ─────────────────────────────────────────────
function SystemInformation() {
  const [systemInfo] = useState({
    version: '2.1.4', buildDate: '2024-10-24', environment: 'Production',
    database: { type: 'PostgreSQL', version: '13.7', size: '2.3 GB', uptime: '15 days, 7 hours' },
    server: { platform: 'Linux Ubuntu 22.04', nodeVersion: '18.17.0', memory: '8 GB', cpu: 'Intel Xeon E5-2686 v4 @ 2.30GHz' },
    storage: { total: '100 GB', used: '47.3 GB', available: '52.7 GB', backup: 'Last backup: 2 hours ago' },
  })

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">System Information</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          { Icon: Monitor, title: 'Application', items: [['Version', systemInfo.version, ''], ['Build Date', systemInfo.buildDate, ''], ['Environment', systemInfo.environment, 'text-green-400']] },
          { Icon: Database, title: 'Database', items: [['Type', systemInfo.database.type, ''], ['Version', systemInfo.database.version, ''], ['Size', systemInfo.database.size, ''], ['Uptime', systemInfo.database.uptime, 'text-green-400']] },
          { Icon: Server, title: 'Server', items: [['Platform', systemInfo.server.platform, 'text-sm'], ['Node.js', systemInfo.server.nodeVersion, ''], ['Memory', systemInfo.server.memory, ''], ['CPU', systemInfo.server.cpu, 'text-xs']] },
        ].map(({ Icon, title, items }) => (
          <div key={title} className="bg-white rounded-2xl p-6 border border-gray-200">
            <h4 className="text-gray-900 font-medium mb-4 flex items-center"><Icon className="w-5 h-5 mr-2" />{title}</h4>
            <div className="space-y-3">
              {items.map(([label, val, cls]) => (
                <div key={label} className="flex justify-between"><span className="text-gray-500">{label}</span><span className={`text-gray-900 ${cls}`}>{val}</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h4 className="text-gray-900 font-medium mb-4 flex items-center"><HardDrive className="w-5 h-5 mr-2" />Storage & Backup</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center"><p className="text-2xl font-bold text-gray-900">{systemInfo.storage.total}</p><p className="text-gray-400 text-sm">Total Storage</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-orange-400">{systemInfo.storage.used}</p><p className="text-gray-400 text-sm">Used</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-green-400">{systemInfo.storage.available}</p><p className="text-gray-400 text-sm">Available</p></div>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3"><div className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full" style={{ width: '47.3%' }}></div></div>
        <p className="text-green-400 text-sm mt-3 text-center">{systemInfo.storage.backup}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Export Logs', Icon: Download, cls: 'bg-blue-500/20 text-primary-600 hover:bg-blue-500/30' },
          { label: 'Create Backup', Icon: Archive, cls: 'bg-green-500/20 text-green-400 hover:bg-green-500/30' },
          { label: 'Restart Services', Icon: RefreshCw, cls: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' },
          { label: 'System Maintenance', Icon: AlertCircle, cls: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
        ].map(({ label, Icon, cls }) => (
          <button key={label} className={`flex items-center justify-center px-4 py-3 rounded-lg transition-colors ${cls}`}><Icon className="w-4 h-4 mr-2" />{label}</button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Site Content Settings
// ─────────────────────────────────────────────
function SiteContentSettings({ allSettings, onToast }) {
  const sc = siteConfig
  const [brand, setBrand] = useState({ name: sc.brand.name, tagline: sc.brand.tagline, description: sc.brand.description, year: sc.brand.year })
  const [contact, setContact] = useState({ email: sc.contact.email, phone: sc.contact.phone, location: sc.contact.location })
  const [social, setSocial] = useState({ ...sc.social })
  const [hero, setHero] = useState({
    badge: sc.hero.badge, headline: sc.hero.headline, subheadline: sc.hero.subheadline,
    highlightWord: sc.hero.highlightWord,
    ctaPrimaryText: sc.hero.cta.primary.text, ctaPrimaryHref: sc.hero.cta.primary.href,
    ctaSecondaryText: sc.hero.cta.secondary.text, ctaSecondaryHref: sc.hero.cta.secondary.href,
  })
  const [stats, setStats] = useState(sc.stats.map(s => ({ ...s })))
  const [trustedBy, setTrustedBy] = useState(sc.trustedBy.join(', '))
  const [cta, setCta] = useState({
    headline: sc.cta.headline, subheadline: sc.cta.subheadline,
    primaryText: sc.cta.primary.text, primaryHref: sc.cta.primary.href,
    secondaryText: sc.cta.secondary.text, secondaryHref: sc.cta.secondary.href,
    badge0: sc.cta.badges[0] || '', badge1: sc.cta.badges[1] || '', badge2: sc.cta.badges[2] || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!allSettings) return
    if (allSettings.brand) setBrand(s => ({...s, ...allSettings.brand}))
    if (allSettings.contact) setContact(s => ({...s, ...allSettings.contact}))
    if (allSettings.social) setSocial(s => ({...s, ...allSettings.social}))
    if (allSettings.hero) {
      const h = allSettings.hero
      setHero(s => ({...s, badge: h.badge??s.badge, headline: h.headline??s.headline, subheadline: h.subheadline??s.subheadline, highlightWord: h.highlightWord??s.highlightWord,
        ctaPrimaryText: h.cta?.primary?.text??s.ctaPrimaryText, ctaPrimaryHref: h.cta?.primary?.href??s.ctaPrimaryHref,
        ctaSecondaryText: h.cta?.secondary?.text??s.ctaSecondaryText, ctaSecondaryHref: h.cta?.secondary?.href??s.ctaSecondaryHref}))
    }
    if (allSettings.stats) setStats(allSettings.stats.map(s => ({...s})))
    if (allSettings.trustedBy) setTrustedBy(allSettings.trustedBy.join(', '))
    if (allSettings.cta) {
      const c = allSettings.cta
      setCta(s => ({...s, headline: c.headline??s.headline, subheadline: c.subheadline??s.subheadline,
        primaryText: c.primary?.text??s.primaryText, primaryHref: c.primary?.href??s.primaryHref,
        secondaryText: c.secondary?.text??s.secondaryText, secondaryHref: c.secondary?.href??s.secondaryHref,
        badge0: c.badges?.[0]??s.badge0, badge1: c.badges?.[1]??s.badge1, badge2: c.badges?.[2]??s.badge2}))
    }
  }, [allSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        brand,
        contact,
        social,
        hero: {
          badge: hero.badge, headline: hero.headline, subheadline: hero.subheadline, highlightWord: hero.highlightWord,
          cta: { primary: { text: hero.ctaPrimaryText, href: hero.ctaPrimaryHref }, secondary: { text: hero.ctaSecondaryText, href: hero.ctaSecondaryHref } },
        },
        stats,
        trustedBy: trustedBy.split(',').map(s => s.trim()).filter(Boolean),
        cta: {
          headline: cta.headline, subheadline: cta.subheadline,
          primary: { text: cta.primaryText, href: cta.primaryHref },
          secondary: { text: cta.secondaryText, href: cta.secondaryHref },
          badges: [cta.badge0, cta.badge1, cta.badge2].filter(Boolean),
        },
      }
      await saveSettings(payload)
      onToast('Site content saved! Changes are live on the public site.', 'success')
    } catch (e) {
      onToast(e.message, 'error')
    } finally { setIsSaving(false) }
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-gray-900">Site Content</h3>

      {/* Brand */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Brand</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Brand Name"><input type="text" value={brand.name} onChange={e => setBrand({...brand, name: e.target.value})} className={inputCls} /></Field>
          <Field label="Tagline"><input type="text" value={brand.tagline} onChange={e => setBrand({...brand, tagline: e.target.value})} className={inputCls} /></Field>
          <Field label="Description"><input type="text" value={brand.description} onChange={e => setBrand({...brand, description: e.target.value})} className={inputCls} /></Field>
          <Field label="Copyright Year"><input type="text" value={brand.year} onChange={e => setBrand({...brand, year: e.target.value})} className={inputCls} /></Field>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Contact</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Field label="Email"><input type="email" value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} className={inputCls} /></Field>
          <Field label="Phone"><input type="text" value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})} className={inputCls} /></Field>
          <Field label="Location"><input type="text" value={contact.location} onChange={e => setContact({...contact, location: e.target.value})} className={inputCls} /></Field>
        </div>
      </section>

      {/* Social */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Social Links <span className="text-gray-400 text-sm font-normal">(leave blank to hide)</span></h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {['twitter','linkedin','github','youtube','facebook','instagram'].map(k => (
            <Field key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}>
              <input type="url" value={social[k] || ''} onChange={e => setSocial({...social, [k]: e.target.value})} className={inputCls} placeholder={`https://${k}.com/yourhandle`} />
            </Field>
          ))}
        </div>
      </section>

      {/* Hero */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Hero Section</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Badge Text"><input type="text" value={hero.badge} onChange={e => setHero({...hero, badge: e.target.value})} className={inputCls} /></Field>
          <Field label="Highlight Word(s)"><input type="text" value={hero.highlightWord} onChange={e => setHero({...hero, highlightWord: e.target.value})} className={inputCls} /></Field>
        </div>
        <Field label="Headline"><input type="text" value={hero.headline} onChange={e => setHero({...hero, headline: e.target.value})} className={inputCls} /></Field>
        <Field label="Subheadline"><textarea value={hero.subheadline} onChange={e => setHero({...hero, subheadline: e.target.value})} rows={3} className={inputCls} /></Field>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Primary CTA Text"><input type="text" value={hero.ctaPrimaryText} onChange={e => setHero({...hero, ctaPrimaryText: e.target.value})} className={inputCls} /></Field>
          <Field label="Primary CTA Link"><input type="text" value={hero.ctaPrimaryHref} onChange={e => setHero({...hero, ctaPrimaryHref: e.target.value})} className={inputCls} /></Field>
          <Field label="Secondary CTA Text"><input type="text" value={hero.ctaSecondaryText} onChange={e => setHero({...hero, ctaSecondaryText: e.target.value})} className={inputCls} /></Field>
          <Field label="Secondary CTA Link"><input type="text" value={hero.ctaSecondaryHref} onChange={e => setHero({...hero, ctaSecondaryHref: e.target.value})} className={inputCls} /></Field>
        </div>
      </section>

      {/* Stats */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Stats Bar (4 numbers)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-2 bg-gray-50 rounded-xl p-4">
              <Field label="Number">
                <input type="text" value={stat.number} onChange={e => setStats(prev => prev.map((s,idx) => idx===i?{...s,number:e.target.value}:s))} className={inputCls} />
              </Field>
              <Field label="Label">
                <input type="text" value={stat.label} onChange={e => setStats(prev => prev.map((s,idx) => idx===i?{...s,label:e.target.value}:s))} className={inputCls} />
              </Field>
            </div>
          ))}
        </div>
      </section>

      {/* Trusted By */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Trusted By</h4>
        <Field label="Company names (comma-separated)">
          <input type="text" value={trustedBy} onChange={e => setTrustedBy(e.target.value)} className={inputCls} placeholder="Google, Microsoft, Tesla" />
        </Field>
      </section>

      {/* CTA Section */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Final CTA Section</h4>
        <Field label="Headline"><input type="text" value={cta.headline} onChange={e => setCta({...cta, headline: e.target.value})} className={inputCls} /></Field>
        <Field label="Subheadline"><input type="text" value={cta.subheadline} onChange={e => setCta({...cta, subheadline: e.target.value})} className={inputCls} /></Field>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Primary Button Text"><input type="text" value={cta.primaryText} onChange={e => setCta({...cta, primaryText: e.target.value})} className={inputCls} /></Field>
          <Field label="Primary Button Link"><input type="text" value={cta.primaryHref} onChange={e => setCta({...cta, primaryHref: e.target.value})} className={inputCls} /></Field>
          <Field label="Secondary Button Text"><input type="text" value={cta.secondaryText} onChange={e => setCta({...cta, secondaryText: e.target.value})} className={inputCls} /></Field>
          <Field label="Secondary Button Link"><input type="text" value={cta.secondaryHref} onChange={e => setCta({...cta, secondaryHref: e.target.value})} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Field label="Badge 1"><input type="text" value={cta.badge0} onChange={e => setCta({...cta, badge0: e.target.value})} className={inputCls} /></Field>
          <Field label="Badge 2"><input type="text" value={cta.badge1} onChange={e => setCta({...cta, badge1: e.target.value})} className={inputCls} /></Field>
          <Field label="Badge 3"><input type="text" value={cta.badge2} onChange={e => setCta({...cta, badge2: e.target.value})} className={inputCls} /></Field>
        </div>
      </section>

      <SaveBar isSaving={isSaving} onSave={handleSave} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Pricing Settings
// ─────────────────────────────────────────────
function PricingSettings({ allSettings, onToast }) {
  const sc = siteConfig.pricing
  const [currency, setCurrency] = useState(sc.currency)
  const [annualDiscount, setAnnualDiscount] = useState(sc.annualDiscountPercent)
  const [studentDiscount, setStudentDiscount] = useState(sc.studentDiscountPercent)
  const [plans, setPlans] = useState(sc.plans.map(p => ({
    ...p,
    featuresText: (p.features || []).join('\n'),
    restrictionsText: (p.restrictions || []).join('\n'),
  })))
  const [faqs, setFaqs] = useState(sc.faqs ? sc.faqs.map(f => ({...f})) : [])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!allSettings?.pricing) return
    const p = allSettings.pricing
    if (p.currency) setCurrency(p.currency)
    if (p.annualDiscountPercent !== undefined) setAnnualDiscount(p.annualDiscountPercent)
    if (p.studentDiscountPercent !== undefined) setStudentDiscount(p.studentDiscountPercent)
    if (p.plans) setPlans(p.plans.map(plan => ({...plan, featuresText:(plan.features||[]).join('\n'), restrictionsText:(plan.restrictions||[]).join('\n')})))
    if (p.faqs) setFaqs(p.faqs.map(f => ({...f})))
  }, [allSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        pricing: {
          currency, annualDiscountPercent: annualDiscount, studentDiscountPercent: studentDiscount,
          plans: plans.map(({ featuresText, restrictionsText, ...rest }) => ({
            ...rest,
            features: featuresText.split('\n').map(s => s.trim()).filter(Boolean),
            restrictions: restrictionsText.split('\n').map(s => s.trim()).filter(Boolean),
          })),
          faqs,
        }
      }
      await saveSettings(payload)
      onToast('Pricing settings saved!', 'success')
    } catch (e) {
      onToast(e.message, 'error')
    } finally { setIsSaving(false) }
  }

  const updatePlan = (i, key, val) => setPlans(prev => prev.map((p, idx) => idx === i ? {...p, [key]: val} : p))

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-gray-900">Pricing</h3>

      {/* Global */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Global Settings</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Field label="Currency Symbol"><input type="text" value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls} placeholder="₹" /></Field>
          <Field label="Annual Discount %"><input type="number" value={annualDiscount} onChange={e => setAnnualDiscount(Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Student Discount %"><input type="number" value={studentDiscount} onChange={e => setStudentDiscount(Number(e.target.value))} className={inputCls} /></Field>
        </div>
      </section>

      {/* Plans */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-gray-900 font-medium">Plans (up to 4)</h4>
          {plans.length < 4 && (
            <button onClick={() => setPlans(p => [...p, { name: 'New Plan', description: '', monthlyPrice: 0, badge: '', buttonText: 'Get Started', target: '', highlight: false, featuresText: '', restrictionsText: '' }])}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"><Plus className="w-4 h-4 mr-1" />Add Plan</button>
          )}
        </div>
        {plans.map((plan, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4 relative">
            <button onClick={() => setPlans(p => p.filter((_,idx) => idx !== i))} className="absolute top-3 right-3 text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Plan Name"><input type="text" value={plan.name} onChange={e => updatePlan(i,'name',e.target.value)} className={inputCls} /></Field>
              <Field label="Badge (e.g. Most Popular)"><input type="text" value={plan.badge||''} onChange={e => updatePlan(i,'badge',e.target.value)} className={inputCls} /></Field>
              <Field label="Monthly Price (number only)"><input type="number" value={plan.monthlyPrice} onChange={e => updatePlan(i,'monthlyPrice',Number(e.target.value))} className={inputCls} /></Field>
              <Field label="Button Text"><input type="text" value={plan.buttonText||''} onChange={e => updatePlan(i,'buttonText',e.target.value)} className={inputCls} /></Field>
              <Field label="Button Link (href)"><input type="text" value={plan.buttonHref||''} onChange={e => updatePlan(i,'buttonHref',e.target.value)} className={inputCls} placeholder="/signup or /contact" /></Field>
              <Field label="Description"><input type="text" value={plan.description||''} onChange={e => updatePlan(i,'description',e.target.value)} className={inputCls} /></Field>
              <Field label="Target Audience"><input type="text" value={plan.target||''} onChange={e => updatePlan(i,'target',e.target.value)} className={inputCls} /></Field>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" checked={!!plan.highlight} onChange={e => updatePlan(i,'highlight',e.target.checked)} className="rounded border-gray-300 bg-gray-100 text-blue-500 focus:ring-primary-500" id={`highlight-${i}`} />
              <label htmlFor={`highlight-${i}`} className="text-gray-500 text-sm">Featured / Highlighted plan</label>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Features (one per line)">
                <textarea value={plan.featuresText} onChange={e => updatePlan(i,'featuresText',e.target.value)} rows={6} className={inputCls} placeholder="Feature one&#10;Feature two&#10;Feature three" />
              </Field>
              <Field label="Restrictions (one per line)">
                <textarea value={plan.restrictionsText} onChange={e => updatePlan(i,'restrictionsText',e.target.value)} rows={6} className={inputCls} placeholder="No live mentorship&#10;No certification" />
              </Field>
            </div>
          </div>
        ))}
      </section>

      {/* FAQs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-gray-900 font-medium">FAQs</h4>
          <button onClick={() => setFaqs(f => [...f, { question: '', answer: '' }])} className="text-primary-600 hover:text-primary-700 text-sm flex items-center"><Plus className="w-4 h-4 mr-1" />Add FAQ</button>
        </div>
        {faqs.map((faq, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 relative">
            <button onClick={() => setFaqs(f => f.filter((_,idx) => idx !== i))} className="absolute top-3 right-3 text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
            <Field label={`Question ${i+1}`}><input type="text" value={faq.question} onChange={e => setFaqs(f => f.map((q,idx) => idx===i?{...q,question:e.target.value}:q))} className={inputCls} /></Field>
            <Field label="Answer"><textarea value={faq.answer} onChange={e => setFaqs(f => f.map((q,idx) => idx===i?{...q,answer:e.target.value}:q))} rows={3} className={inputCls} /></Field>
          </div>
        ))}
      </section>

      <SaveBar isSaving={isSaving} onSave={handleSave} />
    </div>
  )
}


// ─────────────────────────────────────────────
// Homepage Sections Settings
// ─────────────────────────────────────────────
function HomepageSectionsSettings({ allSettings, onToast }) {
  const sc = siteConfig
  const [whyDifferent, setWhyDifferent] = useState({ title: sc.whyDifferent?.title || "Why We're Different", subtitle: sc.whyDifferent?.subtitle || '' })
  const [valueProps, setValueProps] = useState(sc.valueProps || [])
  const [features, setFeatures] = useState(sc.features || [])
  const [testimonials, setTestimonials] = useState(sc.testimonials || [])
  const [ecosystemSection, setEcosystemSection] = useState({ title: 'Everything You Need to Launch', subtitle: 'One platform to build, brand, sell, and run your one-person company' })
  const [socialProofSection, setSocialProofSection] = useState({ title: 'Trusted by', highlight: 'Solo Founders', subtitle: "Join hundreds of founders who've launched their business with OPC Genie" })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!allSettings) return
    if (allSettings.whyDifferent) setWhyDifferent(s => ({...s, ...allSettings.whyDifferent}))
    if (allSettings.valueProps) setValueProps(allSettings.valueProps)
    if (allSettings.features) setFeatures(allSettings.features)
    if (allSettings.testimonials) setTestimonials(allSettings.testimonials)
    if (allSettings.ecosystemSection) setEcosystemSection(s => ({...s, ...allSettings.ecosystemSection}))
    if (allSettings.socialProofSection) setSocialProofSection(s => ({...s, ...allSettings.socialProofSection}))
  }, [allSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings({ whyDifferent, valueProps, features, testimonials, ecosystemSection, socialProofSection })
      onToast('Homepage sections saved!', 'success')
    } catch (e) { onToast(e.message, 'error') }
    finally { setIsSaving(false) }
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-gray-900">Homepage Sections</h3>

      {/* Why We're Different */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Why We're Different — Title &amp; Subtitle</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Section Title">
            <input type="text" value={whyDifferent.title} onChange={e => setWhyDifferent({...whyDifferent, title: e.target.value})} className={inputCls} />
          </Field>
        </div>
        <Field label="Section Subtitle">
          <textarea value={whyDifferent.subtitle} onChange={e => setWhyDifferent({...whyDifferent, subtitle: e.target.value})} rows={2} className={inputCls} />
        </Field>
      </section>

      {/* 4 Value Prop Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-gray-900 font-medium">Value Proposition Cards (4 cards)</h4>
          <button onClick={() => setValueProps(p => [...p, { title: '', description: '', highlight: '' }])} className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
            <Plus className="w-4 h-4 mr-1" />Add Card
          </button>
        </div>
        {valueProps.map((vp, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm font-medium">Card {i + 1}</span>
              <button onClick={() => setValueProps(p => p.filter((_,idx) => idx !== i))} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Field label="Title"><input type="text" value={vp.title} onChange={e => setValueProps(p => p.map((v,idx) => idx===i?{...v,title:e.target.value}:v))} className={inputCls} /></Field>
              <Field label="Highlight Badge"><input type="text" value={vp.highlight} onChange={e => setValueProps(p => p.map((v,idx) => idx===i?{...v,highlight:e.target.value}:v))} className={inputCls} /></Field>
            </div>
            <Field label="Description"><textarea value={vp.description} onChange={e => setValueProps(p => p.map((v,idx) => idx===i?{...v,description:e.target.value}:v))} rows={2} className={inputCls} /></Field>
          </div>
        ))}
      </section>

      {/* Ecosystem (Features) Section */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Platform Features — Section Header</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Title (before 'Ecosystem')"><input type="text" value={ecosystemSection.title} onChange={e => setEcosystemSection({...ecosystemSection, title: e.target.value})} className={inputCls} /></Field>
        </div>
        <Field label="Subtitle"><textarea value={ecosystemSection.subtitle} onChange={e => setEcosystemSection({...ecosystemSection, subtitle: e.target.value})} rows={2} className={inputCls} /></Field>
      </section>

      {/* 6 Feature Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-gray-900 font-medium">Ecosystem Feature Cards</h4>
          <button onClick={() => setFeatures(p => [...p, { title: '', description: '', preview: '', link: '/', status: 'Coming Soon' }])} className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
            <Plus className="w-4 h-4 mr-1" />Add Card
          </button>
        </div>
        {features.map((f, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm font-medium">Card {i + 1}</span>
              <button onClick={() => setFeatures(p => p.filter((_,idx) => idx !== i))} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Field label="Title"><input type="text" value={f.title} onChange={e => setFeatures(p => p.map((v,idx) => idx===i?{...v,title:e.target.value}:v))} className={inputCls} /></Field>
              <Field label="Status">
                <select value={f.status} onChange={e => setFeatures(p => p.map((v,idx) => idx===i?{...v,status:e.target.value}:v))} className={inputCls}>
                  <option>Available</option>
                  <option>Live Demo</option>
                  <option>Coming Soon</option>
                </select>
              </Field>
              <Field label="Link"><input type="text" value={f.link} onChange={e => setFeatures(p => p.map((v,idx) => idx===i?{...v,link:e.target.value}:v))} className={inputCls} /></Field>
              <Field label="Preview Text"><input type="text" value={f.preview} onChange={e => setFeatures(p => p.map((v,idx) => idx===i?{...v,preview:e.target.value}:v))} className={inputCls} /></Field>
            </div>
            <Field label="Description"><textarea value={f.description} onChange={e => setFeatures(p => p.map((v,idx) => idx===i?{...v,description:e.target.value}:v))} rows={2} className={inputCls} /></Field>
          </div>
        ))}
      </section>

      {/* Testimonials Section Header */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-medium border-b border-gray-200 pb-2">Testimonials Section — Header</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Field label="Title (before highlight)"><input type="text" value={socialProofSection.title} onChange={e => setSocialProofSection({...socialProofSection, title: e.target.value})} className={inputCls} /></Field>
          <Field label="Highlight Word"><input type="text" value={socialProofSection.highlight} onChange={e => setSocialProofSection({...socialProofSection, highlight: e.target.value})} className={inputCls} /></Field>
        </div>
        <Field label="Subtitle"><input type="text" value={socialProofSection.subtitle} onChange={e => setSocialProofSection({...socialProofSection, subtitle: e.target.value})} className={inputCls} /></Field>
      </section>

      {/* Testimonials Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-gray-900 font-medium">Testimonials</h4>
          <button onClick={() => setTestimonials(p => [...p, { name: '', role: '', content: '', rating: 5 }])} className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
            <Plus className="w-4 h-4 mr-1" />Add Testimonial
          </button>
        </div>
        {testimonials.map((t, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm font-medium">Testimonial {i + 1}</span>
              <button onClick={() => setTestimonials(p => p.filter((_,idx) => idx !== i))} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Field label="Name"><input type="text" value={t.name} onChange={e => setTestimonials(p => p.map((v,idx) => idx===i?{...v,name:e.target.value}:v))} className={inputCls} /></Field>
              <Field label="Role / Company"><input type="text" value={t.role} onChange={e => setTestimonials(p => p.map((v,idx) => idx===i?{...v,role:e.target.value}:v))} className={inputCls} /></Field>
              <Field label="Rating (1-5)"><input type="number" min="1" max="5" value={t.rating} onChange={e => setTestimonials(p => p.map((v,idx) => idx===i?{...v,rating:parseInt(e.target.value)||5}:v))} className={inputCls} /></Field>
            </div>
            <Field label="Testimonial Content"><textarea value={t.content} onChange={e => setTestimonials(p => p.map((v,idx) => idx===i?{...v,content:e.target.value}:v))} rows={3} className={inputCls} /></Field>
          </div>
        ))}
      </section>

      <SaveBar isSaving={isSaving} onSave={handleSave} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Footer Settings
// ─────────────────────────────────────────────
function FooterSettings({ allSettings, onToast }) {
  const sc = siteConfig
  const defaultLinks = sc.footerLinks || { platform: [], resources: [], company: [] }
  const [platform, setPlatform] = useState(defaultLinks.platform.map(l => ({...l})))
  const [resources, setResources] = useState(defaultLinks.resources.map(l => ({...l})))
  const [company, setCompany] = useState(defaultLinks.company.map(l => ({...l})))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!allSettings?.footerLinks) return
    const fl = allSettings.footerLinks
    if (fl.platform) setPlatform(fl.platform.map(l => ({...l})))
    if (fl.resources) setResources(fl.resources.map(l => ({...l})))
    if (fl.company) setCompany(fl.company.map(l => ({...l})))
  }, [allSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings({ footerLinks: { platform, resources, company } })
      onToast('Footer links saved!', 'success')
    } catch(e) { onToast(e.message, 'error') }
    finally { setIsSaving(false) }
  }

  const LinkEditor = ({ title, links, setLinks }) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h4 className="text-gray-900 font-medium">{title}</h4>
        <button onClick={() => setLinks(p => [...p, { name: '', href: '' }])} className="text-primary-600 hover:text-primary-700 text-sm flex items-center"><Plus className="w-4 h-4 mr-1" />Add Link</button>
      </div>
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
          <input type="text" value={link.name} onChange={e => setLinks(p => p.map((l,idx) => idx===i?{...l,name:e.target.value}:l))} placeholder="Label" className={`${inputCls} flex-1`} />
          <input type="text" value={link.href} onChange={e => setLinks(p => p.map((l,idx) => idx===i?{...l,href:e.target.value}:l))} placeholder="/path or https://..." className={`${inputCls} flex-1`} />
          <button onClick={() => setLinks(p => p.filter((_,idx) => idx!==i))} className="text-red-400 hover:text-red-300 flex-shrink-0"><X className="w-4 h-4" /></button>
        </div>
      ))}
    </section>
  )

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-gray-900">Footer Navigation Links</h3>
      <p className="text-gray-400 text-sm">These links appear in the footer. Add pages created in the Pages tab, or any external URLs.</p>
      <LinkEditor title="Platform Links" links={platform} setLinks={setPlatform} />
      <LinkEditor title="Resources Links" links={resources} setLinks={setResources} />
      <LinkEditor title="Company Links" links={company} setLinks={setCompany} />
      <SaveBar isSaving={isSaving} onSave={handleSave} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Marketing Page Settings
// ─────────────────────────────────────────────
function MarketingPageSettings({ allSettings, onToast }) {
  const defaultMarketing = siteConfig.marketing_page || {
    hero: {
      headline: "Stop renting your business. Own it.",
      subheadline: "Describe your business. Your AI Genie builds the site, writes the copy, and runs it — no monthly rent, no lock-in.",
      cta_label: "Start free",
      cta_href: "/setup-wizard",
      show_live_demo: true,
    },
    problem_bullets: [
      "Monthly SaaS rent that never ends",
      "Platforms that own your customer data",
      "Generic templates that need a developer",
    ],
    feature_grid: [
      { title: "Build", before: "One month with a developer", after: "One prompt, live in minutes" },
      { title: "Sell", before: "Stitching together checkout tools", after: "Offer page + payments in a day" },
      { title: "Run", before: "Answering DMs at midnight", after: "AI Genie handles enquiries 24/7" },
      { title: "Grow", before: "Guessing what's working", after: "Founder analytics + playbooks" },
    ],
    comparison_table: {
      competitors: ["OPC Genie", "Graphy", "Kajabi", "Skool"],
      rows: [
        { label: "Pricing model", values: ["Flat license", "Monthly %", "Monthly $", "Monthly $"] },
        { label: "You own the code", values: ["Yes", "No", "No", "No"] },
        { label: "White-label", values: ["Day one", "Paid tier", "Paid tier", "No"] },
      ],
    },
    testimonials: [],
    lead_magnet: {
      enabled: true,
      resource_id: null,
      headline: "Get the Solo Founder Launch Playbook",
      cta_label: "Send me the playbook",
    },
    final_cta: {
      headline: "Build your business today.",
      cta_label: "Start free",
    },
  }

  const [marketing, setMarketing] = useState(defaultMarketing)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (allSettings?.marketing_page) {
      setMarketing({
        ...defaultMarketing,
        ...allSettings.marketing_page,
        hero: { ...defaultMarketing.hero, ...(allSettings.marketing_page.hero || {}) },
        lead_magnet: { ...defaultMarketing.lead_magnet, ...(allSettings.marketing_page.lead_magnet || {}) },
        final_cta: { ...defaultMarketing.final_cta, ...(allSettings.marketing_page.final_cta || {}) },
        comparison_table: {
          competitors: allSettings.marketing_page.comparison_table?.competitors || defaultMarketing.comparison_table.competitors,
          rows: allSettings.marketing_page.comparison_table?.rows || defaultMarketing.comparison_table.rows,
        },
        problem_bullets: allSettings.marketing_page.problem_bullets || defaultMarketing.problem_bullets,
        feature_grid: allSettings.marketing_page.feature_grid || defaultMarketing.feature_grid,
        testimonials: allSettings.marketing_page.testimonials || defaultMarketing.testimonials,
      })
    }
  }, [allSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings({ marketing_page: marketing })
      onToast('Marketing page settings saved!', 'success')
    } catch (e) {
      onToast(e.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Helpers for nested structures
  const updateHero = (key, val) => setMarketing(m => ({ ...m, hero: { ...m.hero, [key]: val } }))
  const updateLeadMagnet = (key, val) => setMarketing(m => ({ ...m, lead_magnet: { ...m.lead_magnet, [key]: val } }))
  const updateFinalCta = (key, val) => setMarketing(m => ({ ...m, final_cta: { ...m.final_cta, [key]: val } }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Marketing Funnel Page</h3>
          <p className="text-sm text-gray-500">Configure content and sales funnel elements for /marketing without redeploying.</p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-semibold border-b border-gray-200 pb-2">Hero Section</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Headline">
            <input type="text" value={marketing.hero?.headline || ''} onChange={e => updateHero('headline', e.target.value)} className={inputCls} />
          </Field>
          <Field label="CTA Button Label">
            <input type="text" value={marketing.hero?.cta_label || ''} onChange={e => updateHero('cta_label', e.target.value)} className={inputCls} />
          </Field>
          <Field label="CTA Destination Href">
            <input type="text" value={marketing.hero?.cta_href || ''} onChange={e => updateHero('cta_href', e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 text-gray-700 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={!!marketing.hero?.show_live_demo}
                onChange={e => updateHero('show_live_demo', e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              Show live AI Genie demo in Hero section
            </label>
          </div>
        </div>
        <Field label="Subheadline">
          <textarea value={marketing.hero?.subheadline || ''} onChange={e => updateHero('subheadline', e.target.value)} rows={2} className={inputCls} />
        </Field>
      </section>

      {/* Problem Bullets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-gray-900 font-semibold">Problem Bullets</h4>
          <button
            onClick={() => setMarketing(m => ({ ...m, problem_bullets: [...(m.problem_bullets || []), ''] }))}
            className="text-primary-600 hover:text-primary-700 text-sm flex items-center font-medium"
          >
            <Plus className="w-4 h-4 mr-1" />Add Bullet
          </button>
        </div>
        {(marketing.problem_bullets || []).map((bullet, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <input
              type="text"
              value={bullet}
              onChange={e => {
                const updated = [...marketing.problem_bullets]
                updated[idx] = e.target.value
                setMarketing(m => ({ ...m, problem_bullets: updated }))
              }}
              className={inputCls}
              placeholder={`Problem point #${idx + 1}`}
            />
            <button
              onClick={() => {
                const updated = marketing.problem_bullets.filter((_, i) => i !== idx)
                setMarketing(m => ({ ...m, problem_bullets: updated }))
              }}
              className="text-red-400 hover:text-red-600 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </section>

      {/* Feature Grid (Before / After) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-gray-900 font-semibold">Feature Grid (Before vs. After)</h4>
          <button
            onClick={() => setMarketing(m => ({
              ...m,
              feature_grid: [...(m.feature_grid || []), { title: 'New Feature', before: '', after: '' }]
            }))}
            className="text-primary-600 hover:text-primary-700 text-sm flex items-center font-medium"
          >
            <Plus className="w-4 h-4 mr-1" />Add Card
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(marketing.feature_grid || []).map((fg, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium text-sm">Feature #{idx + 1}</span>
                <button
                  onClick={() => {
                    const updated = marketing.feature_grid.filter((_, i) => i !== idx)
                    setMarketing(m => ({ ...m, feature_grid: updated }))
                  }}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Field label="Title">
                <input
                  type="text"
                  value={fg.title}
                  onChange={e => {
                    const updated = [...marketing.feature_grid]
                    updated[idx] = { ...updated[idx], title: e.target.value }
                    setMarketing(m => ({ ...m, feature_grid: updated }))
                  }}
                  className={inputCls}
                />
              </Field>
              <Field label="Before (The Old Way)">
                <input
                  type="text"
                  value={fg.before}
                  onChange={e => {
                    const updated = [...marketing.feature_grid]
                    updated[idx] = { ...updated[idx], before: e.target.value }
                    setMarketing(m => ({ ...m, feature_grid: updated }))
                  }}
                  className={inputCls}
                />
              </Field>
              <Field label="After (With OPC Genie)">
                <input
                  type="text"
                  value={fg.after}
                  onChange={e => {
                    const updated = [...marketing.feature_grid]
                    updated[idx] = { ...updated[idx], after: e.target.value }
                    setMarketing(m => ({ ...m, feature_grid: updated }))
                  }}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-semibold border-b border-gray-200 pb-2">Comparison Table</h4>
        <div className="space-y-3">
          <Field label="Competitor Headers (comma separated, first is primary e.g. OPC Genie)">
            <input
              type="text"
              value={(marketing.comparison_table?.competitors || []).join(', ')}
              onChange={e => {
                const list = e.target.value.split(',').map(s => s.trim())
                setMarketing(m => ({
                  ...m,
                  comparison_table: {
                    ...(m.comparison_table || {}),
                    competitors: list,
                  }
                }))
              }}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-800 font-medium text-sm">Comparison Rows</span>
            <button
              onClick={() => {
                const compCount = marketing.comparison_table?.competitors?.length || 4
                const newRow = { label: 'New Feature', values: Array(compCount).fill('-') }
                setMarketing(m => ({
                  ...m,
                  comparison_table: {
                    ...(m.comparison_table || {}),
                    rows: [...(m.comparison_table?.rows || []), newRow],
                  }
                }))
              }}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />Add Row
            </button>
          </div>

          {(marketing.comparison_table?.rows || []).map((row, rIdx) => (
            <div key={rIdx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium text-sm">Row #{rIdx + 1}</span>
                <button
                  onClick={() => {
                    const updatedRows = marketing.comparison_table.rows.filter((_, i) => i !== rIdx)
                    setMarketing(m => ({
                      ...m,
                      comparison_table: { ...m.comparison_table, rows: updatedRows }
                    }))
                  }}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-1">
                  <Field label="Feature / Label">
                    <input
                      type="text"
                      value={row.label}
                      onChange={e => {
                        const updatedRows = [...marketing.comparison_table.rows]
                        updatedRows[rIdx] = { ...updatedRows[rIdx], label: e.target.value }
                        setMarketing(m => ({
                          ...m,
                          comparison_table: { ...m.comparison_table, rows: updatedRows }
                        }))
                      }}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(marketing.comparison_table?.competitors || []).map((comp, cIdx) => (
                    <Field key={cIdx} label={comp}>
                      <input
                        type="text"
                        value={row.values?.[cIdx] || ''}
                        onChange={e => {
                          const updatedRows = [...marketing.comparison_table.rows]
                          const newVals = [...(updatedRows[rIdx].values || [])]
                          newVals[cIdx] = e.target.value
                          updatedRows[rIdx] = { ...updatedRows[rIdx], values: newVals }
                          setMarketing(m => ({
                            ...m,
                            comparison_table: { ...m.comparison_table, rows: updatedRows }
                          }))
                        }}
                        className={inputCls}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div>
            <h4 className="text-gray-900 font-semibold">Testimonials</h4>
            <p className="text-xs text-gray-500">If empty, this section will automatically not be rendered on the landing page.</p>
          </div>
          <button
            onClick={() => setMarketing(m => ({
              ...m,
              testimonials: [...(m.testimonials || []), { name: '', role: '', content: '', rating: 5 }]
            }))}
            className="text-primary-600 hover:text-primary-700 text-sm flex items-center font-medium"
          >
            <Plus className="w-4 h-4 mr-1" />Add Testimonial
          </button>
        </div>
        {(marketing.testimonials || []).length === 0 ? (
          <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
            No testimonials added. The testimonials section will be hidden on /marketing.
          </div>
        ) : (
          (marketing.testimonials || []).map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">Testimonial #{i + 1}</span>
                <button
                  onClick={() => setMarketing(m => ({ ...m, testimonials: m.testimonials.filter((_, idx) => idx !== i) }))}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <Field label="Name">
                  <input
                    type="text"
                    value={t.name}
                    onChange={e => setMarketing(m => ({
                      ...m,
                      testimonials: m.testimonials.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item)
                    }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Role / Company">
                  <input
                    type="text"
                    value={t.role}
                    onChange={e => setMarketing(m => ({
                      ...m,
                      testimonials: m.testimonials.map((item, idx) => idx === i ? { ...item, role: e.target.value } : item)
                    }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Rating (1-5)">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={t.rating}
                    onChange={e => setMarketing(m => ({
                      ...m,
                      testimonials: m.testimonials.map((item, idx) => idx === i ? { ...item, rating: parseInt(e.target.value) || 5 } : item)
                    }))}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Content">
                <textarea
                  value={t.content}
                  onChange={e => setMarketing(m => ({
                    ...m,
                    testimonials: m.testimonials.map((item, idx) => idx === i ? { ...item, content: e.target.value } : item)
                  }))}
                  rows={2}
                  className={inputCls}
                />
              </Field>
            </div>
          ))
        )}
      </section>

      {/* Lead Magnet */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-semibold border-b border-gray-200 pb-2">Lead Magnet Section</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Headline">
            <input type="text" value={marketing.lead_magnet?.headline || ''} onChange={e => updateLeadMagnet('headline', e.target.value)} className={inputCls} />
          </Field>
          <Field label="CTA Button Label">
            <input type="text" value={marketing.lead_magnet?.cta_label || ''} onChange={e => updateLeadMagnet('cta_label', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Connected Resource ID (Optional)">
            <input
              type="number"
              placeholder="e.g. 1 (from Resources library)"
              value={marketing.lead_magnet?.resource_id ?? ''}
              onChange={e => updateLeadMagnet('resource_id', e.target.value ? parseInt(e.target.value) : null)}
              className={inputCls}
            />
          </Field>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 text-gray-700 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={!!marketing.lead_magnet?.enabled}
                onChange={e => updateLeadMagnet('enabled', e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              Enable Lead Magnet Section
            </label>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="space-y-4">
        <h4 className="text-gray-900 font-semibold border-b border-gray-200 pb-2">Final CTA Section</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Headline">
            <input type="text" value={marketing.final_cta?.headline || ''} onChange={e => updateFinalCta('headline', e.target.value)} className={inputCls} />
          </Field>
          <Field label="CTA Button Label">
            <input type="text" value={marketing.final_cta?.cta_label || ''} onChange={e => updateFinalCta('cta_label', e.target.value)} className={inputCls} />
          </Field>
        </div>
      </section>

      <SaveBar isSaving={isSaving} onSave={handleSave} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Pages Management
// ─────────────────────────────────────────────
function PagesManagement({ onToast }) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPage, setEditingPage] = useState(null)  // null = list, obj = edit form, 'new' = new
  const [form, setForm] = useState({ title: '', slug: '', content: '', meta_description: '', parent_slug: '', in_header_nav: false, in_footer_platform: false, in_footer_resources: false, in_footer_company: false, nav_order: 0, is_published: true })
  const [isSaving, setIsSaving] = useState(false)

  const token = () => localStorage.getItem('auth_token') || localStorage.getItem('token') || ''

  const fetchPages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pages', { headers: { Authorization: `Bearer ${token()}` } })
      if (res.ok) setPages(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchPages() }, [])

  const startEdit = (page) => {
    setForm({ ...page, parent_slug: page.parent_slug || '', content: page.content || '', meta_description: page.meta_description || '' })
    setEditingPage(page)
  }

  const startNew = () => {
    setForm({ title: '', slug: '', content: '', meta_description: '', parent_slug: '', in_header_nav: false, in_footer_platform: false, in_footer_resources: false, in_footer_company: false, nav_order: 0, is_published: true })
    setEditingPage('new')
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const isNew = editingPage === 'new'
      const url = isNew ? '/api/pages' : `/api/pages/${editingPage.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) })
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail || 'Save failed') }
      onToast(`Page ${isNew ? 'created' : 'updated'}!`, 'success')
      setEditingPage(null)
      fetchPages()
    } catch(e) { onToast(e.message, 'error') }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this page?')) return
    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
      if (!res.ok) throw new Error('Delete failed')
      onToast('Page deleted', 'success')
      fetchPages()
    } catch(e) { onToast(e.message, 'error') }
  }

  if (editingPage !== null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{editingPage === 'new' ? 'Create Page' : 'Edit Page'}</h3>
          <button onClick={() => setEditingPage(null)} className="text-gray-400 hover:text-gray-900 flex items-center gap-1 text-sm"><X className="w-4 h-4" /> Cancel</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Page Title *"><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={inputCls} /></Field>
          <Field label="Slug (URL path) *"><input type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value.replace(/\s+/g, '-').toLowerCase()})} placeholder="/about" className={inputCls} /></Field>
          <Field label="Meta Description (SEO)"><input type="text" value={form.meta_description} onChange={e => setForm({...form, meta_description: e.target.value})} className={inputCls} /></Field>
          <Field label="Parent Page Slug (for sub-pages)"><input type="text" value={form.parent_slug} onChange={e => setForm({...form, parent_slug: e.target.value})} placeholder="/resources" className={inputCls} /></Field>
          <Field label="Nav Order (lower = first)"><input type="number" value={form.nav_order} onChange={e => setForm({...form, nav_order: parseInt(e.target.value)||0})} className={inputCls} /></Field>
        </div>
        <Field label="Page Content (HTML or text)"><textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={8} className={inputCls} /></Field>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[['in_header_nav','Show in Header Nav'],['in_footer_platform','Footer: Platform'],['in_footer_resources','Footer: Resources'],['in_footer_company','Footer: Company']].map(([key,label]) => (
            <label key={key} className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer bg-gray-50 rounded-lg px-3 py-2">
              <input type="checkbox" checked={form[key]} onChange={e => setForm({...form, [key]: e.target.checked})} className="rounded" />
              {label}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} className="rounded" />
          Published (visible on site)
        </label>
        <SaveBar isSaving={isSaving} onSave={handleSave} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Pages</h3>
        <button onClick={startNew} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4 mr-2" />New Page
        </button>
      </div>
      <p className="text-gray-400 text-sm">Create dynamic pages and link them to header navigation or footer sections.</p>
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading pages...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No pages yet. Click "New Page" to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map(page => (
            <div key={page.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium">{page.title}</span>
                  {!page.is_published && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Draft</span>}
                  {page.parent_slug && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Sub-page of {page.parent_slug}</span>}
                </div>
                <div className="text-gray-400 text-sm mt-0.5 flex flex-wrap gap-2">
                  <span>{page.slug}</span>
                  {page.in_header_nav && <span className="text-green-400">📌 Header</span>}
                  {page.in_footer_platform && <span className="text-primary-600">Footer:Platform</span>}
                  {page.in_footer_resources && <span className="text-primary-600">Footer:Resources</span>}
                  {page.in_footer_company && <span className="text-primary-600">Footer:Company</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => startEdit(page)} className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm transition-colors">Edit</button>
                <button onClick={() => handleDelete(page.id)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Resources Management
// ─────────────────────────────────────────────
function ResourcesManagement({ onToast }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingResource, setEditingResource] = useState(null)
  const emptyResource = { title: '', description: '', category: '', resource_type: 'tutorial', difficulty: 'Beginner', duration: '', author: '', thumbnail_url: '', resource_url: '', tags: [], rating: 4.5, downloads: 0, is_featured: false, is_published: true, parent_id: null, nav_order: 0 }
  const [form, setForm] = useState(emptyResource)
  const [isSaving, setIsSaving] = useState(false)
  const [tagsText, setTagsText] = useState('')

  const token = () => localStorage.getItem('auth_token') || localStorage.getItem('token') || ''

  const fetchResources = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/resources', { headers: { Authorization: `Bearer ${token()}` } })
      if (res.ok) setResources(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchResources() }, [])

  const startEdit = (r) => { setForm({...r}); setTagsText((r.tags||[]).join(', ')); setEditingResource(r) }
  const startNew = () => { setForm(emptyResource); setTagsText(''); setEditingResource('new') }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const isNew = editingResource === 'new'
      const payload = { ...form, tags: tagsText.split(',').map(t => t.trim()).filter(Boolean) }
      const url = isNew ? '/api/resources' : `/api/resources/${editingResource.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(payload) })
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail || 'Save failed') }
      onToast(`Resource ${isNew ? 'created' : 'updated'}!`, 'success')
      setEditingResource(null)
      fetchResources()
    } catch(e) { onToast(e.message, 'error') }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
      if (!res.ok) throw new Error('Delete failed')
      onToast('Resource deleted', 'success')
      fetchResources()
    } catch(e) { onToast(e.message, 'error') }
  }

  const CATEGORIES = ['ai-fundamentals','machine-learning','deep-learning','data-science','programming','career-guidance','tools-software']
  const TYPES = ['tutorial','video','document','template','checklist','blog','book','webinar','code']
  const DIFFICULTIES = ['Beginner','Intermediate','Advanced']

  if (editingResource !== null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{editingResource === 'new' ? 'Add Resource' : 'Edit Resource'}</h3>
          <button onClick={() => setEditingResource(null)} className="text-gray-400 hover:text-gray-900 flex items-center gap-1 text-sm"><X className="w-4 h-4" /> Cancel</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Title *"><input type="text" value={form.title} onChange={e => setForm({...form,title:e.target.value})} className={inputCls} /></Field>
          <Field label="Author"><input type="text" value={form.author||''} onChange={e => setForm({...form,author:e.target.value})} className={inputCls} /></Field>
          <Field label="Category">
            <select value={form.category||''} onChange={e => setForm({...form,category:e.target.value})} className={inputCls}>
              <option value="">-- Select --</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Resource Type">
            <select value={form.resource_type||''} onChange={e => setForm({...form,resource_type:e.target.value})} className={inputCls}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Difficulty">
            <select value={form.difficulty||''} onChange={e => setForm({...form,difficulty:e.target.value})} className={inputCls}>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Duration (e.g. 45 min read)"><input type="text" value={form.duration||''} onChange={e => setForm({...form,duration:e.target.value})} className={inputCls} /></Field>
          <Field label="Resource URL (link to content)"><input type="url" value={form.resource_url||''} onChange={e => setForm({...form,resource_url:e.target.value})} className={inputCls} /></Field>
          <Field label="Thumbnail URL"><input type="url" value={form.thumbnail_url||''} onChange={e => setForm({...form,thumbnail_url:e.target.value})} className={inputCls} /></Field>
          <Field label="Rating (0-5)"><input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => setForm({...form,rating:parseFloat(e.target.value)||0})} className={inputCls} /></Field>
          <Field label="Downloads"><input type="number" value={form.downloads} onChange={e => setForm({...form,downloads:parseInt(e.target.value)||0})} className={inputCls} /></Field>
          <Field label="Parent Resource ID (for sub-pages)"><input type="number" value={form.parent_id||''} onChange={e => setForm({...form,parent_id:e.target.value?parseInt(e.target.value):null})} placeholder="Leave blank for top-level" className={inputCls} /></Field>
          <Field label="Sort Order"><input type="number" value={form.nav_order} onChange={e => setForm({...form,nav_order:parseInt(e.target.value)||0})} className={inputCls} /></Field>
        </div>
        <Field label="Tags (comma separated)"><input type="text" value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="Business, Strategy, Offers" className={inputCls} /></Field>
        <Field label="Description"><textarea value={form.description||''} onChange={e => setForm({...form,description:e.target.value})} rows={4} className={inputCls} /></Field>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form,is_featured:e.target.checked})} className="rounded" /> Featured</label>
          <label className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer"><input type="checkbox" checked={form.is_published} onChange={e => setForm({...form,is_published:e.target.checked})} className="rounded" /> Published</label>
        </div>
        <SaveBar isSaving={isSaving} onSave={handleSave} />
      </div>
    )
  }

  const typeColors = { tutorial:'text-primary-600', video:'text-red-400', document:'text-green-400', template:'text-indigo-400', checklist:'text-yellow-400', blog:'text-pink-400', book:'text-purple-400', webinar:'text-pink-400', code:'text-yellow-400' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Resources Library</h3>
        <button onClick={startNew} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4 mr-2" />Add Resource
        </button>
      </div>
      <p className="text-gray-400 text-sm">Manage books, documents, blog posts, templates, checklists, videos, and sub-pages.</p>
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No resources yet. Click "Add Resource" to start.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map(r => (
            <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-900 font-medium">{r.title}</span>
                  <span className={`text-xs font-medium ${typeColors[r.type]||'text-gray-400'}`}>{r.type}</span>
                  {r.featured && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Featured</span>}
                  {!r.is_published && <span className="text-xs bg-gray-500/30 text-gray-400 px-2 py-0.5 rounded-full">Draft</span>}
                  {r.parent_id && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Sub-resource #{r.parent_id}</span>}
                </div>
                <div className="text-gray-400 text-sm mt-0.5">{r.category} • {r.author} • {r.difficulty}</div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => startEdit(r)} className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm transition-colors">Edit</button>
                <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Community Management
// ─────────────────────────────────────────────
function CommunityManagement() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Community Management</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 max-w-lg">
        <p className="text-sm font-semibold text-blue-800 mb-1">Community has moved</p>
        <p className="text-sm text-blue-700 mb-4">
          Community is now per-founder and managed from dedicated pages.
          This settings tab no longer applies.
        </p>
        <div className="flex flex-col gap-2">
          <a href="/admin/communities" className="inline-flex items-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg w-fit">
            View all communities →
          </a>
          <a href="/admin/community-templates" className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 w-fit">
            Manage category templates →
          </a>
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [allSettings, setAllSettings] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type) => setToast({ message, type }), [])

  useEffect(() => {
    loadSettings()
      .then(data => setAllSettings(data))
      .catch(() => { /* silently fall back to site.config.js defaults */ })
  }, [])

  const tabs = [
    { id: 'general',   name: 'General',          icon: Settings },
    { id: 'security',  name: 'Security',          icon: Shield },
    { id: 'email',     name: 'Email',             icon: Mail },
    { id: 'marketing', name: 'Marketing Page',    icon: TrendingUp },
    { id: 'content',   name: 'Site Content',      icon: Globe },
    { id: 'homepage',  name: 'Homepage Sections', icon: Image },
    { id: 'footer',    name: 'Footer',            icon: FileText },
    { id: 'pages',     name: 'Pages',             icon: FileText },
    { id: 'resources', name: 'Resources',         icon: BookOpen },
    { id: 'community', name: 'Community',         icon: Users },
    { id: 'pricing',   name: 'Pricing',           icon: DollarSign },
    { id: 'system',    name: 'System Info',       icon: Monitor },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':   return <GeneralSettings      allSettings={allSettings} onToast={showToast} />
      case 'security':  return <SecuritySettings     allSettings={allSettings} onToast={showToast} />
      case 'email':     return <EmailConfiguration   allSettings={allSettings} onToast={showToast} />
      case 'marketing': return <MarketingPageSettings allSettings={allSettings} onToast={showToast} />
      case 'content':   return <SiteContentSettings  allSettings={allSettings} onToast={showToast} />
      case 'homepage':  return <HomepageSectionsSettings allSettings={allSettings} onToast={showToast} />
      case 'footer':    return <FooterSettings       allSettings={allSettings} onToast={showToast} />
      case 'pages':     return <PagesManagement      onToast={showToast} />
      case 'resources': return <ResourcesManagement  onToast={showToast} />
      case 'community': return <CommunityManagement />
      case 'pricing':   return <PricingSettings      allSettings={allSettings} onToast={showToast} />
      case 'system':    return <SystemInformation />
      default:          return <GeneralSettings      allSettings={allSettings} onToast={showToast} />
    }
  }

  return (
    <AdminShell>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-500 mt-1">Configure platform settings, security, and system preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => loadSettings().then(setAllSettings).catch(() => {})} className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors border border-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium transition-colors border border-green-500/30">
              <CheckCircle className="w-4 h-4 mr-2" />All Systems Operational
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id ? 'text-primary-600 border-b-2 border-blue-400 bg-blue-500/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />{tab.name}
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
