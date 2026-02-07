export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type UserRole = 'STUDENT' | 'ADMIN'

export interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: UserRole
}

export interface Building {
  id: string
  name: string
  description: string | null
  floorCount: number
}

export interface Floor {
  id: string
  name: string
  level: number
  svgPath: string
  buildingId: string
  roomCount?: number
}

export interface Room {
  id: string
  name: string
  roomNumber: string
  capacity: number
  description: string | null
  svgElementId: string
  floorId: string
  isActive: boolean
  equipment?: RoomEquipment[]
}

export interface Equipment {
  id: string
  name: string
  icon: string | null
}

export interface RoomEquipment {
  id: string
  name: string
  icon: string | null
  quantity: number
}

export interface Booking {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: BookingStatus
  userId: string
  roomId: string
  rejectReason: string | null
  createdAt: string
}

export interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  booking: {
    id: string
    title: string
    status: BookingStatus
    userName: string
  } | null
}

export interface RoomAvailability {
  roomId: string
  isBooked: boolean
}
