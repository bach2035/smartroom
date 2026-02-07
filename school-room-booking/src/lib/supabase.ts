import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser (limited access)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Types for database
export type UserRole = 'STUDENT' | 'ADMIN'
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface User {
  id: string
  username: string
  email: string
  password: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Building {
  id: string
  name: string
  description: string | null
  svg_path: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Floor {
  id: string
  name: string
  level: number
  svg_path: string
  building_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  building?: Building
  rooms?: Room[]
}

export interface Room {
  id: string
  name: string
  room_number: string
  capacity: number
  description: string | null
  svg_element_id: string
  floor_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  floor?: Floor
  equipment?: RoomEquipment[]
}

export interface Equipment {
  id: string
  name: string
  icon: string | null
  created_at: string
  updated_at: string
}

export interface RoomEquipment {
  id: string
  room_id: string
  equipment_id: string
  quantity: number
  created_at: string
  equipment?: Equipment
}

export interface Booking {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  status: BookingStatus
  user_id: string
  room_id: string
  approved_by: string | null
  approved_at: string | null
  reject_reason: string | null
  created_at: string
  updated_at: string
  user?: User
  room?: Room
  approver?: User
}
