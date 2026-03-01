'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TradeListing } from '@/types'
import ListingCard from '@/components/trading/ListingCard'
import TradingFilterBar from '@/components/trading/TradingFilterBar'
import CourseTag from '@/components/trading/CourseTag'
import TradeStatusBadge from '@/components/trading/TradeStatusBadge'
import MatchingListings from '@/components/trading/MatchingListings'
import ListingForm from '@/components/trading/ListingForm'
import Modal from '@/components/ui/Modal'
import { useTradingStore } from '@/store/tradingStore'

interface ListingDetail {
  id: string
  userId: string
  status: string
  notes: string | null
  createdAt: string
  userName: string | null
  username: string | null
  contactEmail: string | null
  phone: string | null
  studentClass: string | null
  studentId: string | null
  isOwn: boolean
  haveCourses: { id: string; courseCode: string; courseName: string; classCode: string | null; section: string | null; schedule: string | null; credits: number | null; type: string }[]
  wantCourses: { id: string; courseCode: string; courseName: string; classCode: string | null; section: string | null; schedule: string | null; credits: number | null; type: string }[]
}

export default function TradingDashboard() {
  const [listings, setListings] = useState<TradeListing[]>([])
  const [loading, setLoading] = useState(true)
  const { searchQuery, courseCodeFilter } = useTradingStore()

  // Modal state
  const [selectedListing, setSelectedListing] = useState<ListingDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [showMatches, setShowMatches] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  const openDetail = async (listingId: string) => {
    setDetailLoading(true)
    setSelectedListing(null)
    setDetailError(null)
    setShowMatches(false)
    try {
      const res = await fetch(`/api/trading/listings/${listingId}`)
      const data = await res.json()
      if (res.ok && data.listing) {
        setSelectedListing(data.listing)
      } else {
        setDetailError(data.error || 'Failed to load listing')
        console.error('Listing detail error:', res.status, data)
      }
    } catch (error) {
      setDetailError('Network error')
      console.error('Error fetching listing detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    if (!detailLoading) {
      setSelectedListing(null)
      setDetailError(null)
      setShowMatches(false)
    }
  }

  const handleCreate = async (data: { notes: string; haveCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[]; wantCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[] }) => {
    const res = await fetch('/api/trading/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: data.notes,
        haveCourses: data.haveCourses.map((c) => ({ ...c, credits: c.credits ? parseInt(c.credits) : null })),
        wantCourses: data.wantCourses.map((c) => ({ ...c, credits: c.credits ? parseInt(c.credits) : null })),
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to create listing')
    }
    setShowCreateModal(false)
    fetchListings()
  }

  const handleCancel = async () => {
    if (!selectedListing || !confirm('Cancel this listing?')) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/trading/listings/${selectedListing.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSelectedListing(null)
        fetchListings()
      }
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Browse Listings</h1>
          <p className="text-sm text-slate-500">Find course swap offers from other students</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + New Listing
        </button>
      </div>

      <div className="mb-6">
        <TradingFilterBar />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">No listings found.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create the first listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onClick={() => openDetail(listing.id)} />
          ))}
        </div>
      )}

      {/* Listing Detail Modal */}
      <Modal
        isOpen={detailLoading || !!selectedListing || !!detailError}
        onClose={closeDetail}
        title="Listing Detail"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : detailError ? (
          <div className="text-center py-8 text-red-600">{detailError}</div>
        ) : selectedListing && (
          <div className="space-y-5">
            {/* Owner info + status */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedListing.userName || 'Anonymous'}
                </h2>
                {selectedListing.username && (
                  <p className="text-sm text-slate-400">@{selectedListing.username}</p>
                )}
              </div>
              <TradeStatusBadge status={selectedListing.status as 'OPEN' | 'MATCHED' | 'COMPLETED' | 'CANCELLED'} />
            </div>

            {/* Owner details */}
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
              {selectedListing.contactEmail && (
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="font-medium text-slate-700">{selectedListing.contactEmail}</p>
                </div>
              )}
              {selectedListing.phone && (
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-medium text-slate-700">{selectedListing.phone}</p>
                </div>
              )}
              {selectedListing.studentClass && (
                <div>
                  <p className="text-xs text-slate-400">Class</p>
                  <p className="font-medium text-slate-700">{selectedListing.studentClass}</p>
                </div>
              )}
              {selectedListing.studentId && (
                <div>
                  <p className="text-xs text-slate-400">Student ID</p>
                  <p className="font-medium text-slate-700">{selectedListing.studentId}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400">Posted</p>
                <p className="font-medium text-slate-700">{new Date(selectedListing.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Have courses */}
            {selectedListing.haveCourses.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-2">Courses to Trade Away</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.haveCourses.map((c) => (
                    <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" classCode={c.classCode} section={c.section} schedule={c.schedule} />
                  ))}
                </div>
              </div>
            )}

            {/* Want courses */}
            {selectedListing.wantCourses.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-2">Courses Wanted</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.wantCourses.map((c) => (
                    <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" classCode={c.classCode} section={c.section} schedule={c.schedule} />
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedListing.notes && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{selectedListing.notes}</p>
              </div>
            )}

            {/* Own listing actions */}
            {selectedListing.isOwn && selectedListing.status === 'OPEN' && (
              <div className="flex gap-3 border-t border-slate-100 pt-4">
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

            {/* Non-own listing hint */}
            {!selectedListing.isOwn && selectedListing.status === 'OPEN' && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  Want to trade? Create your own listing and find matches, or propose a trade from your listing page.
                </p>
              </div>
            )}

            {/* Matching listings */}
            {showMatches && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Matching Listings</h3>
                <MatchingListings listingId={selectedListing.id} />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Listing Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Listing"
        size="lg"
      >
        <p className="text-sm text-slate-500 mb-4">List the courses you have and want to trade.</p>
        <ListingForm onSubmit={handleCreate} />
      </Modal>
    </div>
  )
}
