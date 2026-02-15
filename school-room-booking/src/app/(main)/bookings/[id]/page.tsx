'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/bookings/StatusBadge'
import AttachmentList from '@/components/bookings/AttachmentList'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

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

function formatDate(isoString: string) {
  const d = new Date(isoString)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' })
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d)
  return `${weekday}, ${parts}`
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  })
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`)
      if (res.ok) {
        setBooking(await res.json())
      } else {
        setError('Booking not found')
      }
    } catch {
      setError('Failed to load booking')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'PATCH' })
      if (res.ok) {
        setShowCancelModal(false)
        fetchBooking()
      }
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500 mb-4">{error || 'Booking not found'}</p>
        <Link href="/bookings" className="text-red-700 hover:text-red-800 font-medium text-sm">
          &larr; Back to My Bookings
        </Link>
      </div>
    )
  }

  const canCancel =
    (booking.status === 'PENDING' || booking.status === 'APPROVED') &&
    new Date(booking.startTime) > new Date()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to My Bookings
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-xl font-semibold text-slate-900">{booking.title}</h1>
                <StatusBadge status={booking.status} startTime={booking.startTime} endTime={booking.endTime} />
              </div>
              <p className="text-sm text-slate-500">
                {booking.room.roomNumber} &middot; {booking.room.name}
              </p>
            </div>
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Location</p>
              <p className="text-slate-800 font-medium">{booking.room.building}</p>
              <p className="text-slate-500 text-xs">{booking.room.floor} &middot; {booking.room.capacity} seats</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Date</p>
              <p className="text-slate-800 font-medium">{formatDate(booking.startTime)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Time</p>
              <p className="text-slate-800 font-medium font-mono">
                {formatTime(booking.startTime)} &ndash; {formatTime(booking.endTime)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Submitted</p>
              <p className="text-slate-800">
                {formatTime(booking.createdAt)}, {formatDate(booking.createdAt)}
              </p>
            </div>
          </div>

          {/* Description */}
          {booking.description && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{booking.description}</p>
            </div>
          )}

          {/* Rejection reason */}
          {booking.status === 'REJECTED' && booking.rejectReason && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                  <p className="text-sm text-red-600 mt-0.5">{booking.rejectReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Attachments</p>
            {booking.attachments.length > 0 ? (
              <AttachmentList
                bookingId={booking.id}
                attachments={booking.attachments}
                canDelete={booking.status === 'PENDING'}
                onDeleted={fetchBooking}
              />
            ) : (
              <p className="text-sm text-slate-400 italic">No attachments</p>
            )}
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Cancel this booking?</h3>
          <p className="text-slate-500 mb-1">
            <strong className="text-slate-700">{booking.title}</strong>
          </p>
          <p className="text-sm text-slate-400">{formatDate(booking.startTime)}</p>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowCancelModal(false)}
            className="flex-1"
          >
            Keep Booking
          </Button>
          <Button
            variant="danger"
            loading={cancelling}
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel Booking
          </Button>
        </div>
      </Modal>
    </div>
  )
}
