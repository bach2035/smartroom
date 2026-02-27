'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CourseTag from '@/components/trading/CourseTag'
import TradeStatusBadge from '@/components/trading/TradeStatusBadge'
import MatchingListings from '@/components/trading/MatchingListings'

interface ListingDetail {
  id: string
  userId: string
  status: string
  notes: string | null
  createdAt: string
  userName: string | null
  contactEmail: string | null
  studentClass: string | null
  isOwn: boolean
  haveCourses: { id: string; courseCode: string; courseName: string; section: string | null; schedule: string | null; credits: number | null; type: string }[]
  wantCourses: { id: string; courseCode: string; courseName: string; section: string | null; schedule: string | null; credits: number | null; type: string }[]
}

export default function ListingDetailClient({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMatches, setShowMatches] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/trading/listings/${listingId}`)
      if (res.ok) {
        const data = await res.json()
        setListing(data.listing)
      }
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    fetchListing()
  }, [fetchListing])

  async function handleCancel() {
    if (!confirm('Cancel this listing?')) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/trading/listings/${listingId}`, { method: 'DELETE' })
      if (res.ok) router.push('/trading/my-listings')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500">Loading...</div>
  }

  if (!listing) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500">Listing not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/trading" className="text-sm text-slate-500 hover:text-slate-700">
        &larr; Back to Trading
      </Link>

      <div className="card p-6 mt-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {listing.userName || 'Anonymous'}
            </h1>
            {listing.studentClass && (
              <p className="text-sm text-slate-500">{listing.studentClass}</p>
            )}
            <p className="text-xs text-slate-400">
              Posted {new Date(listing.createdAt).toLocaleDateString()}
            </p>
          </div>
          <TradeStatusBadge status={listing.status as 'OPEN' | 'MATCHED' | 'COMPLETED' | 'CANCELLED'} />
        </div>

        {listing.haveCourses.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-green-700 mb-2">Courses to Trade Away</h2>
            <div className="flex flex-wrap gap-2">
              {listing.haveCourses.map((c) => (
                <CourseTag
                  key={c.id}
                  courseCode={c.courseCode}
                  courseName={c.courseName}
                  type="HAVE"
                  section={c.section}
                  schedule={c.schedule}
                />
              ))}
            </div>
          </div>
        )}

        {listing.wantCourses.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-blue-700 mb-2">Courses Wanted</h2>
            <div className="flex flex-wrap gap-2">
              {listing.wantCourses.map((c) => (
                <CourseTag
                  key={c.id}
                  courseCode={c.courseCode}
                  courseName={c.courseName}
                  type="WANT"
                  section={c.section}
                  schedule={c.schedule}
                />
              ))}
            </div>
          </div>
        )}

        {listing.notes && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-600 mb-1">Notes</h2>
            <p className="text-sm text-slate-600">{listing.notes}</p>
          </div>
        )}

        {listing.isOwn && listing.status === 'OPEN' && (
          <div className="flex gap-3 mt-6 border-t pt-4">
            <button
              onClick={() => setShowMatches(!showMatches)}
              className="btn btn-primary"
            >
              {showMatches ? 'Hide Matches' : 'Find Matches'}
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="btn btn-secondary text-red-600 hover:text-red-700"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Listing'}
            </button>
          </div>
        )}

        {!listing.isOwn && listing.status === 'OPEN' && (
          <div className="mt-6 border-t pt-4">
            <p className="text-sm text-slate-500">
              Want to trade? Create your own listing and find matches, or propose a trade from your listing page.
            </p>
          </div>
        )}
      </div>

      {showMatches && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Matching Listings</h2>
          <MatchingListings listingId={listingId} />
        </div>
      )}
    </div>
  )
}
