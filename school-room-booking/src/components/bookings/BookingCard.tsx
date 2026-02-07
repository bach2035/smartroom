'use client'

import { useState } from 'react'
import StatusBadge from './StatusBadge'
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
  room: {
    name: string
    roomNumber: string
    floor: string
    building: string
  }
}

interface BookingCardProps {
  booking: Booking
  onCancel: (id: string) => Promise<void>
}

export default function BookingCard({ booking, onCancel }: BookingCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const canCancel =
    (booking.status === 'PENDING' || booking.status === 'APPROVED') &&
    new Date(booking.startTime) > new Date()

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await onCancel(booking.id)
      setShowCancelModal(false)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <h3 className="text-lg font-semibold text-slate-800">{booking.title}</h3>
              <StatusBadge status={booking.status} />
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-800 font-medium">{booking.room.name}</p>
                  <p className="text-slate-500 text-xs">{booking.room.building} - Room {booking.room.roomNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-800 font-medium">{formatDate(booking.startTime)}</p>
                  <p className="text-slate-500 text-xs">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {booking.description && (
              <p className="mt-3 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                {booking.description}
              </p>
            )}

            {/* Rejection reason */}
            {booking.status === 'REJECTED' && booking.rejectReason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
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
          </div>

          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          )}
        </div>
      </div>

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
    </>
  )
}
