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
export type ReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type ReportCategory = 'EQUIPMENT_MALFUNCTION' | 'DEVICE_MISSING' | 'FURNITURE_DAMAGE' | 'CLEANLINESS' | 'OTHER'

export interface User {
  id: string
  username: string
  email: string
  password: string
  full_name: string
  phone: string | null
  role: UserRole
  student_class: string | null
  student_id: string | null
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

export interface ApprovalStepMember {
  name: string
  role?: string
}

export interface ApprovalStep {
  order: number
  title: string
  description: string
  type: 'approval' | 'cc'
  members: ApprovalStepMember[]
}

export interface RoomBookingGuide {
  id: string
  room_id: string
  instructions: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  approval_steps: ApprovalStep[]
  document_url: string | null
  document_name: string | null
  created_at: string
  updated_at: string
}

export interface BookingAttachment {
  id: string
  booking_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string | null
  uploaded_by: string
  created_at: string
}

export interface Report {
  id: string
  title: string
  description: string | null
  category: ReportCategory
  status: ReportStatus
  user_id: string
  room_id: string
  resolved_by: string | null
  resolved_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  user?: User
  room?: Room
  resolver?: User
}

// ============================================
// Smart Course Trading types (snake_case DB)
// ============================================

export type TradeListingStatus = 'OPEN' | 'MATCHED' | 'COMPLETED' | 'CANCELLED'
export type TradeMatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
export type TradeCourseType = 'HAVE' | 'WANT'

export interface TradeListing {
  id: string
  user_id: string
  status: TradeListingStatus
  notes: string | null
  created_at: string
  updated_at: string
  user?: User
  courses?: TradeListingCourse[]
}

export interface TradeListingCourse {
  id: string
  listing_id: string
  course_name: string
  course_code: string
  class_code: string | null
  section: string | null
  schedule: string | null
  credits: number | null
  type: TradeCourseType
  created_at: string
}

export interface TradeMatch {
  id: string
  listing_a_id: string
  listing_b_id: string
  initiated_by: string
  status: TradeMatchStatus
  created_at: string
  updated_at: string
  listing_a?: TradeListing
  listing_b?: TradeListing
  initiator?: User
}

export interface TradeMessage {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: User
}
