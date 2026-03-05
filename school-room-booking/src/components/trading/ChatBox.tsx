'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TradeMessage } from '@/types'

interface ChatBoxProps {
  matchId: string
  enabled: boolean
}

export default function ChatBox({ matchId, enabled }: ChatBoxProps) {
  const [messages, setMessages] = useState<TradeMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastTimestamp = useRef<string | null>(null)

  const fetchMessages = useCallback(async () => {
    const url = `/api/trading/matches/${matchId}/messages` +
      (lastTimestamp.current ? `?after=${encodeURIComponent(lastTimestamp.current)}` : '')
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json()
    if (data.messages?.length) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id))
        const newMsgs = data.messages.filter((m: TradeMessage) => !existingIds.has(m.id))
        return newMsgs.length ? [...prev, ...newMsgs] : prev
      })
      lastTimestamp.current = data.messages[data.messages.length - 1].createdAt
    }
  }, [matchId])

  useEffect(() => {
    if (!enabled) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [enabled, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/trading/matches/${matchId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        lastTimestamp.current = data.message.createdAt
        setInput('')
      }
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!enabled) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-slate-500">
        Chat is available after the match is accepted.
      </div>
    )
  }

  return (
    <div className="border rounded-lg flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
              msg.isOwn ? 'bg-red-700 text-white' : 'bg-gray-100 text-slate-800'
            }`}>
              {!msg.isOwn && (
                <p className="text-xs font-medium mb-0.5 opacity-75">{msg.senderName}</p>
              )}
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.isOwn ? 'text-red-200' : 'text-slate-400'}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="border-t p-3 flex gap-2">
        <input
          className="form-input flex-1"
          placeholder="Type a message... (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" disabled={sending || !input.trim()} className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  )
}
