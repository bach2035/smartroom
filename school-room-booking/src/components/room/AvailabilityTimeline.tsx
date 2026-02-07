'use client'

interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  booking: {
    id: string
    title: string
    status: string
    userName: string
  } | null
}

interface AvailabilityTimelineProps {
  slots: TimeSlot[]
  selectedStart: string | null
  selectedEnd: string | null
  onSlotClick: (startTime: string, endTime: string) => void
}

export default function AvailabilityTimeline({
  slots,
  selectedStart,
  selectedEnd,
  onSlotClick,
}: AvailabilityTimelineProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const isSelected = (slot: TimeSlot) => {
    if (!selectedStart || !selectedEnd) return false
    const slotStart = new Date(slot.startTime)
    const selStart = new Date(selectedStart)
    const selEnd = new Date(selectedEnd)
    return slotStart >= selStart && slotStart < selEnd
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-6 gap-1">
        {slots.map((slot, index) => {
          const selected = isSelected(slot)
          return (
            <button
              key={index}
              onClick={() => slot.isAvailable && onSlotClick(slot.startTime, slot.endTime)}
              disabled={!slot.isAvailable}
              className={`
                p-2 text-xs rounded transition-colors
                ${
                  selected
                    ? 'bg-blue-500 text-white'
                    : slot.isAvailable
                    ? 'bg-green-100 hover:bg-green-200 text-green-700'
                    : 'bg-red-100 text-red-700 cursor-not-allowed'
                }
              `}
              title={
                slot.booking
                  ? `${slot.booking.title} - ${slot.booking.userName}`
                  : 'Available'
              }
            >
              {formatTime(slot.startTime)}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>7:00</span>
        <span>12:00</span>
        <span>17:00</span>
        <span>22:00</span>
      </div>
    </div>
  )
}
