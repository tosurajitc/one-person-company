'use client'

import Link from 'next/link'
import {
  BarChart3,
  Sparkles,
  User,
  Wallet,
  Share2,
  Settings,
  Zap,
  Users,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

export default function DashboardSidebar({
  activeTab,
  setActiveTab,
  hasSite,
  userSiteSlug,
  user,
}) {
  return (
    <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 shadow-sm space-y-1">
        <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
          Founder Workspace
        </p>

        {/* 1. Open Website */}
        {hasSite && userSiteSlug ? (
          <a
            href={`/${userSiteSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold text-green-700 hover:bg-green-50 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink className="w-4 h-4 text-green-600" />
              Open Website
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-green-500" />
          </a>
        ) : null}

        {/* 2. Dashboard / Overview */}
        {setActiveTab ? (
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-primary-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className={`w-4 h-4 ${activeTab === 'overview' ? 'text-primary-600' : 'text-gray-400'}`} />
              Dashboard
            </div>
            {activeTab === 'overview' && <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
          </button>
        ) : (
          <Link
            href="/dashboard"
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-primary-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className={`w-4 h-4 ${activeTab === 'overview' ? 'text-primary-600' : 'text-gray-400'}`} />
              Dashboard
            </div>
            {activeTab === 'overview' && <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
          </Link>
        )}

        {/* 3. AI Sales Desk */}
        {setActiveTab ? (
          <button
            type="button"
            onClick={() => setActiveTab('sales-desk')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'sales-desk'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className={`w-4 h-4 ${activeTab === 'sales-desk' ? 'text-indigo-200' : 'text-indigo-600'}`} />
              AI Sales Desk
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'sales-desk' ? 'bg-indigo-700 text-indigo-100' : 'bg-indigo-100 text-indigo-700'
            }`}>
              AI
            </span>
          </button>
        ) : (
          <Link
            href="/dashboard?tab=sales-desk"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/60 hover:text-gray-900 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Sales Desk
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
              AI
            </span>
          </Link>
        )}

        {/* 3.5. AI Ad Management */}
        {setActiveTab ? (
          <button
            type="button"
            onClick={() => setActiveTab('ad-management')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'ad-management'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${activeTab === 'ad-management' ? 'text-blue-200' : 'text-blue-600'}`} />
              Ad Management
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'ad-management' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
            }`}>
              Meta AI
            </span>
          </button>
        ) : (
          <Link
            href="/dashboard?tab=ad-management"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/60 hover:text-gray-900 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-blue-600" />
              Ad Management
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              Meta AI
            </span>
          </Link>
        )}


        {/* 5. Profile Settings */}
        <Link
          href="/profile"
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-white text-primary-700 shadow-sm border border-gray-200'
              : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-primary-600' : 'text-gray-500'}`} />
            Profile Settings
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>

        {/* 6. Wallet & Funds */}
        <Link
          href="/profile/wallet"
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'wallet'
              ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
              : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Wallet className={`w-4 h-4 ${activeTab === 'wallet' ? 'text-emerald-600' : 'text-emerald-600'}`} />
            Wallet & Funds
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>

        {/* 7. Referral Program */}
        <Link
          href="/platform/offers-payments"
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'referral'
              ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
              : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Share2 className={`w-4 h-4 ${activeTab === 'referral' ? 'text-indigo-600' : 'text-indigo-500'}`} />
            Referral Program
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>

        {/* 8. Account Settings */}
        <Link
          href="/profile"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/60 hover:text-gray-900 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-gray-500" />
            Account Settings
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>

        <p className="px-3 pt-4 pb-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
          AI Platform Tools
        </p>

        <Link
          href="/platform/ai-genie"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/60 hover:text-gray-900 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Digital Workforce
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>

        <Link
          href="/dashboard/community"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/60 hover:text-gray-900 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-purple-600" />
            My Community
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>
      </div>

      {/* Quick Wallet & AI Usage Card in Sidebar */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-4 text-white text-xs space-y-3 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300">Wallet & AI Usage</span>
          <Wallet className="w-4 h-4 text-emerald-400" />
        </div>

        <div>
          <div className="text-xl font-black text-emerald-400">
            ₹{Number(user?.wallet_balance || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">Available Balance</div>
        </div>

        <div className="pt-2.5 border-t border-slate-800/80 space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-300">
            <span>AI Cost Consumed:</span>
            <span className="font-bold text-amber-300">
              ₹{Number(user?.wallet_consumed || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Tokens Used:</span>
            <span>{(user?.ai_tokens_used || 0).toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-slate-400 italic pt-1">
            Rate: ₹0.15 / 1,000 tokens
          </div>
        </div>

        <Link
          href="/profile/wallet"
          className="block text-center w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors"
        >
          + Add Funds
        </Link>
      </div>
    </div>
  )
}
