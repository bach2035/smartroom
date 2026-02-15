'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface Building {
  id: string
  name: string
  description: string | null
  floorCount: number
}

interface FloorSummary {
  id: string
  name: string
  level: number
  roomCount: number
}

interface Room {
  id: string
  name: string
  roomNumber: string
  capacity: number
}

const categoryOptions = [
  { value: 'EQUIPMENT_MALFUNCTION', label: 'Equipment Malfunction' },
  { value: 'DEVICE_MISSING', label: 'Device Missing' },
  { value: 'FURNITURE_DAMAGE', label: 'Furniture Damage' },
  { value: 'CLEANLINESS', label: 'Cleanliness' },
  { value: 'OTHER', label: 'Other' },
]

export default function ReportNewClient() {
  const router = useRouter()

  // Step 1: Room selection state
  const [buildings, setBuildings] = useState<Building[]>([])
  const [floors, setFloors] = useState<FloorSummary[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string; roomNumber: string } | null>(null)
  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const [loadingFloors, setLoadingFloors] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(false)

  // Step 2: Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBuildings()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      fetchFloors(selectedBuilding)
    } else {
      setFloors([])
      setSelectedFloor(null)
      setRooms([])
    }
  }, [selectedBuilding])

  useEffect(() => {
    if (selectedFloor) {
      fetchRooms(selectedFloor)
    } else {
      setRooms([])
    }
  }, [selectedFloor])

  const fetchBuildings = async () => {
    try {
      const res = await fetch('/api/buildings')
      if (res.ok) {
        const data = await res.json()
        setBuildings(data)
      }
    } catch (err) {
      console.error('Error fetching buildings:', err)
    } finally {
      setLoadingBuildings(false)
    }
  }

  const fetchFloors = async (buildingId: string) => {
    setLoadingFloors(true)
    try {
      const res = await fetch(`/api/buildings/${buildingId}/floors`)
      if (res.ok) {
        const data = await res.json()
        setFloors(data.floors || [])
      }
    } catch (err) {
      console.error('Error fetching floors:', err)
    } finally {
      setLoadingFloors(false)
    }
  }

  const fetchRooms = async (floorId: string) => {
    setLoadingRooms(true)
    try {
      const res = await fetch(`/api/floors/${floorId}`)
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms || [])
      }
    } catch (err) {
      console.error('Error fetching rooms:', err)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom({ id: room.id, name: room.name, roomNumber: room.roomNumber })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoom || !title || !category) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          title,
          description: description || null,
          category,
        }),
      })

      if (res.ok) {
        router.push('/reports')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit report')
      }
    } catch {
      setError('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  // Step 1: Room Selection
  if (!selectedRoom) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Select a Room</h2>
          <p className="text-sm text-slate-500 mb-6">Choose the room where the issue was found.</p>

          {loadingBuildings ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Building selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Building</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {buildings.map((building) => (
                    <button
                      key={building.id}
                      onClick={() => {
                        setSelectedBuilding(building.id)
                        setSelectedFloor(null)
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedBuilding === building.id
                          ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedBuilding === building.id ? 'bg-red-100' : 'bg-slate-100'
                        }`}>
                          <svg className={`w-5 h-5 ${selectedBuilding === building.id ? 'text-red-700' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{building.name}</p>
                          <p className="text-xs text-slate-500">{building.floorCount} floor{building.floorCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Floor selection */}
              {selectedBuilding && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Floor</label>
                  {loadingFloors ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {floors.map((floor) => (
                        <button
                          key={floor.id}
                          onClick={() => setSelectedFloor(floor.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedFloor === floor.id
                              ? 'bg-red-700 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {floor.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Room selection */}
              {selectedFloor && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Room</label>
                  {loadingRooms ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : rooms.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => handleRoomSelect(room)}
                          className="p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 text-left transition-all"
                        >
                          <p className="font-medium text-slate-800">{room.name}</p>
                          <p className="text-xs text-slate-500">Room {room.roomNumber} · Capacity: {room.capacity}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No rooms on this floor.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Step 2: Report Form
  return (
    <div className="space-y-6">
      {/* Selected room info */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-red-900">{selectedRoom.name}</p>
            <p className="text-xs text-red-700">Room {selectedRoom.roomNumber}</p>
          </div>
        </div>
        <button
          onClick={() => setSelectedRoom(null)}
          className="text-sm font-medium text-red-700 hover:text-red-900 transition-colors"
        >
          Change Room
        </button>
      </div>

      {/* Report form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
          >
            <option value="">Select a category</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Brief summary of the issue"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Provide more details about the issue..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/reports')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={!title || !category}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </div>
  )
}
