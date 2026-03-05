'use client'

import { useMemo, useState } from 'react'

interface TimelineBooking {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  userName: string
  hasConflict?: boolean
}

interface RoomTimelineProps {
  bookings: TimelineBooking[]
  date: string
  bookingNumbers?: Record<string, number>
  highlightedBookingId?: string | null
}

const START_HOUR = 7
const END_HOUR = 22
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60 // 900 minutes

function minutesFromStart(isoString: string, _date: string): number {
  const d = new Date(isoString)
  const parts = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }).split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  const totalMinutes = (hours - START_HOUR) * 60 + minutes
  return Math.max(0, Math.min(totalMinutes, TOTAL_MINUTES))
}

function hasTimeConflict(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string }
): boolean {
  return (
    new Date(a.startTime) < new Date(b.endTime) &&
    new Date(a.endTime) > new Date(b.startTime)
  )
}

export default function RoomTimeline({ bookings, date, bookingNumbers, highlightedBookingId }: RoomTimelineProps) {
  const [hoveredBooking, setHoveredBooking] = useState<string | null>(null)
  const activeHighlight = hoveredBooking || highlightedBookingId || null

  // Filter bookings for this date and compute conflicts
  const dateBookings = useMemo(() => {
    const filtered = bookings.filter((b) => {
      const bDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(b.startTime))
      return bDate === date
    })

    // Check for conflicts
    return filtered.map((booking) => {
      const conflicting = filtered.some(
        (other) => other.id !== booking.id && hasTimeConflict(booking, other)
      )
      return { ...booking, hasConflict: conflicting }
    })
  }, [bookings, date])

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  return (
    <div className="relative">
      {/* Timeline bar */}
      <div className="relative h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        {/* Hour grid lines */}
        {hours.map((hour) => {
          const left = ((hour - START_HOUR) * 60 / TOTAL_MINUTES) * 100
          return (
            <div
              key={hour}
              className="absolute top-0 bottom-0 w-px bg-slate-200"
              style={{ left: `${left}%` }}
            />
          )
        })}

        {/* Booking segments */}
        {dateBookings.map((booking) => {
          const startMin = minutesFromStart(booking.startTime, date)
          const endMin = minutesFromStart(booking.endTime, date)
          const left = (startMin / TOTAL_MINUTES) * 100
          const width = ((endMin - startMin) / TOTAL_MINUTES) * 100

          const expired = booking.status === 'PENDING' && new Date(booking.startTime) < new Date()
          let bgColor = ''
          if (expired) {
            bgColor = 'bg-slate-300'
          } else if (booking.hasConflict && booking.status === 'PENDING') {
            bgColor = 'bg-red-400'
          } else if (booking.status === 'PENDING') {
            bgColor = 'bg-amber-400'
          } else if (booking.status === 'APPROVED') {
            bgColor = 'bg-emerald-400'
          }

          const num = bookingNumbers?.[booking.id]

          return (
            <div
              key={booking.id}
              className={`absolute top-1 bottom-1 rounded ${bgColor} cursor-pointer transition-all flex items-center justify-center ${
                activeHighlight && activeHighlight !== booking.id
                  ? 'opacity-30'
                  : activeHighlight === booking.id
                    ? 'opacity-100 ring-2 ring-slate-800 ring-offset-1'
                    : 'opacity-90'
              }`}
              style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
              onMouseEnter={() => setHoveredBooking(booking.id)}
              onMouseLeave={() => setHoveredBooking(null)}
            >
              {/* Number label */}
              {num != null && (
                <span className="text-[10px] font-bold text-white drop-shadow-sm select-none">
                  {num}
                </span>
              )}
              {/* Tooltip */}
              {activeHighlight === booking.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 pointer-events-none">
                  <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <p className="font-medium">{num != null && `#${num} · `}{booking.title}</p>
                    <p className="text-slate-300">{booking.userName}</p>
                    <p className="text-slate-300">
                      {new Date(booking.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })}
                      {' - '}
                      {new Date(booking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Hour labels */}
      <div className="relative h-5 mt-1">
        {hours.filter((_, i) => i % 3 === 0 || _ === END_HOUR).map((hour) => {
          const left = ((hour - START_HOUR) * 60 / TOTAL_MINUTES) * 100
          return (
            <span
              key={hour}
              className="absolute text-[10px] text-slate-400 -translate-x-1/2"
              style={{ left: `${left}%` }}
            >
              {hour}:00
            </span>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-slate-100 border border-slate-200" /> Free
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-emerald-400" /> Approved
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-amber-400" /> Pending
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-slate-300" /> Expired
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-red-400" /> Conflict
        </span>
      </div>
    </div>
  )
}
