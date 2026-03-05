'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/types'
import { relativeTime } from '@/lib/utils'

const typeIcons: Record<string, { icon: string; color: string }> = {
  TRADE_PROPOSAL_RECEIVED: { icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'text-blue-600 bg-blue-100' },
  TRADE_PROPOSAL_ACCEPTED: { icon: 'M5 13l4 4L19 7', color: 'text-green-600 bg-green-100' },
  TRADE_PROPOSAL_REJECTED: { icon: 'M6 18L18 6M6 6l12 12', color: 'text-red-600 bg-red-100' },
  TRADE_COMPLETED_BY_OTHER: { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-amber-600 bg-amber-100' },
  TRADE_FULLY_COMPLETED: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-600 bg-green-100' },
  TRADE_NEW_MESSAGE: { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'text-purple-600 bg-purple-100' },
  BOOKING_SUBMITTED: { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-blue-600 bg-blue-100' },
  BOOKING_APPROVED: { icon: 'M5 13l4 4L19 7', color: 'text-green-600 bg-green-100' },
  BOOKING_REJECTED: { icon: 'M6 18L18 6M6 6l12 12', color: 'text-red-600 bg-red-100' },
  BOOKING_CANCELLED: { icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', color: 'text-amber-600 bg-amber-100' },
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch unread count periodically
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/notifications?unread=true&limit=1')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch { /* silently fail */ }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 15000)
    return () => clearInterval(interval)
  }, [])

  // Fetch full list when panel opens
  useEffect(() => {
    if (!open) { setShowAll(false); return }
    setLoading(true)
    fetch('/api/notifications?limit=20')
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.read) {
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notif.id }),
      })
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setOpen(false)
    if (notif.link) router.push(notif.link)
  }

  return (
    <div className="relative" ref={panelRef} data-tour="notifications">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-white rounded-xl shadow-lg border border-slate-200 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-red-700 hover:text-red-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">
                No notifications yet
              </div>
            ) : (() => {
              const visible = showAll ? notifications : notifications.slice(0, 2)
              const hasMore = notifications.length > 2 && !showAll
              return (
                <>
                  {visible.map((notif) => {
                    const typeInfo = typeIcons[notif.type] || { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-slate-600 bg-slate-100' }
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleClick(notif)}
                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                          !notif.read ? 'bg-red-50/40' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeInfo.icon} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${!notif.read ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{relativeTime(notif.createdAt)}</p>
                        </div>
                      </button>
                    )
                  })}
                  {hasMore && (
                    <button
                      onClick={() => setShowAll(true)}
                      className="w-full py-2.5 text-xs font-medium text-red-700 hover:text-red-800 hover:bg-slate-50 transition-colors"
                    >
                      See more ({notifications.length - 2} more)
                    </button>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
