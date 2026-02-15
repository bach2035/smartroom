'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/bookings/StatusBadge'

interface RoomBooking {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  userName: string
}

interface AdminRoomPanelProps {
  roomId: string
  roomName: string
  roomNumber: string
  capacity: number
  bookings: RoomBooking[]
  onClose: () => void
  onBookingAction: () => void
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' })
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })
  return `${weekday}, ${parts} ${time}`
}

export default function AdminRoomPanel({
  roomId,
  roomName,
  roomNumber,
  capacity,
  bookings,
  onClose,
  onBookingAction,
}: AdminRoomPanelProps) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectBookingId, setRejectBookingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [flash, setFlash] = useState<string | null>(null)

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !showRejectModal) onClose()
  }, [onClose, showRejectModal])

  useEffect(() => {
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [handleEscape])

  useEffect(() => {
    if (flash) {
      const t = setTimeout(() => setFlash(null), 2000)
      return () => clearTimeout(t)
    }
  }, [flash])

  const handleApprove = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/bookings/${id}/approve`, { method: 'PATCH' })
      if (res.ok) {
        setFlash('Booking approved')
        onBookingAction()
      }
    } catch (error) {
      console.error('Error approving booking:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async () => {
    if (!rejectBookingId) return
    setProcessing(rejectBookingId)
    try {
      const res = await fetch(`/api/admin/bookings/${rejectBookingId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (res.ok) {
        setShowRejectModal(false)
        setRejectBookingId(null)
        setRejectReason('')
        setFlash('Booking rejected')
        onBookingAction()
      }
    } catch (error) {
      console.error('Error rejecting booking:', error)
    } finally {
      setProcessing(null)
    }
  }

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING')
  const otherBookings = bookings.filter((b) => b.status !== 'PENDING')

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{roomNumber}</h3>
            <p className="text-sm text-gray-500">{roomName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{capacity} seats</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Flash message */}
        {flash && (
          <div className="mb-3 px-3 py-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200 animate-fade-in">
            {flash}
          </div>
        )}

        {/* Bookings list */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No bookings for this room</p>
            </div>
          ) : (
            <>
              {/* Pending bookings first */}
              {pendingBookings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                    Pending Approval ({pendingBookings.length})
                  </p>
                  {pendingBookings.map((booking) => (
                    <div key={booking.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm truncate">{booking.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">by {booking.userName}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {formatDateTime(booking.startTime)} - {new Date(booking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </p>
                        </div>
                        <StatusBadge status={booking.status} startTime={booking.startTime} />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={processing === booking.id}
                          onClick={() => handleApprove(booking.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={processing === booking.id}
                          onClick={() => {
                            setRejectBookingId(booking.id)
                            setShowRejectModal(true)
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Other bookings */}
              {otherBookings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Other Bookings ({otherBookings.length})
                  </p>
                  {otherBookings.map((booking) => (
                    <div key={booking.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm truncate">{booking.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">by {booking.userName}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {formatDateTime(booking.startTime)} - {new Date(booking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </p>
                        </div>
                        <StatusBadge status={booking.status} startTime={booking.startTime} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Link to room details */}
        <a
          href={`/room/${roomId}`}
          className="mt-3 block text-center text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
        >
          View room details &rarr;
        </a>
      </div>

      {/* Reject modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setRejectBookingId(null)
          setRejectReason('')
        }}
        title="Reject Booking"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to reject this booking request?
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason (optional)
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="Enter reason for rejection..."
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowRejectModal(false)
              setRejectBookingId(null)
              setRejectReason('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={processing !== null}
            onClick={handleReject}
          >
            Reject Booking
          </Button>
        </div>
      </Modal>
    </>
  )
}
