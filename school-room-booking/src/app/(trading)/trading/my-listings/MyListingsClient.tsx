'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { TradeListing } from '@/types'
import ListingCard from '@/components/trading/ListingCard'
import CourseTag from '@/components/trading/CourseTag'
import TradeStatusBadge from '@/components/trading/TradeStatusBadge'
import MatchingListings from '@/components/trading/MatchingListings'
import ListingForm from '@/components/trading/ListingForm'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

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

export default function MyListingsClient() {
  const [listings, setListings] = useState<TradeListing[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  // Modal state
  const [selectedListing, setSelectedListing] = useState<ListingDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [showMatches, setShowMatches] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Confirm modal
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/trading/listings/me')
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchListings()
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
      }
    } catch {
      setDetailError('Network error')
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
    showToast('Listing created successfully!')
    fetchListings()
  }

  const handleEdit = async (data: { notes: string; haveCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[]; wantCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[] }) => {
    if (!selectedListing) return
    const res = await fetch(`/api/trading/listings/${selectedListing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: data.notes,
        haveCourses: data.haveCourses.map((c) => ({ ...c, credits: c.credits ? parseInt(c.credits) : null })),
        wantCourses: data.wantCourses.map((c) => ({ ...c, credits: c.credits ? parseInt(c.credits) : null })),
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to update listing')
    }
    setShowEditModal(false)
    showToast('Listing updated successfully!')
    openDetail(selectedListing.id)
    fetchListings()
  }

  const handleCancel = async () => {
    if (!selectedListing) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/trading/listings/${selectedListing.id}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmCancel(false)
        setSelectedListing(null)
        showToast('Listing cancelled')
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
          <Link href="/trading" className="text-sm text-slate-500 hover:text-slate-700">
            &larr; Back to Trading
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">My Listings</h1>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + New Listing
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-600 font-medium mb-1">No listings yet</p>
          <p className="text-sm text-slate-400 mb-4">Create your first listing to start trading courses.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} showStatus onClick={() => openDetail(listing.id)} />
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
                  onClick={() => setShowEditModal(true)}
                  className="btn btn-secondary"
                >
                  Edit Listing
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="btn btn-secondary text-red-600 hover:text-red-700"
                >
                  Cancel Listing
                </button>
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

      {/* Edit Listing Modal */}
      {selectedListing && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Listing"
          size="lg"
        >
          <ListingForm
            initialNotes={selectedListing.notes || ''}
            initialHaveCourses={selectedListing.haveCourses.map((c) => ({
              courseName: c.courseName,
              courseCode: c.courseCode,
              classCode: c.classCode || '',
              section: c.section || '',
              schedule: c.schedule || '',
              credits: c.credits?.toString() || '',
            }))}
            initialWantCourses={selectedListing.wantCourses.map((c) => ({
              courseName: c.courseName,
              courseCode: c.courseCode,
              classCode: c.classCode || '',
              section: c.section || '',
              schedule: c.schedule || '',
              credits: c.credits?.toString() || '',
            }))}
            onSubmit={handleEdit}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

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

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Cancel Listing"
        message="This will cancel your listing and it cannot be undone. Any pending matches will also be affected."
        confirmLabel="Cancel Listing"
        confirmVariant="danger"
        loading={cancelling}
      />
    </div>
  )
}
