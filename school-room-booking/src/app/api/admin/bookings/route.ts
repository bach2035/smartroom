import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface BookingData {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  status: string
  reject_reason: string | null
  created_at: string
  user: { id: string; full_name: string; username: string }
  room: {
    name: string
    room_number: string
    floor: {
      name: string
      building: { name: string }
    }
  }
  approver: { full_name: string } | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        status,
        reject_reason,
        created_at,
        user:users!bookings_user_id_fkey(id, full_name, username),
        room:rooms(
          name,
          room_number,
          floor:floors(
            name,
            building:buildings(name)
          )
        ),
        approver:users!bookings_approved_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query

    if (error) throw error

    const typedBookings = bookings as unknown as BookingData[]

    return NextResponse.json(
      typedBookings.map((booking) => ({
        id: booking.id,
        title: booking.title,
        description: booking.description,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status,
        rejectReason: booking.reject_reason,
        createdAt: booking.created_at,
        user: {
          id: booking.user?.id,
          fullName: booking.user?.full_name,
          username: booking.user?.username,
        },
        room: {
          name: booking.room?.name,
          roomNumber: booking.room?.room_number,
          floor: booking.room?.floor?.name,
          building: booking.room?.floor?.building?.name,
        },
        approver: booking.approver?.full_name || null,
      }))
    )
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
