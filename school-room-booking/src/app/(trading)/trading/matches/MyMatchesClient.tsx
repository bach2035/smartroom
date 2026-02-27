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
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">No matches yet.</p>
          <Link href="/trading" className="btn btn-primary">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  )
}
