'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useMapStore } from '@/store/mapStore'
import FloorPlan from '@/components/map/FloorPlan'
import AdminRoomPanel from '@/components/map/AdminRoomPanel'

interface Room {
  id: string
  name: string
  roomNumber: string
  capacity: number
  svgElementId: string
}

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

interface SelectedAdminRoom {
  roomId: string
  name: string
  roomNumber: string
  capacity: number
  bookings: RoomBooking[]
}

interface FloorPlanWrapperProps {
  floorId: string
  svgPath: string
  rooms: Room[]
}

export default function FloorPlanWrapper({ floorId, svgPath, rooms }: FloorPlanWrapperProps) {
  const { data: session } = useSession()
  const { selectedDate, startTime, endTime } = useMapStore()
  const [availability, setAvailability] = useState<RoomAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAdminRoom, setSelectedAdminRoom] = useState<SelectedAdminRoom | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const isAdmin = session?.user?.role === 'ADMIN'

  const fetchAvailability = useCallback(async () => {
    try {
      const rangeStart = new Date(`${selectedDate}T${startTime}:00+07:00`).toISOString()
      const rangeEnd = new Date(`${selectedDate}T${endTime}:00+07:00`).toISOString()
      const res = await fetch(
        `/api/floors/${floorId}?rangeStart=${encodeURIComponent(rangeStart)}&rangeEnd=${encodeURIComponent(rangeEnd)}`
      )
      if (res.ok) {
        const data = await res.json()
        const newAvailability: RoomAvailability[] = data.rooms.map((r: { id: string; svgElementId: string; isBooked: boolean; bookings: RoomBooking[] }) => ({
          roomId: r.id,
          svgElementId: r.svgElementId,
          isBooked: r.isBooked,
          bookings: r.bookings || [],
        }))
        setAvailability(newAvailability)

        // If admin panel is open, sync its bookings with fresh data
        if (selectedAdminRoom) {
          const updatedRoom = newAvailability.find((a) => a.roomId === selectedAdminRoom.roomId)
          if (updatedRoom) {
            setSelectedAdminRoom((prev) => prev ? { ...prev, bookings: updatedRoom.bookings } : null)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    }
  }, [floorId, selectedDate, startTime, endTime, selectedAdminRoom])

  useEffect(() => {
    setLoading(true)
    fetchAvailability().finally(() => setLoading(false))
  }, [floorId, selectedDate, startTime, endTime, rooms])

  // Re-fetch when refreshKey changes (after admin action)
  useEffect(() => {
    if (refreshKey > 0) {
      fetchAvailability()
    }
  }, [refreshKey])

  const handleAdminRoomSelect = useCallback((room: RoomAvailability) => {
    const roomInfo = rooms.find((r) => r.id === room.roomId)
    if (!roomInfo) return
    setSelectedAdminRoom({
      roomId: room.roomId,
      name: roomInfo.name,
      roomNumber: roomInfo.roomNumber,
      capacity: roomInfo.capacity,
      bookings: room.bookings,
    })
  }, [rooms])

  const handleBookingAction = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleCloseAdminPanel = useCallback(() => {
    setSelectedAdminRoom(null)
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <FloorPlan
          svgPath={svgPath}
          rooms={availability}
          isAdmin={isAdmin}
          onAdminRoomSelect={isAdmin ? handleAdminRoomSelect : undefined}
        />
      </div>

      {/* Right sidebar: Admin panel or room list */}
      {isAdmin && selectedAdminRoom ? (
        <AdminRoomPanel
          roomId={selectedAdminRoom.roomId}
          roomName={selectedAdminRoom.name}
          roomNumber={selectedAdminRoom.roomNumber}
          capacity={selectedAdminRoom.capacity}
          bookings={selectedAdminRoom.bookings}
          onClose={handleCloseAdminPanel}
          onBookingAction={handleBookingAction}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Rooms on this floor</h3>
          <div className="space-y-2">
            {rooms.map((room) => {
              const roomAvail = availability.find((a) => a.roomId === room.id)
              return (
                <a
                  key={room.id}
                  href={`/room/${room.id}?date=${selectedDate}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
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
      )}
    </div>
  )
}
