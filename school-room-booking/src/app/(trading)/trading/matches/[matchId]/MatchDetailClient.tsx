'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import CourseTag from '@/components/trading/CourseTag'
import TradeStatusBadge from '@/components/trading/TradeStatusBadge'
import ChatBox from '@/components/trading/ChatBox'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import type { TradeMatchStatus, TradeCourseType } from '@/types'

interface MatchSide {
  id: string
  userId: string
  userName: string | null
  contactEmail: string | null
  studentClass: string | null
  haveCourses: { id: string; courseCode: string; courseName: string; classCode: string | null; section: string | null; type: TradeCourseType }[]
  wantCourses: { id: string; courseCode: string; courseName: string; classCode: string | null; section: string | null; type: TradeCourseType }[]
}

interface MatchDetail {
  id: string
  status: TradeMatchStatus
  isInitiator: boolean
  createdAt: string
  completedByMe: boolean
  completedByOther: boolean
  myListing: MatchSide
  otherListing: MatchSide
}

type Tab = 'details' | 'chat'

export default function MatchDetailClient({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [localCompleted, setLocalCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const { showToast } = useToast()

  // Confirm modals
  const [confirmAction, setConfirmAction] = useState<'reject' | 'complete' | 'cancelComplete' | null>(null)

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/trading/matches/${matchId}`)
      if (res.ok) {
        const data = await res.json()
        setMatch(data.match)
      }
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    fetchMatch()
    // Poll every 15s to pick up the other party's completion status
    const interval = setInterval(fetchMatch, 15000)
    return () => clearInterval(interval)
  }, [fetchMatch])

  async function handleAction(action: 'accept' | 'reject') {
    setActing(true)
    setConfirmAction(null)
    try {
      const res = await fetch(`/api/trading/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Match ${action}ed`, 'success')
        fetchMatch()
      } else {
        showToast(data.error || 'Action failed', 'error')
      }
    } finally {
      setActing(false)
    }
  }

  async function handleComplete() {
    setActing(true)
    setConfirmAction(null)
    try {
      const res = await fetch(`/api/trading/matches/${matchId}/complete`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) {
        setLocalCompleted(true)
        showToast(data.message || 'Marked as completed', 'success')
        fetchMatch()
      } else {
        showToast(data.error || 'Failed to complete', 'error')
      }
    } finally {
      setActing(false)
    }
  }

  async function handleCancelComplete() {
    setActing(true)
    setConfirmAction(null)
    try {
      const res = await fetch(`/api/trading/matches/${matchId}/complete`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setLocalCompleted(false)
        showToast(data.message || 'Completion cancelled', 'info')
        fetchMatch()
      } else {
        showToast(data.error || 'Failed to cancel', 'error')
      }
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500">Loading...</div>
  }

  if (!match) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500">Match not found.</div>
  }

  const canRespond = match.status === 'PENDING' && !match.isInitiator
  const effectiveCompletedByMe = match.completedByMe || localCompleted
  const canComplete = match.status === 'ACCEPTED' && !effectiveCompletedByMe
  const waitingForOther = match.status === 'ACCEPTED' && effectiveCompletedByMe && !match.completedByOther
  const chatEnabled = match.status === 'ACCEPTED' || match.status === 'COMPLETED'

  // Trade summary
  const tradeSummary = (() => {
    const myGive = match.myListing.haveCourses.map((c) => c.courseCode).join(', ')
    const myGet = match.otherListing.haveCourses.map((c) => c.courseCode).join(', ')
    if (myGive && myGet) return { give: myGive, get: myGet }
    return null
  })()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/trading/matches" className="text-sm text-slate-500 hover:text-slate-700">
        &larr; Back to Matches
      </Link>

      <div className="card p-6 mt-4">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800">
            Trade with {match.otherListing.userName || 'Unknown'}
          </h1>
          <TradeStatusBadge status={match.status} />
        </div>

        {/* Trade summary */}
        {tradeSummary && (
          <div className="bg-slate-50 rounded-lg p-3 mb-4 flex items-center gap-3 text-sm">
            <span className="text-slate-600">You give <span className="font-semibold text-green-700">{tradeSummary.give}</span></span>
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-slate-600">You get <span className="font-semibold text-blue-700">{tradeSummary.get}</span></span>
          </div>
        )}

        {/* Pending status banner */}
        {match.status === 'PENDING' && match.isInitiator && (
          <div className="mb-4 rounded-lg p-3 text-sm flex items-center gap-2 bg-yellow-50 text-yellow-800">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Waiting for <strong>{match.otherListing.userName || 'the other party'}</strong> to accept your trade proposal.</span>
          </div>
        )}

        {match.status === 'PENDING' && !match.isInitiator && (
          <div className="mb-4 rounded-lg p-3 text-sm flex items-center gap-2 bg-yellow-50 text-yellow-800">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span><strong>{match.otherListing.userName || 'Someone'}</strong> has proposed a trade with you. Accept or reject below.</span>
          </div>
        )}

        {/* Completion status banner */}
        {match.status === 'ACCEPTED' && (effectiveCompletedByMe || match.completedByOther) && (
          <div className={`mb-4 rounded-lg p-3 text-sm flex items-center gap-2 ${
            effectiveCompletedByMe && match.completedByOther
              ? 'bg-green-50 text-green-800'
              : match.completedByOther
                ? 'bg-amber-50 text-amber-800'
                : 'bg-blue-50 text-blue-800'
          }`}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {effectiveCompletedByMe && match.completedByOther ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span>
              {effectiveCompletedByMe && match.completedByOther
                ? 'Both parties have confirmed. Trade is being finalized!'
                : match.completedByOther && !effectiveCompletedByMe
                  ? <><strong>{match.otherListing.userName || 'The other party'}</strong> has marked this trade as completed — waiting for your confirmation.</>
                  : <>You have marked this trade as completed — waiting for <strong>{match.otherListing.userName || 'the other party'}</strong> to confirm.</>
              }
            </span>
          </div>
        )}

        {/* Mobile tabs */}
        <div className="flex border-b border-slate-200 mb-4 md:hidden">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details' ? 'border-red-700 text-red-700' : 'border-transparent text-slate-500'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'chat' ? 'border-red-700 text-red-700' : 'border-transparent text-slate-500'
            }`}
          >
            Chat
          </button>
        </div>

        {/* Details content (hidden on mobile when chat tab active) */}
        <div className={`${activeTab === 'chat' ? 'hidden md:block' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* My side */}
            <div>
              <h2 className="text-sm font-semibold text-slate-600 mb-2">Your Listing</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">You have:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.myListing.haveCourses.map((c) => (
                      <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" classCode={c.classCode} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">You want:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.myListing.wantCourses.map((c) => (
                      <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" classCode={c.classCode} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Other side */}
            <div>
              <h2 className="text-sm font-semibold text-slate-600 mb-2">
                {match.otherListing.userName || 'Other'}&#39;s Listing
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">They have:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.otherListing.haveCourses.map((c) => (
                      <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" classCode={c.classCode} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">They want:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.otherListing.wantCourses.map((c) => (
                      <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" classCode={c.classCode} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {canRespond && (
            <div className="flex gap-3 border-t pt-4">
              <button onClick={() => handleAction('accept')} disabled={acting} className="btn btn-primary">
                {acting ? 'Processing...' : 'Accept'}
              </button>
              <button
                onClick={() => setConfirmAction('reject')}
                disabled={acting}
                className="btn btn-secondary text-red-600"
              >
                Reject
              </button>
            </div>
          )}

          {canComplete && (
            <div className="border-t pt-4">
              <button
                onClick={() => setConfirmAction('complete')}
                disabled={acting}
                className="btn btn-primary"
              >
                {acting ? 'Completing...' : 'Mark as Completed'}
              </button>
            </div>
          )}

          {waitingForOther && (
            <div className="border-t pt-4">
              <div className="flex gap-3">
                <button disabled className="btn btn-primary opacity-60 cursor-not-allowed">
                  Waiting for {match.otherListing.userName || 'other party'}
                </button>
                <button
                  onClick={() => setConfirmAction('cancelComplete')}
                  disabled={acting}
                  className="btn btn-secondary text-red-600 hover:text-red-700"
                >
                  {acting ? 'Cancelling...' : 'Undo'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat section - hidden on mobile when details tab active */}
        <div className={`${activeTab === 'details' ? 'hidden md:block' : ''} md:mt-6`}>
          <h2 className="text-lg font-bold text-slate-800 mb-4 hidden md:block">Chat</h2>
          <ChatBox matchId={matchId} enabled={chatEnabled} />
        </div>
      </div>

      {/* Confirm Reject */}
      <ConfirmModal
        isOpen={confirmAction === 'reject'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleAction('reject')}
        title="Reject Trade"
        message="Are you sure you want to reject this trade proposal? This cannot be undone and the other party will be notified."
        confirmLabel="Reject Trade"
        confirmVariant="danger"
        loading={acting}
      />

      {/* Confirm Complete */}
      <ConfirmModal
        isOpen={confirmAction === 'complete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleComplete}
        title="Confirm Completion"
        message="Confirm that this trade has been completed on your end. Both parties need to confirm for the trade to be finalized."
        confirmLabel="Confirm Completion"
        confirmVariant="primary"
        loading={acting}
      />

      {/* Confirm Cancel Completion */}
      <ConfirmModal
        isOpen={confirmAction === 'cancelComplete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleCancelComplete}
        title="Undo Completion"
        message="This will withdraw your completion confirmation. You can re-confirm later."
        confirmLabel="Undo"
        confirmVariant="danger"
        loading={acting}
      />
    </div>
  )
}
