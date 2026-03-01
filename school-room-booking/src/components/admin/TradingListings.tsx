'use client'

import { useState, useEffect, useCallback } from 'react'
import CourseTag from '@/components/trading/CourseTag'
import TradeStatusBadge from '@/components/trading/TradeStatusBadge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { TradeListingStatus, TradeMatchStatus } from '@/types'

interface CourseInfo {
  id: string
  courseName: string
  courseCode: string
  classCode?: string | null
  section?: string | null
  schedule?: string | null
  credits?: number | null
  type: string
}

interface ListingUser {
  id: string
  fullName: string
  username: string
  email: string
  studentClass: string | null
  studentId: string | null
}

interface Listing {
  id: string
  status: TradeListingStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  user: ListingUser | null
  haveCourses: CourseInfo[]
  wantCourses: CourseInfo[]
}

interface ListingDetail extends Listing {
  matches: {
    id: string
    status: TradeMatchStatus
    initiatedBy: string
    createdAt: string
    userA: { fullName: string; username: string } | null
    userB: { fullName: string; username: string } | null
  }[]
}

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'MATCHED', label: 'Matched' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function TradingListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<ListingDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/trading/listings?${params}`)
      if (res.ok) setListings(await res.json())
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    const timeout = setTimeout(fetchListings, search ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [fetchListings, search])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    setSelectedDetail(null)
    try {
      const res = await fetch(`/api/admin/trading/listings/${id}`)
      if (res.ok) setSelectedDetail(await res.json())
    } catch (error) {
      console.error('Error fetching listing detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const cancelListing = async () => {
    if (!selectedDetail) return
    setCancelLoading(true)
    try {
      const res = await fetch(`/api/admin/trading/listings/${selectedDetail.id}`, { method: 'PATCH' })
      if (res.ok) {
        setSelectedDetail(null)
        fetchListings()
      }
    } catch (error) {
      console.error('Error cancelling listing:', error)
    } finally {
      setCancelLoading(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-red-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search user or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:ml-auto sm:w-64"
        />
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No listings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <button
              key={listing.id}
              onClick={() => openDetail(listing.id)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span className="font-semibold text-slate-800">
                      {listing.user?.fullName || 'Unknown'}
                    </span>
                    <span className="text-sm text-slate-400">@{listing.user?.username}</span>
                    <TradeStatusBadge status={listing.status} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {listing.haveCourses.map(c => (
                      <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" classCode={c.classCode} />
                    ))}
                    {listing.wantCourses.map(c => (
                      <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" classCode={c.classCode} />
                    ))}
                  </div>
                  {listing.notes && (
                    <p className="text-sm text-slate-500 line-clamp-2">{listing.notes}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatDate(listing.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={detailLoading || !!selectedDetail}
        onClose={() => { if (!detailLoading) setSelectedDetail(null) }}
        title="Listing Detail"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedDetail && (
          <div className="space-y-5">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Name</p>
                <p className="font-medium text-slate-800">{selectedDetail.user?.fullName || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Username</p>
                <p className="font-medium text-slate-800">@{selectedDetail.user?.username || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Email</p>
                <p className="font-medium text-slate-800">{selectedDetail.user?.email || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Class / Student ID</p>
                <p className="font-medium text-slate-800">
                  {selectedDetail.user?.studentClass || '—'} / {selectedDetail.user?.studentId || '—'}
                </p>
              </div>
            </div>

            {/* Courses */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Courses</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedDetail.haveCourses.map(c => (
                  <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" classCode={c.classCode} section={c.section} schedule={c.schedule} />
                ))}
                {selectedDetail.wantCourses.map(c => (
                  <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" classCode={c.classCode} section={c.section} schedule={c.schedule} />
                ))}
              </div>
            </div>

            {/* Notes & timestamps */}
            {selectedDetail.notes && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{selectedDetail.notes}</p>
              </div>
            )}
            <div className="flex gap-4 text-xs text-slate-400">
              <span>Created: {formatDate(selectedDetail.createdAt)}</span>
              <span>Updated: {formatDate(selectedDetail.updatedAt)}</span>
              <span className="ml-auto">
                <TradeStatusBadge status={selectedDetail.status} />
              </span>
            </div>

            {/* Related Matches */}
            {selectedDetail.matches.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Related Matches</p>
                <div className="space-y-2">
                  {selectedDetail.matches.map(m => (
                    <div key={m.id} className="flex items-center gap-3 text-sm bg-slate-50 rounded-xl px-3 py-2">
                      <span className="text-slate-700">{m.userA?.fullName || '?'}</span>
                      <span className="text-slate-400">↔</span>
                      <span className="text-slate-700">{m.userB?.fullName || '?'}</span>
                      <TradeStatusBadge status={m.status} />
                      <span className="text-xs text-slate-400 ml-auto">{formatDate(m.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel action */}
            {selectedDetail.status === 'OPEN' && (
              <div className="pt-2 border-t border-slate-100">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={cancelListing}
                  loading={cancelLoading}
                >
                  Force Cancel Listing
                </Button>
                <p className="text-xs text-slate-400 mt-1">
                  This will cancel the listing and reject all pending matches.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
