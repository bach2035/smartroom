'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/bookings/StatusBadge'
import RoomTimeline from '@/components/admin/RoomTimeline'
import AttachmentList from '@/components/bookings/AttachmentList'

interface TriageBooking {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: string
  userName: string
  userUsername: string
  createdAt: string
}

interface TriageRoom {
  roomId: string
  roomName: string
  roomNumber: string
  capacity: number
  building: string
  floor: string
  pendingCount: number
  pendingDates: string[]
  bookings: TriageBooking[]
}

interface TriageData {
  rooms: TriageRoom[]
  totalPending: number
}

function isExpired(booking: TriageBooking): boolean {
  return new Date(booking.startTime) < new Date()
}

function hasConflict(a: TriageBooking, b: TriageBooking): boolean {
  return (
    new Date(a.startTime) < new Date(b.endTime) &&
    new Date(a.endTime) > new Date(b.startTime)
  )
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00+07:00')
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' })
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d)
  return `${weekday}, ${parts}`
}

function getRoomCounts(room: TriageRoom) {
  const pendingAll = room.bookings.filter((b) => b.status === 'PENDING')
  const expired = pendingAll.filter(isExpired).length
  const pending = pendingAll.length - expired
  return { pending, expired }
}

export default function PendingTriage() {
  const [data, setData] = useState<TriageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveBookingId, setApproveBookingId] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectBookingId, setRejectBookingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null)
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null)
  const [detailAttachments, setDetailAttachments] = useState<{ id: string; fileName: string; fileSize: number; mimeType: string | null; createdAt: string; url: string | null }[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bookings/pending-by-room')
      if (res.ok) {
        const result: TriageData = await res.json()
        setData(result)

        // Auto-select logic
        if (result.rooms.length > 0) {
          setSelectedRoomId((prev) => {
            const stillExists = result.rooms.find((r) => r.roomId === prev)
            if (stillExists) return prev
            return result.rooms[0].roomId
          })
        } else {
          setSelectedRoomId(null)
          setSelectedDate(null)
        }
      }
    } catch (error) {
      console.error('Error fetching triage data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-select first date when room changes
  const selectedRoom = data?.rooms.find((r) => r.roomId === selectedRoomId) || null

  useEffect(() => {
    if (selectedRoom) {
      setSelectedDate((prev) => {
        if (prev && selectedRoom.pendingDates.includes(prev)) return prev
        return selectedRoom.pendingDates[0] || null
      })
    }
  }, [selectedRoom])

  // Close detail overlay on Escape
  useEffect(() => {
    if (!detailBookingId) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailBookingId(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [detailBookingId])

  // Fetch attachments when detail overlay opens
  const fetchAttachments = useCallback(async (bookingId: string) => {
    setAttachmentsLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/attachments`)
      if (res.ok) {
        const raw = await res.json()
        setDetailAttachments(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          raw.map((a: any) => ({
            id: a.id,
            fileName: a.file_name,
            fileSize: a.file_size,
            mimeType: a.mime_type,
            createdAt: a.created_at,
            url: a.url || null,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    } finally {
      setAttachmentsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (detailBookingId) {
      fetchAttachments(detailBookingId)
    } else {
      setDetailAttachments([])
    }
  }, [detailBookingId, fetchAttachments])

  // Global counts
  const { totalPending, totalExpired } = useMemo(() => {
    if (!data) return { totalPending: 0, totalExpired: 0 }
    let pending = 0
    let expired = 0
    for (const room of data.rooms) {
      const counts = getRoomCounts(room)
      pending += counts.pending
      expired += counts.expired
    }
    return { totalPending: pending, totalExpired: expired }
  }, [data])

  const confirmApprove = async () => {
    if (!approveBookingId) return
    setProcessingId(approveBookingId)
    try {
      const res = await fetch(`/api/admin/bookings/${approveBookingId}/approve`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setShowApproveModal(false)
        setApproveBookingId(null)
        await fetchData()
      }
    } catch (error) {
      console.error('Error approving booking:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectBookingId) return
    setProcessingId(rejectBookingId)
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
        await fetchData()
      }
    } catch (error) {
      console.error('Error rejecting booking:', error)
    } finally {
      setProcessingId(null)
    }
  }

  // Get bookings for the selected date
  const dateBookings = selectedRoom?.bookings.filter((b) => {
    const bDate = new Date(b.startTime).toISOString().split('T')[0]
    return bDate === selectedDate
  }) || []

  // Split PENDING bookings into active pending vs expired
  const allPendingOnDate = dateBookings.filter((b) => b.status === 'PENDING')
  const pendingBookings = allPendingOnDate.filter((b) => !isExpired(b))
  const expiredBookings = allPendingOnDate.filter((b) => isExpired(b))
  const approvedBookings = dateBookings.filter((b) => b.status === 'APPROVED')

  // Assign numbers to pending bookings on the selected date (sorted by start time, then created time)
  const bookingNumbers = useMemo(() => {
    const map: Record<string, number> = {}
    const pendingOnDate = [...allPendingOnDate].sort((a, b) => {
      const timeCmp = new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      if (timeCmp !== 0) return timeCmp
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
    pendingOnDate.forEach((b, i) => {
      map[b.id] = i + 1
    })
    return map
  }, [allPendingOnDate])

  // Find conflicts for a specific booking
  const getConflicts = (booking: TriageBooking): TriageBooking[] => {
    return dateBookings.filter(
      (other) => other.id !== booking.id && hasConflict(booking, other)
    )
  }

  // Check if a room has any conflicts
  const roomHasConflicts = (room: TriageRoom): boolean => {
    for (let i = 0; i < room.bookings.length; i++) {
      for (let j = i + 1; j < room.bookings.length; j++) {
        if (hasConflict(room.bookings[i], room.bookings[j])) return true
      }
    }
    return false
  }

  // Group rooms by building
  const roomsByBuilding = data?.rooms.reduce<Record<string, TriageRoom[]>>((acc, room) => {
    if (!acc[room.building]) acc[room.building] = []
    acc[room.building].push(room)
    return acc
  }, {}) || {}

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data || data.rooms.length === 0) {
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
        <p className="text-lg font-medium text-gray-800">All caught up!</p>
        <p className="text-gray-500 mt-1">No pending requests to review</p>
      </div>
    )
  }

  // Renders a single booking card (used for both pending and expired sections)
  const renderBookingCard = (booking: TriageBooking, expired: boolean) => {
    const conflicts = getConflicts(booking)
    const num = bookingNumbers[booking.id]
    return (
      <div
        key={booking.id}
        onClick={() => setDetailBookingId(booking.id)}
        onMouseEnter={() => setHoveredBookingId(booking.id)}
        onMouseLeave={() => setHoveredBookingId(null)}
        className={`p-4 rounded-lg border cursor-pointer transition-shadow hover:shadow-md ${
          expired
            ? 'border-slate-200 bg-slate-50 opacity-75'
            : conflicts.length > 0
              ? 'border-amber-200 bg-amber-50/50'
              : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {num != null && (
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shrink-0 ${
                  expired ? 'bg-slate-400' : conflicts.length > 0 ? 'bg-red-400' : 'bg-amber-500'
                }`}>
                  {num}
                </span>
              )}
              <span className={`font-medium ${expired ? 'text-slate-500' : 'text-slate-900'}`}>
                {booking.title}
              </span>
              <StatusBadge status={booking.status} startTime={booking.startTime} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {booking.userName} (@{booking.userUsername})
            </p>
            <p className={`text-sm mt-1 font-mono ${expired ? 'text-slate-400' : 'text-slate-600'}`}>
              {formatTime(booking.startTime)} &ndash; {formatTime(booking.endTime)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Submitted {formatTime(booking.createdAt)}, {formatDate(booking.createdAt.split('T')[0])}
            </p>
            {booking.description && (
              <p className="text-sm text-slate-500 mt-1">{booking.description}</p>
            )}

            {/* Conflict warnings */}
            {!expired && conflicts.length > 0 && (
              <div className="mt-2 space-y-1">
                {conflicts.map((c) => (
                  <p key={c.id} className="text-xs text-amber-700 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Overlaps with &ldquo;{c.title}&rdquo; ({formatTime(c.startTime)}&ndash;{formatTime(c.endTime)})
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {!expired && (
              <Button
                variant="primary"
                size="sm"
                loading={processingId === booking.id}
                onClick={() => { setApproveBookingId(booking.id); setShowApproveModal(true) }}
              >
                Approve
              </Button>
            )}
            <Button
              variant={expired ? 'secondary' : 'danger'}
              size="sm"
              disabled={processingId === booking.id}
              onClick={() => {
                setRejectBookingId(booking.id)
                setShowRejectModal(true)
              }}
            >
              Reject
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-6 h-full">
        {/* Left Panel — Room List */}
        <div className="w-72 shrink-0 bg-white rounded-lg shadow overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
            <p className="text-sm font-medium text-slate-500">
              {totalPending} pending{totalExpired > 0 && ` · ${totalExpired} expired`}
            </p>
          </div>

          <div className="p-2">
            {Object.entries(roomsByBuilding).map(([building, rooms]) => (
              <div key={building} className="mb-3">
                <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {building}
                </p>
                {rooms.map((room) => {
                  const isActive = room.roomId === selectedRoomId
                  const conflicts = roomHasConflicts(room)
                  const counts = getRoomCounts(room)
                  return (
                    <button
                      key={room.roomId}
                      onClick={() => setSelectedRoomId(room.roomId)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        isActive
                          ? 'bg-red-50 text-red-800 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{room.roomNumber}</span>
                        {conflicts && (
                          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {counts.pending > 0 && (
                          <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${
                            isActive ? 'bg-red-200 text-red-800' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {counts.pending}
                          </span>
                        )}
                        {counts.expired > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium bg-slate-200 text-slate-500">
                            {counts.expired}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Room Detail */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {selectedRoom ? (
            <div className="p-6 flex flex-col flex-1 min-h-0">
              {/* Room Header */}
              <div className="mb-6 shrink-0">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedRoom.roomName}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedRoom.building} &middot; {selectedRoom.floor} &middot; {selectedRoom.capacity} seats
                </p>
              </div>

              {/* Date Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap shrink-0">
                {selectedRoom.pendingDates.map((date) => {
                  const isActive = date === selectedDate
                  const dateIsExpired = new Date(date + 'T23:59:59') < new Date()
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? dateIsExpired ? 'bg-slate-600 text-white' : 'bg-red-700 text-white'
                          : dateIsExpired ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {formatDate(date)}
                      {dateIsExpired && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Timeline */}
              {selectedDate && (
                <div className="mb-6 shrink-0">
                  <RoomTimeline bookings={selectedRoom.bookings} date={selectedDate} bookingNumbers={bookingNumbers} highlightedBookingId={hoveredBookingId} />
                </div>
              )}

              {/* Pending Requests — scrollable, fills remaining space */}
              {pendingBookings.length > 0 && (
                <div className="flex-1 min-h-0 flex flex-col mb-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 shrink-0">
                    Pending Requests
                  </h3>
                  <div className="flex-1 min-h-0 overflow-y-scroll space-y-3 pr-1">
                    {pendingBookings.map((booking) => renderBookingCard(booking, false))}
                  </div>
                </div>
              )}

              {/* Expired Requests */}
              {expiredBookings.length > 0 && (
                <div className="mb-4 shrink-0">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Expired Requests
                  </h3>
                  <div className="space-y-3">
                    {expiredBookings.map((booking) => renderBookingCard(booking, true))}
                  </div>
                </div>
              )}

              {/* Approved Bookings */}
              {approvedBookings.length > 0 && (
                <div className="shrink-0">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Approved Bookings
                  </h3>
                  <div className="space-y-2">
                    {approvedBookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => setDetailBookingId(booking.id)}
                        onMouseEnter={() => setHoveredBookingId(booking.id)}
                        onMouseLeave={() => setHoveredBookingId(null)}
                        className="p-3 rounded-lg border border-slate-100 bg-slate-50 cursor-pointer transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-slate-700">{booking.title}</span>
                            <span className="text-sm text-slate-400 ml-2">
                              {booking.userName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 font-mono">
                              {formatTime(booking.startTime)} &ndash; {formatTime(booking.endTime)}
                            </span>
                            <StatusBadge status={booking.status} startTime={booking.startTime} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No bookings on selected date */}
              {dateBookings.length === 0 && selectedDate && (
                <p className="text-sm text-slate-400 text-center py-8">
                  No bookings on this date
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Select a room to review
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Overlay */}
      {detailBookingId && (() => {
        const booking = data?.rooms
          .flatMap((r) => r.bookings.map((b) => ({ ...b, roomName: r.roomName, roomNumber: r.roomNumber, building: r.building, floor: r.floor })))
          .find((b) => b.id === detailBookingId)

        if (!booking) return null

        const expired = isExpired(booking)

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setDetailBookingId(null)}
          >
            {/* Semi-transparent backdrop */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Detail card */}
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between rounded-t-xl">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 truncate">{booking.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {booking.roomNumber} &middot; {booking.roomName}
                  </p>
                </div>
                <button
                  onClick={() => setDetailBookingId(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-2 shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <StatusBadge status={booking.status} startTime={booking.startTime} />
                  {expired && booking.status === 'PENDING' && (
                    <span className="text-xs text-slate-400 italic">Start time has passed</span>
                  )}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Requested by</p>
                    <p className="text-slate-800 font-medium">{booking.userName}</p>
                    <p className="text-slate-500 text-xs">@{booking.userUsername}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Location</p>
                    <p className="text-slate-800 font-medium">{booking.building}</p>
                    <p className="text-slate-500 text-xs">{booking.floor}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Date</p>
                    <p className="text-slate-800 font-medium">{formatDate(booking.startTime.split('T')[0])}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Time</p>
                    <p className="text-slate-800 font-medium font-mono">
                      {formatTime(booking.startTime)} &ndash; {formatTime(booking.endTime)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Submitted</p>
                    <p className="text-slate-800">
                      {formatTime(booking.createdAt)}, {formatDate(booking.createdAt.split('T')[0])}
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

                {/* Attachments */}
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Attachments</p>
                  {attachmentsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : detailAttachments.length > 0 ? (
                    <AttachmentList
                      bookingId={detailBookingId}
                      attachments={detailAttachments}
                      canDelete={false}
                      onDeleted={() => fetchAttachments(detailBookingId)}
                    />
                  ) : (
                    <p className="text-sm text-slate-400 italic">No attachments</p>
                  )}
                </div>

                {/* Action buttons for pending bookings */}
                {booking.status === 'PENDING' && (
                  <div className="flex gap-3 pt-2 border-t border-slate-100">
                    {!expired && (
                      <Button
                        variant="primary"
                        className="flex-1"
                        loading={processingId === booking.id}
                        onClick={() => {
                          setDetailBookingId(null)
                          setApproveBookingId(booking.id)
                          setShowApproveModal(true)
                        }}
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      className={expired ? 'flex-1' : ''}
                      disabled={processingId === booking.id}
                      onClick={() => {
                        setDetailBookingId(null)
                        setRejectBookingId(booking.id)
                        setShowRejectModal(true)
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false)
          setApproveBookingId(null)
        }}
        title="Approve Booking"
      >
        {(() => {
          const booking = data?.rooms
            .flatMap((r) => r.bookings.map((b) => ({ ...b, roomName: r.roomName, roomNumber: r.roomNumber })))
            .find((b) => b.id === approveBookingId)
          if (!booking) return null
          return (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to approve this booking request?
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-sm">
                <p className="font-medium text-slate-800">{booking.title}</p>
                <p className="text-slate-500 mt-0.5">{booking.userName} &middot; {booking.roomNumber} {booking.roomName}</p>
                <p className="text-slate-500 font-mono mt-0.5">
                  {formatTime(booking.startTime)} &ndash; {formatTime(booking.endTime)}, {formatDate(booking.startTime.split('T')[0])}
                </p>
              </div>
            </>
          )
        })()}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowApproveModal(false)
              setApproveBookingId(null)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={processingId !== null}
            onClick={confirmApprove}
          >
            Approve Booking
          </Button>
        </div>
      </Modal>

      {/* Reject Modal */}
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
            loading={processingId !== null}
            onClick={handleReject}
          >
            Reject Booking
          </Button>
        </div>
      </Modal>
    </>
  )
}
