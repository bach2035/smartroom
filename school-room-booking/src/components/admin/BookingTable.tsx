'use client'

import { useState, useEffect, useCallback } from 'react'
import StatusBadge from '@/components/bookings/StatusBadge'
import AttachmentList from '@/components/bookings/AttachmentList'

interface Booking {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  createdAt: string
  user: {
    fullName: string
    username: string
  }
  room: {
    roomNumber: string
    building: string
  }
  approver: string | null
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

export default function BookingTable() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const apiFilter = filter === 'expired' ? 'PENDING' : filter
      const url = apiFilter === 'all'
        ? '/api/admin/bookings'
        : `/api/admin/bookings?status=${apiFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const data: Booking[] = await res.json()
        if (filter === 'expired') {
          setBookings(data.filter((b) => new Date(b.startTime) < new Date()))
        } else if (filter === 'PENDING') {
          setBookings(data.filter((b) => new Date(b.startTime) >= new Date()))
        } else {
          setBookings(data)
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
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

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'all', label: 'All' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'expired', label: 'Expired' },
          { value: 'APPROVED', label: 'Approved' },
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No bookings found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(booking.id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        Submitted {formatDate(booking.createdAt)} at {formatTime(booking.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.user.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        @{booking.user.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.room.building} - {booking.room.roomNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.startTime)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={booking.status} startTime={booking.startTime} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetail(booking.id) }}
                        className="text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
                      >
                        View details &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  )
}
