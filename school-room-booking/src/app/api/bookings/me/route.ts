import { NextResponse } from 'next/server'
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
  room: {
    name: string
    room_number: string
    floor: {
      name: string
      building: { name: string }
    }
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bookings, error } = await supabaseAdmin
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
        room:rooms(
          name,
          room_number,
          floor:floors(
            name,
            building:buildings(name)
          )
        )
      `)
      .eq('user_id', session.user.id)
      .order('start_time', { ascending: false })

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
        room: {
          name: booking.room?.name,
          roomNumber: booking.room?.room_number,
          floor: booking.room?.floor?.name,
          building: booking.room?.floor?.building?.name,
        },
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
