'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { TradeListing } from '@/types'
import ListingCard from '@/components/trading/ListingCard'

export default function MyListingsClient() {
  const [listings, setListings] = useState<TradeListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/trading/listings/me')
        if (res.ok) {
          const data = await res.json()
          setListings(data.listings || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/trading" className="text-sm text-slate-500 hover:text-slate-700">
            &larr; Back to Trading
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">My Listings</h1>
        </div>
        <Link href="/trading/new" className="btn btn-primary">
          + New Listing
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">You haven&apos;t created any listings yet.</p>
          <Link href="/trading/new" className="btn btn-primary">
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} showStatus />
          ))}
        </div>
      )}
    </div>
  )
}
