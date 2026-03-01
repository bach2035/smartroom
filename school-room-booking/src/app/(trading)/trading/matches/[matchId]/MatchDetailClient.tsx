'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import CourseTag from '@/components/trading/CourseTag'
import TradeStatusBadge from '@/components/trading/TradeStatusBadge'
import ChatBox from '@/components/trading/ChatBox'
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

export default function MatchDetailClient({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [message, setMessage] = useState('')

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
  }, [fetchMatch])

  async function handleAction(action: 'accept' | 'reject') {
    setActing(true)
    setMessage('')
    try {
      const res = await fetch(`/api/trading/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        fetchMatch()
      } else {
        setMessage(data.error || 'Action failed')
      }
    } finally {
      setActing(false)
    }
  }

  async function handleComplete() {
    if (!confirm('Mark this trade as completed?')) return
    setActing(true)
    setMessage('')
    try {
      const res = await fetch(`/api/trading/matches/${matchId}/complete`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        fetchMatch()
      } else {
        setMessage(data.error || 'Failed to complete')
      }
    } finally {
      setActing(false)
    }
  }

  async function handleCancelComplete() {
    if (!confirm('Cancel your completion confirmation?')) return
    setActing(true)
    setMessage('')
    try {
      const res = await fetch(`/api/trading/matches/${matchId}/complete`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        fetchMatch()
      } else {
        setMessage(data.error || 'Failed to cancel')
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
  const canComplete = match.status === 'ACCEPTED' && !match.completedByMe
  const waitingForOther = match.status === 'ACCEPTED' && match.completedByMe && !match.completedByOther
  const chatEnabled = match.status === 'ACCEPTED' || match.status === 'COMPLETED'

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

        {message && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mb-4">{message}</div>
        )}

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
            <button onClick={() => handleAction('reject')} disabled={acting} className="btn btn-secondary text-red-600">
              Reject
            </button>
          </div>
        )}

        {canComplete && (
          <div className="border-t pt-4">
            <button onClick={handleComplete} disabled={acting} className="btn btn-primary">
              {acting ? 'Completing...' : 'Mark as Completed'}
            </button>
            {match.completedByOther && (
              <p className="text-xs text-green-600 mt-2">The other party has already confirmed completion.</p>
            )}
          </div>
        )}

        {waitingForOther && (
          <div className="border-t pt-4">
            <div className="flex gap-3">
              <button disabled className="btn btn-primary opacity-60 cursor-not-allowed">
                Waiting for approval
              </button>
              <button
                onClick={handleCancelComplete}
                disabled={acting}
                className="btn btn-secondary text-red-600 hover:text-red-700"
              >
                {acting ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              You have confirmed completion. Waiting for the other party to confirm.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Chat</h2>
        <ChatBox matchId={matchId} enabled={chatEnabled} />
      </div>
    </div>
  )
}
