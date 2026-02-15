'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import RoomGuideEditor from '@/components/admin/RoomGuideEditor'

interface Room {
  id: string
  name: string
  roomNumber: string
  capacity: number
  description: string | null
  isActive: boolean
  floor: string
  building: string
  bookingCount: number
}

export default function RoomTable() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [guideRoomId, setGuideRoomId] = useState('')
  const [guideRoomName, setGuideRoomName] = useState('')
  const [editForm, setEditForm] = useState({
    name: '',
    roomNumber: '',
    capacity: 0,
    description: '',
    isActive: true,
  })

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/admin/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (room: Room) => {
    setSelectedRoom(room)
    setEditForm({
      name: room.name,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      description: room.description || '',
      isActive: room.isActive,
    })
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!selectedRoom) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/rooms/${selectedRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (res.ok) {
        setRooms(
          rooms.map((r) =>
            r.id === selectedRoom.id
              ? { ...r, ...editForm }
              : r
          )
        )
        setShowEditModal(false)
        setSelectedRoom(null)
      }
    } catch (error) {
      console.error('Error updating room:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (room: Room) => {
    try {
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...room, isActive: !room.isActive }),
      })

      if (res.ok) {
        setRooms(
          rooms.map((r) =>
            r.id === room.id ? { ...r, isActive: !r.isActive } : r
          )
        )
      }
    } catch (error) {
      console.error('Error toggling room:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {room.roomNumber}
                    </div>
                    <div className="text-xs text-gray-500">{room.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {room.building} - {room.floor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {room.capacity} seats
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {room.bookingCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={room.isActive ? 'success' : 'default'}>
                      {room.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(room)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGuideRoomId(room.id)
                          setGuideRoomName(`${room.roomNumber} - ${room.name}`)
                          setShowGuideModal(true)
                        }}
                      >
                        Guide
                      </Button>
                      <Button
                        variant={room.isActive ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleActive(room)}
                      >
                        {room.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedRoom(null)
        }}
        title="Edit Room"
        size="md"
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Room Name"
            value={editForm.name}
            onChange={(e) =>
              setEditForm({ ...editForm, name: e.target.value })
            }
          />
          <Input
            id="roomNumber"
            label="Room Number"
            value={editForm.roomNumber}
            onChange={(e) =>
              setEditForm({ ...editForm, roomNumber: e.target.value })
            }
          />
          <Input
            id="capacity"
            label="Capacity"
            type="number"
            value={editForm.capacity.toString()}
            onChange={(e) =>
              setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 0 })
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editForm.isActive}
              onChange={(e) =>
                setEditForm({ ...editForm, isActive: e.target.checked })
              }
              className="h-4 w-4 text-red-700 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false)
              setSelectedRoom(null)
            }}
          >
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </Modal>

      <RoomGuideEditor
        isOpen={showGuideModal}
        onClose={() => {
          setShowGuideModal(false)
          setGuideRoomId('')
          setGuideRoomName('')
        }}
        roomId={guideRoomId}
        roomName={guideRoomName}
      />
    </>
  )
}
