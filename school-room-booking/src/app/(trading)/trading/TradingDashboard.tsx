'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { TradeListing } from '@/types'
import ListingCard from '@/components/trading/ListingCard'
import TradingFilterBar from '@/components/trading/TradingFilterBar'
import { useTradingStore } from '@/store/tradingStore'

export default function TradingDashboard() {
  const [listings, setListings] = useState<TradeListing[]>([])
  const [loading, setLoading] = useState(true)
  const { searchQuery, courseCodeFilter } = useTradingStore()

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (courseCodeFilter) params.set('courseCode', courseCodeFilter)
      const res = await fetch(`/api/trading/listings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } finally {
      setLoading(false)
    }
  }, [searchQuery, courseCodeFilter])

  useEffect(() => {
    const timeout = setTimeout(fetchListings, 300)
    return () => clearTimeout(timeout)
  }, [fetchListings])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Browse Listings</h1>
          <p className="text-sm text-slate-500">Find course swap offers from other students</p>
        </div>
        <Link href="/trading/new" className="btn btn-primary">
          + New Listing
        </Link>
      </div>

      <div className="mb-6">
        <TradingFilterBar />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">No listings found.</p>
          <Link href="/trading/new" className="btn btn-primary">
            Create the first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
