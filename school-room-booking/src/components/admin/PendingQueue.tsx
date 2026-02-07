'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/bookings/StatusBadge'

interface Booking {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: string
  createdAt: string
  user: {
    fullName: string
    username: string
  }
  room: {
    name: string
    roomNumber: string
    floor: string
    building: string
  }
}

export default function PendingQueue() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings?status=PENDING')
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

  const handleApprove = async (id: string) => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/bookings/${id}/approve`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setBookings(bookings.filter((b) => b.id !== id))
      }
    } catch (error) {
      console.error('Error approving booking:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedBooking) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (res.ok) {
        setBookings(bookings.filter((b) => b.id !== selectedBooking.id))
        setShowRejectModal(false)
        setSelectedBooking(null)
        setRejectReason('')
      }
    } catch (error) {
      console.error('Error rejecting booking:', error)
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-gray-600">No pending requests</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white rounded-lg shadow p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {booking.title}
                  </h3>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <p>
                    <strong>User:</strong> {booking.user.fullName} (@{booking.user.username})
                  </p>
                  <p>
                    <strong>Room:</strong> {booking.room.building} - {booking.room.roomNumber}
                  </p>
                  <p>
                    <strong>Date:</strong> {formatDate(booking.startTime)}
                  </p>
                  <p>
                    <strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </p>
                </div>

                {booking.description && (
                  <p className="mt-2 text-sm text-gray-500">{booking.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={processing}
                  onClick={() => handleApprove(booking.id)}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setSelectedBooking(booking)
                    setShowRejectModal(true)
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setSelectedBooking(null)
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
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter reason for rejection..."
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowRejectModal(false)
              setSelectedBooking(null)
              setRejectReason('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={processing}
            onClick={handleReject}
          >
            Reject Booking
          </Button>
        </div>
      </Modal>
    </>
  )
}
