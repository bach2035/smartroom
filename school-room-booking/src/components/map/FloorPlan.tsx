'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useMapStore } from '@/store/mapStore'

interface RoomBooking {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  userName: string
}

interface RoomAvailability {
  roomId: string
  svgElementId: string
  isBooked: boolean
  bookings: RoomBooking[]
}

interface FloorPlanProps {
  svgPath: string
  rooms: RoomAvailability[]
  isAdmin?: boolean
  onAdminRoomSelect?: (room: RoomAvailability) => void
}

interface PopupState {
  roomId: string
  svgElementId: string
  bookings: RoomBooking[]
  x: number
  y: number
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' })
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })
  return { date: `${weekday}, ${parts}`, time }
}

export default function FloorPlan({ svgPath, rooms, isAdmin, onAdminRoomSelect }: FloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState<string>('')
  const { selectedDate, selectedRoomId, setSelectedRoomId } = useMapStore()
  const [popup, setPopup] = useState<PopupState | null>(null)

  useEffect(() => {
    fetch(svgPath)
      .then((res) => res.text())
      .then((content) => setSvgContent(content))
      .catch((err) => console.error('Error loading SVG:', err))
  }, [svgPath])

  const handleRoomClick = useCallback((room: RoomAvailability, event: MouseEvent) => {
    const container = containerRef.current
    if (!container) return

    setSelectedRoomId(room.roomId)

    if (isAdmin && onAdminRoomSelect) {
      setPopup(null)
      onAdminRoomSelect(room)
      return
    }

    const rect = container.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (room.isBooked && room.bookings.length > 0) {
      setPopup({
        roomId: room.roomId,
        svgElementId: room.svgElementId,
        bookings: room.bookings,
        x,
        y,
      })
    } else {
      setPopup(null)
      window.location.href = `/room/${room.roomId}?date=${selectedDate}`
    }
  }, [setSelectedRoomId, selectedDate, isAdmin, onAdminRoomSelect])

  useEffect(() => {
    if (!containerRef.current || !svgContent) return

    const container = containerRef.current
    const svgElement = container.querySelector('svg')
    if (!svgElement) return

    const handlers: { el: SVGElement; handler: (e: MouseEvent) => void }[] = []

    rooms.forEach((room) => {
      const roomElement = svgElement.querySelector(`[data-room-id="${room.svgElementId}"]`) as SVGElement | null
      if (!roomElement) return

      // Set colors via style (inline style overrides SVG class CSS)
      if (selectedRoomId === room.roomId) {
        roomElement.style.fill = '#b11a1e'
      } else if (room.isBooked) {
        roomElement.style.fill = '#EF4444'
      } else {
        roomElement.style.fill = '#D1D5DB'
      }

      roomElement.style.cursor = 'pointer'

      const handler = (e: MouseEvent) => handleRoomClick(room, e)
      roomElement.addEventListener('click', handler)
      handlers.push({ el: roomElement, handler })
    })

    return () => {
      handlers.forEach(({ el, handler }) => {
        el.removeEventListener('click', handler)
      })
    }
  }, [svgContent, rooms, selectedRoomId, handleRoomClick])

  // Close popup when clicking outside
  useEffect(() => {
    if (!popup) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.room-popup') && !target.closest('[data-room-id]')) {
        setPopup(null)
        setSelectedRoomId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [popup, setSelectedRoomId])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 overflow-auto relative">
      <div
        ref={containerRef}
        className="min-h-[400px] flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {/* Booking popup */}
      {popup && (
        <div
          className="room-popup absolute z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-72"
          style={{
            left: Math.min(popup.x, (containerRef.current?.offsetWidth || 400) - 300),
            top: popup.y + 10,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-800 text-sm">
              Bookings for {popup.svgElementId.replace('room-', '').toUpperCase()}
            </h4>
            <button
              onClick={() => { setPopup(null); setSelectedRoomId(null) }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {popup.bookings.map((booking, i) => (
              <div key={i} className="p-2.5 bg-red-50 border border-red-100 rounded-lg">
                <p className="font-medium text-slate-800 text-sm">{booking.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">by {booking.userName}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-red-600">
                    {formatDateTime(booking.startTime).date} {formatDateTime(booking.startTime).time} - {formatDateTime(booking.endTime).time}
                  </span>
                </div>
                <span className={`inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded font-medium ${
                  booking.status === 'APPROVED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>

          <a
            href={`/room/${popup.roomId}?date=${selectedDate}`}
            className="mt-3 block text-center text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
          >
            View room details &rarr;
          </a>
        </div>
      )}
    </div>
  )
}
