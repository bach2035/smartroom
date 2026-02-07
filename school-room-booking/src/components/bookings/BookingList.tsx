'use client'

import { useState, useEffect } from 'react'
import BookingCard from './BookingCard'

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

export default function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

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

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true
    if (filter === 'upcoming') {
      return (
        new Date(b.startTime) > new Date() &&
        (b.status === 'PENDING' || b.status === 'APPROVED')
      )
    }
    return b.status === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'all', label: 'All' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
