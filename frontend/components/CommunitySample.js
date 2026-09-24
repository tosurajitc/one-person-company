'use client'

/**
 * CommunitySample
 * ------------------------------------------------------------------
 * Preview of what a founder's community looks like, shown on
 * /dashboard/community ONLY while they have no community yet.
 *
 * Everything is sample data and clearly labelled. Nothing is saved or sent.
 *
 * Props:
 *   onCreate   called by the "Create my community" buttons
 *
 * Theme: bottle green + light green + orange primary buttons.
 */

import { useState } from 'react'
import {
  Users, MessageSquare, Calendar, Crown, Pin, Video, Lock,
  Info, Plus, CheckCircle, TrendingUp, IndianRupee, Flame,
} from 'lucide-react'

const BTN_ORANGE = 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/30'
const CARD = 'bg-white rounded-2xl border border-[#c9f2d8]'

// ─── Sample data (exported so it can be edited or reused) ────────────────────
export const SAMPLE_COMMUNITY = {
  name: 'The Founder Circle',
  description: 'A private space for solo founders to share wins, ask questions and get feedback from people a few steps ahead.',
  price: 499,
  currency: '₹',
  members: 128,
  activeThisWeek: 42,
  categories: ['Announcements', 'Wins', 'Q&A', 'Feedback'],
  rules: ['Be respectful', 'No spam or self-promotion outside #Wins', 'Share what worked, and what did not'],
}

const SAMPLE_THREADS = [
  { id: 1, title: 'Welcome! Introduce yourself and your business', author: 'Priya (owner)', category: 'Announcements', replies: 34, pinned: true, when: '5 days ago' },
  { id: 2, title: 'I got my first paying client from LinkedIn this week', author: 'Rohan D.', category: 'Wins', replies: 18, pinned: false, when: '2 hours ago' },
  { id: 3, title: 'How do you price a monthly retainer for a new client?', author: 'Ananya R.', category: 'Q&A', replies: 12, pinned: false, when: 'Yesterday' },
  { id: 4, title: 'Feedback please: my homepage headline', author: 'Karan S.', category: 'Feedback', replies: 7, pinned: false, when: '3 days ago' },
]

const SAMPLE_EVENTS = [
  { id: 1, title: 'Monthly founder Q&A', when: 'Sat, 10:00 AM', type: 'Live call', joining: 46 },
  { id: 2, title: 'Workshop: writing your offer in one page', when: 'Next Wed, 7:00 PM', type: 'Webinar', joining: 61 },
]

const SAMPLE_MEMBERS = [
  { id: 1, name: 'Priya Sen', role: 'Owner', joined: 'Founder', status: 'Active' },
  { id: 2, name: 'Rohan Das', role: 'Moderator', joined: '3 months ago', status: 'Active' },
  { id: 3, name: 'Ananya Roy', role: 'Member', joined: '6 weeks ago', status: 'Active' },
  { id: 4, name: 'Karan Shah', role: 'Member', joined: '2 weeks ago', status: 'Active' },
  { id: 5, name: 'Meera Iyer', role: 'Member', joined: '4 days ago', status: 'Active' },
]

const ROLE_CLS = {
  Owner: 'bg-orange-100 text-orange-800',
  Moderator: 'bg-[#d9f5e4] text-[#053728]',
  Member: 'bg-gray-100 text-gray-600',
}

const TABS = [
  { id: 'threads', label: 'Discussions', icon: MessageSquare },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'members', label: 'Members', icon: Users },
]

export default function CommunitySample({ onCreate }) {
  const [tab, setTab] = useState('threads')
  const [notice, setNotice] = useState('')

  const flash = msg => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3500)
  }

  const c = SAMPLE_COMMUNITY
  const monthly = (c.members * c.price).toLocaleString('en-IN')

  const stats = [
    { icon: Users, label: 'Members', value: c.members },
    { icon: Flame, label: 'Active this week', value: c.activeThisWeek },
    { icon: Calendar, label: 'Upcoming events', value: SAMPLE_EVENTS.length },
    { icon: IndianRupee, label: 'Monthly revenue', value: `₹${monthly}` },
  ]

  return (
    <div className="space-y-5">
      {/* Sample banner */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-[#f2faf5] border border-[#a7f3c0] rounded-xl">
        <div className="flex items-start gap-3 flex-1">
          <Info className="w-5 h-5 text-[#0f6b4f] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#06352a]">Sample data &mdash; this is a preview of a community</p>
            <p className="text-xs text-[#0a4836] mt-0.5">
              Names, posts and revenue below are made up. Create your own community and it takes this place.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 ${BTN_ORANGE} rounded-xl text-xs font-bold whitespace-nowrap`}
        >
          <Plus className="w-3.5 h-3.5" />Create my community
        </button>
      </div>

      {/* Community header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#021610] via-[#053728] to-[#0a4836] p-6 sm:p-7 text-white shadow-sm">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-[#a7f3c0] opacity-10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-black">{c.name}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#a7f3c0]/15 border border-[#a7f3c0]/30 text-[#a7f3c0]">Active</span>
            </div>
            <p className="text-sm text-emerald-50/80 mt-2 max-w-xl leading-relaxed">{c.description}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {c.categories.map(cat => (
                <span key={cat} className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 border border-[#a7f3c0]/25 text-emerald-50">{cat}</span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="inline-flex items-center gap-1.5 text-xs text-emerald-100/70"><Lock className="w-3.5 h-3.5" />Paid membership</p>
            <p className="text-2xl font-black text-white mt-0.5">{c.currency}{c.price}<span className="text-sm font-medium text-emerald-100/70"> /month</span></p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className={`${CARD} p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xl font-black text-[#053728]">{value}</p>
              <span className="w-8 h-8 rounded-full bg-[#d9f5e4] flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#0a4836]" />
              </span>
            </div>
            <p className="text-xs font-semibold text-[#06352a]">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabbed preview */}
      <div className={`${CARD} shadow-sm overflow-hidden`}>
        <div className="flex flex-wrap gap-2 p-3 border-b border-[#d9f5e4] bg-[#f2faf5]" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f6b4f] ${
                  active
                    ? 'bg-[#0a4836] text-white border-[#0a4836]'
                    : 'bg-white text-gray-700 border-[#c9f2d8] hover:border-[#0f6b4f] hover:text-[#0a4836]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {tab === 'threads' && (
            <ul className="space-y-3">
              {SAMPLE_THREADS.map(t => (
                <li key={t.id} className="flex items-center justify-between gap-3 bg-[#f2faf5] rounded-xl p-4 border border-[#c9f2d8]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-[#06352a] truncate">{t.title}</p>
                      {t.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-semibold shrink-0">
                          <Pin className="w-3 h-3" />Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">by {t.author} · {t.replies} replies · {t.category} · {t.when}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => flash('Sample only: with a real community you can pin or delete threads here.')}
                    className="p-2 rounded-lg text-gray-400 hover:text-[#0a4836] hover:bg-white"
                    aria-label="Pin thread"
                  >
                    <Crown className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tab === 'events' && (
            <ul className="space-y-3">
              {SAMPLE_EVENTS.map(ev => (
                <li key={ev.id} className="flex items-center justify-between gap-3 bg-[#f2faf5] rounded-xl p-4 border border-[#c9f2d8]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-[#0a4836] flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5 text-[#a7f3c0]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#06352a] truncate">{ev.title}</p>
                      <p className="text-xs text-gray-500">{ev.when} · {ev.type}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#0a4836] bg-[#d9f5e4] px-2.5 py-1 rounded-full shrink-0">{ev.joining} joining</span>
                </li>
              ))}
            </ul>
          )}

          {tab === 'members' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#d9f5e4] text-left text-xs font-semibold text-[#0a4836]">
                    <th className="pb-3 pr-4">Member</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Joined</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9f5e4]">
                  {SAMPLE_MEMBERS.map(m => (
                    <tr key={m.id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-[#d9f5e4] flex items-center justify-center text-xs font-bold text-[#0a4836]">
                            {m.name.split(' ').map(n => n[0]).join('')}
                          </span>
                          <span className="font-medium text-[#06352a]">{m.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_CLS[m.role]}`}>{m.role}</span></td>
                      <td className="py-3 pr-4 text-gray-500">{m.joined}</td>
                      <td className="py-3 text-[#0f6b4f] text-xs font-semibold">{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {notice && (
            <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-[#0f6b4f] mt-4">
              <CheckCircle className="w-3.5 h-3.5" />{notice}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-[#0f6b4f]" />
        Revenue above is a made-up example (128 members at ₹499 a month), not a forecast.
      </p>
    </div>
  )
}
