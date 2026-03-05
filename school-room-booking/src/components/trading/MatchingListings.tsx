'use client'

import { useState, useEffect } from 'react'
import type { TradeListing } from '@/types'
import CourseTag from './CourseTag'
import { useToast } from '@/components/ui/Toast'

interface MatchingListingsProps {
  listingId: string
  listingType?: 'TRADE' | 'GIVEAWAY'
}

export default function MatchingListings({ listingId, listingType = 'TRADE' }: MatchingListingsProps) {
  const isGiveaway = listingType === 'GIVEAWAY'
  const [matches, setMatches] = useState<(TradeListing & { matchScore?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [proposing, setProposing] = useState<string | null>(null)
  const [proposalNote, setProposalNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const { showToast } = useToast()

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
    try {
      const res = await fetch('/api/trading/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          myListingId: listingId,
          theirListingId,
          message: noteText.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(isGiveaway ? 'Course requested!' : 'Trade proposed successfully!', 'success')
        setMatches((prev) => prev.filter((m) => m.id !== theirListingId))
        setProposalNote(null)
        setNoteText('')
      } else {
        showToast(data.error || 'Failed to propose trade', 'error')
      }
    } finally {
      setProposing(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Finding matches...</div>
  }

  if (!matches.length) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-slate-500">No matching listings found yet.</p>
        <p className="text-xs text-slate-400 mt-1">Check back later as new listings are posted.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div key={match.id} className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium text-slate-800">
                {match.userName || 'Anonymous'}
              </p>
              {!isGiveaway && match.matchScore && (
                <p className="text-xs text-green-600">{match.matchScore} course overlap(s)</p>
              )}
            </div>
            <div className="flex gap-2">
              {proposalNote === match.id ? (
                <button
                  onClick={() => { setProposalNote(null); setNoteText('') }}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setProposalNote(match.id)}
                  className="btn btn-secondary text-sm"
                  title="Add a message with your proposal"
                >
                  + Message
                </button>
              )}
              <button
                onClick={() => proposeTrade(match.id)}
                disabled={proposing === match.id}
                className="btn btn-primary text-sm"
              >
                {proposing === match.id ? 'Proposing...' : isGiveaway ? 'Request Course' : 'Propose Trade'}
              </button>
            </div>
          </div>

          {proposalNote === match.id && (
            <div className="mb-3">
              <input
                className="form-input w-full text-sm"
                placeholder={isGiveaway ? "Add a note with your request..." : "Add a note explaining why this trade works..."}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="space-y-2">
            {match.haveCourses?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">HAS</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.haveCourses.map((c) => (
                    <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" classCode={c.classCode} />
                  ))}
                </div>
              </div>
            )}
            {match.wantCourses?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">WANTS</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.wantCourses.map((c) => (
                    <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" classCode={c.classCode} />
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
