'use client'

import { useEffect, useState } from 'react'
import { useMapStore } from '@/store/mapStore'
import FloorPlan from '@/components/map/FloorPlan'

interface Room {
  id: string
  name: string
  roomNumber: string
  capacity: number
  svgElementId: string
}

interface FloorPlanWrapperProps {
  floorId: string
  svgPath: string
  rooms: Room[]
}

export default function FloorPlanWrapper({ floorId, svgPath, rooms }: FloorPlanWrapperProps) {
  const { selectedDate, startTime, endTime } = useMapStore()
  const [availability, setAvailability] = useState<{ roomId: string; isBooked: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/floors/${floorId}?date=${selectedDate}&startTime=${startTime}&endTime=${endTime}`
        )
        if (res.ok) {
          const data = await res.json()
          setAvailability(
            data.rooms.map((r: { id: string; isBooked: boolean }) => ({
              roomId: r.id,
              isBooked: r.isBooked,
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [floorId, selectedDate, startTime, endTime])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <FloorPlan svgPath={svgPath} rooms={availability} />
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Rooms on this floor</h3>
        <div className="space-y-2">
          {rooms.map((room) => {
            const roomAvail = availability.find((a) => a.roomId === room.id)
            return (
              <a
                key={room.id}
                href={`/room/${room.id}`}
                className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{room.roomNumber}</p>
                    <p className="text-sm text-gray-500">{room.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{room.capacity} seats</span>
                    <span
                      className={`w-3 h-3 rounded-full ${
                        roomAvail?.isBooked ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    />
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
