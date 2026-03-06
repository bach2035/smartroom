'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { getTodayString } from '@/lib/utils'
import Link from 'next/link'
import DatePicker from '@/components/ui/DatePicker'
import AvailabilityTimeline from '@/components/room/AvailabilityTimeline'
import BookingForm from '@/components/room/BookingForm'

interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  isPast?: boolean
  booking: {
    id: string
    title: string
    status: string
    userName: string
  } | null
}

interface RoomBookingClientProps {
  roomId: string
}

export default function RoomBookingClient({ roomId }: RoomBookingClientProps) {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const dateFromUrl = searchParams.get('date')
  const [selectedDate, setSelectedDate] = useState(
    dateFromUrl || getTodayString()
  )
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null)

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/rooms/${roomId}/availability?date=${selectedDate}`)
        if (res.ok) {
          const data = await res.json()
          setSlots(data.slots)
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
    setSelectedStart(null)
    setSelectedEnd(null)
  }, [roomId, selectedDate])

  const handleSlotClick = (startTime: string, endTime: string) => {
    if (!selectedStart) {
      setSelectedStart(startTime)
      setSelectedEnd(endTime)
    } else if (selectedStart === startTime) {
      // Deselect
      setSelectedStart(null)
      setSelectedEnd(null)
    } else {
      // Extend selection
      const start = new Date(startTime)
      const currentStart = new Date(selectedStart)
      const currentEnd = new Date(selectedEnd!)

      if (start < currentStart) {
        // Extending backwards - check if all slots in between are available
        const slotsBetween = slots.filter((s) => {
          const slotStart = new Date(s.startTime)
          return slotStart >= start && slotStart < currentStart
        })
        if (slotsBetween.every((s) => s.isAvailable)) {
          setSelectedStart(startTime)
        }
      } else if (start >= currentEnd) {
        // Extending forwards - check if all slots in between are available
        const slotsBetween = slots.filter((s) => {
          const slotStart = new Date(s.startTime)
          return slotStart >= currentEnd && slotStart <= start
        })
        if (slotsBetween.every((s) => s.isAvailable)) {
          setSelectedEnd(endTime)
        }
      }
    }
  }

  const today = getTodayString()

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Book This Room</h2>

      {status === 'loading' ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !session ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Please sign in to book this room.</p>
          <Link
            href="/login"
            className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800"
          >
            Sign In
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={setSelectedDate}
            min={today}
            className="max-w-xs"
          />

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Availability on {(() => {
                const d = new Date(selectedDate + 'T12:00:00+07:00')
                const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' })
                const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d)
                return `${weekday}, ${parts}`
              })()}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Click on available slots to select your booking time. Click multiple consecutive slots to extend your booking.
                </p>
                <AvailabilityTimeline
                  slots={slots}
                  selectedStart={selectedStart}
                  selectedEnd={selectedEnd}
                  onSlotClick={handleSlotClick}
                />
              </>
            )}
          </div>

          <BookingForm
            roomId={roomId}
            selectedDate={selectedDate}
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
          />
        </div>
      )}
    </div>
  )
}
