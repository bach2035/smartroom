import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    if (booking.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Cannot cancel a rejected booking' },
        { status: 400 }
      )
    }

    if (new Date(booking.start_time) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot cancel a past booking' },
        { status: 400 }
      )
    }

    const { data: updatedBooking, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Notify admins of cancellation
    Promise.all([
      supabaseAdmin.from('users').select('id').eq('role', 'ADMIN'),
      supabaseAdmin.from('rooms').select('name, room_number').eq('id', booking.room_id).single(),
    ]).then(([{ data: admins }, { data: room }]) => {
      if (admins && room) {
        for (const admin of admins) {
          createNotification({
            userId: admin.id,
            type: 'BOOKING_CANCELLED',
            title: 'Booking cancelled',
            message: `${session.user.name || 'A student'} cancelled their booking "${booking.title}" for ${room.name} (${room.room_number}).`,
            link: `/admin`,
          })
        }
      }
    })

    return NextResponse.json({
      message: 'Booking cancelled',
      booking: updatedBooking,
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
