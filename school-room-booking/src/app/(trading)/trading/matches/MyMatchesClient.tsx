'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { TradeMatch } from '@/types'
import MatchCard from '@/components/trading/MatchCard'

export default function MyMatchesClient() {
  const [matches, setMatches] = useState<TradeMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/trading/matches')
        if (res.ok) {
          const data = await res.json()
          setMatches(data.matches || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/trading" className="text-sm text-slate-500 hover:text-slate-700">
          &larr; Back to Trading
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">My Matches</h1>
        <p className="text-sm text-slate-500">Trade proposals and accepted matches</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <p className="text-slate-600 font-medium mb-1">No matches yet</p>
          <p className="text-sm text-slate-400 mb-5">Here&apos;s how to get your first match:</p>
          <div className="inline-flex flex-col gap-3 text-left mb-6">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span className="text-sm text-slate-600">Create a listing with courses you have & want</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span className="text-sm text-slate-600">Check &ldquo;Suggested for You&rdquo; on the Browse page</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span className="text-sm text-slate-600">Propose a trade to a compatible listing</span>
            </div>
          </div>
          <div>
            <Link href="/trading" className="btn btn-primary">
              Browse Listings
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  )
}
