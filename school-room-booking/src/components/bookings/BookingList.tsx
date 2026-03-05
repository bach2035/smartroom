'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import BookingCard from './BookingCard'
import StatusBadge from './StatusBadge'
import AttachmentList from './AttachmentList'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Booking {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: string
  rejectReason: string | null
  createdAt?: string
  room: {
    name: string
    roomNumber: string
    floor: string
    building: string
  }
}

interface BookingDetail {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: string
  rejectReason: string | null
  createdAt: string
  room: {
    id: string
    name: string
    roomNumber: string
    capacity: number
    floor: string
    building: string
  }
  attachments: {
    id: string
    fileName: string
    fileSize: number
    mimeType: string | null
    createdAt: string
    url: string | null
  }[]
}

export default function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings/me')
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setBookings(
          bookings.map((b) =>
            b.id === id ? { ...b, status: 'CANCELLED' } : b
          )
        )
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
  }

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await fetch(`/api/bookings/${id}`)
      if (res.ok) {
        setDetail(await res.json())
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const openDetail = (id: string) => {
    setSelectedId(id)
    fetchDetail(id)
  }

  const closeDetail = () => {
    setSelectedId(null)
    setDetail(null)
  }

  const formatDate = (isoString: string) => {
    const d = new Date(isoString)
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' })
    const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d)
    return `${weekday}, ${parts}`
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok',
    })
  }

  const now = new Date()

  const buildings = useMemo(() => {
    const set = new Set<string>()
    bookings.forEach((b) => { if (b.room.building) set.add(b.room.building) })
    return Array.from(set).sort()
  }, [bookings])

  const filteredBookings = bookings.filter((b) => {
    // Status filter
    let statusMatch = true
    if (filter === 'upcoming') {
      statusMatch = new Date(b.startTime) > now && (b.status === 'PENDING' || b.status === 'APPROVED')
    } else if (filter === 'expired') {
      statusMatch = b.status === 'PENDING' && new Date(b.startTime) < now
    } else if (filter === 'completed') {
      statusMatch = b.status === 'APPROVED' && new Date(b.endTime) < now
    } else if (filter === 'PENDING') {
      statusMatch = b.status === 'PENDING' && new Date(b.startTime) > now
    } else if (filter === 'APPROVED') {
      statusMatch = b.status === 'APPROVED' && new Date(b.endTime) >= now
    } else if (filter !== 'all') {
      statusMatch = b.status === filter
    }
    if (!statusMatch) return false

    // Search filter (title, room name, room number)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        b.title.toLowerCase().includes(q) ||
        b.room.name.toLowerCase().includes(q) ||
        b.room.roomNumber.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    // Date filter
    if (dateFilter) {
      const bookingDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(b.startTime))
      if (bookingDate !== dateFilter) return false
    }

    // Building filter
    if (buildingFilter && b.room.building !== buildingFilter) return false

    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasActiveFilters = searchQuery || dateFilter || buildingFilter

  return (
    <div>
      {/* Search and filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by title or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
              >
                <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Date filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-colors"
          />

          {/* Building filter */}
          {buildings.length > 1 && (
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-colors"
            >
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchQuery(''); setDateFilter(''); setBuildingFilter('') }}
            className="text-xs text-red-700 hover:text-red-900 font-medium transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'all', label: 'All' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'expired', label: 'Expired' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'completed', label: 'Completed' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ].map((option) => (
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

      {filteredBookings.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {hasActiveFilters || filter !== 'all' ? (
            <>
              <p className="text-slate-600 font-medium mb-1">No bookings match your filters</p>
              <button
                onClick={() => { setFilter('all'); setSearchQuery(''); setDateFilter(''); setBuildingFilter('') }}
                className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium transition-colors"
              >
                Clear all filters
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-600 font-medium mb-1">No bookings yet</p>
              <p className="text-sm text-slate-400 mb-5">Book your first room in 3 easy steps:</p>
              <div className="inline-flex flex-col gap-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span className="text-sm text-slate-600">Browse the interactive floor map</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span className="text-sm text-slate-600">Select an available room and pick a time</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span className="text-sm text-slate-600">Submit your booking for admin approval</span>
                </div>
              </div>
              <div>
                <a href="/map" className="btn btn-primary">
                  Browse Rooms
                </a>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              onViewDetails={openDetail}
            />
          ))}
        </div>
      )}

      {/* Booking detail overlay */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeDetail}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeDetail}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors z-10"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detail ? (
              <>
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-3 flex-wrap pr-10">
                    <h2 className="text-xl font-semibold text-slate-900">{detail.title}</h2>
                    <StatusBadge status={detail.status} startTime={detail.startTime} endTime={detail.endTime} />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {detail.room.roomNumber} &middot; {detail.room.name}
                  </p>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Location</p>
                      <p className="text-slate-800 font-medium">{detail.room.building}</p>
                      <p className="text-slate-500 text-xs">{detail.room.floor} &middot; {detail.room.capacity} seats</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Date</p>
                      <p className="text-slate-800 font-medium">{formatDate(detail.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Time</p>
                      <p className="text-slate-800 font-medium font-mono">
                        {formatTime(detail.startTime)} &ndash; {formatTime(detail.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Submitted</p>
                      <p className="text-slate-800">
                        {formatTime(detail.createdAt)}, {formatDate(detail.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {detail.description && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{detail.description}</p>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {detail.status === 'REJECTED' && detail.rejectReason && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                          <p className="text-sm text-red-600 mt-0.5">{detail.rejectReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {detail.attachments.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Attachments</p>
                      <AttachmentList
                        bookingId={detail.id}
                        attachments={detail.attachments}
                        canDelete={false}
                        onDeleted={() => fetchDetail(detail.id)}
                      />
                    </div>
                  )}

                  {/* Cancel action */}
                  {(detail.status === 'PENDING' || detail.status === 'APPROVED') &&
                    new Date(detail.startTime) > new Date() && (
                    <div className="pt-2 border-t border-slate-100">
                      <Button
                        variant="danger"
                        onClick={() => {
                          closeDetail()
                          setCancelBookingId(detail.id)
                          setShowCancelModal(true)
                        }}
                        className="w-full"
                      >
                        Cancel Booking
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-500">
                Failed to load booking details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelBookingId(null) }}
        title="Cancel Booking"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Cancel this booking?</h3>
          {cancelBookingId && (() => {
            const b = bookings.find((x) => x.id === cancelBookingId)
            if (!b) return null
            return (
              <>
                <p className="text-slate-500 mb-1"><strong className="text-slate-700">{b.title}</strong></p>
                <p className="text-sm text-slate-400">{formatDate(b.startTime)}</p>
              </>
            )
          })()}
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => { setShowCancelModal(false); setCancelBookingId(null) }}
            className="flex-1"
          >
            Keep Booking
          </Button>
          <Button
            variant="danger"
            loading={cancelling}
            onClick={async () => {
              if (!cancelBookingId) return
              setCancelling(true)
              await handleCancel(cancelBookingId)
              setCancelling(false)
              setShowCancelModal(false)
              setCancelBookingId(null)
            }}
            className="flex-1"
          >
            Cancel Booking
          </Button>
        </div>
      </Modal>
    </div>
  )
}
