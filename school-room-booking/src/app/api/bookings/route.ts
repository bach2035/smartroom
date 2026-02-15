import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendBookingRequestEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, title, description, startTime, endTime } = await request.json()

    if (!roomId || !title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: 'Cannot book in the past' },
        { status: 400 }
      )
    }

    // Check if room exists
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .eq('is_active', true)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check for conflicts
    const { data: conflicts } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('room_id', roomId)
      .eq('status', 'APPROVED')
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString())

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      )
    }

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        room_id: roomId,
        user_id: session.user.id,
        title,
        description,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      .select(`
        id,
        title,
        start_time,
        end_time,
        status,
        room:rooms(name, room_number)
      `)
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Fire-and-forget: notify admins of new booking request
    const roomData = booking.room as unknown as { name: string; room_number: string }
    supabaseAdmin
      .from('users')
      .select('email')
      .eq('role', 'ADMIN')
      .then(({ data: admins }) => {
        if (admins && admins.length > 0) {
          sendBookingRequestEmail(
            admins.map((a) => a.email),
            {
              bookingTitle: booking.title,
              roomName: roomData.name,
              roomNumber: roomData.room_number,
              startTime: booking.start_time,
              endTime: booking.end_time,
              studentName: session.user.name || session.user.username || 'Unknown',
            }
          )
        }
      })

    return NextResponse.json(
      {
        message: 'Booking request submitted',
        booking: {
          id: booking.id,
          title: booking.title,
          startTime: booking.start_time,
          endTime: booking.end_time,
          status: booking.status,
          room: booking.room,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
