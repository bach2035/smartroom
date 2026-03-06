'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  imageUrl: string | null
  imagePosition: string | null
  isActive: boolean
  floor: string
  building: string
  bookingCount: number
}

function parsePosition(pos: string | null): number {
  if (!pos) return 50
  const match = pos.match(/(\d+)%\s*$/)
  return match ? parseInt(match[1]) : 50
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
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imagePosition, setImagePosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [savingPosition, setSavingPosition] = useState(false)
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
    setImagePreview(room.imageUrl)
    setImagePosition(parsePosition(room.imagePosition))
    setShowEditModal(true)
  }

  const handleImageUpload = async (file: File) => {
    if (!selectedRoom) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/admin/rooms/${selectedRoom.id}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to upload image')
        return
      }

      const { imageUrl } = await res.json()
      setImagePreview(imageUrl)
      setRooms(rooms.map((r) =>
        r.id === selectedRoom.id ? { ...r, imageUrl } : r
      ))
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageRemove = async () => {
    if (!selectedRoom) return

    setUploadingImage(true)
    try {
      const res = await fetch(`/api/admin/rooms/${selectedRoom.id}/image`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setImagePreview(null)
        setRooms(rooms.map((r) =>
          r.id === selectedRoom.id ? { ...r, imageUrl: null } : r
        ))
      }
    } catch (error) {
      console.error('Error removing image:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const dragRef = useRef<{ startY: number; startPos: number } | null>(null)

  const handleDragStart = useCallback((clientY: number) => {
    dragRef.current = { startY: clientY, startPos: imagePosition }
    setIsDragging(true)
  }, [imagePosition])

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragRef.current) return
    const delta = dragRef.current.startY - clientY
    const newPos = Math.min(100, Math.max(0, dragRef.current.startPos + delta * 0.5))
    setImagePosition(newPos)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragRef.current = null
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientY)
    const onEnd = () => handleDragEnd()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const saveImagePosition = async () => {
    if (!selectedRoom) return
    setSavingPosition(true)
    try {
      const res = await fetch(`/api/admin/rooms/${selectedRoom.id}/image`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: `center ${Math.round(imagePosition)}%` }),
      })
      if (res.ok) {
        const posValue = `center ${Math.round(imagePosition)}%`
        setRooms(rooms.map((r) =>
          r.id === selectedRoom.id ? { ...r, imagePosition: posValue } : r
        ))
      }
    } catch (error) {
      console.error('Error saving position:', error)
    } finally {
      setSavingPosition(false)
    }
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Image
            </label>
            {imagePreview ? (
              <div className="space-y-2">
                <div
                  className="relative h-36 rounded-lg overflow-hidden bg-slate-100 select-none"
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientY) }}
                  onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
                >
                  <img
                    src={imagePreview}
                    alt="Room preview"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{ objectPosition: `center ${Math.round(imagePosition)}%` }}
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-3 text-xs text-white/80 pointer-events-none">
                    Drag to reposition
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); saveImagePosition() }}
                      disabled={savingPosition}
                      className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                      title="Save position"
                    >
                      {savingPosition ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleImageRemove() }}
                      disabled={uploadingImage}
                      className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 transition-colors">
                {uploadingImage ? (
                  <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">Click to upload image</span>
                    <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (max 5MB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
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
