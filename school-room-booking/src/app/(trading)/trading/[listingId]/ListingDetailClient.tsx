'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  listingType: 'TRADE' | 'GIVEAWAY'
  status: string
  notes: string | null
  createdAt: string
  userName: string | null
  contactEmail: string | null
  studentClass: string | null
  isOwn: boolean
  haveCourses: { id: string; courseCode: string; courseName: string; classCode: string | null; section: string | null; schedule: string | null; credits: number | null; type: string }[]
  wantCourses: { id: string; courseCode: string; courseName: string; classCode: string | null; section: string | null; schedule: string | null; credits: number | null; type: string }[]
}

export default function ListingDetailClient({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMatches, setShowMatches] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { showToast } = useToast()

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
    setCancelling(true)
    try {
      const res = await fetch(`/api/trading/listings/${listingId}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Listing cancelled')
        router.push('/trading/my-listings')
      }
    } finally {
      setCancelling(false)
      setConfirmCancel(false)
    }
  }

  async function handleEdit(data: { notes: string; haveCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[]; wantCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[] }) {
    const res = await fetch(`/api/trading/listings/${listingId}`, {
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
    fetchListing()
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
            <h2 className="text-sm font-semibold text-green-700 mb-2">{listing.listingType === 'GIVEAWAY' ? 'Course to Give Away' : 'Courses to Trade Away'}</h2>
            <div className="flex flex-wrap gap-2">
              {listing.haveCourses.map((c) => (
                <CourseTag
                  key={c.id}
                  courseCode={c.courseCode}
                  courseName={c.courseName}
                  type="HAVE"
                  classCode={c.classCode}
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
                  classCode={c.classCode}
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
            {listing.listingType !== 'GIVEAWAY' && (
              <button
                onClick={() => setShowMatches(!showMatches)}
                className="btn btn-primary"
              >
                {showMatches ? 'Hide Matches' : 'Find Matches'}
              </button>
            )}
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

        {!listing.isOwn && listing.status === 'OPEN' && (
          <div className="mt-6 border-t pt-4">
            <p className="text-sm text-slate-500">
              {listing.listingType === 'GIVEAWAY'
                ? 'Interested? Browse giveaways on the trading page and request this course directly.'
                : 'Want to trade? Create your own listing and find matches, or propose a trade from your listing page.'}
            </p>
          </div>
        )}
      </div>

      {showMatches && listing.listingType !== 'GIVEAWAY' && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Matching Listings</h2>
          <MatchingListings listingId={listingId} listingType={listing?.listingType} />
        </div>
      )}

      {/* Edit Listing Modal */}
      {listing && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Listing"
          size="lg"
        >
          <ListingForm
            initialNotes={listing.notes || ''}
            initialListingType={listing.listingType}
            initialHaveCourses={listing.haveCourses.map((c) => ({
              courseName: c.courseName,
              courseCode: c.courseCode,
              classCode: c.classCode || '',
              section: c.section || '',
              schedule: c.schedule || '',
              credits: c.credits?.toString() || '',
            }))}
            initialWantCourses={listing.wantCourses.map((c) => ({
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
