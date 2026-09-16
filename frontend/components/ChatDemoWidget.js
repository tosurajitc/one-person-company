'use client'

import { useState } from 'react'
import { MessageSquare, Send, Sparkles } from 'lucide-react'

export default function ChatDemoWidget({ previewText = "Powered by advanced AI models" }) {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleDemo = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, user_id: 'demo' }),
      })
      const data = await res.json()
      setResponse(data.response || data.message || 'AI Genie is setting up — check back soon!')
    } catch (_) {
      setResponse('Your AI Genie is coming online shortly. Sign up to be first in line.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3 text-white">
          <MessageSquare className="w-4 h-4" />
        </div>
        <span className="font-semibold text-gray-900">Try your AI Genie live</span>
        <span className="ml-auto text-xs text-gray-500">{previewText}</span>
      </div>
      <form onSubmit={handleDemo} className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Ask anything about running your business…"
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="flex items-center px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? '…' : <><Send className="w-4 h-4 mr-1.5" /> Ask</>}
        </button>
      </form>
      {response && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-primary-100 text-gray-700 text-sm leading-relaxed shadow-sm">
          {response}
        </div>
      )}
    </div>
  )
}
