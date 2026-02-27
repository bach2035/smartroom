'use client'

import { useState, useEffect } from 'react'
import type { TradeListing } from '@/types'
import CourseTag from './CourseTag'

interface MatchingListingsProps {
  listingId: string
}

export default function MatchingListings({ listingId }: MatchingListingsProps) {
  const [matches, setMatches] = useState<(TradeListing & { matchScore?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [proposing, setProposing] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/trading/listings/${listingId}/matches`)
        if (res.ok) {
          const data = await res.json()
          setMatches(data.matches || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [listingId])

  async function proposeTrade(theirListingId: string) {
    setProposing(theirListingId)
    setMessage('')
    try {
      const res = await fetch('/api/trading/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myListingId: listingId, theirListingId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Trade proposed!')
        setMatches((prev) => prev.filter((m) => m.id !== theirListingId))
      } else {
        setMessage(data.error || 'Failed to propose trade')
      }
    } finally {
      setProposing(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Finding matches...</div>
  }

  if (!matches.length) {
    return <div className="text-center py-8 text-slate-500">No matching listings found yet.</div>
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">{message}</div>
      )}
      {matches.map((match) => (
        <div key={match.id} className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium text-slate-800">
                {match.userName || 'Anonymous'}
              </p>
              {match.matchScore && (
                <p className="text-xs text-green-600">{match.matchScore} course overlap(s)</p>
              )}
            </div>
            <button
              onClick={() => proposeTrade(match.id)}
              disabled={proposing === match.id}
              className="btn btn-primary text-sm"
            >
              {proposing === match.id ? 'Proposing...' : 'Propose Trade'}
            </button>
          </div>
          <div className="space-y-2">
            {match.haveCourses?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">HAS</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.haveCourses.map((c) => (
                    <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" />
                  ))}
                </div>
              </div>
            )}
            {match.wantCourses?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">WANTS</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.wantCourses.map((c) => (
                    <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" />
                  ))}
                </div>
              </div>
            )}
          </div>
          {match.notes && <p className="text-sm text-slate-600 mt-2">{match.notes}</p>}
        </div>
      ))}
    </div>
  )
}
